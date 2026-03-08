import express from "express";
import User from "../models/User.js";
import Server from "../models/Server.js";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import VoiceSession from "../models/VoiceSession.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, profilePicture } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profilePicture: profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        });

        const user = await newUser.save();

        // Create Token for auto-login
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
        const { password: _, ...others } = user._doc;

        res.status(201).json({ ...others, token });
    } catch (err) {
        res.status(500).json(err);
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        // Input can be email or username
        const identifier = req.body.email;

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) return res.status(404).json("User not found");

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json("Wrong password");

        const { password, ...others } = user._doc;

        // Create Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

        res.status(200).json({ ...others, token });
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET ALL USERS (for mention/community members)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET CURRENT USER (for session rehydration — fresh from DB)
router.get("/me", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: "userId query param required" });

        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Auto-expire Nitro check
        if (user.nitro?.isActive && user.nitro.expiresAt) {
            if (new Date() > new Date(user.nitro.expiresAt)) {
                user.nitro.isActive = false;
                await user.save();
                console.log(`User ${userId} Nitro expired and was auto-deactivated.`);
            }
        }

        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json(err);
    }
});


// UPDATE PROFILE
router.put("/profile", async (req, res) => {
    try {
        const { userId, username, bio, profilePicture, bannerColor, status, profileEffects, selectedProfileTheme } = req.body;

        if (!userId) return res.status(400).json({ message: "userId is required" });

        const currentUser = await User.findById(userId);
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        const updateFields = {};
        if (username !== undefined) updateFields.username = username;
        if (bio !== undefined) updateFields.bio = bio;
        if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
        if (bannerColor !== undefined) updateFields.bannerColor = bannerColor;
        if (status !== undefined) updateFields.status = status;

        if (profileEffects !== undefined) {
            if (currentUser.nitro?.isActive) {
                updateFields.profileEffects = { ...currentUser.profileEffects, ...profileEffects };
            } else {
                return res.status(403).json({ message: "Nitro subscription required for profile effects" });
            }
        }

        if (selectedProfileTheme !== undefined) {
            if (currentUser.nitro?.isActive) {
                updateFields.selectedProfileTheme = selectedProfileTheme;
            } else {
                return res.status(403).json({ message: "Nitro subscription required for animated profile themes" });
            }
        }

        console.log(`Updating profile for user ${userId} with fields:`, Object.keys(updateFields));

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        const { password, ...others } = updatedUser._doc;

        // Broadcast the update so all clients refresh their avatars/nitro badges
        const io = req.app.get("io");
        if (io) {
            io.emit("user-updated", others);
        }

        res.status(200).json(others);
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE ACCOUNT
router.delete("/me", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required to delete account" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        // 1. Delete all messages sent by this user
        await Message.deleteMany({ sender: userId });

        // 2. Handle servers owned by user (Delete them, their channels, and their messages)
        const ownedServers = await Server.find({ createdBy: userId });
        for (const server of ownedServers) {
            await Message.deleteMany({ serverId: server._id });
            await Channel.deleteMany({ serverId: server._id });
            await Server.findByIdAndDelete(server._id);
        }

        // 3. Remove user from all other servers' members array
        await Server.updateMany(
            { "members.user": userId },
            { $pull: { members: { user: userId } } }
        );

        // 4. Remove any active VoiceSessions for this user
        await VoiceSession.deleteMany({ userId });

        // 5. Delete the user document
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Error deleting account:", err);
        res.status(500).json({ message: "Internal server error during account deletion" });
    }
});



export default router;
