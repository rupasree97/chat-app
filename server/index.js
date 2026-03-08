import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import serverRoutes from "./routes/servers.js";
import channelRoutes from "./routes/channels.js";
import messageRoutes from "./routes/messages.js";
import friendRoutes from "./routes/friends.js";
import dmRoutes from "./routes/dm.js";
import uploadRoutes from "./routes/upload.js";
import paymentRoutes from "./routes/payments.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.set("io", io); // Make io accessible in routes via req.app.get('io')

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payments", paymentRoutes);

// Voice Channel State
const voiceChannels = {}; // { channelId: [{ socketId, user, isMuted, isVideoOn }] }
const socketUserMap = {}; // { socketId: { userId, username, avatar } }

// Socket.IO
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-voice", ({ channelId, user }) => {
        if (!user || !channelId) return;

        // Leave previous channel if any
        if (socket.voiceChannelId && socket.voiceChannelId !== channelId) {
            leaveVoiceChannel(socket);
        }

        socket.join(channelId);
        socket.voiceChannelId = channelId;

        // Map socket to user
        socketUserMap[socket.id] = user;

        // Initialize channel if not exists
        if (!voiceChannels[channelId]) {
            voiceChannels[channelId] = [];
        }

        // Add user to channel list with media state
        const existingSessionIndex = voiceChannels[channelId].findIndex(p => p.socketId === socket.id);
        if (existingSessionIndex === -1) {
            voiceChannels[channelId].push({
                socketId: socket.id,
                user,
                isMuted: false,
                isVideoOn: false
            });
        }

        // 1. Send list of existing users (with their media state) to the new user
        const peers = voiceChannels[channelId]
            .filter(p => p.socketId !== socket.id)
            .map(p => ({
                socketId: p.socketId,
                ...p.user,
                isMuted: p.isMuted,
                isVideoOn: p.isVideoOn
            }));

        socket.emit("voice-users", peers);

        // 2. Notify others that a new user joined
        socket.to(channelId).emit("user-joined-voice", {
            user,
            socketId: socket.id,
            isMuted: false,
            isVideoOn: false
        });

        console.log(`User ${user.username} joined voice channel ${channelId}`);
    });

    socket.on("leave-voice", () => {
        leaveVoiceChannel(socket);
    });

    // Toggle mute state
    socket.on("toggle-mute", ({ channelId, isMuted }) => {
        const channel = voiceChannels[channelId];
        if (channel) {
            const entry = channel.find(p => p.socketId === socket.id);
            if (entry) entry.isMuted = isMuted;
        }
        socket.to(channelId).emit("user-toggled-mute", {
            socketId: socket.id,
            userId: socketUserMap[socket.id]?.id,
            isMuted
        });
    });

    // Toggle video state
    socket.on("toggle-video", ({ channelId, isVideoOn }) => {
        const channel = voiceChannels[channelId];
        if (channel) {
            const entry = channel.find(p => p.socketId === socket.id);
            if (entry) entry.isVideoOn = isVideoOn;
        }
        socket.to(channelId).emit("user-toggled-video", {
            socketId: socket.id,
            userId: socketUserMap[socket.id]?.id,
            isVideoOn
        });
    });

    // WebRTC Signaling
    socket.on("offer", ({ targetSocketId, offer }) => {
        io.to(targetSocketId).emit("offer", {
            senderSocketId: socket.id,
            offer,
            user: socketUserMap[socket.id]
        });
    });

    socket.on("answer", ({ targetSocketId, answer }) => {
        io.to(targetSocketId).emit("answer", {
            senderSocketId: socket.id,
            answer
        });
    });

    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
        io.to(targetSocketId).emit("ice-candidate", {
            senderSocketId: socket.id,
            candidate
        });
    });

    // Speaking Indicator
    socket.on("speaking", ({ channelId, isSpeaking }) => {
        socket.to(channelId).emit("user-speaking", { userId: socketUserMap[socket.id]?.id, isSpeaking });
    });

    // Member Management
    socket.on("remove-member", ({ serverId, memberId }) => {
        // Broadcast to everyone so their sidebars update instantly
        io.emit("member-removed", { serverId, memberId });
    });
    socket.on("speaking", ({ channelId, isSpeaking }) => {
        socket.to(channelId).emit("user-speaking", { userId: socketUserMap[socket.id]?.id, isSpeaking });
    });
    // Global Notifications (Server level rooms)
    socket.on("join-server-room", (serverId) => {
        socket.join(`server-${serverId}`);
    });

    socket.on("leave-server-room", (serverId) => {
        socket.leave(`server-${serverId}`);
    });

    socket.on("new-message", ({ serverId, message, channelName }) => {
        // Broadcast to everyone else in the server
        socket.to(`server-${serverId}`).emit("server-notification", {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: "MESSAGE",
            message: `${message.senderName} just sent a message ${channelName ? `in #${channelName}` : ''}`,
            data: message,
            timestamp: new Date()
        });
    });

    socket.on("user-joined-server", ({ serverId, user }) => {
        io.to(`server-${serverId}`).emit("server-notification", {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: "JOIN",
            message: `${user.username} joined the server! Welcome them.`,
            data: user,
            timestamp: new Date()
        });
    });

    socket.on("user-left-server", ({ serverId, userId, username }) => {
        io.to(`server-${serverId}`).emit("server-notification", {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: "LEAVE",
            message: `${username || 'A user'} left the server.`,
            data: { userId },
            timestamp: new Date()
        });
    });

    // ============================================
    // Direct Messaging & Friends (User level rooms)
    // ============================================
    socket.on("join-user-room", (userId) => {
        if (!userId) return;
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their personal socket room.`);
    });

    // Emitted by sender, caught by receiver
    socket.on("send-friend-request", ({ receiverId, request }) => {
        socket.to(`user-${receiverId}`).emit("friend-request-received", request);
    });

    // Emitted by receiver, caught by sender
    socket.on("accept-friend-request", ({ senderId, friend }) => {
        socket.to(`user-${senderId}`).emit("friend-request-accepted", friend);
    });

    // Emitted by sender, caught by receiver
    socket.on("send-direct-message", ({ receiverId, message, conversationId }) => {
        socket.to(`user-${receiverId}`).emit("direct-message-received", { message, conversationId });
    });

    socket.on("delete-direct-message", ({ receiverId, messageId, conversationId }) => {
        socket.to(`user-${receiverId}`).emit("direct-message-deleted", { messageId, conversationId });
    });

    socket.on("react-direct-message", ({ receiverId, message, conversationId }) => {
        socket.to(`user-${receiverId}`).emit("direct-message-reacted", { message, conversationId });
    });

    // ============================================
    // Real-Time Call Signaling
    // ============================================
    socket.on("call-invite", ({ targetUserId, callType, conversationId, caller }) => {
        io.to(`user-${targetUserId}`).emit("incoming-call", {
            callType,
            conversationId,
            caller,
            callerSocketId: socket.id
        });
    });

    socket.on("call-declined", ({ callerSocketId }) => {
        io.to(callerSocketId).emit("call-was-declined");
    });

    socket.on("call-accepted", ({ callerSocketId }) => {
        io.to(callerSocketId).emit("call-was-accepted");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        leaveVoiceChannel(socket);
        delete socketUserMap[socket.id];
    });
});

function leaveVoiceChannel(socket) {
    const channelId = socket.voiceChannelId;
    if (channelId && voiceChannels[channelId]) {
        const user = socketUserMap[socket.id];

        voiceChannels[channelId] = voiceChannels[channelId].filter(p => p.socketId !== socket.id);

        if (voiceChannels[channelId].length === 0) {
            delete voiceChannels[channelId];
        }

        socket.leave(channelId);
        socket.voiceChannelId = null;

        socket.to(channelId).emit("user-left-voice", { socketId: socket.id, userId: user?.id });
        console.log(`User ${user?.username || 'Unknown'} left voice channel ${channelId}`);
    }
}

// Database Connection
mongoose
    .connect(process.env.MONGO_URI || process.env.MONGO_URL)
    .then(() => console.log("DB Connection Successful"))
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
