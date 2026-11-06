import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num <= 0) return 'Zero Rupees Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let n = num;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  let str = '';
  if (crore) str += inWords(crore) + ' Crore ';
  if (lakh) str += inWords(lakh) + ' Lakh ';
  if (thousand) str += inWords(thousand) + ' Thousand ';
  if (hundred) str += inWords(hundred) + ' Hundred ';
  if (rest) str += (str ? 'and ' : '') + inWords(rest) + ' ';

  return str.trim() + ' Rupees Only';
}

export function generateSalarySlipPdf({
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
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const formatINR = (val) => 'Rs. ' + Number(val || 0).toLocaleString('en-IN');
      const formattedDate = paymentDate 
        ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN');

      // Top Accent Line
      doc.rect(40, 40, 515, 4).fill('#0ea5e9');

      // Header: Logo & Company Name
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const startY = 55;
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, startY, { height: 35 });
        } catch (imgErr) {
          doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold').text('INVESTROW', 40, startY);
        }
      } else {
        doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold').text('INVESTROW', 40, startY);
      }

      // Title on the right
      doc.fontSize(10).fillColor('#0284c7').font('Helvetica-Bold').text('CONFIDENTIAL PAYSLIP', 350, startY, { align: 'right', width: 205 });
      doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text(`${String(month || '').toUpperCase()} ${year}`, 350, startY + 14, { align: 'right', width: 205 });
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(`Pay Date: ${formattedDate}`, 350, startY + 32, { align: 'right', width: 205 });

      // Company Subtitle
      doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text('Investrow Financial Services Private Limited', 40, startY + 38);
      doc.fontSize(7.5).fillColor('#94a3b8').text('CIN: U67190MH2021PTC368921 | Wealth Management & Advisory Services', 40, startY + 50);

      // Divider
      doc.moveTo(40, startY + 68).lineTo(555, startY + 68).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Employee Details Card
      const cardY = startY + 76;
      doc.roundedRect(40, cardY, 515, 62, 6).fillAndStroke('#f8fafc', '#e2e8f0');

      // Column 1
      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('EMPLOYEE NAME', 55, cardY + 10);
      doc.fontSize(9.5).fillColor('#0f172a').font('Helvetica-Bold').text(String(employeeName || 'Employee'), 55, cardY + 20);

      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('DESIGNATION', 55, cardY + 36);
      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text(String(designation || 'Staff'), 55, cardY + 46);

      // Column 2
      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('EMPLOYEE ID', 220, cardY + 10);
      doc.fontSize(9.5).fillColor('#0284c7').font('Helvetica-Bold').text(String(employeeId || 'N/A'), 220, cardY + 20);

      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('PAY PERIOD', 220, cardY + 36);
      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text(`${month} ${year}`, 220, cardY + 46);

      // Column 3
      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('PAYMENT MODE', 390, cardY + 10);
      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text('Bank Transfer / NEFT', 390, cardY + 20);

      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('STATUS', 390, cardY + 36);
      doc.fontSize(9).fillColor('#059669').font('Helvetica-Bold').text('Processed & Released', 390, cardY + 46);

      // Earnings & Deductions Table
      const tableY = cardY + 74;
      const colWidth = 257.5;

      // Table Header
      doc.rect(40, tableY, colWidth, 22).fill('#0f172a');
      doc.rect(40 + colWidth, tableY, colWidth, 22).fill('#1e293b');

      doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('EARNINGS & ALLOWANCES', 50, tableY + 7);
      doc.text('AMOUNT', 40 + colWidth - 70, tableY + 7, { width: 60, align: 'right' });

      doc.text('DEDUCTIONS', 40 + colWidth + 10, tableY + 7);
      doc.text('AMOUNT', 555 - 70, tableY + 7, { width: 60, align: 'right' });

      // Rows
      const allEarnings = [
        { label: 'Basic / Base Salary', amount: Number(baseSalary) },
        ...earnings.filter(e => e.label && String(e.label).trim() !== '')
      ];
      const allDeductions = deductions.filter(d => d.label && String(d.label).trim() !== '');
      const maxRows = Math.max(allEarnings.length, allDeductions.length, 1);

      let currentY = tableY + 22;
      const rowHeight = 20;

      for (let i = 0; i < maxRows; i++) {
        const earn = allEarnings[i];
        const ded = allDeductions[i];
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';

        // Background row
        doc.rect(40, currentY, 515, rowHeight).fill(bg);
        doc.rect(40, currentY, 515, rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        // Divider down the middle
        doc.moveTo(40 + colWidth, currentY).lineTo(40 + colWidth, currentY + rowHeight).strokeColor('#cbd5e1').stroke();

        // Earn
        if (earn) {
          doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(earn.label, 50, currentY + 5, { width: 170 });
          doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold').text(formatINR(earn.amount), 40 + colWidth - 80, currentY + 5, { width: 70, align: 'right' });
        }

        // Ded
        if (ded) {
          doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(ded.label, 40 + colWidth + 10, currentY + 5, { width: 170 });
          doc.fontSize(8.5).fillColor('#dc2626').font('Helvetica-Bold').text(formatINR(ded.amount), 555 - 80, currentY + 5, { width: 70, align: 'right' });
        }

        currentY += rowHeight;
      }

      // Total Row
      doc.rect(40, currentY, 515, 24).fill('#f1f5f9');
      doc.rect(40, currentY, 515, 24).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.moveTo(40 + colWidth, currentY).lineTo(40 + colWidth, currentY + 24).strokeColor('#cbd5e1').stroke();

      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text('Gross Earnings', 50, currentY + 7);
      doc.fontSize(9.5).fillColor('#059669').font('Helvetica-Bold').text(formatINR(grossEarnings), 40 + colWidth - 90, currentY + 7, { width: 80, align: 'right' });

      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text('Total Deductions', 40 + colWidth + 10, currentY + 7);
      doc.fontSize(9.5).fillColor('#dc2626').font('Helvetica-Bold').text(formatINR(totalDeductions), 555 - 90, currentY + 7, { width: 80, align: 'right' });

      currentY += 34;

      // Net Pay Card
      doc.roundedRect(40, currentY, 515, 52, 8).fill('#059669');

      doc.fontSize(8).fillColor('#d1fae5').font('Helvetica-Bold').text('NET TAKE-HOME PAY (IN-HAND)', 55, currentY + 10);
      doc.fontSize(8).fillColor('#ecfdf5').font('Helvetica').text(`Amount in words: ${numberToWordsINR(netPay)}`, 55, currentY + 26, { width: 330 });

      doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold').text(formatINR(netPay), 370, currentY + 16, { width: 170, align: 'right' });

      currentY += 66;

      // Remarks / Notes
      if (notes) {
        doc.roundedRect(40, currentY, 515, 26, 4).fillAndStroke('#eff6ff', '#bfdbfe');
        doc.fontSize(8).fillColor('#1e40af').font('Helvetica-Bold').text('Remarks: ', 50, currentY + 8, { continued: true });
        doc.font('Helvetica').text(notes);
        currentY += 36;
      }

      // Signatory Section
      const signY = currentY + 15;
      doc.moveTo(380, signY).lineTo(540, signY).strokeColor('#94a3b8').lineWidth(1).stroke();
      doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold').text('Investrow Financial Services', 380, signY + 5, { width: 160, align: 'center' });
      doc.fontSize(7.5).fillColor('#64748b').font('Helvetica').text('Authorized Signatory', 380, signY + 16, { width: 160, align: 'center' });

      // Disclaimer Footer
      const footerY = 770;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica').text(
        'This is a computer-generated salary slip and does not require a physical signature. For queries, contact Accounts / HR.',
        40, footerY + 6, { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

