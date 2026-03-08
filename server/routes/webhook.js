import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

// Stripe requires the raw body to construct the event
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Authenticate the webhook request
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;

                // Retrieve metadata securely passed during session creation
                const userId = session.metadata.userId;
                const planType = session.metadata.planType;

                console.log(`Checkout session completed for User ${userId}, Plan: ${planType}`);

                // 1. Update Payment Record
                await Payment.findOneAndUpdate(
                    { transactionId: session.id },
                    { status: 'success' }
                );

                // 2. Activate Nitro for User
                const activatedAt = new Date();
                const expiresAt = new Date();
                if (planType === 'monthly') {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                } else if (planType === 'yearly') {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                }

                const user = await User.findById(userId);
                if (user) {
                    user.nitro = {
                        isActive: true,
                        planType: planType,
                        activatedAt: activatedAt,
                        expiresAt: expiresAt,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription
                    };
                    await user.save();

                    // 3. Emit real-time socket event using global io
                    const io = req.app.get('io');
                    if (io) {
                        io.to(`user-${userId}`).emit("nitro-activated", {
                            nitro: user.nitro
                        });
                        console.log(`Emitted nitro-activated to user-${userId}`);
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;

                // Find user by stripe subscription ID and disable Nitro
                const user = await User.findOne({ "nitro.stripeSubscriptionId": subscription.id });
                if (user) {
                    user.nitro.isActive = false;
                    await user.save();

                    const io = req.app.get('io');
                    if (io) {
                        io.to(`user-${user._id}`).emit("nitro-expired");
                    }
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error handling event:', err);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

export default router;
