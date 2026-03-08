import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }]
}, { timestamps: true });

// Ensure we can quickly find a conversation between two users
conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);
