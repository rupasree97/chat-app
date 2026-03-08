import Server from '../models/Server.js';
import Channel from '../models/Channel.js';

const checkMember = async (req, res, next) => {
    try {
        let serverIdStr = req.params.serverId || req.params.id;

        // If the route only has a channelId (e.g. GET /messages/:channelId)
        if (!serverIdStr && req.params.channelId) {
            const channel = await Channel.findById(req.params.channelId);
            if (!channel) return res.status(404).json({ message: "Channel not found" });
            serverIdStr = channel.serverId.toString();
        }

        // If serverId is in the body (e.g. POST /messages)
        if (!serverIdStr && req.body.serverId) {
            serverIdStr = req.body.serverId;
        }

        if (!serverIdStr) {
            return res.status(400).json({ message: "Server ID is required to authorize access" });
        }

        const server = await Server.findById(serverIdStr);
        if (!server) {
            return res.status(404).json({ message: "Server not found" });
        }

        const isMember = server.members.some(member => member.user.toString() === req.user.id);

        if (!isMember) {
            return res.status(403).json({ message: "Forbidden: You are not a member of this server." });
        }

        // Pass server down to avoid redundant lookups in subsequent controllers
        req.server = server;
        next();
    } catch (err) {
        console.error("Auth Middleware [checkMember] Error:", err);
        res.status(500).json({ message: "Internal server error authorizing member." });
    }
};

export default checkMember;
