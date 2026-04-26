import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuthUser, unauthorized } from '@/lib/middleware';
import { sendEmail, templates } from '@/lib/email';

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  try {
    const body = await request.json();
    const { leadId, taskId, templateType, subject, content } = body;
    if (!templateType) {
      return Response.json({ error: 'Template Type is required' }, { status: 400 });
    }

    await dbConnect();
    let emailData;
    let recipientEmail;

    if (taskId && templateType === 'taskReminder') {
      const Task = (await import('@/models/Task')).default;
      const task = await Task.findById(taskId).populate('assignedTo');
      if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });
      if (!task.assignedTo?.email) return Response.json({ error: 'Assigned user lacks an email' }, { status: 400 });
      
      recipientEmail = task.assignedTo.email;
      emailData = templates.taskReminder(task.assignedTo.name, task.title, task.dueDate, authUser.name);
    } else if (leadId) {
      const lead = await Lead.findById(leadId);
      if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });
      if (!lead.email) return Response.json({ error: 'Lead does not have an email' }, { status: 400 });
      
      recipientEmail = lead.email;
      if (templateType === 'sipReminder') {
        emailData = templates.sipReminder(lead.name, lead.service);
      } else if (templateType === 'followUp') {
        emailData = {
          subject: `Follow-up from Investrow: ${lead.service}`,
          html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Hi ${lead.name},</h2><p>Following up on our conversation regarding <strong>${lead.service}</strong>.</p><p>Regards,<br>Team Investrow</p></div>`
        };
      } else if (templateType === 'promotional') {
        emailData = templates.promotional(lead.name);
      } else if (templateType === 'strategyMarketing') {
        emailData = templates.strategyMarketing(lead.name);
      } else if (templateType === 'custom') {
        emailData = templates.custom(subject, content);
      }
    } else {
      return Response.json({ error: 'Lead ID or Task ID required' }, { status: 400 });
    }

    if (!emailData || !recipientEmail) {
      return Response.json({ error: 'Could not prepare email data' }, { status: 400 });
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: emailData.subject,
      html: emailData.html,
    });

    if (result.success) {
      return Response.json({ success: true, message: 'Email sent successfully' });
    } else {
      return Response.json({ 
        error: `Failed to send email: ${result.error}`, 
        code: result.code 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Email API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
