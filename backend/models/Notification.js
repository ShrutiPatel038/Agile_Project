import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['booking', 'payment', 'emergency', 'system', 'reminder'], required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // Additional data for the notification
    channels: {
        push: { sent: Boolean, sentAt: Date, error: String },
        email: { sent: Boolean, sentAt: Date, error: String },
        sms: { sent: Boolean, sentAt: Date, error: String }
    },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
}, { timestamps: true });

// Auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days = 2,592,000 seconds

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;