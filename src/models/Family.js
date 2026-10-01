import mongoose from 'mongoose';

const FamilyMemberSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  relationship: {
    type: String,
    enum: ['Head', 'Self', 'Spouse', 'Husband', 'Wife', 'Son', 'Daughter', 'Child', 'Father', 'Mother', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Family Member', 'Member', 'Other'],
    default: 'Other',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  }
}, { _id: false });

const FamilySchema = new mongoose.Schema({
  familyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  familyName: {
    type: String,
    trim: true,
    default: 'Family Unit',
  },
  headClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  members: [FamilyMemberSchema],
  totalSip: {
    type: Number,
    default: 0,
  },
  totalInvestment: {
    type: Number,
    default: 0,
  },
  primaryPhone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: 'Dhanbad',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

if (mongoose.models.Family) {
  delete mongoose.models.Family;
}

export default mongoose.model('Family', FamilySchema);
