import { Worker } from 'bullmq';
import Redis from 'ioredis';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const startPaymentTimeoutWorker = () => {
  let connection;
  try {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 2) { logger.warn('Redis unavailable for Payment Timeout Worker.'); return null; }
        return 1000;
      },
    });

    connection.on('error', () => {});
    connection.on('connect', () => {
      const worker = new Worker('paymentTimeout', async (job) => {
        const { bookingId } = job.data;
        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking)                              { logger.info('Payment timeout: booking not found', { bookingId }); return; }
        if (booking.paymentStatus === 'completed') { logger.info('Payment timeout: already paid, skipping', { bookingId }); return; }
        if (booking.status === 'cancelled')        { logger.info('Payment timeout: already cancelled', { bookingId }); return; }

        booking.status = 'cancelled';
        booking.paymentStatus = 'failed';
        booking.failureReason = 'Payment timeout — user did not complete payment within the deadline.';
        booking.failedAt = new Date();
        await booking.save();

        if (booking.vehicle) await Vehicle.findByIdAndUpdate(booking.vehicle._id, { status: 'available', availableAfter: null });

        if (global.io) {
          const timeText = booking.paymentDeadline &&
            booking.paymentDeadline.getTime() - booking.createdAt.getTime() > 60 * 60 * 1000
              ? '2 hours' : '30 minutes';
          global.io.to(booking.user.toString()).emit('notification', { title: 'Booking Cancelled — Payment Timeout', message: `Your booking was automatically cancelled as payment was not completed within ${timeText}.`, type: 'booking', priority: 'high' });
          if (booking.station) global.io.to(`station_${booking.station.toString()}`).emit('dashboard_refresh', { message: `Booking ${bookingId} auto-cancelled due to payment timeout.` });
        }

        logger.info('Payment timeout: booking cancelled', { bookingId });
      }, { connection, concurrency: 5 });

      worker.on('completed', (job) => logger.info('Payment timeout job completed', { jobId: job.id }));
      worker.on('failed', (job, err) => logger.error('Payment timeout job failed', { jobId: job?.id, message: err.message }));
      logger.info('Payment timeout worker listening to "paymentTimeout" queue');
    });
  } catch (error) {
    logger.warn('Failed to init Payment Timeout Worker', { message: error.message });
  }
};
