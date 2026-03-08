import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Compass, LogOut, Settings } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import ServerSettingsModal from '../modals/ServerSettingsModal';

const ServerContextMenu = ({ x, y, onLeave, onSettings, isOwner, onClose }) => {
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

    const style = { top: y, left: x };

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] bg-[#111214] rounded-lg shadow-xl border border-[#2d2f33] py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            {isOwner ? (
                <button
                    onClick={(e) => { e.stopPropagation(); onSettings(); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-[#dbdee1] hover:bg-[#5865F2] hover:text-white transition-colors rounded-sm mx-0"
                >
                    <span>Server Settings</span>
                    <Settings size={14} />
                </button>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); onLeave(); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-[#da373c] hover:bg-[#da373c] hover:text-white transition-colors rounded-sm mx-0"
                >
                    <span>Leave Server</span>
                    <LogOut size={14} />
                </button>
            )}
        </div>
    );
};

const ServerSidebar = ({ onOpenCreateModal }) => {
    const { communities, leaveCommunity, isOwner } = useData();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { serverId } = useParams();

    const [contextMenu, setContextMenu] = useState(null);
    const [settingsCommunity, setSettingsCommunity] = useState(null);

    const handleContextMenu = (e, community) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, community });
    };

    const handleLeaveServer = async (communityId) => {
        try {
            await leaveCommunity(communityId);
            toast.success("Successfully left the server");
            if (serverId === communityId) {
                navigate('/dashboard/@me');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to leave server");
        }
    };

    // Backend already filters servers by userId — no client-side filtering needed

    return (
        <div className="w-[60px] md:w-[72px] h-screen bg-[#1e1f22] flex flex-col items-center py-3 gap-2 z-20 overflow-x-hidden">
            {/* Home / DM Button */}
            <Link to="/dashboard/@me">
                <div className={cn(
                    "w-12 h-12 rounded-[24px] bg-glass hover:bg-accent-primary hover:rounded-[16px] transition-all duration-300 flex items-center justify-center text-accent-secondary hover:text-white cursor-pointer group mb-2 shadow-lg",
                    (!serverId || serverId === '@me') && "bg-accent-primary text-white rounded-[16px]"
                )}>
                    <Compass size={24} />
                </div>
            </Link>

            <div className="w-8 h-[2px] bg-glass-border rounded-full" />

            {/* Communities List */}
            <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto overflow-x-hidden no-scrollbar w-full pt-2">
                {communities.map((community) => (
                    <Link
                        key={community.id}
                        to={`/dashboard/${community.id}`}
                        onContextMenu={(e) => handleContextMenu(e, community)}
                    >
                        <div className="relative group flex items-center justify-center">
                            {/* Active Indicator */}
                            {serverId === community.id && (
                                <div className="absolute -left-4 w-2 h-10 bg-white rounded-r-lg transition-all" />
                            )}
                            <div className="absolute -left-4 w-2 h-2 bg-white rounded-r-lg opacity-0 group-hover:opacity-100 group-hover:h-5 transition-all duration-300" />

                            <div className={cn(
                                "w-12 h-12 rounded-[24px] bg-glass hover:bg-brand-soft hover:rounded-[16px] transition-all duration-300 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer overflow-hidden",
                                serverId === community.id && "bg-brand-soft text-white rounded-[16px] border border-accent-primary/50"
                            )}>
                                {community.icon ? (
                                    <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-sm">{community.name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute left-14 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {community.name}
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Create Community Button */}
                <button
                    onClick={onOpenCreateModal}
                    className="w-12 h-12 rounded-[24px] bg-glass border border-dashed border-accent-secondary/30 hover:border-accent-secondary hover:bg-accent-secondary/10 hover:text-accent-secondary transition-all duration-300 flex items-center justify-center text-success group"
                >
                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ServerContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isOwner={isOwner(contextMenu.community.id)}
                    onLeave={() => handleLeaveServer(contextMenu.community.id)}
                    onSettings={() => setSettingsCommunity(contextMenu.community)}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Settings Modal */}
            {settingsCommunity && (
                <ServerSettingsModal
                    isOpen={!!settingsCommunity}
                    onClose={() => setSettingsCommunity(null)}
                    community={settingsCommunity}
                />
            )}
        </div>
    );
};

export default ServerSidebar;

