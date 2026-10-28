import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    returnStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    startTime:     { type: Date, required: true },
    endTime:       { type: Date, required: true },
    originalEndTime: { type: Date },
    totalCost:     { type: Number, required: true },
    oneWayFee:     { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending-confirmation', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'pending-confirmation',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'unlinked'],
      default: 'pending',
    },
    paymentId:            { type: String },
    paymentDeadline:      { type: Date },
    confirmationDeadline: { type: Date },
    paymentReminderSent:  { type: Boolean, default: false },
    failureReason: { type: String },
    failedAt:      { type: Date },

    securityDeposit: {
      amount:          { type: Number, default: 0 },
      status:          { type: String, enum: ['pending', 'held', 'released', 'deducted'], default: 'pending' },
      heldAt:          { type: Date },
      releasedAt:      { type: Date },
      deductedAmount:  { type: Number, default: 0 },
      deductionReason: { type: String },
      transactionId:   { type: String },
    },

    overtimeCharges: {
      isOvertime:          { type: Boolean, default: false },
      overtimeHours:       { type: Number, default: 0 },
      overtimeCost:        { type: Number, default: 0 },
      overtimeRate:        { type: Number },
      gracePeriodMinutes:  { type: Number, default: 15 },
      lastCalculatedAt:    { type: Date },
    },

    refund: {
      status:       { type: String, enum: ['none', 'pending', 'processing', 'completed', 'failed'], default: 'none' },
      amount:       { type: Number, default: 0 },
      reason:       { type: String },
      requestedAt:  { type: Date },
      processedAt:  { type: Date },
      refundId:     { type: String },
      refundMethod: { type: String, enum: ['original', 'wallet', 'bank'], default: 'original' },
      initiatedAt:  { type: Date },
    },

    modifications: [{
      type:           { type: String, enum: ['extend', 'shorten'] },
      oldEndTime:     Date,
      newEndTime:     Date,
      additionalCost: Number,
      timestamp:      { type: Date, default: Date.now },
    }],

    emergencyContacts: [{ name: String, phone: String, relation: String }],
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ vehicle: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ station: 1, status: 1 });
bookingSchema.index({ status: 1, paymentDeadline: 1 });
bookingSchema.index({ status: 1, confirmationDeadline: 1 });
bookingSchema.index({ status: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
