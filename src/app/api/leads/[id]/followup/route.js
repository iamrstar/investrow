import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import FollowUp from '@/models/FollowUp';
import { getAuthUser, unauthorized } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

export async function POST(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  try {
    const body = await request.json();
    const { 
      callStatus, response, interestedInService, serviceTaken, 
      nextCallDate, followUpDate, remarks 
    } = body;

    // 1. Create the FollowUp record
    const followup = await FollowUp.create({
      leadId: id,
      userId: authUser._id,
      callStatus,
      response,
      interestedInService,
      serviceTaken,
      nextCallDate,
      followUpDate,
      remarks,
    });

    // 2. Update the Lead with the latest status and dates
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        callStatus,
        response,
        interestedInService,
        serviceTaken,
        nextCallDate,
        followUpDate,
        remarks, // Update current remarks to match latest follow-up
      },
      { new: true }
    );

    // 3. Create a high-level ActivityLog entry
    await ActivityLog.create({
      userId: authUser._id,
      action: `Logged Follow-up: ${callStatus} / ${response}`,
      entityType: 'Lead',
      entityId: id,
      details: { 
        followupId: followup._id,
        callStatus,
        response,
        nextCallDate 
      },
    });

    return Response.json({ success: true, followup, lead: updatedLead });
  } catch (error) {
    console.error('Create followup error:', error);
    return Response.json({ error: 'Failed to log follow-up' }, { status: 500 });
  }
}
