import express from 'express';
import { requestRefund, processRefund, getRefundStatus } from '../controllers/refundController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', protectRoute, requestRefund);
router.put('/:bookingId/process', protectRoute, processRefund);
router.get('/:bookingId/status', protectRoute, getRefundStatus);

export default router;
