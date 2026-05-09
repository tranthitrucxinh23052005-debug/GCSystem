import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { calculateGCS, TYPE_MULTIPLIERS, isPeakHour } from '@/lib/gcsEngine';
import { Zap, Sparkles, Leaf, X } from 'lucide-react';
import { toast } from 'sonner';

const transactionTypes = [
  { value: 'qr_payment', label: 'QR Payment', merchants: ['VinMart', 'Circle K', 'Highlands Coffee', 'GrabFood'] },
  { value: 'bill_pay', label: 'Bill Payment', merchants: ['EVN Electric', 'VNPT Internet', 'Viettel Mobile', 'Water Utility'] },
  { value: 'transfer', label: 'Bank Transfer', merchants: ['Salary Transfer', 'Rent Payment', 'Friend Transfer'] },
  { value: 'savings_deposit', label: 'Savings Deposit', merchants: ['Smart Savings', 'Term Deposit'] },
  { value: 'investment', label: 'Investment', merchants: ['Stock Purchase', 'Fund Investment'] },
  { value: 'merchant_pay', label: 'Merchant Pay', merchants: ['Shopee', 'Lazada', 'Tiki', 'Grab'] },
];

const categories = ['food', 'transport', 'utilities', 'shopping', 'healthcare', 'education', 'entertainment', 'other'];

export default function TransactionSimulator({ onComplete, preselectedType }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(!!preselectedType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReward, setShowReward] = useState(null);
  const [form, setForm] = useState({
    type: preselectedType || 'qr_payment',
    amount: '',
    category: 'food',
    merchant_name: '',
  });

  const selectedTypeInfo = transactionTypes.find(t => t.value === form.type);
  const peakHour = isPeakHour();

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    const amount = Number(form.amount);
    const gcsResult = calculateGCS(amount, form.type, 0);
    
    const transaction = {
      type: form.type,
      amount,
      merchant_name: form.merchant_name || selectedTypeInfo?.merchants[0] || form.type,
      category: form.category,
      gcs_points_earned: gcsResult.totalGCS,
      multiplier_applied: gcsResult.typeMultiplier * gcsResult.timeMultiplier,
      is_peak_hour: gcsResult.isPeakHour,
      streak_bonus: gcsResult.streakBonus,
      status: 'completed',
    };

    await base44.entities.Transaction.create(transaction);

    // Update user profile
    const profiles = await base44.entities.UserProfile.filter({ user_email: (await base44.auth.me()).email });
    if (profiles.length > 0) {
      const p = profiles[0];
      await base44.entities.UserProfile.update(p.id, {
        total_gcs: (p.total_gcs || 0) + gcsResult.totalGCS,
        available_gcs: (p.available_gcs || 0) + gcsResult.totalGCS,
        daily_points_today: (p.daily_points_today || 0) + gcsResult.totalGCS,
        weekly_points: (p.weekly_points || 0) + gcsResult.totalGCS,
        total_transactions: (p.total_transactions || 0) + 1,
        total_co2_saved_kg: Math.round(((p.total_co2_saved_kg || 0) + 0.05) * 100) / 100,
        tree_progress: Math.min(100, (p.tree_progress || 0) + Math.ceil(gcsResult.totalGCS / 10)),
        current_streak: (p.current_streak || 0) + 1,
        longest_streak: Math.max(p.longest_streak || 0, (p.current_streak || 0) + 1),
      });
    } else {
      const me = await base44.auth.me();
      await base44.entities.UserProfile.create({
        user_email: me.email,
        total_gcs: gcsResult.totalGCS,
        available_gcs: gcsResult.totalGCS,
        daily_points_today: gcsResult.totalGCS,
        weekly_points: gcsResult.totalGCS,
        total_transactions: 1,
        total_co2_saved_kg: 0.05,
        tree_progress: Math.ceil(gcsResult.totalGCS / 10),
        current_streak: 1,
        longest_streak: 1,
        tier: 'seed',
        trees_planted: 0,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });

    setShowReward(gcsResult);
    setIsSubmitting(false);
    
    setTimeout(() => {
      setShowReward(null);
      setIsOpen(false);
      setForm({ type: 'qr_payment', amount: '', category: 'food', merchant_name: '' });
      onComplete?.();
    }, 2500);
  };

  return (
    <div>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="w-full rounded-xl h-12 gap-2 font-semibold">
          <Zap className="w-4 h-4" /> Simulate Transaction
        </Button>
      )}

      <AnimatePresence>
        {isOpen && !showReward && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-card border border-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">New Transaction</h3>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {peakHour && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Peak Hour! 1.5x multiplier active
              </div>
            )}

            <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {transactionTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} ({TYPE_MULTIPLIERS[t.value]}x)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Amount (VND)"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="h-12 text-lg font-heading"
            />

            <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.amount > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated GCS</span>
                  <span className="font-bold text-primary">+{calculateGCS(Number(form.amount), form.type).totalGCS} GCS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Multiplier</span>
                  <span>{TYPE_MULTIPLIERS[form.type]}x {peakHour ? '× 1.5x peak' : ''}</span>
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-11 rounded-xl font-semibold gap-2">
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Leaf className="w-4 h-4" /> Complete & Earn GCS</>
              )}
            </Button>
          </motion.div>
        )}

        {showReward && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/30 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-5xl mb-3"
            >
              🌿
            </motion.div>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-heading font-bold text-primary"
            >
              +{showReward.totalGCS} GCS
            </motion.p>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {showReward.typeMultiplier}x type • {showReward.timeMultiplier}x time
              {showReward.streakBonus > 0 ? ` • +${showReward.streakBonus} streak bonus` : ''}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}