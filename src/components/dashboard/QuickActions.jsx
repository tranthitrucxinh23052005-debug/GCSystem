import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QrCode, Receipt, Send, PiggyBank } from 'lucide-react';

const actions = [
  { icon: QrCode, label: 'QR Pay', color: 'bg-primary/10 text-primary', path: '/transactions?action=qr_payment' },
  { icon: Receipt, label: 'Bill Pay', color: 'bg-blue-500/10 text-blue-500', path: '/transactions?action=bill_pay' },
  { icon: Send, label: 'Transfer', color: 'bg-purple-500/10 text-purple-500', path: '/transactions?action=transfer' },
  { icon: PiggyBank, label: 'Save', color: 'bg-amber-500/10 text-amber-500', path: '/transactions?action=savings_deposit' },
];

export default function QuickActions() {
  return (
    <div className="flex items-center justify-between gap-2">
      {actions.map((action, i) => (
        <Link key={action.label} to={action.path} className="flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 hover:border-primary/30 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{action.label}</span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}