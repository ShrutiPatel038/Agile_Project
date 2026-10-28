import mongoose from 'mongoose';

// Full loyalty schema added in Commit 32 (EVG-45). This stub lets
// paymentController create earned-points records without a migration.
const loyaltyTransactionSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:        { type: String, enum: ['earned', 'redeemed', 'expired', 'bonus'], required: true },
    points:      { type: Number, required: true },
    booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    description: { type: String },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ user: 1, type: 1 });

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
export default LoyaltyTransaction;
