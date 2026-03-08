import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Check, ChevronLeft, CreditCard, Smartphone, Building2, Shield,
    Star, Zap, Crown, Sparkles, Lock, ArrowRight, CheckCircle2,
    RefreshCw, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';

/* ════════════════════════════════════════════════════════
   SINGLE PLAN DATA
════════════════════════════════════════════════════════ */
const PLAN = {
    id: 'nitro',
    name: 'CyberChat Nitro',
    price: 199,
    period: 'month',
    color: '#5865F2',
    gradient: 'from-[#FF73FA] via-[#A855F7] to-[#5865F2]',
    glow: 'shadow-[0_0_40px_rgba(255,115,250,0.35)]',
    features: [
        { icon: <Crown size={14} />, text: 'Animated Profile Avatar' },
        { icon: <Crown size={14} />, text: 'Custom Profile Themes' },
        { icon: <Crown size={14} />, text: 'Exclusive Nitro Badge' },
        { icon: <Crown size={14} />, text: 'Extended Emoji Support' },
        { icon: <Crown size={14} />, text: 'Animated Profile Banner' },
        { icon: <Crown size={14} />, text: 'Profile Decorations' },
        { icon: <Crown size={14} />, text: '2 Server Boosts / Month' },
        { icon: <Crown size={14} />, text: '500MB Upload Limit' },
    ]
};

const BANKS = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
    'Canara Bank', 'IndusInd Bank', 'Yes Bank'
];

