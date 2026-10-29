import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Optional at sign-up (the register form has no phone field); set later through OTP verification.
    // sparse: many users may have no phone yet, but two users can't share one.
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'station-master','super-admin'], default: 'user' },
    station: { type : mongoose.Schema.Types.ObjectId, ref: 'Station', required: false},
    isPhoneVerified: { type: Boolean, default: false },
    phoneOTP: { type: String },
    phoneOTPExpires: { type: Date },
    // Driver's License Information 
    driverLicense: {
        number: { type: String, sparse: true },
        expiryDate: { type: Date },
        issuingCountry: { type: String },
        issuingState: { type: String },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        frontImageUrl: { type: String },
        backImageUrl: { type: String }
    },
    // Age verification
    dateOfBirth: { type: Date },
    // Security deposit tracking 
    securityDeposit: {
        amount: { type: Number, default: 0 },
        isHeld: { type: Boolean, default: false },
        heldAt: { type: Date },
        releaseScheduledAt: { type: Date },
        transactionId: { type: String }
    },
    // Loyalty program 
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    totalRides: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for performance 
// Removed duplicate indexes for email and phone (already defined as unique in schema)
userSchema.index({ role: 1, station: 1 });
userSchema.index({ loyaltyTier: 1 });
// Removed duplicate index for referralCode (already defined as unique in schema)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;