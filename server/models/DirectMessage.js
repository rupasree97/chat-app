import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    reactions: {
        type: Map,
        of: [String], // Array of User IDs who reacted
        default: {}
    },
    attachment: {
        url: String,
        filename: String,
        fileType: String
    },
    giftOpenedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    replyTo: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DirectMessage",
        },
        senderName: String,
        content: String,
    }
}, { timestamps: true });

export default mongoose.model("DirectMessage", directMessageSchema);
