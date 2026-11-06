import dbConnect from '@/lib/db';
import User from '@/models/User';
import SalarySlip from '@/models/SalarySlip';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, checkRole, unauthorized, forbidden } from '@/lib/middleware';
import { sendEmail, templates } from '@/lib/email';
import { generateSalarySlipPdf } from '@/lib/salarySlipPdf';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const download = searchParams.get('download');
  const slipId = searchParams.get('slipId');

  // Handle PDF Download
  if (download === 'pdf' && slipId) {
    try {
      const slip = await SalarySlip.findById(slipId).lean();
      if (!slip) return Response.json({ error: 'Salary slip not found' }, { status: 404 });

      // Permission check: only admin or the employee themselves can download
      if (authUser.role !== 'admin' && String(slip.userId) !== String(authUser._id)) {
        return forbidden();
      }

      const pdfBuffer = await generateSalarySlipPdf(slip);
      const safeName = (slip.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="SalarySlip_${safeName}_${slip.month}_${slip.year}.pdf"`,
        }
      });
    } catch (e) {
      console.error('PDF download error:', e);
      return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
  }

  const filter = {};

  if (authUser.role === 'admin') {
    if (userId) filter.userId = userId;
  } else {
    // Non-admins can only see their own salary slips
    filter.userId = authUser._id;
  }

  if (month) filter.month = month;
  if (year) filter.year = Number(year);

  try {
    const slips = await SalarySlip.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json({ success: true, slips });
  } catch (error) {
    console.error('Fetch salary slips error:', error);
    return Response.json({ error: 'Failed to fetch salary slips' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (!checkRole(authUser, ['admin'])) return forbidden();

  try {
    await dbConnect();
    const body = await request.json();
    const {
      userId,
      employeeId = '',
      designation = '',
      month,
      year,
      baseSalary = 0,
      earnings = [],
      deductions = [],
      grossEarnings = 0,
      totalDeductions = 0,
      netPay = 0,
      paymentDate = new Date(),
      notes = '',
      updateDefaultSalary = false,
      sendEmailNotification = true,
    } = body;

    if (!userId || !month || !year) {
      return Response.json({ error: 'User ID, month, and year are required' }, { status: 400 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Clean earnings and deductions
    const cleanEarnings = (Array.isArray(earnings) ? earnings : [])
      .filter(item => item && item.label && item.label.trim() !== '')
      .map(item => ({ label: String(item.label).trim(), amount: Math.max(0, Number(item.amount) || 0) }));

    const cleanDeductions = (Array.isArray(deductions) ? deductions : [])
      .filter(item => item && item.label && item.label.trim() !== '')
      .map(item => ({ label: String(item.label).trim(), amount: Math.max(0, Number(item.amount) || 0) }));

    // Optionally update user's default salary, designation, PF and PT
    if (updateDefaultSalary || (!targetUser.salary && Number(baseSalary) > 0)) {
      targetUser.salary = Number(baseSalary);
      if (designation) targetUser.designation = designation;

      const pfItem = cleanDeductions.find(d => /provident\s*fund|pf/i.test(d.label));
      if (pfItem) targetUser.pf = pfItem.amount;

      const ptItem = cleanDeductions.find(d => /professional\s*tax|pt/i.test(d.label));
      if (ptItem) targetUser.professionalTax = ptItem.amount;

      await targetUser.save();
    } else if (designation && !targetUser.designation) {
      targetUser.designation = designation;
      await targetUser.save();
    }

    const calculatedGross = Number(baseSalary) + cleanEarnings.reduce((acc, curr) => acc + curr.amount, 0);
    const calculatedDeductions = cleanDeductions.reduce((acc, curr) => acc + curr.amount, 0);
    const calculatedNet = calculatedGross - calculatedDeductions;

    // Create Salary Slip
    const salarySlip = await SalarySlip.create({
      userId: targetUser._id,
      employeeName: targetUser.name,
      employeeEmail: targetUser.email,
      designation: designation || targetUser.designation || 'Staff',
      employeeId: employeeId || '',
      month,
      year: Number(year),
      paymentDate: new Date(paymentDate),
      baseSalary: Number(baseSalary),
      earnings: cleanEarnings,
      deductions: cleanDeductions,
      grossEarnings: calculatedGross,
      totalDeductions: calculatedDeductions,
      netPay: calculatedNet,
      notes: notes || '',
      status: 'Released',
      releasedBy: authUser._id,
      releasedAt: new Date(),
    });

    let emailSent = false;
    let emailError = null;

    if (sendEmailNotification) {
      try {
        const slipDetails = {
          employeeName: targetUser.name,
          employeeId: employeeId || '',
          designation: designation || targetUser.designation || 'Staff',
          month,
          year,
          paymentDate,
          baseSalary: Number(baseSalary),
          earnings: cleanEarnings,
          deductions: cleanDeductions,
          grossEarnings: calculatedGross,
          totalDeductions: calculatedDeductions,
          netPay: calculatedNet,
          notes,
        };

        const emailTemplate = templates.salarySlip(slipDetails);

        // Generate official Salary Slip PDF buffer to attach
        let pdfAttachments = [];
        try {
          const pdfBuffer = await generateSalarySlipPdf(slipDetails);
          const safeEmpName = (targetUser.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
          const pdfFilename = `SalarySlip_${safeEmpName}_${month}_${year}.pdf`;

          pdfAttachments.push({
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        } catch (pdfErr) {
          console.error('Failed to generate PDF attachment:', pdfErr);
        }

        const emailResult = await sendEmail({
          to: targetUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          attachments: pdfAttachments,
        });

        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
        }
      } catch (err) {
        console.error('Failed to send salary slip email:', err);
        emailError = err.message;
      }
    }

    // Log Activity
    await ActivityLog.create({
      userId: authUser._id,
      action: `Released salary slip to ${targetUser.name} for ${month} ${year} (₹${calculatedNet.toLocaleString('en-IN')})`,
      entityType: 'User',
      entityId: targetUser._id,
      details: {
        salarySlipId: salarySlip._id,
        month,
        year,
        netPay: calculatedNet,
        emailSent,
        emailError,
      },
    });

    return Response.json({
      success: true,
      message: `Salary slip for ${month} ${year} released successfully${emailSent ? ' with PDF attachment sent to ' + targetUser.email : ''}!`,
      salarySlip,
      emailSent,
      emailError,
    }, { status: 201 });
  } catch (error) {
    console.error('Salary slip release error:', error);
    return Response.json({ error: error.message || 'Failed to release salary slip' }, { status: 500 });
  }
}

    // Log Activity
    await ActivityLog.create({
      userId: authUser._id,
      action: `Released salary slip to ${targetUser.name} for ${month} ${year} (₹${calculatedNet.toLocaleString('en-IN')})`,
      entityType: 'User',
      entityId: targetUser._id,
      details: {
        salarySlipId: salarySlip._id,
        month,
        year,
        netPay: calculatedNet,
        emailSent,
        emailError,
      },
    });

    return Response.json({
      success: true,
      message: `Salary slip for ${month} ${year} released successfully${emailSent ? ' and sent to ' + targetUser.email : ''}!`,
      salarySlip,
      emailSent,
      emailError,
    }, { status: 201 });
  } catch (error) {
    console.error('Salary slip release error:', error);
    return Response.json({ error: error.message || 'Failed to release salary slip' }, { status: 500 });
  }
}

