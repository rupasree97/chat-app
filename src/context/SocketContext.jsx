import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const NotificationContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { currentUser, handleUserUpdated } = useAuth();

    // Notifications State
    const [globalNotifications, setGlobalNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Friend & DM State
    const [dmNotifications, setDmNotifications] = useState([]);
    const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);

    // Call State
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on("server-notification", (notification) => {
            // Filter out events triggered by the current user
            const actorId = notification.data?.senderId || notification.data?.userId || notification.data?._id || notification.data?.id;
            const currentUserId = currentUser?._id || currentUser?.id;

            if (actorId === currentUserId) return;

            setGlobalNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Join globally known servers for notifications
        if (currentUser && currentUser.joinedServers) {
            currentUser.joinedServers.forEach(serverId => {
                const sId = typeof serverId === 'object' ? serverId._id : serverId;
                newSocket.emit("join-server-room", sId);
            });
        }

        // Join personal user room for DMs and Friend Requests
        if (currentUser) {
            const userId = currentUser._id || currentUser.id;
            newSocket.emit("join-user-room", userId);
        }

        // Friend & DM Listeners
        newSocket.on("friend-request-received", (request) => {
            setIncomingFriendRequests(prev => [request, ...prev]);
            // Optional: Also push to global notifications or a specific toast
        });

        newSocket.on("friend-request-accepted", (friend) => {
            // Can be handled here or refetched in DataContext
        });

        newSocket.on("direct-message-received", ({ message, conversationId }) => {
            setDmNotifications(prev => [{ message, conversationId }, ...prev]);
        });

        newSocket.on("user-updated", (userData) => {
            if (handleUserUpdated) {
                handleUserUpdated(userData);
            }
        });

        // Webhook Stripe Nitro Updates
        newSocket.on("nitro-activated", ({ nitro }) => {
            if (currentUser && handleUserUpdated) {
                // Instantly unlock UI
                handleUserUpdated({ ...currentUser, nitro });
                import('react-hot-toast').then(({ default: toast }) => toast.success("Nitro Activated! Thank you for subscribing. ✨", { duration: 5000 }));
            }
        });

        newSocket.on("nitro-expired", () => {
            if (currentUser && handleUserUpdated) {
                handleUserUpdated({ ...currentUser, nitro: { isActive: false } });
                import('react-hot-toast').then(({ default: toast }) => toast.error("Your Nitro subscription has expired."));
            }
        });

        // Real-Time Call Signaling
        newSocket.on("incoming-call", (data) => {
            // data contains: { callType, conversationId, caller, callerSocketId }
            setIncomingCall(data);
        });

        newSocket.on("call-was-declined", () => {
            import('react-hot-toast').then(({ default: toast }) => toast.error("Call was declined"));
            // (Optional) We could expose a state to immediately drop the call screen, 
            // but the caller will see the toast and can click End Call.
        });

        return () => {
            newSocket.off("server-notification");
            newSocket.off("friend-request-received");
            newSocket.off("friend-request-accepted");
            newSocket.off("direct-message-received");
            newSocket.off("user-updated");
            newSocket.off("nitro-activated");
            newSocket.off("nitro-expired");
            newSocket.off("incoming-call");
            newSocket.off("call-was-declined");
            newSocket.close();
        };
    }, [currentUser]);

    const markNotificationsAsRead = () => setUnreadCount(0);
    const clearNotifications = () => {
        setGlobalNotifications([]);
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={socket}>
            <NotificationContext.Provider value={{
                globalNotifications,
                unreadCount,
                markNotificationsAsRead,
                clearNotifications,
                dmNotifications,
                setDmNotifications,
                incomingFriendRequests,
                setIncomingFriendRequests,
                incomingCall,
                setIncomingCall
            }}>
                {children}
            </NotificationContext.Provider>
        </SocketContext.Provider>
    );
};
