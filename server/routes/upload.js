import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// POST /api/upload
router.post("/", auth, upload.single("attachment"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // Validate Nitro for animated uploads
        const isAnimatedFormat = req.file.mimetype === 'image/gif' || req.file.mimetype === 'image/webp';
        if (isAnimatedFormat) {
            const user = await User.findById(req.user.id);
            if (!user.nitro?.isActive) {
                // Delete the unlawfully uploaded file immediately to save disk
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ message: "Nitro subscription required to upload animated files" });
            }
        }

        // Return the path that the frontend can use to access the file
        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
            url: fileUrl,
            filename: req.file.originalname,
            fileType: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload file" });
    }
});

export default router;
