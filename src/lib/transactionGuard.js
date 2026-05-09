// Anti-spam & fraud prevention rules for GCS transactions

export const LIMITS = {
  MIN_AMOUNT: 10_000,          // 10K VND minimum (realistic transaction)
  MAX_AMOUNT: 500_000_000,     // 500M VND maximum
  COOLDOWN_SECONDS: 30,        // 30s between transactions
  MAX_DAILY_TRANSACTIONS: 20,  // max 20 transactions per day
  MAX_DAILY_GCS: 5_000,        // max 5,000 GCS earned per day
  DUPLICATE_WINDOW_SECONDS: 60,// same type+amount within 60s = duplicate
};

/**
 * Validates a transaction before submission.
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function validateTransaction({ amount, type, todayTransactions, lastTransactionTime }) {
  // 1. Amount range check
  if (!amount || isNaN(amount)) {
    return { valid: false, reason: 'Vui lòng nhập số tiền hợp lệ.' };
  }
  if (amount < LIMITS.MIN_AMOUNT) {
    return { valid: false, reason: `Số tiền tối thiểu là ${(LIMITS.MIN_AMOUNT).toLocaleString('vi-VN')} VND.` };
  }
  if (amount > LIMITS.MAX_AMOUNT) {
    return { valid: false, reason: `Số tiền tối đa là ${(LIMITS.MAX_AMOUNT / 1_000_000).toLocaleString('vi-VN')} triệu VND.` };
  }

  // 2. Cooldown check
  if (lastTransactionTime) {
    const secondsSinceLast = (Date.now() - lastTransactionTime) / 1000;
    if (secondsSinceLast < LIMITS.COOLDOWN_SECONDS) {
      const wait = Math.ceil(LIMITS.COOLDOWN_SECONDS - secondsSinceLast);
      return { valid: false, reason: `Vui lòng đợi ${wait} giây trước khi giao dịch tiếp theo.` };
    }
  }

  // 3. Daily transaction count
  const today = new Date().toDateString();
  const txToday = (todayTransactions || []).filter(tx => {
    const txDate = tx.created_date ? new Date(tx.created_date).toDateString() : null;
    return txDate === today;
  });
  if (txToday.length >= LIMITS.MAX_DAILY_TRANSACTIONS) {
    return { valid: false, reason: `Bạn đã đạt giới hạn ${LIMITS.MAX_DAILY_TRANSACTIONS} giao dịch trong ngày hôm nay.` };
  }

  // 4. Daily GCS cap
  const dailyGCS = txToday.reduce((sum, tx) => sum + (tx.gcs_points_earned || 0), 0);
  if (dailyGCS >= LIMITS.MAX_DAILY_GCS) {
    return { valid: false, reason: `Bạn đã đạt giới hạn ${LIMITS.MAX_DAILY_GCS.toLocaleString()} GCS trong ngày hôm nay.` };
  }

  // 5. Duplicate transaction detection
  const oneMinuteAgo = Date.now() - LIMITS.DUPLICATE_WINDOW_SECONDS * 1000;
  const isDuplicate = txToday.some(tx => {
    const txTime = tx.created_date ? new Date(tx.created_date).getTime() : 0;
    return tx.type === type && tx.amount === amount && txTime > oneMinuteAgo;
  });
  if (isDuplicate) {
    return { valid: false, reason: 'Giao dịch trùng lặp được phát hiện. Vui lòng đợi 60 giây.' };
  }

  return { valid: true };
}

/**
 * Calculates how many GCS would actually be awarded today
 * given the daily cap.
 */
export function applyDailyGCSCap(estimatedGCS, todayTransactions) {
  const today = new Date().toDateString();
  const dailyGCS = (todayTransactions || [])
    .filter(tx => tx.created_date && new Date(tx.created_date).toDateString() === today)
    .reduce((sum, tx) => sum + (tx.gcs_points_earned || 0), 0);

  const remaining = Math.max(0, LIMITS.MAX_DAILY_GCS - dailyGCS);
  return Math.min(estimatedGCS, remaining);
}