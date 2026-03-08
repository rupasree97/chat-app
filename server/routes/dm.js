import express from "express";
import Conversation from "../models/Conversation.js";
import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/dm
 * @desc    Get or create a conversation with a specific user
 * @access  Private
 */
router.post("/", auth, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "Cannot create conversation with yourself" });
        }

        // Verify users are friends
        const currentUser = await User.findById(currentUserId);
        if (!currentUser.friends.includes(targetUserId)) {
            return res.status(403).json({ message: "You can only message friends." });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] }
        }).populate("participants", "username profilePicture status customTag bannerColor nitro profileEffects");

        // Create new if it doesn't
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId]
            });
            // Re-fetch to populate
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "username profilePicture status customTag bannerColor nitro profileEffects");
        }

        res.status(200).json(conversation);
    } catch (err) {
        console.error("POST /api/dm error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   GET /api/dm/conversations
 * @desc    Get all active conversations for the current user
 * @access  Private
 */
router.get("/conversations", auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate("participants", "username profilePicture status customTag bannerColor nitro profileEffects")
            .sort({ updatedAt: -1 });

        res.status(200).json(conversations);
    } catch (err) {
        console.error("GET /api/dm/conversations error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   GET /api/dm/:conversationId/messages
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get("/:conversationId/messages", auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Ensure user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });
        if (!conversation.participants.includes(req.user.id)) return res.status(403).json({ message: "Access denied" });

        const messages = await DirectMessage.find({ conversationId })
            .populate("sender", "username profilePicture status customTag bannerColor nitro profileEffects")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        console.error("GET /api/dm/messages error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   POST /api/dm/:conversationId/messages
 * @desc    Send a new Direct Message
 * @access  Private
 */
router.post("/:conversationId/messages", auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, replyTo, attachment } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });
        if (!conversation.participants.includes(senderId)) return res.status(403).json({ message: "Access denied" });

        const newMessage = new DirectMessage({
            conversationId,
            sender: senderId,
            content,
            replyTo,
            attachment
        });

        await newMessage.save();

        // Update conversation's updatedAt timestamp for sorting active DMs
        conversation.updatedAt = new Date();
        await conversation.save();

        const populatedMessage = await DirectMessage.findById(newMessage._id)
            .populate("sender", "username profilePicture status customTag bannerColor nitro profileEffects");

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error("POST /api/dm/messages error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   DELETE /api/dm/:conversationId/messages/:messageId
 * @desc    Delete a Direct Message
 * @access  Private
 */
router.delete("/:conversationId/messages/:messageId", auth, async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const userId = req.user.id;

        const message = await DirectMessage.findOne({ _id: messageId, conversationId });
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own messages" });
        }

        await DirectMessage.findByIdAndDelete(messageId);
        res.status(200).json({ message: "Message deleted successfully" });
    } catch (err) {
        console.error("DELETE /api/dm/messages error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   POST /api/dm/:conversationId/messages/:messageId/react
 * @desc    Toggle a reaction on a direct message
 * @access  Private
 */
router.post("/:conversationId/messages/:messageId/react", auth, async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        // Verify conversation access
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const message = await DirectMessage.findOne({ _id: messageId, conversationId });
        if (!message) return res.status(404).json({ message: "Message not found" });

        // Initialize reactions map if empty
        if (!message.reactions) {
            message.reactions = new Map();
        }

        const currentReacts = message.reactions.get(emoji) || [];
        const userIndex = currentReacts.indexOf(userId);

        if (userIndex > -1) {
            // Remove reaction
            currentReacts.splice(userIndex, 1);
            if (currentReacts.length === 0) {
                message.reactions.delete(emoji);
            } else {
                message.reactions.set(emoji, currentReacts);
            }
        } else {
            // Add reaction
            currentReacts.push(userId);
            message.reactions.set(emoji, currentReacts);
        }

        await message.save();

        const populated = await DirectMessage.findById(messageId)
            .populate("sender", "username profilePicture status customTag bannerColor nitro profileEffects");

        res.status(200).json(populated);
    } catch (err) {
        console.error("POST /api/dm/messages/react error:", err);
        res.status(500).json(err);
    }
});

export default router;
