import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { createPaymentOrder, verifyPayment, handlePaymentWebhook } from '../controllers/paymentController.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create-order', protectRoute, paymentLimiter, createPaymentOrder);
router.post('/verify', protectRoute, paymentLimiter, verifyPayment);

// Webhook endpoint (no auth required - verified by signature)
router.post('/webhook', handlePaymentWebhook);

export default router;