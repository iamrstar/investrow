import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

let transporter = global.nodemailerTransporter;

if (!transporter) {
  transporter = nodemailer.createTransport({
    pool: true, // Reuses 1 single persistent connection instead of logging in on every email
    maxConnections: 1, // STRICT: Exactly 1 persistent connection to Google SMTP (single login)
    maxMessages: 250, // Up to 250 messages per connection before recycling
    rateLimit: 2, // Max 2 messages per second to avoid Google flood protection
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
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

  global.nodemailerTransporter = transporter;
}

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

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const mailAttachments = [];

    if (fs.existsSync(logoPath)) {
      mailAttachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo' // matches src="cid:logo" in html
      });
    }

    if (Array.isArray(attachments) && attachments.length > 0) {
      mailAttachments.push(...attachments);
    }

    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Investrow'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: mailAttachments
    });
    console.log('Email sent: %s to %s', info.messageId, to);
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

  taskReminder: (name, taskTitle, dueDate, senderName) => ({
    subject: `Reminder: Task Overdue or Pending - ${taskTitle}`,
    html: wrapTemplate(`
      <h2 style="color: #ef4444; margin-top: 0;">Task Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a follow-up reminder from <strong>${senderName}</strong> regarding your pending task: <strong>${taskTitle}</strong>.</p>
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

  festiveGreeting: ({ clientName, festivalName, messageHtml, hasCardAttachment = false, bannerUrl, advisorName }) => {
    let bannerBlock = '';
    if (hasCardAttachment) {
      bannerBlock = `
        <div style="text-align: center; margin: 0 0 25px 0; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.1);">
          <img src="cid:festiveCard" alt="${festivalName || 'Festive'} Greetings Card" style="width: 100%; max-width: 540px; height: auto; display: block; margin: 0 auto; border-radius: 14px;" />
        </div>
      `;
    } else if (bannerUrl && bannerUrl.startsWith('http') && !bannerUrl.includes('localhost')) {
      bannerBlock = `
        <div style="text-align: center; margin: 0 0 25px 0; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.1);">
          <img src="${bannerUrl}" alt="${festivalName || 'Festive'} Greetings Card" style="width: 100%; max-width: 540px; height: auto; display: block; margin: 0 auto; border-radius: 14px;" />
        </div>
      `;
    }

    return {
      subject: `🪔 Happy ${festivalName || 'Festive Season'} & Wealth Wishes, ${clientName}!`,
      html: wrapTemplate(`
        ${bannerBlock}
        <h2 style="color: #c2410c; margin-top: 0; font-size: 22px; font-weight: 800;">Shubh ${festivalName || 'Festive Season'}, ${clientName}! 🪔✨</h2>
        <div style="font-size: 15px; color: #334155; line-height: 1.7; white-space: pre-line;">
${messageHtml}
        </div>
        <div style="margin: 30px 0 20px 0; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 5px solid #f59e0b;">
          <strong style="color: #92400e; font-size: 14px;">🌟 A Gift of Prosperity for Tomorrow:</strong>
          <p style="margin: 6px 0 0 0; color: #78350f; font-size: 13.5px;">This festive season, gift your family the security of disciplined compounding. A small incremental SIP started today transforms into substantial wealth over time.</p>
        </div>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="https://investrow.in" 
             style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);">
            Explore Wealth Plans & SIPs
          </a>
        </div>
        <p style="margin-top: 25px; font-size: 13px; color: #64748b;">Warm Regards,<br><strong style="color: #1e293b;">${advisorName || 'Team Investrow'}</strong><br>Investrow Financial Services</p>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 10px;">Mutual Fund investments are subject to market risks. Read all scheme related documents carefully.</p>
      `)
    };
  },

  custom: (subject, content) => ({
    subject: subject || 'Message from Investrow',
    html: wrapTemplate(content || ''),
  }),

  salarySlip: ({
    employeeName,
    employeeId,
    designation,
    month,
    year,
    paymentDate,
    baseSalary = 0,
    earnings = [],
    deductions = [],
    grossEarnings = 0,
    totalDeductions = 0,
    netPay = 0,
    notes = '',
  }) => {
    const formatINR = (val) => Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

    // Build earnings rows
    const allEarnings = [
      { label: 'Basic Salary', amount: Number(baseSalary) },
      ...earnings.filter(e => e.label && e.label.trim() !== '')
    ];

    const allDeductions = deductions.filter(d => d.label && d.label.trim() !== '');

    const maxRows = Math.max(allEarnings.length, allDeductions.length, 1);
    let rowsHtml = '';
    for (let i = 0; i < maxRows; i++) {
      const earn = allEarnings[i];
      const ded = allDeductions[i];
      const isEven = i % 2 === 0;
      const bg = isEven ? '#ffffff' : '#f8fafc';

      rowsHtml += `
        <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 10px 14px; color: #334155;">${earn ? earn.label : '-'}</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: #0f172a;">${earn ? formatINR(earn.amount) : '-'}</td>
          <td style="padding: 10px 14px; color: #334155; border-left: 1px solid #e2e8f0;">${ded ? ded.label : '-'}</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: #dc2626;">${ded ? formatINR(ded.amount) : '-'}</td>
        </tr>
      `;
    }

    return {
      subject: `Salary Statement for ${month} ${year} - ${employeeName}`,
      html: wrapTemplate(`
        <div style="border-bottom: 2px solid #0ea5e9; padding-bottom: 14px; margin-bottom: 20px;">
          <span style="display: inline-block; background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Confidential</span>
          <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">Salary Payslip: ${month} ${year}</h2>
        </div>

        <p style="margin-top: 0; font-size: 14px; color: #475569;">
          Dear <strong>${employeeName}</strong>,<br>
          Your salary for the month of <strong>${month} ${year}</strong> has been processed and released. Below is the detailed breakdown of your earnings, allowances, and deductions.
        </p>

        <!-- Employee Details Card -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px;">
          <tr>
            <td style="padding: 10px 14px; color: #64748b; width: 25%;"><strong>Employee Name:</strong></td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; width: 25%;">${employeeName}</td>
            <td style="padding: 10px 14px; color: #64748b; width: 25%;"><strong>Employee ID:</strong></td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; width: 25%;">${employeeId || 'N/A'}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b;"><strong>Designation:</strong></td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${designation || 'Staff'}</td>
            <td style="padding: 10px 14px; color: #64748b;"><strong>Pay Date:</strong></td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${formattedDate}</td>
          </tr>
        </table>

        <!-- Salary Breakdown Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 14px; text-align: left; width: 35%;">Earnings Item</th>
              <th style="padding: 10px 14px; text-align: right; width: 15%;">Amount</th>
              <th style="padding: 10px 14px; text-align: left; width: 35%; border-left: 1px solid #334155;">Deductions Item</th>
              <th style="padding: 10px 14px; text-align: right; width: 15%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 700; font-size: 13px; border-top: 2px solid #cbd5e1;">
              <td style="padding: 10px 14px; color: #0f172a;">Gross Earnings</td>
              <td style="padding: 10px 14px; text-align: right; color: #059669;">${formatINR(grossEarnings)}</td>
              <td style="padding: 10px 14px; color: #0f172a; border-left: 1px solid #cbd5e1;">Total Deductions</td>
              <td style="padding: 10px 14px; text-align: right; color: #dc2626;">${formatINR(totalDeductions)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Net Pay Box -->
        <div style="margin: 24px 0 16px 0; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 4px;">Net In-Hand Salary Payable</div>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${formatINR(netPay)}</div>
        </div>

        ${notes ? `
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #1e40af;">
            <strong>Remarks / Notes:</strong> ${notes}
          </div>
        ` : ''}

        <p style="font-size: 12px; color: #64748b; margin-top: 25px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          <em>Note: This is an official, computer-generated document issued by Investrow Financial Services. For any clarification regarding tax, calculations, or payroll, please get in touch with Accounts / Management.</em>
        </p>
      `),
    };
  },
};
