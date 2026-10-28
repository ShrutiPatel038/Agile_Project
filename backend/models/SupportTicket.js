import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['booking', 'payment', 'vehicle', 'account', 'technical', 'other'], required: true },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:      { type: String, enum: ['open', 'in-progress', 'waiting-customer', 'resolved', 'closed'], default: 'open' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt:  { type: Date },
  sla: {
    responseDeadline:   { type: Date },
    resolutionDeadline: { type: Date },
    firstResponseAt:    { type: Date },
    resolvedAt:         { type: Date },
    isBreached:         { type: Boolean, default: false },
  },
  messages: [{
    sender:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:     { type: String, required: true },
    attachments: [{ url: String, filename: String }],
    timestamp:   { type: Date, default: Date.now },
    isInternal:  { type: Boolean, default: false },
  }],
  escalation: {
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason:      { type: String },
  },
  tags:   [{ type: String }],
  rating: { score: { type: Number, min: 1, max: 5 }, feedback: { type: String } },
}, { timestamps: true });

supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
