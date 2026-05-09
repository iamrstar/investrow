import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['Task', 'Call', 'Meeting'],
    default: 'Task',
  },
  meetingType: {
    type: String,
    enum: ['Online', 'Offline', ''],
    default: '',
  },
  platform: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  outcomeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FollowUp',
    default: null,
  },
}, {
  timestamps: true,
});

TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ type: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
