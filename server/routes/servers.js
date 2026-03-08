import express from 'express';
import mongoose from 'mongoose';
import Server from '../models/Server.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import auth from '../middleware/auth.js';
import checkModerator from '../middleware/checkModerator.js';

const router = express.Router();

// GET /api/servers - Get servers for a specific user
router.get('/', auth, async (req, res) => {
    try {
        const { userId } = req.query;

        let servers;
        if (userId) {
            // Return only servers where user is a member
            if (mongoose.Types.ObjectId.isValid(userId)) {
                servers = await Server.find({ "members.user": new mongoose.Types.ObjectId(userId) })
                    .populate('channels')
                    .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
            } else {
                servers = [];
            }
        } else {
            // Fallback: return all (for discovery/search)
            servers = await Server.find()
                .populate('channels')
                .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        }

        res.status(200).json(servers);
    } catch (err) {
        console.error("GET /api/servers error:", err);
        res.status(500).json(err);
    }
});

// GET /api/servers/public - Get all public servers
router.get('/public', async (req, res) => {
    try {
        const servers = await Server.find({
            $or: [
                { visibility: "public" },
                { isPublic: true } // Support legacy communities that haven't been migrated
            ]
        })
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(servers);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET /api/servers/search - Search servers for discovery
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const servers = await Server.find({
            name: { $regex: query, $options: 'i' }
        })
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(servers);
    } catch (err) {
        res.status(500).json(err);
    }
});

