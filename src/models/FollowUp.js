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
    trim: true,
    default: 'Pending',
  },
  response: {
    type: String,
    trim: true,
    default: 'Pending',
  },
  interestedInService: {
    type: String,
    trim: true,
    default: 'Pending',
  },
  serviceTaken: {
    type: String,
    trim: true,
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

if (mongoose.models.FollowUp) {
  delete mongoose.models.FollowUp;
}

export default mongoose.model('FollowUp', FollowUpSchema);
