const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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

const LeadSchema = new mongoose.Schema({}, { strict: false });
const ActivityLogSchema = new mongoose.Schema({}, { strict: false });

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

async function runMerge() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  const all = await Lead.find({}).lean();
  console.log(`Auditing ${all.length} records in database...`);

  // Detect duplicate pairs
  const duplicatePairs = [];
  const processedIds = new Set();

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];

      if (processedIds.has(String(a._id)) || processedIds.has(String(b._id))) continue;

      const cleanA = String(a.name || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '').trim();
      const cleanB = String(b.name || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '').trim();

      if (!cleanA || !cleanB || cleanA !== cleanB) continue;

      const phoneA = String(a.phone || '').trim().replace(/[^0-9]/g, '');
      const phoneB = String(b.phone || '').trim().replace(/[^0-9]/g, '');
      const panA = String(a.panNumber || '').trim().toUpperCase();
      const panB = String(b.panNumber || '').trim().toUpperCase();

      const samePhone = phoneA && phoneB && (phoneA === phoneB || phoneA.endsWith(phoneB) || phoneB.endsWith(phoneA));
      const samePan = panA && panB && panA.length === 10 && panA !== 'N/A' && panA === panB;

      if (samePhone || samePan) {
        // Keep the lower leadNumber as master
        const master = a.leadNumber <= b.leadNumber ? a : b;
        const duplicate = a.leadNumber <= b.leadNumber ? b : a;

        duplicatePairs.push({ master, duplicate, samePhone, samePan });
        processedIds.add(String(duplicate._id));
      }
    }
  }

  console.log(`Found ${duplicatePairs.length} duplicate pairs to merge.`);

  for (const pair of duplicatePairs) {
    const { master, duplicate } = pair;
    console.log(`Merging ${duplicate.leadId} (${duplicate.name}) into Master ${master.leadId} (${master.name})...`);

    const updateFields = {};

    // 1. Client Code / UCC
    if (!master.clientCode && duplicate.clientCode) {
      updateFields.clientCode = duplicate.clientCode;
    }

    // 2. PAN Number
    if ((!master.panNumber || master.panNumber === 'N/A') && duplicate.panNumber && duplicate.panNumber !== 'N/A') {
      updateFields.panNumber = duplicate.panNumber;
    }

    // 3. Aadhaar
    if (!master.aadhaarNumber && duplicate.aadhaarNumber) {
      updateFields.aadhaarNumber = duplicate.aadhaarNumber;
    }

    // 4. Date of Birth
    if ((!master.dateOfBirth || master.dateOfBirth === 'N/A') && duplicate.dateOfBirth && duplicate.dateOfBirth !== 'N/A') {
      updateFields.dateOfBirth = duplicate.dateOfBirth;
    }

    // 5. Address, City, Pincode
    if (!master.address && duplicate.address) updateFields.address = duplicate.address;
    if (!master.city && duplicate.city) updateFields.city = duplicate.city;
    if (!master.pincode && duplicate.pincode) updateFields.pincode = duplicate.pincode;

    // 6. Email
    if ((!master.email || master.email === 'N/A') && duplicate.email && duplicate.email !== 'N/A') {
      updateFields.email = duplicate.email;
    }

    // 7. SIP Amount & Scheme
    // If master has an existing custom SIP (e.g. 10000, 25000), preserve it!
    // If master has no SIP, set to duplicate's SIP or default 1000.
    if (!master.sipAmount || master.sipAmount === 0) {
      updateFields.sipAmount = duplicate.sipAmount || 1000;
      updateFields.investmentType = 'Monthly SIP';
      updateFields.service = master.service || duplicate.service || 'Mutual Funds';
      updateFields.product = master.product || duplicate.product || 'Mutual Funds';
      updateFields.sipDay = master.sipDay || duplicate.sipDay || 5;
      updateFields.schemeName = master.schemeName || duplicate.schemeName || 'Mutual Fund SIP';
      if (!master.schemes || master.schemes.length === 0) {
        updateFields.schemes = duplicate.schemes || [
          {
            service: 'Mutual Funds',
            investmentType: 'Monthly SIP',
            schemeName: 'Mutual Fund SIP',
            sipAmount: updateFields.sipAmount,
            sipDay: 5
          }
        ];
      }
    }

    // 8. Ensure Converted status
    updateFields.response = 'Converted';
    updateFields.stage = 'Converted';

    // Apply update to master
    if (Object.keys(updateFields).length > 0) {
      await Lead.updateOne({ _id: master._id }, { $set: updateFields });
    }

    // Re-point any activity logs from duplicate to master
    await ActivityLog.updateMany({ entityId: duplicate._id }, { $set: { entityId: master._id } });

    // Delete duplicate document
    await Lead.deleteOne({ _id: duplicate._id });
    console.log(`  Merged and deleted duplicate ${duplicate.leadId}.`);
  }

  // Final check: Ensure all Converted clients have at least 1000 SIP default
  const clientsWithoutSip = await Lead.find({
    response: 'Converted',
    $or: [{ sipAmount: { $exists: false } }, { sipAmount: null }, { sipAmount: 0 }]
  });

  console.log(`Ensuring default ₹1000 SIP for ${clientsWithoutSip.length} clients without SIP...`);
  for (const c of clientsWithoutSip) {
    await Lead.updateOne({ _id: c._id }, {
      $set: {
        sipAmount: 1000,
        investmentType: c.investmentType || 'Monthly SIP',
        service: c.service || 'Mutual Funds',
        product: c.product || 'Mutual Funds',
        sipDay: c.sipDay || 5,
        schemeName: c.schemeName || 'Mutual Fund SIP',
        schemes: (c.schemes && c.schemes.length > 0) ? c.schemes : [
          {
            service: 'Mutual Funds',
            investmentType: 'Monthly SIP',
            schemeName: 'Mutual Fund SIP',
            sipAmount: 1000,
            sipDay: 5
          }
        ]
      }
    });
  }

  const finalClientCount = await Lead.countDocuments({ response: 'Converted' });
  const finalTotalCount = await Lead.countDocuments();

  console.log('==============================================');
  console.log('MERGE & DEDUPLICATION COMPLETED!');
  console.log(`- Duplicate records merged and purged: ${duplicatePairs.length}`);
  console.log(`- Clients updated with default ₹1000 SIP: ${clientsWithoutSip.length}`);
  console.log(`- Final Total Converted Clients: ${finalClientCount}`);
  console.log(`- Final Total Database Records: ${finalTotalCount}`);
  console.log('==============================================');

  process.exit(0);
}

runMerge().catch(err => {
  console.error('Fatal error during merge:', err);
  process.exit(1);
});
