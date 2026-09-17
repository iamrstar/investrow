const fs = require('fs');
const mongoose = require('mongoose');

// Read Mongo URI from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/MONGODB_URI=(.+)/);
if (!match) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}
const uri = match[1].trim();

async function backfill() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const leadsCollection = mongoose.connection.db.collection('leads');

  // Find all leads sorted by createdAt ascending
  const leads = await leadsCollection.find({}).sort({ createdAt: 1 }).toArray();
  console.log(`Found ${leads.length} leads to check/backfill.`);

  let startNumber = 1001;
  let updatedCount = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const currentNumber = startNumber + i;
    const currentId = `INV-${currentNumber}`;

    // Update lead with sequential leadNumber and leadId
    await leadsCollection.updateOne(
      { _id: lead._id },
      {
        $set: {
          leadNumber: currentNumber,
          leadId: currentId,
        }
      }
    );
    updatedCount++;
  }

  console.log(`Successfully backfilled ${updatedCount} leads.`);
  console.log(`First lead ID: INV-${startNumber}`);
  console.log(`Last lead ID: INV-${startNumber + leads.length - 1}`);

  // Create index on leadNumber and leadId
  await leadsCollection.createIndex({ leadNumber: -1 });
  await leadsCollection.createIndex({ leadId: 1 });
  console.log('Created indexes on leadNumber and leadId.');

  await mongoose.disconnect();
  console.log('Done.');
}

backfill().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});
