import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Smile, Reply, Pin, Trash2, SmilePlus, FileText, Download, Gift as GiftIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import Avatar from '../ui/Avatar';
import { AVAILABLE_GIFTS } from './GiftModal';
import api from '../../utils/axios';

/* ─────────────────────────── helpers ─────────────────────────── */
const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = (today - msgDay) / 86400000;

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const shouldGroup = (prev, curr) => {
    if (!prev) return false;
    const prevSenderId = prev.senderId || prev.sender?._id || prev.sender;
    const currSenderId = curr.senderId || curr.sender?._id || curr.sender;
    if (prevSenderId !== currSenderId) return false;

    // Check timestamp difference
    const prevTime = prev.timestamp || prev.createdAt;
    const currTime = curr.timestamp || curr.createdAt;
    const diff = new Date(currTime) - new Date(prevTime);
    return diff < 5 * 60 * 1000;
};

/* ── Parse mention patterns from message content ── */
const parseMentions = (content, allUsers, onMentionClick) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }

        const mentionedUsername = match[1];
        const mentionedUser = allUsers.find(u => u.username.toLowerCase() === mentionedUsername.toLowerCase());

        if (mentionedUser) {
            parts.push(
                <span
                    key={match.index}
                    className="mention-highlight cursor-pointer inline-flex items-center gap-0.5"
                    onClick={(e) => onMentionClick(e, mentionedUser)}
                >
                    @{mentionedUser.username}
                    {mentionedUser.nitro?.isActive && (
                        <Sparkles size={12} className="text-[#FF73FA] shrink-0" />
                    )}
                </span>
            );
        } else {
            parts.push(`@${mentionedUsername}`);
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
};

/* ─────────────────────── Date Separator ──────────────────────── */
export const DateSeparator = ({ label }) => (
    <div className="flex items-center gap-4 my-6 px-4 select-none">
        <div className="flex-1 h-px bg-[#3f4147]"></div>
        <span className="text-[11px] font-semibold text-[#949ba4] uppercase tracking-wide">{label}</span>
        <div className="flex-1 h-px bg-[#3f4147]"></div>
    </div>
);

/* ────────────────────── Reaction Badge ───────────────────────── */
export const ReactionBadge = ({ emoji, userIds, currentUserId, onToggle }) => {
    const hasReacted = userIds.includes(currentUserId);
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm border transition-all duration-150 cursor-pointer select-none ${hasReacted
                ? 'bg-[#5865F2]/20 border-[#5865F2]/50 text-[#dee0fc]'
                : 'bg-[#2b2d31] border-[#3f4147] text-[#b5bac1] hover:border-[#5865F2]/40'
                }`}
        >
            <span className="text-base leading-none">{emoji}</span>
            <span className="text-[11px] font-medium min-w-[8px] text-center">{userIds.length}</span>
        </motion.button>
    );
};

/* ────────────────── Mention Dropdown ────────────────────────── */
export const MentionDropdown = ({ query, members, selectedIndex, onSelect }) => {
    const filtered = useMemo(() => {
        if (!query) return members.slice(0, 8);
        return members
            .filter(m => m.username.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8);
    }, [query, members]);

    if (filtered.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-0 right-0 mx-4 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden z-50"
        >
            <div className="px-2 py-1.5">
                <span className="text-[11px] font-bold text-[#949ba4] uppercase px-2">Members</span>
            </div>
            {filtered.map((member, i) => (
                <button
                    key={member.id || member._id}
                    onClick={() => onSelect(member)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${i === selectedIndex
                        ? 'bg-[#5865F2] text-white'
                        : 'text-[#dbdee1] hover:bg-[#36373d]'
                        }`}
                >
                    <Avatar src={member.avatar || member.profilePicture} username={member.username} size="sm" />
                    <span className="text-sm font-medium flex items-center gap-1">
                        {member.username}
                        {member.nitro?.isActive && (
                            <Sparkles size={12} className="text-[#FF73FA] shrink-0" />
                        )}
                    </span>
                </button>
            ))}
        </motion.div>
    );
};

