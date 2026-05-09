// GCS Calculation Engine
// Formula: GCS = (Transaction Value / 10,000) * Type Multiplier * Time Multiplier + Streak Bonus

export const TYPE_MULTIPLIERS = {
  qr_payment: 1.5,
  bill_pay: 1.2,
  transfer: 1.0,
  savings_deposit: 2.0,
  investment: 2.5,
  loan_payment: 1.3,
  insurance: 1.8,
  merchant_pay: 1.4,
};

export const PEAK_HOUR_MULTIPLIER = 1.5;
export const OFF_PEAK_MULTIPLIER = 1.0;

// Peak hours: 7-9 AM, 11:30-1:30 PM, 5-8 PM (Vietnam time)
export function isPeakHour(date = new Date()) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const time = hour + minute / 60;
  return (time >= 7 && time <= 9) || (time >= 11.5 && time <= 13.5) || (time >= 17 && time <= 20);
}

export function getStreakBonus(streakDays) {
  if (streakDays >= 30) return 50;
  if (streakDays >= 14) return 30;
  if (streakDays >= 7) return 15;
  if (streakDays >= 3) return 5;
  return 0;
}

export function calculateGCS(amount, type, currentStreak = 0, date = new Date()) {
  const basePoints = amount / 10000;
  const typeMultiplier = TYPE_MULTIPLIERS[type] || 1.0;
  const peakHour = isPeakHour(date);
  const timeMultiplier = peakHour ? PEAK_HOUR_MULTIPLIER : OFF_PEAK_MULTIPLIER;
  const streakBonus = getStreakBonus(currentStreak);
  
  const totalGCS = Math.round(basePoints * typeMultiplier * timeMultiplier + streakBonus);
  
  return {
    totalGCS,
    basePoints: Math.round(basePoints),
    typeMultiplier,
    timeMultiplier,
    streakBonus,
    isPeakHour: peakHour,
  };
}

// Tier thresholds
export const TIERS = {
  seed: { min: 0, max: 999, label: 'Seed', emoji: '🌱', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  sprout: { min: 1000, max: 4999, label: 'Sprout', emoji: '🌿', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  tree: { min: 5000, max: 19999, label: 'Tree', emoji: '🌳', color: 'text-green-600', bgColor: 'bg-green-600/10' },
  forest: { min: 20000, max: 99999, label: 'Forest', emoji: '🌲', color: 'text-emerald-700', bgColor: 'bg-emerald-700/10' },
  legacy: { min: 100000, max: Infinity, label: 'Legacy', emoji: '🏔️', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
};

export function getTierFromPoints(totalGCS) {
  for (const [key, tier] of Object.entries(TIERS)) {
    if (totalGCS >= tier.min && totalGCS <= tier.max) {
      return { key, ...tier };
    }
  }
  return { key: 'seed', ...TIERS.seed };
}

export function getTierProgress(totalGCS) {
  const tier = getTierFromPoints(totalGCS);
  const tierKeys = Object.keys(TIERS);
  const currentIndex = tierKeys.indexOf(tier.key);
  const nextTierKey = tierKeys[currentIndex + 1];
  
  if (!nextTierKey) return { progress: 100, pointsToNext: 0, nextTier: null };
  
  const nextTier = TIERS[nextTierKey];
  const pointsInTier = totalGCS - tier.min;
  const tierRange = nextTier.min - tier.min;
  const progress = Math.min(100, Math.round((pointsInTier / tierRange) * 100));
  
  return {
    progress,
    pointsToNext: nextTier.min - totalGCS,
    nextTier: { key: nextTierKey, ...nextTier },
  };
}

// CO2 estimation: ~0.05 kg CO2 saved per digital transaction vs cash
export function estimateCO2Saved(transactionCount) {
  return Math.round(transactionCount * 0.05 * 100) / 100;
}

// GCS to VND conversion: 1 GCS ≈ 100 VND
export const GCS_TO_VND = 100;

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatGCS(points) {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toString();
}