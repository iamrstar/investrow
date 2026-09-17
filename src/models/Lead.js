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
  leadId: {
    type: String,
    trim: true,
    index: true,
  },
  leadNumber: {
    type: Number,
    index: true,
  },
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
    trim: true,
    default: '',
  },
  leadReference: {
    type: String,
    trim: true,
    default: '',
  },
  referralName: {
    type: String,
    trim: true,
    default: '',
  },
  otherSource: {
    type: String,
    trim: true,
    default: '',
  },
  source: {
    type: String,
    trim: true,
    default: 'Website',
  },
  stage: {
    type: String,
    trim: true,
    default: 'New',
  },
  status: {
    type: String,
    trim: true,
    default: '',
  },
  product: {
    type: String,
    trim: true,
    default: '',
  },
  investmentAmount: {
    type: Number,
    default: 0,
  },
  sipAmount: {
    type: Number,
    default: 0,
  },
  investmentType: {
    type: String,
    enum: ['Monthly SIP', 'Lumpsum', 'Both', 'None', ''],
    default: '',
  },
  sipDay: {
    type: Number,
    min: 1,
    max: 31,
    default: null,
  },
  schemeName: {
    type: String,
    trim: true,
    default: '',
  },
  schemes: [
    {
      service: { type: String, trim: true, default: '' },
      investmentType: { type: String, default: 'Monthly SIP' },
      schemeName: { type: String, trim: true, default: '' },
      sipAmount: { type: Number, default: 0 },
      sipDay: { type: Number, default: null },
      investmentAmount: { type: Number, default: 0 },
      remarks: { type: String, default: '' },
    }
  ],
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
  callStatus: {
    type: String,
    trim: true,
    default: 'Pending',
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  city: {
    type: String,
    default: '',
    trim: true,
  },
  panNumber: {
    type: String,
    default: '',
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    default: '',
    trim: true,
  },
  whatsappNumber: {
    type: String,
    default: '',
    trim: true,
  },
  bankName: {
    type: String,
    default: '',
    trim: true,
  },
  bankAccountNumber: {
    type: String,
    default: '',
    trim: true,
  },
  bankIfscCode: {
    type: String,
    default: '',
    trim: true,
  },
  pincode: {
    type: String,
    default: '',
    trim: true,
  },
  dateOfBirth: {
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
  onboardingData: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
      fieldType: { 
        type: String, 
        enum: ['Short answer', 'Paragraph', 'Multiple choice', 'Checkboxes', 'Dropdown', 'File upload', 'Date', 'Time', 'Number', 'Text'], 
        default: 'Short answer' 
      }
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
