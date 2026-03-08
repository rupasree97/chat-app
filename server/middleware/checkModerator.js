import Server from '../models/Server.js';

const checkModerator = async (req, res, next) => {
    try {
        const serverId = req.params.id; // From routes like /servers/:id/channels
        if (!serverId) {
            return res.status(400).json("Server ID is required");
        }

        const server = await Server.findById(serverId);
        if (!server) {
            return res.status(404).json("Server not found");
        }

        // Find current user in the members array
        const member = server.members.find(
            (m) => m.user.toString() === req.user.id
        );

        if (!member) {
            return res.status(403).json("Forbidden: You are not a member of this server");
        }

        if (member.role !== "MODERATOR") {
            return res.status(403).json("Forbidden: Only moderators can perform this action");
        }

        // Add the found server to the request object to avoid refetching
        req.server = server;
        next();
    } catch (err) {
        console.error("checkModerator error:", err);
        res.status(500).json(err);
    }
};

export default checkModerator;
