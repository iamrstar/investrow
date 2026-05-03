import mongoose from 'mongoose';

const DefaultFieldSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'name', 'phone', 'email', 'service', 'location', 'leadReference'
  label: { type: String, required: true }, // e.g., 'Full Name', 'Mobile Number'
  isRequired: { type: Boolean, default: false }
}, { _id: false });

const GlobalCustomFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { type: String, enum: ['Text', 'Number', 'Dropdown'], default: 'Text' },
  options: { type: [String], default: [] },
  isRequired: { type: Boolean, default: false }
});

const FormControlSchema = new mongoose.Schema({
  singletonId: { type: String, default: 'settings', unique: true },
  defaultFields: [DefaultFieldSchema],
  globalCustomFields: [GlobalCustomFieldSchema]
}, {
  timestamps: true,
});

export default mongoose.models.FormControl || mongoose.model('FormControl', FormControlSchema);
