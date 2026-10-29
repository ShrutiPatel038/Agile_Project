import express from 'express';
import { 
    createTicket, 
    getMyTickets, 
    getTicketById, 
    addMessageToTicket, 
    updateTicketStatus, 
    escalateTicket, 
    rateTicket,
    getAllTickets 
} from '../controllers/supportController.js';
import { protectRoute, stationMaster } from '../middleware/protectRoute.js';

const router = express.Router();

// User endpoints
router.post('/create', protectRoute, createTicket);
router.get('/my-tickets', protectRoute, getMyTickets);
router.get('/:ticketId', protectRoute, getTicketById);
router.post('/:ticketId/message', protectRoute, addMessageToTicket);
router.post('/:ticketId/rate', protectRoute, rateTicket);

// Staff endpoints
router.get('/all/tickets', protectRoute, stationMaster, getAllTickets);
router.patch('/:ticketId/status', protectRoute, stationMaster, updateTicketStatus);
router.post('/:ticketId/escalate', protectRoute, stationMaster, escalateTicket);

export default router;
