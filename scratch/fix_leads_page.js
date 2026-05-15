const fs = require('fs');
const path = 'd:/WEB DEV/A1 Network/investrow CRM/src/app/(dashboard)/leads/page.js';
let content = fs.readFileSync(path, 'utf8');

const oldDefaults = `    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Lead Reference', required: false }
    };`;

const newDefaults = `    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Lead Reference', required: false },
      response: { label: 'Response', required: false },
      callStatus: { label: 'Call Status', required: false },
      interestedInService: { label: 'Interested in Service', required: false },
      serviceTaken: { label: 'Service Taken', required: false },
      nextCallDate: { label: 'Next Call Date', required: false },
      followUpDate: { label: 'Follow-up Date', required: false },
      remarks: { label: 'Remarks', required: false }
    };`;

if (content.includes(oldDefaults)) {
  content = content.replace(oldDefaults, newDefaults);
  
  // Also update return lines to handle fallback
  content = content.replace('if (!formSettings?.defaultFields) return defaults[name];', 'if (!formSettings?.defaultFields) return defaults[name] || { label: name, required: false };');
  content = content.replace('return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : defaults[name];', 'return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : (defaults[name] || { label: name, required: false });');

  fs.writeFileSync(path, content);
  console.log('Successfully updated leads/page.js');
} else {
  console.log('Could not find oldDefaults');
}
