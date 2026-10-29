import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const sendMessage = async (req, res) => {
    try {
        const { bookingId, message, type = 'text' } = req.body;
        
        const booking = await Booking.findById(bookingId).populate('user station');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Determine receiver based on sender
        let receiverId;
        if (req.user._id.toString() === booking.user._id.toString()) {
            // User is sending, find station master
            const stationMaster = await User.findOne({ 
                station: booking.station._id, 
                role: 'station-master' 
            });
            if (!stationMaster) {
                return res.status(404).json({ message: 'Station master not found' });
            }
            receiverId = stationMaster._id;
        } else {
            // Station master is sending to user
            receiverId = booking.user._id;
        }
        
        const newMessage = await Message.create({
            booking: bookingId,
            sender: req.user._id,
            receiver: receiverId,
            message,
            type
        });
        
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name')
            .populate('receiver', 'name');
        
        // Emit socket event
        const io = req.io;
        io.to(receiverId.toString()).emit('new_message', populatedMessage);
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error sending message' });
    }
};

export const getBookingMessages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Check if user has access to this booking
        const isUser = req.user._id.toString() === booking.user.toString();
        const isStationMaster = req.user.role === 'station-master' && 
                               req.user.station.toString() === booking.station.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        
        if (!isUser && !isStationMaster && !isSuperAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const messages = await Message.find({ booking: bookingId })
            .populate('sender', 'name')
            .sort({ createdAt: 1 });
        
        // Mark messages as read
        await Message.updateMany(
            { booking: bookingId, receiver: req.user._id, isRead: false },
            { isRead: true }
        );
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching messages' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user._id,
            isRead: false
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};