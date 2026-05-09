import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatGCS, TIERS } from '@/lib/gcsEngine';
import { ShoppingCart, Lock, Star } from 'lucide-react';

const categoryEmojis = {
  telecom: '📱', ecommerce: '🛒', fnb: '🍜', green_gifts: '🌿',
  travel: '✈️', entertainment: '🎬', education: '📚', charity: '💚',
};

export default function RewardCard({ reward, userTier, availableGCS, onRedeem }) {
  const tierKeys = Object.keys(TIERS);
  const userTierIndex = tierKeys.indexOf(userTier || 'seed');
  const requiredTierIndex = tierKeys.indexOf(reward.tier_required || 'seed');
  const isLocked = userTierIndex < requiredTierIndex;
  const canAfford = availableGCS >= reward.gcs_cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl bg-card border border-border/60 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <span className="text-4xl">{categoryEmojis[reward.category] || '🎁'}</span>
        {reward.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Lock className="w-3.5 h-3.5" />
              {TIERS[reward.tier_required]?.label} tier
            </div>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <Badge variant="outline" className="text-[9px] mb-1.5">
          {reward.category?.replace('_', ' ')}
        </Badge>
        <h4 className="font-semibold text-sm line-clamp-1">{reward.name}</h4>
        {reward.partner_name && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{reward.partner_name}</p>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <span className="font-heading font-bold text-primary text-sm">{formatGCS(reward.gcs_cost)} GCS</span>
          <Button
            size="sm"
            disabled={isLocked || !canAfford}
            onClick={() => onRedeem(reward)}
            className="h-7 text-[10px] rounded-lg gap-1"
          >
            <ShoppingCart className="w-3 h-3" /> Redeem
          </Button>
        </div>
      </div>
    </motion.div>
  );
}