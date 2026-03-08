import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import checkMember from "../middleware/checkMember.js";
import DirectMessage from "../models/DirectMessage.js";

const router = express.Router();

// Helper to format message for frontend
const formatMessage = (msg) => {
    const obj = msg.toObject ? msg.toObject() : msg;
    const sender = obj.sender || {}; // handle populated or raw
    return {
        ...obj,
        id: obj._id,
        timestamp: obj.createdAt, // Frontend expects 'timestamp'
        senderId: sender._id || obj.sender,
        senderName: sender.username || "Unknown",
        senderAvatar: sender.avatar || sender.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username || 'unknown'}`,
        nitro: sender.nitro,
        profileEffects: sender.profileEffects,
        reactions: obj.reactions ? obj.reactions.reduce((acc, r) => {
            // Transform reaction array to object { emoji: [userIds] } if needed, 
            // BUT schema says reactions: [{ userId, emoji }]
            // Frontend expects: reactions: { '👍': ['user1', 'user2'] }
            // Let's transform it:
            if (!acc[r.emoji]) acc[r.emoji] = [];
            if (r.userId) acc[r.emoji].push(r.userId.toString());
            return acc;
        }, {}) : {},
        giftOpenedBy: obj.giftOpenedBy ? obj.giftOpenedBy.map(id => id.toString()) : []
    };
};

// GET /api/messages/:channelId - Get messages
router.get("/:channelId", auth, checkMember, async (req, res) => {
    try {
        const { limit = 50, before } = req.query;
        const query = { channelId: req.params.channelId, deleted: false };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("sender", "username avatar profilePicture nitro profileEffects");

        // Reverse to show oldest first (history) but we fetched newest first
        const transformed = messages.map(formatMessage).reverse();

        res.status(200).json(transformed);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// POST /api/messages - Create message
router.post("/", auth, checkMember, async (req, res) => {
    const { serverId, channelId, senderId, content, mentions, attachment } = req.body;
    try {
        const newMessage = new Message({
            serverId,
            channelId,
            sender: senderId,
            content,
            mentions: mentions || [],
            attachment
        });

        const savedMessage = await newMessage.save();

        const populated = await Message.findById(savedMessage._id)
            .populate("sender", "username avatar profilePicture nitro profileEffects");

        res.status(201).json(formatMessage(populated));
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// DELETE /api/messages/:id - Soft delete
router.delete("/:id", auth, async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json("Message deleted");
    } catch (err) {
        res.status(500).json(err);
    }
});

// PUT /api/messages/:id - Edit message
router.put("/:id", auth, async (req, res) => {
    try {
        const updated = await Message.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content, editedAt: new Date() },
            { new: true }
        )
            .populate("sender", "username avatar profilePicture nitro profileEffects")
            .populate("mentions", "username");

        res.status(200).json(formatMessage(updated));
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// POST /api/messages/:id/react - Toggle reaction
router.post("/:id/react", auth, async (req, res) => {
    const { emoji, userId } = req.body;

    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json("Message not found");

        const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji && r.userId.toString() === userId);

        if (reactionIndex > -1) {
            // Remove reaction
            message.reactions.splice(reactionIndex, 1);
        } else {
            // Add reaction
            message.reactions.push({ userId, emoji });
        }

        const updatedMessage = await message.save();

        // Populate sender for consistency
        const populated = await Message.findById(updatedMessage._id)
            .populate("sender", "username avatar profilePicture nitro profileEffects");

        res.status(200).json(formatMessage(populated));
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
// POST /api/messages/:id/open-gift - Mark gift as opened
router.post("/:id/open-gift", auth, async (req, res) => {
    try {
        let isDM = false;
        let message = await Message.findById(req.params.id);

        if (!message) {
            message = await DirectMessage.findById(req.params.id);
            if (!message) return res.status(404).json("Message not found");
            isDM = true;
        }

        const userId = req.user.id;

        // Add to opened list if not already there
        if (!message.giftOpenedBy.includes(userId)) {
            message.giftOpenedBy.push(userId);
            await message.save();
        }

        const populated = isDM
            ? await DirectMessage.findById(message._id).populate("sender", "username avatar profilePicture status customTag bannerColor nitro profileEffects")
            : await Message.findById(message._id).populate("sender", "username avatar profilePicture nitro profileEffects");

        res.status(200).json(isDM ? populated : formatMessage(populated));
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

export default router;
