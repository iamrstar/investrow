import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Investrow'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const templates = {
  welcome: (name, role) => ({
    subject: `Welcome to ${process.env.COMPANY_NAME}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0ea5e9;">Welcome, ${name}!</h2>
        <p>Your account has been created on the <strong>Investrow CRM</strong> as a <strong>${role}</strong>.</p>
        <p>You can now log in using your email address and the password provided by your administrator.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
             style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login Now
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 0.8rem;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  }),
  
  sipReminder: (clientName, serviceName) => ({
    subject: `Friendly Reminder: Your ${serviceName} Next Step`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f97316;">Hello ${clientName},</h2>
        <p>This is a friendly reminder from <strong>Investrow Financial Services</strong> regarding your interest in <strong>${serviceName}</strong>.</p>
        <p>It's a great time to start your SIP or review your investment goals. Our experts are ready to assist you with the next steps.</p>
        <p>If you have any questions, feel free to contact your dedicated executive.</p>
        <div style="margin: 20px 0; background: #fff7ed; padding: 15px; border-left: 4px solid #f97316;">
          <strong>Tip:</strong> Even small monthly contributions can grow significantly over time through the power of compounding.
        </div>
        <p>Best Regards,<br>Team Investrow</p>
      </div>
    `,
  }),

  taskAlert: (taskTitle, dueDate, createdBy) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #8b5cf6;">New Task Assignment</h2>
        <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
        <p><strong>Assigned By:</strong> ${createdBy}</p>
        <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
             style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Task
          </a>
        </div>
      </div>
    `,
  }),

  taskReminder: (name, taskTitle, dueDate, managerName) => ({
    subject: `Reminder: Action Required on ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Task Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder from your manager, <strong>${managerName}</strong>, regarding the pending task: <strong>${taskTitle}</strong>.</p>
        <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'Urgent'}</p>
        <p>Please provide an update or complete this task as soon as possible.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
             style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Task Details
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 0.8rem;">Investrow Management System</p>
      </div>
    `,
  }),
};
