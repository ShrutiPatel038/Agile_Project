import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import logger from '../utils/logger.js';

// Lazy imports for Sprint 3 additions wired in later commits
let queueService = null;
const getQueue = async () => {
  if (!queueService) {
    try { ({ queueService } = await import('../services/queueService.js')); } catch { /* not yet wired */ }
  }
  return queueService;
};

const getRazorpay = () =>
  new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

async function finalizeSuccessfulPayment(booking, paymentId, source = 'verify') {
  if (!booking) return;

  const wasAlreadyCompleted = booking.paymentStatus === 'completed';

  if (!wasAlreadyCompleted) {
    booking.paymentStatus = 'completed';
    booking.paymentId = paymentId;
    if (booking.status !== 'active') booking.status = 'confirmed';
    if (booking.securityDeposit?.amount > 0) {
      booking.securityDeposit.status = 'held';
      booking.securityDeposit.heldAt = new Date();
      booking.securityDeposit.transactionId = paymentId;
    }
    await booking.save();

    const qs = await getQueue();
    if (qs) await qs.cancelPaymentTimeoutJob(booking._id.toString());

    logger.info('Payment finalized', { bookingId: booking._id, paymentId, source });
  }

  // Award loyalty points (idempotent — skip if transaction already exists)
  const user = await User.findById(booking.user);
  if (user) {
    const pointsEarned = Math.floor(booking.totalCost / 100);
    const existing = await LoyaltyTransaction.findOne({ user: user._id, booking: booking._id, type: 'earned' });
    if (!existing) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
      user.totalSpent   = (user.totalSpent   || 0) + booking.totalCost;
      if (user.totalSpent >= 50000) user.loyaltyTier = 'platinum';
      else if (user.totalSpent >= 25000) user.loyaltyTier = 'gold';
      else if (user.totalSpent >= 10000) user.loyaltyTier = 'silver';
      await user.save();
      await LoyaltyTransaction.create({ user: user._id, type: 'earned', points: pointsEarned, booking: booking._id, description: `Earned ${pointsEarned} points for booking` });
    }

    if (!wasAlreadyCompleted) {
      const qs = await getQueue();
      if (qs) {
        if (!booking.populated('vehicle')) await booking.populate('vehicle');
        await qs.addEmailJob(booking, user);
      }
    }
  }

  // Real-time notifications (global.io set when Socket.IO wired in Commit 26)
  if (global.io) {
    const userId    = booking.user?.toString();
    const stationId = booking.station?.toString();
    if (userId)    global.io.to(userId).emit('booking_confirmed', { bookingId: booking._id, message: 'Your payment is confirmed and booking is ready.' });
    if (stationId) global.io.to(`station_${stationId}`).emit('dashboard_refresh', { message: `Payment updated for booking ${booking._id}`, source });
    global.io.to('super_admin_room').emit('dashboard_refresh', { message: `Payment updated for booking ${booking._id}`, source });
  }
}

