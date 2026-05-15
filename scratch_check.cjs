const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Manual .env.local loader if process.env.MONGODB_URI is not set
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.join('=').trim();
      });
    }
  } catch (e) {
    console.warn('Could not manually load .env.local');
  }
}

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
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in .env.local');
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
