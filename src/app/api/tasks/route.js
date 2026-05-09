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
  const type = searchParams.get('type');
  const dateFilter = searchParams.get('dateFilter'); // today, tomorrow, upcoming, missed
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const criteria = [];
  
  if (authUser.role === 'user') {
    criteria.push({ assignedTo: authUser._id });
  }

  if (status) criteria.push({ status });
  if (priority) criteria.push({ priority });
  if (type) criteria.push({ type });

  // Date Filtering logic
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  if (dateFilter === 'today') {
    criteria.push({ 
      $or: [
        { dueDate: { $gte: todayStart, $lte: todayEnd } },
        { scheduledAt: { $gte: todayStart, $lte: todayEnd } }
      ]
    });
  } else if (dateFilter === 'tomorrow') {
    const tomStart = new Date(todayStart);
    tomStart.setDate(tomStart.getDate() + 1);
    const tomEnd = new Date(todayEnd);
    tomEnd.setDate(tomEnd.getDate() + 1);
    criteria.push({ 
      $or: [
        { dueDate: { $gte: tomStart, $lte: tomEnd } },
        { scheduledAt: { $gte: tomStart, $lte: tomEnd } }
      ]
    });
  } else if (dateFilter === 'upcoming') {
    criteria.push({ 
      $or: [
        { dueDate: { $gt: todayEnd } },
        { scheduledAt: { $gt: todayEnd } }
      ]
    });
  } else if (dateFilter === 'missed') {
    criteria.push({ 
      status: { $ne: 'Completed' },
      $or: [
        { dueDate: { $lt: todayStart } },
        { scheduledAt: { $lt: todayStart } }
      ]
    });
  } else if (startDate || endDate) {
    const rangeFilter = {};
    if (startDate) rangeFilter.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    if (endDate) rangeFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    
    criteria.push({
      $or: [
        { dueDate: rangeFilter },
        { scheduledAt: rangeFilter }
      ]
    });
  }

  const filter = criteria.length === 0 ? {} : (criteria.length === 1 ? criteria[0] : { $and: criteria });

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('leadId', 'name phone')
    .sort({ scheduledAt: 1, dueDate: 1, createdAt: -1 })
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
