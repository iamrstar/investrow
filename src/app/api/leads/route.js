import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

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
  const managerId = searchParams.get('managerId');
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
    criteria.push({
      $or: [
        { assignedTo: authUser._id },
        { createdBy: authUser._id }
      ]
    });
  } else if (authUser.role === 'manager') {
    const teamUsers = await User.find({ managerId: authUser._id }).select('_id').lean();
    const teamUserIds = teamUsers.map(u => u._id);
    criteria.push({
      $or: [
        { createdBy: { $in: [...teamUserIds, authUser._id] } },
        { assignedTo: { $in: [...teamUserIds, authUser._id] } }, // Include leads assigned to manager
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
  if (response) {
    criteria.push({ response });
  } else {
    // Default: exclude converted leads from lead management
    criteria.push({ response: { $ne: 'Converted' } });
  }
  if (callStatus) criteria.push({ callStatus });

  // Exclude unassigned leads from general list unless explicitly requested
  if (!assignedTo) {
    criteria.push({ assignedTo: { $ne: null } });
  } else if (assignedTo === 'unassigned') {
    if (authUser.role === 'manager') {
      // For managers, 'unassigned' means leads assigned to THEM but not yet delegated to their team
      criteria.push({ assignedTo: authUser._id });
    } else {
      criteria.push({ assignedTo: null });
    }
  } else {
    criteria.push({ assignedTo });
  }
  if (managerId) {
    const teamUsers = await User.find({ managerId }).select('_id').lean();
    const teamUserIds = teamUsers.map(u => u._id);
    criteria.push({ assignedTo: { $in: teamUserIds } });
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
  if (!checkRole(authUser, ['admin', 'manager', 'user'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();

    // If role is 'user', they cannot assign it to someone else
    if (authUser.role === 'user') {
      delete body.assignedTo;
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

