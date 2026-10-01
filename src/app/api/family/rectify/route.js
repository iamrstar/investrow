import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Family from '@/models/Family';
import { getAuthUser, unauthorized } from '@/lib/middleware';

// Helper to sanitize phone to last 10 digits
function cleanPhone(p) {
  if (!p) return '';
  return String(p).replace(/\D/g, '').slice(-10);
}

// Helper to deduce relationship based on address, name, and age
function deduceRelation(client, head) {
  const addr = (client.address || '').toUpperCase();

  if (addr.includes('W/O') || addr.includes('W/OF') || addr.includes('WIFE')) {
    return 'Spouse';
  }
  if (addr.includes('S/O') || addr.includes('SON OF')) {
    return 'Son';
  }
  if (addr.includes('D/O') || addr.includes('DAUGHTER OF')) {
    return 'Daughter';
  }
  if (addr.includes('C/O') || addr.includes('REP BY') || addr.includes('MINOR')) {
    return 'Child';
  }

  // Age based deduction
  const getYear = (dob) => {
    if (!dob) return null;
    const match = String(dob).match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  };

  const clientYear = getYear(client.dateOfBirth);
  const headYear = getYear(head?.dateOfBirth);

  if (clientYear && headYear) {
    const diff = clientYear - headYear; // positive if client is younger
    if (diff >= 18) {
      return 'Child';
    } else if (diff <= -18) {
      return 'Father';
    } else if (Math.abs(diff) < 15) {
      return 'Spouse';
    }
  }

  return 'Member';
}

