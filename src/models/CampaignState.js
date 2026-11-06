import mongoose from 'mongoose';

const CampaignStateSchema = new mongoose.Schema({
  festivalName: { type: String, required: true, unique: true }, // e.g., 'Diwali', 'Dhanteras'
  campaignStartedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['idle', 'running', 'paused', 'completed'], default: 'idle' },
  lastBatchAt: { type: Date },
  resetCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.models.CampaignState || mongoose.model('CampaignState', CampaignStateSchema);

