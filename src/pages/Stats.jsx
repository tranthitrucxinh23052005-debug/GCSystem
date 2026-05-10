import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatGCS, formatVND, GCS_TO_VND, getTierFromPoints, TIERS } from '@/lib/gcsEngine';
import { TrendingUp, TrendingDown, Minus, Flame, Calendar, Zap, Target } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

const typeLabels = {
  qr_payment: 'QR Pay', bill_pay: 'Bill Pay', transfer: 'Transfer',
  savings_deposit: 'Savings', investment: 'Investment', merchant_pay: 'Merchant',
  loan_payment: 'Loan', insurance: 'Insurance',
};

export default function Stats() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: transactions } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
    initialData: [],
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles?.[0] || {};
  const tier = getTierFromPoints(profile.total_gcs || 0);

  // Build chart data for last 7 days or last 4 weeks
  const chartData = (() => {
    if (period === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const pts = transactions
          .filter(tx => tx.created_date && format(new Date(tx.created_date), 'yyyy-MM-dd') === dayStr)
          .reduce((s, tx) => s + (tx.gcs_points_earned || 0), 0);
        return { label: format(day, 'EEE'), gcs: pts, date: dayStr };
      });
    } else {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = subDays(new Date(), (3 - i) * 7 + 6);
        const weekEnd = subDays(new Date(), (3 - i) * 7);
        const pts = transactions
          .filter(tx => {
            if (!tx.created_date) return false;
            const d = new Date(tx.created_date);
            return d >= weekStart && d <= weekEnd;
          })
          .reduce((s, tx) => s + (tx.gcs_points_earned || 0), 0);
        return { label: `W${i + 1}`, gcs: pts };
      });
    }
  })();

  // This period vs last period
  const currentPeriodGCS = chartData.reduce((s, d) => s + d.gcs, 0);
  const prevData = period === 'week'
    ? Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 13 - i);
        const dayStr = format(day, 'yyyy-MM-dd');
        return transactions
          .filter(tx => tx.created_date && format(new Date(tx.created_date), 'yyyy-MM-dd') === dayStr)
          .reduce((s, tx) => s + (tx.gcs_points_earned || 0), 0);
      })
    : [];
  const prevPeriodGCS = prevData.reduce((s, v) => s + v, 0);
  const changePct = prevPeriodGCS === 0
    ? null
    : Math.round(((currentPeriodGCS - prevPeriodGCS) / prevPeriodGCS) * 100);

  // Most common transaction type
  const typeCounts = {};
  transactions.forEach(tx => { typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1; });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  // Days to next tier
  const tierKeys = Object.keys(TIERS);
  const currentTierIdx = tierKeys.indexOf(tier.key);
  const nextTierKey = tierKeys[currentTierIdx + 1];
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;
  const avgDailyGCS = transactions.length > 0
    ? Math.max(1, Math.round(
        transactions.reduce((s, tx) => s + (tx.gcs_points_earned || 0), 0) /
        Math.max(1, Math.ceil((Date.now() - new Date(transactions[transactions.length - 1]?.created_date || Date.now()).getTime()) / 86400000))
      ))
    : 10;
  const daysToNext = nextTier
    ? Math.ceil(Math.max(0, nextTier.min - (profile.total_gcs || 0)) / avgDailyGCS)
    : null;

  const countTrend = changePct === null ? null : changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold">Thống kê 📊</h1>
        <p className="text-xs text-muted-foreground">Theo dõi hành trình xanh của bạn</p>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {[{ v: 'week', l: '7 ngày' }, { v: 'month', l: '4 tuần' }].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
              period === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl bg-card border border-border/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{period === 'week' ? 'GCS tuần này' : 'GCS 4 tuần'}</span>
            {countTrend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-primary" />}
            {countTrend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
            {countTrend === 'flat' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <p className="font-heading font-bold text-lg">{formatGCS(currentPeriodGCS)}</p>
          {changePct !== null && (
            <p className={`text-[10px] mt-0.5 ${changePct >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {changePct >= 0 ? '+' : ''}{changePct}% so với kỳ trước
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl bg-card border border-border/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Streak hiện tại</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <p className="font-heading font-bold text-lg">{profile.current_streak || 0} 🔥</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">ngày liên tiếp</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl bg-card border border-border/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Tổng GD được tính</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="font-heading font-bold text-lg">{profile.total_transactions || 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {topType ? `Phổ biến: ${typeLabels[topType[0]] || topType[0]}` : 'giao dịch'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl bg-card border border-border/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Giá trị tích lũy</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="font-heading font-bold text-sm">{formatVND((profile.available_gcs || 0) * 100)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">≈ 1 GCS = 100 VND</p>
        </motion.div>
      </div>

      {/* GCS Chart */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-4">GCS tích lũy {period === 'week' ? '7 ngày qua' : '4 tuần qua'}</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={period === 'week' ? 24 : 40}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [`${v} GCS`, 'Điểm']}
            />
            <Bar dataKey="gcs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier Forecast */}
      {nextTier && daysToNext !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/5 border border-primary/20 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Dự báo thăng hạng</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Với tốc độ hiện tại (~{formatGCS(avgDailyGCS)} GCS/ngày), bạn sẽ đạt bậc{' '}
            <span className="font-bold text-primary">{nextTier.emoji} {nextTier.label}</span> sau khoảng{' '}
            <span className="font-bold text-foreground">{daysToNext} ngày</span>.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round(((profile.total_gcs || 0) - tier.min) / (nextTier.min - tier.min) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatGCS(Math.max(0, nextTier.min - (profile.total_gcs || 0)))} GCS còn lại
            </span>
          </div>
        </motion.div>
      )}

      {/* Cashback Comparison */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-3">So sánh hoàn tiền 💰</h3>
        <div className="space-y-2">
          {[
            { label: 'GCS thông thường (1.0x)', pct: '1%', pts: '10 GCS / 100K', highlight: false },
            { label: 'Dịch vụ công giờ cao điểm (1.8x)', pct: '1.8%', pts: '18 GCS / 100K', highlight: true },
            { label: 'Cashback trung bình ngân hàng VN', pct: '~1%', pts: 'benchmark', highlight: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${item.highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/40'}`}>
              <div>
                <p className={`text-xs font-medium ${item.highlight ? 'text-primary' : ''}`}>{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.pts}</p>
              </div>
              <span className={`text-sm font-bold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}