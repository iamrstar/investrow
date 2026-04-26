import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: (process.env.SMTP_PORT === '465'), // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  requireTLS: process.env.SMTP_PORT === '587' || process.env.SMTP_PORT === '25',
});

const wrapTemplate = (content) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f9; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
      <div style="background: #1e293b; padding: 25px; text-align: center;">
        <img src="cid:logo" alt="Investrow Logo" style="height: 45px;">
      </div>
      <div style="padding: 35px 30px; color: #334155; line-height: 1.6;">
        ${content}
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #edf2f7; color: #64748b; font-size: 13px;">
        <strong>Investrow Financial Services</strong><br>
        Transforming Wealth Management<br><br>
        &copy; ${new Date().getFullYear()} Investrow. All rights reserved.
      </div>
    </div>
  </div>
`;

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    
    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Investrow'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo' // matches src="cid:logo" in html
      }]
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    if (error.response) console.error('SMTP Response:', error.response);
    return { success: false, error: error.message, code: error.code };
  }
};

export const templates = {
  welcome: (name, role) => ({
    subject: `Welcome to ${process.env.COMPANY_NAME}!`,
    html: wrapTemplate(`
      <h2 style="color: #0ea5e9; margin-top: 0;">Welcome, ${name}!</h2>
      <p>We are excited to have you on board. Your account has been successfully created on the <strong>Investrow CRM</strong> with the role of <strong>${role}</strong>.</p>
      <p>You can now access your dashboard using your registered email address and the secure password provided by your administrator.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
           style="background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; transition: background 0.3s ease;">
          Login to Dashboard
        </a>
      </div>
      <p style="font-size: 0.9rem; color: #64748b;">If you have any trouble logging in, please contact your system administrator.</p>
    `),
  }),
  
  sipReminder: (clientName, serviceName) => ({
    subject: `Friendly Reminder: Your ${serviceName} Investment`,
    html: wrapTemplate(`
      <h2 style="color: #f97316; margin-top: 0;">Hello ${clientName},</h2>
      <p>This is a friendly follow-up from <strong>Investrow Financial Services</strong> regarding your interest in <strong>${serviceName}</strong>.</p>
      <p>Consistency is key to wealth creation. It's a great time to start your SIP or review your investment portfolio. Our experts are ready to guide you through the next steps.</p>
      <div style="margin: 25px 0; background: #fff7ed; padding: 20px; border-radius: 10px; border-left: 5px solid #f97316;">
        <strong style="color: #c2410c;">Wealth Tip:</strong> Rupee cost averaging through SIPs helps you navigate market volatility effectively.
      </div>
      <p>Feel free to reach out if you have any questions or need further assistance.</p>
      <p>Best Regards,<br><strong>Team Investrow</strong></p>
    `),
  }),

  taskAlert: (taskTitle, dueDate, createdBy) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: wrapTemplate(`
      <h2 style="color: #8b5cf6; margin-top: 0;">Action Required: New Task</h2>
      <p>You have been assigned a new task on the CRM portal.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Task:</strong> ${taskTitle}</p>
        <p style="margin: 5px 0;"><strong>Assigned By:</strong> ${createdBy}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
           style="background-color: #8b5cf6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          View Task Details
        </a>
      </div>
    `),
  }),

  taskReminder: (name, taskTitle, dueDate, managerName) => ({
    subject: `Reminder: Task Overdue or Pending - ${taskTitle}`,
    html: wrapTemplate(`
      <h2 style="color: #ef4444; margin-top: 0;">Task Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a follow-up reminder from <strong>${managerName}</strong> regarding your pending task: <strong>${taskTitle}</strong>.</p>
      <div style="border-left: 4px solid #ef4444; padding-left: 15px; margin: 20px 0;">
        <p><strong>Status:</strong> Pending Action</p>
        <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'Immediate'}</p>
      </div>
      <p>Please update the task status or complete the required actions as soon as possible.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" 
           style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Open Tasks
        </a>
      </div>
    `),
  }),
  
  promotional: (name) => ({
    subject: `Exclusive Financial Insights from Investrow`,
    html: wrapTemplate(`
      <h2 style="color: #0ea5e9; margin-top: 0;">Hello ${name},</h2>
      <p>Unlock the potential of your wealth with Investrow's premium financial services.</p>
      <p>We offer tailored investment strategies designed to help you achieve your financial goals with confidence. Whether it's Mutual Funds, Insurance, or Tax Planning, we have the expertise to guide you.</p>
      <div style="margin: 25px 0; background: #f0f9ff; padding: 20px; border-radius: 10px; border-left: 5px solid #0ea5e9;">
        <strong style="color: #0369a1;">Why Choose Us?</strong> Our data-driven approach and personalized attention ensure your portfolio stays robust in any market condition.
      </div>
      <p>Ready to take the next step? Reply to this email or visit our website to learn more.</p>
      <p>Best Regards,<br><strong>Team Investrow</strong></p>
    `),
  }),

  strategyMarketing: (name) => ({
    subject: `Strategic Wealth Management Strategy for ${name}`,
    html: wrapTemplate(`
      <h2 style="color: #8b5cf6; margin-top: 0;">Strategic Financial Planning</h2>
      <p>Dear ${name},</p>
      <p>At Investrow, we believe that a well-defined strategy is the foundation of financial success.</p>
      <p>We've developed a comprehensive marketing and investment strategy that aligns with current market trends and your unique financial profile. Let's discuss how we can optimize your returns while managing risks effectively.</p>
      <div style="margin: 25px 0; background: #f5f3ff; padding: 20px; border-radius: 10px; border-left: 5px solid #8b5cf6;">
        <strong style="color: #6d28d9;">Strategy Focus:</strong> Diversification, Disciplined Investing, and Long-term Value Creation.
      </div>
      <p>We are available for a brief consultation at your convenience.</p>
      <p>Warm Regards,<br><strong>Team Investrow</strong></p>
    `),
  }),

  custom: (subject, content) => ({
    subject: subject || 'Message from Investrow',
    html: wrapTemplate(content || ''),
  }),
};
