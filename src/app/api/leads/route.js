import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import FormControl from '@/models/FormControl';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const service = searchParams.get('service');
  const response = searchParams.get('response');
  const callStatus = searchParams.get('callStatus');
  const assignedTo = searchParams.get('assignedTo');
  const followUpDate = searchParams.get('followUpDate');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 20;

  const criteria = [];

  if (startDate || endDate) {
    const dateQuery = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      dateQuery.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateQuery.$lte = e;
    }
    criteria.push({
      $or: [
        { followUpDate: dateQuery },
        { nextCallDate: dateQuery }
      ]
    });
  } else if (followUpDate) {
    const start = new Date(followUpDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(followUpDate);
    end.setHours(23, 59, 59, 999);
    criteria.push({
      $or: [
        { followUpDate: { $gte: start, $lte: end } },
        { nextCallDate: { $gte: start, $lte: end } }
      ]
    });
  }

  // Role-based filtering: Admins see all leads; staff users see assigned leads, unassigned leads, or leads they created
  if (authUser.role === 'user') {
    criteria.push({
      $or: [
        { assignedTo: authUser._id },
        { assignedTo: null },
        { createdBy: authUser._id }
      ]
    });
  }

  if (search) {
    criteria.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    });
  }

  if (service) criteria.push({ service });

  // Status mapping matching Panel 4 tabs
  const status = searchParams.get('status') || searchParams.get('response');
  const scope = searchParams.get('scope');

  if (status && status !== 'All') {
    if (status === 'New') {
      criteria.push({ 
        $or: [{ response: 'New' }, { response: 'Pending' }, { stage: 'New' }],
        response: { $ne: 'Converted' },
        stage: { $ne: 'Converted' }
      });
    } else if (status === 'Interested') {
      criteria.push({ 
        $or: [{ response: 'Interested' }, { response: 'Positive' }, { stage: 'Interested' }],
        response: { $ne: 'Converted' },
        stage: { $ne: 'Converted' }
      });
    } else if (status === 'Contacted') {
      criteria.push({ 
        $or: [{ response: 'Contacted' }, { stage: 'Contacted' }],
        response: { $ne: 'Converted' },
        stage: { $ne: 'Converted' }
      });
    } else if (status === 'Meeting') {
      criteria.push({ 
        $or: [{ response: 'Meeting' }, { stage: 'Meeting' }],
        response: { $ne: 'Converted' },
        stage: { $ne: 'Converted' }
      });
    } else if (status === 'Documents') {
      criteria.push({ 
        $or: [{ response: 'Documents' }, { stage: 'Documents' }],
        response: { $ne: 'Converted' },
        stage: { $ne: 'Converted' }
      });
    } else if (status === 'Converted') {
      criteria.push({ $or: [{ response: 'Converted' }, { stage: 'Converted' }] });
    } else if (status === 'Lost') {
      criteria.push({ $or: [{ response: 'Lost' }, { response: 'Negative' }, { stage: 'Lost' }] });
    } else {
      criteria.push({ response: status });
    }
  } else if (scope === 'leads_only') {
    criteria.push({ response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } });
  }

  if (callStatus) criteria.push({ callStatus });

  if (assignedTo) {
    criteria.push({ assignedTo: assignedTo === 'unassigned' ? null : assignedTo });
  }

  const filter = criteria.length === 0 ? {} : (criteria.length === 1 ? criteria[0] : { $and: criteria });

  const baseRoleFilter = authUser.role === 'user' ? {
    $or: [
      { assignedTo: authUser._id },
      { assignedTo: null },
      { createdBy: authUser._id }
    ]
  } : {};

  const [
    total,
    leads,
    countAll,
    countNew,
    countContacted,
    countInterested,
    countMeeting,
    countDocuments,
    countConverted,
    countLost,
  ] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lead.countDocuments(baseRoleFilter),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'New' }, { response: 'Pending' }, { stage: 'New' }], response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Contacted' }, { stage: 'Contacted' }], response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Interested' }, { response: 'Positive' }, { stage: 'Interested' }], response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Meeting' }, { stage: 'Meeting' }], response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Documents' }, { stage: 'Documents' }], response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Converted' }, { stage: 'Converted' }] }),
    Lead.countDocuments({ ...baseRoleFilter, $or: [{ response: 'Lost' }, { response: 'Negative' }, { stage: 'Lost' }] }),
  ]);

  return Response.json({
    leads,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    counts: {
      All: countAll,
      New: countNew,
      Contacted: countContacted,
      Interested: countInterested,
      Meeting: countMeeting,
      Documents: countDocuments,
      Converted: countConverted,
      Lost: countLost,
    }
  });
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  // Allow all roles to create leads
  if (!checkRole(authUser, ['admin', 'user'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();

    // Harmonize field names
    if (body.city && !body.location) body.location = body.city;
    if (body.location && !body.city) body.city = body.location;
    if (body.source && !body.leadReference) body.leadReference = body.source;
    if (body.leadReference && !body.source) body.source = body.leadReference;
    if (body.mobile && !body.phone) body.phone = body.mobile;
    if (body.phone && !body.mobile) body.mobile = body.phone;
    if (!body.service) body.service = body.product || 'Mutual Funds';
    if (!body.location) body.location = body.city || 'Dhanbad';
    if (!body.leadReference) body.leadReference = body.source || 'Website';

    const isConverted = body.response === 'Converted';
    const settingsType = isConverted ? 'client' : 'lead';
    const settings = await FormControl.findOne({ singletonId: `${settingsType}_settings` }).lean();

    if (settings) {
      if (settings.defaultFields) {
        for (const field of settings.defaultFields) {
          // Allow location and leadReference if we have fallbacks
          if (['location', 'leadReference'].includes(field.name) && (body.location || body.leadReference)) continue;
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

    // Sanitize values that fail Mongoose casts
    if (body.assignedTo === '' || body.assignedTo === 'unassigned') {
      body.assignedTo = null;
    }
    if (body.nextCallDate === '' || body.nextCallDate === null) {
      body.nextCallDate = null;
    }
    if (body.followUpDate === '' || body.followUpDate === null) {
      body.followUpDate = null;
    }

    // Harmonize stage and response
    if (!body.stage && !body.response) {
      body.stage = 'New';
      body.response = 'New';
    } else if (body.response && !body.stage) {
      if (['Positive', 'Interested'].includes(body.response)) {
        body.stage = 'Interested';
        body.response = 'Interested';
      } else if (['Negative', 'Lost'].includes(body.response)) {
        body.stage = 'Lost';
        body.response = 'Lost';
      } else if (['New', 'Pending'].includes(body.response)) {
        body.stage = 'New';
        body.response = 'New';
      } else {
        body.stage = body.response;
      }
    } else if (body.stage && !body.response) {
      body.response = body.stage;
    } else if (body.stage && body.response) {
      if (['Positive', 'Interested'].includes(body.response)) {
        body.stage = 'Interested';
        body.response = 'Interested';
      } else if (['Negative', 'Lost'].includes(body.response)) {
        body.stage = 'Lost';
        body.response = 'Lost';
      } else if (['New', 'Pending'].includes(body.response)) {
        body.stage = 'New';
        body.response = 'New';
      } else {
        body.stage = body.response;
      }
    }

    if (body.nextCallDate && !body.followUpDate) body.followUpDate = body.nextCallDate;
    if (body.followUpDate && !body.nextCallDate) body.nextCallDate = body.followUpDate;

    // Auto-assign to creator if not explicitly assigned (Users are always auto-assigned to themselves)
    if (authUser.role === 'user' || !body.assignedTo) {
      body.assignedTo = authUser._id;
    }

    const lead = await Lead.create({
      ...body,
      createdBy: authUser._id,
    });

    await ActivityLog.create({
      userId: authUser._id,
      action: `Created lead: ${lead.name}`,
      entityType: 'Lead',
      entityId: lead._id,
      details: { name: lead.name, service: lead.service, phone: lead.phone },
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

