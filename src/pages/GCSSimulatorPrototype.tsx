import React, { useMemo, useState } from 'react';
import {
    Gift,
    History,
    HeartPulse,
    Leaf,
    Landmark,
    PhoneCall,
    Plane,
    ShoppingBag,
    TreePine,
    Tv,
    Utensils,
    Zap,
} from 'lucide-react';

type Tier = {
    nameEn: string;
    nameVi: string;
    min: number;
    max: number;
    color: string;
    bg: string;
};

const TIERS: Tier[] = [
    { nameEn: 'Seed', nameVi: 'Mầm xanh', min: 0, max: 1000, color: '#94a3b8', bg: '#f1f5f9' },
    { nameEn: 'Sprout', nameVi: 'Chồi non', min: 1000, max: 5000, color: '#22c55e', bg: '#f0fdf4' },
    { nameEn: 'Tree', nameVi: 'Cây xanh', min: 5000, max: 15000, color: '#16a34a', bg: '#dcfce7' },
    { nameEn: 'Forest', nameVi: 'Rừng xanh', min: 15000, max: 50000, color: '#15803d', bg: '#bbf7d0' },
    { nameEn: 'Legacy', nameVi: 'Di sản', min: 50000, max: Infinity, color: '#065f46', bg: '#a7f3d0' },
];

const MARKETPLACE = [
    { id: 1, icon: PhoneCall, label: 'Viễn thông', rate: '100 GCS = 10K', color: '#3b82f6' },
    { id: 2, icon: ShoppingBag, label: 'Mua sắm', rate: '100 GCS = 10K', color: '#8b5cf6' },
    { id: 3, icon: Utensils, label: 'Ăn uống', rate: '100 GCS = 12K', color: '#f59e0b' },
    { id: 4, icon: Plane, label: 'Vận tải', rate: '100 GCS = 10K', color: '#06b6d4' },
    { id: 5, icon: Tv, label: 'Giải trí', rate: '100 GCS = 10K', color: '#ec4899' },
    { id: 6, icon: HeartPulse, label: 'Sức khỏe', rate: '100 GCS = 10K', color: '#ef4444' },
    { id: 7, icon: Landmark, label: 'Tài chính', rate: '100 GCS = 1 GD', color: '#64748b' },
];

type TxType = {
    value: string;
    label: string;
    coef: number;
};

const TX_TYPES: TxType[] = [
    { value: 'utility', label: 'Dịch vụ công ×1.2', coef: 1.2 },
    { value: 'ecommerce', label: 'TMĐT ×1.0', coef: 1.0 },
    { value: 'transfer', label: 'Chuyển khoản ×0.8', coef: 0.8 },
    { value: 'qr', label: 'QR tại chỗ ×1.1', coef: 1.1 },
];

function getCurrentTimeCoef(): number {
    const h = new Date().getHours();
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 1.2;
    if ((h >= 7 && h < 9) || (h >= 17 && h < 19)) return 1.5;
    return 1.0;
}

function getTier(pts: number): Tier {
    return TIERS.find((t) => pts >= t.min && pts < t.max) || TIERS[0];
}

