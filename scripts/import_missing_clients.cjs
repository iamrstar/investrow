const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
  });
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Error: MONGODB_URI is not defined');
  process.exit(1);
}

const filePath = '/Users/rajchatterjee/Downloads/all_client_list_20260927194123.xlsx';
if (!fs.existsSync(filePath)) {
  console.error('Error: File not found at:', filePath);
  process.exit(1);
}

const LeadSchema = new mongoose.Schema({}, { strict: false });
const ActivityLogSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function runImportMissing() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  const admin = await User.findOne({ role: 'admin' }).lean();
  if (!admin) {
    console.error('Admin user not found');
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 2, defval: '' });
  console.log(`Loaded ${rows.length} rows from Excel.`);

  const dbClients = await Lead.find({}).lean();
  console.log(`Total current records in DB: ${dbClients.length}`);

  // Set of all existing clientCodes in DB
  const dbCodes = new Set();
  dbClients.forEach(c => {
    if (c.clientCode) dbCodes.add(String(c.clientCode).trim());
    // Also check if code is in the name
    const m = String(c.name || '').match(/\[([0-9a-zA-Z]+)\]/);
    if (m) dbCodes.add(m[1].trim());
  });

  const highest = await Lead.findOne({ leadNumber: { $exists: true, $ne: null } })
    .sort({ leadNumber: -1 })
    .lean();
  let nextNum = (highest && typeof highest.leadNumber === 'number') ? highest.leadNumber + 1 : 3306;
  console.log(`Highest existing leadNumber is ${highest?.leadNumber}. Next will start from: ${nextNum}`);

  const toInsert = [];
  const seenCodesInBatch = new Set();

  for (const r of rows) {
    const rawName = String(r.Name || '').trim();
    if (!rawName) continue;

    const codeMatch = rawName.match(/\[([0-9a-zA-Z]+)\]/);
    const clientCode = codeMatch ? codeMatch[1].trim() : '';

    if (clientCode) {
      if (dbCodes.has(clientCode) || seenCodesInBatch.has(clientCode)) {
        continue; // Already in DB
      }
      seenCodesInBatch.add(clientCode);
    }

    // Phone cleanup
    const rawPhone = String(r.Mobile || '').trim().replace(/[^0-9]/g, '');
    let phone = rawPhone;
    if (phone.length === 12 && phone.startsWith('91')) {
      phone = phone.slice(2);
    }

    // Email cleanup
    let email = String(r.Email || '').trim().toLowerCase();
    if (email === 'n/a' || email === '-' || email === 'none') email = '';

    // PAN cleanup
    let panNumber = String(r['Pan Number'] || '').trim().toUpperCase();
    if (panNumber === 'N/A' || panNumber === '-' || panNumber === 'NONE') panNumber = '';

    // Aadhaar cleanup
    let aadhaarNumber = String(r['Aadhar No'] || '').trim().replace(/[^0-9]/g, '');
    if (aadhaarNumber.length < 8) aadhaarNumber = '';

    // Address & City
    const address = String(r.Address || '').trim();
    let city = String(r.City || '').trim();
    if (!city) city = 'Dhanbad';

    // Pincode
    const pincode = String(r.Pincode || '').trim().replace(/[^0-9]/g, '');

    // Date of birth
    let dateOfBirth = String(r['Date Of Birth'] || '').trim();
    if (dateOfBirth === 'N/A' || dateOfBirth === '-' || dateOfBirth === 'None') dateOfBirth = '';

    // Sub broker
    const subBroker = String(r['Sub Broker'] || '').trim();

    const currentNumber = nextNum++;
    const currentId = `INV-${currentNumber}`;

    toInsert.push({
      leadId: currentId,
      leadNumber: currentNumber,
      clientCode: clientCode,
      name: rawName,
      phone: phone,
      email: email,
      service: 'Mutual Funds',
      product: 'Mutual Funds',
      investmentType: 'Monthly SIP',
      sipAmount: 1000,
      investmentAmount: 0,
      sipDay: 5,
      schemeName: 'Mutual Fund SIP',
      schemes: [
        {
          service: 'Mutual Funds',
          investmentType: 'Monthly SIP',
          schemeName: 'Mutual Fund SIP',
          sipAmount: 1000,
          sipDay: 5,
          investmentAmount: 0,
          remarks: subBroker ? `Sub-Broker: ${subBroker}` : ''
        }
      ],
      source: 'Excel Import',
      stage: 'Converted',
      status: 'Active',
      response: 'Converted',
      callStatus: 'Received',
      kycStatus: panNumber ? 'Verified' : 'Pending',
      riskProfile: 'Moderate',
      address: address,
      city: city,
      location: city,
      pincode: pincode,
      panNumber: panNumber,
      aadhaarNumber: aadhaarNumber,
      dateOfBirth: dateOfBirth,
      remarks: subBroker ? `Sub-Broker: ${subBroker}` : '',
      createdBy: admin._id,
      assignedTo: admin._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`Found ${toInsert.length} missing clients to insert!`);
  if (toInsert.length > 0) {
    const res = await Lead.insertMany(toInsert, { ordered: true });
    console.log(`Successfully inserted all ${res.length} clients!`);

    await ActivityLog.create({
      userId: admin._id,
      action: `Imported remaining ${res.length} clients from Excel database with default ₹1,000 SIP`,
      entityType: 'Lead',
      details: {
        inserted: res.length,
        startingId: toInsert[0]?.leadId,
        endingId: toInsert[toInsert.length - 1]?.leadId
      },
      createdAt: new Date()
    });
  }

  const finalConvertedClients = await Lead.countDocuments({ response: 'Converted' });
  const finalTotal = await Lead.countDocuments();

  console.log('==============================================');
  console.log('COMPLETE SUCCESS:');
  console.log(`- Newly inserted: ${toInsert.length}`);
  console.log(`- Total Converted Clients in DB now: ${finalConvertedClients}`);
  console.log(`- Total Database records: ${finalTotal}`);
  console.log(`- ID range for newly inserted: ${toInsert[0]?.leadId} to ${toInsert[toInsert.length - 1]?.leadId}`);
  console.log('==============================================');

  process.exit(0);
}

runImportMissing().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