export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('vehicle');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isExtension = booking.status === 'active' && booking.modifications?.length > 0;
    let totalAmount = isExtension
      ? booking.modifications[booking.modifications.length - 1].additionalCost
      : booking.totalCost + (booking.securityDeposit?.amount || 0);

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: { bookingId, userId: req.user._id.toString(), vehicleModel: booking.vehicle.modelName, bookingCost: isExtension ? totalAmount : booking.totalCost, securityDeposit: isExtension ? 0 : (booking.securityDeposit?.amount || 0), isExtension: isExtension ? 'true' : 'false' },
    };

    const order = await getRazorpay().orders.create(options);
    logger.info('Payment order created', { bookingId, orderId: order.id, amount: order.amount });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    logger.error('Payment order creation failed', { message: error.message });
    res.status(500).json({ message: 'Payment order creation failed' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

    if (razorpay_signature !== expected) {
      return res.status(400).json({ message: 'Invalid payment signature', success: false });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      await initiateRefund(razorpay_payment_id, 'Booking not found', bookingId);
      return res.status(404).json({ message: 'Booking not found. Refund initiated.', success: false });
    }

    // Idempotency: same paymentId already verified
    if (booking.paymentId === razorpay_payment_id && booking.paymentStatus === 'completed') {
      logger.info('Idempotent verify request', { bookingId, paymentId: razorpay_payment_id });
      return res.json({ message: 'Payment already verified.', success: true, status: booking.paymentStatus });
    }

    await finalizeSuccessfulPayment(booking, razorpay_payment_id, 'verify');
    res.json({ message: 'Payment verified successfully. Booking is confirmed.', success: true, status: 'completed' });
  } catch (error) {
    logger.error('Payment verification failed', { message: error.message });
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

export const handlePaymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const sig = req.headers['x-razorpay-signature'];

    // req.body is raw Buffer when express.raw() is used for this route
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const parsed  = Buffer.isBuffer(req.body) ? JSON.parse(rawBody.toString('utf8')) : req.body;

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (sig !== expected) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event   = parsed.event;
    const payload = parsed.payload?.payment?.entity;
    if (!event || !payload) return res.status(400).json({ message: 'Invalid webhook payload' });

    logger.info('Webhook received', { event });

    switch (event) {
      case 'payment.captured': await handlePaymentCaptured(payload); break;
      case 'payment.failed':   await handlePaymentFailed(payload);   break;
      case 'refund.processed': await handleRefundProcessed(payload); break;
      default: logger.debug('Unhandled webhook event', { event });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook processing error', { message: error.message });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

async function handlePaymentCaptured(payment) {
  const bookingId = payment.notes?.bookingId;
  if (!bookingId) { logger.error('Payment captured without bookingId', { paymentId: payment.id }); return; }
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) { await handleUnlinkedPayment(payment.id, bookingId, 'Booking not found'); return; }
    await finalizeSuccessfulPayment(booking, payment.id, 'webhook');
    logger.info('Webhook: payment captured', { bookingId });
  } catch (error) {
    logger.error('Failed to update booking after payment capture', { bookingId, message: error.message });
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
    if (booking.vehicle) await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available', availableAfter: null });
    if (global.io) global.io.to(booking.user.toString()).emit('notification', { title: 'Payment Failed', message: 'Your payment failed and the booking was cancelled.', type: 'payment', priority: 'high' });
    logger.info('Payment failed webhook processed', { bookingId });
  }
}

async function handleRefundProcessed(refund) {
  const booking = await Booking.findOne({ 'refund.refundId': refund.id });
  if (booking) { booking.refund.status = 'completed'; await booking.save(); logger.info('Refund completed via webhook', { refundId: refund.id }); }
}

async function handleUnlinkedPayment(paymentId, bookingId, reason) {
  logger.warn('Unlinked payment detected', { paymentId, bookingId, reason });
  const booking = await Booking.findById(bookingId);
  if (booking) {
    booking.paymentStatus = 'unlinked';
    booking.paymentId = paymentId;
    booking.failureReason = reason;
    booking.failedAt = new Date();
    await booking.save();

    // Single retry
    try {
      booking.paymentStatus = 'completed';
      booking.status = 'confirmed';
      await booking.save();
      logger.info('Unlinked payment recovery succeeded', { bookingId });
      return;
    } catch (retryError) {
      logger.error('Unlinked payment retry failed', { bookingId, message: retryError.message });
    }
  }
  await initiateRefund(paymentId, reason, bookingId);
}

async function initiateRefund(paymentId, reason, bookingId) {
  try {
    const refund = await getRazorpay().payments.refund(paymentId, { notes: { reason, bookingId } });
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.refund = { refundId: refund.id, amount: refund.amount / 100, status: 'processing', reason, initiatedAt: new Date() };
      booking.status = 'cancelled';
      await booking.save();
    }
    logger.info('Refund initiated', { refundId: refund.id, paymentId });
  } catch (error) {
    logger.error('Refund initiation failed', { paymentId, message: error.message });
  }
}
