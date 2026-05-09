import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const baseFilter = {};
  if (authUser.role === 'user') {
    baseFilter.assignedTo = authUser._id;
  }

  // Today range
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  // Count Lead Tasks (type: 'Task')
  const leadTasks = await Task.countDocuments({ ...baseFilter, type: 'Task', status: { $ne: 'Completed' } });

  // Count Meetings (type: 'Meeting')
  const meetings = await Task.countDocuments({ ...baseFilter, type: 'Meeting', status: { $ne: 'Completed' } });

  // Count Calls (type: 'Call')
  const calls = await Task.countDocuments({ ...baseFilter, type: 'Call', status: { $ne: 'Completed' } });

  // Count for Tabs (Total/Filtered by date)
  const today = await Task.countDocuments({
    ...baseFilter,
    $or: [
      { dueDate: { $gte: todayStart, $lte: todayEnd } },
      { scheduledAt: { $gte: todayStart, $lte: todayEnd } }
    ]
  });

  const upcoming = await Task.countDocuments({
    ...baseFilter,
    $or: [
      { dueDate: { $gt: todayEnd } },
      { scheduledAt: { $gt: todayEnd } }
    ]
  });

  const missed = await Task.countDocuments({
    ...baseFilter,
    status: { $ne: 'Completed' },
    $or: [
      { dueDate: { $lt: todayStart } },
      { scheduledAt: { $lt: todayStart } }
    ]
  });

  return Response.json({
    counts: {
      leadTasks,
      meetings,
      calls,
    },
    tabs: {
      today,
      upcoming,
      missed
    }
  });
}
