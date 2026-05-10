import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart2, Shield, ChevronRight, BookOpen } from 'lucide-react';

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

      {/* Quick Links: Stats & Blockchain */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link to="/stats">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Thống kê</p>
              <p className="text-[9px] text-muted-foreground">Charts & dự báo</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        </Link>
        <Link to="/blockchain">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Blockchain</p>
              <p className="text-[9px] text-muted-foreground">Xác minh GCS</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        </Link>
      </div>

      {/* Onboarding Link */}
      <Link to="/onboarding">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all">
          <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 font-medium flex-1">Xem hướng dẫn GCS MiniApp</p>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </Link>
    </div>
  );
}