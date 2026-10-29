import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';
import { createNotificationUtil } from '../controllers/notificationController.js';
import { calculateAndCacheSystemAnalytics } from '../controllers/superAdminController.js';

export const startCronJobs = () => {
    // Check for stuck processing payments every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping stuck payment job - MongoDB not connected');
            return;
        }
        
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            // Find payments stuck in processing for 5+ minutes
            const stuckPayments = await Booking.find({
                paymentStatus: 'processing',
                updatedAt: { $lt: fiveMinutesAgo }
            });
            
            for (const booking of stuckPayments) {
                console.log(`Found stuck payment for booking ${booking._id}`);

                // Keep payment in processing until Razorpay webhook confirms success/failure.
                // This avoids false failures when webhook delivery is delayed.
                if (global.io) {
                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Payment Under Verification',
                        message: 'Your payment is still being verified. Your booking will update automatically once confirmed.',
                        type: 'payment',
                        priority: 'medium'
                    });
                }
            }
            
            console.log(`Processed ${stuckPayments.length} stuck payments`);
        } catch (error) {
            console.error('Error in stuck payment job:', error.message);
        }
    });

    // Check for unlinked payments every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping unlinked payment job - MongoDB not connected');
            return;
        }
        
        try {
            const unlinkedPayments = await Booking.find({
                paymentStatus: 'unlinked',
                failedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Failed 5+ min ago
            });
            
            for (const booking of unlinkedPayments) {
                console.log(`Processing unlinked payment for booking ${booking._id}`);
                // Refund will be handled by handleUnlinkedPayment in paymentController
            }
            
            console.log(`Processed ${unlinkedPayments.length} unlinked payments`);
        } catch (error) {
            console.error('Error in unlinked payment job:', error.message);
        }
    });

    // Cache warming for Super Admin Analytics - runs every 3 hours
    cron.schedule('0 */3 * * *', async () => {
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping analytics cache warming - MongoDB not connected');
            return;
        }

        try {
            console.log('🔄 Cron: Recalculating and warming Super Admin Analytics cache...');
            await calculateAndCacheSystemAnalytics();
            console.log('✅ Cron: Super Admin Analytics cache warmed successfully.');
        } catch (error) {
            console.error('Error warming analytics cache:', error.message);
        }
    });

    // Warm the analytics cache immediately on startup asynchronously
    setTimeout(async () => {
        if (mongoose.connection.readyState === 1) {
            try {
                console.log('🔄 Startup: Warming Super Admin Analytics cache...');
                await calculateAndCacheSystemAnalytics();
                console.log('✅ Startup: Super Admin Analytics cache warmed successfully.');
            } catch (error) {
                console.warn('⚠️ Startup: Failed to warm analytics cache.', error.message);
            }
        }
    }, 5000); // Wait 5 seconds to let connections stabilize
    
    console.log('Cron jobs started');
};
