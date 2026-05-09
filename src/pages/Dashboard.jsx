import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import GCSScoreCard from '@/components/dashboard/GCSScoreCard';
import StreakTracker from '@/components/dashboard/StreakTracker';
import VirtualTree from '@/components/dashboard/VirtualTree';
import QuickStats from '@/components/dashboard/QuickStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: transactions } = useQuery({
    queryKey: ['recentTransactions', user?.email],
    queryFn: () => base44.entities.Transaction.list('-created_date', 10),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles?.[0] || {
    total_gcs: 0,
    available_gcs: 0,
    tier: 'seed',
    current_streak: 0,
    longest_streak: 0,
    trees_planted: 0,
    tree_progress: 0,
    daily_points_today: 0,
    weekly_points: 0,
    total_co2_saved_kg: 0,
    total_transactions: 0,
  };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-xs text-muted-foreground">Welcome back</p>
        <h1 className="text-xl font-heading font-bold">{user?.full_name || 'Green Pioneer'} 🌿</h1>
      </motion.div>

      {/* GCS Score */}
      <GCSScoreCard profile={profile} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <QuickStats profile={profile} />

      {/* Streak + Tree side by side on larger screens, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StreakTracker profile={profile} />
        <VirtualTree profile={profile} />
      </div>

      {/* Recent Activity */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
}