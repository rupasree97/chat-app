import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Server from './models/Server.js';
import Channel from './models/Channel.js';
import Message from './models/Message.js';

dotenv.config();

const resetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cyberchat");
        console.log("Connected to MongoDB");

        console.log("Deleting all Servers...");
        await Server.deleteMany({});

        console.log("Deleting all Channels...");
        await Channel.deleteMany({});

        console.log("Deleting all Messages...");
        await Message.deleteMany({});

        console.log("Database reset complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting DB:", error);
        process.exit(1);
    }
}

resetDB();
