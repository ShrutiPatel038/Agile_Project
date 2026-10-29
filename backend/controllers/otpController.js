import User from '../models/User.js';
import crypto from 'crypto';

// In production, use a real SMS service like Twilio
const sendSMS = async (phone, message) => {
    // Placeholder for SMS service
    console.log(`SMS to ${phone}: ${message}`);
    return true;
};

export const sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        console.log('OTP request received for phone:', phone);
        console.log('User ID:', req.user._id);
        
        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        console.log('Generated OTP:', otp);
        
        // Update user with OTP
        await User.findByIdAndUpdate(req.user._id, {
            phoneOTP: otp,
            phoneOTPExpires: otpExpires
        });
        
        // Send SMS (in production, use real SMS service)
        await sendSMS(phone, `Your EV Rental verification code is: ${otp}. Valid for 10 minutes.`);
        
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Server Error sending OTP' });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { otp, phone } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.phoneOTP || user.phoneOTPExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or not found' });
        }
        
        if (user.phoneOTP !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        // Verify phone number
        user.phone = phone;
        user.isPhoneVerified = true;
        user.phoneOTP = undefined;
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
        res.json({
            isPhoneVerified: user.isPhoneVerified,
            phone: user.phone
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};