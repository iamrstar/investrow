import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return Response.json({ results: [] });
  }

  const isNum = !isNaN(Number(q)) && q !== '';
  const searchRegex = { $regex: q, $options: 'i' };
  const orConditions = [
    { name: searchRegex },
    { phone: searchRegex },
    { email: searchRegex },
    { leadId: searchRegex },
    { panNumber: searchRegex },
    { aadhaarNumber: searchRegex },
    { schemeName: searchRegex },
    { 'schemes.schemeName': searchRegex },
    { location: searchRegex },
    { city: searchRegex },
    { bankAccountNumber: searchRegex },
  ];

  if (isNum) {
    orConditions.push({ leadNumber: Number(q) });
  }

  const query = { $or: orConditions };

  // Role-based scoping: sales employees only see their assigned records
  if (authUser.role === 'user') {
    query.assignedTo = authUser._id;
  }

  try {
    const records = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const results = records.map(item => {
      const isClient = item.response === 'Converted';
      const displayId = item.leadId || (item.leadNumber ? `INV-${item.leadNumber}` : '');
      const primaryScheme = item.schemeName || item.schemes?.[0]?.schemeName || '';

      return {
        _id: item._id,
        leadId: displayId,
        leadNumber: item.leadNumber,
        name: item.name || 'Unnamed',
        phone: item.phone || '',
        email: item.email || '',
        service: item.service || '',
        schemeName: primaryScheme,
        city: item.city || item.location || '',
        response: item.response || 'Pending',
        stage: item.stage || (isClient ? 'Converted' : 'New'),
        callStatus: item.callStatus || 'Pending',
        isClient,
        investmentAmount: item.investmentAmount || 0,
        sipAmount: item.sipAmount || 0,
        assignedTo: item.assignedTo?.name || null,
      };
    });

    return Response.json({ results });
  } catch (err) {
    console.error('Search API error:', err);
    return Response.json({ error: 'Failed to search records', results: [] }, { status: 500 });
  }
}