/* ════════════════════════════════════════════════════════
   STEP 1 — PLAN OVERVIEW (single card)
════════════════════════════════════════════════════════ */
const PlanOverview = ({ onSelect }) => (
    <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF73FA] to-[#5865F2] flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Crown size={32} className="text-white" />
                </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Upgrade to <span className="bg-gradient-to-r from-[#FF73FA] to-[#5865F2] bg-clip-text text-transparent">Nitro</span></h1>
            <p className="text-[#b5bac1] text-lg">Unlock the ultimate CyberChat experience</p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => onSelect(PLAN)}
            className={`relative rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300 border-[#FF73FA]/50 bg-gradient-to-br from-[#1a1b26] to-[#1e1f2e] ${PLAN.glow} max-w-md mx-auto`}
        >
            {/* Top bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${PLAN.gradient}`} />

            <div className="p-7">
                <h3 className="text-xl font-bold text-white mb-1">{PLAN.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">₹{PLAN.price}</span>
                    <span className="text-[#949ba4]">/{PLAN.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                    {PLAN.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#dbdee1] text-sm">
                            <span className="text-base">{f.icon}</span>
                            {f.text}
                        </li>
                    ))}
                </ul>

                <button className={`w-full py-3 rounded-xl font-bold text-white transition-all bg-gradient-to-r ${PLAN.gradient} hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2`}>
                    Subscribe to Nitro <ArrowRight size={18} />
                </button>
            </div>
        </motion.div>

        <p className="text-center text-[#6d6f78] text-xs mt-6">
            <Lock size={10} className="inline mr-1" />All payments are secured. Cancel anytime. Billed monthly.
        </p>
    </div>
);

/* ════════════════════════════════════════════════════════
   STEP 2 — PAYMENT METHOD
════════════════════════════════════════════════════════ */
const METHODS = [
    { id: 'card', icon: CreditCard, label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay & more' },
    { id: 'upi', icon: Smartphone, label: 'UPI', sub: 'GPay, PhonePe, BHIM & more' },
    { id: 'netbanking', icon: Building2, label: 'Net Banking', sub: '50+ banks supported' },
    { id: 'wallet', icon: Wallet, label: 'Mobile Wallet', sub: 'Paytm, Amazon Pay & more' },
];

const PaymentMethodSelect = ({ plan, onSelect }) => (
    <div className="max-w-lg mx-auto px-4 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Order summary */}
            <div className="bg-[#2b2d31] rounded-xl border border-[#3f4147] p-4 mb-6 flex items-center justify-between">
                <div>
                    <p className="text-[#b5bac1] text-xs uppercase tracking-wider mb-1">ORDER SUMMARY</p>
                    <p className="text-white font-bold">{plan.name}</p>
                    <p className="text-[#949ba4] text-sm">Monthly subscription</p>
                </div>
                <div className="text-2xl font-black text-white">₹{plan.price}</div>
            </div>

            <h2 className="text-xl font-bold text-white mb-4">Choose Payment Method</h2>

            <div className="space-y-3">
                {METHODS.map((m, idx) => {
                    const Icon = m.icon;
                    return (
                        <motion.button
                            key={m.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelect(m.id)}
                            className="w-full bg-[#2b2d31] hover:bg-[#313338] border border-[#3f4147] hover:border-[#5865F2] rounded-xl p-4 flex items-center gap-4 transition-all text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#1e1f22] flex items-center justify-center text-[#5865F2]">
                                <Icon size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">{m.label}</p>
                                <p className="text-[#949ba4] text-xs">{m.sub}</p>
                            </div>
                            <ArrowRight size={16} className="text-[#6d6f78]" />
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[#6d6f78] text-xs">
                <Lock size={12} />
                <span>256-bit SSL encrypted · PCI DSS compliant · Demo only</span>
            </div>
        </motion.div>
    </div>
);

/* ════════════════════════════════════════════════════════
   STEP 3A — CARD FORM
════════════════════════════════════════════════════════ */
const detectNetwork = (num) => {
    if (num.startsWith('4')) return { name: 'VISA', color: '#1A1F71' };
    if (/^5[1-5]/.test(num)) return { name: 'MC', color: '#EB001B' };
    if (/^6[0-9]/.test(num) || num.startsWith('6522')) return { name: 'RuPay', color: '#1A8C3B' };
    return { name: '', color: '#333' };
};

const CardForm = ({ plan, onPay }) => {
    const [form, setForm] = useState({ number: '', name: '', expiry: '', cvv: '', save: false });
    const [flip, setFlip] = useState(false);
    const [errors, setErrors] = useState({});

    const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExpiry = (v) => {
        const d = v.replace(/\D/g, '').slice(0, 4);
        return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    };

    const net = detectNetwork(form.number.replace(/\s/g, ''));

    const validate = () => {
        const e = {};
        if (form.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number';
        if (!form.name.trim()) e.name = 'Card holder name required';
        if (form.expiry.length < 5) e.expiry = 'Enter valid expiry date';
        if (form.cvv.length < 3) e.cvv = 'CVV must be 3-4 digits';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handlePay = () => { if (validate()) onPay(); };

    const maskedNum = form.number || '•••• •••• •••• ••••';

    return (
        <div className="max-w-md mx-auto px-4 w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Live Card Preview */}
                <div className="perspective-1000 mb-6 flex justify-center">
                    <motion.div
                        animate={{ rotateY: flip ? 180 : 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-[320px] h-[190px]"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1b2e] via-[#16213e] to-[#0f3460] p-6 flex flex-col justify-between relative">
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #5865F2 0%, transparent 50%),radial-gradient(circle at 20% 80%, #FF73FA 0%, transparent 50%)' }}
                                />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-white/60 text-[10px] tracking-widest uppercase">CyberChat Nitro</span>
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Shield size={16} className="text-white" />
                                        </div>
                                    </div>
                                    {net.name && <span className="text-white font-black text-lg tracking-wider">{net.name}</span>}
                                </div>
                                <div className="relative z-10">
                                    <p className="text-white font-mono text-lg tracking-[3px] mb-3">{maskedNum}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-white/50 text-[9px] uppercase tracking-wider">Card Holder</p>
                                            <p className="text-white text-sm font-medium uppercase">{form.name || 'YOUR NAME'}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-[9px] uppercase tracking-wider">Expires</p>
                                            <p className="text-white text-sm font-mono">{form.expiry || 'MM/YY'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1b2e] to-[#0f3460] flex flex-col justify-center">
                                <div className="h-10 bg-black/40 w-full mb-4" />
                                <div className="mx-6 bg-white/20 rounded p-2 flex justify-end items-center">
                                    <span className="text-white font-mono font-bold">{form.cvv || '•••'}</span>
                                </div>
                                <p className="text-white/40 text-[9px] text-center mt-4">Authorized Signature</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-1.5">Card Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={form.number}
                                onChange={e => setForm(p => ({ ...p, number: formatCard(e.target.value) }))}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                className={`w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 font-mono text-sm outline-none border transition-all ${errors.number ? 'border-red-500' : 'border-[#3f4147] focus:border-[#5865F2]'}`}
                            />
                            {net.name && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#949ba4]">{net.name}</span>}
                        </div>
                        {errors.number && <p className="text-red-400 text-xs mt-1">{errors.number}</p>}
                    </div>

                    <div>
                        <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-1.5">Card Holder Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="As printed on card"
                            className={`w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-sm outline-none border transition-all ${errors.name ? 'border-red-500' : 'border-[#3f4147] focus:border-[#5865F2]'}`}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-1.5">Expiry Date</label>
                            <input
                                type="text"
                                value={form.expiry}
                                onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                                placeholder="MM/YY"
                                maxLength={5}
                                className={`w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-sm outline-none border transition-all ${errors.expiry ? 'border-red-500' : 'border-[#3f4147] focus:border-[#5865F2]'}`}
                            />
                            {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                        </div>
                        <div>
                            <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-1.5">CVV</label>
                            <input
                                type="text"
                                value={form.cvv}
                                onFocus={() => setFlip(true)}
                                onBlur={() => setFlip(false)}
                                onChange={e => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                placeholder="•••"
                                maxLength={4}
                                className={`w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-sm outline-none border transition-all ${errors.cvv ? 'border-red-500' : 'border-[#3f4147] focus:border-[#5865F2]'}`}
                            />
                            {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                            onClick={() => setForm(p => ({ ...p, save: !p.save }))}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.save ? 'bg-[#5865F2] border-[#5865F2]' : 'border-[#4e5058]'}`}
                        >
                            {form.save && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-[#b5bac1] text-sm group-hover:text-white transition-colors">Save card for future payments</span>
                    </label>

                    <button
                        onClick={handlePay}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:opacity-90 transition-all shadow-lg shadow-[#5865F2]/30 flex items-center justify-center gap-2 mt-2"
                    >
                        <Lock size={16} /> Pay ₹{plan.price} Securely
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* ════════════════════════════════════════════════════════
   STEP 3B — UPI FORM
════════════════════════════════════════════════════════ */
const UpiForm = ({ plan, onPay }) => {
    const [upi, setUpi] = useState('');
    const [status, setStatus] = useState('idle'); // idle | verifying | verified | error

    const verifyUpi = () => {
        if (!upi.includes('@')) { toast.error('Enter a valid UPI ID like name@upi'); return; }
        setStatus('verifying');
        setTimeout(() => setStatus('verified'), 2000);
    };

    return (
        <div className="max-w-md mx-auto px-4 w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                            <Smartphone size={32} />
                        </div>
                    </div>
                    <h2 className="text-white font-bold text-xl">Pay via UPI</h2>
                    <p className="text-[#949ba4] text-sm">Enter your UPI ID to pay ₹{plan.price}</p>
                </div>

                <div className="bg-[#1e1f22] rounded-xl border border-[#3f4147] p-6 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={upi}
                            onChange={e => { setUpi(e.target.value); setStatus('idle'); }}
                            placeholder="yourname@upi"
                            className="w-full bg-[#2b2d31] text-white rounded-xl px-4 py-3 text-sm outline-none border border-[#3f4147] focus:border-[#5865F2] transition-all"
                        />
                        {status === 'verified' && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircle2 size={20} className="text-green-400" />
                            </motion.div>
                        )}
                    </div>

                    {status === 'idle' && (
                        <button onClick={verifyUpi} className="w-full py-3 rounded-xl font-medium text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all">
                            Verify UPI ID
                        </button>
                    )}

                    {status === 'verifying' && (
                        <div className="flex items-center justify-center gap-3 py-3">
                            <RefreshCw size={18} className="text-[#5865F2] animate-spin" />
                            <span className="text-[#b5bac1] text-sm">Verifying UPI ID...</span>
                        </div>
                    )}

                    {status === 'verified' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                                <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">{upi}</p>
                                    <p className="text-green-400 text-xs">UPI ID verified</p>
                                </div>
                            </div>
                            <button onClick={onPay} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:opacity-90 transition-all shadow-lg shadow-[#5865F2]/30">
                                Pay ₹{plan.price}
                            </button>
                        </motion.div>
                    )}
                </div>

                <div className="flex justify-center gap-6 text-[#949ba4] text-xs">
                    {['GPay', 'PhonePe', 'BHIM', 'Paytm'].map(app => (
                        <div key={app} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-[#2b2d31] flex items-center justify-center text-xs font-bold text-white border border-[#3f4147]">
                                {app[0]}
                            </div>
                            <span>{app}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

/* ════════════════════════════════════════════════════════
   STEP 3C — NET BANKING FORM
════════════════════════════════════════════════════════ */
const NetBankingForm = ({ plan, onPay }) => {
    const [bank, setBank] = useState('');
    const [stage, setStage] = useState('select'); // select | login | otp

    const [login, setLogin] = useState({ user: '', pass: '' });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleLogin = () => {
        if (!login.user || !login.pass) { toast.error('Enter credentials'); return; }
        setOtpSent(true);
        setTimeout(() => setStage('otp'), 1500);
    };

    const handleOtp = () => {
        if (otp.length < 4) { toast.error('Enter valid OTP'); return; }
        onPay();
    };

    return (
        <div className="max-w-md mx-auto px-4 w-full">
            <AnimatePresence mode="wait">
                {stage === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                                    <Building2 size={32} />
                                </div>
                            </div>
                            <h2 className="text-white font-bold text-xl">Net Banking</h2>
                            <p className="text-[#949ba4] text-sm">Select your bank to pay ₹{plan.price}</p>
                        </div>
                        <div>
                            <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-2">Select Bank</label>
                            <select
                                value={bank}
                                onChange={e => setBank(e.target.value)}
                                className="w-full bg-[#2b2d31] text-white rounded-xl px-4 py-3 text-sm outline-none border border-[#3f4147] focus:border-[#5865F2] transition-all"
                            >
                                <option value="">-- Choose your bank --</option>
                                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => bank && setStage('login')}
                            disabled={!bank}
                            className="w-full py-3 rounded-xl font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all disabled:opacity-40"
                        >
                            Proceed to Bank Login
                        </button>
                    </motion.div>
                )}

                {stage === 'login' && (
                    <motion.div key="login" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                        <div className="bg-[#2b2d31] rounded-xl border border-[#3f4147] p-1.5 flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                                <Building2 size={16} />
                            </div>
                            <span className="text-white text-sm font-medium">{bank}</span>
                        </div>
                        <h2 className="text-white font-bold text-lg">Enter Bank Credentials</h2>
                        <input
                            type="text"
                            value={login.user}
                            onChange={e => setLogin(p => ({ ...p, user: e.target.value }))}
                            placeholder="Customer ID / Username"
                            className="w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-sm outline-none border border-[#3f4147] focus:border-[#5865F2] transition-all"
                        />
                        <input
                            type="password"
                            value={login.pass}
                            onChange={e => setLogin(p => ({ ...p, pass: e.target.value }))}
                            placeholder="Password / IPIN"
                            className="w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-sm outline-none border border-[#3f4147] focus:border-[#5865F2] transition-all"
                        />
                        {otpSent ? (
                            <div className="flex items-center justify-center gap-2 text-[#b5bac1] text-sm">
                                <RefreshCw size={14} className="animate-spin text-[#5865F2]" /> Redirecting to OTP...
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="w-full py-3 rounded-xl font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all">
                                Login Securely
                            </button>
                        )}
                        <p className="text-center text-[#6d6f78] text-xs">This is a demo — no real credentials used</p>
                    </motion.div>
                )}

                {stage === 'otp' && (
                    <motion.div key="otp" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                                    <CheckCircle2 size={32} />
                                </div>
                            </div>
                            <h2 className="text-white font-bold text-xl">OTP Verification</h2>
                            <p className="text-[#949ba4] text-sm">Enter the OTP sent to your registered mobile</p>
                        </div>
                        <div>
                            <label className="block text-[#b5bac1] text-xs uppercase tracking-wider mb-2">6-Digit OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="• • • • • •"
                                maxLength={6}
                                className="w-full bg-[#1e1f22] text-white rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[12px] outline-none border border-[#3f4147] focus:border-[#5865F2] transition-all"
                            />
                            <p className="text-[#6d6f78] text-xs mt-1.5">Use any 6-digit number for demo</p>
                        </div>
                        <button onClick={handleOtp} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:opacity-90 transition-all">
                            Verify & Pay ₹{plan.price}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ════════════════════════════════════════════════════════
   STEP 4 — PROCESSING SCREEN
════════════════════════════════════════════════════════ */
const ProcessingScreen = ({ onDone }) => {
    const stages = ['Processing Payment...', 'Verifying Details...', 'Activating Subscription...', 'Finalizing...'];
    const [stageIdx, setStageIdx] = useState(0);

    useEffect(() => {
        const timers = stages.map((_, i) =>
            setTimeout(() => setStageIdx(i), i * 900)
        );
        const done = setTimeout(onDone, stages.length * 900 + 400);
        return () => { timers.forEach(clearTimeout); clearTimeout(done); };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="bg-[#1e1f22] rounded-2xl border border-[#3f4147] p-10 max-w-sm w-full mx-4 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-[#5865F2]/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5865F2] animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FF73FA] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.9s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={22} className="text-[#5865F2]" />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={stageIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-white font-bold text-lg mb-2"
                    >
                        {stages[stageIdx]}
                    </motion.p>
                </AnimatePresence>

                <p className="text-[#949ba4] text-sm">Please don't close this window</p>

                <div className="flex justify-center gap-1.5 mt-6">
                    {stages.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= stageIdx ? 'w-6 bg-[#5865F2]' : 'w-2 bg-[#3f4147]'}`} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

/* ════════════════════════════════════════════════════════
   STEP 5 — SUCCESS SCREEN
════════════════════════════════════════════════════════ */
const SuccessScreen = ({ plan }) => {
    const navigate = useNavigate();
    const txnId = 'CHN' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setDate(nextBilling.getDate() + 30);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto px-4 w-full">
            <div className="text-center mb-8">
                {/* Checkmark animation */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                        className="w-full h-full rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                    >
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </motion.div>
                </div>

                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-white mb-2">
                    Subscription Activated
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-[#949ba4] text-sm">
                    Your <span className="text-white font-semibold">{plan.name}</span> is now active.
                </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="bg-[#2b2d31] rounded-2xl border border-[#3f4147] overflow-hidden mb-6 shadow-xl">
                <div className="px-5 py-4 border-b border-[#3f4147] bg-[#313338]/50">
                    <h2 className="text-[#b5bac1] text-[10px] font-bold uppercase tracking-widest">Transaction Details</h2>
                </div>
                <div className="p-1">
                    {[
                        { label: 'Plan Name', value: plan.name },
                        { label: 'Amount Charged', value: `₹${plan.price}.00` },
                        { label: 'Transaction ID', value: txnId, isMono: true },
                        { label: 'Billing Date', value: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                        { label: 'Next Billing', value: nextBilling.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                        { label: 'Payment Status', value: 'Confirmed', isBadge: true },
                    ].map(({ label, value, isMono, isBadge }) => (
                        <div key={label} className="flex justify-between items-center px-4 py-3">
                            <span className="text-[#949ba4] text-xs">{label}</span>
                            {isBadge ? (
                                <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20 uppercase">
                                    {value}
                                </span>
                            ) : (
                                <span className={`text-[#dbdee1] text-sm font-medium ${isMono ? 'font-mono text-[11px] bg-[#1e1f22] px-2 py-1 rounded' : ''}`}>
                                    {value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="space-y-3">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF73FA] to-[#5865F2] hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                >
                    Start Using CyberChat
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3.5 rounded-xl font-bold text-[#b5bac1] bg-[#2b2d31] hover:bg-[#313338] border border-[#3f4147] hover:border-[#4e5058] transition-all"
                >
                    Manage Subscription
                </button>
            </motion.div>

            <p className="text-center text-[#6d6f78] text-[10px] mt-8 uppercase tracking-widest">
                Professional Billing Gateway · CyberChat securely handles your data
            </p>
        </motion.div>
    );
};

/* ════════════════════════════════════════════════════════
   MAIN CHECKOUT PAGE
════════════════════════════════════════════════════════ */
const NitroCheckout = () => {
    const navigate = useNavigate();
    const { currentUser, handleUserUpdated } = useAuth();

    const [step, setStep] = useState('plans');      // plans | method | form | processing | success
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setStep('method');
    };

    const handleSelectMethod = (method) => {
        setSelectedMethod(method);
        setStep('form');
    };

    const handlePay = () => {
        setStep('processing');
    };

    const handleProcessingDone = async () => {
        try {
            const res = await api.post('/payments/activate-nitro', {
                planType: 'nitro',
                amount: 199
            });
            if (res.data.user && handleUserUpdated) {
                handleUserUpdated(res.data.user);
            }
        } catch (e) {
            const nitroData = {
                isActive: true,
                planType: 'nitro',
                planName: 'CyberChat Nitro',
                activatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('dummy_nitro', JSON.stringify(nitroData));
        }
        setStep('success');
    };

    const stepTitles = {
        plans: 'CyberChat Nitro',
        method: 'Payment Method',
        form: 'Payment Details',
        success: 'Payment Successful'
    };

    const canGoBack = ['method', 'form'].includes(step);
    const handleBack = () => {
        if (step === 'method') setStep('plans');
        else if (step === 'form') setStep('method');
    };

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">
            {/* Header */}
            <div className="border-b border-[#2b2d31] bg-[#1e1f22]/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    {canGoBack ? (
                        <button onClick={handleBack} className="w-8 h-8 rounded-full bg-[#2b2d31] hover:bg-[#3f4147] flex items-center justify-center text-[#b5bac1] transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                    ) : (
                        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-full bg-[#2b2d31] hover:bg-[#3f4147] flex items-center justify-center text-[#b5bac1] transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-[#FF73FA]" />
                        <span className="text-white font-bold text-sm">CyberChat Nitro</span>
                    </div>
                    {step !== 'success' && step !== 'plans' && (
                        <div className="ml-auto flex items-center gap-1.5 text-[#6d6f78] text-xs">
                            <Lock size={12} /> Secure Checkout
                        </div>
                    )}
                </div>
                {/* Step progress bar */}
                {step !== 'success' && (
                    <div className="h-0.5 bg-[#2b2d31]">
                        <div className={`h-full bg-gradient-to-r from-[#FF73FA] to-[#5865F2] transition-all duration-700 ${step === 'plans' ? 'w-1/3' : step === 'method' ? 'w-2/3' : 'w-full'}`} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center py-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="w-full"
                    >
                        {step === 'plans' && <PlanOverview onSelect={handleSelectPlan} />}
                        {step === 'method' && <PaymentMethodSelect plan={selectedPlan} onSelect={handleSelectMethod} />}
                        {step === 'form' && selectedMethod === 'card' && <CardForm plan={selectedPlan} onPay={handlePay} />}
                        {step === 'form' && selectedMethod === 'upi' && <UpiForm plan={selectedPlan} onPay={handlePay} />}
                        {step === 'form' && selectedMethod === 'netbanking' && <NetBankingForm plan={selectedPlan} onPay={handlePay} />}
                        {step === 'form' && selectedMethod === 'wallet' && <UpiForm plan={selectedPlan} onPay={handlePay} />}
                        {step === 'success' && <SuccessScreen plan={selectedPlan} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {step === 'processing' && <ProcessingScreen onDone={handleProcessingDone} />}
        </div>
    );
};

export default NitroCheckout;
