import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

import FollowUp from '@/models/FollowUp';

async function canAccessLead(authUser, lead) {
  if (authUser.role === 'admin') return true;

  const assignedId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();
  const createdById = lead.createdBy?._id?.toString() || lead.createdBy?.toString();

  if (authUser.role === 'user') {
    return assignedId === authUser._id || createdById === authUser._id;
  }
  if (authUser.role === 'manager') {
    if (createdById === authUser._id) return true;
    const teamUsers = await User.find({ managerId: authUser._id }).select('_id').lean();
    return teamUsers.some(u => u._id.toString() === assignedId);
  }
  return false;
}

export async function GET(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email phone')
    .populate('createdBy', 'name email')
    .lean();

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!(await canAccessLead(authUser, lead))) return forbidden();

  // Get follow-up history
  const followups = await FollowUp.find({ leadId: id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // Get generic activity logs for this lead
  const activities = await ActivityLog.find({ entityType: 'Lead', entityId: id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return Response.json({ lead, activities, followups });
}

export async function PUT(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const existingLead = await Lead.findById(id).lean();
  if (!existingLead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!(await canAccessLead(authUser, existingLead))) return forbidden();

  try {
    const body = await request.json();
    const lead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Track changes
    const changes = {};
    for (const key of Object.keys(body)) {
      // Skip internal fields
      if (['_id', 'createdAt', 'updatedAt', 'createdBy', '__v'].includes(key)) continue;

      let oldVal = existingLead[key];
      let newVal = body[key];

      // Standardize comparison for dates
      if (oldVal instanceof Date || (typeof oldVal === 'string' && !isNaN(Date.parse(oldVal)) && oldVal.includes('-'))) {
        const oldTime = oldVal ? new Date(oldVal).getTime() : 0;
        const newTime = newVal ? new Date(newVal).getTime() : 0;
        if (oldTime !== newTime) {
          changes[key] = { from: oldVal, to: newVal };
        }
      } 
      // Standardize comparison for strings/others
      else if (String(oldVal || '') !== String(newVal || '')) {
        changes[key] = { from: oldVal, to: newVal };
      }
    }

    if (Object.keys(changes).length > 0) {
      await ActivityLog.create({
        userId: authUser._id,
        action: `Follow-up: Updated ${Object.keys(changes).join(', ')}`,
        entityType: 'Lead',
        entityId: lead._id,
        details: changes,
      });
    }

    return Response.json({ success: true, lead });
  } catch (error) {
    console.error('Update lead error:', error);
    return Response.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  await dbConnect();
  const { id } = await params;

  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  await ActivityLog.create({
    userId: authUser._id,
    action: `Deleted lead: ${lead.name}`,
    entityType: 'Lead',
    entityId: lead._id,
    details: { name: lead.name, phone: lead.phone },
  });

  return Response.json({ success: true });
}
