import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function getAuthUser(request) {
  try {
    let token = null;

    // 1. Try reading directly from request cookies or headers (safest in Route Handlers)
    if (request) {
      if (typeof request.cookies?.get === 'function') {
        token = request.cookies.get('token')?.value;
      }
      if (!token && typeof request.headers?.get === 'function') {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }
    }

    // 2. Fallback to next/headers cookies()
    if (!token) {
      try {
        const cookieStore = cookies();
        token = (typeof cookieStore?.then === 'function' ? await cookieStore : cookieStore)?.get('token')?.value;
      } catch (cErr) {
        // Ignore if next/headers is unavailable
      }
    }

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
