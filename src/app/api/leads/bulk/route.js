import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin', 'user'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();

    if (!Array.isArray(body.leads)) {
      return Response.json({ error: 'Expected an array of leads' }, { status: 400 });
    }

    const { leads, isCustomer } = body;

    const leadsToInsert = leads.map(leadData => {
      // Basic formatting and mapping based on what came from the frontend
      const newLead = {
        name: leadData.Name || '',
        phone: leadData.Mobile || '',
        email: leadData.Email || '',
        address: leadData.Address || '',
        city: leadData.City || '',
        panNumber: leadData['Pan Number'] || '',
        pincode: String(leadData.Pincode || ''),
        dateOfBirth: String(leadData['Date Of Birth'] || ''),
        response: isCustomer ? 'Converted' : 'Pending',
        createdBy: authUser._id,
        assignedTo: authUser.role === 'user' ? authUser._id : null,
      };

      // Since bulk upload doesn't strictly enforce 'service' as per requirements,
      // it defaults to empty string from schema or we set it here.
      return newLead;
    });

    const insertedLeads = await Lead.insertMany(leadsToInsert);

    await ActivityLog.create({
      userId: authUser._id,
      action: `Bulk uploaded ${insertedLeads.length} ${isCustomer ? 'customers' : 'leads'}`,
      entityType: 'Lead',
      entityId: insertedLeads[0]?._id, // Just link the first one
      details: { count: insertedLeads.length },
    });

    return Response.json({ success: true, count: insertedLeads.length }, { status: 201 });
  } catch (error) {
    console.error('Bulk create lead error:', error);
    return Response.json({ error: 'Failed to bulk import leads' }, { status: 500 });
  }
}
