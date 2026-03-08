import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, MoreVertical, Sparkles, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';

const DMSidebar = ({ onCloseDrawer }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const { currentUser } = useAuth();
    const { fetchFriends, allCommunities, communities, joinCommunity } = useData();

    const discoverableCommunities = allCommunities?.filter(c => !c.members?.includes(currentUser?.id)) || [];

    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const [modalFriend, setModalFriend] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpenId(null);
            }
        };

        if (dropdownOpenId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownOpenId]);

    const handleRemoveFriend = async (friendId) => {
        try {
            await api.delete(`/friends/${friendId}`);
            toast.success("Friend removed.");
            if (fetchFriends) {
                fetchFriends();
            }
        } catch (err) {
            toast.error("Failed to remove friend.");
        }
    };

    const isFriendsPage = location.pathname === '/dashboard' || location.pathname === '/dashboard/@me';

    useEffect(() => {
        const fetchConvos = async () => {
            try {
                const res = await api.get('/dm/conversations');
                setConversations(res.data);
            } catch (err) {
                console.error("Failed to load DMs", err);
            }
        };
        fetchConvos();
    }, []);

    const handleSelectConversation = (id) => {
        navigate(`/dashboard/@me/${id}`);
        if (onCloseDrawer) onCloseDrawer();
    };

    return (
        <div className="flex-1 bg-[#2b2d31] flex flex-col min-w-[240px]">
            {/* Search Header */}
            <div className="h-12 border-b border-[#1e1f22] shadow-sm flex items-center px-2 flex-shrink-0">
                <button className="w-full bg-[#1e1f22] text-[#949ba4] text-xs font-medium py-1.5 px-2 rounded-md text-left transition-colors hover:bg-[#313338]">
                    Find or start a conversation
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {/* Friends Button */}
                <div className="px-2 mb-4">
                    <button
                        onClick={() => { navigate('/dashboard/@me'); if (onCloseDrawer) onCloseDrawer(); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                            isFriendsPage
                                ? "bg-[#404249] text-white"
                                : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
                        )}
                    >
                        <Users size={20} className={cn(isFriendsPage ? "text-white" : "text-[#949ba4] group-hover:text-[#dbdee1]")} />
                        <span className="font-medium text-[15px]">Friends</span>
                    </button>
                </div>

                {/* Direct Messages Header */}
                <div className="px-4 flex items-center justify-between group pt-4 pb-1">
                    <h2 className="text-xs font-bold text-[#949ba4] uppercase hover:text-[#dbdee1] transition-colors cursor-default">
                        Direct Messages
                    </h2>
                    <Plus size={16} className="text-[#949ba4] opacity-0 group-hover:opacity-100 hover:text-[#dbdee1] cursor-pointer transition-all" />
                </div>

                {/* DM List */}
                <div className="px-2 mt-1 space-y-0.5">
                    {conversations.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-[#949ba4] text-center">
                            No active conversations mapping yet.
                        </div>
                    ) : (
                        conversations.map((convo) => {
                            const otherUser = convo.participants.find(p => p._id !== currentUser.id);
                            if (!otherUser) return null;

                            const isActive = location.pathname.includes(`/dashboard/@me/${convo._id}`);
                            return (
                                <div
                                    key={convo._id}
                                    onClick={() => handleSelectConversation(convo._id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors cursor-pointer group",
                                        isActive ? "bg-[#404249]" : "hover:bg-[#35373c]"
                                    )}
                                >
                                    <Avatar
                                        src={otherUser.profilePicture}
                                        username={otherUser.username}
                                        size="md"
                                        status={otherUser.status}
                                        isNitro={otherUser.nitro?.isActive}
                                        profileEffects={otherUser.profileEffects}
                                    />
                                    <div className="flex-1 min-w-0 pr-1">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className={cn(
                                                "font-medium text-[15px] truncate",
                                                isActive ? "text-white" : "text-[#949ba4] group-hover:text-[#dbdee1]"
                                            )}>
                                                {otherUser.username}
                                            </h3>
                                            {otherUser.nitro?.isActive && (
                                                <Sparkles size={14} className="text-[#FF73FA] shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className="relative flex items-center"
                                        ref={dropdownOpenId === convo._id ? dropdownRef : null}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDropdownOpenId(dropdownOpenId === convo._id ? null : convo._id);
                                            }}
                                            className={cn(
                                                "text-[#949ba4] hover:text-[#dbdee1] transition-all",
                                                dropdownOpenId === convo._id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {dropdownOpenId === convo._id && (
                                            <div className="absolute right-0 top-6 w-48 bg-[#111214] border border-[#1e1f22] rounded shadow-lg z-50 py-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setModalFriend(otherUser);
                                                        setDropdownOpenId(null);
                                                    }}
                                                    className="w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm text-[#da373c] hover:bg-[#da373c] hover:text-white rounded transition-colors"
                                                >
                                                    Remove Friend
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- COMMUNITY DISCOVERY SECTIONS --- */}

                {/* Joined Communities */}
                <div className="px-4 flex items-center justify-between group pt-6 pb-1 mt-2 border-t border-[#1e1f22]">
                    <h2 className="text-xs font-bold text-[#949ba4] uppercase hover:text-[#dbdee1] transition-colors cursor-default">
                        Joined Communities
                    </h2>
                </div>
                <div className="px-2 mt-2 space-y-2 mb-4">
                    {communities?.length === 0 ? (
                        <div className="text-xs text-[#949ba4] text-center py-2">You haven't joined any communities.</div>
                    ) : (
                        communities?.map(community => (
                            <div key={community.id} onClick={() => { navigate(`/dashboard/${community.id}`); if (onCloseDrawer) onCloseDrawer(); }} className="w-full bg-[#2b2d31] hover:bg-[#35373c] p-2.5 rounded-lg flex flex-col gap-2 shadow-sm border border-[#1e1f22] cursor-pointer transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[12px] bg-[#1e1f22] flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#313338]">
                                        {community.icon ? <img src={community.icon} alt={community.name} className="w-full h-full object-cover" /> : <span className="text-[#949ba4] group-hover:text-white font-bold text-sm tracking-wider transition-colors">{community.name.substring(0, 2).toUpperCase()}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[#dbdee1] group-hover:text-white font-medium text-[14px] truncate">{community.name}</h3>
                                        <div className="text-[#949ba4] text-xs mt-0.5">{community.members.length} member{community.members.length !== 1 && 's'}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Discover Communities */}
                <div className="px-4 flex items-center justify-between group pt-4 pb-1">
                    <h2 className="text-xs font-bold text-[#949ba4] uppercase hover:text-[#dbdee1] transition-colors cursor-default">
                        Discover Communities
                    </h2>
                    <Compass size={14} className="text-[#949ba4]" />
                </div>
                <div className="px-2 mt-2 space-y-2 pb-6">
                    {discoverableCommunities.length === 0 ? (
                        <div className="text-xs text-[#949ba4] text-center py-2 -mt-1">No up-and-coming communities found.</div>
                    ) : (
                        discoverableCommunities.map(community => (
                            <div key={community.id} className="w-full bg-[#2b2d31] hover:bg-[#323439] transition-colors p-2.5 rounded-lg flex flex-col gap-2 shadow-sm border border-[#1e1f22]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[12px] bg-[#1e1f22] flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#313338]">
                                        {community.icon ? <img src={community.icon} alt={community.name} className="w-full h-full object-cover" /> : <span className="text-[#dbdee1] font-bold text-sm tracking-wider">{community.name.substring(0, 2).toUpperCase()}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium text-[14px] truncate">{community.name}</h3>
                                        <div className="text-[#949ba4] text-xs mt-0.5">{community.members.length} member{community.members.length !== 1 && 's'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await joinCommunity(community.id);
                                            toast.success(`Joined ${community.name}!`);
                                            navigate(`/dashboard/${community.id}`);
                                            if (onCloseDrawer) onCloseDrawer();
                                        } catch (err) {
                                            toast.error("Failed to join community");
                                        }
                                    }}
                                    className="w-full font-medium text-white bg-[#248046] hover:bg-[#1a6334] transition-colors py-1.5 rounded text-sm mt-1 flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={16} /> Join Server
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Remove Friend Confirmation Modal */}
            {modalFriend && (
                <Modal isOpen={!!modalFriend} onClose={() => setModalFriend(null)}>
                    <div className="p-4 flex flex-col pt-6 bg-[#313338]">
                        <h2 className="text-[#f2f3f5] font-bold text-xl mb-4">Remove '{modalFriend?.username}'</h2>
                        <div className="text-[#dbdee1] text-[15px] mb-8 whitespace-pre-wrap">
                            Are you sure you want to permanently remove <strong>{modalFriend?.username}</strong> from your friends?
                        </div>
                        <div className="flex justify-end gap-3 mt-2 bg-[#2b2d31] -mx-4 -mb-4 p-4 rounded-b-xl border-t border-[#1e1f22]">
                            <button
                                onClick={() => setModalFriend(null)}
                                className="px-4 py-2 hover:underline text-[#dbdee1]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleRemoveFriend(modalFriend._id);
                                    setModalFriend(null);
                                }}
                                className="px-4 py-2 bg-[#da373c] hover:bg-[#a12828] text-white rounded font-medium transition-colors"
                            >
                                Remove Friend
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DMSidebar;