/* ─────────────────────────── Gift Animation ─────────────────────── */
const GiftAnimationOverlay = ({ gift, onComplete }) => {
    const [phase, setPhase] = useState("box");

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("open"), 600); // Box shakes for 0.6s then opens (faster)
        const t2 = setTimeout(onComplete, 2500); // Total 2.5s (faster)
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [onComplete]);
    // Generate tiny gift icons as confetti
    const confetti = useMemo(() => Array.from({ length: 40 }).map((_, i) => {
        const colors = [gift.color, '#fff', gift.color, '#fff', gift.color]; // mostly the gift color, some white sparkles
        const angle = (Math.random() * Math.PI * 2);
        const velocity = 200 + Math.random() * 600;
        return {
            id: i,
            color: colors[Math.floor(Math.random() * colors.length)],
            tx: Math.cos(angle) * velocity,
            ty: Math.sin(angle) * velocity - (Math.random() * 300), // bias upward flight
            rot: Math.random() * 720 - 360,
            scale: 0.5 + Math.random() * 1.5,
            delay: Math.random() * 0.15
        };
    }), [gift.color]);

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md">

            {/* Phase 1: Bouncing/Shaking Box */}
            {phase === "box" && (
                <motion.div
                    initial={{ y: -500, scale: 0.5, opacity: 0 }}
                    animate={{
                        y: [0, -40, 0, -20, 0, 0, 0, 0, 0, 10],   // Initial bounce, then settle, then compress before jump
                        scale: [1, 1, 1, 1, 1, 1.15, 0.9, 1.1, 0.9, 1.2], // Stretch/squash cartoon physics
                        rotate: [0, 0, 0, 0, 0, -15, 15, -10, 10, 0], // The "shake"
                        opacity: 1
                    }}
                    transition={{
                        duration: 0.8,
                        times: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1],
                        ease: "easeInOut"
                    }}
                    className="relative flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-[#5865F2]/40 blur-3xl rounded-full scale-150" />
                    <GiftIcon size={240} color="#f2f3f5" fill="#5865F2" strokeWidth={1.5} className="relative z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]" />
                </motion.div>
            )}

            {/* Phase 2: Open! Confetti + Main Gift */}
            {phase === "open" && (
                <>
                    {/* Confetti Explosion */}
                    {confetti.map((c) => (
                        <motion.div
                            key={c.id}
                            className="absolute z-0"
                            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                            animate={{
                                x: c.tx,
                                y: c.ty + 400, // Gravity effect (falls down slightly after shooting out)
                                scale: [0, c.scale, c.scale, 0],
                                rotate: c.rot,
                                opacity: [1, 1, 1, 0]
                            }}
                            transition={{
                                duration: 1.5 + Math.random(),
                                delay: c.delay,
                                ease: [0.23, 1, 0.32, 1] // cubic-bezier for explosive pop
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '28px',
                                    color: c.color,
                                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
                                }}
                                className="select-none"
                            >
                                {gift.emoji}
                            </div>
                        </motion.div>
                    ))}

                    {/* The Actual Gift popping out with Spring */}
                    <motion.div
                        className="relative z-10"
                        initial={{ scale: 0, y: 150, rotate: -45 }}
                        animate={{
                            scale: [0, 1.6, 1.2, 1.4, 1.3],
                            y: [150, -80, -20, -40, -30],
                            rotate: [-45, 15, -10, 5, 0]
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                            mass: 1,
                            duration: 0.8
                        }}
                    >
                        {/* Dramatic behind-gift aura */}
                        <motion.div
                            className="absolute inset-0 blur-[80px] rounded-full mix-blend-screen z-0"
                            style={{ backgroundColor: gift.color }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 0.9, 0], scale: [0.5, 4, 6] }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                        <div
                            style={{ fontSize: '200px', filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.7))' }}
                            className="relative z-10 select-none"
                        >
                            {gift.emoji}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

const MessageRow = ({ message, isGrouped, onReply, onDelete, currentUser, toggleReaction, messages, allUsers, onProfileClick }) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    const [hovered, setHovered] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [isUnpacked, setIsUnpacked] = useState(message.giftOpenedBy?.includes(currentUserId) || false);
    const [isUnpacking, setIsUnpacking] = useState(false);
    const reactionBtnRef = useRef(null);
    const addReactionBtnRef = useRef(null);

    // Sync gifted state if the backend returned it as opened
    useEffect(() => {
        if (message.giftOpenedBy?.includes(currentUserId)) {
            setIsUnpacked(true);
        }
    }, [message.giftOpenedBy, currentUserId]);

    // Normalize message properties whether it's from Channel or DM
    const msgId = message.id || message._id;
    const senderId = message.senderId || message.sender?._id || message.sender;
    const msgTimestamp = message.timestamp || message.createdAt;

    // Normalize sender info
    let sender = allUsers?.find(u => u.id === senderId || u._id === senderId) || message.sender;

    // Live override for current user to instantly reflect Nitro/Profile changes
    if (senderId === currentUserId && currentUser) {
        sender = { ...sender, ...currentUser, profileEffects: currentUser.profileEffects, nitro: currentUser.nitro };
    }

    const senderName = sender?.username || message.senderName || "Unknown";
    const senderAvatar = sender?.avatar || sender?.profilePicture || message.senderAvatar;

    const replySource = message.replyTo
        ? messages.find(m => (m.id || m._id) === message.replyTo.id) || message.replyTo
        : null;

    const isActive = hovered || showReactionPicker;
    const isOwnMessage = senderId === currentUserId;

    const handleAvatarClick = (e) => {
        if (sender && onProfileClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            onProfileClick(sender, { top: rect.bottom + 4, left: rect.left });
        }
    };

    const handleUsernameClick = (e) => {
        if (sender && onProfileClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            onProfileClick(sender, { top: rect.bottom + 4, left: rect.left });
        }
    };

    const handleMentionClick = (e, mentionedUser) => {
        if (onProfileClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            onProfileClick(mentionedUser, { top: rect.bottom + 4, left: rect.left });
        }
    };

    // Safely parse mentions
    const renderedContent = allUsers && allUsers.length > 0
        ? parseMentions(message.content, allUsers, handleMentionClick)
        : message.content;

    // Check if message is a gift
    const giftMatch = typeof message.content === 'string' && message.content.match(/^\[GIFT:(.+?)\]$/);
    const giftId = giftMatch ? giftMatch[1] : null;
    const giftData = giftId ? AVAILABLE_GIFTS.find(g => g.id === giftId) : null;

    return (
        <div
            className={`relative group ${isActive ? 'bg-[#2e3035]/50' : ''} transition-colors duration-100`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Reply reference */}
            {replySource && (
                <div className="flex items-center gap-2 pl-[72px] pr-12 pt-1 pb-0.5">
                    <div className="w-8 flex justify-end items-center">
                        <div className="w-[33px] h-3 border-l-2 border-t-2 border-[#4e5058] rounded-tl-lg"></div>
                    </div>
                    <Avatar
                        src={replySource.senderAvatar || replySource.sender?.profilePicture}
                        username={replySource.senderName || replySource.sender?.username}
                        size="xs"
                        isNitro={replySource.sender?.nitro?.isActive}
                        profileEffects={replySource.sender?.profileEffects}
                    />
                    <span className="text-[12px] font-medium text-[#949ba4] hover:text-[#dbdee1] cursor-pointer flex items-center gap-1">
                        @{replySource.senderName || replySource.sender?.username}
                        {replySource.sender?.nitro?.isActive && (
                            <Sparkles size={12} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                        )}
                    </span>
                    <span className="text-[12px] text-[#949ba4] truncate max-w-[300px]">
                        {replySource.content}
                    </span>
                </div>
            )}

            {/* Message content */}
            <div className={`flex items-start px-4 ${isGrouped ? 'py-[2px]' : 'pt-4 pb-[2px]'} relative`}>
                {/* Avatar / timestamp gutter */}
                <div className="w-[52px] flex-shrink-0 flex items-start justify-center pt-0.5">
                    {isGrouped ? (
                        <span className="text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity mt-1 select-none">
                            {formatTime(msgTimestamp).replace(/\s/g, '')}
                        </span>
                    ) : (
                        <div onClick={handleAvatarClick}>
                            <Avatar
                                src={senderAvatar}
                                username={senderName}
                                size="lg"
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                isNitro={sender?.nitro?.isActive}
                                profileEffects={sender?.profileEffects}
                            />
                        </div>
                    )}
                </div>

                {isUnpacking && giftData && <GiftAnimationOverlay gift={giftData} onComplete={() => setIsUnpacking(false)} />}

                {/* Body */}
                <div className="flex-1 min-w-0 ml-1">
                    {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                                className="text-[15px] font-medium text-[#f2f3f5] hover:underline cursor-pointer flex items-center gap-1.5"
                                onClick={handleUsernameClick}
                            >
                                {senderName}
                                {sender?.nitro?.isActive && (
                                    <Sparkles className="text-[#FF73FA]" size={14} />
                                )}
                            </span>
                            <span className="text-[11px] text-[#949ba4] select-none">
                                {formatTime(msgTimestamp)}
                            </span>
                        </div>
                    )}

                    {giftData ? (
                        <div className="mt-1 mb-2 inline-block">
                            {!isUnpacked ? (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        setIsUnpacked(true);
                                        setIsUnpacking(true);
                                        try {
                                            await api.post(`/messages/${msgId}/open-gift`);
                                        } catch (err) {
                                            console.error("Failed to mark gift as opened", err);
                                        }
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-[#1e1f22] bg-[#2b2d31] max-w-sm cursor-pointer hover:border-[#5865F2]/50 shadow-md relative overflow-hidden"
                                >
                                    <div className="shrink-0 p-3 bg-[#5865F2]/20 rounded-full">
                                        <GiftIcon size={32} className="text-[#5865F2] animate-pulse" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[#f2f3f5] text-sm font-semibold m-0 leading-tight">Sent you a Mystery Gift!</p>
                                        <p className="text-[#949ba4] text-xs mt-1 m-0">Click to unpack!</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${giftData.bg} ${giftData.border} w-[260px] h-[80px] relative overflow-hidden shrink-0`}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-white/20 mix-blend-overlay pointer-events-none"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [0, 2, 2], opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.8, times: [0, 0.5, 1] }}
                                    />
                                    <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm shadow-inner relative z-10">
                                        <span className="text-2xl drop-shadow-md select-none leading-none">{giftData.emoji}</span>
                                    </div>
                                    <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-[#f2f3f5] text-[13px] font-semibold m-0 leading-tight mb-0.5">Gift Opened!</p>
                                        <p className="font-bold text-[16px] m-0 truncate leading-tight" style={{ color: giftData.color }}>{giftData.name}</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="text-[15px] text-[#dbdee1] leading-[1.375] break-words whitespace-pre-wrap">
                            {renderedContent}
                        </div>
                    )}

                    {/* Attachment rendering */}
                    {message.attachment && (
                        <div className="mt-2 text-[#dbdee1]">
                            {message.attachment.fileType?.startsWith('image/') ? (
                                <a href={`http://localhost:5000${message.attachment.url}`} target="_blank" rel="noopener noreferrer" className="block w-fit">
                                    <img
                                        src={`http://localhost:5000${message.attachment.url}`}
                                        alt={message.attachment.filename}
                                        className="max-w-[400px] max-h-[300px] rounded object-contain border border-[#1e1f22] bg-[#2b2d31]"
                                    />
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-[#2b2d31] border border-[#1e1f22] rounded-md max-w-[400px]">
                                    <div className="w-10 h-10 flex items-center justify-center bg-[#5865F2]/20 text-[#5865F2] rounded">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate text-[#f2f3f5]">{message.attachment.filename}</div>
                                        <div className="text-xs text-[#949ba4] uppercase">{message.attachment.fileType?.split('/').pop() || 'FILE'}</div>
                                    </div>
                                    <a
                                        href={`http://localhost:5000${message.attachment.url}`}
                                        download={message.attachment.filename}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-[#232428] hover:bg-[#1e1f22] rounded text-[#b5bac1] hover:text-[#dbdee1] transition"
                                    >
                                        <Download size={18} />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(message.reactions).map(([emoji, userIds]) => (
                                <ReactionBadge
                                    key={emoji}
                                    emoji={emoji}
                                    userIds={userIds}
                                    currentUserId={currentUserId}
                                    onToggle={() => toggleReaction(msgId, emoji)}
                                />
                            ))}
                            <button
                                ref={addReactionBtnRef}
                                onClick={() => setShowReactionPicker(true)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-[#3f4147] text-[#949ba4] hover:border-[#5865F2]/40 hover:text-[#dbdee1] transition-colors"
                            >
                                <SmilePlus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover action bar */}
            {(hovered || showReactionPicker) && (
                <div className="absolute -top-4 right-4 flex items-center bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-lg z-30">
                    <button
                        ref={reactionBtnRef}
                        onClick={() => setShowReactionPicker(prev => !prev)}
                        className="p-2 text-[#b5bac1] hover:bg-[#36373d] hover:text-[#dbdee1] transition-colors"
                        title="Add Reaction"
                    >
                        <Smile size={18} />
                    </button>
                    <button
                        onClick={() => {
                            import('react-hot-toast').then(t => t.default.success('Message pinned (frontend mock)'));
                        }}
                        className="p-2 text-[#b5bac1] hover:bg-[#36373d] hover:text-[#dbdee1] transition-colors"
                        title="Pin Message"
                    >
                        <Pin size={18} />
                    </button>
                    <button
                        onClick={() => onReply(message)}
                        className="p-2 text-[#b5bac1] hover:bg-[#36373d] hover:text-[#dbdee1] transition-colors"
                        title="Reply"
                    >
                        <Reply size={18} />
                    </button>
                    {isOwnMessage && (
                        <button
                            onClick={() => onDelete(msgId)}
                            className="p-2 text-[#b5bac1] hover:bg-[#da373c]/20 hover:text-[#da373c] transition-colors"
                            title="Delete Message"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            )}

            {/* Reaction picker */}
            {showReactionPicker && (
                <EmojiPicker
                    anchorRef={reactionBtnRef}
                    onSelect={(emoji) => {
                        toggleReaction(msgId, emoji);
                    }}
                    onClose={() => setShowReactionPicker(false)}
                />
            )}
        </div>
    );
};

export default MessageRow;
