import { motion } from 'framer-motion';
import { TreePine, Droplets } from 'lucide-react';
import { calculateDetailedEnvironmentalImpact } from '@/lib/gcsEngine';

const TREE_STAGES = [
  { min: 0, label: 'Seed', visual: '🌱', size: 'text-3xl' },
  { min: 20, label: 'Sprout', visual: '🌿', size: 'text-4xl' },
  { min: 40, label: 'Sapling', visual: '🌲', size: 'text-4xl' },
  { min: 60, label: 'Young Tree', visual: '🌳', size: 'text-5xl' },
  { min: 80, label: 'Mature Tree', visual: '🌳', size: 'text-6xl' },
  { min: 100, label: 'Ready to Plant!', visual: '🏔️', size: 'text-6xl' },
];

function getTreeStage(progress) {
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (progress >= TREE_STAGES[i].min) return TREE_STAGES[i];
  }
  return TREE_STAGES;
}

export default function VirtualTree({ profile }) {
  const impact = calculateDetailedEnvironmentalImpact(profile.total_transactions || 0);
  const progress = profile?.tree_progress || 0;
  const treesPlanted = profile?.trees_planted || 0;
  const stage = getTreeStage(progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-card border border-border/60 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TreePine className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">My Garden</p>
            <p className="text-[10px] text-muted-foreground">{treesPlanted} trees planted</p>
          </div>
        </div>
      </div>

      {/* Tree Visual */}
      <div className="relative flex flex-col items-center py-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent">
        <motion.div
          key={stage.label}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`${stage.size} animate-float`}
        >
          {stage.visual}
        </motion.div>
        <p className="mt-2 text-xs font-semibold text-foreground">{stage.label}</p>

        {/* Badge hiển thị số cây thực tế tương đương */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-1.5"
        >
          <span className="text-xs">🌍</span>
          <span className="text-[10px] font-semibold text-primary">
            Tương đương {impact.treesEquivalent} cây ngoài đời
          </span>
        </motion.div>

        {/* Water drops decoration */}
        {progress > 0 && progress < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-2 right-4 flex items-center gap-1 text-blue-400"
          >
            <Droplets className="w-3 h-3" />
            <span className="text-[10px] font-medium">Watering...</span>
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Growth Progress</span>
          <span className="font-semibold text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}