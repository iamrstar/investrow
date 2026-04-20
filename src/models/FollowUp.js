import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  callStatus: {
    type: String,
    enum: ['Received', 'Not Received', 'Pending'],
    default: 'Pending',
  },
  response: {
    type: String,
    enum: ['Positive', 'Negative', 'Pending', 'Converted'],
    default: 'Pending',
  },
  interestedInService: {
    type: String,
    enum: ['Yes', 'No', 'Pending'],
    default: 'Pending',
  },
  serviceTaken: {
    type: String,
    enum: ['Yes', 'No', 'Pending'],
    default: 'Pending',
  },
  nextCallDate: {
    type: Date,
    default: null,
  },
  followUpDate: {
    type: Date,
    default: null,
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

FollowUpSchema.index({ leadId: 1 });
FollowUpSchema.index({ userId: 1 });
FollowUpSchema.index({ createdAt: -1 });

export default mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);
