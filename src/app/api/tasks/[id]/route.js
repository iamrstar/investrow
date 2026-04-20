import dbConnect from '@/lib/db';
import Task from '@/models/Task';
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

    const task = await Task.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    await ActivityLog.create({
      userId: authUser._id,
      action: `Updated task: ${task.title}`,
      entityType: 'Task',
      entityId: task._id,
      details: body,
    });

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
