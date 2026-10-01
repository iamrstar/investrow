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

  const all = await Lead.find({ response: 'Converted' }).lean();
  console.log(`Auditing ${all.length} converted clients for same name + same phone...`);

  // Group by clean name + phone
  const groups = new Map();

  for (const c of all) {
    const cleanName = String(c.name || '').toLowerCase().replace(/\[.*?\]/g, '').replace(/[^a-z0-9]/g, '').trim();
    const phone = String(c.phone || '').trim().replace(/[^0-9]/g, '');

    if (cleanName && phone.length >= 10) {
      const key = `${cleanName}_${phone}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([k, list]) => list.length > 1);
  console.log(`Found ${duplicateGroups.length} groups of duplicates (same name & phone).`);

  let totalMergedCount = 0;
  let totalDeletedCount = 0;

  for (const [key, list] of duplicateGroups) {
    // Sort by leadNumber ascending so the earliest ID is the master
    list.sort((a, b) => (a.leadNumber || 999999) - (b.leadNumber || 999999));
    const master = list[0];
    const duplicates = list.slice(1);

    console.log(`Merging ${duplicates.length} duplicate(s) into Master ${master.leadId} (${master.name})...`);

    // Collect all unique clientCodes / UCC
    const allCodes = new Set();
    list.forEach(item => {
      if (item.clientCode) {
        String(item.clientCode).split(',').forEach(c => {
          const tc = c.trim();
          if (tc) allCodes.add(tc);
        });
      }
      const m = String(item.name || '').match(/\[([0-9a-zA-Z]+)\]/);
      if (m) allCodes.add(m[1].trim());
    });

    const updateFields = {};

    // 1. UCC codes
    if (allCodes.size > 0) {
      updateFields.clientCode = Array.from(allCodes).join(', ');
    }

    // 2. PAN Number
    if (!master.panNumber || master.panNumber === 'N/A' || master.panNumber === 'NONE') {
      const validPanDoc = duplicates.find(d => d.panNumber && d.panNumber.length === 10 && d.panNumber !== 'N/A');
      if (validPanDoc) updateFields.panNumber = validPanDoc.panNumber;
    }

    // 3. Aadhaar
    if (!master.aadhaarNumber) {
      const docWithAadhaar = duplicates.find(d => d.aadhaarNumber && d.aadhaarNumber.length >= 8);
      if (docWithAadhaar) updateFields.aadhaarNumber = docWithAadhaar.aadhaarNumber;
    }

    // 4. Date of Birth
    if (!master.dateOfBirth || master.dateOfBirth === 'N/A') {
      const docWithDob = duplicates.find(d => d.dateOfBirth && d.dateOfBirth !== 'N/A');
      if (docWithDob) updateFields.dateOfBirth = docWithDob.dateOfBirth;
    }

    // 5. Address, City, Pincode
    if (!master.address) {
      const docWithAddr = duplicates.find(d => d.address);
      if (docWithAddr) updateFields.address = docWithAddr.address;
    }
    if (!master.city) {
      const docWithCity = duplicates.find(d => d.city);
      if (docWithCity) updateFields.city = docWithCity.city;
    }
    if (!master.pincode) {
      const docWithPin = duplicates.find(d => d.pincode);
      if (docWithPin) updateFields.pincode = docWithPin.pincode;
    }

    // 6. Email
    if (!master.email || master.email === 'n/a') {
      const docWithEmail = duplicates.find(d => d.email && d.email !== 'n/a');
      if (docWithEmail) updateFields.email = docWithEmail.email;
    }

    // 7. Remarks
    const remarksList = [master.remarks || ''];
    duplicates.forEach(d => {
      if (d.remarks && !remarksList.includes(d.remarks)) remarksList.push(d.remarks);
    });
    if (allCodes.size > 1) {
      remarksList.push(`Consolidated UCCs: ${Array.from(allCodes).join(', ')}`);
    }
    updateFields.remarks = remarksList.filter(Boolean).join(' | ');

    // 8. Schemes consolidation
    const masterSchemes = Array.isArray(master.schemes) ? [...master.schemes] : [];
    duplicates.forEach(d => {
      if (Array.isArray(d.schemes)) {
        d.schemes.forEach(sc => {
          const exists = masterSchemes.some(ms => ms.schemeName === sc.schemeName && ms.sipAmount === sc.sipAmount);
          if (!exists) masterSchemes.push(sc);
        });
      }
    });
    if (masterSchemes.length > 0) {
      updateFields.schemes = masterSchemes;
    }

    // Ensure SIP amount
    if (!master.sipAmount || master.sipAmount === 0) {
      const sipDoc = duplicates.find(d => d.sipAmount && d.sipAmount > 0);
      updateFields.sipAmount = sipDoc?.sipAmount || 1000;
      updateFields.investmentType = 'Monthly SIP';
      updateFields.service = 'Mutual Funds';
      updateFields.product = 'Mutual Funds';
    }

    // Clean name: keep clean primary name without old brackets if wanted, or with all UCCs
    const cleanPrimaryName = master.name.replace(/\[.*?\]/g, '').trim();
    if (allCodes.size > 0) {
      updateFields.name = `${cleanPrimaryName} [${Array.from(allCodes).join(', ')}]`;
    }

    // Apply update to master
    await Lead.updateOne({ _id: master._id }, { $set: updateFields });
    totalMergedCount++;

    // Re-point activity logs and delete duplicates
    for (const dup of duplicates) {
      await ActivityLog.updateMany({ entityId: dup._id }, { $set: { entityId: master._id } });
      await Lead.deleteOne({ _id: dup._id });
      totalDeletedCount++;
      console.log(`  Merged and deleted ${dup.leadId} (${dup.name})`);
    }
  }

  const finalConvertedCount = await Lead.countDocuments({ response: 'Converted' });
  const finalTotalCount = await Lead.countDocuments();

  console.log('==============================================');
  console.log('MERGE COMPLETE SUCCESSFULLY!');
  console.log(`- Total Groups Merged: ${totalMergedCount}`);
  console.log(`- Duplicate records deleted: ${totalDeletedCount}`);
  console.log(`- Final Total Converted Clients: ${finalConvertedCount}`);
  console.log(`- Final Total Records in Database: ${finalTotalCount}`);
  console.log('==============================================');

  process.exit(0);
}

runMerge().catch(err => {
  console.error('Fatal error in merge:', err);
  process.exit(1);
});