// POST /api/servers - Create a server
router.post('/', auth, async (req, res) => {
    const { name, userId, description, icon } = req.body;

    if (!name || !userId) {
        return res.status(400).json({ message: "name and userId are required" });
    }

    try {
        // 1. Create server first (so we have the _id for channel.serverId)
        const newServer = new Server({
            name,
            description: description || '',
            createdBy: userId,
            members: [{ user: userId, role: "MODERATOR" }],
            channels: [],
            icon: icon || ''
        });

        const savedServer = await newServer.save();

        // 2. Create default channels with proper serverId
        const generalChannel = new Channel({
            name: 'general',
            type: 'text',
            serverId: savedServer._id
        });
        const voiceChannel = new Channel({
            name: 'General Voice',
            type: 'voice',
            serverId: savedServer._id
        });

        const savedGeneral = await generalChannel.save();
        const savedVoice = await voiceChannel.save();

        // 3. Link channels to server
        savedServer.channels = [savedGeneral._id, savedVoice._id];
        await savedServer.save();

        // 4. Add server to user's joinedServers array
        await User.findByIdAndUpdate(userId, {
            $addToSet: { joinedServers: savedServer._id }
        });

        // 5. Return populated server
        const populatedServer = await Server.findById(savedServer._id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');

        console.log(`Server "${name}" created by user ${userId}, ID: ${savedServer._id}`);
        res.status(201).json(populatedServer);
    } catch (err) {
        console.error("POST /api/servers error:", err);
        res.status(500).json(err);
    }
});

// GET /api/servers/:serverId - Get single server
router.get('/:id', auth, async (req, res) => {
    try {
        const server = await Server.findById(req.params.id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        if (!server) return res.status(404).json({ message: "Server not found" });
        res.status(200).json(server);
    } catch (err) {
        res.status(500).json(err);
    }
});


// PUT /api/servers/:id - Update server
router.put('/:id', auth, checkModerator, async (req, res) => {
    try {
        const server = await Server.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        )
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(server);
    } catch (err) {
        res.status(500).json(err);
    }
});

// PATCH /api/servers/:id/icon - Update server icon
router.patch('/:id/icon', auth, async (req, res) => {
    try {
        const { icon } = req.body;
        const server = await Server.findById(req.params.id);

        if (!server) return res.status(404).json({ message: "Server not found" });

        // STRICT PERMISSION: Only creator can update icon
        if (server.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: Only the server owner can update the icon" });
        }

        if (!icon) {
            return res.status(400).json({ message: "Icon data is required" });
        }

        server.icon = icon;
        await server.save();

        const populatedServer = await Server.findById(server._id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(populatedServer);
    } catch (err) {
        console.error("PATCH icon error:", err);
        res.status(500).json(err);
    }
});

// DELETE /api/servers/:id/icon - Remove server icon
router.delete('/:id/icon', auth, async (req, res) => {
    try {
        const server = await Server.findById(req.params.id);

        if (!server) return res.status(404).json({ message: "Server not found" });

        // STRICT PERMISSION: Only creator can delete icon
        if (server.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: Only the server owner can remove the icon" });
        }

        server.icon = '';
        await server.save();

        const populatedServer = await Server.findById(server._id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(populatedServer);
    } catch (err) {
        console.error("DELETE icon error:", err);
        res.status(500).json(err);
    }
});

// DELETE /api/servers/:id - Delete server
router.delete('/:id', auth, checkModerator, async (req, res) => {
    try {
        // Remove from all members' joinedServers
        await User.updateMany(
            { joinedServers: req.params.id },
            { $pull: { joinedServers: req.params.id } }
        );

        // Delete all channels
        await Channel.deleteMany({ serverId: req.params.id });
        // Delete all messages
        await Message.deleteMany({ serverId: req.params.id });

        await Server.findByIdAndDelete(req.params.id);
        res.status(200).json("Server deleted");
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE /api/servers/:id/members/:memberId - Remove a member
router.delete('/:id/members/:memberId', auth, async (req, res) => {
    try {
        const server = await Server.findById(req.params.id);
        if (!server) return res.status(404).json({ message: "Server not found" });

        // STRICT PERMISSION: Only creator can remove members
        if (server.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: Only the server owner can remove members" });
        }

        // Prevent self-removal here (owner cannot remove themselves)
        if (req.user.id === req.params.memberId) {
            return res.status(400).json({ message: "Owner cannot remove themselves. Use server deletion or transfer." });
        }

        // Pull the member from the server array
        server.members = server.members.filter(m => m.user.toString() !== req.params.memberId);
        await server.save();

        // Pull the server from the user's joinedServers
        await User.findByIdAndUpdate(req.params.memberId, {
            $pull: { joinedServers: server._id }
        });

        // Return the updated server object
        const populatedServer = await Server.findById(server._id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');

        res.status(200).json(populatedServer);
    } catch (err) {
        console.error("DELETE member error:", err);
        res.status(500).json(err);
    }
});

// POST /api/servers/:id/channels - Create channel
router.post('/:id/channels', auth, checkModerator, async (req, res) => {
    const { name, type } = req.body;
    try {
        const newChannel = new Channel({
            name,
            type: type || 'text',
            serverId: req.params.id
        });
        const savedChannel = await newChannel.save();

        await Server.findByIdAndUpdate(req.params.id, {
            $push: { channels: savedChannel._id }
        });

        console.log(`Channel "${name}" (${type}) created in server ${req.params.id}`);
        res.status(201).json(savedChannel);
    } catch (err) {
        console.error("POST channel error:", err);
        res.status(500).json(err);
    }
});

// DELETE /api/servers/:id/channels/:channelId - Delete channel
router.delete('/:id/channels/:channelId', auth, checkModerator, async (req, res) => {
    try {
        await Channel.findByIdAndDelete(req.params.channelId);
        await Message.deleteMany({ channelId: req.params.channelId });

        await Server.findByIdAndUpdate(req.params.id, {
            $pull: { channels: req.params.channelId }
        });
        res.status(200).json("Channel deleted");
    } catch (err) {
        res.status(500).json(err);
    }
});

// PUT /api/servers/:id/channels/:channelId - Rename channel
router.put('/:id/channels/:channelId', auth, checkModerator, async (req, res) => {
    try {
        const channel = await Channel.findByIdAndUpdate(
            req.params.channelId,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(channel);
    } catch (err) {
        res.status(500).json(err);
    }
});

// POST /api/servers/:id/join - Join server
router.post('/:id/join', async (req, res) => {
    const { userId } = req.body;
    try {
        const server = await Server.findById(req.params.id);
        if (!server) return res.status(404).json("Server not found");

        if (!server.members.find(m => m.user.toString() === userId)) {
            server.members.push({ user: userId, role: "MEMBER" });
            await server.save();

            // Also add to user's joinedServers
            await User.findByIdAndUpdate(userId, {
                $addToSet: { joinedServers: server._id }
            });
        }

        const populated = await Server.findById(req.params.id)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');
        res.status(200).json(populated);
    } catch (err) {
        res.status(500).json(err);
    }
});

// POST /api/servers/:id/leave - Leave server
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const server = await Server.findById(req.params.id);
        if (!server) return res.status(404).json({ message: "Server not found" });

        // Prevent owner from leaving
        if (server.createdBy.toString() === req.user.id) {
            return res.status(400).json({ message: "Owner cannot leave the server. Please delete the server or transfer ownership." });
        }

        const isMember = server.members.some(m => m.user.toString() === req.user.id);
        if (!isMember) {
            return res.status(400).json({ message: "You are not a member of this server." });
        }

        // Pull the member from the server array
        server.members = server.members.filter(m => m.user.toString() !== req.user.id);
        await server.save();

        // Pull the server from the user's joinedServers
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { joinedServers: server._id }
        });

        res.status(200).json({ message: "Successfully left the server", serverId: server._id });
    } catch (err) {
        console.error("POST /api/servers/:id/leave error:", err);
        res.status(500).json(err);
    }
});
// POST /api/servers/:id/boost - Boost a server
router.post('/:id/boost', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const serverId = req.params.id;

        // 1. Validate User has Nitro
        const user = await User.findById(userId);
        if (!user || user.nitro?.isActive !== true) {
            return res.status(403).json({ message: "You must have an active Nitro subscription to boost a server." });
        }

        // 2. Validate Server
        const server = await Server.findById(serverId);
        if (!server) return res.status(404).json({ message: "Server not found" });

        // 3. Check if user already boosted this server
        const alreadyBoosted = server.boosts.some(b => b.userId.toString() === userId);
        if (alreadyBoosted) {
            return res.status(400).json({ message: "You are already boosting this server." });
        }

        // 4. Update Server
        server.boosts.push({ userId, boostedAt: new Date() });
        const boostCount = server.boosts.length;
        server.boostCount = boostCount;

        // Calculate Level (0:0, 1:2, 2:5, 3:10)
        if (boostCount >= 10) server.boostLevel = 3;
        else if (boostCount >= 5) server.boostLevel = 2;
        else if (boostCount >= 2) server.boostLevel = 1;
        else server.boostLevel = 0;

        await server.save();

        // 5. Update User
        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                boostedServers: { serverId, boostedAt: new Date() }
            }
        });

        // 6. Return populated server
        const populatedServer = await Server.findById(serverId)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');

        const io = req.app.get("io");
        if (io) {
            io.to(`server-${serverId}`).emit("server-updated", populatedServer);
        }

        res.status(200).json(populatedServer);
    } catch (err) {
        console.error("POST /boost error:", err);
        res.status(500).json(err);
    }
});

