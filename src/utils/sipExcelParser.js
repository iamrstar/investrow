import * as XLSX from 'xlsx';

/**
 * Parses SIP schemes from an Excel (.xlsx / .xls) or CSV workbook.
 * Designed to parse both IFA-Planet exports (with client headers and merged cells)
 * and generic tabular SIP spreadsheets.
 */
export function parseSipExcel(workbook) {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Invalid Excel workbook: No sheets found');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let clientInfo = null;
  const schemes = [];

  // Helper: Month name to 2-digit month
  const monthMap = { 
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', 
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' 
  };

  function parseDateStr(val) {
    if (!val) return '';
    if (typeof val === 'number') {
      const d = XLSX.SSF.parse_date_code(val);
      if (d) {
        const year = d.y;
        const month = String(d.m).padStart(2, '0');
        const day = String(d.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    const str = String(val).trim();
    // Try DD Mon YYYY like "20 Nov 2019"
    const dmyMatch = str.match(/^(\d{1,2})[\s\-\/]([a-zA-Z]{3,})[\s\-\/](\d{2,4})$/);
    if (dmyMatch) {
      const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
      const mon = monthMap[dmyMatch[2].toLowerCase().slice(0, 3)] || '01';
      let yr = dmyMatch[3];
      if (yr.length === 2) yr = '20' + yr;
      return `${yr}-${mon}-${day}`;
    }
    // Try DD/MM/YYYY
    const slashMatch = str.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (slashMatch) {
      const day = String(parseInt(slashMatch[1], 10)).padStart(2, '0');
      const mon = String(parseInt(slashMatch[2], 10)).padStart(2, '0');
      return `${slashMatch[3]}-${mon}-${day}`;
    }
    // If standard ISO string
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return str;
  }

  function parseDay(val) {
    if (!val) return 10;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0], 10) : 10;
  }

  function parseAmount(val) {
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }

  // 1. Detect client info from top rows
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const rowStr = rows[i].map(c => String(c).trim()).filter(Boolean).join(' ');
    const panMatch = rowStr.match(/([A-Z]{5}[0-9]{4}[A-Z])/i);
    if (panMatch) {
      clientInfo = {
        pan: panMatch[1].toUpperCase(),
        rawText: rowStr
      };
      const namePart = rowStr.split(/\[|\(/)[0].trim();
      if (namePart) clientInfo.name = namePart;
      break;
    }
  }

  // 2. Find where the data rows start
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).toLowerCase().trim());
    const hasSr = row.some(c => c === 'sr.' || c === 'sr' || c === 'sr no' || c === 's.no' || c === 'sr. no.');
    const hasSip = row.some(c => c.includes('sip') || c.includes('start date') || c.includes('folio') || c.includes('scheme'));
    
    if (hasSr && hasSip) {
      headerRowIndex = i;
      break;
    }
  }

  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const rawRow = rows[i];
    const nonEmpties = rawRow.map((c, idx) => ({ val: String(c).trim(), orig: c, idx })).filter(item => item.val !== '');
    if (nonEmpties.length < 3) continue;

    const firstCell = String(rawRow[0] || '').toLowerCase().trim();
    const anyTotal = rawRow.some(c => String(c).toLowerCase().includes('total'));
    if (firstCell === 'total' || anyTotal) continue;

    // Must have a sequence number or digit in the early cells
    const srCandidate = parseInt(nonEmpties[0].val, 10);
    if (isNaN(srCandidate) && !firstCell.match(/^\d+$/)) continue;

    let schemeName = '';
    let folioNumber = '';
    let sipAmount = 0;
    let frequency = 'Monthly';
    let startDate = '';
    let maturityDate = '';
    let sipDay = 10;
    let status = 'Running';
    let deductionBank = '';

    for (let j = 0; j < nonEmpties.length; j++) {
      const item = nonEmpties[j];
      const val = item.val;
      const lower = val.toLowerCase();

      // Skip Sr. No
      if (j === 0 && (parseInt(val, 10) === srCandidate || val === String(srCandidate))) {
        continue;
      }

      // Frequency
      if (['monthly', 'quarterly', 'half-yearly', 'annual', 'yearly', 'weekly'].includes(lower)) {
        frequency = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        continue;
      }

      // Status
      if (['running', 'active', 'paused', 'closed', 'terminated', 'stopped'].includes(lower)) {
        status = lower === 'terminated' || lower === 'stopped' ? 'Closed' : (val.charAt(0).toUpperCase() + val.slice(1).toLowerCase());
        continue;
      }

      // Deduction Day like "20th", "21st", "10th"
      if (/^\d{1,2}(st|nd|rd|th)$/i.test(val)) {
        sipDay = parseDay(val);
        continue;
      }

      // Dates
      if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(val) || /^\d{2,4}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(val)) {
        if (!startDate) {
          startDate = parseDateStr(val);
        } else if (!maturityDate) {
          maturityDate = parseDateStr(val);
        }
        continue;
      }

      // Scheme Name (has words like Fund, Growth, Cap, Index, etc. or has space)
      if (!schemeName && (val.includes(' ') || /(fund|growth|cap|index|equity|direct|regular|plan|hybrid|bond)/i.test(val))) {
        schemeName = val;
        continue;
      }

      // Folio Number
      if (!folioNumber && (/^[\d\/-]{5,22}$/.test(val) || (val.includes('/') && /^\d+\/\d+$/.test(val)))) {
        if (parseFloat(val) % 500 === 0 && parseFloat(val) <= 100000 && !sipAmount && j > 2) {
          sipAmount = parseFloat(val);
        } else {
          folioNumber = val;
        }
        continue;
      }

      // SIP Amount
      if (!sipAmount && parseAmount(val) > 0) {
        sipAmount = parseAmount(val);
        continue;
      }
    }

    // Direct positional fallback for IFA-Planet structure
    if (!schemeName && rawRow[1]) schemeName = String(rawRow[1]).trim();
    if (!folioNumber && rawRow[4]) folioNumber = String(rawRow[4]).trim();
    if (!sipAmount && rawRow[5]) sipAmount = parseAmount(rawRow[5]);
    if (!startDate && rawRow[7]) startDate = parseDateStr(rawRow[7]);
    if (!maturityDate && rawRow[8]) maturityDate = parseDateStr(rawRow[8]);
    if (rawRow[9] && !sipDay) sipDay = parseDay(rawRow[9]);
    if (rawRow[10] && !status) {
      const st = String(rawRow[10]).toLowerCase().trim();
      status = st === 'terminated' ? 'Closed' : (st.charAt(0).toUpperCase() + st.slice(1));
    }

    if (schemeName) {
      schemes.push({
        service: 'Mutual Funds',
        schemeName,
        folioNumber: folioNumber || '',
        policyNumber: folioNumber || '',
        sipAmount: sipAmount || 0,
        sipFrequency: frequency || 'Monthly',
        investmentType: 'Monthly SIP',
        startDate: startDate || '',
        maturityDate: maturityDate || '2099-12-20',
        sipDay: sipDay || 10,
        status: status || 'Running',
        deductionBank: deductionBank || 'STATE BANK OF INDIA'
      });
    }
  }

  return { clientInfo, schemes };
}

