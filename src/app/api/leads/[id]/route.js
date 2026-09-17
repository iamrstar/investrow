import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';
import Task from '@/models/Task';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import ActivityLog from '@/models/ActivityLog';
import FormControl from '@/models/FormControl';
import FollowUp from '@/models/FollowUp';

async function canAccessLead(authUser, lead) {
  if (authUser.role === 'admin') return true;

  const assignedId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();
  const createdById = lead.createdBy?._id?.toString() || lead.createdBy?.toString();

  if (authUser.role === 'user') {
    return assignedId === authUser._id || createdById === authUser._id;
  }
  return false;
}

export async function GET(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email phone')
    .populate('createdBy', 'name email')
    .lean();

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!(await canAccessLead(authUser, lead))) return forbidden();

  // Get follow-up history
  const followups = await FollowUp.find({ leadId: id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // Get generic activity logs for this lead
  const activities = await ActivityLog.find({ entityType: 'Lead', entityId: id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Get tasks for this lead
  const tasks = await Task.find({ leadId: id })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({ lead, activities, followups, tasks });
}

export async function PUT(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();
  const { id } = await params;

  const existingLead = await Lead.findById(id).lean();
  if (!existingLead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!(await canAccessLead(authUser, existingLead))) return forbidden();

  try {
    const body = await request.json();

    // Harmonize field names
    if (body.city && !body.location) body.location = body.city;
    if (body.location && !body.city) body.city = body.location;
    if (body.source && !body.leadReference) body.leadReference = body.source;
    if (body.leadReference && !body.source) body.source = body.leadReference;
    if (body.mobile && !body.phone) body.phone = body.mobile;
    if (body.phone && !body.mobile) body.mobile = body.phone;
    if (!body.service && existingLead.service) body.service = existingLead.service;
    if (!body.location && (body.city || existingLead.location || existingLead.city)) {
      body.location = body.city || existingLead.location || existingLead.city;
    }
    if (!body.leadReference && (body.source || existingLead.leadReference || existingLead.source)) {
      body.leadReference = body.source || existingLead.leadReference || existingLead.source;
    }

    // Harmonize stage and response
    if (body.response && !body.stage) {
      if (['Positive', 'Interested'].includes(body.response)) {
        body.stage = 'Interested';
        body.response = 'Interested';
        body.interestedInService = 'Yes';
      } else if (['Negative', 'Lost'].includes(body.response)) {
        body.stage = 'Lost';
        body.response = 'Lost';
        body.interestedInService = 'No';
      } else if (['New', 'Pending'].includes(body.response)) {
        body.stage = 'New';
        body.response = 'Pending';
      } else if (body.response === 'Converted') {
        body.stage = 'Converted';
        body.response = 'Converted';
        body.serviceTaken = 'Yes';
      } else {
        body.stage = body.response;
      }
    } else if (body.stage && !body.response) {
      if (body.stage === 'New') {
        body.response = 'Pending';
      } else {
        body.response = body.stage;
      }
    } else if (body.stage && body.response) {
      if (['Positive', 'Interested'].includes(body.response)) {
        body.stage = 'Interested';
        body.response = 'Interested';
      } else if (['Negative', 'Lost'].includes(body.response)) {
        body.stage = 'Lost';
        body.response = 'Lost';
      } else if (['New', 'Pending'].includes(body.response)) {
        body.stage = 'New';
        body.response = 'Pending';
      } else {
        body.stage = body.response;
      }
    }

    if (body.nextCallDate && !body.followUpDate) body.followUpDate = body.nextCallDate;
    if (body.followUpDate && !body.nextCallDate) body.nextCallDate = body.followUpDate;

    const isConverted = body.response === 'Converted' || body.stage === 'Converted';
    const settingsType = isConverted ? 'client' : 'lead';
    const settings = await FormControl.findOne({ singletonId: `${settingsType}_settings` }).lean();

    if (settings) {
      if (settings.defaultFields) {
        for (const field of settings.defaultFields) {
          if (['location', 'leadReference'].includes(field.name) && (body.location || body.leadReference || existingLead.location || existingLead.leadReference)) continue;
          const value = body[field.name] !== undefined ? body[field.name] : existingLead[field.name];
          if (field.isRequired && (!value || String(value).trim() === '')) {
            return Response.json({ error: `${field.label || field.name} is required` }, { status: 400 });
          }
        }
      }
      
      if (settings.globalCustomFields) {
        for (const gField of settings.globalCustomFields) {
          if (gField.isRequired) {
            const bodyField = body.customFields?.find(f => f.label === gField.label);
            const existingField = existingLead.customFields?.find(f => f.label === gField.label);
            const customFieldValue = bodyField !== undefined ? bodyField.value : existingField?.value;
            
            if (!customFieldValue || String(customFieldValue).trim() === '') {
              return Response.json({ error: `${gField.label} is required` }, { status: 400 });
            }
          }
        }
      }
    } else {
      const name = body.name !== undefined ? body.name : existingLead.name;
      const phone = body.phone !== undefined ? body.phone : existingLead.phone;
      const service = body.service !== undefined ? body.service : existingLead.service;
      
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      if (!phone) return Response.json({ error: 'Phone is required' }, { status: 400 });
      if (!service) return Response.json({ error: 'Service is required' }, { status: 400 });
    }

    // Sanitize values that fail Mongoose casts
    if (body.assignedTo === '' || body.assignedTo === 'unassigned') {
      body.assignedTo = null;
    }
    if (body.nextCallDate === '' || body.nextCallDate === null) {
      body.nextCallDate = null;
    }
    // Ensure persistent leadId and leadNumber if missing
    if (!existingLead.leadNumber || !existingLead.leadId) {
      const highestLead = await Lead.findOne({ leadNumber: { $exists: true, $ne: null } })
        .sort({ leadNumber: -1 })
        .select('leadNumber')
        .lean();
      const nextNum = (highestLead && typeof highestLead.leadNumber === 'number') ? highestLead.leadNumber + 1 : 1001;
      body.leadNumber = nextNum;
      body.leadId = `INV-${nextNum}`;
    }

    // Sync multi-scheme totals with top-level financial metrics
    if (body.schemes && Array.isArray(body.schemes) && body.schemes.length > 0) {
      const totalSip = body.schemes.reduce((sum, s) => {
        if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
          return sum + (Number(s.sipAmount) || 0);
        }
        return sum;
      }, 0);
      const totalLumpsum = body.schemes.reduce((sum, s) => {
        if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
          return sum + (Number(s.investmentAmount) || 0);
        }
        return sum;
      }, 0);
      body.sipAmount = totalSip;
      body.investmentAmount = totalLumpsum;
      body.schemeName = body.schemes.map(s => s.schemeName).filter(Boolean).join(', ');
      if (body.schemes[0]?.service) body.service = body.schemes[0].service;
      if (body.schemes[0]?.sipDay) body.sipDay = body.schemes[0].sipDay;
      body.investmentType = totalSip > 0 && totalLumpsum > 0 ? 'Both' : totalSip > 0 ? 'Monthly SIP' : totalLumpsum > 0 ? 'Lumpsum' : (body.schemes[0]?.investmentType || 'Monthly SIP');
    }

    const lead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Track changes
    const changes = {};
    for (const key of Object.keys(body)) {
      // Skip internal fields
      if (['_id', 'createdAt', 'updatedAt', 'createdBy', '__v'].includes(key)) continue;

      let oldVal = existingLead[key];
      let newVal = body[key];

      if (key === 'onboardingData' || key === 'customFields') {
        oldVal = JSON.stringify(oldVal);
        newVal = JSON.stringify(newVal);
      }

      // Standardize comparison for dates
      if (oldVal instanceof Date || (typeof oldVal === 'string' && !isNaN(Date.parse(oldVal)) && oldVal.includes('-'))) {
        const oldTime = oldVal ? new Date(oldVal).getTime() : 0;
        const newTime = newVal ? new Date(newVal).getTime() : 0;
        if (oldTime !== newTime) {
          changes[key] = { from: oldVal, to: newVal };
        }
      } 
      // Standardize comparison for strings/others
      else if (String(oldVal || '') !== String(newVal || '')) {
        changes[key] = { from: oldVal, to: newVal };
      }
    }

    if (Object.keys(changes).length > 0) {
      await ActivityLog.create({
        userId: authUser._id,
        action: `Follow-up: Updated ${Object.keys(changes).join(', ')}`,
        entityType: 'Lead',
        entityId: lead._id,
        details: changes,
      });
    }

    return Response.json({ success: true, lead });
  } catch (error) {
    console.error('Update lead error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return Response.json({ error: messages.join(', ') }, { status: 400 });
    }
    return Response.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  await dbConnect();
  const { id } = await params;

  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  await ActivityLog.create({
    userId: authUser._id,
    action: `Deleted lead: ${lead.name}`,
    entityType: 'Lead',
    entityId: lead._id,
    details: { name: lead.name, phone: lead.phone },
  });

  return Response.json({ success: true });
}
