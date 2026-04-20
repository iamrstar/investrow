import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin', 'manager'])) return forbidden();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 30;
  const entityType = searchParams.get('entityType');

  let filter = {};
  if (entityType) filter.entityType = entityType;

  if (authUser.role === 'manager') {
    filter.userId = authUser._id;
  }

  const total = await ActivityLog.countDocuments(filter);
  const activities = await ActivityLog.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return Response.json({
    activities,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
