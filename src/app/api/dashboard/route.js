import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Task from '@/models/Task';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  let leadFilter = {};
  let taskFilter = {};

  if (authUser.role === 'user') {
    leadFilter = { assignedTo: authUser._id };
    taskFilter.assignedTo = authUser._id;
  }

  const [
    totalLeads,
    positiveLeads,
    negativeLeads,
    pendingLeads,
    interestedLeads,
    serviceTakenLeads,
    pendingTasks,
    completedTasks,
    totalTasks,
    recentLeads,
    recentActivities,
    hotLeads,
  ] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, response: 'Positive' }),
    Lead.countDocuments({ ...leadFilter, response: 'Negative' }),
    Lead.countDocuments({ ...leadFilter, response: 'Pending' }),
    Lead.countDocuments({ ...leadFilter, interestedInService: 'Yes' }),
    Lead.countDocuments({ ...leadFilter, serviceTaken: 'Yes' }),
    Task.countDocuments({ ...taskFilter, status: { $ne: 'Completed' } }),
    Task.countDocuments({ ...taskFilter, status: 'Completed' }),
    Task.countDocuments(taskFilter),
    Lead.find(leadFilter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ActivityLog.find(authUser.role === 'admin' ? {} : { userId: authUser._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Lead.find({ ...leadFilter, response: 'Positive', serviceTaken: { $ne: 'Yes' } })
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  // Service breakdown
  const serviceBreakdownRaw = await Lead.aggregate([
    { $match: leadFilter.$or ? { $or: leadFilter.$or } : leadFilter },
    { $group: { 
        _id: '$service', 
        count: { $sum: 1 },
        converted: { $sum: { $cond: [{ $eq: ['$serviceTaken', 'Yes'] }, 1, 0] } }
      } 
    },
    { $sort: { count: -1 } },
  ]);

  const serviceBreakdown = serviceBreakdownRaw.map(s => ({
    ...s,
    conversionRate: s.count > 0 ? ((s.converted / s.count) * 100).toFixed(1) : 0
  }));

  // Today follow-ups
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayFollowUps = await Lead.countDocuments({
    $and: [
      leadFilter,
      {
        $or: [
          { followUpDate: { $gte: today, $lt: tomorrow } },
          { nextCallDate: { $gte: today, $lt: tomorrow } },
        ]
      }
    ]
  });

  let stats = {
    totalLeads,
    positiveLeads,
    negativeLeads,
    pendingLeads,
    interestedLeads,
    serviceTakenLeads,
    pendingTasks,
    completedTasks,
    totalTasks,
    todayFollowUps,
    serviceBreakdown,
    recentLeads,
    recentActivities,
    hotLeads,
    conversionRate: totalLeads > 0 ? ((serviceTakenLeads / totalLeads) * 100).toFixed(1) : 0,
  };

  // Admin-only stats
  if (authUser.role === 'admin') {
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isActive: true, role: { $ne: 'admin' } }),
    ]);
    stats = { ...stats, totalUsers, activeUsers };
  }



  return Response.json({ stats });
}
