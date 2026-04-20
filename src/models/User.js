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
    enum: ['admin', 'manager', 'user'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  phone: {
    type: String,
    default: '',
  },
  plainPassword: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

UserSchema.index({ role: 1 });
UserSchema.index({ managerId: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
