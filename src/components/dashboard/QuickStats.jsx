import { motion } from 'framer-motion';
import { Leaf, Banknote, ArrowUpRight, Wind } from 'lucide-react';
import { formatGCS, GCS_TO_VND, formatVND } from '@/lib/gcsEngine';
import { calculateDetailedEnvironmentalImpact } from '@/lib/gcsEngine';

// Cập nhật hàm stats để nhận thêm tham số impact
const getStats = (profile, impact) => [
  {
    label: "Today's GCS",
    value: formatGCS(profile?.daily_points_today || 0),
    icon: Leaf,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'This Week',
    value: formatGCS(profile?.weekly_points || 0),
    icon: ArrowUpRight,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'VND Value',
    value: formatVND((profile?.available_gcs || 0) * GCS_TO_VND),
    icon: Banknote,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    small: true,
  },
  {
    label: 'CO₂ Saved',
    value: `${impact.savedKg} kg`, // Sử dụng giá trị tính toán chuẩn khoa học
    icon: Wind,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
];

export default function QuickStats({ profile }) {
  // Tính toán chỉ số tác động môi trường dựa trên tổng giao dịch
  const impact = calculateDetailedEnvironmentalImpact(profile?.total_transactions || 0);

  // Tạo mảng stats với dữ liệu mới nhất
  const stats = getStats(profile, impact);

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.05 }}
          className="rounded-xl bg-card border border-border/60 p-3.5 relative overflow-hidden"
        >
          <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
          </div>
          <p className={`font-heading font-bold ${stat.small ? 'text-sm' : 'text-lg'}`}>{stat.value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>

          {/* Nhãn dán nhỏ đánh dấu nghiên cứu khoa học cho điểm CO2 */}
          {stat.label === 'CO₂ Saved' && (
            <p className="text-[8px] text-teal-600/70 mt-1 font-medium">
              Geoffron benchmark (2024)
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}