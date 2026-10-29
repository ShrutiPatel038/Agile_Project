import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['text', 'emergency', 'system'], default: 'text' },
    isRead: { type: Boolean, default: false },
    attachments: [String] // URLs to uploaded files
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;