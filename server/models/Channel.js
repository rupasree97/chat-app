import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 1,
        max: 50,
    },
    type: {
        type: String,
        enum: ["text", "voice"],
        default: "text",
    },
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
        required: true,
        index: true, // Ensure index for performance
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });

export default mongoose.model("Channel", channelSchema);
