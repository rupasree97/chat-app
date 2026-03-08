import mongoose from "mongoose";

const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 50,
    },
    icon: {
        type: String, // URL to image/icon
        default: "",
    },
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
    },
    banner: {
        type: String, // URL to banner image
        default: "",
    },
    description: {
        type: String,
        max: 200,
        default: "",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["MODERATOR", "MEMBER"],
            default: "MEMBER"
        }
    }],
    channels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
    }],
    boosts: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        boostedAt: {
            type: Date,
            default: Date.now
        }
    }],
    boostCount: {
        type: Number,
        default: 0
    },
    boostLevel: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model("Server", serverSchema);
