import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import { sendEmail, templates } from '@/lib/email';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  const criteria = [];

  if (role) {
    criteria.push({ role });
  }

  if (search) {
    criteria.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    });
  }

  const filter = criteria.length === 0 ? {} : (criteria.length === 1 ? criteria[0] : { $and: criteria });

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({ users });
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return Response.json({ error: 'Name, email, password and role are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      plainPassword: password, // Store plain password for admin
      role,
      phone: phone || '',
      isActive: true,
    });

    await ActivityLog.create({
      userId: authUser._id,
      action: `Created ${role}: ${name}`,
      entityType: 'User',
      entityId: user._id,
      details: { name, email, role },
    });

    // Send Welcome Email
    const emailTemplate = templates.welcome(name, role);
    await sendEmail({
      to: email.toLowerCase(),
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
