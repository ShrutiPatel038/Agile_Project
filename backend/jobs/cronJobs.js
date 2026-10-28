import cron from 'node-cron';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import { calculateAndCacheSystemAnalytics } from '../controllers/superAdminController.js';
import logger from '../utils/logger.js';

export const startCronJobs = () => {
  // Notify users with stuck processing payments every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const stuckPayments  = await Booking.find({ paymentStatus: 'processing', updatedAt: { $lt: fiveMinutesAgo } });
      for (const booking of stuckPayments) {
        if (global.io) global.io.to(booking.user.toString()).emit('notification', { title: 'Payment Under Verification', message: 'Your payment is still being verified. Your booking will update automatically once confirmed.', type: 'payment', priority: 'medium' });
      }
      if (stuckPayments.length) logger.info('Cron: stuck payments notified', { count: stuckPayments.length });
    } catch (error) {
      logger.error('Cron: stuck payment job error', { message: error.message });
    }
  });

  // Cancel expired unpaid bookings every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const expired = await Booking.find({ status: { $in: ['pending-confirmation', 'confirmed'] }, paymentStatus: { $ne: 'completed' }, paymentDeadline: { $lt: new Date() } });
      for (const booking of expired) {
        booking.status = 'cancelled';
        booking.paymentStatus = 'failed';
        booking.failureReason = 'Cron watchdog: payment deadline passed.';
        booking.failedAt = new Date();
        await booking.save();
        if (booking.vehicle) await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available', availableAfter: null });
        if (global.io) global.io.to(booking.user.toString()).emit('notification', { title: 'Booking Expired', message: 'Your booking was cancelled because payment was not completed in time.', type: 'booking', priority: 'high' });
      }
      if (expired.length) logger.info('Cron: expired bookings cancelled', { count: expired.length });
    } catch (error) {
      logger.error('Cron: expired booking watchdog error', { message: error.message });
    }
  });

  // Warm analytics cache every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      await calculateAndCacheSystemAnalytics();
      logger.info('Cron: analytics cache warmed');
    } catch (error) {
      logger.error('Cron: analytics cache warming error', { message: error.message });
    }
  });

  // Warm analytics cache 5s after startup
  setTimeout(async () => {
    if (mongoose.connection.readyState === 1) {
      try { await calculateAndCacheSystemAnalytics(); logger.info('Startup: analytics cache warmed'); }
      catch (error) { logger.warn('Startup: analytics cache warm failed', { message: error.message }); }
    }
  }, 5000);

  logger.info('Cron jobs started');
};
