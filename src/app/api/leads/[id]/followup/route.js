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
    let { 
      callStatus, response, stage, interestedInService, serviceTaken, 
      nextCallDate, followUpDate, interactionDate, remarks,
      service, investmentType, sipAmount, sipDay, investmentAmount, schemeName
    } = body;

    const currentLead = await Lead.findById(id);
    if (!currentLead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const scheduledNext = nextCallDate || followUpDate || null;
    const pastInteractionDate = interactionDate || new Date();

    // Determine upgraded stage and response dynamically
    let resolvedStage = stage || currentLead.stage || 'New';
    let resolvedResponse = response || currentLead.response || 'Pending';

    // 1. Explicit Conversion
    if (resolvedResponse === 'Converted' || resolvedStage === 'Converted' || serviceTaken === 'Yes') {
      resolvedStage = 'Converted';
      resolvedResponse = 'Converted';
      serviceTaken = 'Yes';
    } 
    // 2. Positive / Interested in service
    else if (
      resolvedResponse === 'Interested' || 
      resolvedResponse === 'Positive' || 
      resolvedStage === 'Interested' || 
      interestedInService === 'Yes'
    ) {
      resolvedStage = 'Interested';
      resolvedResponse = 'Interested';
      interestedInService = 'Yes';
    } 
    // 3. Meeting Scheduled
    else if (resolvedResponse === 'Meeting' || resolvedStage === 'Meeting') {
      resolvedStage = 'Meeting';
      resolvedResponse = 'Meeting';
    } 
    // 4. Documents / KYC stage
    else if (resolvedResponse === 'Documents' || resolvedStage === 'Documents') {
      resolvedStage = 'Documents';
      resolvedResponse = 'Documents';
    } 
    // 5. Negative / Not Interested / Lost
    else if (
      resolvedResponse === 'Lost' || 
      resolvedResponse === 'Negative' || 
      resolvedStage === 'Lost' || 
      interestedInService === 'No'
    ) {
      resolvedStage = 'Lost';
      resolvedResponse = 'Lost';
      interestedInService = 'No';
    } 
    // 6. Connected / Received call or Contacted status
    else if (
      resolvedResponse === 'Contacted' || 
      resolvedStage === 'Contacted' || 
      callStatus === 'Received'
    ) {
      if (['New', 'Pending'].includes(resolvedStage) || ['New', 'Pending'].includes(resolvedResponse)) {
        resolvedStage = 'Contacted';
        resolvedResponse = 'Contacted';
      }
    } 
    // 7. Still pending/new
    else if (scheduledNext && ['New', 'Pending'].includes(resolvedStage)) {
      resolvedStage = 'New';
      resolvedResponse = 'Pending';
    }

    // Parse financial values
    const finalService = service || currentLead.service || 'Mutual Funds';
    const finalInvestmentType = investmentType !== undefined ? investmentType : (currentLead.investmentType || '');
    const finalSipAmount = sipAmount !== undefined ? (Number(sipAmount) || 0) : (currentLead.sipAmount || 0);
    const finalSipDay = sipDay !== undefined ? (Number(sipDay) || null) : currentLead.sipDay;
    const finalInvestmentAmount = investmentAmount !== undefined ? (Number(investmentAmount) || 0) : (currentLead.investmentAmount || 0);
    const finalSchemeName = schemeName !== undefined ? schemeName : (currentLead.schemeName || '');

    // 1. Create the FollowUp record
    const followup = await FollowUp.create({
      leadId: id,
      userId: authUser._id,
      medium: body.medium || 'Phone Call',
      interactionDate: pastInteractionDate,
      callStatus: callStatus || 'Received',
      response: resolvedResponse,
      stage: resolvedStage,
      interestedInService: interestedInService || 'Pending',
      serviceTaken: serviceTaken || 'Pending',
      service: finalService,
      investmentType: finalInvestmentType,
      sipAmount: finalSipAmount,
      sipDay: finalSipDay,
      investmentAmount: finalInvestmentAmount,
      schemeName: finalSchemeName,
      nextCallDate: scheduledNext,
      followUpDate: pastInteractionDate,
      remarks,
    });

    // 2. Update the Lead with the upgraded stage and synchronized dates & financials
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        stage: resolvedStage,
        response: resolvedResponse,
        callStatus: callStatus || currentLead.callStatus,
        interestedInService: interestedInService || currentLead.interestedInService,
        serviceTaken: serviceTaken || currentLead.serviceTaken,
        service: finalService,
        investmentType: finalInvestmentType,
        sipAmount: finalSipAmount,
        sipDay: finalSipDay,
        investmentAmount: finalInvestmentAmount,
        schemeName: finalSchemeName,
        nextCallDate: scheduledNext,
        followUpDate: scheduledNext,
        remarks: remarks || currentLead.remarks,
      },
      { new: true }
    );

    // 3. Create high-level ActivityLog entry
    await ActivityLog.create({
      userId: authUser._id,
      action: `Logged Follow-up: ${callStatus || 'Call'} • Upgraded to ${resolvedStage}`,
      entityType: 'Lead',
      entityId: id,
      details: { 
        followupId: followup._id,
        callStatus,
        response: resolvedResponse,
        stage: resolvedStage,
        nextCallDate: scheduledNext 
      },
    });

    return Response.json({ success: true, followup, lead: updatedLead });
  } catch (error) {
    console.error('Create followup error:', error);
    return Response.json({ error: 'Failed to log follow-up' }, { status: 500 });
  }
}
