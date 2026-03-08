import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, UserCheck, Inbox, HelpCircle, UserX, MessageSquare, MoreVertical, Check, X, Users, Phone, Video, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import ProfilePopCard from '../ui/ProfilePopCard';

const FriendsPage = ({ onJoinVoice }) => {
    const { friends, pendingRequests, fetchFriends, fetchPendingRequests } = useData();
    const { currentUser } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('ONLINE'); // ONLINE, ALL, PENDING, ADD_FRIEND
    const [addFriendInput, setAddFriendInput] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const [modalFriend, setModalFriend] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
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

    // Derived state
    const onlineFriends = friends.filter(f => f.status === 'online' || f.status === 'dnd' || f.status === 'idle');
    const allFriends = friends;
    const allPending = [...(pendingRequests?.incoming || []), ...(pendingRequests?.outgoing || [])];

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!addFriendInput.trim()) return;

        setIsAdding(true);
        try {
            await api.post('/friends/request', { username: addFriendInput });
            toast.success(`Friend request sent to ${addFriendInput}!`);
            setAddFriendInput('');
            fetchPendingRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send request.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const res = await api.post('/friends/accept', { requestId });
            toast.success("Friend request accepted!");
            fetchFriends();
            fetchPendingRequests();
            if (res.data.conversationId) {
                navigate(`/dashboard/@me/${res.data.conversationId}`);
            }
        } catch (err) {
            toast.error("Failed to accept request.");
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await api.post('/friends/reject', { requestId });
            toast.success("Request removed.");
            fetchPendingRequests();
        } catch (err) {
            toast.error("Failed to remove request.");
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            await api.delete(`/friends/${friendId}`);
            toast.success("Friend removed.");
            fetchFriends();
        } catch (err) {
            toast.error("Failed to remove friend.");
        }
    };

    const handleMessageFriend = async (friendId) => {
        try {
            const res = await api.post('/dm', { targetUserId: friendId });
            navigate(`/dashboard/@me/${res.data._id}`);
        } catch (err) {
            toast.error("Failed to start conversation.");
        }
    };

    const handleCallFriend = async (friendId, callType) => {
        try {
            const res = await api.post('/dm', { targetUserId: friendId });
            const conversationId = res.data._id;

            // Emit call-invite to target user
            if (socket) {
                socket.emit('call-invite', {
                    targetUserId: friendId,
                    callType,
                    conversationId,
                    caller: currentUser
                });
            }

            navigate(`/dashboard/@me/${conversationId}`);
            // Small delay to let the route render then trigger the call
            setTimeout(() => {
                if (onJoinVoice) onJoinVoice(conversationId, callType);
            }, 300);
        } catch (err) {
            toast.error("Failed to start call.");
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ONLINE':
            case 'ALL':
                const friendsList = activeTab === 'ONLINE' ? onlineFriends : allFriends;

                return (
                    <div className="flex-1 flex flex-col p-4 w-full h-full overflow-y-auto mt-2">
                        <div className="w-full text-xs font-semibold text-[#b5bac1] uppercase tracking-wide mb-4 px-2">
                            {activeTab} — {friendsList.length}
                        </div>

                        {friendsList.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#949ba4] mt-20">
                                <div className="w-[300px] h-[300px] mb-8 bg-black/20 rounded-full flex items-center justify-center">
                                    {/* Illustration placeholder */}
                                    <UserPlus size={80} className="text-[#3f4147]" />
                                </div>
                                <span className="text-center font-medium">
                                    No one's around to play with Wumpus.
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-[1px]">
                                {friendsList.map(friend => (
                                    <div key={friend._id} className="group flex items-center justify-between p-2 hover:bg-[#35373c] rounded-md border-t border-[#3f4147] cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={friend.profilePicture}
                                                username={friend.username}
                                                size="md"
                                                status={friend.status}
                                                isNitro={friend.nitro?.isActive}
                                                profileEffects={friend.profileEffects}
                                                onClick={(e) => { e.stopPropagation(); setSelectedUser(friend); }}
                                            />
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[#f2f3f5] font-semibold text-[15px]">{friend.username}</span>
                                                    {friend.nitro?.isActive && (
                                                        <Sparkles size={14} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                                                    )}
                                                    <span className="text-[#b5bac1] hidden group-hover:block text-sm">{friend.customTag}</span>
                                                </div>
                                                <span className="text-[#b5bac1] text-xs">{friend.status === 'offline' ? 'Offline' : 'Online'}</span>
                                            </div>
                                        </div>
                                        <div
                                            className="flex items-center gap-2 relative"
                                            ref={dropdownOpenId === friend._id ? dropdownRef : null}
                                        >
                                            <div className={cn("flex items-center gap-2 transition-opacity", dropdownOpenId === friend._id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                                <button
                                                    onClick={() => handleMessageFriend(friend._id)}
                                                    title="Message"
                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                                                >
                                                    <MessageSquare size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleCallFriend(friend._id, 'audio')}
                                                    title="Voice Call"
                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#2dc770] transition-colors"
                                                >
                                                    <Phone size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleCallFriend(friend._id, 'video')}
                                                    title="Video Call"
                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#5865F2] transition-colors"
                                                >
                                                    <Video size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDropdownOpenId(dropdownOpenId === friend._id ? null : friend._id);
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#dbdee1]"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>

                                            {dropdownOpenId === friend._id && (
                                                <div className="absolute right-0 top-10 w-48 bg-[#111214] border border-[#1e1f22] rounded shadow-lg z-50 py-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModalFriend(friend);
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
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'PENDING':
                const incomingReqs = pendingRequests?.incoming || [];
                const outgoingReqs = pendingRequests?.outgoing || [];
                const hasNoRequests = incomingReqs.length === 0 && outgoingReqs.length === 0;

                return (
                    <div className="flex-1 flex flex-col p-6 w-full h-full overflow-y-auto">
                        {hasNoRequests ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#949ba4] mt-20">
                                <div className="w-[300px] h-[300px] mb-8 flex items-center justify-center">
                                    <Inbox size={80} className="text-[#3f4147]" />
                                </div>
                                <span className="text-center font-medium">
                                    There are no pending friend requests. Here's a potato.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {/* INCOMING REQUESTS */}
                                {incomingReqs.length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-[#b5bac1] uppercase tracking-wide mb-2">
                                            Incoming — {incomingReqs.length}
                                        </div>
                                        <div className="space-y-[1px]">
                                            {incomingReqs.map(req => (
                                                <div key={req._id} className="group flex items-center justify-between p-3 hover:bg-[#3f4147]/50 rounded-md border-t border-[#3f4147]/40 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            src={req.sender.profilePicture}
                                                            username={req.sender.username}
                                                            size="md"
                                                            isNitro={req.sender.nitro?.isActive}
                                                            profileEffects={req.sender.profileEffects}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedUser(req.sender); }}
                                                        />
                                                        <div className="flex flex-col">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-[#f2f3f5] font-semibold text-[15px]">{req.sender.username}</span>
                                                                {req.sender.nitro?.isActive && (
                                                                    <Sparkles size={14} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                                                                )}
                                                                <span className="text-[#b5bac1] hidden group-hover:block text-sm">{req.sender.customTag}</span>
                                                            </div>
                                                            <span className="text-[#b5bac1] text-xs font-medium">Incoming Friend Request</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(req._id); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#2dc770] transition-colors">
                                                            <Check size={20} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleRejectRequest(req._id); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#da373c] transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OUTGOING REQUESTS */}
                                {outgoingReqs.length > 0 && (
                                    <div className={incomingReqs.length > 0 ? "mt-4" : ""}>
                                        <div className="text-xs font-semibold text-[#b5bac1] uppercase tracking-wide mb-2">
                                            Outgoing — {outgoingReqs.length}
                                        </div>
                                        <div className="space-y-[1px]">
                                            {outgoingReqs.map(req => (
                                                <div key={req._id} className="group flex items-center justify-between p-3 hover:bg-[#3f4147]/50 rounded-md border-t border-[#3f4147]/40">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            src={req.receiver.profilePicture}
                                                            username={req.receiver.username}
                                                            size="md"
                                                            isNitro={req.receiver.nitro?.isActive}
                                                            profileEffects={req.receiver.profileEffects}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedUser(req.receiver); }}
                                                        />
                                                        <div className="flex flex-col">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-[#f2f3f5] font-semibold text-[15px]">{req.receiver.username}</span>
                                                                {req.receiver.nitro?.isActive && (
                                                                    <Sparkles size={14} className="text-[#FF73FA] shrink-0" title="Nitro Subscriber" />
                                                                )}
                                                                <span className="text-[#b5bac1] hidden group-hover:block text-sm">{req.receiver.customTag}</span>
                                                            </div>
                                                            <span className="text-[#b5bac1] text-xs font-medium">Outgoing Friend Request</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleRejectRequest(req._id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-[#da373c] transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'ADD_FRIEND':
                return (
                    <div className="flex-1 flex flex-col p-6 w-full h-full border-t border-[#3f4147]/0">
                        <h2 className="text-[#f2f3f5] font-semibold text-base mb-2 uppercase">Add Friend</h2>
                        <span className="text-[#b5bac1] text-sm mb-4">You can add friends with their Discord username.</span>

                        <form onSubmit={handleSendRequest} className="w-full bg-[#1e1f22] rounded-lg p-3 flex items-center border border-[#1e1f22] focus-within:border-[#5865F2] transition-colors relative">
                            <input
                                type="text"
                                value={addFriendInput}
                                onChange={(e) => setAddFriendInput(e.target.value)}
                                placeholder="You can add friends with their Discord username."
                                className="flex-1 bg-transparent border-none outline-none text-[#dbdee1] placeholder:text-[#87898f] font-medium"
                            />
                            <button
                                type="submit"
                                disabled={isAdding || !addFriendInput.trim()}
                                className="bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-medium py-1.5 px-4 rounded transition-colors ml-4 absolute right-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send Friend Request
                            </button>
                        </form>

                        <div className="mt-8 border-t border-[#3f4147] pt-8 flex flex-col items-center justify-center text-[#949ba4]">
                            <div className="w-[300px] h-[300px] mb-8 bg-black/20 rounded-full flex items-center justify-center">
                                <UserPlus size={80} className="text-[#3f4147]" />
                            </div>
                            <span className="text-center font-medium">
                                Wumpus is waiting on friends. You don't have to though!
                            </span>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-[#1e1f22] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center">
                    <div className="flex items-center gap-2 text-[#f2f3f5] font-semibold mr-4 pr-4 border-r border-[#3f4147]">
                        <Users size={24} className="text-[#80848e]" />
                        <span>Friends</span>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-4 h-full">
                        {['Online', 'All', 'Pending'].map((tab) => {
                            const isActive = activeTab === tab.toUpperCase();
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab.toUpperCase())}
                                    className={cn(
                                        "relative h-14 px-2 text-[15px] font-medium transition-colors outline-none",
                                        isActive
                                            ? "text-[#f2f3f5]"
                                            : "text-[#b5bac1] hover:text-[#dbdee1]"
                                    )}
                                >
                                    {tab}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f2f3f5] rounded-t-sm" />
                                    )}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setActiveTab('ADD_FRIEND')}
                            className={cn(
                                "ml-2 px-2 py-0.5 rounded text-[15px] font-medium transition-colors cursor-pointer text-white",
                                activeTab === 'ADD_FRIEND'
                                    ? "bg-transparent text-[#2dc770]"
                                    : "bg-[#248046] hover:bg-[#1a6334]"
                            )}
                        >
                            Add Friend
                        </button>
                    </div>
                </div>

                {/* Right Utilities */}
                <div className="flex items-center gap-4 text-[#b5bac1]">
                    <Inbox size={24} className="hover:text-[#dbdee1] cursor-pointer" />
                    <HelpCircle size={24} className="hover:text-[#dbdee1] cursor-pointer" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-row overflow-hidden pb-4">
                {/* Scrollable Center View */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderTabContent()}
                </div>

                {/* Active Now Sidebar (Static placeholder for layout) */}
                <div className="w-80 border-l border-[#3f4147] hidden md:flex flex-col p-4 bg-[#313338]">
                    <h3 className="font-bold text-[19px] text-[#f2f3f5] mb-4">Active Now</h3>
                    <div className="flex flex-col items-center justify-center text-[#949ba4] mt-10 p-4 text-center">
                        <span className="font-semibold text-[#f2f3f5] mb-1">It's quiet for now...</span>
                        <span className="text-sm">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</span>
                    </div>
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

            {/* Profile Popout */}
            {selectedUser && (
                <ProfilePopCard
                    user={{
                        ...selectedUser,
                        id: selectedUser._id || selectedUser.id,
                        avatar: selectedUser.profilePicture || selectedUser.avatar
                    }}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};

export default FriendsPage;
