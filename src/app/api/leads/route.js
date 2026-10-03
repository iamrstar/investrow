import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import FormControl from '@/models/FormControl';
import FollowUp from '@/models/FollowUp';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const includeConverted = searchParams.get('includeConverted');
  const service = searchParams.get('service');
  const response = searchParams.get('response');
  const callStatus = searchParams.get('callStatus');
  const assignedTo = searchParams.get('assignedTo');
  const followUpDate = searchParams.get('followUpDate');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 20;

  const criteria = [];

  if (followUpDate) {   
    const start = new Date(followUpDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(followUpDate);
    end.setHours(23, 59, 59, 999);
    criteria.push({
      followUpDate: { $gte: start, $lte: end }
    });
  }

  // Role-based filtering: Admins see all leads/clients. Non-admins (Relationship Managers / staff) only see leads/clients they created/onboarded OR that are assigned to them
  if (authUser.role !== 'admin') {
    criteria.push({
      $or: [
        { assignedTo: authUser._id },
        { createdBy: authUser._id }
      ]
    });
  }

  if (search) {
    const trimmed = search.trim();
    const isNum = !isNaN(Number(trimmed)) && trimmed !== '';
    const searchRegex = { $regex: trimmed, $options: 'i' };
    const searchConditions = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { leadId: searchRegex },
      { clientCode: searchRegex },
      { panNumber: searchRegex },
      { aadhaarNumber: searchRegex },
      { schemeName: searchRegex },
      { 'schemes.schemeName': searchRegex },
      { location: searchRegex },
      { city: searchRegex },
      { bankName: searchRegex },
      { bankAccountNumber: searchRegex },
    ];
    if (isNum) {
      searchConditions.push({ leadNumber: Number(trimmed) });
    }
    criteria.push({ $or: searchConditions });
  }

  if (service) {
    if (service.toLowerCase() === 'insurance') {
      const insRegex = /insurance/i;
      criteria.push({
        $or: [
          { service: insRegex },
          { 'schemes.service': insRegex }
        ]
      });
    } else {
      criteria.push({
        $or: [
          { service: service },
          { 'schemes.service': service }
        ]
      });
    }
  }
  if (response && response !== 'All') {
    criteria.push({ response });
  } else if (!response && !search && includeConverted !== 'true') {
    // Default: exclude converted leads from lead management ONLY when no explicit search/filter is requested
    criteria.push({ response: { $ne: 'Converted' } });
  }
  if (callStatus) criteria.push({ callStatus });

  if (assignedTo) {
    criteria.push({ assignedTo: assignedTo === 'unassigned' ? null : assignedTo });
  }


  const filter = criteria.length === 0 ? {} : (criteria.length === 1 ? criteria[0] : { $and: criteria });

  const total = await Lead.countDocuments(filter);
  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return Response.json({
    leads,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  // Allow all roles to create leads
  if (!checkRole(authUser, ['admin', 'user', 'relationship_manager', 'rm'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();

    // Harmonize source/leadReference and city/location
    if (body.source && !body.leadReference) body.leadReference = body.source;
    if (body.leadReference && !body.source) body.source = body.leadReference;
    if (body.city && !body.location) body.location = body.city;
    if (body.location && !body.city) body.city = body.location;
    if (!body.location && !body.city) {
      body.city = 'Dhanbad';
      body.location = 'Dhanbad';
    }
    if (!body.source && !body.leadReference) {
      body.source = 'Website';
      body.leadReference = 'Website';
    }

    const isConverted = body.response === 'Converted';
    const settingsType = isConverted ? 'client' : 'lead';
    const settings = await FormControl.findOne({ singletonId: `${settingsType}_settings` }).lean();

    if (settings) {
      if (settings.defaultFields) {
        for (const field of settings.defaultFields) {
          if (field.isRequired && (!body[field.name] || String(body[field.name]).trim() === '')) {
            return Response.json({ error: `${field.label || field.name} is required` }, { status: 400 });
          }
        }
      }
      
      if (settings.globalCustomFields) {
        for (const gField of settings.globalCustomFields) {
          if (gField.isRequired) {
            const customFieldValue = body.customFields?.find(f => f.label === gField.label)?.value;
            if (!customFieldValue || String(customFieldValue).trim() === '') {
              return Response.json({ error: `${gField.label} is required` }, { status: 400 });
            }
          }
        }
      }
    } else {
      if (!body.name) return Response.json({ error: 'Name is required' }, { status: 400 });
      if (!body.phone) return Response.json({ error: 'Phone is required' }, { status: 400 });
      if (!body.service) return Response.json({ error: 'Service is required' }, { status: 400 });
    }

    // Auto-assign to creator if not explicitly assigned
    if (!body.assignedTo) {
      body.assignedTo = authUser._id;
    }

    // Auto-generate sequential leadNumber and leadId (e.g. INV-1095)
    if (!body.leadNumber || !body.leadId) {
      const highestLead = await Lead.findOne({ leadNumber: { $exists: true, $ne: null } })
        .sort({ leadNumber: -1 })
        .select('leadNumber')
        .lean();
      const nextNum = (highestLead && typeof highestLead.leadNumber === 'number') ? highestLead.leadNumber + 1 : 1001;
      body.leadNumber = nextNum;
      body.leadId = `INV-${nextNum}`;
    }

    const lead = await Lead.create({
      ...body,
      createdBy: authUser._id,
    });

    // Populate assigned user info for accurate history logging
    const assignedUser = body.assignedTo ? await User.findById(body.assignedTo).select('name email').lean() : null;

    // Create initial FollowUp record so onboarding & initial assignment appear immediately in Follow-up History
    try {
      await FollowUp.create({
        leadId: lead._id,
        userId: authUser._id,
        medium: lead.response === 'Converted' ? 'Office Visit' : 'Phone Call',
        callStatus: lead.callStatus || (lead.response === 'Converted' ? 'Received' : 'Pending'),
        response: lead.response || 'New',
        stage: lead.stage || (lead.response === 'Converted' ? 'Converted' : 'New'),
        service: lead.service || 'Mutual Funds',
        sipAmount: lead.sipAmount || 0,
        investmentAmount: lead.investmentAmount || 0,
        schemeName: lead.schemeName || '',
        remarks: lead.response === 'Converted'
          ? `Client Onboarded by ${authUser.name} with ₹${Number(lead.sipAmount || 0).toLocaleString('en-IN')} Monthly SIP. Assigned to: ${assignedUser ? assignedUser.name : authUser.name}`
          : `Lead created by ${authUser.name}. Assigned to: ${assignedUser ? assignedUser.name : authUser.name}`,
        interactionDate: new Date(),
      });
    } catch (fErr) {
      console.warn('Initial FollowUp create error:', fErr.message);
    }

    await ActivityLog.create({
      userId: authUser._id,
      action: `Created lead: ${lead.name}`,
      entityType: 'Lead',
      entityId: lead._id,
      details: { 
        name: lead.name, 
        service: lead.service, 
        phone: lead.phone,
        assignedTo: assignedUser?.name || 'Self',
        createdBy: authUser.name
      },
    });

    return Response.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return Response.json({ error: messages.join(', ') }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

