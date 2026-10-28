import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  type:     { type: String, enum: ['booking', 'payment', 'emergency', 'system', 'reminder'], required: true },
  data:     { type: mongoose.Schema.Types.Mixed },
  channels: {
    push:  { sent: Boolean, sentAt: Date, error: String },
    email: { sent: Boolean, sentAt: Date, error: String },
    sms:   { sent: Boolean, sentAt: Date, error: String },
  },
  isRead:   { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
}, { timestamps: true });

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30-day TTL

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