function getNextTier(pts: number): Tier | null {
    const idx = TIERS.findIndex((t) => pts >= t.min && pts < t.max);
    if (idx < 0) return null;
    return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

type BlockLike = {
    blockID: string;
    previousHash: string;
    timestamp: string;
    transactions: Array<{
        type: 'EARN' | 'REDEEM' | string;
        txID: string;
        customerHash?: string;
        gcsPoints?: number;
        txAmount?: number;
        txType?: string;
        channel?: string;
        multiplier?: number;
        redemptionType?: string;
        voucherCode?: string;
        redemptionValue?: number;
    }>;
    validator: string[];
    merkleRoot: string;
};

type HistoryItem = {
    id: number;
    type: 'earn' | 'redeem';
    label: string | string[];
    amount: number;
    gcs: number;
    time: Date;
    hash: string;
};

export default function GCSSimulatorPrototype() {
    const [gcsPoints, setGcsPoints] = useState<number>(1250);
    const [balance, setBalance] = useState<number>(5_000_000);
    const [amount, setAmount] = useState<string>('500000');
    const [txType, setTxType] = useState<TxType>(TX_TYPES[0]);
    const [activeTab, setActiveTab] = useState<string>('home');

    const [toastMsg, setToastMsg] = useState<string>('');
    const [toastGcs, setToastGcs] = useState<number>(0);
    const [showToast, setShowToast] = useState<boolean>(false);

    const [latestBlock, setLatestBlock] = useState<BlockLike | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [processing, setProcessing] = useState<boolean>(false);
    const [redeemSuccess, setRedeemSuccess] = useState<string>('');

    const tier = useMemo(() => getTier(gcsPoints), [gcsPoints]);
    const nextTier = useMemo(() => getNextTier(gcsPoints), [gcsPoints]);

    const tierProgress = useMemo(() => {
        if (!nextTier) return 100;
        const denom = nextTier.min - tier.min;
        if (!Number.isFinite(denom) || denom <= 0) return 100;
        return ((gcsPoints - tier.min) / denom) * 100;
    }, [gcsPoints, nextTier, tier.min]);

    const timeCoef = useMemo(() => getCurrentTimeCoef(), []);

    const preview = useMemo(() => {
        const v = Number(amount) || 0;
        const base = v / 10000;
        return Math.round(base * txType.coef * timeCoef);
    }, [amount, txType.coef, timeCoef]);

    const fireToast = (msg: string, gcs: number) => {
        setToastMsg(msg);
        setToastGcs(gcs);
        setShowToast(true);
        window.setTimeout(() => setShowToast(false), 3500);
    };

    const handleTransfer = () => {
        const v = Number(amount);
        if (!v || v <= 0 || v > balance) return;
        setProcessing(true);

        window.setTimeout(() => {
            const earned = preview;
            const newPts = gcsPoints + earned;

            setBalance((b) => b - v);
            setGcsPoints(newPts);

            const block: BlockLike = {
                blockID: '0x' + Math.random().toString(16).slice(2, 10),
                previousHash: '0x' + Math.random().toString(16).slice(2, 10),
                timestamp: new Date().toISOString(),
                transactions: [
                    {
                        type: 'EARN',
                        txID: 'sha256_' + Math.random().toString(16).slice(2, 8),
                        customerHash: 'SHA3-256(TX_ACC_001+salt)',
                        gcsPoints: earned,
                        txAmount: v,
                        txType: txType.value.toUpperCase(),
                        channel: 'MOBILE_APP',
                        multiplier: +(txType.coef * timeCoef).toFixed(2),
                    },
                ],
                validator: ['BankA', 'NAPAS', 'CIC'],
                merkleRoot: '0x' + Math.random().toString(16).slice(2, 12),
            };

            setLatestBlock(block);
            setHistory((h) => [
                {
                    id: Date.now(),
                    type: 'earn',
                    label: txType.label.split(' '),
                    amount: v,
                    gcs: earned,
                    time: new Date(),
                    hash: block.blockID,
                },
                ...h.slice(0, 19),
            ]);

            setProcessing(false);
            fireToast(`🌱 +${earned} GCS từ ${txType.label.split(' ')}`, earned);
        }, 1200);
    };

    const tierEmoji: Record<string, string> = {
        Seed: '🌱',
        Sprout: '🌿',
        Tree: '🌳',
        Forest: '🌲',
        Legacy: '🏆',
    };

    return (
        <div
            style={{
                maxWidth: 430,
                margin: '0 auto',
                minHeight: '100dvh',
                background: '#f8fafc',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {showToast && (
                <div
                    style={{
                        position: 'fixed',
                        top: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: toastGcs >= 0 ? '#065f46' : '#7c3aed',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: 40,
                        fontWeight: 600,
                        fontSize: 13,
                        zIndex: 999,
                        boxShadow: '0 8px 32px rgba(0,0,0,.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        animation: 'slideDown .3s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Leaf size={14} /> {toastMsg}
                </div>
            )}

            <div style={{ background: 'linear-gradient(145deg, #064e3b, #065f46)', padding: '52px 20px 24px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2, letterSpacing: 1 }}>GCS · GREEN CREDIT SCORE</p>
                        <p style={{ fontSize: 28, fontWeight: 800 }}>
                            {gcsPoints.toLocaleString('vi-VN')} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8, marginLeft: 4 }}>điểm</span>
                        </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 16, padding: '6px 14px', fontSize: 13, fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                        {tierEmoji[tier.nameEn]} {tier.nameVi}
                    </div>
                </div>

                {nextTier && (
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.75, marginBottom: 5 }}>
                            <span>{tier.nameVi}</span>
                            <span>
                                {gcsPoints.toLocaleString()} / {nextTier.min.toLocaleString()} → {nextTier.nameVi}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 99, height: 6 }}>
                            <div
                                style={{
                                    width: `${Math.min(tierProgress, 100)}%`,
                                    height: '100%',
                                    background: '#6ee7b7',
                                    borderRadius: 99,
                                    transition: 'width .6s cubic-bezier(.34,1.56,.64,1)',
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
                {activeTab === 'home' && (
                    <div style={{ padding: 16 }}>
                        <div
                            style={{
                                background: timeCoef > 1 ? '#fef9c3' : '#f1f5f9',
                                border: `1px solid ${timeCoef > 1 ? '#fde047' : '#e2e8f0'}`,
                                borderRadius: 12,
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 16,
                                fontSize: 12,
                            }}
                        >
                            <Zap size={14} color={timeCoef > 1 ? '#ca8a04' : '#64748b'} />
                            <span style={{ color: timeCoef > 1 ? '#92400e' : '#475569' }}>
                                {timeCoef === 1.5 ? '🔥 Giờ cao điểm! Hệ số ×1.5' : timeCoef === 1.2 ? '⭐ Cuối tuần! Hệ số ×1.2' : 'Hệ số thời điểm: ×1.0 (bình thường)'}
                            </span>
                        </div>

                        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.06)', marginBottom: 16 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1e293b' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {/* icon-like */}
                                </span>
                                Thực hiện thanh toán
                            </p>

                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 12 }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                                {TX_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTxType(t)}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: 10,
                                            fontSize: 11,
                                            border: txType.value === t.value ? '1.5px solid #059669' : '1px solid #e2e8f0',
                                            background: txType.value === t.value ? '#f0fdf4' : '#f8fafc',
                                            color: txType.value === t.value ? '#059669' : '#64748b',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleTransfer}
                                disabled={processing}
                                style={{ width: '100%', padding: 14, borderRadius: 14, background: '#059669', color: '#fff', fontWeight: 700, border: 'none' }}
                            >
                                {processing ? 'Đang xử lý...' : 'Thanh toán & Tích GCS'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 430,
                    background: '#fff',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    paddingBottom: 10,
                }}
            >
                {[
                    { key: 'home', icon: Leaf, label: 'Tích điểm' },
                    { key: 'market', icon: Gift, label: 'Đổi điểm' },
                    { key: 'history', icon: History, label: 'Lịch sử' },
                    { key: 'block', icon: TreePine, label: 'Blockchain' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
                    >
                        <tab.icon size={18} color={activeTab === tab.key ? '#059669' : '#94a3b8'} />
                        <span style={{ fontSize: 10, color: activeTab === tab.key ? '#059669' : '#94a3b8' }}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <style>{`
        @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        input::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
        </div>
    );
}

