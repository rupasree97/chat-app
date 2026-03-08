import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import api from "../utils/axios";
import toast from "react-hot-toast";

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    const { currentUser } = useAuth();
    const socket = useSocket();
    const [communities, setCommunities] = useState([]);
    const [allCommunities, setAllCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    // Messages remain local for now as per plan/constraints, but could be fetched too
    const [allMessages, setAllMessages] = useLocalStorage("chat_messages", {});

    // Friend System State
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState({ incoming: [], outgoing: [] });

    // Helper to map backend server to frontend community structure
    const mapServerToCommunity = (server) => {
        let currentUserRole = "MEMBER";

        if (currentUser && server.members) {
            const memberObj = server.members.find(m => {
                const uid = m.user?._id || m.user || m;
                return uid.toString() === currentUser.id.toString();
            });
            if (memberObj && memberObj.role) {
                currentUserRole = memberObj.role;
            }
        }

        return {
            ...server,
            id: server._id, // map _id to id
            creatorId: server.createdBy?._id || server.createdBy, // Handle populated or ID
            currentUserRole,
            channels: server.channels.map(ch => ({
                ...ch,
                id: ch._id // map _id to id for channels
            })),
            members: (server.members || []).map(m => {
                const uid = m.user?._id || m.user || m;
                return uid.toString();
            })
        };
    };

    const fetchCommunities = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/servers?userId=${currentUser.id}`);
            const mapped = res.data.map(mapServerToCommunity);
            setCommunities(mapped);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch ALL communities for discovery (WelcomePanel)
    const fetchAllCommunities = async () => {
        try {
            const res = await api.get('/servers/public');
            setAllCommunities(res.data.map(mapServerToCommunity));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFriends = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get('/friends');
            setFriends(res.data);
        } catch (error) {
            console.error("Failed to fetch friends:", error);
        }
    };

    const fetchPendingRequests = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get('/friends/pending');
            setPendingRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
        }
    };

    // Initial fetch when user logs in
    useEffect(() => {
        if (currentUser) {
            fetchCommunities();
            fetchAllCommunities();
            fetchFriends();
            fetchPendingRequests();
        } else {
            setCommunities([]);
            setAllCommunities([]);
            setFriends([]);
            setPendingRequests({ incoming: [], outgoing: [] });
        }
    }, [currentUser]);

    // Handle Socket real-time member removal
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleMemberRemoved = ({ serverId, memberId }) => {
            if (currentUser.id === memberId) {
                // I was removed! Remove this server from my local state
                setCommunities(prev => prev.filter(c => c.id !== serverId));
                // If I am currently viewing this server, Dashboard.jsx's existing useEffect 
                // will automatically redirect me because community will become undefined!
                toast.error("You were removed from the server.");
            } else {
                // Someone else was removed, just filter them out of the server's members list
                setCommunities(prev => prev.map(c => {
                    if (c.id !== serverId) return c;
                    return {
                        ...c,
                        members: c.members.filter(m => {
                            const uid = m.user?._id || m.user || m;
                            return uid.toString() !== memberId;
                        })
                    };
                }));
            }
        };

        socket.on("member-removed", handleMemberRemoved);

        return () => {
            socket.off("member-removed", handleMemberRemoved);
        };
    }, [socket, currentUser]);

    // ─── Ownership helper ───────────────────────────────────────
    const isOwner = (serverId) => {
        if (!currentUser) return false;
        const community = communities.find(c => c.id === serverId);
        return community?.currentUserRole === "MODERATOR";
    };

    const createCommunity = async (name, description) => {
        if (!currentUser) return;

        try {
            const res = await api.post('/servers', {
                name,
                description,
                userId: currentUser.id,
                icon: ""
            });

            const mapped = mapServerToCommunity(res.data);
            setCommunities(prev => [...prev, mapped]);
            return mapped;
        } catch (error) {
            console.error(error);
        }
    };

    const joinCommunity = async (communityId) => {
        if (!currentUser) return;
        try {
            await api.post(`/servers/${communityId}/join`, { userId: currentUser.id });
            fetchCommunities();
            fetchAllCommunities();
            if (socket) {
                socket.emit("join-server-room", communityId);
                socket.emit("user-joined-server", { serverId: communityId, user: currentUser });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const leaveCommunity = async (communityId) => {
        if (!currentUser) return;
        try {
            await api.post(`/servers/${communityId}/leave`);
            fetchCommunities();
            fetchAllCommunities();
            if (socket) {
                socket.emit('user-left-server', { serverId: communityId, userId: currentUser.id, username: currentUser.username });
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    // ─── Owner-gated: Create Channel ─────────────────────────────
    const createChannel = async (serverId, name, type = 'text') => {
        if (!currentUser || !isOwner(serverId)) return null;

        try {
            const res = await api.post(`/servers/${serverId}/channels`, { name, type });
            const newChannelData = res.data;

            // Format to match frontend state shape
            const newChannel = {
                ...newChannelData,
                id: newChannelData._id
            };

            // Immediately merge into local React state to trigger UI re-render
            setCommunities(prev => prev.map(community => {
                if (community.id !== serverId) return community;
                return {
                    ...community,
                    channels: [...community.channels, newChannel]
                };
            }));

            return newChannel;
        } catch (error) {
            console.error("Create Channel Error:", error);
            if (error.response?.status === 403) {
                toast.error("You do not have permission to perform this action.");
            }
            return null;
        }
    };

    // ─── Owner-gated: Rename Channel ─────────────────────────────
    const renameChannel = async (serverId, channelId, newName) => {
        if (!currentUser || !isOwner(serverId)) return false;
        const trimmed = newName.trim();
        if (!trimmed) return false;

        try {
            await api.put(`/servers/${serverId}/channels/${channelId}`, { name: trimmed });
            fetchCommunities();
            return true;
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403) {
                toast.error("You do not have permission to perform this action.");
            }
            return false;
        }
    };

    // ─── Owner-gated: Delete Channel ─────────────────────────────
    const deleteChannel = async (serverId, channelId) => {
        if (!currentUser || !isOwner(serverId)) return;

        try {
            await api.delete(`/servers/${serverId}/channels/${channelId}`);
            setCommunities(prev => prev.map(c => {
                if (c.id !== serverId) return c;
                return { ...c, channels: c.channels.filter(ch => ch.id !== channelId) };
            }));

            const key = `${serverId}_${channelId}`;
            setAllMessages(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403) {
                toast.error("You do not have permission to perform this action.");
            }
        }
    };

    // ─── Owner-gated: Update Community ───────────────────────────
    const updateCommunity = async (serverId, updates) => {
        if (!currentUser || !isOwner(serverId)) return;

        try {
            await api.put(`/servers/${serverId}`, updates);
            fetchCommunities();
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403) {
                toast.error("You do not have permission to perform this action.");
            }
        }
    };

    // ─── Owner-gated: Delete Community ───────────────────────────
    const deleteCommunity = async (serverId) => {
        if (!currentUser || !isOwner(serverId)) return;

        try {
            await api.delete(`/servers/${serverId}`);
            const community = communities.find(c => c.id === serverId);
            if (community) {
                setAllMessages(prev => {
                    const next = { ...prev };
                    community.channels.forEach(ch => {
                        delete next[`${serverId}_${ch.id}`];
                    });
                    return next;
                });
            }
            setCommunities(prev => prev.filter(c => c.id !== serverId));
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403) {
                toast.error("You do not have permission to perform this action.");
            }
        }
    };

    // Fetches messages for a specific channel
    const fetchMessages = async (serverId, channelId) => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/messages/${channelId}`);
            const key = `${serverId}_${channelId}`;
            setAllMessages(prev => ({
                ...prev,
                [key]: res.data
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessage = async (serverId, channelId, content, replyTo = null, mentions = []) => {
        if (!currentUser) return;

        try {
            const res = await api.post('/messages', {
                serverId,
                channelId,
                senderId: currentUser.id,
                content,
                mentions
            });

            const key = `${serverId}_${channelId}`;
            setAllMessages(prev => ({
                ...prev,
                [key]: [...(prev[key] || []), res.data]
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const getMessages = (serverId, channelId) => {
        const key = `${serverId}_${channelId}`;
        return allMessages[key] || [];
    };

    const deleteMessage = async (serverId, channelId, messageId) => {
        if (!currentUser) return;
        try {
            await api.delete(`/messages/${messageId}`);
            const key = `${serverId}_${channelId}`;
            setAllMessages(prev => {
                const msgs = prev[key] || [];
                return { ...prev, [key]: msgs.filter(m => m.id !== messageId) };
            });
        } catch (error) {
            console.error(error);
        }
    };

    const toggleReaction = async (serverId, channelId, messageId, emoji) => {
        if (!currentUser) return;

        const key = `${serverId}_${channelId}`;
        setAllMessages(prev => {
            const msgs = prev[key] || [];
            return {
                ...prev,
                [key]: msgs.map(msg => {
                    if (msg.id !== messageId) return msg;
                    const reactions = { ...msg.reactions };
                    const users = reactions[emoji] ? [...reactions[emoji]] : [];
                    const uid = currentUser.id.toString();
                    if (users.includes(uid)) {
                        const idx = users.indexOf(uid);
                        users.splice(idx, 1);
                        if (users.length === 0) delete reactions[emoji];
                        else reactions[emoji] = users;
                    } else {
                        reactions[emoji] = [...users, uid];
                    }
                    return { ...msg, reactions };
                })
            };
        });

        try {
            await api.post(`/messages/${messageId}/react`, { emoji, userId: currentUser.id });
        } catch (error) {
            console.error("Reaction failed", error);
        }
    };

    const value = {
        communities,
        allCommunities,
        friends,
        pendingRequests,
        fetchFriends,
        fetchPendingRequests,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        createChannel,
        renameChannel,
        deleteChannel,
        updateCommunity,
        deleteCommunity,
        isOwner,
        sendMessage,
        getMessages,
        deleteMessage,
        toggleReaction,
        fetchCommunities,
        fetchAllCommunities,
        loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
