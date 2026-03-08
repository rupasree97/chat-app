import express from 'express';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ─── 1. Dummy Activate Nitro (single plan — ₹199/month) ─────────────────────
router.post('/activate-nitro', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const existingUser = await User.findById(userId);
        if (!existingUser) return res.status(404).json({ message: "User not found" });

        if (existingUser.nitro?.isActive) {
            return res.status(400).json({ message: "You already have an active Nitro subscription." });
        }

        const activatedAt = new Date();
        const expiresAt = new Date(activatedAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        const user = await User.findByIdAndUpdate(
            userId,
            {
                'nitro.isActive': true,
                'nitro.planType': 'monthly',
                'nitro.activatedAt': activatedAt,
                'nitro.expiresAt': expiresAt,
                'nitro.stripeSubscriptionId': `DEMO_${Date.now()}`
            },
            { new: true }
        );

        // Log payment record
        await new Payment({
            userId,
            amount: 199,
            currency: 'INR',
            status: 'success',
            paymentProvider: 'dummy',
            transactionId: `NITRO_DEMO_${Date.now()}`,
            planType: 'monthly',
            subscriptionStart: activatedAt,
            subscriptionExpiry: expiresAt
        }).save();

        // Emit real-time socket event
        const io = req.app.get('io');
        if (io) io.to(`user-${userId}`).emit('nitro-activated', { nitro: user.nitro });

        const { password, ...others } = user._doc;
        res.status(200).json({ message: 'Nitro activated!', user: others });
    } catch (err) {
        console.error('Activate Nitro Error:', err);
        res.status(500).json({ message: 'Failed to activate Nitro' });
    }
});

// ─── 2. Request Refund Preview (no mutation) ─────────────────────────────────
router.post('/request-refund', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.nitro?.isActive) {
            return res.status(400).json({ message: "No active subscription found." });
        }

        // Find the most recent successful payment for this user
        const payment = await Payment.findOne({
            userId,
            status: 'success',
            planType: 'monthly'
        }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(400).json({ message: "No payment record found for refund." });
        }

        const purchaseDate = payment.subscriptionStart || payment.createdAt;
        const now = new Date();
        const hoursElapsed = (now - purchaseDate) / (1000 * 60 * 60);

        let refundType, refundAmount, message;

        if (hoursElapsed <= 24) {
            refundType = 'full';
            refundAmount = payment.amount;
            message = 'Full refund available';
        } else if (hoursElapsed <= 48) {
            refundType = 'partial';
            refundAmount = Math.round(payment.amount * 0.5);
            message = 'Partial refund available (50%)';
        } else {
            refundType = 'none';
            refundAmount = 0;
            message = 'Refund window expired';
        }

        res.status(200).json({
            eligible: refundType !== 'none',
            refundType,
            refundAmount,
            message,
            purchaseDate,
            hoursElapsed: Math.round(hoursElapsed * 10) / 10,
            originalAmount: payment.amount,
            paymentId: payment._id
        });
    } catch (err) {
        console.error('Request Refund Error:', err);
        res.status(500).json({ message: 'Failed to check refund eligibility' });
    }
});

// ─── 3. Process Refund ───────────────────────────────────────────────────────
router.post('/process-refund', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.nitro?.isActive) {
            return res.status(400).json({ message: "No active subscription found." });
        }

        // Find the most recent successful (non-refunded) payment
        const payment = await Payment.findOne({
            userId,
            status: 'success',
            planType: 'monthly'
        }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(400).json({ message: "No eligible payment found for refund." });
        }

        // Prevent double refund
        if (payment.status === 'refunded') {
            return res.status(400).json({ message: "This payment has already been refunded." });
        }

        const purchaseDate = payment.subscriptionStart || payment.createdAt;
        const now = new Date();
        const hoursElapsed = (now - purchaseDate) / (1000 * 60 * 60);

        let refundAmount;

        if (hoursElapsed <= 24) {
            refundAmount = payment.amount;
        } else if (hoursElapsed <= 48) {
            refundAmount = Math.round(payment.amount * 0.5);
        } else {
            return res.status(400).json({ message: "Refund window has expired. Refunds are only available within 48 hours of purchase." });
        }

        // 1. Add refund to wallet
        await User.findByIdAndUpdate(userId, {
            $inc: { walletBalance: refundAmount },
            'nitro.isActive': false,
            'nitro.planType': 'none'
        });

        // 2. Mark payment as refunded
        payment.status = 'refunded';
        payment.refundAmount = refundAmount;
        await payment.save();

        // 3. Fetch updated user
        const updatedUser = await User.findById(userId);

        // 4. Emit socket events
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${userId}`).emit('nitro-deactivated', { nitro: updatedUser.nitro });
            io.to(`user-${userId}`).emit('wallet-updated', { walletBalance: updatedUser.walletBalance });
        }

        const { password, ...others } = updatedUser._doc;
        res.status(200).json({
            message: `Refund processed. ₹${refundAmount} added to your wallet.`,
            refundAmount,
            user: others
        });
    } catch (err) {
        console.error('Process Refund Error:', err);
        res.status(500).json({ message: 'Failed to process refund' });
    }
});

// ─── 4. Cancel Subscription (no refund) ──────────────────────────────────────
router.delete('/cancel-subscription', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.nitro?.isActive) {
            return res.status(400).json({ message: "No active subscription found." });
        }

        await User.findByIdAndUpdate(userId, {
            'nitro.isActive': false,
            'nitro.planType': 'none'
        });

        res.status(200).json({
            message: "Subscription cancelled. Nitro access removed.",
            expiresAt: user.nitro.expiresAt
        });
    } catch (err) {
        console.error("Cancel Subscription Error:", err);
        res.status(500).json({ message: "Failed to cancel subscription" });
    }
});

// ─── 5. Get Wallet Balance ───────────────────────────────────────────────────
router.get('/wallet', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('walletBalance');
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ walletBalance: user.walletBalance || 0 });
    } catch (err) {
        console.error('Wallet Error:', err);
        res.status(500).json({ message: 'Failed to fetch wallet balance' });
    }
});

// ─── 6. Get Payment History ──────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.status(200).json({ payments });
    } catch (err) {
        console.error('History Error:', err);
        res.status(500).json({ message: 'Failed to fetch payment history' });
    }
});

export default router;
