import React, { useState, useEffect } from 'react';
import { calculateGCS, getTierFromPoints } from '../lib/gcsEngine';
import { buildBlock } from '../lib/blockchainMock';
import {
    Send, Gift, TreePine, Leaf, History,
    ChevronRight, Zap, Star, RefreshCw, X,
    ShoppingBag, Plane, Utensils, Tv, HeartPulse,
    Landmark, Globe, PhoneCall
} from 'lucide-react';

// ─── Tier config ───────────────────────────────────────────────────────────────
const TIERS = [
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
    { id: 8, icon: Globe, label: 'Quà xanh 🌱', rate: '200 GCS = 1 cây', color: '#16a34a' },
];

const TX_TYPES = [
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

function getTier(pts: number) {
    return TIERS.find(t => pts >= t.min && pts < t.max) ?? TIERS[0];
}

function getNextTier(pts: number) {
    const idx = TIERS.findIndex(t => pts >= t.min && pts < t.max);
    return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GCSSimulatorPrototype() {
    const [gcsPoints, setGcsPoints] = useState(1250);
    const [balance, setBalance] = useState(5000000);
    const [amount, setAmount] = useState('500000');
    const [txType, setTxType] = useState(TX_TYPES[0]);
    const [activeTab, setActiveTab] = useState<'home' | 'market' | 'history' | 'block'>('home');
    const [toastMsg, setToastMsg] = useState('');
    const [toastGcs, setToastGcs] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [latestBlock, setLatestBlock] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [redeemSuccess, setRedeemSuccess] = useState('');

    const tier = getTier(gcsPoints);
    const nextTier = getNextTier(gcsPoints);
    const tierProgress = nextTier
        ? ((gcsPoints - tier.min) / (nextTier.min - tier.min)) * 100
        : 100;
    const timeCoef = getCurrentTimeCoef();

    const preview = (() => {
        const v = Number(amount) || 0;
        const base = v / 10000;
        return Math.round(base * txType.coef * timeCoef);
    })();

    const fireToast = (msg: string, gcs: number) => {
        setToastMsg(msg); setToastGcs(gcs); setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
    };

    const handleTransfer = () => {
        const v = Number(amount);
        if (!v || v <= 0 || v > balance) return;
        setProcessing(true);

        setTimeout(() => {
            const earned = preview;
            const newPts = gcsPoints + earned;
            setBalance(b => b - v);
            setGcsPoints(newPts);

            const block = {
                blockID: '0x' + Math.random().toString(16).slice(2, 10),
                previousHash: '0x' + Math.random().toString(16).slice(2, 10),
                timestamp: new Date().toISOString(),
                transactions: [{
                    type: 'EARN',
                    txID: 'sha256_' + Math.random().toString(16).slice(2, 8),
                    customerHash: 'SHA3-256(TX_ACC_001+salt)',
                    gcsPoints: earned,
                    txAmount: v,
                    txType: txType.value.toUpperCase(),
                    channel: 'MOBILE_APP',
                    multiplier: +(txType.coef * timeCoef).toFixed(2),
                }],
                validator: ['BankA', 'NAPAS', 'CIC'],
                merkleRoot: '0x' + Math.random().toString(16).slice(2, 12),
            };
            setLatestBlock(block);
            setHistory(h => [{
                id: Date.now(), type: 'earn', label: txType.label.split(' ')[0],
                amount: v, gcs: earned, time: new Date(), hash: block.blockID,
            }, ...h.slice(0, 19)]);

            setProcessing(false);
            fireToast(`🌱 +${earned} GCS từ ${txType.label.split(' ')[0]}`, earned);
        }, 1200);
    };

    const handleRedeem = (cost: number, label: string) => {
        if (gcsPoints < cost) {
            fireToast('Không đủ GCS để đổi', 0); return;
        }
        setGcsPoints(g => g - cost);
        const block = {
            blockID: '0x' + Math.random().toString(16).slice(2, 10),
            previousHash: latestBlock?.blockID ?? '0x0000',
            timestamp: new Date().toISOString(),
            transactions: [{ type: 'REDEEM', gcsPoints: -cost, redemptionType: label, voucherCode: 'GCS-' + Date.now(), redemptionValue: cost * 100 }],
            validator: ['BankA', 'NAPAS'], merkleRoot: '0x' + Math.random().toString(16).slice(2, 12),
        };
        setLatestBlock(block);
        setHistory(h => [{ id: Date.now(), type: 'redeem', label, amount: 0, gcs: -cost, time: new Date(), hash: block.blockID }, ...h.slice(0, 19)]);
        setRedeemSuccess(`Đổi thành công! Voucher ${label} đã được tạo.`);
        setTimeout(() => setRedeemSuccess(''), 3000);
        fireToast(`🎁 Đổi ${cost} GCS → ${label}`, -cost);
    };

    // ─── UI helpers ─────────────────────────────────────────────────────────────
    const tierEmoji: Record<string, string> = {
        Seed: '🌱', Sprout: '🌿', Tree: '🌳', Forest: '🌲', Legacy: '🏆'
    };

    return (
        <div style={{
            maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
            background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif",
            position: 'relative', display: 'flex', flexDirection: 'column',
        }}>

            {/* ── Toast notification ── */}
            {showToast && (
                <div style={{
                    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                    background: toastGcs >= 0 ? '#065f46' : '#7c3aed',
                    color: '#fff', padding: '10px 20px', borderRadius: 40,
                    fontWeight: 600, fontSize: 13, zIndex: 999,
                    boxShadow: '0 8px 32px rgba(0,0,0,.2)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    animation: 'slideDown .3s ease',
                    whiteSpace: 'nowrap',
                }}>
                    <Leaf size={14} /> {toastMsg}
                </div>
            )}

            {/* ── Header ── */}
            <div style={{
                background: 'linear-gradient(145deg, #064e3b, #065f46)',
                padding: '52px 20px 24px', color: '#fff',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ fontSize: 12, opacity: .7, marginBottom: 2, letterSpacing: 1 }}>GCS · GREEN CREDIT SCORE</p>
                        <p style={{ fontSize: 28, fontWeight: 800 }}>
                            {gcsPoints.toLocaleString('vi-VN')}
                            <span style={{ fontSize: 14, fontWeight: 500, opacity: .8, marginLeft: 4 }}>điểm</span>
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,.15)', borderRadius: 16,
                        padding: '6px 14px', fontSize: 13, fontWeight: 700,
                        backdropFilter: 'blur(8px)',
                    }}>
                        {tierEmoji[tier.nameEn]} {tier.nameVi}
                    </div>
                </div>

                {/* Tier progress */}
                {nextTier && (
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .75, marginBottom: 5 }}>
                            <span>{tier.nameVi}</span>
                            <span>{gcsPoints.toLocaleString()} / {nextTier.min.toLocaleString()} → {nextTier.nameVi}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 99, height: 6 }}>
                            <div style={{
                                width: `${Math.min(tierProgress, 100)}%`, height: '100%',
                                background: '#6ee7b7', borderRadius: 99,
                                transition: 'width .6s cubic-bezier(.34,1.56,.64,1)',
                            }} />
                        </div>
                    </div>
                )}

                {/* Balance */}
                <div style={{
                    marginTop: 14, background: 'rgba(255,255,255,.1)',
                    borderRadius: 12, padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, opacity: .75 }}>Số dư tài khoản</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                        {balance.toLocaleString('vi-VN')} ₫
                    </span>
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

                {/* HOME TAB */}
                {activeTab === 'home' && (
                    <div style={{ padding: 16 }}>

                        {/* Time coef info */}
                        <div style={{
                            background: timeCoef > 1 ? '#fef9c3' : '#f1f5f9',
                            border: `1px solid ${timeCoef > 1 ? '#fde047' : '#e2e8f0'}`,
                            borderRadius: 12, padding: '10px 14px',
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 16, fontSize: 12,
                        }}>
                            <Zap size={14} color={timeCoef > 1 ? '#ca8a04' : '#64748b'} />
                            <span style={{ color: timeCoef > 1 ? '#92400e' : '#475569' }}>
                                {timeCoef === 1.5
                                    ? '🔥 Giờ cao điểm! Hệ số ×1.5'
                                    : timeCoef === 1.2
                                        ? '⭐ Cuối tuần! Hệ số ×1.2'
                                        : 'Hệ số thời điểm: ×1.0 (bình thường)'}
                            </span>
                        </div>

                        {/* Send form card */}
                        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.06)', marginBottom: 16 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1e293b' }}>
                                <Send size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                                Thực hiện thanh toán
                            </p>

                            {/* Amount input */}
                            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Số tiền (VND)</label>
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 50px 12px 14px',
                                        borderRadius: 12, border: '1.5px solid #e2e8f0',
                                        fontSize: 18, fontWeight: 700, color: '#0f172a',
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                                <span style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    color: '#94a3b8', fontWeight: 600, fontSize: 13,
                                }}>₫</span>
                            </div>

                            {/* Quick amounts */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                {[100000, 200000, 500000, 1000000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAmount(String(v))}
                                        style={{
                                            flex: '1 1 0', padding: '6px 0', borderRadius: 8,
                                            border: amount === String(v) ? '1.5px solid #059669' : '1px solid #e2e8f0',
                                            background: amount === String(v) ? '#f0fdf4' : '#f8fafc',
                                            color: amount === String(v) ? '#059669' : '#64748b',
                                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        {(v / 1000).toFixed(0)}K
                                    </button>
                                ))}
                            </div>

                            {/* TX Type */}
                            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6 }}>Loại giao dịch</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                                {TX_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTxType(t)}
                                        style={{
                                            padding: '8px 10px', borderRadius: 10, fontSize: 11,
                                            border: txType.value === t.value ? '1.5px solid #059669' : '1px solid #e2e8f0',
                                            background: txType.value === t.value ? '#f0fdf4' : '#f8fafc',
                                            color: txType.value === t.value ? '#059669' : '#64748b',
                                            fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* GCS Preview */}
                            {preview > 0 && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                    border: '1px solid #bbf7d0', borderRadius: 12,
                                    padding: '10px 14px', marginBottom: 14,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: 12, color: '#166534' }}>Bạn sẽ nhận được</span>
                                    <span style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>+{preview} GCS</span>
                                </div>
                            )}

                            <button
                                onClick={handleTransfer}
                                disabled={processing || !Number(amount) || Number(amount) > balance}
                                style={{
                                    width: '100%', padding: 14, borderRadius: 14,
                                    background: processing ? '#94a3b8' : 'linear-gradient(135deg, #059669, #047857)',
                                    color: '#fff', fontWeight: 700, fontSize: 15,
                                    border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'opacity .2s',
                                }}
                            >
                                {processing
                                    ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                                    : <><Send size={16} /> Thanh toán & Tích GCS</>
                                }
                            </button>
                        </div>

                        {/* Recent history mini */}
                        {history.length > 0 && (
                            <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Gần đây</p>
                                    <button onClick={() => setActiveTab('history')} style={{ fontSize: 11, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Xem tất cả <ChevronRight size={12} style={{ verticalAlign: -2 }} />
                                    </button>
                                </div>
                                {history.slice(0, 3).map(tx => (
                                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: tx.type === 'earn' ? '#f0fdf4' : '#faf5ff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {tx.type === 'earn' ? <Leaf size={16} color="#059669" /> : <Gift size={16} color="#7c3aed" />}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{tx.label}</p>
                                                <p style={{ fontSize: 10, color: '#94a3b8' }}>
                                                    {tx.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: tx.gcs >= 0 ? '#059669' : '#7c3aed' }}>
                                            {tx.gcs >= 0 ? '+' : ''}{tx.gcs} GCS
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MARKETPLACE TAB */}
                {activeTab === 'market' && (
                    <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <p style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>GCS Marketplace</p>
                            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                                <Leaf size={12} style={{ verticalAlign: -2, marginRight: 2 }} />
                                {gcsPoints.toLocaleString()} GCS
                            </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>8 nhóm đổi điểm · 1 GCS = 100 VND</p>

                        {redeemSuccess && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                                ✅ {redeemSuccess}
                            </div>
                        )}

                        {/* 8-group grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                            {MARKETPLACE.map(m => {
                                const Icon = m.icon;
                                return (
                                    <div key={m.id} style={{
                                        background: '#fff', borderRadius: 16, padding: '14px 12px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 6,
                                    }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 10, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={18} color={m.color} />
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{m.label}</p>
                                        <p style={{ fontSize: 10, color: '#64748b' }}>{m.rate}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Featured redeem items */}
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 10 }}>Đổi nhanh</p>
                        {[
                            { label: 'Voucher Shopee 50K', cost: 500, badge: '🛒 Hot' },
                            { label: 'Voucher Shopee 100K', cost: 1000, badge: '🛒' },
                            { label: 'Thẻ data 10K Viettel', cost: 100, badge: '📱' },
                            { label: 'Miễn phí CK (1 GD)', cost: 100, badge: '🏦' },
                            { label: 'Trồng 1 cây xanh 🌱', cost: 200, badge: '🌿 ESG' },
                        ].map(item => (
                            <div key={item.label} style={{
                                background: '#fff', borderRadius: 16, padding: '14px 16px',
                                marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                            }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.badge} {item.label}</p>
                                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Cần {item.cost.toLocaleString()} GCS</p>
                                </div>
                                <button
                                    onClick={() => handleRedeem(item.cost, item.label)}
                                    disabled={gcsPoints < item.cost}
                                    style={{
                                        padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                        background: gcsPoints >= item.cost ? '#059669' : '#e2e8f0',
                                        color: gcsPoints >= item.cost ? '#fff' : '#94a3b8',
                                        border: 'none', cursor: gcsPoints >= item.cost ? 'pointer' : 'not-allowed',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Đổi
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div style={{ padding: 16 }}>
                        <p style={{ fontWeight: 800, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>Lịch sử giao dịch</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Tất cả giao dịch được ghi trên blockchain</p>

                        {history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                <History size={40} style={{ marginBottom: 8, opacity: .4 }} />
                                <p style={{ fontSize: 13 }}>Chưa có giao dịch nào</p>
                                <p style={{ fontSize: 11, marginTop: 4 }}>Thực hiện thanh toán để bắt đầu tích GCS</p>
                            </div>
                        ) : history.map(tx => (
                            <div key={tx.id} style={{
                                background: '#fff', borderRadius: 16, padding: '14px 16px',
                                marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                            background: tx.type === 'earn' ? '#f0fdf4' : '#faf5ff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {tx.type === 'earn' ? <Leaf size={18} color="#059669" /> : <Gift size={18} color="#7c3aed" />}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{tx.label}</p>
                                            {tx.amount > 0 && <p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{tx.amount.toLocaleString('vi-VN')} ₫</p>}
                                            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                                                {tx.hash?.slice(0, 14)}…
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 800, fontSize: 15, color: tx.gcs >= 0 ? '#059669' : '#7c3aed' }}>
                                            {tx.gcs >= 0 ? '+' : ''}{tx.gcs} GCS
                                        </p>
                                        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                            {tx.time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <span style={{ fontSize: 9, background: '#f0fdf4', color: '#059669', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                            ✓ On-chain
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* BLOCK TAB */}
                {activeTab === 'block' && (
                    <div style={{ padding: 16 }}>
                        <p style={{ fontWeight: 800, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>Blockchain Ledger</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Hyperledger Fabric · PBFT Consensus</p>

                        <div style={{ background: '#0f172a', borderRadius: 20, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>Hyperledger Fabric Node · Active</span>
                            </div>
                            <div style={{ padding: 16, overflowX: 'auto' }}>
                                {latestBlock ? (
                                    <pre style={{ color: '#6ee7b7', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                                        {JSON.stringify(latestBlock, null, 2)}
                                    </pre>
                                ) : (
                                    <p style={{ color: '#334155', fontSize: 12, fontFamily: 'monospace', animation: 'pulse 2s infinite' }}>
                                        {'>'} Waiting for transaction event via Kafka...{'\n'}
                                        {'>'} GCS Event Processor: ready{'\n'}
                                        {'>'} Validators: [BankA, NAPAS, CIC] online
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tier table */}
                        <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#1e293b' }}>Bậc hạng thành viên</p>
                            {TIERS.map(t => (
                                <div key={t.nameEn} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                                    background: tier.nameEn === t.nameEn ? t.bg : 'transparent',
                                    border: tier.nameEn === t.nameEn ? `1.5px solid ${t.color}40` : '1px solid transparent',
                                }}>
                                    <span style={{ fontSize: 16 }}>{tierEmoji[t.nameEn]}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{t.nameEn} — {t.nameVi}</p>
                                        <p style={{ fontSize: 10, color: '#64748b' }}>
                                            {t.max === Infinity ? `${t.min.toLocaleString()}+` : `${t.min.toLocaleString()} – ${t.max.toLocaleString()}`} GCS/năm
                                        </p>
                                    </div>
                                    {tier.nameEn === t.nameEn && <Star size={14} color={t.color} fill={t.color} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom navigation ── */}
            <div style={{
                position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 430, background: '#fff',
                borderTop: '1px solid #f1f5f9', display: 'flex',
                paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                boxShadow: '0 -4px 24px rgba(0,0,0,.08)',
            }}>
                {([
                    { key: 'home', icon: Leaf, label: 'Tích điểm' },
                    { key: 'market', icon: Gift, label: 'Đổi điểm' },
                    { key: 'history', icon: History, label: 'Lịch sử' },
                    { key: 'block', icon: TreePine, label: 'Blockchain' },
                ] as const).map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: '10px 0 6px', border: 'none', background: 'none',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: active ? '#f0fdf4' : 'transparent',
                                transition: 'background .2s',
                            }}>
                                <Icon size={18} color={active ? '#059669' : '#94a3b8'} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#059669' : '#94a3b8' }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <style>{`
                @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
                * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
                input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}