import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "INR",
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed", "canceled", "refunded"],
        default: "pending",
    },
    paymentProvider: {
        type: String,
        default: "dummy",
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    planType: {
        type: String,
        enum: ["monthly"],
        default: "monthly",
    },
    subscriptionStart: {
        type: Date,
    },
    subscriptionExpiry: {
        type: Date,
    },
    refundAmount: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