// DELETE /api/servers/:id/boost - Remove a boost
router.delete('/:id/boost', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const serverId = req.params.id;

        const server = await Server.findById(serverId);
        if (!server) return res.status(404).json({ message: "Server not found" });

        // 1. Remove boost from Server
        server.boosts = server.boosts.filter(b => b.userId.toString() !== userId);
        const boostCount = server.boosts.length;
        server.boostCount = boostCount;

        // Recalculate Level
        if (boostCount >= 10) server.boostLevel = 3;
        else if (boostCount >= 5) server.boostLevel = 2;
        else if (boostCount >= 2) server.boostLevel = 1;
        else server.boostLevel = 0;

        await server.save();

        // 2. Remove from User
        await User.findByIdAndUpdate(userId, {
            $pull: {
                boostedServers: { serverId }
            }
        });

        const populatedServer = await Server.findById(serverId)
            .populate('channels')
            .populate('members.user', 'username profilePicture status customTag bannerColor nitro profileEffects');

        const io = req.app.get("io");
        if (io) {
            io.to(`server-${serverId}`).emit("server-updated", populatedServer);
        }

        res.status(200).json(populatedServer);
    } catch (err) {
        console.error("DELETE /boost error:", err);
        res.status(500).json(err);
    }
});

export default router;
