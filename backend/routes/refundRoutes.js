import express from 'express';
import { requestRefund, processRefund, getRefundStatus } from '../controllers/refundController.js';
import { protectRoute, stationMaster } from '../middleware/protectRoute.js';

const router = express.Router();

// User requests refund
router.post('/request', protectRoute, requestRefund);

// Get refund status for a booking
router.get('/status/:bookingId', protectRoute, getRefundStatus);

// Station master/super admin processes refund
router.post('/process/:bookingId', protectRoute, stationMaster, processRefund);

export default router;
