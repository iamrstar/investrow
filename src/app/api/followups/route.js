import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const preset = searchParams.get('preset') || ''; // 'today', '7days', '1month', '2months', '3months', '6months', 'overdue', 'all'
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const service = searchParams.get('service');
  const scope = searchParams.get('scope') || 'all'; // 'all', 'clients', 'leads'
  const callStatus = searchParams.get('callStatus');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 25;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const in1Month = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 23, 59, 59, 999);
  const in2Months = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate(), 23, 59, 59, 999);
  const in3Months = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate(), 23, 59, 59, 999);
  const in6Months = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate(), 23, 59, 59, 999);

  const baseCriteria = [];

  // Role-based visibility
  if (authUser.role === 'user') {
    baseCriteria.push({ assignedTo: authUser._id });
  }

  // Scope: clients vs leads vs all
  if (scope === 'clients') {
    baseCriteria.push({ response: 'Converted' });
  } else if (scope === 'leads') {
    baseCriteria.push({ response: { $ne: 'Converted' } });
  }

  // Search
  if (search) {
    baseCriteria.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
      ]
    });
  }

  // Product / Service filter
  if (service) {
    baseCriteria.push({ service });
  }

  // Call status filter
  if (callStatus) {
    baseCriteria.push({ callStatus });
  }

  // Date filtering
  const queryCriteria = [...baseCriteria];

  if (startDate || endDate) {
    const rangeQuery = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      rangeQuery.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      rangeQuery.$lte = e;
    }
    queryCriteria.push({ followUpDate: rangeQuery });
  } else if (preset === 'today') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: endOfToday } });
  } else if (preset === '7days') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: in7Days } });
  } else if (preset === '1month') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: in1Month } });
  } else if (preset === '2months') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: in2Months } });
  } else if (preset === '3months') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: in3Months } });
  } else if (preset === '6months') {
    queryCriteria.push({ followUpDate: { $gte: startOfToday, $lte: in6Months } });
  } else if (preset === 'overdue') {
    queryCriteria.push({ followUpDate: { $lt: startOfToday } });
  } else {
    // Default: return items that have a followUpDate defined
    queryCriteria.push({ followUpDate: { $ne: null } });
  }

  const filter = queryCriteria.length === 0 ? {} : (queryCriteria.length === 1 ? queryCriteria[0] : { $and: queryCriteria });

  // Calculate summary counts across key date buckets using the base filters (matching role, product, scope)
  const baseFilter = baseCriteria.length === 0 ? {} : (baseCriteria.length === 1 ? baseCriteria[0] : { $and: baseCriteria });

  const [
    totalCount,
    overdueCount,
    todayCount,
    sevenDaysCount,
    oneMonthCount,
    twoMonthsCount,
    threeMonthsCount,
    sixMonthsCount,
    results
  ] = await Promise.all([
    Lead.countDocuments({ ...baseFilter, followUpDate: { $ne: null } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $lt: startOfToday } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: endOfToday } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: in7Days } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: in1Month } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: in2Months } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: in3Months } }),
    Lead.countDocuments({ ...baseFilter, followUpDate: { $gte: startOfToday, $lte: in6Months } }),
    Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ followUpDate: 1 }) // Closest upcoming follow-ups first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
  ]);

  const filteredTotal = await Lead.countDocuments(filter);

  return Response.json({
    followUps: results,
    metrics: {
      total: totalCount,
      overdue: overdueCount,
      today: todayCount,
      sevenDays: sevenDaysCount,
      oneMonth: oneMonthCount,
      twoMonths: twoMonthsCount,
      threeMonths: threeMonthsCount,
      sixMonths: sixMonthsCount,
    },
    pagination: {
      total: filteredTotal,
      page,
      pages: Math.ceil(filteredTotal / limit) || 1,
      limit,
    }
  });
}
