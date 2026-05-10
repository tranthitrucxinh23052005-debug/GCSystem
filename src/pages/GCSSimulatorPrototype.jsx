import React, { useState } from 'react';

import { calculateGCS, getTierFromPoints } from '../lib/gcsEngine';
import { buildBlock } from '../lib/blockchainMock';
import { Send, Gift, TreePine, Leaf, History, CheckCircle2 } from 'lucide-react';

export default function GCSSimulatorPrototype() {
    // Giả lập 2 tài khoản ngân hàng
    const [accountA, setAccountA] = useState({
        id: 'TX_ACC_001',
        name: 'Tài khoản Nguồn (TX)',
        balance: 5000000,
        gcsPoints: 1250,
        tier: 'Sprout'
    });

    const [accountB, setAccountB] = useState({
        id: 'SHOP_002',
        name: 'Tài khoản Đích (Cửa hàng)',
        balance: 10000000
    });

    // State cho UI
    const [transferAmount, setTransferAmount] = useState(500000);
    const [activeStep, setActiveStep] = useState(0);
    const [latestBlock, setLatestBlock] = useState(/** @type {any} */(null));

    const [showNotification, setShowNotification] = useState(false);
    const [earnedGcs, setEarnedGcs] = useState(0);

    const handleTransfer = () => {
        setActiveStep(1); // Bước 1: Tích điểm

        // Trừ tiền TK A, cộng tiền TK B
        setAccountA(prev => ({ ...prev, balance: prev.balance - transferAmount }));
        setAccountB(prev => ({ ...prev, balance: prev.balance + transferAmount }));

        // Tính toán GCS (Loại GD: transfer - hệ số 0.8)
        const gcsResult = calculateGCS(transferAmount, 'transfer', 0);
        setEarnedGcs(gcsResult.totalGCS);

        setTimeout(() => {
            // Cập nhật điểm cho Account A
            const newTotalGcs = accountA.gcsPoints + gcsResult.totalGCS;
            const newTier = getTierFromPoints(newTotalGcs);

            setAccountA(prev => ({
                ...prev,
                gcsPoints: newTotalGcs,
                tier: newTier.nameEn
            }));

            // Bước 2: Thông báo
            setActiveStep(2);
            setShowNotification(true);

            // Tạo Mock Blockchain Block
            const mockTx = {
                id: Math.random().toString(16).slice(2, 10),
                amount: transferAmount,
                type: 'TRANSFER',
                gcs_points_earned: gcsResult.totalGCS,
                multiplier_applied: gcsResult.typeMultiplier * gcsResult.timeMultiplier,
                merchant_name: 'Cửa hàng Đích'
            };

            const block = buildBlock(mockTx, accountA.id);
            setLatestBlock(block);

            setTimeout(() => setShowNotification(false), 4000);
        }, 1500);
    };

    const handleRedeem = () => {
        setActiveStep(4); // Bước 4: Đổi điểm
        if (accountA.gcsPoints >= 1000) {
            setAccountA(prev => ({ ...prev, gcsPoints: prev.gcsPoints - 1000 }));

            // Tạo block giao dịch REDEEM
            const mockRedeemTx = {
                id: Math.random().toString(16).slice(2, 10),
                amount: 0,
                type: 'REDEEM',
                gcs_points_earned: -1000,
                multiplier_applied: 1,
                merchant_name: 'Shopee Voucher'
            };
            setLatestBlock(buildBlock(mockRedeemTx, accountA.id));
            setActiveStep(5); // Bước 5: Sử dụng
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen font-sans">
            <h1 className="text-3xl font-bold text-emerald-600 mb-8 flex items-center gap-3">
                <TreePine className="w-8 h-8" />
                Prototype Hành Trình GCS
            </h1>

            {/* Thông báo dạng Push Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 bg-emerald-500 text-white p-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-3 z-50">
                    <Leaf className="w-6 h-6" />
                    <div>
                        <p className="font-bold">Nhận thành công {earnedGcs} GCS!</p>
                        <p className="text-sm opacity-90">Từ giao dịch chuyển khoản. Số dư: {accountA.gcsPoints} GCS</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PANEL: Giả lập 2 Tài Khoản */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Tài Khoản Nguồn</h2>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm text-slate-500">{accountA.id}</p>
                                <p className="text-2xl font-bold">{accountA.balance.toLocaleString('vi-VN')} ₫</p>
                            </div>
                            <div className="text-right">
                                <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                                    <Leaf className="w-4 h-4" /> {accountA.gcsPoints} GCS
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Bậc: {accountA.tier}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <label className="block text-sm font-medium mb-2">Chuyển tiền đến TK Đích</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                                    className="flex-1 border rounded-lg px-3 py-2"
                                />
                                <button
                                    onClick={handleTransfer}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Send className="w-4 h-4" /> Chuyển
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Tài Khoản Đích</h2>
                        <div>
                            <p className="text-sm text-slate-500">{accountB.id}</p>
                            <p className="text-2xl font-bold text-slate-700">{accountB.balance.toLocaleString('vi-VN')} ₫</p>
                        </div>
                    </div>
                </div>

                {/* PANEL: Marketplace & Blockchain Record */}
                <div className="space-y-6">
                    {/* Marketplace Mini */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 bg-gradient-to-br from-white to-emerald-50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Gift className="w-5 h-5 text-emerald-600" /> GCS Marketplace
                            </h2>
                        </div>
                        <div className="bg-white p-4 rounded-xl border">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold">Voucher Shopee 100K</p>
                                    <p className="text-sm text-slate-500">Mua sắm online</p>
                                </div>
                                <button
                                    onClick={handleRedeem}
                                    disabled={accountA.gcsPoints < 1000}
                                    className="bg-emerald-500 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                >
                                    Đổi 1.000 GCS
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sổ cái Blockchain */}
                    <div className="bg-slate-900 text-green-400 p-6 rounded-2xl shadow-inner overflow-hidden font-mono text-sm relative">
                        <div className="absolute top-4 right-4 text-slate-500 flex items-center gap-1">
                            <History className="w-4 h-4" /> Ledger
                        </div>
                        <h2 className="text-slate-100 mb-4 font-bold">Hyperledger Fabric Record</h2>
                        {latestBlock ? (
                            <pre className="whitespace-pre-wrap break-words text-xs">
                                {JSON.stringify(latestBlock, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-slate-500 animate-pulse">Waiting for transaction event via Kafka...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}