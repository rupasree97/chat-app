import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Hash, Volume2, Settings, Plus, Mic, MicOff, PhoneOff, Pencil, Trash2, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import CreateChannelModal from '../modals/CreateChannelModal';
import ConfirmModal from '../modals/ConfirmModal';
import ServerSettingsModal from '../modals/ServerSettingsModal';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';

/* ═══════════════════════════════════════════════════════════════════
   Context Menu — appears on right-click for owner-only channel actions
   ═══════════════════════════════════════════════════════════════════ */
const ChannelContextMenu = ({ x, y, onRename, onDelete, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = () => onClose();
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Adjust position to stay within viewport
    const style = { top: y, left: x };

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] bg-[#111214] rounded-lg shadow-xl border border-[#2d2f33] py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onRename(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white transition-colors rounded-sm mx-0"
            >
                <Pencil size={14} />
                Rename Channel
            </button>
            <div className="h-px bg-[#2d2f33] my-1 mx-2" />
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-[#da373c] hover:bg-[#da373c] hover:text-white transition-colors rounded-sm mx-0"
            >
                <Trash2 size={14} />
                Delete Channel
            </button>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   Inline Rename Input — enters edit mode for a channel name
   ═══════════════════════════════════════════════════════════════════ */
const InlineRenameInput = ({ currentName, onSave, onCancel }) => {
    const [value, setValue] = useState(currentName);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = value.trim();
            if (trimmed && trimmed !== currentName) {
                onSave(trimmed);
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== currentName) {
            onSave(trimmed);
        } else {
            onCancel();
        }
    };

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={50}
            className="bg-[#1e1f22] text-[#f2f3f5] text-[15px] rounded px-1.5 py-0.5 outline-none ring-1 ring-[#5865F2] w-full"
            onClick={(e) => e.preventDefault()}
        />
    );
};

/* ═══════════════════════════════════════════════════════════════════
   Channel Sidebar — with admin-only controls
   ═══════════════════════════════════════════════════════════════════ */
const ChannelSidebar = ({
    activeVoiceChannelId,
    isVoiceConnected,
    voicePeers,
    speakingUsers,
    onJoinVoice,
    onLeaveVoice,
    onToggleMute
}) => {
    const { serverId, channelId } = useParams();
    const navigate = useNavigate();
    const { communities, isOwner, renameChannel, deleteChannel, leaveCommunity } = useData();
    const { currentUser } = useAuth();
    const socket = useSocket();

    const [createTextOpen, setCreateTextOpen] = useState(false);
    const [createVoiceOpen, setCreateVoiceOpen] = useState(false);
    const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null); // { x, y, channel }

    // Inline rename state
    const [renamingChannelId, setRenamingChannelId] = useState(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null); // channel object

    const community = communities.find(c => c.id === serverId);
    const ownerMode = isOwner(serverId);

    if (!community) {
        return (
            <div className="flex-1 w-full bg-[#2b2d31] h-screen border-r border-[#1e1f22] flex flex-col p-4">
                <div className="h-14 border-b border-[#1e1f22] shadow-sm flex items-center mb-4">
                    <h2 className="font-bold text-[#f2f3f5] text-[15px]">Error</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <span className="text-[#949ba4] text-sm">Server not found</span>
                </div>
            </div>
        );
    }

    const handleContextMenu = (e, channel) => {
        if (!ownerMode) return; // non-owners get default browser menu
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, channel });
    };

    const startRename = (channel) => {
        setRenamingChannelId(channel.id);
    };

    const handleRenameSave = (channelId, newName) => {
        const formatted = community.channels.find(c => c.id === channelId)?.type === 'voice'
            ? newName
            : newName.toLowerCase().replace(/\s+/g, '-');
        renameChannel(serverId, channelId, formatted);
        setRenamingChannelId(null);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        deleteChannel(serverId, deleteTarget.id);

        // If viewing deleted channel, redirect to the community root
        if (channelId === deleteTarget.id) {
            navigate(`/dashboard/${serverId}`);
        }
        setDeleteTarget(null);
    };

    const handleHeaderClick = () => {
        setShowHeaderMenu(!showHeaderMenu);
    };

    const handleLeaveServer = async () => {
        try {
            await leaveCommunity(serverId);
            toast.success("Successfully left the server");
            navigate('/dashboard/@me');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to leave server");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-[#2b2d31]">
            {/* Header */}
            <div className="relative">
                <div
                    onClick={handleHeaderClick}
                    className={cn(
                        "h-14 shadow-lg flex items-center px-4 border-b border-[#1e1f22] transition-colors justify-between group flex-shrink-0 cursor-pointer hover:bg-[#35373c]"
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <div className="w-6 h-6 rounded-md bg-[#1e1f22] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {community.icon ? (
                                <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-white uppercase">{community.name?.substring(0, 2)}</span>
                            )}
                        </div>
                        <h2 className="font-semibold text-[#f2f3f5] truncate text-[15px] leading-none">{community.name}</h2>
                    </div>

                    <ChevronDown size={16} className={`text-[#949ba4] transition-transform flex-shrink-0 ${showHeaderMenu ? 'rotate-180' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>

                {/* Header Dropdown Menu */}
                {showHeaderMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                        <div className="absolute top-[calc(100%+4px)] left-2 right-2 bg-[#111214] border border-[#1e1f22] rounded-lg shadow-xl p-2 z-50 flex flex-col gap-1">
                            {ownerMode && (
                                <button
                                    onClick={() => {
                                        setServerSettingsOpen(true);
                                        setShowHeaderMenu(false);
                                    }}
                                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white rounded transition-colors"
                                >
                                    <span>Server Settings</span>
                                    <Settings size={14} />
                                </button>
                            )}

                            {!ownerMode && (
                                <>
                                    <div className="h-px bg-[#1e1f22] my-1" />
                                    <button
                                        onClick={handleLeaveServer}
                                        className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-[#da373c] hover:bg-[#da373c] hover:text-white rounded transition-colors group/leave"
                                    >
                                        <span>Leave Server</span>
                                        <LogOut size={16} className="text-[#da373c] group-hover/leave:text-white transition-colors" />
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group">
                        <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider group-hover:text-[#dbdee1] transition-colors">Text Channels</span>
                        {ownerMode && (
                            <Plus
                                size={14}
                                className="text-[#949ba4] opacity-0 group-hover:opacity-100 cursor-pointer hover:text-[#dbdee1] transition-opacity"
                                onClick={() => setCreateTextOpen(true)}
                            />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {community.channels.filter(c => c.type === 'text').map(channel => (
                            <div
                                key={channel.id}
                                onContextMenu={(e) => handleContextMenu(e, channel)}
                            >
                                {renamingChannelId === channel.id ? (
                                    <div className="px-2 py-1">
                                        <InlineRenameInput
                                            currentName={channel.name}
                                            onSave={(newName) => handleRenameSave(channel.id, newName)}
                                            onCancel={() => setRenamingChannelId(null)}
                                        />
                                    </div>
                                ) : (
                                    <Link
                                        to={`/dashboard/${serverId}/${channel.id}`}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-all group/ch relative",
                                            channelId === channel.id && "bg-white/[0.06] text-[#f2f3f5]"
                                        )}
                                    >
                                        {channelId === channel.id && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f2f3f5] rounded-r-full" />
                                        )}
                                        <Hash size={18} className={cn("text-[#80848e] group-hover/ch:text-[#949ba4] flex-shrink-0", channelId === channel.id && "text-[#dbdee1]")} />
                                        <span className={cn("text-[15px] truncate flex-1", channelId === channel.id && "font-medium")}>{channel.name}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group">
                        <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider group-hover:text-[#dbdee1] transition-colors">Voice Channels</span>
                        {ownerMode && (
                            <Plus
                                size={14}
                                className="text-[#949ba4] opacity-0 group-hover:opacity-100 cursor-pointer hover:text-[#dbdee1] transition-opacity"
                                onClick={() => setCreateVoiceOpen(true)}
                            />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {community.channels.filter(c => c.type === 'voice').map(channel => {
                            const isActive = activeVoiceChannelId === channel.id;
                            return (
                                <div
                                    key={channel.id}
                                    onContextMenu={(e) => handleContextMenu(e, channel)}
                                >
                                    {renamingChannelId === channel.id ? (
                                        <div className="px-2 py-1">
                                            <InlineRenameInput
                                                currentName={channel.name}
                                                onSave={(newName) => handleRenameSave(channel.id, newName)}
                                                onCancel={() => setRenamingChannelId(null)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                onClick={() => onJoinVoice(channel.id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-all cursor-pointer group/ch relative",
                                                    isActive && "bg-white/[0.06] text-[#f2f3f5]"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-400 rounded-r-full" />
                                                )}
                                                <Volume2 size={18} className={cn(
                                                    "text-[#80848e] group-hover/ch:text-[#949ba4]",
                                                    isActive && "text-green-400"
                                                )} />
                                                <span className="truncate text-[15px] flex-1">{channel.name}</span>
                                            </div>

                                            {/* Active Users List */}
                                            {isActive && isVoiceConnected && (
                                                <div className="pl-6 mt-1 space-y-1">
                                                    {voicePeers.map(peer => (
                                                        <div key={peer.socketId} className="flex items-center gap-2 group/user">
                                                            <div className={cn(
                                                                "rounded-full border-2 border-transparent transition-all",
                                                                speakingUsers[peer.id] ? "border-green-500" : "group-hover/user:border-[#3f4147]"
                                                            )}>
                                                                <Avatar
                                                                    src={peer.avatar}
                                                                    username={peer.username}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                            <span className="text-sm text-[#949ba4] group-hover/user:text-white truncate">{peer.username}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Voice Connection Status */}
            {isVoiceConnected && (
                <div className="bg-[#232428] border-t border-[#1e1f22] p-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Voice Connected
                        </span>
                        <button onClick={onLeaveVoice} className="text-[#949ba4] hover:text-red-400 transition-colors">
                            <PhoneOff size={14} />
                        </button>
                    </div>
                </div>
            )}


            {/* Modals */}
            <CreateChannelModal
                isOpen={createTextOpen}
                onClose={() => setCreateTextOpen(false)}
                channelType="text"
            />
            <CreateChannelModal
                isOpen={createVoiceOpen}
                onClose={() => setCreateVoiceOpen(false)}
                channelType="voice"
            />
            <ServerSettingsModal
                isOpen={serverSettingsOpen}
                onClose={() => setServerSettingsOpen(false)}
                community={community}
            />
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Channel"
                message={`Are you sure you want to delete #${deleteTarget?.name}? This action cannot be undone.`}
                confirmText="Delete Channel"
                danger
            />

            {/* Context Menu */}
            {contextMenu && (
                <ChannelContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onRename={() => startRename(contextMenu.channel)}
                    onDelete={() => setDeleteTarget(contextMenu.channel)}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export default ChannelSidebar;
