import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  try {
    await dbConnect();

    const criteria = { assignedTo: null };

    if (authUser.role === 'manager') {
      // Find team members reporting to this manager
      const teamUsers = await User.find({ managerId: authUser._id }).select('_id').lean();
      const teamUserIds = teamUsers.map(u => u._id);
      
      // Managers see "unassigned" as leads assigned TO THEM that they need to delegate to their team
      criteria.assignedTo = authUser._id;
    } else if (authUser.role === 'user') {
      // Users only see unassigned leads THEY created
      criteria.createdBy = authUser._id;
    }

    const count = await Lead.countDocuments(criteria);

    return Response.json({ count });
  } catch (error) {
    console.error('Unassigned count error:', error);
    return Response.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
