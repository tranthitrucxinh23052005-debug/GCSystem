import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatGCS, formatVND, GCS_TO_VND } from '@/lib/gcsEngine';
import RewardCard from '@/components/marketplace/RewardCard';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { LOYALTY_PARTNERS } from '@/lib/blockchainMock';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'telecom', label: '📱 Telecom' },
  { value: 'ecommerce', label: '🛒 Shopping' },
  { value: 'fnb', label: '🍜 F&B' },
  { value: 'green_gifts', label: '🌿 Green' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'entertainment', label: '🎬 Fun' },
  { value: 'education', label: '📚 Edu' },
  { value: 'charity', label: '💚 Charity' },
];

export default function Marketplace() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [confirmReward, setConfirmReward] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: rewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list('-is_featured', 50),
    initialData: [],
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles?.[0];
  const filtered = activeCategory === 'all' ? rewards : rewards.filter(r => r.category === activeCategory);

  const handleRedeem = async (reward) => {
    setIsRedeeming(true);
    
    const voucherCode = `GCS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    await base44.entities.Redemption.create({
      reward_id: reward.id,
      reward_name: reward.name,
      gcs_spent: reward.gcs_cost,
      status: 'active',
      voucher_code: voucherCode,
    });

    if (profile) {
      await base44.entities.UserProfile.update(profile.id, {
        available_gcs: (profile.available_gcs || 0) - reward.gcs_cost,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setIsRedeeming(false);
    setConfirmReward(null);
    toast.success(`Redeemed ${reward.name}! Code: ${voucherCode}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold">Marketplace 🎁</h1>
        <p className="text-xs text-muted-foreground">Redeem your GCS for real rewards</p>
      </div>

      {/* Available Balance */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Available Balance</p>
          <p className="font-heading font-bold text-lg text-primary">{formatGCS(profile?.available_gcs || 0)} GCS</p>
        </div>
        <p className="text-xs text-muted-foreground">≈ {formatVND((profile?.available_gcs || 0) * GCS_TO_VND)}</p>
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-1">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.value)}
              className="h-7 text-[10px] rounded-full px-3"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <p className="text-sm">No rewards available yet</p>
            <p className="text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          filtered.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userTier={profile?.tier || 'seed'}
              availableGCS={profile?.available_gcs || 0}
              onRedeem={setConfirmReward}
            />
          ))
        )}
      </div>

      {/* Loyalty Conversion Section */}
      <div className="pt-2">
        <h2 className="text-sm font-semibold mb-1">Liên thông Loyalty 🔗</h2>
        <p className="text-[10px] text-muted-foreground mb-3">Chuyển đổi GCS sang điểm các chương trình khác</p>
        <div className="grid grid-cols-2 gap-3">
          {LOYALTY_PARTNERS.map(partner => {
            const canConvert = (profile?.available_gcs || 0) >= partner.minGCS;
            return (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3.5 ${canConvert ? 'bg-card border-border/60' : 'bg-muted/30 border-border/30 opacity-60'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{partner.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{partner.name}</p>
                  </div>
                </div>
                <p className={`text-[10px] font-medium mb-1 px-2 py-0.5 rounded-full w-fit ${partner.color}`}>
                  {partner.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Tối thiểu {partner.minGCS} GCS</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canConvert}
                  className="w-full h-7 text-[10px] rounded-lg mt-2 gap-1"
                  onClick={() => toast.info(`Tính năng chuyển đổi sang ${partner.name} sẽ sớm ra mắt!`)}
                >
                  Chuyển đổi <ArrowRight className="w-3 h-3" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Redemption</DialogTitle>
            <DialogDescription className="text-xs">
              Redeem <strong>{confirmReward?.name}</strong> for <strong>{confirmReward?.gcs_cost} GCS</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmReward(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => handleRedeem(confirmReward)}
              disabled={isRedeeming}
              className="flex-1 gap-1"
            >
              {isRedeeming ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><CheckCircle className="w-3.5 h-3.5" /> Confirm</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}