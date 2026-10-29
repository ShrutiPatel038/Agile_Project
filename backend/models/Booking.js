import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    originalEndTime: { type: Date }, // Track original booking time
    totalCost: { type: Number, required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    status: { type: String, enum: [ 'confirmed', 'active', 'completed', 'cancelled','pending-confirmation'], default: 'pending-confirmation' },
    paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'unlinked'], default: 'pending' },
    paymentId: { type: String },
    paymentDeadline: { type: Date },
    confirmationDeadline: { type: Date },
    paymentReminderSent: { type: Boolean, default: false },
    failureReason: { type: String },
    failedAt: { type: Date },
    // Security deposit
    securityDeposit: {
        amount: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'held', 'released', 'deducted'], default: 'pending' },
        heldAt: { type: Date },
        releasedAt: { type: Date },
        deductedAmount: { type: Number, default: 0 },
        deductionReason: { type: String },
        transactionId: { type: String }
    },
    // Overtime charges
    overtimeCharges: {
        isOvertime: { type: Boolean, default: false },
        overtimeHours: { type: Number, default: 0 },
        overtimeCost: { type: Number, default: 0 },
        overtimeRate: { type: Number }, // Rate per hour for overtime
        gracePeriodMinutes: { type: Number, default: 15 }, // Grace period before overtime kicks in
        lastCalculatedAt: { type: Date }
    },
    // Refund tracking
    refund: {
        status: { type: String, enum: ['none', 'pending', 'processing', 'completed', 'failed'], default: 'none' },
        amount: { type: Number, default: 0 },
        reason: { type: String },
        requestedAt: { type: Date },
        processedAt: { type: Date },
        refundId: { type: String },
        refundMethod: { type: String, enum: ['original', 'wallet', 'bank'], default: 'original' },
        initiatedAt: { type: Date }
    },
    // Return location
    returnStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    oneWayFee: { type: Number, default: 0 },
    modifications: [{
        type: { type: String, enum: ['extend', 'shorten'] },
        oldEndTime: Date,
        newEndTime: Date,
        additionalCost: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    emergencyContacts: [{
        name: String,
        phone: String,
        relation: String
    }]
}, { timestamps: true });

// Indexes for performance
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ vehicle: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ station: 1, status: 1 });
bookingSchema.index({ status: 1, paymentDeadline: 1 });
bookingSchema.index({ status: 1, confirmationDeadline: 1 });
bookingSchema.index({ status: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;