import mongoose from "mongoose";

const voiceSessionSchema = new mongoose.Schema({
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
        unique: true, // Output only one active session doc per channel usually, or one per session instance? 
        // User prompt says "VoiceSessions Collection: channelId, participants...". 
        // Likely one document representing the current state of a channel's voice session.
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    mutedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    videoDisabledUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    startedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model("VoiceSession", voiceSessionSchema);
