import express from "express";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Conversation from "../models/Conversation.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/friends
 * @desc    Get all accepted friends for the current user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "username email profilePicture status customTag bannerColor nitro profileEffects");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user.friends);
    } catch (err) {
        console.error("GET /api/friends error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   GET /api/friends/pending
 * @desc    Get all pending incoming and outgoing friend requests
 * @access  Private
 */
router.get("/pending", auth, async (req, res) => {
    try {
        const incoming = await FriendRequest.find({ receiver: req.user.id, status: "pending" })
            .populate("sender", "username profilePicture status customTag bannerColor nitro profileEffects")
            .sort({ createdAt: -1 });

        const outgoing = await FriendRequest.find({ sender: req.user.id, status: "pending" })
            .populate("receiver", "username profilePicture status customTag bannerColor nitro profileEffects")
            .sort({ createdAt: -1 });

        res.status(200).json({ incoming, outgoing });
    } catch (err) {
        console.error("GET /api/friends/pending error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   POST /api/friends/request
 * @desc    Send a friend request by username OR userId
 * @access  Private
 */
router.post("/request", auth, async (req, res) => {
    try {
        const { targetUserId, username } = req.body;
        const senderId = req.user.id;

        let receiver;

        // Find by ID or Username
        if (targetUserId) {
            receiver = await User.findById(targetUserId);
        } else if (username) {
            // Support searching matching exact username (with or without #tag)
            if (username.includes('#')) {
                const [uname, tag] = username.split('#');
                receiver = await User.findOne({ username: { $regex: new RegExp(`^${uname}$`, 'i') }, customTag: `#${tag}` });
            } else {
                receiver = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
            }
        }

        if (!receiver) {
            return res.status(404).json({ message: "User not found. Double check the username." });
        }

        if (receiver._id.toString() === senderId) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        // Check if already friends
        if (receiver.friends.includes(senderId)) {
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        // Check for existing requests (incoming or outgoing)
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiver._id },
                { sender: receiver._id, receiver: senderId }
            ],
            status: { $in: ["pending", "accepted"] }
        });

        if (existingRequest) {
            if (existingRequest.status === "accepted") {
                return res.status(400).json({ message: "You are already friends." });
            }
            if (existingRequest.sender.toString() === senderId) {
                return res.status(400).json({ message: "You have already sent a request to this user." });
            } else {
                return res.status(400).json({ message: "This user has already sent you a request. Check your incoming requests." });
            }
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiver._id,
            status: "pending"
        });

        await newRequest.save();

        const populatedReq = await FriendRequest.findById(newRequest._id).populate("sender", "username profilePicture status customTag bannerColor nitro profileEffects");

        // Return success, Socket logic happens at index.js or can be mocked here. We rely on the router returning it.
        res.status(200).json({ message: "Friend request sent!", request: populatedReq });
    } catch (err) {
        console.error("POST /api/friends/request error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   POST /api/friends/accept
 * @desc    Accept a friend request
 * @access  Private
 */
router.post("/accept", auth, async (req, res) => {
    try {
        const { requestId } = req.body;
        const currentUserId = req.user.id;

        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (request.receiver.toString() !== currentUserId) {
            return res.status(403).json({ message: "Unauthorized to accept this request" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request already processed" });
        }

        // Mark as accepted
        request.status = "accepted";
        await request.save();

        // Add to both users' friends arrays
        await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: request.sender } });
        await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: currentUserId } });

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, request.sender] }
        });

        // Create new if it doesn't
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, request.sender]
            });
        }

        const senderPopulated = await User.findById(request.sender).select("username email profilePicture status customTag bannerColor nitro profileEffects");

        res.status(200).json({ message: "Friend request accepted", friend: senderPopulated, request, conversationId: conversation._id });
    } catch (err) {
        console.error("POST /api/friends/accept error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   POST /api/friends/reject
 * @desc    Reject or Cancel a friend request
 * @access  Private
 */
router.post("/reject", auth, async (req, res) => {
    try {
        const { requestId } = req.body;
        const currentUserId = req.user.id;

        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Allow both the receiver (rejecting) and sender (canceling) to delete the request
        if (request.receiver.toString() !== currentUserId && request.sender.toString() !== currentUserId) {
            return res.status(403).json({ message: "Unauthorized to reject or cancel this request" });
        }

        await FriendRequest.findByIdAndDelete(requestId);

        res.status(200).json({ message: "Friend request removed", requestId });
    } catch (err) {
        console.error("POST /api/friends/reject error:", err);
        res.status(500).json(err);
    }
});

/**
 * @route   DELETE /api/friends/:friendId
 * @desc    Remove an accepted friend
 * @access  Private
 */
router.delete("/:friendId", auth, async (req, res) => {
    try {
        const friendId = req.params.friendId;
        const currentUserId = req.user.id;

        await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId } });

        // Clean up the friend request document entirely so they can re-add later
        await FriendRequest.findOneAndDelete({
            $or: [
                { sender: currentUserId, receiver: friendId },
                { sender: friendId, receiver: currentUserId }
            ]
        });

        res.status(200).json({ message: "Friend removed", friendId });
    } catch (err) {
        console.error("DELETE /api/friends error:", err);
        res.status(500).json(err);
    }
});

export default router;
