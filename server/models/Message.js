import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
        required: true,
        index: true,
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    content: {
        type: String,
        default: "",
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        emoji: String,
    }],
    attachment: {
        url: String,
        filename: String,
        fileType: String
    },
    giftOpenedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    deleted: {
        type: Boolean,
        default: false,
    },
    editedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Compound index for fetching channel messages efficiently
messageSchema.index({ channelId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
