import mongoose from 'mongoose';

const SERVICES = [
  'Mutual Funds',
  'Life Insurance',
  'Health Insurance',
  'Tax Planning',
  'General Insurance',
  'FD & Bond',
  'Stock Market & Demat',
  'NPS',
];

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  service: {
    type: String,
    enum: [...SERVICES, ''], // allow empty string if not required
    default: ''
  },
  leadReference: {
    type: String,
    default: '',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  callStatus: {
    type: String,
    enum: ['Received', 'Not Received', 'Pending'],
    default: 'Pending',
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  customFields: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
      fieldType: { 
        type: String, 
        enum: ['Short answer', 'Paragraph', 'Multiple choice', 'Checkboxes', 'Dropdown', 'File upload', 'Date', 'Time', 'Number', 'Text'], 
        default: 'Short answer' 
      },
      options: { type: [String], default: [] }
    }
  ],
}, {
  timestamps: true,
});

LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ createdBy: 1 });
LeadSchema.index({ service: 1 });
LeadSchema.index({ response: 1 });
LeadSchema.index({ callStatus: 1 });

export { SERVICES };
if (mongoose.models.Lead) {
  delete mongoose.models.Lead;
}

export default mongoose.model('Lead', LeadSchema);
