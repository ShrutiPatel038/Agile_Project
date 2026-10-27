import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    // phone is collected later via OTP verification (EVG-49); not required at registration
    phone:    { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['user', 'station-master', 'super-admin'], default: 'user' },
    station:  { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },

    isPhoneVerified: { type: Boolean, default: false },
    phoneOTP:        { type: String },
    phoneOTPExpires: { type: Date },

    driverLicense: {
      number:        { type: String, sparse: true },
      expiryDate:    { type: Date },
      issuingCountry:{ type: String },
      issuingState:  { type: String },
      isVerified:    { type: Boolean, default: false },
      verifiedAt:    { type: Date },
      frontImageUrl: { type: String },
      backImageUrl:  { type: String },
    },

    dateOfBirth: { type: Date },

    securityDeposit: {
      amount:             { type: Number, default: 0 },
      isHeld:             { type: Boolean, default: false },
      heldAt:             { type: Date },
      releaseScheduledAt: { type: Date },
      transactionId:      { type: String },
    },

    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier:   { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    totalRides:    { type: Number, default: 0 },
    totalSpent:    { type: Number, default: 0 },
    referralCode:  { type: String, unique: true, sparse: true },
    referredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, station: 1 });
userSchema.index({ loyaltyTier: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
