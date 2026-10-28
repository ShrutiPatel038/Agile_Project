import express from 'express';
import { getLoyaltyProfile, getLoyaltyTransactions, redeemPoints, getReferralCode, applyReferralCode } from '../controllers/loyaltyController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);
router.get('/profile', getLoyaltyProfile);
router.get('/transactions', getLoyaltyTransactions);
router.post('/redeem', redeemPoints);
router.get('/referral-code', getReferralCode);
router.post('/apply-referral', applyReferralCode);

export default router;
