import dbConnect from '@/lib/db';
import User from '@/models/User';
import SalarySlip from '@/models/SalarySlip';
import { hashPassword } from '@/lib/auth';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import { sendEmail, templates } from '@/lib/email';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  const criteria = [];

  if (role) {
    if (role === 'user') {
      criteria.push({ role: { $in: ['user', 'relationship_manager', 'rm'] } });
    } else {
      criteria.push({ role });
    }
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

  let query = User.find(filter).select('-password');
  if (authUser.role !== 'admin') {
    query = query.select('-plainPassword -salary -pf -professionalTax');
  }

  const users = await query.sort({ createdAt: -1 }).lean();

  // If admin, attach latest salary slip info
  if (authUser.role === 'admin' && users.length > 0) {
    try {
      const userIds = users.map(u => u._id);
      const latestSlips = await SalarySlip.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: '$userId',
            lastSlipMonth: { $first: '$month' },
            lastSlipYear: { $first: '$year' },
            lastNetPay: { $first: '$netPay' },
            lastReleasedAt: { $first: '$releasedAt' },
          }
        }
      ]);
      const slipMap = {};
      latestSlips.forEach(s => {
        slipMap[s._id.toString()] = s;
      });
      users.forEach(u => {
        u.lastSalarySlip = slipMap[u._id.toString()] || null;
      });
    } catch (e) {
      console.error('Error fetching latest salary slips:', e);
    }
  }

  return Response.json({ users });
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, role, phone, salary, designation, pf, professionalTax } = body;

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
      salary: salary !== undefined && salary !== '' ? Number(salary) : 0,
      designation: designation || '',
      pf: pf !== undefined && pf !== '' ? Number(pf) : 0,
      professionalTax: professionalTax !== undefined && professionalTax !== '' ? Number(professionalTax) : 0,
      isActive: true,
    });

    await ActivityLog.create({
      userId: authUser._id,
      action: `Created ${role}: ${name}`,
      entityType: 'User',
      entityId: user._id,
      details: { name, email, role, salary: user.salary, designation: user.designation },
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
