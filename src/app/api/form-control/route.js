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
      settings = new FormControl(DEFAULT_SETTINGS);
    }

    if (body.defaultFields) settings.defaultFields = body.defaultFields;
    if (body.globalCustomFields) settings.globalCustomFields = body.globalCustomFields;

    await settings.save();
    
    return Response.json({ success: true, settings });
  } catch (error) {
    return Response.json({ error: 'Failed to update form control settings' }, { status: 500 });
  }
}
