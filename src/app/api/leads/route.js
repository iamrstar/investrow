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

  // Role-based filtering
  if (authUser.role === 'user') {
    criteria.push({ assignedTo: authUser._id });
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
  if (response) {
    criteria.push({ response });
  } else {
    // Default: exclude converted leads from lead management
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
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  // Allow all roles to create leads
  if (!checkRole(authUser, ['admin', 'user'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();

    const settings = await FormControl.findOne({ singletonId: 'settings' }).lean();
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

