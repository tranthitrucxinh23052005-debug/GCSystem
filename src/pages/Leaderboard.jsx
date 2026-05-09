import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getTierFromPoints, formatGCS } from '@/lib/gcsEngine';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const podiumConfig = [
  { rank: 2, height: 'h-20', bg: 'bg-slate-300', icon: Medal, color: 'text-slate-600' },
  { rank: 1, height: 'h-28', bg: 'bg-amber-400', icon: Crown, color: 'text-amber-700' },
  { rank: 3, height: 'h-16', bg: 'bg-amber-700/60', icon: Medal, color: 'text-amber-800' },
];

export default function Leaderboard() {
  const [currentEmail, setCurrentEmail] = useState(null);
  
  useEffect(() => { base44.auth.me().then(u => setCurrentEmail(u.email)).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.UserProfile.list('-total_gcs', 20),
    initialData: [],
  });

  const topThree = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3 
    ? [topThree[1], topThree[0], topThree[2]] 
    : topThree;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold">Leaderboard 🏆</h1>
        <p className="text-xs text-muted-foreground">Top green pioneers this month</p>
      </div>

      {/* Podium */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-6 pb-2">
          {podiumOrder.map((profile, i) => {
            const config = podiumConfig[i] || podiumConfig[2];
            const tier = getTierFromPoints(profile?.total_gcs || 0);
            const Icon = config.icon;
            return (
              <motion.div
                key={profile?.id || i}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
                    <span className="text-lg">{tier.emoji}</span>
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center`}>
                    <span className="text-[9px] font-bold text-white">{config.rank}</span>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-center truncate w-20">
                  {profile?.user_email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] font-bold text-primary">{formatGCS(profile?.total_gcs || 0)}</p>
                <div className={`${config.height} w-20 ${config.bg} rounded-t-lg mt-2 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of the list */}
      <div className="space-y-2">
        {rest.map((profile, i) => {
          const tier = getTierFromPoints(profile?.total_gcs || 0);
          const isMe = profile.user_email === currentEmail;
          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isMe ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/40'
              }`}
            >
              <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{i + 4}</span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm">{tier.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile.user_email?.split('@')[0] || 'User'}
                  {isMe && <span className="text-[9px] ml-1 text-primary font-bold">(You)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">{tier.label} • {profile.total_transactions || 0} txns</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatGCS(profile.total_gcs || 0)}</p>
                <p className="text-[9px] text-muted-foreground">GCS</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm">No rankings yet</p>
          <p className="text-xs mt-1">Start earning GCS to appear here!</p>
        </div>
      )}
    </div>
  );
}