import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Hash, Menu, Phone, Video, Search, HelpCircle, Gift, PlusCircle, Smile, Inbox, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, useNotifications } from '../../context/SocketContext';
import api from '../../utils/axios';
import EmojiPicker from './EmojiPicker';
import MessageRow, { shouldGroup, isSameDay, DateSeparator, MentionDropdown, formatDateLabel } from './MessageRow';
import GiftModal from './GiftModal';
import ProfilePopCard from '../ui/ProfilePopCard';
import SettingsModal from '../modals/SettingsModal';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';

const DMChatArea = ({ onOpenDrawer, onJoinVoice }) => {
    const { channelId: conversationId } = useParams(); // Using channelId param for convoId to reuse existing route structure
    const { currentUser } = useAuth();
    const socket = useSocket();
    const { dmNotifications, setDmNotifications } = useNotifications();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [profilePopUser, setProfilePopUser] = useState(null);
    const [profilePopPosition, setProfilePopPosition] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Mention state
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const emojiBtnRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load initial messages
    useEffect(() => {
        if (!conversationId) return;
        const fetchMessages = async () => {
            setLoading(true);
            try {
                // Determine layout details (other participant)
                const convRes = await api.get('/dm/conversations');
                const targetConvo = convRes.data.find(c => c._id === conversationId);
                setConversation(targetConvo);

                const res = await api.get(`/dm/${conversationId}/messages`);
                setMessages(res.data);

                // Clear unread for this conversation if any existed
                setDmNotifications(prev => prev.filter(n => n.conversationId !== conversationId));
            } catch (error) {
                console.error("Failed to load DMs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [conversationId]);

    // Track incoming socket messages
    useEffect(() => {
        if (!socket || !conversationId) return;

        const handleNewDm = ({ message, conversationId: incConvoId }) => {
            if (incConvoId === conversationId) {
                setMessages(prev => [...prev, message]);
                setDmNotifications(prev => prev.filter(n => n.conversationId !== conversationId));
            }
        };

        const handleDmDeleted = ({ messageId, conversationId: incConvoId }) => {
            if (incConvoId === conversationId) {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
        };

        const handleDmReacted = ({ message, conversationId: incConvoId }) => {
            if (incConvoId === conversationId) {
                setMessages(prev => prev.map(m => m._id === message._id ? message : m));
            }
        };

        socket.on("direct-message-received", handleNewDm);
        socket.on("direct-message-deleted", handleDmDeleted);
        socket.on("direct-message-reacted", handleDmReacted);
        return () => {
            socket.off("direct-message-received", handleNewDm);
            socket.off("direct-message-deleted", handleDmDeleted);
            socket.off("direct-message-reacted", handleDmReacted);
        };
    }, [socket, conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e, contentOverride = null) => {
        if (e) e.preventDefault();

        const content = contentOverride || newMessage;
        const hasText = content.trim().length > 0;
        if ((!hasText && !attachment) || !conversationId) return;

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

        if (!contentOverride) setNewMessage("");
        setReplyingTo(null);
        setAttachment(null);
        setMentionQuery(null);
        setIsUploading(false);

        try {
            const res = await api.post(`/dm/${conversationId}/messages`, {
                content,
                replyTo: replyingTo ? { id: replyingTo._id, senderName: replyingTo.sender.username, content: replyingTo.content } : undefined,
                attachment: attachmentData
            });
            setMessages(prev => [...prev, res.data]);

            // Notify other participant(s) over Socket
            if (socket && conversation) {
                const otherParticipants = conversation.participants.filter(p => typeof p === 'object' ? p._id !== currentUser.id : p !== currentUser.id);
                otherParticipants.forEach(p => {
                    const receiverId = typeof p === 'object' ? p._id : p;
                    socket.emit("send-direct-message", { receiverId, message: res.data, conversationId });
                });
            }
        } catch (error) {
            console.error("Failed to send DM", error);
            setNewMessage(content); // Revert
        }
    };

    const handleDelete = async (messageId) => {
        try {
            await api.delete(`/dm/${conversationId}/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));

            if (socket && conversation) {
                const otherParticipants = conversation.participants.filter(p => typeof p === 'object' ? p._id !== currentUser.id : p !== currentUser.id);
                otherParticipants.forEach(p => {
                    const receiverId = typeof p === 'object' ? p._id : p;
                    socket.emit("delete-direct-message", { receiverId, messageId, conversationId });
                });
            }
        } catch (error) {
            console.error("Failed to delete DM", error);
            toast.error("Failed to delete message");
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        try {
            const res = await api.post(`/dm/${conversationId}/messages/${messageId}/react`, { emoji });
            setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));

            if (socket && conversation) {
                const otherParticipants = conversation.participants.filter(p => typeof p === 'object' ? p._id !== currentUser.id : p !== currentUser.id);
                otherParticipants.forEach(p => {
                    const receiverId = typeof p === 'object' ? p._id : p;
                    socket.emit("react-direct-message", { receiverId, message: res.data, conversationId });
                });
            }
        } catch (error) {
            console.error("Failed to react to DM", error);
            toast.error("Failed to add reaction");
        }
    };

    const handleReply = (msg) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    const handleEmojiInsert = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setTimeout(() => inputRef.current?.focus(), 0);
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
    };

    const initiateCall = (callType) => {
        if (!conversation || !socket || !currentUser) return;
        const otherUser = conversation.participants.find(p => (p._id || p) !== currentUser.id);
        const targetUserId = otherUser?._id || otherUser;

        if (targetUserId) {
            socket.emit('call-invite', {
                targetUserId,
                callType,
                conversationId,
                caller: currentUser
            });
        }

        onJoinVoice(callType);
    };

    const handleSendGift = (gift) => {
        handleSendMessage(null, `[GIFT:${gift.id}]`);
    };

    const handleProfileClick = (user, position) => {
        setProfilePopUser(user);
        setProfilePopPosition(position);
    };

    if (loading) {
        return <div className="flex-1 bg-[#313338] flex items-center justify-center text-[#949ba4]">Loading...</div>;
    }

    if (!conversation) {
        return <div className="flex-1 bg-[#313338] flex items-center justify-center text-[#dbdee1]">Conversation not found.</div>;
    }

    const otherUser = conversation.participants.find(p => p._id !== currentUser.id) || conversation.participants[0];

    const mentionMembers = [otherUser, currentUser];

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
            handleSendMessage(e);
        }
    };

    const renderMessages = () => {
        const elements = [];
        let lastDate = null;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const msgDate = new Date(msg.createdAt).toDateString();

            if (msgDate !== lastDate) {
                elements.push(
                    <DateSeparator key={`date-${msgDate}`} label={formatDateLabel(msg.createdAt)} />
                );
                lastDate = msgDate;
            }

            const prev = i > 0 ? messages[i - 1] : null;
            const grouped = shouldGroup(prev, msg) && isSameDay(prev?.createdAt, msg.createdAt);

            elements.push(
                <MessageRow
                    key={msg._id}
                    message={msg}
                    isGrouped={grouped}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    currentUser={currentUser}
                    toggleReaction={toggleReaction}
                    messages={messages}
                    allUsers={conversation.participants}
                    onProfileClick={handleProfileClick}
                />
            );
        }

        return elements;
    };

    return (
        <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden relative">
            {/* Header */}
            <div className="h-14 border-b border-[#1e1f22] shadow-sm flex items-center justify-between px-4 sticky top-0 bg-[#313338] z-10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onOpenDrawer}
                        className="md:hidden text-[#b5bac1] hover:text-[#dbdee1]"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2 text-[#f2f3f5] font-semibold">
                        <span className="text-[#80848e] font-bold text-xl inline-block mr-1">@</span>
                        {otherUser?.username || "Unknown"}
                        {otherUser?.nitro?.isActive && (
                            <Sparkles size={16} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                        )}
                        {otherUser?.status === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-[#2dc770] ml-1"></div>}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[#b5bac1]">
                    <Phone onClick={() => initiateCall('audio')} size={24} className="hover:text-[#dbdee1] cursor-pointer hidden sm:block" />
                    <Video onClick={() => initiateCall('video')} size={24} className="hover:text-[#dbdee1] cursor-pointer hidden sm:block" />
                    <div className="hidden sm:flex items-center bg-[#1e1f22] rounded overflow-hidden px-2 py-1 relative">
                        <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm w-36 text-[#dbdee1] placeholder:text-[#949ba4]" disabled />
                        <Search size={16} className="text-[#949ba4]" />
                    </div>
                    <HelpCircle size={24} className="hover:text-[#dbdee1] cursor-pointer" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5 no-scrollbar custom-scrollbar">
                {/* Beginning of conversation marker */}
                <div className="mt-10 mb-6 px-4">
                    <div className="mb-4">
                        <Avatar
                            src={otherUser?.profilePicture}
                            username={otherUser?.username}
                            size="2xl"
                            isNitro={otherUser?.nitro?.isActive}
                            profileEffects={otherUser?.profileEffects}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-[#f2f3f5] mb-2 flex items-center gap-2">
                        {otherUser?.username}
                        {otherUser?.nitro?.isActive && (
                            <Sparkles size={24} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                        )}
                    </h1>
                    <p className="text-[#b5bac1]">This is the beginning of your direct message history with <strong className="text-[#dbdee1]">@{otherUser?.username}</strong>.</p>
                </div>

                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pt-0 flex-shrink-0 bg-[#313338] relative">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-[#2b2d31] text-[#b5bac1] text-sm px-4 py-2 rounded-t-xl border-t border-x border-[#1e1f22]">
                        <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-[#f2f3f5] flex items-center gap-1">
                                Replying to {replyingTo.sender?.username}
                                {replyingTo.sender?.nitro?.isActive && (
                                    <Sparkles size={14} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                                )}
                            </span>
                            <span className="truncate max-w-[200px] md:max-w-md ml-2 text-[#949ba4]">{replyingTo.content}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="hover:text-white shrink-0 ml-2">
                            <Menu size={16} className="rotate-45 hidden" />
                            <span className="font-bold">x</span>
                        </button>
                    </div>
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

                {mentionQuery !== null && mentionMembers.length > 0 && (
                    <MentionDropdown
                        query={mentionQuery}
                        members={mentionMembers}
                        selectedIndex={mentionIndex}
                        onSelect={handleMentionSelect}
                    />
                )}

                <form onSubmit={handleSendMessage} className={`bg-[#383a40] ${(replyingTo || attachment) ? 'rounded-b-lg' : 'rounded-lg'} flex items-center px-4 py-2.5`}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#b5bac1] hover:text-[#dbdee1] p-1 mr-3 flex-shrink-0 transition-colors"
                        title="Upload File"
                        disabled={isUploading}
                    >
                        <PlusCircle size={24} />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isUploading ? "Uploading..." : `Message @${otherUser?.username}`}
                        className="flex-1 bg-transparent border-none outline-none text-[#dbdee1] placeholder:text-[#949ba4] min-w-0"
                        disabled={isUploading}
                    />
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={isUploading || (!newMessage.trim() && !attachment)}
                            className="text-[#b5bac1] hover:text-[#5865F2] transition-colors disabled:opacity-50 disabled:hover:text-[#b5bac1]"
                            title="Send Message"
                        >
                            <Send size={24} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowGiftModal(true)}
                            className="text-[#b5bac1] hover:text-[#dbdee1] transition-transform hover:scale-110"
                            title="Send a Gift"
                        >
                            <Gift size={24} />
                        </button>
                        <button
                            type="button"
                            ref={emojiBtnRef}
                            onClick={() => setShowEmojiPicker(prev => !prev)}
                            className="text-[#b5bac1] hover:text-[#dbdee1] transition-transform hover:scale-110"
                            title="Select Emoji"
                        >
                            <Smile size={24} />
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

            <GiftModal
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                onSelectGift={handleSendGift}
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
                />
            )}

            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};

export default DMChatArea;
