import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, Receipt, Send, PiggyBank, CreditCard, ShieldCheck, TrendingUp, Store } from 'lucide-react';
import { formatGCS, formatVND } from '@/lib/gcsEngine';
import { format } from 'date-fns';

const typeIcons = {
  qr_payment: QrCode,
  bill_pay: Receipt,
  transfer: Send,
  savings_deposit: PiggyBank,
  investment: TrendingUp,
  loan_payment: CreditCard,
  insurance: ShieldCheck,
  merchant_pay: Store,
};

const typeLabels = {
  qr_payment: 'QR Payment',
  bill_pay: 'Bill Payment',
  transfer: 'Transfer',
  savings_deposit: 'Savings',
  investment: 'Investment',
  loan_payment: 'Loan',
  insurance: 'Insurance',
  merchant_pay: 'Merchant',
};

export default function RecentTransactions({ transactions = [] }) {
  const recent = transactions.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        <Link to="/transactions" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {recent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Start making digital payments to earn GCS!</p>
          </div>
        ) : (
          recent.map((tx, i) => {
            const Icon = typeIcons[tx.type] || CreditCard;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-border transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.merchant_name || typeLabels[tx.type]}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tx.created_date ? format(new Date(tx.created_date), 'MMM d, HH:mm') : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-muted-foreground">{formatVND(tx.amount)}</p>
                  <p className="text-xs font-bold text-primary">+{tx.gcs_points_earned || 0} GCS</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}