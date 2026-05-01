import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import { sendEmail, templates } from '@/lib/email';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const criteria = [];
  
  if (authUser.role === 'user') {
    criteria.push({ assignedTo: authUser._id });
  }

  if (status) criteria.push({ status });
  if (priority) criteria.push({ priority });

  const filter = criteria.length === 0 ? {} : (criteria.length === 1 ? criteria[0] : { $and: criteria });

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('leadId', 'name phone')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return Response.json({ tasks });
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  try {
    await dbConnect();
    const body = await request.json();

    const task = await Task.create({
      ...body,
      createdBy: authUser._id,
    });

    await ActivityLog.create({
      userId: authUser._id,
      action: `Created task: ${task.title}`,
      entityType: 'Task',
      entityId: task._id,
      details: { title: task.title, assignedTo: task.assignedTo },
    });

    // Notify assigned user
    if (task.assignedTo) {
      const assignedUser = await User.findById(task.assignedTo);
      if (assignedUser) {
        const emailTemplate = templates.taskAlert(task.title, task.dueDate, authUser.name);
        await sendEmail({
          to: assignedUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return Response.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return Response.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
