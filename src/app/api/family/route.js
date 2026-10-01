import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Family from '@/models/Family';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, unauthorized } from '@/lib/middleware';

// Helper to recalculate family totals from member leads
async function updateFamilyTotals(familyId) {
  const family = await Family.findOne({ familyId });
  if (!family) return null;

  const memberIds = family.members.map(m => m.clientId);
  const leads = await Lead.find({ _id: { $in: memberIds } }).select('sipAmount investmentAmount');
  
  let totalSip = 0;
  let totalInvestment = 0;
  leads.forEach(l => {
    totalSip += (Number(l.sipAmount) || 0);
    totalInvestment += (Number(l.investmentAmount) || 0);
  });

  family.totalSip = totalSip;
  family.totalInvestment = totalInvestment;
  await family.save();
  return family;
}

// Helper to generate next unique FAM-XXXX ID
async function getNextFamilyId() {
  const latestFamily = await Family.findOne({ familyId: /^FAM-\d+$/ })
    .sort({ createdAt: -1 })
    .lean();

  if (latestFamily && latestFamily.familyId) {
    const numPart = parseInt(latestFamily.familyId.replace('FAM-', ''), 10);
    if (!isNaN(numPart)) {
      return `FAM-${numPart + 1}`;
    }
  }

  const count = await Family.countDocuments();
  return `FAM-${1000 + count + 1}`;
}

