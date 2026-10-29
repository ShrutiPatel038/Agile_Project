import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import { queueService } from '../services/queueService.js';

async function finalizeSuccessfulPayment(booking, paymentId, source = 'verify') {
    if (!booking) return;

    const wasAlreadyCompleted = booking.paymentStatus === 'completed';

    if (!wasAlreadyCompleted) {
        booking.paymentStatus = 'completed';
        booking.paymentId = paymentId;

        // Keep active rides active (extension payments), otherwise mark booking confirmed.
        if (booking.status !== 'active') {
            booking.status = 'confirmed';
        }

        if (booking.securityDeposit?.amount > 0) {
            booking.securityDeposit.status = 'held';
            booking.securityDeposit.heldAt = new Date();
            booking.securityDeposit.transactionId = paymentId;
        }

        await booking.save();

        // Payment succeeded → cancel the payment timeout timer immediately
        await queueService.cancelPaymentTimeoutJob(booking._id.toString());
    }

    const user = await User.findById(booking.user);
    if (user) {
        const pointsEarned = Math.floor(booking.totalCost / 100);
        const existingTxn = await LoyaltyTransaction.findOne({
            user: user._id,
            booking: booking._id,
            type: 'earned'
        });

        if (!existingTxn) {
            user.loyaltyPoints += pointsEarned;
            user.totalSpent += booking.totalCost;

            if (user.totalSpent >= 50000) user.loyaltyTier = 'platinum';
            else if (user.totalSpent >= 25000) user.loyaltyTier = 'gold';
            else if (user.totalSpent >= 10000) user.loyaltyTier = 'silver';

            await user.save();
            await LoyaltyTransaction.create({
                user: user._id,
                type: 'earned',
                points: pointsEarned,
                booking: booking._id,
                description: `Earned ${pointsEarned} points for booking`
            });
        }

        // Trigger decoupled job queue for booking confirmation email
        if (!wasAlreadyCompleted) {
            // Populate vehicle if not already done
            if (!booking.populated('vehicle')) {
                await booking.populate('vehicle');
            }
            // Add email job to queueService
            await queueService.addEmailJob(booking, user);
        }
    }

    if (global.io) {
        const userId = booking.user?.toString();
        const stationId = booking.station?.toString();

        if (userId) {
            global.io.to(userId).emit('booking_confirmed', {
                bookingId: booking._id,
                message: 'Your payment is confirmed and booking is ready.'
            });
        }

        if (stationId) {
            global.io.to(`station_${stationId}`).emit('dashboard_refresh', {
                message: `Payment updated for booking ${booking._id}`,
                source
            });
        }

        global.io.to('super_admin_room').emit('dashboard_refresh', {
            message: `Payment updated for booking ${booking._id}`,
            source
        });
    }
}

export const createPaymentOrder = async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        const { bookingId } = req.body;
        
        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Calculate total including security deposit
        let totalAmount = booking.totalCost + (booking.securityDeposit?.amount || 0);
        
        // If it's an extension of an active booking, only charge the additional cost of the extension
        const isExtension = booking.status === 'active' && booking.modifications && booking.modifications.length > 0;
        if (isExtension) {
            const lastMod = booking.modifications[booking.modifications.length - 1];
            totalAmount = lastMod.additionalCost;
        }

        const options = {
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId,
                userId: req.user._id.toString(),
                vehicleModel: booking.vehicle.modelName,
                bookingCost: isExtension ? totalAmount : booking.totalCost,
                securityDeposit: isExtension ? 0 : (booking.securityDeposit?.amount || 0),
                isExtension: isExtension ? 'true' : 'false'
            }
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Payment order creation failed:', error);
        res.status(500).json({ message: 'Payment order creation failed' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            try {
                const booking = await Booking.findById(bookingId);
                if (!booking) {
                    await initiateRefund(razorpay_payment_id, 'Booking not found', bookingId);
                    return res.status(404).json({ message: 'Booking not found. Refund initiated.', success: false });
                }

                // Idempotency check: reject duplicate verify requests for the same payment
                if (booking.paymentId === razorpay_payment_id && booking.paymentStatus === 'completed') {
                    console.log(`Idempotent verify request for booking ${bookingId} with payment ${razorpay_payment_id}`);
                    return res.json({ 
                        message: 'Payment already verified for this booking.', 
                        success: true,
                        status: booking.paymentStatus
                    });
                }

                // Finalize immediately after signature verification so station dashboard updates instantly.
                await finalizeSuccessfulPayment(booking, razorpay_payment_id, 'verify');
                
                res.json({ 
                    message: 'Payment verified successfully. Booking is confirmed.', 
                    success: true,
                    status: 'completed'
                });
            } catch (bookingError) {
                console.error('Booking update failed after payment:', bookingError);
                await handleUnlinkedPayment(razorpay_payment_id, bookingId, bookingError.message);
                res.status(500).json({ message: 'Payment received but booking failed. Refund initiated.', success: false });
            }
        } else {
            res.status(400).json({ message: 'Invalid payment signature', success: false });
        }
    } catch (error) {
        console.error('Payment verification failed:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

// Issue #9: Webhook handler for Razorpay payment events
export const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const webhookSignature = req.headers['x-razorpay-signature'];
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(JSON.stringify(req.body || {}));
        const parsedBody = Buffer.isBuffer(req.body)
            ? JSON.parse(rawBody.toString('utf8'))
            : req.body;
        
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');
        
        if (webhookSignature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ message: 'Invalid signature' });
        }
        
        const event = parsedBody.event;
        const payload = parsedBody.payload?.payment?.entity;
        if (!event || !payload) {
            return res.status(400).json({ message: 'Invalid webhook payload' });
        }
        
        console.log(`Webhook received: ${event}`);
        
        // Handle different payment events
        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;
            case 'refund.processed':
                await handleRefundProcessed(payload);
                break;
            default:
                console.log(`Unhandled event: ${event}`);
        }
        
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

