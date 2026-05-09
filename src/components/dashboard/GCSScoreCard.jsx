import { motion } from 'framer-motion';
import { getTierFromPoints, getTierProgress, formatGCS } from '@/lib/gcsEngine';
import { TrendingUp, Zap } from 'lucide-react';

export default function GCSScoreCard({ profile }) {
  const totalGCS = profile?.total_gcs || 0;
  const availableGCS = profile?.available_gcs || 0;
  const tier = getTierFromPoints(totalGCS);
  const tierProgress = getTierProgress(totalGCS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      
      <div className="relative z-10">
        {/* Tier Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm">{tier.emoji}</span>
            <span className="text-xs font-semibold uppercase tracking-wider">{tier.label}</span>
          </div>
          <div className="flex items-center gap-1 text-white/70">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Active</span>
          </div>
        </div>

        {/* Points Display */}
        <div className="mb-1">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Green Credit Score</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={availableGCS}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-heading font-bold tabular-nums"
            >
              {formatGCS(availableGCS)}
            </motion.span>
            <span className="text-white/50 text-sm">GCS</span>
          </div>
        </div>

        {/* Tier Progress */}
        {tierProgress.nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/60">{tier.label}</span>
              <span className="text-white/60">{tierProgress.nextTier.label}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress.progress}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-white/80 rounded-full"
              />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3 h-3 text-white/50" />
              <span className="text-[10px] text-white/50">{formatGCS(tierProgress.pointsToNext)} GCS to {tierProgress.nextTier.label}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}