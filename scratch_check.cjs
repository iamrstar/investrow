const mongoose = require('mongoose');

const FormControlSchema = new mongoose.Schema({
  singletonId: { type: String, default: 'settings', unique: true },
  defaultFields: [new mongoose.Schema({
    name: String,
    label: String,
    isRequired: Boolean,
    minLength: Number,
    maxLength: Number
  }, { _id: false })],
  globalCustomFields: [new mongoose.Schema({
    label: String,
    fieldType: String,
    options: [String],
    isRequired: Boolean,
    minLength: Number,
    maxLength: Number
  })]
});

const FormControl = mongoose.models.FormControl || mongoose.model('FormControl', FormControlSchema);

async function checkSettings() {
  try {
    const mongoUri = 'mongodb+srv://rajguddu4500:WkuaSfS955XbdjFE@arogya.ohmzbxz.mongodb.net/investrow?retryWrites=true&w=majority&appName=Arogya';
    await mongoose.connect(mongoUri);
    const settings = await FormControl.find({});
    console.log('FormControl Documents:', JSON.stringify(settings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSettings();