// GET: Get family tree for a client or family ID
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const familyId = searchParams.get('familyId');

  try {
    let family = null;
    let currentClient = null;

    if (familyId) {
      family = await Family.findOne({ familyId })
        .populate('headClientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city')
        .populate('members.clientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city isFamilyHead familyRole')
        .lean();
    } else if (clientId) {
      currentClient = await Lead.findById(clientId).lean();
      if (!currentClient) {
        return Response.json({ success: false, message: 'Client not found' }, { status: 404 });
      }

      if (currentClient.familyId) {
        family = await Family.findOne({ familyId: currentClient.familyId })
          .populate('headClientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city')
          .populate('members.clientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city isFamilyHead familyRole')
          .lean();
      }
    }

    // Find suggested family members (clients sharing same phone or matching address who aren't in this family)
    let suggestions = [];
    if (currentClient && currentClient.phone) {
      const cleanPhone = currentClient.phone.trim();
      const existingMemberIds = family ? family.members.map(m => String(m.clientId?._id || m.clientId)) : [String(currentClient._id)];

      suggestions = await Lead.find({
        _id: { $nin: existingMemberIds },
        response: 'Converted',
        phone: cleanPhone
      })
      .select('name leadId clientCode phone sipAmount dateOfBirth panNumber address city')
      .limit(10)
      .lean();
    }

    return Response.json({
      success: true,
      family,
      currentClient,
      suggestions
    });
  } catch (err) {
    console.error('Error fetching family:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: Add family member (either existing or manual creation)
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  try {
    const body = await request.json();
    const { mode, clientId, targetClientId, relationship = 'Other', newMember = {} } = body;

    if (!clientId) {
      return Response.json({ success: false, message: 'Source clientId is required' }, { status: 400 });
    }

    const sourceClient = await Lead.findById(clientId);
    if (!sourceClient) {
      return Response.json({ success: false, message: 'Source client not found' }, { status: 404 });
    }

    let family = null;
    if (sourceClient.familyId) {
      family = await Family.findOne({ familyId: sourceClient.familyId });
    }

    // If source client doesn't have a family, create one
    if (!family) {
      const newFamId = await getNextFamilyId();
      family = new Family({
        familyId: newFamId,
        familyName: `${sourceClient.name}'s Family`,
        headClientId: sourceClient._id,
        primaryPhone: sourceClient.phone || '',
        address: sourceClient.address || '',
        city: sourceClient.city || 'Dhanbad',
        createdBy: authUser._id,
        members: [
          {
            clientId: sourceClient._id,
            relationship: 'Head',
            joinedAt: new Date()
          }
        ]
      });

      sourceClient.familyId = newFamId;
      sourceClient.familyRole = 'Head';
      sourceClient.isFamilyHead = true;
      await sourceClient.save();
    }

    let linkedLead = null;

    if (mode === 'existing') {
      // MODE 1: LINK EXISTING CLIENT
      if (!targetClientId) {
        return Response.json({ success: false, message: 'targetClientId is required for existing mode' }, { status: 400 });
      }

      if (String(clientId) === String(targetClientId)) {
        return Response.json({ success: false, message: 'Cannot add client as their own family member' }, { status: 400 });
      }

      linkedLead = await Lead.findById(targetClientId);
      if (!linkedLead) {
        return Response.json({ success: false, message: 'Target client not found' }, { status: 404 });
      }

      // Check if already in this family
      const alreadyMember = family.members.some(m => String(m.clientId) === String(targetClientId));
      if (!alreadyMember) {
        family.members.push({
          clientId: linkedLead._id,
          relationship: relationship || 'Member',
          joinedAt: new Date()
        });
      } else {
        // Update relationship if already present
        const member = family.members.find(m => String(m.clientId) === String(targetClientId));
        if (member) member.relationship = relationship;
      }

      linkedLead.familyId = family.familyId;
      linkedLead.familyRole = relationship || 'Member';
      linkedLead.isFamilyHead = (relationship === 'Head');
      await linkedLead.save();

      // Log activity
      try {
        await ActivityLog.create({
          userId: authUser._id,
          action: 'Family Member Linked',
          entityType: 'Lead',
          entityId: sourceClient._id,
          details: { description: `Linked ${linkedLead.name} (${linkedLead.leadId || 'Client'}) as ${relationship} to family ${family.familyId}.` }
        });
      } catch (logErr) {
        console.warn('ActivityLog error:', logErr.message);
      }

    } else if (mode === 'manual') {
      // MODE 2: CREATE NEW CLIENT MANUALLY AND LINK
      if (!newMember.name || !newMember.name.trim()) {
        return Response.json({ success: false, message: 'Name is required for manual entry' }, { status: 400 });
      }

      const sipVal = Number(newMember.sipAmount);
      const defaultSip = (!isNaN(sipVal) && sipVal >= 0) ? sipVal : 1000;

      // Auto-assign next sequential INV-XXXX
      const highestLead = await Lead.findOne({ leadNumber: { $exists: true, $ne: null } })
        .sort({ leadNumber: -1 })
        .select('leadNumber')
        .lean();
      const nextNum = (highestLead && typeof highestLead.leadNumber === 'number') ? highestLead.leadNumber + 1 : 1001;

      linkedLead = new Lead({
        name: newMember.name.trim(),
        phone: newMember.phone?.trim() || sourceClient.phone || '',
        dateOfBirth: newMember.dateOfBirth?.trim() || '',
        panNumber: newMember.panNumber?.trim()?.toUpperCase() || '',
        aadhaarNumber: newMember.aadhaarNumber?.trim() || '',
        service: newMember.service?.trim() || 'Mutual Funds',
        schemeName: newMember.schemeName?.trim() || '',
        sipAmount: defaultSip,
        investmentAmount: Number(newMember.investmentAmount) || 0,
        investmentType: 'Monthly SIP',
        sipDay: newMember.sipDay ? Number(newMember.sipDay) : null,
        response: 'Converted',
        stage: 'Converted',
        status: 'Active Client',
        leadNumber: nextNum,
        leadId: `INV-${nextNum}`,
        clientCode: `INV-${nextNum}`,
        city: sourceClient.city || 'Dhanbad',
        location: sourceClient.location || sourceClient.city || 'Dhanbad',
        address: sourceClient.address || '',
        source: 'Family Referral',
        leadReference: `Family: ${sourceClient.name} (${sourceClient.leadId || ''})`,
        createdBy: authUser._id,
        assignedTo: sourceClient.assignedTo || authUser._id,
        familyId: family.familyId,
        familyRole: relationship || 'Member',
        isFamilyHead: false,
      });

      if (newMember.schemeName?.trim() && defaultSip > 0) {
        linkedLead.schemes = [{
          service: linkedLead.service,
          investmentType: 'Monthly SIP',
          schemeName: newMember.schemeName.trim(),
          sipAmount: defaultSip,
          sipDay: linkedLead.sipDay,
          investmentAmount: linkedLead.investmentAmount,
          remarks: `Family SIP under ${sourceClient.name}`
        }];
      }

      await linkedLead.save();

      family.members.push({
        clientId: linkedLead._id,
        relationship: relationship || 'Member',
        joinedAt: new Date()
      });

      // Log activity
      try {
        await ActivityLog.create({
          userId: authUser._id,
          action: 'New Family Member Created & Linked',
          entityType: 'Lead',
          entityId: sourceClient._id,
          details: { description: `Created new client ${linkedLead.name} (${linkedLead.leadId}) as ${relationship} with ₹${defaultSip} SIP.` }
        });
      } catch (logErr) {
        console.warn('ActivityLog error:', logErr.message);
      }
    } else {
      return Response.json({ success: false, message: 'Invalid mode. Use "existing" or "manual"' }, { status: 400 });
    }

    await family.save();
    await updateFamilyTotals(family.familyId);

    // Return the updated populated family
    const populatedFamily = await Family.findOne({ familyId: family.familyId })
      .populate('headClientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city')
      .populate('members.clientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city isFamilyHead familyRole')
      .lean();

    return Response.json({
      success: true,
      message: `Family member successfully added!`,
      family: populatedFamily,
      linkedClient: linkedLead
    });

  } catch (err) {
    console.error('Error adding family member:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT: Update member relationship or set head
export async function PUT(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  try {
    const body = await request.json();
    const { familyId, memberClientId, relationship, makeHead } = body;

    if (!familyId || !memberClientId) {
      return Response.json({ success: false, message: 'familyId and memberClientId are required' }, { status: 400 });
    }

    const family = await Family.findOne({ familyId });
    if (!family) {
      return Response.json({ success: false, message: 'Family not found' }, { status: 404 });
    }

    const member = family.members.find(m => String(m.clientId) === String(memberClientId));
    if (!member) {
      return Response.json({ success: false, message: 'Member not found in family' }, { status: 404 });
    }

    if (relationship) {
      member.relationship = relationship;
      await Lead.findByIdAndUpdate(memberClientId, { familyRole: relationship });
    }

    if (makeHead) {
      // Remove head from previous head
      if (family.headClientId) {
        await Lead.findByIdAndUpdate(family.headClientId, { isFamilyHead: false, familyRole: 'Member' });
        const oldHeadMember = family.members.find(m => String(m.clientId) === String(family.headClientId));
        if (oldHeadMember) oldHeadMember.relationship = 'Member';
      }
      family.headClientId = memberClientId;
      member.relationship = 'Head';
      await Lead.findByIdAndUpdate(memberClientId, { isFamilyHead: true, familyRole: 'Head' });
    }

    await family.save();
    await updateFamilyTotals(familyId);

    const populatedFamily = await Family.findOne({ familyId })
      .populate('headClientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city')
      .populate('members.clientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city isFamilyHead familyRole')
      .lean();

    return Response.json({ success: true, family: populatedFamily });
  } catch (err) {
    console.error('Error updating family member:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE: Unlink member from family
export async function DELETE(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId');
  const clientId = searchParams.get('clientId');

  if (!familyId || !clientId) {
    return Response.json({ success: false, message: 'familyId and clientId are required' }, { status: 400 });
  }

  try {
    const family = await Family.findOne({ familyId });
    if (!family) {
      return Response.json({ success: false, message: 'Family not found' }, { status: 404 });
    }

    // Filter out the member
    family.members = family.members.filter(m => String(m.clientId) !== String(clientId));

    // Reset client family fields
    await Lead.findByIdAndUpdate(clientId, {
      familyId: '',
      familyRole: '',
      isFamilyHead: false
    });

    // If head was removed, designate next member as head if available
    if (String(family.headClientId) === String(clientId)) {
      if (family.members.length > 0) {
        family.headClientId = family.members[0].clientId;
        family.members[0].relationship = 'Head';
        await Lead.findByIdAndUpdate(family.headClientId, { isFamilyHead: true, familyRole: 'Head' });
      } else {
        family.headClientId = null;
      }
    }

    if (family.members.length === 0) {
      await Family.deleteOne({ _id: family._id });
      return Response.json({ success: true, message: 'Family unit dissolved as no members remain' });
    }

    await family.save();
    await updateFamilyTotals(familyId);

    const populatedFamily = await Family.findOne({ familyId })
      .populate('headClientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city')
      .populate('members.clientId', 'name leadId clientCode phone sipAmount investmentAmount schemeName schemes dateOfBirth panNumber address city isFamilyHead familyRole')
      .lean();

    return Response.json({ success: true, message: 'Member unlinked from family', family: populatedFamily });
  } catch (err) {
    console.error('Error unlinking family member:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
