import dbConnect from '@/lib/db';
import FormControl from '@/models/FormControl';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';

const DEFAULT_SETTINGS = {
  singletonId: 'settings',
  defaultFields: [
    { name: 'name', label: 'Name', isRequired: true },
    { name: 'phone', label: 'Phone', isRequired: true },
    { name: 'email', label: 'Email', isRequired: false },
    { name: 'service', label: 'Service', isRequired: true },
    { name: 'location', label: 'Location', isRequired: false },
    { name: 'leadReference', label: 'Lead Reference', isRequired: false },
  ],
  globalCustomFields: []
};

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  try {
    await dbConnect();
    let settings = await FormControl.findOne({ singletonId: 'settings' });
    
    if (!settings) {
      settings = await FormControl.create(DEFAULT_SETTINGS);
    }
    
    return Response.json({ success: true, settings });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch form control settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();
    
    let settings = await FormControl.findOne({ singletonId: 'settings' });
    if (!settings) {
      settings = new FormControl({ singletonId: 'settings' });
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
