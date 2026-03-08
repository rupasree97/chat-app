import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Settings, Trash2, AlertTriangle, Camera, Upload, Rocket, Star, Shield, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import ImageCropper from '../ui/ImageCropper';

const ServerSettingsModal = ({ isOpen, onClose, community }) => {
    const { updateCommunity, deleteCommunity, socket } = useData();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [serverName, setServerName] = useState('');
    const [serverIcon, setServerIcon] = useState('');
    const [saved, setSaved] = useState(false);
    const [loadingIcon, setLoadingIcon] = useState(false);
    const [boosting, setBoosting] = useState(false);

    // Cropper state
    const [cropperSrc, setCropperSrc] = useState(null);
    const fileInputRef = useRef(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    useEffect(() => {
        if (community && isOpen) {
            setServerName(community.name || '');
            setServerIcon(community.icon || '');
            setActiveTab('overview');
            setShowDeleteConfirm(false);
            setDeleteInput('');
            setCropperSrc(null);
        }
    }, [community, isOpen]);

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!community) return null;

    const handleSaveName = async () => {
        const trimmed = serverName.trim();
        if (!trimmed || trimmed === community.name) return;

        try {
            await api.put(`/servers/${community.id}`, { name: trimmed });

            // Optimistically update local context
            updateCommunity(community.id, { name: trimmed });

            if (socket) {
                socket.emit("server-updated", { serverId: community.id });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const isOwner = currentUser?.id === community?.createdBy;

    // File Handlers
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => setCropperSrc(reader.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOwner) return;

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

    const handleCrop = async (croppedDataUrl) => {
        setCropperSrc(null);
        setLoadingIcon(true);
        try {
            const res = await api.patch(`/servers/${community.id}/icon`, { icon: croppedDataUrl });
            setServerIcon(res.data.icon);
            updateCommunity(community.id, { icon: res.data.icon });

            if (socket) {
                socket.emit("server-updated", { serverId: community.id });
            }
        } catch (err) {
            console.error("Failed to update icon:", err);
        } finally {
            setLoadingIcon(false);
        }
    };

    const handleRemoveIcon = async () => {
        setLoadingIcon(true);
        try {
            await api.delete(`/servers/${community.id}/icon`);
            setServerIcon('');
            updateCommunity(community.id, { icon: '' });

            if (socket) {
                socket.emit("server-updated", { serverId: community.id });
            }
        } catch (err) {
            console.error("Failed to remove icon:", err);
        } finally {
            setLoadingIcon(false);
        }
    };

    const handleDeleteServer = () => {
        deleteCommunity(community.id);
        onClose();
        navigate('/dashboard');
    };

    const canDelete = deleteInput === community.name;

    const myBoost = community?.boosts?.find(b => b.userId === currentUser?.id || (b.user && b.user._id === currentUser?.id));
    const isBoosting = !!myBoost;

    const handleToggleBoost = async () => {
        if (!currentUser?.nitro?.isActive && !isBoosting) {
            alert("You need an active Nitro subscription to boost a server!");
            return navigate('/dashboard?tab=nitro'); // Optional redirect
        }

        setBoosting(true);
        try {
            if (isBoosting) {
                const res = await api.delete(`/servers/${community.id}/boost`);
                updateCommunity(community.id, res.data);
            } else {
                const res = await api.post(`/servers/${community.id}/boost`);
                updateCommunity(community.id, res.data);
            }
        } catch (err) {
            console.error("Boost toggle failed", err);
            import('react-hot-toast').then(({ default: toast }) => toast.error(err.response?.data?.message || "Failed to modify boost"));
        } finally {
            setBoosting(false);
        }
    };

    // Calculate boost progress
    const boostCount = community?.boostCount || 0;
    const boostLevel = community?.boostLevel || 0;

    let nextThreshold = 2; // Default to Level 1
    let progressPercent = 0;
    let nextLevel = 1;

    if (boostLevel === 0) {
        nextThreshold = 2;
        progressPercent = (boostCount / nextThreshold) * 100;
        nextLevel = 1;
    } else if (boostLevel === 1) {
        nextThreshold = 5;
        progressPercent = (boostCount / nextThreshold) * 100;
        nextLevel = 2;
    } else if (boostLevel === 2) {
        nextThreshold = 10;
        progressPercent = (boostCount / nextThreshold) * 100;
        nextLevel = 3;
    } else {
        nextThreshold = 10;
        progressPercent = 100; // Maxed out
        nextLevel = 3;
    }

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative ml-auto w-full max-w-3xl h-screen flex bg-[#313338] shadow-2xl overflow-hidden"
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#404249] flex items-center justify-center text-[#b5bac1] hover:text-white transition-colors z-20"
                            >
                                <X size={18} />
                            </button>

                            {/* Left Nav */}
                            <div className="w-52 bg-[#2b2d31] flex flex-col flex-shrink-0 h-full overflow-y-auto"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}
                            >
                                <div className="py-6 px-3">
                                    <h3 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2.5 mb-2">
                                        {community.name}
                                    </h3>

                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${activeTab === 'overview'
                                            ? 'bg-[#404249] text-white'
                                            : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
                                            }`}
                                    >
                                        <Settings size={16} />
                                        Overview
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('boost')}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${activeTab === 'boost'
                                            ? 'bg-[#FF73FA]/20 text-[#FF73FA]'
                                            : 'text-[#dbdee1] hover:bg-[#35373c] hover:text-[#FF73FA]'
                                            }`}
                                    >
                                        <Rocket size={16} />
                                        Server Boost
                                    </button>

                                    <div className="h-px bg-[#3f4147] my-2 mx-2" />

                                    <button
                                        onClick={() => setActiveTab('danger')}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'danger'
                                            ? 'bg-[#da373c]/15 text-[#da373c]'
                                            : 'text-[#da373c]/80 hover:bg-[#da373c]/10 hover:text-[#da373c]'
                                            }`}
                                    >
                                        <Trash2 size={16} />
                                        Danger Zone
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 h-full overflow-y-auto"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #313338' }}
                            >
                                <div className="px-8 pb-8 pt-14">
                                    {/* ═══════ Overview ═══════ */}
                                    {activeTab === 'overview' && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-6">Server Overview</h2>

                                            <div className="flex flex-col items-center gap-8 max-w-sm mx-auto w-full pt-4">
                                                {/* Top: Server Icon */}
                                                <div className="flex flex-col items-center w-full">
                                                    <div
                                                        className="relative group mb-5"
                                                        onDrop={handleDrop}
                                                        onDragOver={handleDragOver}
                                                    >
                                                        <div className={`w-[120px] h-[120px] rounded-full overflow-hidden bg-[#2b2d31] flex items-center justify-center border-[3px] border-[#1e1f22] ${loadingIcon ? 'opacity-50' : ''} transition-all duration-300 shadow-xl`}>
                                                            {serverIcon ? (
                                                                <img src={serverIcon} alt={serverName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-3xl font-bold text-white uppercase">{community.name?.substring(0, 2)}</span>
                                                            )}
                                                        </div>

                                                        {/* Upload overlay (Owner only) */}
                                                        {isOwner && !loadingIcon && (
                                                            <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white border-4 border-transparent group-hover:border-[#5865F2]"
                                                                aria-label="Change Icon"
                                                            >
                                                                <Camera size={28} className="mb-1" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-center">Change<br />Icon</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isOwner && (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={loadingIcon}
                                                                className="px-5 py-2 rounded text-[#dbdee1] border border-[#4e5058] hover:bg-[#5865F2] hover:border-[#5865F2] hover:text-white text-sm font-medium transition-colors"
                                                            >
                                                                {serverIcon ? 'Change Icon' : 'Upload Icon'}
                                                            </button>

                                                            {serverIcon && (
                                                                <button
                                                                    onClick={handleRemoveIcon}
                                                                    disabled={loadingIcon}
                                                                    className="text-[#da373c] hover:underline text-xs mt-1 transition-colors"
                                                                >
                                                                    Remove Icon
                                                                </button>
                                                            )}

                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-full h-px bg-[#3f4147] opacity-60" />

                                                {/* Middle: Server Name */}
                                                <div className="w-full space-y-2">
                                                    <label className="block text-[12px] font-bold text-[#b5bac1] uppercase">
                                                        Server Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={serverName}
                                                        onChange={e => setServerName(e.target.value)}
                                                        maxLength={50}
                                                        disabled={!isOwner}
                                                        className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-lg px-4 py-3 text-[15px] outline-none border border-transparent focus:border-[#5865F2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
                                                    />
                                                </div>

                                                {/* Bottom: Save */}
                                                {isOwner && (
                                                    <div className="w-full flex justify-center pt-2 pb-4">
                                                        <button
                                                            onClick={handleSaveName}
                                                            disabled={!serverName.trim() || serverName.trim() === community.name}
                                                            className="px-8 py-2.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#5865F2]/50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors min-w-[150px]"
                                                        >
                                                            {saved ? '✓ Saved!' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══════ Server Boost ✨ ═══════ */}
                                    {activeTab === 'boost' && (
                                        <div className="animation-fade-in">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-3 bg-[#FF73FA]/20 rounded-xl border border-[#FF73FA]/30 shadow-[0_0_15px_rgba(255,115,250,0.2)]">
                                                    <Rocket className="text-[#FF73FA]" size={28} />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white leading-tight">Server Boost</h2>
                                                    <p className="text-[#b5bac1] text-sm hidden md:block">Power up your community with premium perks and features.</p>
                                                </div>
                                            </div>

                                            {/* Progress Card */}
                                            <div className="bg-gradient-to-br from-[#2b2d31] to-[#1e1f22] border border-[#3f4147] rounded-xl p-6 mb-8 shadow-lg relative overflow-hidden">
                                                {/* Background subtle glow */}
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF73FA]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                                <div className="flex justify-between items-end mb-4 relative z-10">
                                                    <div>
                                                        <span className="text-3xl font-black text-white">{boostCount} <span className="text-lg text-[#949ba4] font-semibold tracking-wide uppercase">Boosts</span></span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-[#FF73FA] uppercase tracking-wider">Level {boostLevel}</span>
                                                    </div>
                                                </div>

                                                <div className="relative h-4 bg-[#1e1f22] rounded-full overflow-hidden mb-3 border border-[#3f4147]/50 shadow-inner z-10">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, progressPercent)}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF73FA] to-[#b233e6] rounded-full"
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center text-xs font-semibold text-[#949ba4] relative z-10">
                                                    <span>{boostLevel === 0 ? 'No Level' : `Level ${boostLevel}`}</span>
                                                    <span>{boostLevel === 3 ? 'Max Level Reached!' : `${Math.max(0, nextThreshold - boostCount)} boosts until Level ${nextLevel}`}</span>
                                                </div>
                                            </div>

                                            {/* Action Panel */}
                                            <div className="flex flex-col sm:flex-row items-center justify-between bg-[#2b2d31] border border-[#3f4147] rounded-xl p-5 mb-8">
                                                <div>
                                                    <h3 className="text-white font-bold text-lg mb-1">{isBoosting ? 'You are boosting this server!' : 'Boost This Server'}</h3>
                                                    <p className="text-[#949ba4] text-sm text-balance">
                                                        {isBoosting
                                                            ? 'Thank you for supporting the community. You are receiving a booster badge!'
                                                            : 'Help unlock new levels and get an exclusive badge on your profile.'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleToggleBoost}
                                                    disabled={boosting}
                                                    className={`mt-4 sm:mt-0 flex-shrink-0 px-6 py-2.5 rounded text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 ${isBoosting
                                                        ? 'bg-transparent border-2 border-[#da373c] text-[#da373c] hover:bg-[#da373c] hover:text-white'
                                                        : 'bg-gradient-to-r from-[#FF73FA] to-[#b233e6] text-white hover:opacity-90'
                                                        }`}
                                                >
                                                    {boosting ? (
                                                        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                    ) : isBoosting ? (
                                                        'Remove Boost'
                                                    ) : (
                                                        <>
                                                            <Rocket size={16} className="fill-white" />
                                                            Boost Server
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Perks Grid */}
                                            <h3 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wider mb-4 px-1">Unlockable Perks</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                {/* Level 1 */}
                                                <div className={`p-4 rounded-xl border transition-colors ${boostLevel >= 1 ? 'bg-[#FF73FA]/10 border-[#FF73FA]/30' : 'bg-[#2b2d31] border-[#3f4147] opacity-60'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Star size={18} className={boostLevel >= 1 ? 'text-[#FF73FA]' : 'text-[#949ba4]'} />
                                                        <h4 className={`font-bold ${boostLevel >= 1 ? 'text-white' : 'text-[#b5bac1]'}`}>Level 1</h4>
                                                        <span className="text-xs bg-[#1e1f22] text-[#949ba4] px-2 py-0.5 rounded-full font-semibold ml-auto">2 Boosts</span>
                                                    </div>
                                                    <ul className="space-y-2 text-sm text-[#dbdee1]">
                                                        <li className="flex items-center gap-2"><span>✨</span> Animated Server Icon</li>
                                                        <li className="flex items-center gap-2"><span>🖼️</span> Custom Server Invite Background</li>
                                                        <li className="flex items-center gap-2"><span>💬</span> +50 Emoji Slots</li>
                                                    </ul>
                                                </div>

                                                {/* Level 2 */}
                                                <div className={`p-4 rounded-xl border transition-colors ${boostLevel >= 2 ? 'bg-[#FF73FA]/10 border-[#FF73FA]/30' : 'bg-[#2b2d31] border-[#3f4147] opacity-60'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Shield size={18} className={boostLevel >= 2 ? 'text-[#FF73FA]' : 'text-[#949ba4]'} />
                                                        <h4 className={`font-bold ${boostLevel >= 2 ? 'text-white' : 'text-[#b5bac1]'}`}>Level 2</h4>
                                                        <span className="text-xs bg-[#1e1f22] text-[#949ba4] px-2 py-0.5 rounded-full font-semibold ml-auto">5 Boosts</span>
                                                    </div>
                                                    <ul className="space-y-2 text-sm text-[#dbdee1]">
                                                        <li className="flex items-center gap-2"><span>🎧</span> 256 Kbps Audio Quality</li>
                                                        <li className="flex items-center gap-2"><span>🚩</span> Custom Server Banner</li>
                                                        <li className="flex items-center gap-2"><span>🎭</span> Role Icons</li>
                                                    </ul>
                                                </div>

                                                {/* Level 3 */}
                                                <div className={`p-4 rounded-xl border transition-colors md:col-span-2 ${boostLevel >= 3 ? 'bg-[#FF73FA]/10 border-[#FF73FA]/30' : 'bg-[#2b2d31] border-[#3f4147] opacity-60'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Zap size={18} className={boostLevel >= 3 ? 'text-[#FF73FA]' : 'text-[#949ba4]'} />
                                                        <h4 className={`font-bold ${boostLevel >= 3 ? 'text-white' : 'text-[#b5bac1]'}`}>Level 3</h4>
                                                        <span className="text-xs bg-[#1e1f22] text-[#949ba4] px-2 py-0.5 rounded-full font-semibold ml-auto">10 Boosts</span>
                                                    </div>
                                                    <ul className="space-y-2 text-sm text-[#dbdee1] grid grid-cols-1 md:grid-cols-2 gap-y-2">
                                                        <li className="flex items-center gap-2"><span>🚀</span> Custom URL (Vanity Link)</li>
                                                        <li className="flex items-center gap-2"><span>💾</span> 100MB Upload Limit for all members</li>
                                                        <li className="flex items-center gap-2"><span>🎧</span> 384 Kbps Audio Quality</li>
                                                        <li className="flex items-center gap-2"><span>💬</span> +100 Emoji Slots</li>
                                                    </ul>
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                    {/* ═══════ Danger Zone ═══════ */}
                                    {activeTab === 'danger' && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-2">Danger Zone</h2>
                                            <p className="text-sm text-[#b5bac1] mb-6">
                                                These actions are irreversible. Please be certain.
                                            </p>

                                            <div className="bg-[#2b2d31] border border-[#da373c]/30 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#da373c]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <AlertTriangle size={20} className="text-[#da373c]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-white mb-1">Delete Server</h4>
                                                        <p className="text-xs text-[#949ba4] mb-3">
                                                            Permanently delete <strong className="text-white">{community.name}</strong> and all its channels and messages. This cannot be undone.
                                                        </p>

                                                        {!showDeleteConfirm ? (
                                                            <button
                                                                onClick={() => setShowDeleteConfirm(true)}
                                                                className="px-4 py-2 rounded-md bg-[#da373c] hover:bg-[#a12828] text-sm font-medium text-white transition-colors"
                                                            >
                                                                Delete Server
                                                            </button>
                                                        ) : (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="space-y-3"
                                                            >
                                                                <div>
                                                                    <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-1.5">
                                                                        Type <span className="text-white">{community.name}</span> to confirm
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={deleteInput}
                                                                        onChange={e => setDeleteInput(e.target.value)}
                                                                        placeholder={community.name}
                                                                        className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#da373c] border border-[#1e1f22] focus:border-[#da373c] transition-colors placeholder:text-[#6d6f78]"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={handleDeleteServer}
                                                                        disabled={!canDelete}
                                                                        className="px-4 py-2 rounded-md bg-[#da373c] hover:bg-[#a12828] disabled:bg-[#da373c]/40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                                                                    >
                                                                        Permanently Delete
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                                                                        className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white hover:underline transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
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

            <AnimatePresence>
                {cropperSrc && (
                    <ImageCropper
                        imageSrc={cropperSrc}
                        onCrop={handleCrop}
                        onCancel={() => setCropperSrc(null)}
                        shape="square" // Use rounded square for server icons
                    />
                )}
            </AnimatePresence>
        </>,
        document.body
    );
};

export default ServerSettingsModal;
