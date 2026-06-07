import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // 1. Fetch all non-admin users
    const users = await User.find({ role: 'user' }).lean();

    // 2. Build match queries for Leads Created and Leads Assigned
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      // set endDate to the end of the day
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    // 3. Aggregate Leads Created by User
    const createdAgg = await Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } }
    ]);

    // 4. Aggregate Leads Assigned by User
    const assignedAgg = await Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);

    // 5. Aggregate Clients (Converted Leads) Assigned by User
    const convertedAgg = await Lead.aggregate([
      { $match: { ...matchQuery, response: 'Converted' } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);

    // Format results mapping
    const createdMap = createdAgg.reduce((acc, curr) => ({ ...acc, [String(curr._id)]: curr.count }), {});
    const assignedMap = assignedAgg.reduce((acc, curr) => ({ ...acc, [String(curr._id)]: curr.count }), {});
    const convertedMap = convertedAgg.reduce((acc, curr) => ({ ...acc, [String(curr._id)]: curr.count }), {});

    // 6. Combine data per user
    const userStats = users.map(u => ({
      userId: u._id,
      name: u.name,
      email: u.email,
      leadsCreated: createdMap[String(u._id)] || 0,
      leadsAssigned: assignedMap[String(u._id)] || 0,
      clientsConverted: convertedMap[String(u._id)] || 0,
      conversionRate: assignedMap[String(u._id)] 
        ? Math.round(((convertedMap[String(u._id)] || 0) / assignedMap[String(u._id)]) * 100) 
        : 0
    }));

    // Calculate totals for summary cards
    const totals = {
      leadsCreated: userStats.reduce((acc, curr) => acc + curr.leadsCreated, 0),
      leadsAssigned: userStats.reduce((acc, curr) => acc + curr.leadsAssigned, 0),
      clientsConverted: userStats.reduce((acc, curr) => acc + curr.clientsConverted, 0),
    };

    return NextResponse.json({ success: true, stats: userStats, totals });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
