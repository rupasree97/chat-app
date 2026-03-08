import express from 'express';
import Channel from '../models/Channel.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/channels/server/:serverId - Get all channels for a server
router.get('/server/:serverId', auth, async (req, res) => {
    try {
        const channels = await Channel.find({ serverId: req.params.serverId });
        res.status(200).json(channels);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET /api/channels/:channelId - Get single channel
router.get('/:channelId', auth, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        res.status(200).json(channel);
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
