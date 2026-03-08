import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        min: 3,
        max: 20,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        max: 50,
    },
    password: {
        type: String,
        required: true,
        min: 6,
    },
    profilePicture: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        max: 160,
        default: "",
    },
    status: {
        type: String,
        enum: ["online", "idle", "dnd", "offline"],
        default: "online",
    },
    customTag: {
        type: String,
        default: function () {
            return "#" + Math.floor(1000 + Math.random() * 9000);
        }
    },
    bannerColor: {
        type: String,
        default: "#7289da", // Discord blurple-ish default
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    nitro: {
        isActive: { type: Boolean, default: false },
        activatedAt: Date,
        expiresAt: Date,
        planType: { type: String, enum: ["monthly", "none"], default: "none" },
        stripeCustomerId: String,
        stripeSubscriptionId: String
    },
    selectedProfileTheme: {
        type: String,
        enum: ['none', 'dinosaur', 'unicorn', 'alien', 'blackhole'],
        default: 'none'
    },
    profileEffects: {
        animatedAvatar: { type: Boolean, default: false },
        animatedBanner: { type: Boolean, default: false },
        profileGlow: { type: Boolean, default: false },
        animationEnabled: { type: Boolean, default: true },
        theme: {
            type: String,
            enum: ['default', 'dark', 'light', 'unicorn', 'rhino', 'dino', 'dragon', 'alien', 'ghost', 'robot', 'ninja', 'synthwave', 'midnight', 'sunset', 'forest', 'ocean', 'cyberpunk', 'crimson', 'amethyst', 'gold', 'galaxy', 'cyber_flame'],
            default: 'default'
        },
        decoration: { type: String, default: "" },
        accentColor: { type: String, default: "" }
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    joinedServers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
    }],
    boostedServers: [{
        serverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Server",
            required: true
        },
        boostedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
