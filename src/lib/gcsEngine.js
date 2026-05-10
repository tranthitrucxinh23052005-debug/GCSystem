// GCS Calculation Engine
// Formula: GCS = (Transaction Value / 10,000) * Type Multiplier * Time Multiplier + Streak Bonus
// Spec: UTILITY_PAYMENT=1.2, ECOMMERCE=1.0, TRANSFER=0.8, QR_PAYMENT=1.1, ATM_WITHDRAWAL=0

export const TYPE_MULTIPLIERS = {
  qr_payment: 1.1,       // QR tại chỗ
  bill_pay: 1.2,         // Dịch vụ công (điện/nước/y tế)
  transfer: 0.8,         // Chuyển khoản
  savings_deposit: 1.0,  // Tiết kiệm
  investment: 1.0,       // Đầu tư
  loan_payment: 1.0,     // Trả vay
  insurance: 1.0,        // Bảo hiểm
  merchant_pay: 1.0,     // TMĐT (Shopee, Lazada…)
};

export const PEAK_HOUR_MULTIPLIER = 1.5;   // 7–9h, 17–19h ngày thường
export const WEEKEND_MULTIPLIER = 1.2;     // Thứ 7, Chủ nhật
export const OFF_PEAK_MULTIPLIER = 1.0;

// Peak hours: 7–9 AM and 17–19 on weekdays; weekends = 1.2x
export function isPeakHour(date = new Date()) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const time = hour + minute / 60;
  const day = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return false; // weekends handled separately
  return (time >= 7 && time < 9) || (time >= 17 && time < 19);
}

export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getTimeMultiplier(date = new Date()) {
  if (isPeakHour(date)) return PEAK_HOUR_MULTIPLIER;
  if (isWeekend(date)) return WEEKEND_MULTIPLIER;
  return OFF_PEAK_MULTIPLIER;
}

// Streak bonus: 7 consecutive days = +50 GCS
export function getStreakBonus(streakDays) {
  if (streakDays >= 7) return 50;
  return 0;
}

export function calculateGCS(amount, type, currentStreak = 0, date = new Date()) {
  const basePoints = amount / 10000;
  const typeMultiplier = TYPE_MULTIPLIERS[type] || 1.0;
  const timeMultiplier = getTimeMultiplier(date);
  const streakBonus = getStreakBonus(currentStreak);

  const totalGCS = Math.round(basePoints * typeMultiplier * timeMultiplier + streakBonus);

  return {
    totalGCS,
    basePoints: Math.round(basePoints),
    typeMultiplier,
    timeMultiplier,
    streakBonus,
    isPeakHour: isPeakHour(date),
  };
}

// Tier thresholds (matching spec exactly)
export const TIERS = {
  seed: { min: 0, max: 999, label: 'Mầm xanh', nameEn: 'Seed', emoji: '🌱', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', perks: ['Truy cập marketplace cơ bản'] },
  sprout: { min: 1000, max: 4999, label: 'Chồi non', nameEn: 'Sprout', emoji: '🌿', color: 'text-green-500', bgColor: 'bg-green-500/10', perks: ['+10% bonus quy đổi tại 3 nhóm đối tác'] },
  tree: { min: 5000, max: 14999, label: 'Cây xanh', nameEn: 'Tree', emoji: '🌳', color: 'text-green-600', bgColor: 'bg-green-600/10', perks: ['Lãi suất tiết kiệm +0,2%/năm', 'Miễn 5 GD chuyển khoản/tháng'] },
  forest: { min: 15000, max: 49999, label: 'Rừng xanh', nameEn: 'Forest', emoji: '🌲', color: 'text-emerald-700', bgColor: 'bg-emerald-700/10', perks: ['Hạn mức tín dụng +10%', 'Ưu tiên CSKH', 'Tư vấn tài chính cá nhân'] },
  legacy: { min: 50000, max: Infinity, label: 'Di sản', nameEn: 'Legacy', emoji: '🏆', color: 'text-amber-500', bgColor: 'bg-amber-500/10', perks: ['Top 1% KH — sự kiện riêng', 'Lãi vay ưu đãi 0,5%'] },
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
// CO2 estimation: based on detailed environmental impact
export function estimateCO2Saved(transactionCount) {
  const impact = calculateDetailedEnvironmentalImpact(transactionCount);
  return Number(impact.savedKg);
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
/**
 * Tính toán tác động môi trường chuyên sâu
 * Dựa trên nghiên cứu Geoffron (2024): Tiền mặt phát thải ~36.8g CO2/GD
 */
export function calculateDetailedEnvironmentalImpact(txCount) {
  const CO2_PER_CASH_TX = 36.8; // grams
  const CO2_SAVED_PER_DIGITAL_TX = 34.3; // Ước tính tiết kiệm được 15 lần

  const totalSavedGrams = txCount * CO2_SAVED_PER_DIGITAL_TX;

  return {
    savedKg: (totalSavedGrams / 1000).toFixed(2),
    treesEquivalent: (totalSavedGrams / 20000).toFixed(1), // Giả định 1 cây hấp thụ 20kg CO2/năm
  };
}