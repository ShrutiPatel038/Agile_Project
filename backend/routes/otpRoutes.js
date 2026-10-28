import express from 'express';
import { sendOTP, verifyOTP, checkVerificationStatus } from '../controllers/otpController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);
router.post('/send', sendOTP);
router.post('/verify', verifyOTP);
router.get('/status', checkVerificationStatus);

export default router;
