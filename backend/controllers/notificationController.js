import Notification from '../models/Notification.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { generateInvoicePDF } from '../services/invoiceService.js';

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Utility function for creating notifications programmatically
export const createNotificationUtil = async (userId, title, message, type, priority = 'medium', channels = {}, io = null) => {
    try {
        console.log('Creating notification for user:', userId, 'Title:', title);
        
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            priority,
            channels: {
                push: { sent: false },
                email: { sent: false },
                sms: { sent: false },
                ...channels
            }
        });
        
        console.log('Notification created in DB:', notification._id);
        
        // Always try to send via socket
        const socketIo = io || global.io;
        if (socketIo) {
            console.log('Emitting notification to user room:', userId.toString());
            const notificationData = {
                _id: notification._id,
                title,
                message,
                type,
                priority,
                createdAt: notification.createdAt,
                isRead: false
            };
            
            socketIo.to(userId.toString()).emit('notification', notificationData);
            console.log('Notification emitted:', notificationData);
            
            notification.channels.push = { sent: true, sentAt: new Date() };
            await notification.save();
        } else {
            console.log('No socket.io instance available');
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, priority = 'medium', channels = {} } = req.body;
        
        const notification = await createNotificationUtil(
            userId, 
            title, 
            message, 
            type, 
            priority, 
            channels, 
            req.io
        );
        
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating notification' });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        console.log('Fetching notifications for user:', req.user._id);
        
        // Fetch ALL notifications (both read and unread)
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Notification.countDocuments({ user: req.user._id });
        
        console.log('Found notifications:', notifications.length);
        
        res.json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server Error fetching notifications' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const sendBookingConfirmationEmail = async (booking, user) => {
    try {
        // Generate PDF Invoice
        let attachments = [];
        try {
            const pdfPath = await generateInvoicePDF(booking, user);
            attachments.push({
                filename: `invoice_${booking._id}.pdf`,
                path: pdfPath
            });
        } catch (pdfErr) {
            console.error('⚠️ Failed to generate invoice PDF attachment, sending email without invoice:', pdfErr.message);
        }

        const emailContent = `
            <h2>Booking Confirmation</h2>
            <p>Dear ${user.name},</p>
            <p>Your booking has been confirmed!</p>
            
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
                <h3>Booking Details:</h3>
                <p><strong>Vehicle:</strong> ${booking.vehicle?.modelName || 'EV Vehicle'}</p>
                <p><strong>Start:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
                <p><strong>End:</strong> ${new Date(booking.endTime).toLocaleString()}</p>
                <p><strong>Total Cost:</strong> ₹${booking.totalCost.toLocaleString('en-IN')}</p>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
            </div>
            
            <p>Please arrive at the station 15 minutes before your booking time.</p>
            <p>We have attached the booking tax invoice (PDF) to this email for your records.</p>
            <p>Thank you for choosing EV Rental System!</p>
        `;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Booking Confirmation - EV Rental System',
            html: emailContent,
            attachments
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};