import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;
  const user = await User.findById(id).select('-password').lean();

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({ user });
}

export async function PUT(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const updateData = {};

    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role) updateData.role = body.role;

    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (body.password) {
      updateData.password = await hashPassword(body.password);
      updateData.plainPassword = body.password; // Update plain password
    }
    
    if (body.documents) updateData.documents = body.documents;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await ActivityLog.create({
      userId: authUser._id,
      action: `Updated user: ${user.name}`,
      entityType: 'User',
      entityId: user._id,
      details: updateData,
    });

    return Response.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    return Response.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const { id } = await params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await ActivityLog.create({
      userId: authUser._id,
      action: `Deleted user: ${user.name}`,
      entityType: 'User',
      entityId: user._id,
      details: { name: user.name, email: user.email, role: user.role },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
