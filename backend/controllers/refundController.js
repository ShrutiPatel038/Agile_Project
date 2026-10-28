import Razorpay from 'razorpay';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

const getRazorpay = () =>
  new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

export const requestRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const booking = await Booking.findById(bookingId).populate('vehicle');

    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (!['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Refund only available for cancelled or completed bookings' });
    }
    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'No payment to refund' });
    }
    if (booking.refund.status !== 'none') {
      return res.status(400).json({ message: `Refund already ${booking.refund.status}` });
    }

    let refundAmount = 0;
    if (booking.status === 'cancelled') {
      const hoursUntilStart = (new Date(booking.startTime) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilStart > 24)      refundAmount = booking.totalCost;
      else if (hoursUntilStart > 12) refundAmount = booking.totalCost * 0.75;
      else if (hoursUntilStart > 6)  refundAmount = booking.totalCost * 0.5;
      else                            refundAmount = booking.totalCost * 0.25;

      if (booking.securityDeposit?.amount && booking.securityDeposit?.status === 'held') {
        refundAmount += booking.securityDeposit.amount;
      }
    } else if (booking.status === 'completed') {
      if (booking.securityDeposit?.amount && booking.securityDeposit?.status === 'held' && !booking.securityDeposit?.deductedAmount) {
        refundAmount = booking.securityDeposit.amount;
      }
    }

    if (refundAmount <= 0) {
      return res.status(400).json({ message: 'No refund amount applicable' });
    }

    booking.refund.status = 'pending';
    booking.refund.amount = refundAmount;
    booking.refund.reason = reason;
    booking.refund.requestedAt = new Date();
    booking.refund.refundMethod = 'original';
    await booking.save();

    logger.info('Refund requested', { bookingId, refundAmount });
    res.json({ message: 'Refund request submitted successfully', refundAmount, estimatedProcessingDays: '7-10 business days' });
  } catch (error) {
    logger.error('Error requesting refund', { message: error.message });
    res.status(500).json({ message: 'Server Error processing refund request' });
  }
};

export const processRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approve } = req.body;

    if (!['station-master', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.refund.status !== 'pending') {
      return res.status(404).json({ message: 'No pending refund found' });
    }

    if (approve) {
      try {
        const refund = await getRazorpay().payments.refund(booking.paymentId, {
          amount: Math.round(booking.refund.amount * 100),
          speed: 'normal',
          notes: { bookingId, reason: booking.refund.reason },
        });

        booking.refund.status = 'processing';
        booking.refund.refundId = refund.id;
        booking.refund.processedAt = new Date();

        if (booking.securityDeposit?.status === 'held') {
          booking.securityDeposit.status = 'released';
          booking.securityDeposit.releasedAt = new Date();
        }
        await booking.save();
        logger.info('Refund processing', { bookingId, refundId: refund.id });
        res.json({ message: 'Refund processed successfully', refundId: refund.id, status: 'processing' });
      } catch (razorpayError) {
        logger.error('Razorpay refund error', { message: razorpayError.message });
        booking.refund.status = 'failed';
        await booking.save();
        res.status(500).json({ message: 'Refund processing failed' });
      }
    } else {
      booking.refund.status = 'none';
      booking.refund.amount = 0;
      await booking.save();
      res.json({ message: 'Refund request rejected' });
    }
  } catch (error) {
    logger.error('Error processing refund', { message: error.message });
    res.status(500).json({ message: 'Server Error processing refund' });
  }
};

export const getRefundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      refundStatus: booking.refund.status,
      refundAmount: booking.refund.amount,
      requestedAt: booking.refund.requestedAt,
      processedAt: booking.refund.processedAt,
      refundId: booking.refund.refundId,
    });
  } catch (error) {
    logger.error('Error fetching refund status', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching refund status' });
  }
};
