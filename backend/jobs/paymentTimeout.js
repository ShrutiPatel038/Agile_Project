import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';

export const startPaymentTimeoutJob = () => {
    // Run every minute to check for expired payments and send reminders
    cron.schedule('* * * * *', async () => {
        // Skip if MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping payment timeout job - MongoDB not connected');
            return;
        }
        
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes before expiry (Issue #31)
            
            // Send payment reminders (10 minutes before expiry)
            const expiringBookings = await Booking.find({
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentDeadline: { $gte: now, $lte: reminderTime },
                paymentReminderSent: { $ne: true }
            }).populate('vehicle user');
            
            for (const booking of expiringBookings) {
                if (global.io) {
                    global.io.to(booking.user._id.toString()).emit('notification', {
                        title: 'Payment Reminder',
                        message: `Only 10 minutes left to complete payment for your ${booking.vehicle.modelName} booking!`,
                        type: 'payment',
                        priority: 'urgent'
                    });
                }
                
                // Mark reminder as sent
                booking.paymentReminderSent = true;
                await booking.save();
                
                console.log(`Sent payment reminder for booking ${booking._id}`);
            }
            
            // Find confirmed bookings with expired payment deadlines
            const expiredBookings = await Booking.find({
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentDeadline: { $lt: now }
            }).populate('vehicle');

            for (const booking of expiredBookings) {
                // Cancel the booking
                booking.status = 'cancelled';
                booking.paymentStatus = 'failed';
                await booking.save();

                // Free up the vehicle
                await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
                    status: 'available',
                    availableAfter: null
                });

                // Notify user via socket if connected
                if (global.io) {
                    const timeAllowed = booking.paymentDeadline.getTime() - booking.updatedAt.getTime();
                    const timeText = timeAllowed > (60 * 60 * 1000) ? '2 hours' : '30 minutes'; // Updated to 30 minutes
                    
                    global.io.to(booking.user.toString()).emit('notification', {
                        title: 'Booking Cancelled',
                        message: `Your booking was cancelled due to payment timeout (${timeText}). Please book again and complete payment on time.`,
                        type: 'booking',
                        priority: 'high'
                    });
                }

                console.log(`Auto-cancelled booking ${booking._id} due to payment timeout`);
            }
        } catch (error) {
            if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
                console.error('⚠️ MongoDB connection issue in payment timeout job - will retry next cycle');
            } else {
                console.error('Payment timeout job error:', error.message);
            }
        }
    });

    console.log('Payment timeout job started - checking every minute');
};