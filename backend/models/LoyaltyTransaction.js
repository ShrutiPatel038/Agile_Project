import mongoose from 'mongoose';

// Loyalty transaction history (Issue #33)
const loyaltyTransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral'], 
        required: true 
    },
    points: { type: Number, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    description: { type: String, required: true },
    expiresAt: { type: Date },
    isExpired: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes
loyaltyTransactionSchema.index({ user: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ expiresAt: 1, isExpired: 1 });

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
export default LoyaltyTransaction;
