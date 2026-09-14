import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Task from '@/models/Task';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, unauthorized } from '@/lib/middleware';

function formatCurrency(val) {
  if (!val || isNaN(val) || val === 0) return '₹ 0';
  if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Crore`;
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakh`;
  return `₹ ${val.toLocaleString('en-IN')}`;
}

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();

  let leadFilter = {};
  let taskFilter = {};

  if (authUser.role === 'user') {
    const userObjectId = mongoose.Types.ObjectId.isValid(authUser._id)
      ? new mongoose.Types.ObjectId(authUser._id)
      : authUser._id;

    leadFilter = { assignedTo: { $in: [authUser._id, userObjectId] } };
    taskFilter = { assignedTo: { $in: [authUser._id, userObjectId] } };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Month names helper for past 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const past6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    past6Months.push({
      label: monthNames[d.getMonth()],
      start,
      end,
    });
  }

  // Calculate upcoming SIP debit days (today and next 2 days)
  const todayDay = now.getDate();
  const nextDay1 = (todayDay % 31) + 1;
  const nextDay2 = ((todayDay + 1) % 31) + 1;
  const targetSipDays = [todayDay, nextDay1, nextDay2];

  const [
    totalLeadsAll,
    activePipelineCount,
    newLeadsCount,
    totalClients,
    followUpDue,
    overdueFollowUps,
    pendingTasks,
    overdueTasks,
    insurancePolicies,
    dbTodayFollowUps,
    dbActivities,
    dbRecentLeads,
    dbTasks,
    sourceAgg,
    stageCountsAgg,
    activeWithFollowUpCount,
    financialAgg,
    monthlyLeadsAgg,
    dbUpcomingSips
  ] = await Promise.all([
    // 1. Total Leads in CRM
    Lead.countDocuments(leadFilter),

    // 2. Active Pipeline Leads (Not Converted)
    Lead.countDocuments({ ...leadFilter, response: { $ne: 'Converted' }, stage: { $ne: 'Converted' } }),

    // 3. New Leads awaiting contact
    Lead.countDocuments({
      ...leadFilter,
      $or: [{ response: 'New' }, { response: 'Pending' }, { stage: 'New' }],
      response: { $ne: 'Converted' },
      stage: { $ne: 'Converted' }
    }),

    // 4. Converted Clients
    Lead.countDocuments({ ...leadFilter, $or: [{ response: 'Converted' }, { stage: 'Converted' }] }),

    // 5. Follow-ups due today
    Lead.countDocuments({
      ...leadFilter,
      followUpDate: { $gte: startOfToday, $lte: endOfToday }
    }),

    // 6. Overdue follow-ups
    Lead.countDocuments({
      ...leadFilter,
      followUpDate: { $lt: startOfToday }
    }),

    // 7. Pending tasks
    Task.countDocuments({ ...taskFilter, status: { $ne: 'Completed' } }),

    // 8. Overdue tasks
    Task.countDocuments({ ...taskFilter, status: { $ne: 'Completed' }, dueDate: { $lt: startOfToday } }),

    // 9. Insurance policies count (Converted insurance leads)
    Lead.countDocuments({
      ...leadFilter,
      $or: [{ response: 'Converted' }, { stage: 'Converted' }],
      service: { $in: ['Life Insurance', 'Health Insurance', 'General Insurance'] }
    }),

    // 10. Today's follow-ups records
    Lead.find({
      ...leadFilter,
      followUpDate: { $gte: startOfToday, $lte: endOfToday }
    })
      .sort({ followUpDate: 1 })
      .limit(6)
      .lean(),

    // 11. Recent activities
    ActivityLog.find(authUser.role === 'admin' ? {} : { userId: authUser._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),

    // 12. Recent leads
    Lead.find({ ...leadFilter })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),

    // 13. Tasks list
    Task.find({ ...taskFilter })
      .sort({ dueDate: 1 })
      .limit(6)
      .lean(),

    // 14. Source Aggregation (Real distribution)
    Lead.aggregate([
      { $match: leadFilter },
      { $group: { _id: { $ifNull: ['$source', 'Website'] }, count: { $sum: 1 } } }
    ]),

    // 15. Active Pipeline by Stage (excluding converted)
    Lead.aggregate([
      { 
        $match: { 
          ...leadFilter, 
          response: { $ne: 'Converted' },
          stage: { $ne: 'Converted' }
        } 
      },
      { $group: { _id: { $ifNull: ['$stage', '$response'] }, count: { $sum: 1 } } }
    ]),

    // 16. Active leads in discussion (Meeting, Documents, or Interested with scheduled call/meeting)
    Lead.countDocuments({
      ...leadFilter,
      response: { $ne: 'Converted' },
      stage: { $ne: 'Converted' },
      $or: [
        { stage: { $in: ['Meeting', 'Documents'] } },
        { response: { $in: ['Meeting', 'Documents'] } },
        { stage: 'Interested', $or: [{ followUpDate: { $ne: null } }, { nextCallDate: { $ne: null } }] }
      ]
    }),

    // 17. Financial totals (SIP, AUM, Insurance Premium, Active SIPs count)
    Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: null,
          totalInvestment: { $sum: { $ifNull: ['$investmentAmount', 0] } },
          totalSip: { $sum: { $ifNull: ['$sipAmount', 0] } },
          convertedInvestment: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$response', 'Converted'] }, { $eq: ['$stage', 'Converted'] }] },
                { $ifNull: ['$investmentAmount', 0] },
                0
              ]
            }
          },
          convertedSip: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$response', 'Converted'] }, { $eq: ['$stage', 'Converted'] }] },
                { $ifNull: ['$sipAmount', 0] },
                0
              ]
            }
          },
          activeSipsCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $or: [{ $eq: ['$response', 'Converted'] }, { $eq: ['$stage', 'Converted'] }] },
                    { $gt: ['$sipAmount', 0] }
                  ]
                },
                1,
                0
              ]
            }
          },
          activeLumpsumCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $or: [{ $eq: ['$response', 'Converted'] }, { $eq: ['$stage', 'Converted'] }] },
                    { $gt: ['$investmentAmount', 0] }
                  ]
                },
                1,
                0
              ]
            }
          },
          insurancePremiumSum: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $or: [{ $eq: ['$response', 'Converted'] }, { $eq: ['$stage', 'Converted'] }] },
                    { $in: ['$service', ['Life Insurance', 'Health Insurance', 'General Insurance']] }
                  ]
                },
                { $ifNull: ['$investmentAmount', 0] },
                0
              ]
            }
          }
        }
      }
    ]),

    // 18. Monthly Aggregation for past 6 months
    Lead.aggregate([
      {
        $match: {
          ...leadFilter,
          createdAt: { $gte: past6Months[0].start, $lte: past6Months[5].end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            service: '$service'
          },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$investmentAmount', 0] } }
        }
      }
    ]),

    // 19. Upcoming SIP Debits in next 3 days
    Lead.find({
      ...leadFilter,
      $or: [{ response: 'Converted' }, { stage: 'Converted' }],
      sipAmount: { $gt: 0 },
      sipDay: { $in: targetSipDays }
    })
      .select('name phone service sipAmount sipDay schemeName')
      .sort({ sipDay: 1 })
      .lean()
  ]);

  const rawConvertedSip = financialAgg[0]?.convertedSip || 0;
  const rawConvertedAum = financialAgg[0]?.convertedInvestment || 0;
  const rawInsPremium = financialAgg[0]?.insurancePremiumSum || 0;
  const activeSipsCount = financialAgg[0]?.activeSipsCount || 0;
  const activeLumpsumCount = financialAgg[0]?.activeLumpsumCount || 0;

  const monthlySipBook = formatCurrency(rawConvertedSip);
  const totalAum = formatCurrency(rawConvertedAum);
  const insurancePremium = formatCurrency(rawInsPremium);

  // Format upcoming SIP alerts
  const upcomingSipAlerts = (dbUpcomingSips || []).map(s => {
    let dueStatus = 'In 2 Days';
    if (s.sipDay === todayDay) dueStatus = 'Today';
    else if (s.sipDay === nextDay1) dueStatus = 'Tomorrow';

    return {
      _id: s._id,
      name: s.name || 'Client',
      phone: s.phone || '',
      service: s.service || 'Mutual Funds',
      schemeName: s.schemeName || s.service || 'SIP Plan',
      sipAmount: s.sipAmount || 0,
      formattedAmount: formatCurrency(s.sipAmount),
      sipDay: s.sipDay,
      dueStatus
    };
  });

  // Conversion rate (Total Converted Clients / Total Leads captured in CRM)
  const conversionRate = totalLeadsAll > 0 ? `${((totalClients / totalLeadsAll) * 100).toFixed(1)}%` : '0.0%';

  // Leads by source
  const sourceColors = {
    'Website': '#0EA5E9',
    'Meta Ads': '#F97316',
    'Referral': '#10B981',
    'Walk-in': '#38BDF8',
    'Employee': '#EA580C',
    'Other': '#64748B'
  };
  const allSources = ['Website', 'Meta Ads', 'Referral', 'Walk-in', 'Employee', 'Other'];
  const totalSourceCount = sourceAgg.reduce((acc, s) => acc + s.count, 0);
  const leadsBySource = allSources.map(src => {
    const found = sourceAgg.find(s => (s._id || '').toLowerCase() === src.toLowerCase());
    const count = found ? found.count : 0;
    const percentage = totalSourceCount > 0 ? Math.round((count / totalSourceCount) * 100) : 0;
    return {
      name: src,
      count,
      percentage,
      color: sourceColors[src] || '#64748B'
    };
  });

  // Active Stage Map
  const stageMap = {};
  stageCountsAgg.forEach(s => {
    stageMap[s._id] = s.count;
  });

  const activeNew = (stageMap['New'] || 0) + (stageMap['Pending'] || 0);
  const activeContacted = stageMap['Contacted'] || 0;
  const activeInterested = (stageMap['Interested'] || 0) + (stageMap['Positive'] || 0);
  const activeMeeting = stageMap['Meeting'] || 0;
  const activeDocuments = stageMap['Documents'] || 0;
  const activeLost = (stageMap['Lost'] || 0) + (stageMap['Negative'] || 0);

  // Cumulative Conversion Funnel Stages
  const funnelTier1 = totalLeadsAll; // 1. Top of Funnel: All leads ingested
  const funnelTier2 = totalClients + activeInterested + activeMeeting + activeDocuments + activeContacted; // 2. Reached Contacted or beyond
  const funnelTier3 = totalClients + activeInterested + activeMeeting + activeDocuments; // 3. Reached Qualified/Interested or beyond
  const funnelTier4 = totalClients + activeWithFollowUpCount; // 4. In Discussion / Follow-up / Meeting
  const funnelTier5 = totalClients; // 5. Converted paying clients

  const getPct = (cnt) => totalLeadsAll > 0 ? `${((cnt / totalLeadsAll) * 100).toFixed(1)}%` : '0.0%';

  const funnel = [
    { 
      label: 'Ingested Leads', 
      stageKey: 'New', 
      count: funnelTier1, 
      activeCount: activeNew, 
      percentage: '100%', 
      color: '#0EA5E9',
      badge: `${activeNew} Awaiting Call`
    },
    { 
      label: 'Contacted', 
      stageKey: 'Contacted', 
      count: funnelTier2, 
      activeCount: activeContacted, 
      percentage: getPct(funnelTier2), 
      color: '#38BDF8',
      badge: activeContacted > 0 ? `${activeContacted} In Outreach` : 'Contacted'
    },
    { 
      label: 'Interested', 
      stageKey: 'Interested', 
      count: funnelTier3, 
      activeCount: activeInterested, 
      percentage: getPct(funnelTier3), 
      color: '#FB923C',
      badge: `${activeInterested} Active Discussions`
    },
    { 
      label: 'Meeting / In Discussion', 
      stageKey: 'Meeting', 
      count: funnelTier4, 
      activeCount: activeMeeting + activeWithFollowUpCount, 
      percentage: getPct(funnelTier4), 
      color: '#F97316',
      badge: `${activeMeeting + activeWithFollowUpCount} Scheduled Calls`
    },
    { 
      label: 'Converted Clients', 
      stageKey: 'Converted', 
      count: funnelTier5, 
      activeCount: totalClients, 
      percentage: getPct(funnelTier5), 
      color: '#10B981',
      badge: `${funnelTier5} Clients Won`
    },
  ];

  // Business Overview
  const overviewMonths = past6Months.map(m => m.label);
  const sipBookMonthly = [];
  const aumMonthly = [];
  const insuranceMonthly = [];

  past6Months.forEach(m => {
    const monthNum = m.start.getMonth() + 1;
    const yearNum = m.start.getFullYear();

    const monthItems = monthlyLeadsAgg.filter(item => item._id.year === yearNum && item._id.month === monthNum);
    const sipVol = monthItems
      .filter(it => ['Mutual Funds', 'SIP'].includes(it._id.service))
      .reduce((sum, it) => sum + (it.amount || 0), 0) / 100000;
    const aumVol = monthItems.reduce((sum, it) => sum + (it.amount || 0), 0) / 100000;
    const insVol = monthItems
      .filter(it => ['Life Insurance', 'Health Insurance', 'General Insurance'].includes(it._id.service))
      .reduce((sum, it) => sum + (it.amount || 0), 0) / 100000;

    sipBookMonthly.push(Number(sipVol.toFixed(1)));
    aumMonthly.push(Number(aumVol.toFixed(1)));
    insuranceMonthly.push(Number(insVol.toFixed(1)));
  });

  const businessOverview = {
    months: overviewMonths,
    sipBook: sipBookMonthly,
    aum: aumMonthly,
    insurance: insuranceMonthly,
  };

  // Today's Follow-ups
  const todayFollowUpsList = dbTodayFollowUps.map((lead) => {
    const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < startOfToday;
    const timeStr = lead.followUpDate
      ? new Date(lead.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '10:00 AM';

    return {
      _id: lead._id,
      time: timeStr,
      name: lead.name || 'Client',
      mobile: lead.phone || '98XXXXXXXX',
      product: lead.service || 'Mutual Fund',
      status: isOverdue ? 'Overdue' : (lead.callStatus === 'Pending' ? 'Pending' : 'Due'),
    };
  });

  // Recent Activities
  const recentActivities = dbActivities.map(act => ({
    _id: act._id,
    time: new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    activity: act.action,
    by: act.userId?.name ? `By ${act.userId.name}` : 'By Staff',
  }));

  // Employee follow-ups list
  const employeeFollowUpsList = dbTodayFollowUps.map(lead => {
    const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < startOfToday;
    const timeStr = lead.followUpDate
      ? new Date(lead.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '10:00 AM';

    return {
      _id: lead._id,
      time: timeStr,
      name: lead.name || 'Client',
      phone: lead.phone || '9876541234',
      product: lead.service || 'Mutual Fund',
      status: isOverdue ? 'Overdue' : 'Scheduled',
    };
  });

  // Employee recent leads
  const employeeRecentLeads = dbRecentLeads.map(lead => ({
    _id: lead._id,
    name: lead.name,
    source: lead.leadReference || lead.source || 'Website',
    product: lead.service || 'Mutual Fund',
    date: new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
    status: lead.response === 'Positive' ? 'Interested' : (lead.response || 'New'),
  }));

  // Employee tasks
  const employeeTasks = dbTasks.map(t => {
    const isOverdue = t.dueDate && new Date(t.dueDate) < startOfToday;
    const isToday = t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday;
    const dueTag = isOverdue ? 'Overdue' : (isToday ? 'Today' : 'Tomorrow');
    return {
      _id: t._id,
      title: t.title,
      dueTag,
      status: t.status,
      completed: t.status === 'Completed',
    };
  });

  // Target percentages
  const leadsTarget = 50;
  const clientsTarget = 15;
  const sipTargetLakh = 5;
  const aumTargetLakh = 100;

  const currentSipLakh = rawConvertedSip / 100000;
  const currentAumLakh = rawConvertedAum / 100000;

  const employeeTargets = [
    {
      key: 'leads',
      label: 'New Leads',
      current: newLeadsCount,
      target: leadsTarget,
      percentage: Math.min(100, Math.round((newLeadsCount / leadsTarget) * 100)),
      color: '#0EA5E9'
    },
    {
      key: 'clients',
      label: 'Converted Clients',
      current: totalClients,
      target: clientsTarget,
      percentage: Math.min(100, Math.round((totalClients / clientsTarget) * 100)),
      color: '#10B981'
    },
    {
      key: 'sip',
      label: 'SIP Book (₹)',
      current: currentSipLakh.toFixed(2),
      target: `${sipTargetLakh}`,
      unit: 'Lakh',
      percentage: Math.min(100, Math.round((currentSipLakh / sipTargetLakh) * 100)),
      color: '#6366F1'
    },
    {
      key: 'aum',
      label: 'AUM (₹)',
      current: currentAumLakh.toFixed(2),
      target: `${aumTargetLakh}`,
      unit: 'Lakh',
      percentage: Math.min(100, Math.round((currentAumLakh / aumTargetLakh) * 100)),
      color: '#D97706'
    },
  ];

  return Response.json({
    stats: {
      totalLeads: totalLeadsAll,
      activePipelineCount,
      newLeads: newLeadsCount,
      totalClients,
      followUpDue,
      overdueFollowUps,
      monthlySipBook,
      totalAum,
      activeSipsCount,
      activeLumpsumCount,
      upcomingSipAlerts,
      insurancePolicies,
      insurancePremium,
      pendingTasks,
      overdueTasks,
      conversionRate,
      leadsBySource,
      funnel,
      pipelineBreakdown: {
        new: activeNew,
        contacted: activeContacted,
        interested: activeInterested,
        meeting: activeMeeting,
        documents: activeDocuments,
        converted: totalClients,
        lost: activeLost,
        total: totalLeadsAll,
        active: activePipelineCount,
      },
      businessOverview,
      todayFollowUpsList,
      recentActivities,
      employeeStats: {
        myTotalLeads: totalLeadsAll,
        myActiveLeads: activePipelineCount,
        myClients: totalClients,
        myFollowUps: followUpDue,
        myOverdueFollowUps: overdueFollowUps,
        mySipBook: monthlySipBook,
        myAum: totalAum,
        activeSipsCount,
        activeLumpsumCount,
        upcomingSipAlerts,
        myPendingTasks: pendingTasks,
        myOverdueTasks: overdueTasks,
        followUpsList: employeeFollowUpsList,
        recentLeads: employeeRecentLeads,
        tasks: employeeTasks,
        targets: employeeTargets,
      }
    }
  });
}
