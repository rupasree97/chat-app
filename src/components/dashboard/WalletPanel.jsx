import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../utils/axios';

/* ═══════════════════════════════════════════════════════════════════
   Wallet Panel — Dropdown above UserControls
   ═══════════════════════════════════════════════════════════════════ */

const WalletPanel = ({ isOpen, onClose, walletBalance, anchorRef }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.get('/payments/history')
                .then(res => setTransactions(res.data.payments || []))
                .catch(() => setTransactions([]))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) &&
                anchorRef?.current && !anchorRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose, anchorRef]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'success': return { label: 'Paid', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ArrowUpRight };
            case 'refunded': return { label: 'Refunded', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: ArrowDownLeft };
            case 'pending': return { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock };
            default: return { label: status, color: 'text-[#949ba4]', bg: 'bg-[#2b2d31]', border: 'border-[#3f4147]', icon: Clock };
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-[9998] w-[320px] bg-[#111214] rounded-xl border border-[#2b2d31] shadow-2xl shadow-black/50 overflow-hidden"
                    style={{
                        bottom: anchorRef?.current
                            ? window.innerHeight - anchorRef.current.getBoundingClientRect().top + 8
                            : 60,
                        left: anchorRef?.current
                            ? anchorRef.current.getBoundingClientRect().left
                            : 16
                    }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#2b2d31] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-[#5865F2]" />
                            <span className="text-sm font-bold text-white">Wallet</span>
                        </div>
                        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-[#2b2d31] flex items-center justify-center text-[#949ba4] hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Balance Section */}
                    <div className="px-4 py-5 border-b border-[#2b2d31] bg-gradient-to-br from-[#111214] to-[#1a1b26]">
                        <p className="text-[10px] font-bold text-[#949ba4] uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-3xl font-black text-white">
                            <span className="text-[#949ba4] text-lg mr-0.5">₹</span>
                            {(walletBalance || 0).toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Transactions */}
                    <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2b2d31 transparent' }}>
                        {loading ? (
                            <div className="p-6 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-[#6d6f78] text-xs">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {transactions.map((tx, i) => {
                                    const cfg = getStatusConfig(tx.status);
                                    const StatusIcon = cfg.icon;
                                    return (
                                        <div
                                            key={tx._id || i}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e1f22] transition-colors"
                                        >
                                            <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                                                <StatusIcon size={14} className={cfg.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[#dbdee1] truncate">
                                                    {tx.status === 'refunded' ? 'Nitro Refund' : 'Nitro Subscription'}
                                                </p>
                                                <p className="text-[10px] text-[#6d6f78]">
                                                    {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-xs font-bold ${tx.status === 'refunded' ? 'text-green-400' : 'text-[#dbdee1]'}`}>
                                                    {tx.status === 'refunded' ? '+' : '-'}₹{tx.status === 'refunded' ? tx.refundAmount : tx.amount}
                                                </p>
                                                <span className={`text-[9px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default WalletPanel;