// GET: Family stats and breakdown
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  try {
    const totalClients = await Lead.countDocuments({ response: 'Converted' });
    const totalFamilies = await Family.countDocuments();
    
    const families = await Family.find().select('familyId members totalSip totalInvestment').lean();
    let multiMemberFamilies = 0;
    let singleMemberFamilies = 0;
    let totalLinkedClients = 0;

    families.forEach(f => {
      const count = f.members?.length || 0;
      if (count >= 2) multiMemberFamilies++;
      else if (count === 1) singleMemberFamilies++;
      totalLinkedClients += count;
    });

    // Detect shared phone groups among converted clients
    const clientsWithPhone = await Lead.find({ response: 'Converted', phone: { $exists: true, $ne: '' } })
      .select('phone familyId name')
      .lean();

    const phoneMap = new Map();
    clientsWithPhone.forEach(c => {
      const p = cleanPhone(c.phone);
      if (p.length === 10) {
        if (!phoneMap.has(p)) phoneMap.set(p, []);
        phoneMap.get(p).push(c);
      }
    });

    let clustersCount = 0;
    let clientsInClusters = 0;
    let unrectifiedClusters = 0;

    phoneMap.forEach((group) => {
      if (group.length > 1) {
        clustersCount++;
        clientsInClusters += group.length;
        const unlinked = group.some(c => !c.familyId);
        if (unlinked) unrectifiedClusters++;
      }
    });

    return Response.json({
      success: true,
      stats: {
        totalClients, // e.g. 2,536 individual clients
        totalFamilies,
        multiMemberFamilies,
        singleMemberFamilies,
        totalLinkedClients,
        unlinkedClients: Math.max(0, totalClients - totalLinkedClients),
        sharedPhoneClusters: clustersCount,
        clientsInClusters,
        unrectifiedClusters
      }
    });
  } catch (err) {
    console.error('Error fetching family stats:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: Run rectification algorithm in high-performance bulk operations
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  try {
    const clients = await Lead.find({ response: 'Converted' })
      .select('_id name phone address city dateOfBirth panNumber sipAmount investmentAmount familyId familyRole isFamilyHead leadId leadNumber')
      .lean();

    const phoneMap = new Map();
    clients.forEach(c => {
      const p = cleanPhone(c.phone);
      if (p.length === 10) {
        if (!phoneMap.has(p)) phoneMap.set(p, []);
        phoneMap.get(p).push(c);
      }
    });

    // Preload all existing families
    const existingFamilies = await Family.find();
    const existingFamilyMap = new Map();
    existingFamilies.forEach(f => existingFamilyMap.set(f.familyId, f));

    const newFamiliesToInsert = [];
    const familiesToSave = [];
    const leadBulkOps = [];

    let famCounter = existingFamilies.length;
    let createdCount = 0;
    let updatedCount = 0;
    let linkedMembersCount = 0;

    for (const [phone, group] of phoneMap.entries()) {
      if (group.length <= 1) continue;

      const existingFamId = group.find(m => m.familyId)?.familyId;
      let family = existingFamId ? existingFamilyMap.get(existingFamId) : null;

      if (!family) {
        // Sort to determine head: prioritize non-W/O and older or highest SIP
        const sorted = [...group].sort((a, b) => {
          const aAddr = (a.address || '').toUpperCase();
          const bAddr = (b.address || '').toUpperCase();
          const aIsWo = aAddr.includes('W/O') || aAddr.includes('WIFE') || aAddr.includes('MINOR');
          const bIsWo = bAddr.includes('W/O') || bAddr.includes('WIFE') || bAddr.includes('MINOR');
          if (aIsWo && !bIsWo) return 1;
          if (!aIsWo && bIsWo) return -1;
          return (b.sipAmount || 0) - (a.sipAmount || 0);
        });

        const head = sorted[0];
        famCounter++;
        const newFamId = `FAM-${1000 + famCounter}`;

        const members = [];
        let totalSip = 0;
        let totalInv = 0;

        for (let i = 0; i < sorted.length; i++) {
          const memberClient = sorted[i];
          const isHead = (i === 0);
          const relation = isHead ? 'Head' : deduceRelation(memberClient, head);

          members.push({
            clientId: memberClient._id,
            relationship: relation,
            joinedAt: new Date()
          });

          totalSip += (Number(memberClient.sipAmount) || 0);
          totalInv += (Number(memberClient.investmentAmount) || 0);

          leadBulkOps.push({
            updateOne: {
              filter: { _id: memberClient._id },
              update: {
                $set: {
                  familyId: newFamId,
                  familyRole: relation,
                  isFamilyHead: isHead
                }
              }
            }
          });
          linkedMembersCount++;
        }

        const newFam = new Family({
          familyId: newFamId,
          familyName: `${head.name}'s Family`,
          headClientId: head._id,
          primaryPhone: head.phone || phone,
          address: head.address || '',
          city: head.city || 'Dhanbad',
          createdBy: authUser._id,
          members,
          totalSip,
          totalInvestment: totalInv
        });

        newFamiliesToInsert.push(newFam);
        existingFamilyMap.set(newFamId, newFam);
        createdCount++;
      } else {
        // Link any members in this phone group not yet in family
        let modified = false;
        for (const memberClient of group) {
          const inFam = family.members.some(m => String(m.clientId) === String(memberClient._id));
          if (!inFam) {
            const relation = deduceRelation(memberClient, { address: family.address });
            family.members.push({
              clientId: memberClient._id,
              relationship: relation,
              joinedAt: new Date()
            });

            leadBulkOps.push({
              updateOne: {
                filter: { _id: memberClient._id },
                update: {
                  $set: {
                    familyId: family.familyId,
                    familyRole: relation,
                    isFamilyHead: false
                  }
                }
              }
            });

            family.totalSip = (family.totalSip || 0) + (Number(memberClient.sipAmount) || 0);
            family.totalInvestment = (family.totalInvestment || 0) + (Number(memberClient.investmentAmount) || 0);
            linkedMembersCount++;
            modified = true;
          }
        }
        if (modified) {
          familiesToSave.push(family);
          updatedCount++;
        }
      }
    }

    // Execute bulk DB operations in parallel batches
    if (newFamiliesToInsert.length > 0) {
      await Family.insertMany(newFamiliesToInsert);
    }
    if (familiesToSave.length > 0) {
      for (const fam of familiesToSave) {
        await fam.save();
      }
    }
    if (leadBulkOps.length > 0) {
      await Lead.bulkWrite(leadBulkOps);
    }

    return Response.json({
      success: true,
      message: `Rectification complete: Created ${createdCount} family units, updated ${updatedCount} units, and linked ${linkedMembersCount} clients into family chains.`,
      createdFamiliesCount: createdCount,
      updatedFamiliesCount: updatedCount,
      linkedMembersCount
    });
  } catch (err) {
    console.error('Error rectifying families:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
