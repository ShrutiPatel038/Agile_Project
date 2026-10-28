import express from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook is mounted separately in server.js with express.raw() before express.json()
router.post('/create-order', protectRoute, createPaymentOrder);
router.post('/verify', protectRoute, verifyPayment);

export default router;
