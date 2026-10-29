import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Razorpay from 'razorpay';

// Issue #7: Refund system implementation

export const requestRefund = async (req, res) => {
    try {
        const { bookingId, reason } = req.body;
        
        const booking = await Booking.findById(bookingId).populate('vehicle');
        
        // Validate booking ownership
        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Only cancelled or completed bookings can have refunds
        if (!['cancelled', 'completed'].includes(booking.status)) {
            return res.status(400).json({ message: 'Refund only available for cancelled or completed bookings' });
        }
        
        // Check if payment was completed
        if (booking.paymentStatus !== 'completed') {
            return res.status(400).json({ message: 'No payment to refund' });
        }
        
        // Check if refund already processed
        if (booking.refund.status !== 'none') {
            return res.status(400).json({ message: `Refund already ${booking.refund.status}` });
        }
        
        // Calculate refund amount based on booking status
        let refundAmount = 0;
        
        if (booking.status === 'cancelled') {
            const now = new Date();
            const startTime = new Date(booking.startTime);
            const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
            
            // Refund policy: 
            // - >24 hours: 100% refund
            // - 12-24 hours: 75% refund
            // - 6-12 hours: 50% refund
            // - <6 hours: 25% refund
            if (hoursUntilStart > 24) {
                refundAmount = booking.totalCost;
            } else if (hoursUntilStart > 12) {
                refundAmount = booking.totalCost * 0.75;
            } else if (hoursUntilStart > 6) {
                refundAmount = booking.totalCost * 0.5;
            } else {
                refundAmount = booking.totalCost * 0.25;
            }
            
            // Always refund security deposit for cancelled bookings
            if (booking.securityDeposit?.amount && booking.securityDeposit?.status === 'held') {
                refundAmount += booking.securityDeposit.amount;
            }
        } else if (booking.status === 'completed') {
            // For completed bookings, only refund security deposit if not deducted
            if (booking.securityDeposit?.amount && 
                booking.securityDeposit?.status === 'held' &&
                !booking.securityDeposit?.deductedAmount) {
                refundAmount = booking.securityDeposit.amount;
            }
        }
        
        if (refundAmount <= 0) {
            return res.status(400).json({ message: 'No refund amount applicable' });
        }
        
        // Update booking with refund request
        booking.refund.status = 'pending';
        booking.refund.amount = refundAmount;
        booking.refund.reason = reason;
        booking.refund.requestedAt = new Date();
        booking.refund.refundMethod = 'original'; // Refund to original payment method
        
        await booking.save();
        
        res.json({ 
            message: 'Refund request submitted successfully',
            refundAmount,
            estimatedProcessingDays: '7-10 business days'
        });
    } catch (error) {
        console.error('Error requesting refund:', error);
        res.status(500).json({ message: 'Server Error processing refund request' });
    }
};

export const processRefund = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { approve } = req.body; // true to approve, false to reject
        
        // Only station master or super admin can process refunds
        if (!['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const booking = await Booking.findById(bookingId);
        
        if (!booking || booking.refund.status !== 'pending') {
            return res.status(404).json({ message: 'No pending refund found' });
        }
        
        if (approve) {
            // Initialize Razorpay (for refund processing)
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            
            try {
                // Process refund through Razorpay
                const refund = await razorpay.payments.refund(booking.paymentId, {
                    amount: Math.round(booking.refund.amount * 100), // Convert to paise
                    speed: 'normal', // Can be 'normal' or 'optimum'
                    notes: {
                        bookingId: bookingId,
                        reason: booking.refund.reason
                    }
                });
                
                booking.refund.status = 'processing';
                booking.refund.refundId = refund.id;
                booking.refund.processedAt = new Date();
                
                // Update security deposit if it was part of refund
                if (booking.securityDeposit?.status === 'held') {
                    booking.securityDeposit.status = 'released';
                    booking.securityDeposit.releasedAt = new Date();
                }
                
                await booking.save();
                
                res.json({ 
                    message: 'Refund processed successfully',
                    refundId: refund.id,
                    status: 'processing'
                });
            } catch (razorpayError) {
                console.error('Razorpay refund error:', razorpayError);
                booking.refund.status = 'failed';
                await booking.save();
                res.status(500).json({ message: 'Refund processing failed' });
            }
        } else {
            // Reject refund
            booking.refund.status = 'none';
            booking.refund.amount = 0;
            await booking.save();
            res.json({ message: 'Refund request rejected' });
        }
    } catch (error) {
        console.error('Error processing refund:', error);
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
            refundId: booking.refund.refundId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching refund status' });
    }
};
