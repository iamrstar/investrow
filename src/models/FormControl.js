import mongoose from 'mongoose';

const DefaultFieldSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'name', 'phone', 'email', 'service', 'location', 'leadReference'
  label: { type: String, required: true }, // e.g., 'Full Name', 'Mobile Number'
  isRequired: { type: Boolean, default: false },
  minLength: { type: Number, default: null },
  maxLength: { type: Number, default: null }
}, { _id: false });

const GlobalCustomFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { 
    type: String, 
    enum: ['Short answer', 'Paragraph', 'Multiple choice', 'Checkboxes', 'Dropdown', 'File upload', 'Date', 'Time', 'Number', 'Text'], 
    default: 'Short answer' 
  },
  options: { type: [String], default: [] },
  isRequired: { type: Boolean, default: false },
  minLength: { type: Number, default: null },
  maxLength: { type: Number, default: null }
});

const FormControlSchema = new mongoose.Schema({
  singletonId: { type: String, default: 'settings', unique: true },
  defaultFields: [DefaultFieldSchema],
  globalCustomFields: [GlobalCustomFieldSchema]
}, {
  timestamps: true,
});

if (mongoose.models.FormControl) {
  delete mongoose.models.FormControl;
}

export default mongoose.model('FormControl', FormControlSchema);
