import mongoose from 'mongoose';

const SalarySlipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  employeeEmail: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    default: '',
  },
  employeeId: {
    type: String,
    default: '',
  },
  month: {
    type: String, // e.g. "November"
    required: true,
  },
  year: {
    type: Number, // e.g. 2026
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  baseSalary: {
    type: Number,
    required: true,
    default: 0,
  },
  earnings: [{
    label: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  }],
  deductions: [{
    label: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  }],
  grossEarnings: {
    type: Number,
    required: true,
    default: 0,
  },
  totalDeductions: {
    type: Number,
    required: true,
    default: 0,
  },
  netPay: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Draft', 'Released'],
    default: 'Released',
  },
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  releasedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

SalarySlipSchema.index({ userId: 1, month: 1, year: 1 });
SalarySlipSchema.index({ createdAt: -1 });

export default mongoose.models.SalarySlip || mongoose.model('SalarySlip', SalarySlipSchema);