async function handlePaymentCaptured(payment) {
    const bookingId = payment.notes?.bookingId;
    if (!bookingId) {
        console.error('Payment captured without bookingId:', payment.id);
        return;
    }
    
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error(`Booking ${bookingId} not found for payment ${payment.id}`);
            await handleUnlinkedPayment(payment.id, bookingId, 'Booking not found');
            return;
        }
        
        await finalizeSuccessfulPayment(booking, payment.id, 'webhook');
        console.log(`✅ Webhook: Payment captured for booking ${bookingId}`);
    } catch (error) {
        console.error(`Failed to update booking ${bookingId} after payment capture:`, error);
        await handleUnlinkedPayment(payment.id, bookingId, error.message);
    }
}

async function handlePaymentFailed(payment) {
    const bookingId = payment.notes?.bookingId;
    if (!bookingId) return;
    
    const booking = await Booking.findById(bookingId);
    if (booking) {
        booking.paymentStatus = 'failed';
        booking.failureReason = payment.error_description || 'Payment failed from webhook';
        booking.failedAt = new Date();
        booking.status = 'cancelled';
        await booking.save();

        if (booking.vehicle) {
            await Vehicle.findByIdAndUpdate(booking.vehicle, {
                status: 'available',
                availableAfter: null
            });
        }

        if (global.io) {
            global.io.to(booking.user.toString()).emit('notification', {
                title: 'Payment Failed',
                message: 'Your payment failed and the booking was cancelled. Please retry booking.',
                type: 'payment',
                priority: 'high'
            });
        }

        console.log(`Payment failed for booking ${bookingId}`);
    }
}

async function handleRefundProcessed(refund) {
    const booking = await Booking.findOne({ 'refund.refundId': refund.id });
    if (booking) {
        booking.refund.status = 'completed';
        await booking.save();
        console.log(`Refund completed for booking ${booking._id}`);
    }
}

async function handleUnlinkedPayment(paymentId, bookingId, reason) {
    console.error(`Unlinked payment detected: ${paymentId} for booking ${bookingId}. Reason: ${reason}`);
    
    const booking = await Booking.findById(bookingId);
    if (booking) {
        booking.paymentStatus = 'unlinked';
        booking.paymentId = paymentId;
        booking.failureReason = reason;
        booking.failedAt = new Date();
        await booking.save();
    }
    
    // Retry booking update once
    try {
        if (booking && booking.paymentStatus === 'unlinked') {
            booking.paymentStatus = 'completed';
            booking.status = 'confirmed';
            await booking.save();
            console.log(`Retry successful for booking ${bookingId}`);
            return;
        }
    } catch (retryError) {
        console.error(`Retry failed for booking ${bookingId}:`, retryError);
    }
    
    // Initiate refund if retry fails
    await initiateRefund(paymentId, reason, bookingId);
}

async function initiateRefund(paymentId, reason, bookingId) {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        const refund = await razorpay.payments.refund(paymentId, {
            notes: { reason, bookingId }
        });
        
        const booking = await Booking.findById(bookingId);
        if (booking) {
            booking.refund = {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: 'processing',
                reason,
                initiatedAt: new Date()
            };
            booking.status = 'cancelled';
            await booking.save();
        }
        
        console.log(`Refund initiated: ${refund.id} for payment ${paymentId}`);
    } catch (error) {
        console.error(`Refund initiation failed for payment ${paymentId}:`, error);
    }
}