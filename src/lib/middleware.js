import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function getAuthUser(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user || !user.isActive) return null;

    return { ...user, _id: user._id.toString() };
  } catch (error) {
    return null;
  }
}

export function checkRole(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
