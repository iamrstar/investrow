import dbConnect from '@/lib/db';
import FormControl from '@/models/FormControl';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';

const getDefaultSettings = (type) => {
  const fields = [
    { name: 'name', label: 'Name', isRequired: true },
    { name: 'phone', label: 'Phone', isRequired: true },
    { name: 'email', label: 'Email', isRequired: false },
    { name: 'service', label: 'Service', isRequired: true },
    { name: 'location', label: 'Location', isRequired: false },
    { name: 'leadReference', label: type === 'client' ? 'Client Reference' : 'Lead Reference', isRequired: false },
  ];

  if (type === 'lead') {
    fields.push(
      { name: 'callStatus', label: 'Call Status', isRequired: false },
      { name: 'interestedInService', label: 'Interested in Service', isRequired: false },
      { name: 'serviceTaken', label: 'Service Taken', isRequired: false },
      { name: 'nextCallDate', label: 'Next Call Date', isRequired: false },
      { name: 'followUpDate', label: 'Follow-up Date', isRequired: false },
      { name: 'remarks', label: 'Remarks', isRequired: false }
    );
  }

  return {
    defaultFields: fields,
    globalCustomFields: []
  };
};

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'lead'; // Default to lead
  const singletonId = `${type}_settings`;

  try {
    await dbConnect();
    let settings = await FormControl.findOne({ singletonId });
    
    // Migration: if lead_settings not found, try to find old 'settings' and rename it
    if (!settings && type === 'lead') {
      settings = await FormControl.findOne({ singletonId: 'settings' });
      if (settings) {
        settings.singletonId = 'lead_settings';
        await settings.save();
      }
    }

    if (!settings) {
      settings = await FormControl.create({ ...getDefaultSettings(type), singletonId });
    } else {
      // Ensure all default fields from getDefaultSettings exist
      const defaultSet = getDefaultSettings(type);
      let changed = false;

      // Add missing fields
      defaultSet.defaultFields.forEach(df => {
        if (!settings.defaultFields.some(f => f.name === df.name)) {
          settings.defaultFields.push(df);
          changed = true;
        }
      });

      // Remove forbidden fields for clients
      if (type === 'client') {
        const forbiddenFields = ['callStatus', 'serviceTaken', 'nextCallDate', 'followUpDate', 'remarks', 'interestedInService'];
        const filtered = settings.defaultFields.filter(f => !forbiddenFields.includes(f.name));
        if (filtered.length !== settings.defaultFields.length) {
          settings.defaultFields = filtered;
          changed = true;
        }
      }

      if (changed) {
        await settings.save();
      }
    }
    
    return Response.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch form control error:', error);
    return Response.json({ error: 'Failed to fetch form control settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'lead';
  const singletonId = `${type}_settings`;

  try {
    await dbConnect();
    const body = await request.json();
    
    let settings = await FormControl.findOne({ singletonId });
    if (!settings) {
      // Check if we need to migrate first
      if (type === 'lead') {
        settings = await FormControl.findOne({ singletonId: 'settings' });
      }
      
      if (settings) {
        settings.singletonId = singletonId;
      } else {
        settings = new FormControl({ singletonId });
      }
    }

    if (body.defaultFields) {
      settings.defaultFields = body.defaultFields.map(f => ({
        name: f.name,
        label: f.label,
        isRequired: !!f.isRequired,
        minLength: f.minLength || null,
        maxLength: f.maxLength || null
      }));
    }

    if (body.globalCustomFields) {
      settings.globalCustomFields = body.globalCustomFields.map(f => ({
        label: f.label,
        fieldType: f.fieldType || 'Short answer',
        options: Array.isArray(f.options) ? f.options.filter(o => typeof o === 'string' && o.trim() !== '') : [],
        isRequired: !!f.isRequired,
        minLength: f.minLength || null,
        maxLength: f.maxLength || null
      }));
    }

    await settings.save();
    
    return Response.json({ success: true, settings });
  } catch (error) {
    console.error('Form control update error:', error);
    return Response.json({ error: error.message || 'Failed to update form control settings' }, { status: 500 });
  }
}