/**
 * Generates and downloads a clean sample Excel template for SIP portfolio uploads.
 */
export function downloadSipExcelTemplate(clientName = 'Client Name', pan = 'ABCDE1234F') {
  const data = [
    [`${clientName}  [${pan}]`, '', '', '', '', '', '', '', '', 'Investrow Financial Services'],
    ['', '', '', '', 'SIP Details As On ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), '', '', '', '', ''],
    ['Sr.', 'Scheme Name', '', '', 'Folio Number', 'SIP Amount', 'SIP Frequency', 'SIP Start Date', 'SIP End Date', 'Deduction Date', 'SIP Status'],
    [1, 'Axis Large Cap Fund - Regular Growth', '', '', '91063718002', 3000, 'Monthly', '20 Nov 2019', '20 Dec 2099', '20th', 'Running'],
    [2, 'Bandhan Small Cap Fund-growth', '', '', '3916601/01', 10000, 'Monthly', '26 Apr 2023', '21 Dec 2099', '21st', 'Running'],
    [3, 'Invesco India Large & Mid Cap Fund', '', '', '3102497445', 3000, 'Monthly', '20 Nov 2019', '20 Dec 2099', '20th', 'Running'],
    [4, 'Kotak Mid Cap Fund Regular Growth', '', '', '6626064', 4000, 'Monthly', '18 Oct 2019', '20 Dec 2099', '20th', 'Running'],
    [5, 'Tata Digital India Fund Growth', '', '', '6784977/34', 5000, 'Monthly', '22 Nov 2021', '20 Oct 2046', '20th', 'Running'],
    ['Total', '', '', '', '', 25000, '', '', '', '', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SIP Details');
  XLSX.writeFile(wb, `${clientName.replace(/\s+/g, '_')}_SIP_Template.xlsx`);
}
