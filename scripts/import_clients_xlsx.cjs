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
  console.error('Error: MONGODB_URI is not defined in .env.local');
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

async function runImport() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  const admin = await User.findOne({ role: 'admin' }).lean();
  if (!admin) {
    console.error('Error: Admin user not found in database');
    process.exit(1);
  }
  console.log(`Admin user found: ${admin.name} (${admin._id})`);

  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 2, defval: '' });
  console.log(`Loaded ${rows.length} rows from Excel file.`);

  // Find highest existing leadNumber
  const highest = await Lead.findOne({ leadNumber: { $exists: true, $ne: null } })
    .sort({ leadNumber: -1 })
    .lean();
  let nextNum = (highest && typeof highest.leadNumber === 'number') ? highest.leadNumber + 1 : 1001;
  console.log(`Highest existing leadNumber is ${highest?.leadNumber || 1000}. New clients will start from leadNumber: ${nextNum}`);

  // Load all existing leads/clients to detect matches
  const existingDocs = await Lead.find({}).lean();
  console.log(`Existing documents in DB: ${existingDocs.length}`);

  const existingByPhone = new Map();
  const existingByName = new Map();
  const existingByCode = new Map();

  for (const doc of existingDocs) {
    const p = String(doc.phone || '').trim().replace(/[^0-9]/g, '');
    if (p) existingByPhone.set(p, doc);

    const cleanN = String(doc.name || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '').trim();
    if (cleanN) existingByName.set(cleanN, doc);

    if (doc.clientCode) {
      existingByCode.set(String(doc.clientCode).trim(), doc);
    }
  }

  let updatedCount = 0;
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rawName = String(r.Name || '').trim();
    if (!rawName) continue;

    // Extract client code from [12592816]
    const codeMatch = rawName.match(/\[([0-9a-zA-Z]+)\]/);
    const clientCode = codeMatch ? codeMatch[1].trim() : '';

    const cleanName = rawName.replace(/\[.*?\]/g, '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

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

    // Check if client already exists in DB
    let match = null;
    if (clientCode && existingByCode.has(clientCode)) {
      match = existingByCode.get(clientCode);
    } else if (phone && existingByPhone.has(phone)) {
      const candidate = existingByPhone.get(phone);
      const candNorm = String(candidate.name || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '');
      if (candNorm === normalizedName || candNorm.includes(normalizedName) || normalizedName.includes(candNorm)) {
        match = candidate;
      }
    } else if (normalizedName && existingByName.has(normalizedName)) {
      match = existingByName.get(normalizedName);
    }

    if (match) {
      // Update existing record with missing details and default 1000 SIP if not set
      const updateFields = {};
      if (!match.clientCode && clientCode) updateFields.clientCode = clientCode;
      if (!match.panNumber && panNumber) updateFields.panNumber = panNumber;
      if (!match.email && email) updateFields.email = email;
      if (!match.address && address) updateFields.address = address;
      if (!match.city && city) updateFields.city = city;
      if (!match.pincode && pincode) updateFields.pincode = pincode;
      if (!match.dateOfBirth && dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
      if (!match.aadhaarNumber && aadhaarNumber) updateFields.aadhaarNumber = aadhaarNumber;
      if (subBroker && !match.remarks) updateFields.remarks = `Sub-Broker: ${subBroker}`;

      // Ensure converted client status
      updateFields.response = 'Converted';
      updateFields.stage = 'Converted';

      // Set default 1000 SIP if missing or 0
      if (!match.sipAmount || match.sipAmount === 0) {
        updateFields.sipAmount = 1000;
        updateFields.investmentType = match.investmentType || 'Monthly SIP';
        updateFields.service = match.service || 'Mutual Funds';
        updateFields.product = match.product || 'Mutual Funds';
        if (!match.schemes || match.schemes.length === 0) {
          updateFields.schemes = [{
            service: 'Mutual Funds',
            investmentType: 'Monthly SIP',
            sipAmount: 1000,
            schemeName: 'Mutual Fund SIP',
            sipDay: 5
          }];
        }
      }

      await Lead.updateOne({ _id: match._id }, { $set: updateFields });
      updatedCount++;
    } else {
      // Create new Converted Client
      const currentNumber = nextNum++;
      const currentId = `INV-${currentNumber}`;

      const newClient = {
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
      };

      toInsert.push(newClient);

      // Register into maps so duplicate entries in the same Excel file are not duplicated
      if (clientCode) existingByCode.set(clientCode, newClient);
      if (phone) existingByPhone.set(phone, newClient);
      if (normalizedName) existingByName.set(normalizedName, newClient);
    }
  }

  console.log(`Ready to insert ${toInsert.length} new clients into MongoDB in chunks...`);

  // Insert in chunks of 500 for high performance & reliability
  const CHUNK_SIZE = 500;
  let insertedCount = 0;
  for (let c = 0; c < toInsert.length; c += CHUNK_SIZE) {
    const chunk = toInsert.slice(c, c + CHUNK_SIZE);
    const res = await Lead.insertMany(chunk, { ordered: true });
    insertedCount += res.length;
    console.log(`Inserted chunk ${Math.floor(c / CHUNK_SIZE) + 1}: ${insertedCount} / ${toInsert.length} clients inserted.`);
  }

  // Create ActivityLog entry
  await ActivityLog.create({
    userId: admin._id,
    action: `Bulk imported ${insertedCount} clients from Excel database with default ₹1,000 SIP`,
    entityType: 'Lead',
    details: {
      inserted: insertedCount,
      updated: updatedCount,
      file: 'all_client_list_20260927194123.xlsx'
    },
    createdAt: new Date()
  });

  const totalClientsInDb = await Lead.countDocuments({ response: 'Converted' });
  const totalLeadsInDb = await Lead.countDocuments();

  console.log('==============================================');
  console.log('IMPORT COMPLETE SUCCESSFULLY!');
  console.log(`- New clients inserted: ${insertedCount}`);
  console.log(`- Existing clients updated: ${updatedCount}`);
  console.log(`- Total Converted Clients now in database: ${totalClientsInDb}`);
  console.log(`- Total Database records (clients + leads): ${totalLeadsInDb}`);
  console.log(`- Assigned Client IDs: ${toInsert[0]?.leadId} to ${toInsert[toInsert.length - 1]?.leadId}`);
  console.log(`- Default SIP set to: ₹ 1,000 for every client`);
  console.log('==============================================');

  process.exit(0);
}

runImport().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
