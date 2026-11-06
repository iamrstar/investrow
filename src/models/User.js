import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'relationship_manager', 'rm'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  phone: {
    type: String,
    default: '',
  },
  designation: {
    type: String,
    default: '',
  },
  salary: {
    type: Number,
    default: 0,
  },
  pf: {
    type: Number,
    default: 0,
  },
  professionalTax: {
    type: Number,
    default: 0,
  },
  plainPassword: {
    type: String,
    default: '',
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  strict: false,
});

UserSchema.index({ role: 1 });

if (mongoose.models?.User) {
  try {
    delete mongoose.models.User;
  } catch (e) {
    // Ignore error
  }
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
