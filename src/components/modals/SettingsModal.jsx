import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, LogOut, Camera, Upload, ZoomIn, ZoomOut, Sparkles, MonitorSmartphone, CreditCard, Calendar, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import Avatar from '../ui/Avatar';
import DeleteAccountModal from './DeleteAccountModal';
import { PremiumNitroOverlay } from '../ui/ProfilePopCard';
import { toast } from 'react-hot-toast';

const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-[#3BA55D]' },
    { value: 'idle', label: 'Idle', color: 'bg-[#FAA61A]' },
    { value: 'dnd', label: 'Do Not Disturb', color: 'bg-[#ED4245]' },
    { value: 'offline', label: 'Invisible', color: 'bg-[#747F8D]' },
];

const bannerPresets = [
    '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
    '#3BA55D', '#FAA61A', '#9B59B6', '#1ABC9C', '#E74C3C',
    '#2ECC71', '#E67E22',
];

import ImageCropper from '../ui/ImageCropper';

/* ═══════════════════════════════════════════════════════════════════
   Settings Modal
   ═══════════════════════════════════════════════════════════════════ */

const SettingsModal = ({ isOpen, onClose }) => {
    const { currentUser, updateProfile, logout, handleUserUpdated } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('account');

    // Edit fields
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerColor, setBannerColor] = useState('#5865F2');
    const [status, setStatus] = useState('online');
    const [profileEffects, setProfileEffects] = useState({});
    const [selectedProfileTheme, setSelectedProfileTheme] = useState('none');
    const [saved, setSaved] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Subscription UI State
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundInfo, setRefundInfo] = useState(null);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundProcessing, setRefundProcessing] = useState(false);

    // Cropper state
    const [cropperSrc, setCropperSrc] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setBio(currentUser.bio || '');
            setAvatarUrl(currentUser.avatar || '');
            setBannerColor(currentUser.bannerColor || '#5865F2');
            setStatus(currentUser.status || 'online');

            setProfileEffects(currentUser.profileEffects || { animatedAvatar: false, animatedBanner: false, profileGlow: false, decoration: "", accentColor: "" });
            setSelectedProfileTheme(currentUser.selectedProfileTheme || 'none');
        }
    }, [currentUser, isOpen]);

    const handleSave = () => {
        updateProfile({
            username: username.trim() || currentUser.username,
            bio,
            avatar: avatarUrl,
            bannerColor,
            status,
            profileEffects,
            selectedProfileTheme
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleLogout = () => {
        if (socket) socket.disconnect();
        logout();
        onClose();
        navigate('/');
    };

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, onClose]);

    // File upload handler
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => setCropperSrc(reader.result);
        reader.readAsDataURL(file);

        // Reset so same file can be re-selected
        e.target.value = '';
    };

    // Drag & drop handler
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => setCropperSrc(reader.result);
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCrop = (croppedDataUrl) => {
        setAvatarUrl(croppedDataUrl);
        setCropperSrc(null);
    };

    const handleSubscribe = async (planType) => {
        try {
            setIsSubscribing(true);

            // 1. Create Razorpay order on backend
            const { data } = await api.post('/payments/create-order', { planType });
            const { orderId, amount, currency, keyId } = data;

            // 2. Dynamically load Razorpay JS SDK if not already loaded
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            // 3. Open Razorpay checkout popup
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'CyberChat Nitro',
                description: planType === 'monthly' ? 'Monthly Plan - ₹419/mo' : 'Yearly Plan - ₹4149/yr',
                order_id: orderId,
                theme: { color: '#5865F2' },
                prefill: {
                    email: currentUser?.email || '',
                    name: currentUser?.username || ''
                },
                handler: async (response) => {
                    // 4. Payment succeeded → verify on backend to activate Nitro
                    try {
                        const verifyRes = await api.post('/payments/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planType
                        });

                        if (verifyRes.data.user) {
                            // Update auth context with fresh user (Nitro now active)
                            updateProfile({}); // triggers re-fetch
                            window.location.reload();
                        }
                    } catch (verifyErr) {
                        console.error('Payment verification error:', verifyErr);
                        alert(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
                    } finally {
                        setIsSubscribing(false);
                    }
                },
                modal: {
                    ondismiss: () => setIsSubscribing(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Subscription Error:', error);
            alert(error.response?.data?.message || 'Failed to start checkout');
            setIsSubscribing(false);
        }
    };

    const handleOpenRefundModal = async () => {
        try {
            setRefundLoading(true);
            setShowRefundModal(true);
            const { data } = await api.post('/payments/request-refund');
            setRefundInfo(data);
        } catch (error) {
            console.error('Refund check error:', error);
            setRefundInfo({ eligible: false, message: error.response?.data?.message || 'Failed to check refund eligibility' });
        } finally {
            setRefundLoading(false);
        }
    };

    const handleProcessRefund = async () => {
        try {
            setRefundProcessing(true);
            const { data } = await api.post('/payments/process-refund');
            toast.success(data.message);
            if (data.user && handleUserUpdated) {
                handleUserUpdated(data.user);
            }
            setShowRefundModal(false);
            setRefundInfo(null);
        } catch (error) {
            console.error('Refund process error:', error);
            toast.error(error.response?.data?.message || 'Failed to process refund');
        } finally {
            setRefundProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your Nitro subscription without requesting a refund?')) return;
        try {
            setIsCanceling(true);
            const { data } = await api.delete('/payments/cancel-subscription');
            toast.success(data.message);
            window.location.reload();
        } catch (error) {
            console.error('Cancellation Error:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        } finally {
            setIsCanceling(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'My Account', icon: User },
        { id: 'profile', label: 'Edit Profile', icon: Camera },
        { id: 'nitro', label: 'Nitro', icon: Sparkles, highlight: true },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

                        {/* Panel — full screen on mobile, centered modal on desktop */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-xl flex flex-col md:flex-row bg-[#313338] shadow-2xl overflow-hidden z-10"
                        >
                            {/* Close button — on panel level, never interferes with scroll content */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#404249] flex items-center justify-center text-[#b5bac1] hover:text-white transition-colors z-20"
                            >
                                <X size={18} />
                            </button>
                            {/* ── Left Nav ── */}
                            <div className="w-full md:w-52 bg-[#2b2d31] flex flex-row md:flex-col flex-shrink-0 h-auto md:h-full overflow-x-auto md:overflow-y-auto border-b md:border-r border-[#1e1f22]"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                <div className="p-3 md:py-6 flex flex-row md:flex-col gap-2 md:gap-0 w-max md:w-full">
                                    <h3 className="hidden md:block text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2.5 mb-2">
                                        User Settings
                                    </h3>

                                    {tabs.map(tab => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded-md text-sm mb-0 md:mb-0.5 transition-colors whitespace-nowrap ${activeTab === tab.id
                                                    ? 'bg-[#404249] text-white'
                                                    : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
                                                    } ${tab.highlight && activeTab !== tab.id ? 'text-[#FF73FA] hover:text-[#FF73FA]' : ''}`}
                                            >
                                                <Icon size={16} />
                                                {tab.label}
                                            </button>
                                        );
                                    })}

                                    <div className="hidden md:block h-px bg-[#3f4147] my-2 mx-2" />

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-3 py-2 md:px-2.5 md:py-1.5 rounded-md text-sm text-[#da373c] hover:bg-[#da373c]/10 transition-colors whitespace-nowrap"
                                    >
                                        <LogOut size={16} />
                                        <span className="md:inline">Log Out</span>
                                    </button>
                                </div>
                            </div>

                            {/* ── Content Area ── (scrollable, constrained to viewport) */}
                            <div className="flex-1 h-full overflow-y-auto"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #313338' }}
                            >
                                <div className="px-8 pb-8 pt-14">
                                    {/* ═══════ My Account ═══════ */}
                                    {activeTab === 'account' && currentUser && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-6">My Account</h2>

                                            <div className="rounded-lg overflow-hidden bg-[#1e1f22]">
                                                <div className="h-24 w-full" style={{ backgroundColor: bannerColor }} />
                                                <div className="px-4 pb-4 -mt-8">
                                                    <div className="flex items-end justify-between mb-4">
                                                        <div className="w-[80px] h-[80px] rounded-full border-[6px] border-[#1e1f22] overflow-hidden">
                                                            <Avatar
                                                                src={currentUser.avatar}
                                                                username={currentUser.username}
                                                                size="2xl"
                                                                status={currentUser.status}
                                                                className="!w-full !h-full"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveTab('profile')}
                                                            className="px-4 py-1.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm text-white font-medium transition-colors"
                                                        >
                                                            Edit Profile
                                                        </button>
                                                    </div>

                                                    <div className="bg-[#2b2d31] rounded-lg p-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-1">Username</h4>
                                                                <p className="text-sm text-white">{currentUser.username}<span className="text-[#949ba4]">#{currentUser.id.slice(-4)}</span></p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-1">Email</h4>
                                                                <p className="text-sm text-white">{currentUser.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 🔴 Danger Zone 🔴 */}
                                            <div className="mt-8 border-t border-[#3f4147] pt-6">
                                                <h3 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-4">Danger Zone</h3>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-[#dbdee1] mb-1">Delete Account</h4>
                                                        <p className="text-xs text-[#949ba4]">This action is permanent and cannot be undone. All your data will be wiped.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowDeleteModal(true)}
                                                        className="px-4 py-2 rounded-md border border-[#da373c] text-[#da373c] hover:bg-[#da373c] hover:text-white text-sm font-medium transition-colors whitespace-nowrap ml-4 flex-shrink-0"
                                                    >
                                                        Delete Account
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══════ Edit Profile ═══════ */}
                                    {activeTab === 'profile' && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

                                            <div className="flex gap-8 flex-wrap">
                                                {/* Left: fields */}
                                                <div className="space-y-5 flex-1 min-w-[280px]">
                                                    {/* Avatar Upload */}
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">
                                                            Avatar
                                                        </label>
                                                        <div
                                                            className="flex items-center gap-4"
                                                            onDrop={handleDrop}
                                                            onDragOver={handleDragOver}
                                                        >
                                                            <div className="relative group">
                                                                <Avatar
                                                                    src={avatarUrl}
                                                                    username={username}
                                                                />
                                                                {/* Upload overlay */}
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <Camera size={18} className="text-white" />
                                                                </button>
                                                            </div>
                                                            <div className="flex-1">
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm text-white font-medium transition-colors"
                                                                >
                                                                    <Upload size={14} />
                                                                    Upload Image
                                                                </button>
                                                                <p className="text-[11px] text-[#949ba4] mt-1.5">
                                                                    JPG, PNG or GIF. Drag & drop or click. Max 4MB.
                                                                </p>
                                                            </div>
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                            />
                                                        </div>
                                                        {avatarUrl && avatarUrl.startsWith('data:') && (
                                                            <button
                                                                onClick={() => setAvatarUrl('')}
                                                                className="text-[11px] text-[#da373c] hover:underline mt-1.5"
                                                            >
                                                                Remove avatar
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Username */}
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Username</label>
                                                        <input
                                                            type="text"
                                                            value={username}
                                                            onChange={e => setUsername(e.target.value)}
                                                            className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#5865F2] border border-[#1e1f22] focus:border-[#5865F2] transition-colors"
                                                        />
                                                    </div>

                                                    {/* Bio */}
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">About Me</label>
                                                        <textarea
                                                            value={bio}
                                                            onChange={e => setBio(e.target.value)}
                                                            rows={3}
                                                            maxLength={190}
                                                            placeholder="Tell others about yourself..."
                                                            className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#5865F2] border border-[#1e1f22] focus:border-[#5865F2] resize-none transition-colors placeholder:text-[#6d6f78]"
                                                        />
                                                        <span className="text-[11px] text-[#949ba4]">{bio.length}/190</span>
                                                    </div>

                                                    {/* Banner Color */}
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Banner Color</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {bannerPresets.map(color => (
                                                                <button
                                                                    key={color}
                                                                    onClick={() => setBannerColor(color)}
                                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${bannerColor === color
                                                                        ? 'border-white scale-110'
                                                                        : 'border-transparent hover:border-[#949ba4]'
                                                                        }`}
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Status</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {statusOptions.map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    onClick={() => setStatus(opt.value)}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${status === opt.value
                                                                        ? 'bg-[#404249] text-white'
                                                                        : 'bg-[#1e1f22] text-[#b5bac1] hover:bg-[#35373c]'
                                                                        }`}
                                                                >
                                                                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Profile Themes Selector */}
                                                    <div className="pt-4 border-t border-[#313338]">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="text-[11px] font-bold text-[#b5bac1] uppercase">Premium Profile Themes</label>
                                                            {!currentUser?.nitro?.isActive && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF73FA] bg-[#FF73FA]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                    <Sparkles size={10} /> Nitro Required
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-5 gap-2 relative">
                                                            {/* If no nitro, show a lock overlay over the themes */}
                                                            {!currentUser?.nitro?.isActive && (
                                                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg border border-[#FF73FA]/30">
                                                                    <Sparkles size={20} className="text-[#FF73FA] mb-1" />
                                                                    <p className="text-white text-xs font-bold text-center px-4">Unlock animated themes<br />with Nitro</p>
                                                                    <button
                                                                        onClick={() => { onClose(); navigate('/nitro-checkout'); }}
                                                                        className="mt-2 text-[11px] bg-[#FF73FA] text-white px-3 py-1 rounded font-bold hover:bg-[#ff8afb] transition-colors"
                                                                    >
                                                                        Subscribe
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {[
                                                                { id: 'none', label: 'None', preview: 'bg-[#2b2d31]' },
                                                                { id: 'dinosaur', label: 'Dinosaur', preview: 'bg-gradient-to-br from-[#1a3320] to-[#0f1c13]' },
                                                                { id: 'unicorn', label: 'Unicorn', preview: 'bg-gradient-to-br from-[#ffb6c1] to-[#b0e0e6]' },
                                                                { id: 'alien', label: 'Alien', preview: 'bg-gradient-to-br from-[#0a0a0c] to-[#00ff8033]' },
                                                                { id: 'blackhole', label: 'Black Hole', preview: 'bg-radial-gradient from-[#30154d] to-black' }
                                                            ].map(t => (
                                                                <button
                                                                    key={t.id}
                                                                    onClick={() => currentUser?.nitro?.isActive && setSelectedProfileTheme(t.id)}
                                                                    disabled={!currentUser?.nitro?.isActive}
                                                                    className={`flex flex-col items-center gap-1.5 focus:outline-none group ${!currentUser?.nitro?.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <div
                                                                        className={`w-full aspect-[4/5] rounded-md transition-all relative overflow-hidden flex items-center justify-center ${t.preview} ${selectedProfileTheme === t.id ? 'border-2 border-white ring-2 ring-[#5865F2] scale-105 z-10' : 'border border-[#1e1f22] opacity-80 group-hover:opacity-100 group-hover:border-[#949ba4]'}`}
                                                                        style={t.id === 'blackhole' ? { background: 'radial-gradient(circle at center, #30154d 0%, black 100%)' } : {}}
                                                                    >
                                                                        {t.id !== 'none' && <Sparkles size={12} className="text-white/50 absolute top-1 right-1" />}
                                                                    </div>
                                                                    <span className={`text-[10px] text-center ${selectedProfileTheme === t.id ? 'text-white font-bold' : 'text-[#949ba4]'}`}>
                                                                        {t.label}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Save */}
                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button
                                                            onClick={handleSave}
                                                            className="px-6 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm font-medium text-white transition-colors"
                                                        >
                                                            {saved ? '✓ Saved!' : 'Save Changes'}
                                                        </button>
                                                        <button
                                                            onClick={onClose}
                                                            className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white hover:underline transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Right: live preview */}
                                                <div className="w-[340px] flex-shrink-0">
                                                    <h3 className="text-[11px] font-bold text-[#b5bac1] uppercase mb-3">Preview</h3>
                                                    {/* Mirrors ProfilePopCard exactly */}
                                                    <div className="rounded-[16px] overflow-hidden w-[340px] h-[420px] bg-[#111214] border border-[#1e1f22] flex flex-col shadow-2xl">
                                                        {/* Static Banner */}
                                                        <div className="w-full h-[120px] flex-shrink-0" style={{ backgroundColor: bannerColor }} />

                                                        {/* Lower Profile Body */}
                                                        <div className="flex-1 relative flex flex-col pb-[16px] overflow-hidden rounded-b-[16px]">

                                                            {/* Live Preview Nitro Theme Overlay */}
                                                            {currentUser?.nitro?.isActive && selectedProfileTheme !== 'none' && (
                                                                <>
                                                                    <PremiumNitroOverlay theme={selectedProfileTheme} />
                                                                    <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />
                                                                </>
                                                            )}

                                                            {/* Avatar overlap exactly 50% (54px overlap of 108px container) */}
                                                            <div className="relative -mt-[54px] ml-[16px] w-[108px] h-[108px] rounded-full border-[6px] border-[#111214] bg-[#111214] z-[10] flex items-center justify-center">
                                                                <Avatar
                                                                    src={avatarUrl}
                                                                    username={username}
                                                                    size="3xl"
                                                                    status={status}
                                                                    isNitro={currentUser?.nitro?.isActive}
                                                                    profileEffects={profileEffects}
                                                                />
                                                            </div>

                                                            {/* Info */}
                                                            <div className="relative z-[10] px-[16px] pt-[12px] flex-1 overflow-y-auto preview-scroll">
                                                                <style>{`
                                                                    .preview-scroll::-webkit-scrollbar { width: 4px; }
                                                                    .preview-scroll::-webkit-scrollbar-track { background: transparent; }
                                                                    .preview-scroll::-webkit-scrollbar-thumb { background: #2b2d31; border-radius: 10px; }
                                                                `}</style>
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                                    <p className="text-[20px] font-bold text-[#f2f3f5] leading-tight">{username}</p>
                                                                    <span className="text-[14px] text-[#949ba4] font-medium mr-1">#{currentUser?.id.slice(-4)}</span>
                                                                    {/* Fake Nitro Badge mapping preview logic */}
                                                                    {currentUser?.nitro?.isActive && (
                                                                        <div className="group relative ml-0.5">
                                                                            <div className="bg-[#2b2d31] p-1.5 rounded-md flex items-center justify-center relative cursor-default z-10 overflow-hidden">
                                                                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF73FA]/0 via-[#FF73FA]/20 to-[#FF73FA]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                                <Sparkles className="text-[#FF73FA] relative z-10 drop-shadow-[0_0_8px_rgba(255,115,250,0.5)] group-hover:scale-110 transition-transform duration-300" size={14} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-[12px]">
                                                                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${status === 'online' ? 'bg-[#23a559]' : status === 'idle' ? 'bg-[#f0b232]' : status === 'dnd' ? 'bg-[#f23f43]' : 'bg-[#80848e]'}`} />
                                                                    <span className="text-[14px] text-[#dbdee1] font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                                                </div>
                                                                <div className="h-[1px] bg-[#2b2d31] mb-[12px]" />
                                                                {bio && (
                                                                    <div className="mb-[12px]">
                                                                        <h4 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-[8px]">About Me</h4>
                                                                        <p className="text-[14px] text-[#dbdee1] leading-relaxed whitespace-pre-wrap word-break">{bio}</p>
                                                                    </div>
                                                                )}
                                                                <div className="mb-[12px]">
                                                                    <h4 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-[8px]">Member Since</h4>
                                                                    <p className="text-[14px] text-[#dbdee1]">Oct 15, 2023</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══════ Nitro Features ═══════ */}
                                    {activeTab === 'nitro' && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles className="text-[#FF73FA]" size={24} />
                                                <h2 className="text-xl font-bold text-white">Nitro Features</h2>
                                            </div>

                                            {!currentUser?.nitro?.isActive ? (
                                                <div className="space-y-5">
                                                    {/* Hero card */}
                                                    <div className="relative rounded-2xl overflow-hidden border border-[#FF73FA]/20">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0e17] via-[#1a0d2e] to-[#1e1522]" />
                                                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #FF73FA 0%, transparent 40%), radial-gradient(circle at 20% 80%, #5865F2 0%, transparent 50%)' }} />
                                                        <div className="relative p-8 text-center">
                                                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF73FA] to-[#5865F2] flex items-center justify-center shadow-xl shadow-purple-500/30">
                                                                <Sparkles size={36} className="text-white" />
                                                            </div>
                                                            <h3 className="text-2xl font-black text-white mb-2">Unlock <span className="bg-gradient-to-r from-[#FF73FA] to-[#5865F2] bg-clip-text text-transparent">Nitro</span></h3>
                                                            <p className="text-[#b5bac1] text-sm max-w-xs mx-auto mb-6">Animated avatars, custom themes, server boosts, exclusive badges &amp; more!</p>

                                                            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mb-6 text-left">
                                                                {['🎭 Animated Avatar', '🎨 Custom Themes', '🖼️ Profile Banner', '💎 Nitro Badge', '🚀 Server Boosts', '📦 500MB Uploads'].map(f => (
                                                                    <div key={f} className="text-[#b5bac1] text-xs flex items-center gap-1.5">
                                                                        <span>{f}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <button
                                                                onClick={() => { onClose(); navigate('/nitro-checkout'); }}
                                                                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF73FA] to-[#5865F2] hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 text-sm inline-flex items-center gap-2"
                                                            >
                                                                ⭐ Subscribe to Nitro
                                                            </button>

                                                            <p className="text-[#6d6f78] text-xs mt-3">₹199/month · Cancel anytime</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="bg-[#1e1f22] rounded-lg p-6 border border-[#FF73FA]/30">
                                                        <div className="flex items-start justify-between mb-6 border-b border-[#313338] pb-4">
                                                            <div>
                                                                <h3 className="text-[#FF73FA] font-bold flex items-center gap-2 mb-1">
                                                                    <Sparkles size={16} /> Active CyberChat Nitro
                                                                </h3>
                                                                <p className="text-[#b5bac1] text-sm mt-1">₹199 / month</p>
                                                                <p className="text-[#b5bac1] text-sm flex items-center gap-1.5 mt-2">
                                                                    <Calendar size={14} className="text-[#949ba4]" />
                                                                    Renews on: <strong className="text-white">{new Date(currentUser.nitro.expiresAt).toLocaleDateString()}</strong>
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={handleOpenRefundModal}
                                                                disabled={isCanceling}
                                                                className="px-4 py-2 bg-transparent hover:bg-[#da373c]/10 text-[#da373c] border border-[#da373c]/50 hover:border-[#da373c] text-sm font-medium rounded transition-colors disabled:opacity-50"
                                                            >
                                                                Cancel Subscription
                                                            </button>
                                                        </div>

                                                        {/* Toggle item 1 */}
                                                        <div className="flex items-center justify-between py-3 border-b border-[#313338]">
                                                            <div>
                                                                <h4 className="text-white font-medium text-sm">Animated Avatar</h4>
                                                                <p className="text-[#949ba4] text-xs mt-1">Allow your uploaded GIF or WebP to play on your profile.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setProfileEffects(prev => ({ ...prev, animatedAvatar: !prev.animatedAvatar }))}
                                                                className={`w-10 h-6 rounded-full transition-colors relative ${profileEffects.animatedAvatar ? 'bg-[#3BA55D]' : 'bg-[#80848E]'}`}
                                                            >
                                                                <div className={`absolute top-1 max-w-[16px] w-4 h-4 rounded-full bg-white transition-transform ${profileEffects.animatedAvatar ? 'left-5' : 'left-1'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Toggle item 2 */}
                                                        <div className="flex items-center justify-between py-3 border-b border-[#313338]">
                                                            <div>
                                                                <h4 className="text-white font-medium text-sm">Animated Banner</h4>
                                                                <p className="text-[#949ba4] text-xs mt-1">Enable shimmering motion on your profile banner.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setProfileEffects(prev => ({ ...prev, animatedBanner: !prev.animatedBanner }))}
                                                                className={`w-10 h-6 rounded-full transition-colors relative ${profileEffects.animatedBanner ? 'bg-[#3BA55D]' : 'bg-[#80848E]'}`}
                                                            >
                                                                <div className={`absolute top-1 max-w-[16px] w-4 h-4 rounded-full bg-white transition-transform ${profileEffects.animatedBanner ? 'left-5' : 'left-1'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Toggle item 3 */}
                                                        <div className="flex items-center justify-between py-3 border-b border-[#313338]">
                                                            <div>
                                                                <h4 className="text-white font-medium text-sm">Profile Glow</h4>
                                                                <p className="text-[#949ba4] text-xs mt-1">Apply a subtle, elegant gradient glow around your profile popout.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setProfileEffects(prev => ({ ...prev, profileGlow: !prev.profileGlow }))}
                                                                className={`w-10 h-6 rounded-full transition-colors relative ${profileEffects.profileGlow ? 'bg-[#3BA55D]' : 'bg-[#80848E]'}`}
                                                            >
                                                                <div className={`absolute top-1 max-w-[16px] w-4 h-4 rounded-full bg-white transition-transform ${profileEffects.profileGlow ? 'left-5' : 'left-1'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Toggle item 4 - Animation Enabled */}
                                                        <div className="flex items-center justify-between py-3 border-b border-[#313338]">
                                                            <div>
                                                                <h4 className="text-white font-medium text-sm">Theme Animations</h4>
                                                                <p className="text-[#949ba4] text-xs mt-1">Enable shimmering motion and effects for premium themes.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setProfileEffects(prev => ({ ...prev, animationEnabled: prev.animationEnabled === false ? true : false }))}
                                                                className={`w-10 h-6 rounded-full transition-colors relative ${profileEffects.animationEnabled !== false ? 'bg-[#3BA55D]' : 'bg-[#80848E]'}`}
                                                            >
                                                                <div className={`absolute top-1 max-w-[16px] w-4 h-4 rounded-full bg-white transition-transform ${profileEffects.animationEnabled !== false ? 'left-5' : 'left-1'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Theme Selector */}
                                                        <div className="py-4 border-b border-[#313338]">
                                                            <div className="mb-3">
                                                                <h4 className="text-white font-medium text-sm">Profile Theme</h4>
                                                                <p className="text-[#949ba4] text-xs mt-1">Transform your popout profile card with an exclusive theme.</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                {[
                                                                    { id: 'default', name: 'Default', bg: 'bg-[#2b2d31]' },
                                                                    { id: 'dark', name: 'Dark Mode', bg: 'bg-[#111214]' },
                                                                    { id: 'light', name: 'Light Mode', bg: 'bg-[#f2f3f5]' },
                                                                    { id: 'unicorn', name: 'Magical Unicorn', bg: 'bg-gradient-to-br from-[#ffb6c1] via-[#c4b5fd] to-[#818cf8]' },
                                                                    { id: 'dino', name: 'Prehistoric Dino', bg: 'bg-gradient-to-br from-[#81c784] via-[#4caf50] to-[#2e7d32]' },
                                                                    { id: 'galaxy', name: 'Cosmic Galaxy', bg: 'bg-gradient-to-br from-[#1e0a32] via-[#0a143c] to-[#050510]' },
                                                                    { id: 'cyber_flame', name: 'Cyber Flame', bg: 'bg-gradient-to-br from-[#0f0500] via-[#1a0a00] to-[#000000]' },
                                                                ].map(theme => (
                                                                    <button
                                                                        key={theme.id}
                                                                        onClick={() => setProfileEffects(prev => ({ ...prev, theme: theme.id }))}
                                                                        className={`relative h-16 rounded-md overflow-hidden ${theme.bg} transition-all ${profileEffects.theme === theme.id ? 'ring-2 ring-[#5865F2] scale-105 z-10' : 'hover:scale-105 hover:z-10 ring-1 ring-[#1e1f22]'}`}
                                                                    >
                                                                        <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{theme.name}</span>
                                                                        </div>
                                                                        {profileEffects.theme === theme.id && (
                                                                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#5865F2] rounded-full flex items-center justify-center">
                                                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>

                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button
                                                            onClick={handleSave}
                                                            className="px-6 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm font-medium text-white transition-colors"
                                                        >
                                                            {saved ? '✓ Saved!' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ═══════ Privacy ═══════ */}
                                    {activeTab === 'privacy' && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-6">Privacy & Safety</h2>
                                            <div className="space-y-4 max-w-md">
                                                <div className="bg-[#1e1f22] rounded-lg p-4">
                                                    <h4 className="text-sm font-medium text-white mb-1">Direct Messages</h4>
                                                    <p className="text-xs text-[#949ba4]">Allow direct messages from server members.</p>
                                                </div>
                                                <div className="bg-[#1e1f22] rounded-lg p-4">
                                                    <h4 className="text-sm font-medium text-white mb-1">Message Requests</h4>
                                                    <p className="text-xs text-[#949ba4]">Filter messages from unknown users.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Cropper Overlay */}
            <AnimatePresence>
                {cropperSrc && (
                    <ImageCropper
                        imageSrc={cropperSrc}
                        onCrop={handleCrop}
                        onCancel={() => setCropperSrc(null)}
                    />
                )}
            </AnimatePresence>

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />

            {/* ═══════ Refund Modal ═══════ */}
            <AnimatePresence>
                {showRefundModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/70" onClick={() => { setShowRefundModal(false); setRefundInfo(null); }} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#1e1f22] rounded-xl border border-[#3f4147] shadow-2xl overflow-hidden z-10"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-[#2b2d31] flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg">Cancel Nitro Subscription</h3>
                                <button
                                    onClick={() => { setShowRefundModal(false); setRefundInfo(null); }}
                                    className="w-8 h-8 rounded-full hover:bg-[#2b2d31] flex items-center justify-center text-[#949ba4] hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5">
                                {refundLoading ? (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin mb-3" />
                                        <p className="text-[#949ba4] text-sm">Checking refund eligibility...</p>
                                    </div>
                                ) : refundInfo ? (
                                    <div className="space-y-4">
                                        {/* Purchase Info */}
                                        <div className="bg-[#2b2d31] rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#949ba4] text-xs">Purchase Date</span>
                                                <span className="text-[#dbdee1] text-sm font-medium">
                                                    {refundInfo.purchaseDate ? new Date(refundInfo.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#949ba4] text-xs">Time Elapsed</span>
                                                <span className="text-[#dbdee1] text-sm font-medium">
                                                    {refundInfo.hoursElapsed !== undefined ? `${refundInfo.hoursElapsed} hours` : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#949ba4] text-xs">Original Amount</span>
                                                <span className="text-[#dbdee1] text-sm font-medium">₹{refundInfo.originalAmount || 199}</span>
                                            </div>
                                        </div>

                                        {/* Eligibility Status */}
                                        <div className={`rounded-lg p-4 flex items-start gap-3 border ${refundInfo.eligible
                                            ? refundInfo.refundType === 'full'
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-yellow-500/5 border-yellow-500/20'
                                            : 'bg-red-500/5 border-red-500/20'
                                            }`}>
                                            {refundInfo.eligible ? (
                                                <CheckCircle2 size={18} className={refundInfo.refundType === 'full' ? 'text-green-400' : 'text-yellow-400'} />
                                            ) : (
                                                <AlertCircle size={18} className="text-red-400" />
                                            )}
                                            <div>
                                                <p className={`text-sm font-medium ${refundInfo.eligible
                                                    ? refundInfo.refundType === 'full' ? 'text-green-400' : 'text-yellow-400'
                                                    : 'text-red-400'
                                                    }`}>
                                                    {refundInfo.message}
                                                </p>
                                                {refundInfo.eligible && (
                                                    <p className="text-[#949ba4] text-xs mt-1">
                                                        Refund amount: <strong className="text-white">₹{refundInfo.refundAmount}</strong> will be added to your wallet
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[#2b2d31] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => { setShowRefundModal(false); setRefundInfo(null); }}
                                    className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                                {refundInfo?.eligible && (
                                    <button
                                        onClick={handleProcessRefund}
                                        disabled={refundProcessing}
                                        className="px-5 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {refundProcessing ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                                        ) : (
                                            <><Wallet size={14} /> Request Refund</>
                                        )}
                                    </button>
                                )}
                                {!refundInfo?.eligible && !refundLoading && (
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={isCanceling}
                                        className="px-5 py-2 rounded-md bg-[#da373c] hover:bg-[#a12d31] text-sm font-bold text-white transition-colors disabled:opacity-50"
                                    >
                                        {isCanceling ? 'Cancelling...' : 'Cancel Without Refund'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
};

export default SettingsModal;
