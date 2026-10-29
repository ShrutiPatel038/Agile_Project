import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import logger from '../utils/logger.js';

/**
 * Processes a payment timeout for one booking.
 *
 * How it works:
 *  - When a booking is confirmed, queueService schedules a timer
 *    to fire at the exact paymentDeadline.
 *  - At that moment this checks if payment is still pending → cancels booking + frees vehicle.
 *  - If payment was already completed → skips safely (idempotent).
 */
export const processPaymentTimeout = async (bookingId) => {
    logger.info('Payment timeout: processing booking', { bookingId });

    // Re-fetch fresh booking state from DB
    const booking = await Booking.findById(bookingId).populate('vehicle');

    if (!booking) {
        logger.info('Payment timeout: booking not found, skipping', { bookingId });
        return;
    }

    // Idempotency check: if payment was already completed, do nothing
    if (booking.paymentStatus === 'completed') {
        logger.info('Payment timeout: booking already paid, no action', { bookingId });
        return;
    }

    // If booking is already cancelled for another reason, skip
    if (booking.status === 'cancelled') {
        logger.info('Payment timeout: booking already cancelled, skipping', { bookingId });
        return;
    }

    // Cancel the booking due to payment timeout
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';
    booking.failureReason = 'Payment timeout - user did not complete payment within the deadline.';
    booking.failedAt = new Date();
    await booking.save();

    // Free up the vehicle
    if (booking.vehicle) {
        await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
            status: 'available',
            availableAfter: null
        });
    }

    // Notify user via Socket.IO if connected
    if (global.io) {
        const timeAllowed = booking.paymentDeadline
            ? booking.paymentDeadline.getTime() - booking.createdAt.getTime()
            : null;
        const timeText = timeAllowed && timeAllowed > 60 * 60 * 1000 ? '2 hours' : '30 minutes';

        global.io.to(booking.user.toString()).emit('notification', {
            title: 'Booking Cancelled - Payment Timeout',
            message: `Your booking was automatically cancelled as payment was not completed within ${timeText}. Please book again.`,
            type: 'booking',
            priority: 'high'
        });

        // Notify station dashboard to refresh
        if (booking.station) {
            global.io.to(`station_${booking.station.toString()}`).emit('dashboard_refresh', {
                message: `Booking ${bookingId} auto-cancelled due to payment timeout.`
            });
        }
    }

    logger.info('Booking cancelled: payment timeout', { bookingId });
};

export const startPaymentTimeoutWorker = () => {
    logger.info('Payment timeout worker ready (in-process timers)');
};
