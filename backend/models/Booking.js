import mongoose from 'mongoose';

// Full schema added in Commit 19 (EVG-33). This stub provides the fields
// needed by the public vehicles availability query (EVG-28).
const bookingSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    status: {
      type: String,
      enum: ['pending-confirmation', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'pending-confirmation',
    },
    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ vehicle: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ station: 1, status: 1, startTime: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
