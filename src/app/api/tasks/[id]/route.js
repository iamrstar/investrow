import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import Lead from '@/models/Lead';
import FollowUp from '@/models/FollowUp';
import { getAuthUser, unauthorized } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const task = await Task.findById(id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('leadId', 'name phone service')
    .lean();

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  return Response.json({ task });
}

export async function PUT(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData = { ...body };

    if (body.status === 'Accepted') {
      updateData.acceptedAt = new Date();
      updateData.acceptedBy = authUser._id;
    } else if (body.status === 'Completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = authUser._id;
      if (body.remarks !== undefined) updateData.remarks = body.remarks;
      if (body.screenshot !== undefined) updateData.screenshot = body.screenshot;
    }

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate({ path: 'assignedTo', select: 'name email role', strictPopulate: false })
      .populate({ path: 'createdBy', select: 'name email role', strictPopulate: false })
      .populate({ path: 'acceptedBy', select: 'name email role', strictPopulate: false })
      .populate({ path: 'completedBy', select: 'name email role', strictPopulate: false })
      .populate({ path: 'leadId', select: 'name phone service leadId', strictPopulate: false });

    const actionText = body.status === 'Accepted' 
      ? `Accepted task: ${task.title}` 
      : body.status === 'Completed' 
        ? `Completed task: ${task.title}` 
        : `Updated task: ${task.title}`;

    await ActivityLog.create({
      userId: authUser._id,
      action: actionText,
      entityType: 'Task',
      entityId: task._id,
      details: { 
        status: task.status,
        remarks: task.remarks,
        screenshot: task.screenshot,
        completedBy: authUser.name
      },
    });

    // If task is completed and linked to a client/lead, create a FollowUp entry
    if (body.status === 'Completed' && task.leadId) {
      try {
        const FollowUp = (await import('@/models/FollowUp')).default;
        const targetLeadId = task.leadId?._id || task.leadId;
        const proofNotice = task.screenshot ? ' • [Proof Screenshot Attached]' : '';
        const remarkText = task.remarks ? `Remarks: "${task.remarks}"` : 'Task marked as completed';

        await FollowUp.create({
          leadId: targetLeadId,
          userId: authUser._id,
          medium: task.type === 'Call' ? 'Phone Call' : (task.type === 'Meeting' ? 'In-Person Meeting' : 'Office Visit'),
          callStatus: 'Completed',
          response: 'Completed',
          remarks: `Task Completed by ${authUser.name}: "${task.title}". ${remarkText}${proofNotice}`,
          interactionDate: new Date(),
        });
      } catch (fuErr) {
        console.warn('Lead task completion follow-up warning:', fuErr.message);
      }
    }

    return Response.json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
