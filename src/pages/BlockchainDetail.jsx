import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { buildBlock } from '@/lib/blockchainMock';
import { formatGCS, formatVND } from '@/lib/gcsEngine';
import { Shield, CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink, Lock } from 'lucide-react';
import { format } from 'date-fns';

function HashDisplay({ label, value }) {
  const [expanded, setExpanded] = useState(false);
  const short = value?.length > 20 ? value.substring(0, 20) + '...' : value;
  return (
    <div className="py-2 border-b border-border/40 last:border-0">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-mono text-[11px] text-left w-full break-all text-primary/80 hover:text-primary transition-colors"
      >
        {expanded ? value : short}
      </button>
    </div>
  );
}

export default function BlockchainDetail() {
  const [user, setUser] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: transactions } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 20),
    initialData: [],
  });

  const block = selectedTx ? buildBlock(selectedTx, user?.email) : null;

  const typeLabels = {
    qr_payment: 'QR_PAYMENT', bill_pay: 'UTILITY_PAYMENT', transfer: 'TRANSFER',
    savings_deposit: 'SAVINGS', investment: 'INVESTMENT', merchant_pay: 'ECOMMERCE',
    loan_payment: 'LOAN_PAYMENT', insurance: 'INSURANCE',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Blockchain
        </h1>
        <p className="text-xs text-muted-foreground">Hyperledger Fabric — Ghi nhận bất biến</p>
      </div>

      {/* Network Status */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Trạng thái mạng</h3>
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Hoạt động
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Nodes', value: '5' },
            { label: 'TPS', value: '20K' },
            { label: 'Finality', value: '< 1s' },
          ].map(item => (
            <div key={item.label} className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="font-heading font-bold text-sm">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground mb-2">Validators (PBFT Consensus)</p>
          <div className="flex flex-wrap gap-1.5">
            {['BankA (VCB)', 'BankB (TCB)', 'NAPAS', 'CIC', 'SBV Node'].map(v => (
              <div key={v} className="flex items-center gap-1 bg-primary/5 text-primary text-[9px] font-medium px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5 flex gap-2.5">
        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-600">Bảo vệ dữ liệu cá nhân</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Customer ID được mã hóa SHA3-256 + salt. Không có PII (tên, CCCD, SĐT) trên blockchain. Tuân thủ NĐ 13/2023/NĐ-CP.
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Chọn giao dịch để xem block</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Chưa có giao dịch nào</p>
          ) : (
            transactions.slice(0, 10).map((tx, i) => (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedTx?.id === tx.id
                    ? 'bg-primary/5 border-primary/40'
                    : 'bg-card border-border/40 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{tx.merchant_name || typeLabels[tx.type] || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.created_date ? format(new Date(tx.created_date), 'dd/MM HH:mm') : ''} • +{tx.gcs_points_earned || 0} GCS
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {selectedTx?.id === tx.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>

                {/* Block Details Expanded */}
                {selectedTx?.id === tx.id && block && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-border/40 space-y-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="p-2 bg-background rounded-lg text-center">
                        <p className="font-heading font-bold text-xs"># {block.blockNumber.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">Block #</p>
                      </div>
                      <div className="p-2 bg-background rounded-lg text-center">
                        <p className="font-heading font-bold text-xs text-primary">{block.confirmations}</p>
                        <p className="text-[9px] text-muted-foreground">Confirmations</p>
                      </div>
                    </div>

                    <HashDisplay label="Block ID" value={block.blockID} />
                    <HashDisplay label="Previous Hash" value={block.previousHash} />
                    <HashDisplay label="Transaction Hash (txID)" value={block.transactions[0].txID} />
                    <HashDisplay label="Customer Hash (SHA3-256)" value={block.transactions[0].customerHash} />
                    <HashDisplay label="Merkle Root" value={block.merkleRoot} />

                    <div className="pt-2 grid grid-cols-2 gap-2">
                      {[
                        { l: 'GCS Points', v: `+${block.transactions[0].gcsPoints}` },
                        { l: 'TX Type', v: block.transactions[0].txType },
                        { l: 'Multiplier', v: `${block.transactions[0].multiplier}x` },
                        { l: 'Channel', v: block.transactions[0].channel },
                      ].map(({ l, v }) => (
                        <div key={l} className="p-2 bg-background rounded-lg">
                          <p className="text-[9px] text-muted-foreground">{l}</p>
                          <p className="text-[11px] font-semibold">{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/40">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Validators đồng thuận PBFT</p>
                      <div className="flex flex-wrap gap-1">
                        {block.validators.map(v => (
                          <span key={v} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            ✓ {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">Đã xác nhận trên Hyperledger Fabric</span>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Block Structure Reference */}
      <div className="rounded-xl bg-card border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-2">Cấu trúc block GCS</h3>
        <pre className="text-[9px] text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-x-auto leading-relaxed">
{`{
  "blockID": "0x7f4a...",
  "transactions": [{
    "type": "EARN",
    "txID": "sha256(txRef+ts+hash)",
    "customerHash": "SHA3-256(id+salt)",
    "gcsPoints": 90,
    "txType": "UTILITY_PAYMENT",
    "multiplier": 1.8
  }],
  "validators": ["BankA","NAPAS","CIC"],
  "merkleRoot": "0xa1c3..."
}`}
        </pre>
      </div>
    </div>
  );
}