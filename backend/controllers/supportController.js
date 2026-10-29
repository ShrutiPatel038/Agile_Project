import SupportTicket from '../models/SupportTicket.js';

// Issue #32: Support ticket system implementation

export const createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority, bookingId } = req.body;
        
        if (!subject || !description || !category) {
            return res.status(400).json({ message: 'Subject, description, and category are required' });
        }
        
        // Calculate SLA deadlines based on priority
        const now = new Date();
        let responseDeadline, resolutionDeadline;
        
        switch (priority || 'medium') {
            case 'urgent':
                responseDeadline = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
                resolutionDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
                break;
            case 'high':
                responseDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
                resolutionDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
                break;
            case 'medium':
                responseDeadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
                resolutionDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
                break;
            case 'low':
                responseDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
                resolutionDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
                break;
        }
        
        const ticket = await SupportTicket.create({
            user: req.user._id,
            booking: bookingId || undefined,
            subject,
            description,
            category,
            priority: priority || 'medium',
            sla: {
                responseDeadline,
                resolutionDeadline
            },
            messages: [{
                sender: req.user._id,
                message: description,
                timestamp: now
            }]
        });
        
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server Error creating ticket' });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user._id })
            .populate('booking', 'vehicle startTime endTime')
            .sort({ createdAt: -1 });
        
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching tickets' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        const ticket = await SupportTicket.findById(ticketId)
            .populate('user', 'name email')
            .populate('booking')
            .populate('assignedTo', 'name email')
            .populate('messages.sender', 'name email role');
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Check authorization
        if (ticket.user._id.toString() !== req.user._id.toString() && 
            !['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching ticket' });
    }
};

export const addMessageToTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, isInternal } = req.body;
        
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Check authorization
        if (ticket.user.toString() !== req.user._id.toString() && 
            !['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        // Only staff can add internal messages
        const isInternalMessage = isInternal && ['station-master', 'super-admin'].includes(req.user.role);
        
        ticket.messages.push({
            sender: req.user._id,
            message,
            isInternal: isInternalMessage,
            timestamp: new Date()
        });
        
        // Update first response time if this is first staff response
        if (!ticket.sla.firstResponseAt && ['station-master', 'super-admin'].includes(req.user.role)) {
            ticket.sla.firstResponseAt = new Date();
            
            // Check if SLA was breached
            if (ticket.sla.firstResponseAt > ticket.sla.responseDeadline) {
                ticket.sla.isBreached = true;
            }
        }
        
        // Update status if customer responds to waiting-customer status
        if (ticket.status === 'waiting-customer' && ticket.user.toString() === req.user._id.toString()) {
            ticket.status = 'in-progress';
        }
        
        await ticket.save();
        
        // Notify relevant parties via socket
        if (global.io) {
            if (isInternalMessage) {
                // Notify only staff
                global.io.to('support_staff').emit('ticket_update', { ticketId, message: 'New internal note' });
            } else {
                // Notify all participants
                global.io.to(ticket.user.toString()).emit('ticket_update', { ticketId, message: 'New message' });
                if (ticket.assignedTo) {
                    global.io.to(ticket.assignedTo.toString()).emit('ticket_update', { ticketId, message: 'New message' });
                }
            }
        }
        
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error adding message' });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, assignedTo } = req.body;
        
        // Only staff can update status
        if (!['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        if (status) {
            ticket.status = status;
            
            // If resolved, record resolution time
            if (status === 'resolved' && !ticket.sla.resolvedAt) {
                ticket.sla.resolvedAt = new Date();
                
                // Check if resolution SLA was breached
                if (ticket.sla.resolvedAt > ticket.sla.resolutionDeadline) {
                    ticket.sla.isBreached = true;
                }
            }
        }
        
        if (assignedTo) {
            ticket.assignedTo = assignedTo;
            ticket.assignedAt = new Date();
        }
        
        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating ticket' });
    }
};

export const escalateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { reason, escalateTo } = req.body;
        
        if (!['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        ticket.escalation = {
            isEscalated: true,
            escalatedAt: new Date(),
            escalatedTo: escalateTo,
            reason
        };
        
        ticket.priority = 'urgent'; // Escalated tickets become urgent
        
        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error escalating ticket' });
    }
};

export const rateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { score, feedback } = req.body;
        
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket || ticket.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
            return res.status(400).json({ message: 'Can only rate resolved/closed tickets' });
        }
        
        ticket.rating = { score, feedback };
        ticket.status = 'closed'; // Close ticket after rating
        
        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error rating ticket' });
    }
};

// Admin/Staff endpoints
export const getAllTickets = async (req, res) => {
    try {
        if (!['station-master', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const { status, priority, category } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        
        const tickets = await SupportTicket.find(filter)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ priority: -1, createdAt: -1 });
        
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching tickets' });
    }
};
