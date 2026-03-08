import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Hash, Smile, Reply, X, SmilePlus, Trash2, Menu, UserMinus, Users, Bell, Pin, Inbox, HelpCircle, Search, Gift, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import Avatar from '../ui/Avatar';
import ProfilePopCard from '../ui/ProfilePopCard';
import SettingsModal from '../modals/SettingsModal';
import RemoveMemberModal from '../modals/RemoveMemberModal';
import MemberRow from './MemberRow';
import MessageRow, { formatDateLabel, shouldGroup, isSameDay, DateSeparator, MentionDropdown } from './MessageRow';
import GiftModal from './GiftModal';
import api from '../../utils/axios';
import { useSocket, useNotifications } from '../../context/SocketContext';
import toast from 'react-hot-toast';

/* ─────────────────────────── helpers ─────────────────────────── */

const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/* ═══════════════════════════════════════════════════════════════════
   Main ChatArea Component
   ═══════════════════════════════════════════════════════════════════ */

const ChatArea = ({ onOpenDrawer }) => {
    const { serverId, channelId } = useParams();
    const { communities, toggleReaction, deleteMessage } = useData();
    const { currentUser, getAllUsers } = useAuth();
    const socket = useSocket();
    const { globalNotifications, unreadCount, markNotificationsAsRead } = useNotifications();

    // States
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [profilePopUser, setProfilePopUser] = useState(null);
    const [profilePopPosition, setProfilePopPosition] = useState(null);

    // Mention state
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);

    const [showMembersPanel, setShowMembersPanel] = useState(true);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Header Utilities State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [showPins, setShowPins] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Refs for clicking outside popovers
    const notificationsRef = useRef(null);
    const inboxRef = useRef(null);
    const pinsRef = useRef(null);

    // Local states for robust fetching
    const [channelLoading, setChannelLoading] = useState(true);
    const [channelError, setChannelError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const emojiBtnRef = useRef(null);
    const fileInputRef = useRef(null);

    const community = useMemo(() => communities.find(c => c.id === serverId), [communities, serverId]);
    const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

    // Validation
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    useEffect(() => {
        const loadChannelData = async () => {
            if (!serverId || !channelId) {
                setChannelError("Invalid URL parameters");
                setChannelLoading(false);
                return;
            }

            if (!isValidObjectId(serverId) || !isValidObjectId(channelId)) {
                setChannelError("Invalid parameter format");
                setChannelLoading(false);
                return;
            }

            setChannelLoading(true);
            setChannelError(null);

            try {
                // 1. Ensure we have the channel details
                let currentChannel = community?.channels.find(c => c.id === channelId);

                if (!currentChannel) {
                    const res = await api.get(`/servers/channels/${channelId}`);
                    currentChannel = { ...res.data, id: res.data._id };
                }
                setChannel(currentChannel);

                // 2. Fetch messages
                const msgRes = await api.get(`/messages/${channelId}`);
                setMessages(msgRes.data);
            } catch (err) {
                console.error("Failed to load channel data:", err);
                setChannelError(err.response?.data?.message || "Failed to load channel");
            } finally {
                setChannelLoading(false);
            }
        };

        loadChannelData();
    }, [serverId, channelId, community]);

    // Community members
    const communityMembers = useMemo(() => {
        if (!community) return [];
        return allUsers.filter(u => community.members.includes(u.id));
    }, [allUsers, community]);

    // Filtered members for mention dropdown
    const mentionMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        if (!mentionQuery) return communityMembers.filter(m => m.id !== currentUser?.id).slice(0, 8);
        return communityMembers
            .filter(m => m.id !== currentUser?.id && m.username.toLowerCase().includes(mentionQuery.toLowerCase()))
            .slice(0, 8);
    }, [mentionQuery, communityMembers, currentUser]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesEndRef]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        const cursorPos = e.target.selectionStart;
        const textBefore = value.substring(0, cursorPos);
        const atIndex = textBefore.lastIndexOf('@');

        if (atIndex !== -1) {
            const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : ' ';
            if (charBefore === ' ' || charBefore === '\n' || atIndex === 0) {
                const query = textBefore.substring(atIndex + 1);
                if (!query.includes(' ')) {
                    setMentionQuery(query);
                    setMentionStart(atIndex);
                    setMentionIndex(0);
                    return;
                }
            }
        }
        setMentionQuery(null);
        setMentionStart(-1);
    };

    const handleMentionSelect = (member) => {
        const before = newMessage.substring(0, mentionStart);
        const after = newMessage.substring(inputRef.current.selectionStart);
        const newVal = `${before}@${member.username} ${after}`;
        setNewMessage(newVal);
        setMentionQuery(null);
        setMentionStart(-1);
        setTimeout(() => {
            inputRef.current?.focus();
            const pos = before.length + member.username.length + 2;
            inputRef.current.setSelectionRange(pos, pos);
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (mentionQuery !== null && mentionMembers.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => Math.max(0, prev - 1));
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => Math.min(mentionMembers.length - 1, prev + 1));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleMentionSelect(mentionMembers[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setMentionQuery(null);
                setMentionStart(-1);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async (e, contentOverride = null) => {
        if (e) e.preventDefault();

        const content = contentOverride || newMessage;
        if (!channel) return;

        const hasText = content.trim().length > 0;
        if (!hasText && !attachment) return;
        if (!currentUser) return;

        let attachmentData = undefined;

        if (attachment) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("attachment", attachment);

            try {
                const uploadRes = await api.post('/upload', formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                attachmentData = uploadRes.data;
            } catch (err) {
                console.error("Upload error:", err);
                toast.error("Failed to upload attachment");
                setIsUploading(false);
                return; // Stop if upload fails
            }
        }

        const mentionedIds = [];
        const mentionRegex = /@(\w+)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            const user = communityMembers.find(m => m.username === match[1]);
            if (user) mentionedIds.push(user.id);
        }

        if (!contentOverride) setNewMessage('');
        setReplyingTo(null);
        setAttachment(null);
        setMentionQuery(null);
        setIsUploading(false);

        try {
            const res = await api.post('/messages', {
                serverId,
                channelId,
                senderId: currentUser.id,
                content: content,
                mentions: mentionedIds,
                replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, content: replyingTo.content } : undefined,
                attachment: attachmentData
            });

            setMessages(prev => [...prev, res.data]);

            if (socket) {
                socket.emit("new-message", {
                    serverId,
                    message: res.data,
                    channelName: channel?.name
                });
            }

        } catch (error) {
            console.error("API ERROR [SendMessage]:", error.response?.data || error.message);
            setNewMessage(content); // Revert
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error("File size must be under 10MB");
                return;
            }
            setAttachment(file);
        }
        // Reset the input value so the same file could be selected again if cancelled
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
    };

    const handleReply = (msg) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    const handleEmojiInsert = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleDelete = (messageId) => {
        deleteMessage(serverId, channelId, messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const handleProfileClick = (user, position) => {
        setProfilePopUser(user);
        setProfilePopPosition(position);
    };

    // --- Member Management ---
    const handleRemoveClick = (member) => {
        setMemberToRemove(member);
    };

    const handleSendGift = (gift) => {
        handleSendMessage(null, `[GIFT:${gift.id}]`);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove || !community) return;
        setIsRemoving(true);
        try {
            await api.delete(`/servers/${serverId}/members/${memberToRemove.id}`);

            // Fire real-time expulsion hook
            if (socket) {
                socket.emit('remove-member', {
                    serverId,
                    memberId: memberToRemove.id
                });
            }
            toast.success(`Removed ${memberToRemove.username}`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to remove member");
        } finally {
            setIsRemoving(false);
            setMemberToRemove(null);
        }
    };

    // Sort Members List (Owners first, then Members)
    const sortedMembers = useMemo(() => {
        if (!community || !communityMembers.length) return { owners: [], regulars: [] };

        const owners = [];
        const regulars = [];

        communityMembers.forEach(user => {
            if (user.id === community.creatorId) {
                owners.push(user);
            } else {
                regulars.push(user);
            }
        });

        // Alphabetical sort
        const alphaSort = (a, b) => a.username.localeCompare(b.username);
        owners.sort(alphaSort);
        regulars.sort(alphaSort);

        return { owners, regulars };
    }, [communityMembers, community]);

    const isCurrentUserOwner = currentUser?.id === community?.creatorId;

    // --- Header Utility Logic ---

    // Search Logic
    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !messages.length) return [];
        const query = searchQuery.toLowerCase();
        return messages.filter(msg => msg.content && msg.content.toLowerCase().includes(query)).slice(-20).reverse(); // max 20, newest first
    }, [searchQuery, messages]);

    const scrollToMessage = (messageId) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-[#5865F2]/20', 'transition-colors', 'duration-500');
            setTimeout(() => {
                element.classList.remove('bg-[#5865F2]/20');
            }, 2000);
        }
    };

    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (inboxRef.current && !inboxRef.current.contains(event.target)) {
                setShowInbox(false);
            }
            if (pinsRef.current && !pinsRef.current.contains(event.target)) {
                setShowPins(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mock Inbox / Notifications Data (Filtering current channel messages for mentions)
    const recentMentions = useMemo(() => {
        if (!currentUser || !messages.length) return [];
        return messages.filter(msg => {
            // Check explicit mentions array or regex parse if mentions array isn't populated
            if (msg.mentions && msg.mentions.includes(currentUser.id)) return true;
            if (msg.content && msg.content.includes(`@${currentUser.username}`)) return true;
            return false;
        }).reverse().slice(0, 10);
    }, [messages, currentUser]);

    // Mock Pinned Messages (Just taking the oldest message for simulation if it exists)
    const pinnedMessages = useMemo(() => {
        if (!messages.length) return [];
        return [messages[0]]; // Mocking the first message as pinned
    }, [messages]);


    if (channelLoading) return (
        <div className="flex-1 h-screen bg-[#313338] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[#949ba4] text-sm font-medium animate-pulse">Loading channel...</div>
        </div>
    );

    if (channelError) return (
        <div className="flex-1 h-screen bg-[#313338] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Channel</h2>
            <p className="text-[#949ba4] max-w-sm mb-6">{channelError}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-md font-medium transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    if (!channel) return (
        <div className="flex-1 h-screen bg-[#313338] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-[#5865F2]/10 rounded-full flex items-center justify-center mb-4">
                <Hash size={32} className="text-[#5865F2]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Channel Not Found</h2>
            <p className="text-[#949ba4] max-w-sm">This channel doesn't exist or you don't have access to it.</p>
        </div>
    );

    /* Build messages with date separators */
    const renderMessages = () => {
        const elements = [];
        let lastDate = null;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const msgDate = new Date(msg.timestamp).toDateString();

            if (msgDate !== lastDate) {
                elements.push(
                    <DateSeparator key={`date-${msgDate}`} label={formatDateLabel(msg.timestamp)} />
                );
                lastDate = msgDate;
            }

            const prev = i > 0 ? messages[i - 1] : null;
            const grouped = shouldGroup(prev, msg) && isSameDay(prev?.timestamp, msg.timestamp);

            elements.push(
                <motion.div
                    key={msg.id}
                    id={`message-${msg.id}`}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                >
                    <MessageRow
                        message={msg}
                        isGrouped={grouped}
                        onReply={handleReply}
                        onDelete={handleDelete}
                        currentUser={currentUser}
                        serverId={serverId}
                        channelId={channelId}
                        toggleReaction={toggleReaction}
                        messages={messages}
                        allUsers={allUsers}
                        onProfileClick={handleProfileClick}
                    />
                </motion.div>
            );
        }

        return elements;
    };

    return (
        <div className="flex flex-col h-full bg-[#313338] relative min-w-0">
            {/* Header (Spans the entire ChatArea width) */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#1e1f22] bg-[#313338] shadow-sm z-10 flex-shrink-0">
                <div className="flex items-center gap-3 w-full min-w-0">
                    {/* Hamburger for Mobile */}
                    <button
                        onClick={onOpenDrawer}
                        className="md:hidden text-[#b5bac1] hover:text-[#dbdee1] transition-colors shrink-0"
                    >
                        <Menu size={24} />
                    </button>

                    <Hash className="text-[#80848e] hidden md:block shrink-0" size={24} />
                    <h2 className="font-bold text-white text-base truncate">{channel?.name}</h2>
                    {channel?.description && (
                        <>
                            <div className="w-px h-6 bg-[#3f4147] mx-2 hidden md:block shrink-0"></div>
                            <p className="text-sm text-[#b5bac1] truncate hidden md:block min-w-0">
                                {channel.description}
                            </p>
                        </>
                    )}
                </div>

                {/* Top Right Header Utilities */}
                <div className="flex items-center gap-[16px] text-[#b5bac1] shrink-0 ml-4 mr-2 h-full">
                    <button className="flex items-center justify-center hover:text-[#dbdee1] transition-colors hidden lg:flex cursor-not-allowed opacity-50 h-[24px]" title="Threads (Coming Soon)">
                        <Hash className="w-[24px] h-[24px]" />
                    </button>

                    {/* Notifications (Bell) */}
                    <div className="relative hidden md:flex items-center h-[24px]" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowInbox(false);
                                setShowPins(false);
                                if (!showNotifications && unreadCount > 0) {
                                    markNotificationsAsRead();
                                }
                            }}
                            className={`relative flex items-center justify-center hover:text-[#dbdee1] transition-colors h-full ${showNotifications ? 'text-[#f2f3f5]' : ''}`}
                            title="Notification Settings"
                        >
                            <Bell className="w-[24px] h-[24px]" />
                            {unreadCount > 0 && (
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#da373c] rounded-full border-[2.5px] border-[#313338]" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-[140%] right-[-10px] w-[360px] bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                                >
                                    <div className="px-4 py-3 border-b border-[#1e1f22] bg-[#313338]/50 flex items-center justify-between shadow-sm z-10">
                                        <span className="font-bold text-[#f2f3f5]">Notifications</span>
                                        {globalNotifications.length > 0 && (
                                            <span className="text-[12px] text-[#dbdee1] bg-[#1e1f22] px-2 py-0.5 rounded-full">{globalNotifications.length}</span>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                                        {globalNotifications.length > 0 ? (
                                            globalNotifications.map((notif, idx) => (
                                                <div key={notif.id || idx} className="p-3 border-b border-[#1e1f22]/50 hover:bg-[#35373c]/50 transition-colors flex items-start gap-3">
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {notif.type === 'MESSAGE' ? <Bell className="w-4 h-4 text-[#5865F2]" /> :
                                                            notif.type === 'JOIN' ? <Users className="w-4 h-4 text-[#23a559]" /> :
                                                                <Users className="w-4 h-4 text-[#da373c]" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] text-[#dbdee1] leading-snug">
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-[11px] text-[#949ba4] mt-1 block">
                                                            {formatTime(notif.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-[#949ba4]">
                                                <div className="w-16 h-16 rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto mb-4">
                                                    <Bell className="w-8 h-8 text-[#80848e]" />
                                                </div>
                                                <p className="text-[15px] font-medium text-[#dbdee1] mb-1">No new notifications</p>
                                                <p className="text-[13px]">You're all caught up! Check back later.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pinned Messages */}
                    <div className="relative hidden md:flex items-center h-[24px]" ref={pinsRef}>
                        <button
                            onClick={() => {
                                setShowPins(!showPins);
                                setShowNotifications(false);
                                setShowInbox(false);
                            }}
                            className={`flex items-center justify-center hover:text-[#dbdee1] transition-colors h-full ${showPins ? 'text-[#f2f3f5]' : ''}`}
                            title="Pinned Messages"
                        >
                            <Pin className="w-[24px] h-[24px]" />
                        </button>

                        <AnimatePresence>
                            {showPins && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-[140%] right-[-60px] w-[400px] bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col max-h-[500px]"
                                >
                                    <div className="px-4 py-3 border-b border-[#1e1f22] bg-[#313338]/50 flex items-center justify-between shadow-sm z-10">
                                        <span className="font-bold text-[#f2f3f5]">Pinned Messages</span>
                                    </div>
                                    <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                                        {pinnedMessages.length > 0 ? (
                                            <div className="p-2 space-y-2">
                                                {pinnedMessages.map(msg => (
                                                    <div key={`pin-${msg.id}`} className="bg-[#313338] rounded p-3 border border-[#1e1f22]">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Avatar src={msg.senderAvatar} username={msg.senderName} size="xs" />
                                                            <span className="text-[15px] font-medium text-[#f2f3f5]">{msg.senderName}</span>
                                                            <span className="text-[11px] text-[#949ba4]">{formatTime(msg.timestamp)}</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#dbdee1] break-words whitespace-pre-wrap pl-8">
                                                            {msg.content}
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setShowPins(false);
                                                                scrollToMessage(msg.id);
                                                            }}
                                                            className="mt-2 ml-8 text-[12px] bg-[#2b2d31] hover:bg-[#404249] text-[#dbdee1] px-2 py-1 rounded transition-colors"
                                                        >
                                                            Jump
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-[#949ba4]">
                                                <div className="w-16 h-16 rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto mb-4">
                                                    <Pin className="w-8 h-8 text-[#80848e]" />
                                                </div>
                                                <p className="text-[15px] font-medium text-[#dbdee1] mb-1">No pinned messages</p>
                                                <p className="text-[13px]">Messages pinned in this channel will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setShowMembersPanel(!showMembersPanel)}
                        className={`flex items-center justify-center hover:text-[#dbdee1] transition-colors hidden md:flex h-[24px] ${showMembersPanel ? 'text-[#f2f3f5]' : ''}`}
                        title={showMembersPanel ? "Hide Member List" : "Show Member List"}
                    >
                        <Users className="w-[24px] h-[24px]" />
                    </button>

                    {/* Search Bar */}
                    <div className="relative hidden lg:flex items-center">
                        <div
                            className={`flex items-center bg-[#1e1f22] rounded-[4px] px-2 h-[24px] overflow-hidden transition-all duration-200 ease-out group ${isSearchFocused ? 'w-[240px] shadow-[0_0_0_1px_rgba(88,101,242,1)]' : 'w-[144px]'}`}
                        >
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="bg-transparent border-none outline-none text-[13px] text-[#dbdee1] font-medium placeholder:text-[#949ba4] placeholder:font-medium w-full min-w-0"
                            />
                            {searchQuery ? (
                                <X
                                    className="w-4 h-4 text-[#dbdee1] ml-auto cursor-pointer flex-shrink-0"
                                    onClick={() => setSearchQuery('')}
                                />
                            ) : (
                                <Search className={`w-4 h-4 ml-auto flex-shrink-0 transition-colors ${isSearchFocused ? 'text-[#dbdee1]' : 'text-[#949ba4] group-hover:text-[#b5bac1]'}`} />
                            )}
                        </div>

                        {/* Search Dropdown */}
                        <AnimatePresence>
                            {isSearchFocused && searchQuery.trim() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-[120%] right-0 w-[320px] bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                                >
                                    <div className="px-3 py-2 border-b border-[#1e1f22] bg-[#313338]/50">
                                        <span className="text-xs font-bold text-[#b5bac1] uppercase">Search Results</span>
                                    </div>
                                    <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                                        {searchResults.length > 0 ? (
                                            searchResults.map(msg => (
                                                <button
                                                    key={msg.id}
                                                    onClick={() => scrollToMessage(msg.id)}
                                                    className="w-full text-left px-3 py-2 hover:bg-[#35373c] transition-colors border-b border-[#1e1f22]/50 last:border-0"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Avatar src={msg.senderAvatar} username={msg.senderName} size="xs" />
                                                        <span className="text-sm font-medium text-[#f2f3f5]">{msg.senderName}</span>
                                                        <span className="text-[10px] text-[#949ba4]">{formatTime(msg.timestamp)}</span>
                                                    </div>
                                                    <p className="text-sm text-[#dbdee1] line-clamp-2 break-words leading-snug">
                                                        {msg.content}
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-[#949ba4]">
                                                <div className="w-12 h-12 rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto mb-3">
                                                    <Search className="w-6 h-6 text-[#80848e]" />
                                                </div>
                                                <p className="text-sm">No results found for "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Inbox */}
                    <div className="relative hidden xl:flex items-center h-[24px]" ref={inboxRef}>
                        <button
                            onClick={() => {
                                setShowInbox(!showInbox);
                                setShowNotifications(false);
                                setShowPins(false);
                            }}
                            className={`flex items-center justify-center hover:text-[#dbdee1] transition-colors h-full ${showInbox ? 'text-[#f2f3f5]' : ''}`}
                            title="Inbox"
                        >
                            <Inbox className="w-[24px] h-[24px]" />
                        </button>

                        <AnimatePresence>
                            {showInbox && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-[140%] right-[-40px] w-[420px] bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col max-h-[500px]"
                                >
                                    <div className="px-4 py-3 border-b border-[#1e1f22] bg-[#313338]/50 grid grid-cols-2 gap-4">
                                        <button className="text-[14px] font-bold text-[#f2f3f5] border-b-2 border-[#5865F2] pb-2 -mb-3 text-center">Mentions</button>
                                        <button className="text-[14px] font-medium text-[#b5bac1] hover:text-[#dbdee1] pb-2 -mb-3 text-center transition-colors cursor-not-allowed">Unreads</button>
                                    </div>
                                    <div className="overflow-y-auto pt-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                                        {recentMentions.length > 0 ? (
                                            recentMentions.map(msg => (
                                                <button
                                                    key={`mention-${msg.id}`}
                                                    onClick={() => {
                                                        setShowInbox(false);
                                                        scrollToMessage(msg.id);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-[#35373c] transition-colors border-b border-[#1e1f22]/50 last:border-0"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex-1 text-[12px] font-semibold text-[#80848e] uppercase tracking-wide">
                                                            #{channel.name}
                                                        </div>
                                                    </div>
                                                    <div className="bg-[#1e1f22] rounded min-h-[60px] p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Avatar src={msg.senderAvatar} username={msg.senderName} size="xs" />
                                                            <span className="text-[15px] font-medium text-[#f2f3f5]">{msg.senderName}</span>
                                                            <span className="text-[11px] text-[#949ba4]">{formatTime(msg.timestamp)}</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#dbdee1] break-words leading-snug">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-12 text-center text-[#949ba4]">
                                                <div className="w-[100px] h-[100px] rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto mb-4">
                                                    <Inbox className="w-12 h-12 text-[#80848e]" />
                                                </div>
                                                <p className="text-[15px] font-medium text-[#dbdee1] mb-1">No recent mentions</p>
                                                <p className="text-[13px]">When someone mentions you, it will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center justify-center hover:text-[#dbdee1] transition-colors hidden xl:flex h-[24px]"
                        title="Keyboard Shortcuts & Help"
                    >
                        <HelpCircle className="w-[24px] h-[24px]" />
                    </button>
                </div>
            </div>

            {/* ── Chat Content Layout (Messages + Members Panel side-by-side) ── */}
            <div className="flex-1 flex overflow-hidden min-w-0">

                {/* Left side: Messages List + Input Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                        <div className="px-4 pt-16 pb-4">
                            <div className="w-[68px] h-[68px] rounded-full bg-[#5865F2]/20 flex items-center justify-center mb-4">
                                <Hash size={36} className="text-[#f2f3f5]" />
                            </div>
                            <h2 className="text-[32px] font-bold text-[#f2f3f5] mb-2">Welcome to #{channel.name}!</h2>
                            <p className="text-[14px] text-[#949ba4]">
                                This is the start of the <strong className="text-[#f2f3f5]">#{channel.name}</strong> channel.
                            </p>
                        </div>

                        <AnimatePresence>
                            {renderMessages()}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="h-6" />
                    </div>

                    {/* Input Area */}
                    <div className="px-4 pb-6 pt-2 shrink-0 bg-[#313338]">
                        {replyingTo && (
                            <div className="flex items-center justify-between bg-[#2b2d31] text-[#b5bac1] text-sm px-4 py-2 rounded-t-xl border-t border-x border-[#1e1f22]">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="font-bold text-[#f2f3f5]">Replying to {replyingTo.senderName}</span>
                                    <span className="truncate max-w-[200px] md:max-w-md ml-2 text-[#949ba4]">{replyingTo.content}</span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="hover:text-white shrink-0 ml-2">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {mentionQuery !== null && mentionMembers.length > 0 && (
                            <MentionDropdown
                                query={mentionQuery}
                                members={mentionMembers}
                                selectedIndex={mentionIndex}
                                onSelect={handleMentionSelect}
                            />
                        )}

                        {/* Attachment Preview */}
                        {attachment && (
                            <div className="bg-[#2b2d31] border-t border-x border-[#1e1f22] p-4 rounded-t-xl flex items-center gap-4 text-[#dbdee1]">
                                <div className="relative w-16 h-16 bg-[#232428] rounded-md flex items-center justify-center overflow-hidden border border-[#1e1f22]">
                                    {attachment.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-lg text-[#949ba4] uppercase">{attachment.name.split('.').pop()}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{attachment.name}</p>
                                    <p className="text-xs text-[#949ba4]">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={handleRemoveAttachment}
                                    className="p-1 text-[#b5bac1] hover:text-[#da373c] bg-[#1e1f22] rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={(e) => handleSendMessage(e)}>
                            <div className={`flex items-center bg-[#383a40] ${(replyingTo || attachment) ? 'rounded-b-lg' : 'rounded-lg'} transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(88,101,242,0.4)]`}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[#b5bac1] hover:text-[#dbdee1] p-2.5 pl-4 flex-shrink-0 transition-colors"
                                    title="Upload File"
                                    disabled={isUploading}
                                >
                                    <PlusCircle size={22} />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isUploading ? "Uploading..." : `Message #${channel.name}`}
                                    className="flex-1 bg-transparent text-[#dbdee1] text-[15px] py-3 pl-2 pr-2 focus:outline-none placeholder:text-[#6d6f78]"
                                    disabled={isUploading}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowGiftModal(true)}
                                    className="p-2.5 text-[#b5bac1] hover:text-[#dbdee1] transition-transform hover:scale-110"
                                    title="Send a Gift"
                                >
                                    <Gift size={22} />
                                </button>

                                <button
                                    ref={emojiBtnRef}
                                    type="button"
                                    onClick={() => setShowEmojiPicker(prev => !prev)}
                                    className="p-2.5 text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                                    title="Select Emoji"
                                >
                                    <Smile size={22} />
                                </button>

                                <button
                                    type="submit"
                                    disabled={isUploading || (!newMessage.trim() && !attachment)}
                                    className="p-2.5 mr-1 text-[#b5bac1] hover:text-[#5865F2] disabled:opacity-50 disabled:hover:text-[#b5bac1] transition-colors"
                                    title="Send Message"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>

                        {showEmojiPicker && (
                            <EmojiPicker
                                anchorRef={emojiBtnRef}
                                onSelect={handleEmojiInsert}
                                onClose={() => setShowEmojiPicker(false)}
                            />
                        )}
                    </div>
                </div> {/* End Left side Messages Section */}

                {/* ── Right side: Members Sidebar ── */}
                {/* 
                  Proper width: w-[240px]
                  Fixed on right side, full height of the content area below the header.
                  Does not overlay chat, pushes chat left.
                */}
                <AnimatePresence initial={false}>
                    {showMembersPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 240, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="bg-[#2b2d31] border-l border-[#1e1f22] hidden md:flex flex-col flex-shrink-0"
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 w-[240px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                                {/* Owners Category */}
                                {sortedMembers.owners.length > 0 && (
                                    <div>
                                        <h3 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-1 px-2 select-none">
                                            Owner — {sortedMembers.owners.length}
                                        </h3>
                                        <div className="space-y-[2px]">
                                            {sortedMembers.owners.map(m => (
                                                <MemberRow
                                                    key={m.id}
                                                    member={m}
                                                    role="MODERATOR"
                                                    isOwner={isCurrentUserOwner}
                                                    isBooster={community?.boosts?.some(b => b.userId === m.id || (b.user && b.user._id === m.id))}
                                                    onRemoveClick={handleRemoveClick}
                                                    onProfileClick={handleProfileClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Regular Members Category */}
                                {sortedMembers.regulars.length > 0 && (
                                    <div>
                                        <h3 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-1 px-2 mt-4 select-none">
                                            Members — {sortedMembers.regulars.length}
                                        </h3>
                                        <div className="space-y-[2px]">
                                            {sortedMembers.regulars.map(m => (
                                                <MemberRow
                                                    key={m.id}
                                                    member={m}
                                                    role="MEMBER"
                                                    isOwner={isCurrentUserOwner}
                                                    isBooster={community?.boosts?.some(b => b.userId === m.id || (b.user && b.user._id === m.id))}
                                                    onRemoveClick={handleRemoveClick}
                                                    onProfileClick={handleProfileClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div> {/* End Chat Content Layout (Messages + Sidebar) */}

            {/* Modals float independently at the root so they z-index globally spanning the whole screen */}
            <RemoveMemberModal
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={confirmRemoveMember}
                memberName={memberToRemove?.username}
                isRemoving={isRemoving}
            />

            {profilePopUser && (
                <ProfilePopCard
                    user={profilePopUser}
                    position={profilePopPosition}
                    onClose={() => setProfilePopUser(null)}
                    onEditProfile={() => {
                        setProfilePopUser(null);
                        setShowSettings(true);
                    }}
                    communityId={serverId}
                />
            )}

            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}

            {/* Help / Shortcuts Modal */}
            <AnimatePresence>
                {showHelp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="bg-[#313338] rounded-xl shadow-2xl w-full max-w-md border border-[#1e1f22] overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-[#1e1f22] bg-[#2b2d31]">
                                <h3 className="text-lg font-bold text-[#f2f3f5]">Keyboard Shortcuts</h3>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="p-1 rounded bg-transparent hover:bg-[#404249] text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-[#dbdee1] text-[15px] mb-4">Navigate CyberChat like a pro:</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#949ba4] text-[14px]">Edit Last Message</span>
                                        <kbd className="bg-[#1e1f22] border border-[#2b2d31] rounded px-2 py-1 text-xs text-[#dbdee1] font-mono shadow-[0_2px_0_rgba(0,0,0,0.2)]">Up Arrow</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#949ba4] text-[14px]">Send Message</span>
                                        <kbd className="bg-[#1e1f22] border border-[#2b2d31] rounded px-2 py-1 text-xs text-[#dbdee1] font-mono shadow-[0_2px_0_rgba(0,0,0,0.2)]">Enter</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#949ba4] text-[14px]">Close Modals</span>
                                        <kbd className="bg-[#1e1f22] border border-[#2b2d31] rounded px-2 py-1 text-xs text-[#dbdee1] font-mono shadow-[0_2px_0_rgba(0,0,0,0.2)]">Escape</kbd>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <GiftModal
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                onSelectGift={handleSendGift}
            />
        </div>
    );
};

export default ChatArea;
