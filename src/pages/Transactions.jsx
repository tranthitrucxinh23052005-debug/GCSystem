import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { QrCode, Receipt, Send, PiggyBank, CreditCard, ShieldCheck, TrendingUp, Store, Filter } from 'lucide-react';
import { formatGCS, formatVND } from '@/lib/gcsEngine';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionSimulator from '@/components/transactions/TransactionSimulator';

const typeIcons = {
  qr_payment: QrCode, bill_pay: Receipt, transfer: Send, savings_deposit: PiggyBank,
  investment: TrendingUp, loan_payment: CreditCard, insurance: ShieldCheck, merchant_pay: Store,
};

const typeLabels = {
  qr_payment: 'QR Payment', bill_pay: 'Bill Payment', transfer: 'Transfer',
  savings_deposit: 'Savings', investment: 'Investment', loan_payment: 'Loan',
  insurance: 'Insurance', merchant_pay: 'Merchant',
};

export default function Transactions() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAction = urlParams.get('action');
  const [filter, setFilter] = useState('all');

  const { data: transactions } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 50),
    initialData: [],
  });

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold">Activity</h1>
        <p className="text-xs text-muted-foreground">Track your transactions & GCS earnings</p>
      </div>

      <TransactionSimulator preselectedType={preselectedAction} />

      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Use the simulator above to create your first transaction!</p>
          </div>
        ) : (
          filtered.map((tx, i) => {
            const Icon = typeIcons[tx.type] || CreditCard;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.merchant_name || typeLabels[tx.type]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {tx.created_date ? format(new Date(tx.created_date), 'MMM d, HH:mm') : ''}
                    </span>
                    {tx.is_peak_hour && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">Peak</span>
                    )}
                    {tx.multiplier_applied > 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {tx.multiplier_applied}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatVND(tx.amount)}</p>
                  <p className="text-sm font-bold text-primary">+{tx.gcs_points_earned || 0}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}