import express from 'express';
import { 
    getLoyaltyProfile, 
    getLoyaltyTransactions, 
    redeemPoints,
    getReferralCode,
    applyReferralCode
} from '../controllers/loyaltyController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.get('/profile', protectRoute, getLoyaltyProfile);
router.get('/transactions', protectRoute, getLoyaltyTransactions);
router.post('/redeem', protectRoute, redeemPoints);
router.get('/referral-code', protectRoute, getReferralCode);
router.post('/apply-referral', protectRoute, applyReferralCode);

export default router;
