import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const baseFilter = {};
  if (authUser.role === 'user') {
    baseFilter.assignedTo = authUser._id;
  }

  // Category counts (Cards) should always show the total for each type, regardless of selected type
  const leadTasksCount = await Task.countDocuments({ ...baseFilter, type: 'Task', status: { $ne: 'Completed' } });
  const meetingsCount = await Task.countDocuments({ ...baseFilter, type: 'Meeting', status: { $ne: 'Completed' } });
  const callsCount = await Task.countDocuments({ ...baseFilter, type: 'Call', status: { $ne: 'Completed' } });

  // Tab counts should respect the selected type card
  const tabFilter = { ...baseFilter };
  if (type) {
    tabFilter.type = type;
  }

  // Today range
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  // Count for Tabs (Today/Upcoming/Missed)
  const today = await Task.countDocuments({
    ...tabFilter,
    $or: [
      { dueDate: { $gte: todayStart, $lte: todayEnd } },
      { scheduledAt: { $gte: todayStart, $lte: todayEnd } }
    ]
  });

  const upcoming = await Task.countDocuments({
    ...tabFilter,
    $or: [
      { dueDate: { $gt: todayEnd } },
      { scheduledAt: { $gt: todayEnd } }
    ]
  });

  const missed = await Task.countDocuments({
    ...tabFilter,
    status: { $ne: 'Completed' },
    $or: [
      { dueDate: { $lt: todayStart } },
      { scheduledAt: { $lt: todayStart } }
    ]
  });

  return Response.json({
    counts: {
      leadTasks: leadTasksCount,
      meetings: meetingsCount,
      calls: callsCount,
    },
    tabs: {
      today,
      upcoming,
      missed
    }
  });
}
