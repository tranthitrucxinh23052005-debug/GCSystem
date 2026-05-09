import { motion } from 'framer-motion';
import { Flame, Calendar } from 'lucide-react';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakTracker({ profile }) {
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  // Simulate which days were active this week (based on streak count)
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const mondayIndex = today === 0 ? 6 : today - 1;
  const activeDays = DAYS.map((_, i) => i <= mondayIndex && i >= mondayIndex - Math.min(currentStreak - 1, mondayIndex));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-card border border-border/60 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Daily Streak</p>
            <p className="text-[10px] text-muted-foreground">Keep transacting daily!</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-heading font-bold text-orange-500">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">days</p>
        </div>
      </div>

      {/* Week dots */}
      <div className="flex items-center justify-between gap-1">
        {DAYS.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeDays[i]
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : i === mondayIndex + 1
                  ? 'bg-orange-500/20 border-2 border-dashed border-orange-400 text-orange-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {activeDays[i] ? '✓' : day}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Best streak */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Best streak</span>
        </div>
        <span className="text-xs font-semibold">{longestStreak} days</span>
      </div>
    </motion.div>
  );
}