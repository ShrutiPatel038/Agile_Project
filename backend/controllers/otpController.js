import crypto from 'crypto';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const sendSMS = async (phone, message) => {
  // Stub — replace with Twilio or similar in production
  logger.info('SMS (stub)', { phone, message });
  return true;
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    const otp        = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(req.user._id, { phoneOTP: otp, phoneOTPExpires: otpExpires });
    await sendSMS(phone, `Your EV-Go verification code is: ${otp}. Valid for 10 minutes.`);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    logger.error('Error sending OTP', { message: error.message });
    res.status(500).json({ message: 'Server Error sending OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phoneOTP || user.phoneOTPExpires < new Date()) return res.status(400).json({ message: 'OTP expired or not found' });
    if (user.phoneOTP !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    user.phone = phone;
    user.isPhoneVerified = true;
    user.phoneOTP        = undefined;
    user.phoneOTPExpires = undefined;
    await user.save();
    res.json({ message: 'Phone number verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error verifying OTP' });
  }
};

export const checkVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isPhoneVerified phone');
    res.json({ isPhoneVerified: user.isPhoneVerified, phone: user.phone });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
