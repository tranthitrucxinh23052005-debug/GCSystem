import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getTierFromPoints, getTierProgress, formatGCS, TIERS } from '@/lib/gcsEngine';
import { User, Award, TreePine, LogOut, ChevronRight, Leaf, Wind, Gift, CheckCircle2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const tierColors = {
  seed: 'from-emerald-400 to-emerald-600',
  sprout: 'from-green-400 to-green-600',
  tree: 'from-green-500 to-green-700',
  forest: 'from-emerald-600 to-emerald-800',
  legacy: 'from-amber-400 to-amber-600',
};

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: redemptions } = useQuery({
    queryKey: ['myRedemptions'],
    queryFn: () => base44.entities.Redemption.list('-created_date', 20),
    initialData: [],
  });

  const profile = profiles?.[0] || {};
  const tier = getTierFromPoints(profile.total_gcs || 0);
  const tierProgress = getTierProgress(profile.total_gcs || 0);

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-to-br ${tierColors[tier.key] || tierColors.seed} p-6 text-white`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            {tier.emoji}
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{user?.full_name || 'Green Pioneer'}</h2>
            <p className="text-xs text-white/70">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1 bg-white/15 px-2 py-0.5 rounded-full w-fit">
              <Award className="w-3 h-3" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tier.label} Tier</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier Progression */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Tier Progress
        </h3>
        <div className="flex items-center justify-between gap-2">
          {Object.entries(TIERS).map(([key, t], i) => {
            const isActive = key === tier.key;
            const isPast = Object.keys(TIERS).indexOf(key) < Object.keys(TIERS).indexOf(tier.key);
            return (
              <div key={key} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  isActive ? 'bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/30' :
                  isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {t.emoji}
                </div>
                <span className={`text-[8px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
        {tierProgress.nextTier && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress.progress}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {formatGCS(tierProgress.pointsToNext)} GCS to {tierProgress.nextTier.label}
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total GCS', value: formatGCS(profile.total_gcs || 0), icon: Leaf },
          { label: 'Trees', value: profile.trees_planted || 0, icon: TreePine },
          { label: 'CO₂ Saved', value: `${profile.total_co2_saved_kg || 0}kg`, icon: Wind },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-xl bg-card border border-border/60 p-3 text-center"
          >
            <stat.icon className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="font-heading font-bold text-sm">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* My Redemptions */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" /> My Vouchers
        </h3>
        {redemptions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No vouchers yet</p>
        ) : (
          <div className="space-y-2">
            {redemptions.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs font-medium">{r.reward_name}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{r.voucher_code}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  r.status === 'active' ? 'bg-primary/10 text-primary' :
                  r.status === 'used' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier Perks */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" /> Đặc quyền bậc {tier.label}
        </h3>
        <div className="space-y-1.5">
          {(tier.perks || []).map((perk, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[8px] text-primary font-bold">✓</span>
              </div>
              <p className="text-xs text-foreground">{perk}</p>
            </div>
          ))}
        </div>
        {Object.entries(TIERS).filter(([k]) => k !== tier.key).length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/40">
            Lên bậc tiếp để mở thêm đặc quyền tài chính 🚀
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/stats">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <span className="text-xs font-medium">Thống kê</span>
          </div>
        </Link>
        <Link to="/blockchain">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium">Blockchain</span>
          </div>
        </Link>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full rounded-xl h-11 text-destructive hover:text-destructive gap-2"
        onClick={() => base44.auth.logout()}
      >
        <LogOut className="w-4 h-4" /> Đăng xuất
      </Button>
    </div>
  );
}