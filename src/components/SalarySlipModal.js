'use client';

import { useState, useRef } from 'react';
import { 
  X, IndianRupee, Plus, Trash2, Send, CheckCircle2, 
  AlertCircle, Eye, Edit3, Printer, Building2, Download 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

export default function SalarySlipModal({ 
  employee, 
  empId, 
  existingSlip = null, 
  initialTab = 'form',
  onClose, 
  onSuccess 
}) {
  const { addToast } = useToast();
  const printRef = useRef(null);

  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  const [activeTab, setActiveTab] = useState(existingSlip ? 'preview' : initialTab);
  const [month, setMonth] = useState(existingSlip?.month || currentMonthName);
  const [year, setYear] = useState(existingSlip?.year || currentYear);
  const [paymentDate, setPaymentDate] = useState(
    existingSlip?.paymentDate 
      ? new Date(existingSlip.paymentDate).toISOString().split('T')[0] 
      : now.toISOString().split('T')[0]
  );
  const [employeeId, setEmployeeId] = useState(existingSlip?.employeeId || empId || 'EMP-001');
  const [designation, setDesignation] = useState(
    existingSlip?.designation || employee.designation || (employee.role === 'admin' ? 'Director' : 'Relationship Manager')
  );
  const [baseSalary, setBaseSalary] = useState(existingSlip?.baseSalary ?? (employee.salary || 0));

  const [earnings, setEarnings] = useState(
    existingSlip?.earnings?.map((e, i) => ({ id: Date.now() + i, label: e.label, amount: e.amount })) || []
  );
  const [deductions, setDeductions] = useState(() => {
    if (existingSlip?.deductions && existingSlip.deductions.length > 0) {
      return existingSlip.deductions.map((d, i) => ({ id: Date.now() + i, label: d.label, amount: d.amount }));
    }
    const s = Number(employee.salary) || 0;
    const defaultPF = employee.pf !== undefined && employee.pf !== null && employee.pf > 0 
      ? employee.pf 
      : (s > 0 ? Math.min(1800, Math.round(s * 0.12)) : 0);
    const defaultPT = employee.professionalTax !== undefined && employee.professionalTax !== null && employee.professionalTax > 0 
      ? employee.professionalTax 
      : (s >= 10000 ? 200 : 0);

    return [
      { id: 1, label: 'Provident Fund (PF)', amount: defaultPF },
      { id: 2, label: 'Professional Tax (PT)', amount: defaultPT },
      { id: 3, label: 'TDS / Income Tax', amount: 0 },
      { id: 4, label: 'Unpaid Leave (LOP)', amount: 0 },
    ];
  });
  const [notes, setNotes] = useState(existingSlip?.notes || `Salary released for ${currentMonthName} ${currentYear}`);
  const [updateDefaultSalary, setUpdateDefaultSalary] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick addition handlers
  const addEarningRow = (label = '', amount = '') => {
    setEarnings(prev => [...prev, { id: Date.now() + Math.random(), label, amount }]);
  };

  const removeEarningRow = (id) => {
    setEarnings(prev => prev.filter(item => item.id !== id));
  };

  const updateEarningRow = (id, field, value) => {
    setEarnings(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addDeductionRow = (label = '', amount = '') => {
    setDeductions(prev => [...prev, { id: Date.now() + Math.random(), label, amount }]);
  };

  const removeDeductionRow = (id) => {
    setDeductions(prev => prev.filter(item => item.id !== id));
  };

  const updateDeductionRow = (id, field, value) => {
    setDeductions(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Calculations
  const baseSalaryNum = Math.max(0, Number(baseSalary) || 0);
  const additionalEarningsTotal = earnings.reduce((sum, item) => sum + (Math.max(0, Number(item.amount)) || 0), 0);
  const grossEarnings = baseSalaryNum + additionalEarningsTotal;
  const totalDeductions = deductions.reduce((sum, item) => sum + (Math.max(0, Number(item.amount)) || 0), 0);
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  const formattedPayDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (grossEarnings <= 0) {
      return addToast('Please enter a valid salary amount', 'error');
    }

    const confirmMsg = `Are you sure you want to release ₹${netPay.toLocaleString('en-IN')} as salary for ${employee.name} (${month} ${year})?${sendEmailNotification ? ' An official payslip email will be sent immediately.' : ''}`;
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const payload = {
        userId: employee._id,
        employeeId,
        designation,
        month,
        year,
        paymentDate,
        baseSalary: baseSalaryNum,
        earnings: earnings.filter(e => e.label && e.label.trim() !== '').map(e => ({ label: e.label.trim(), amount: Number(e.amount) || 0 })),
        deductions: deductions.filter(d => d.label && d.label.trim() !== '').map(d => ({ label: d.label.trim(), amount: Number(d.amount) || 0 })),
        grossEarnings,
        totalDeductions,
        netPay,
        notes,
        updateDefaultSalary,
        sendEmailNotification,
      };

      const res = await fetch('/api/salary-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release salary');

      addToast(data.message || 'Salary released and payslip sent successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error releasing salary', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Clean rows for preview
  const previewEarnings = [
    { label: 'Basic / Base Salary', amount: baseSalaryNum },
    ...earnings.filter(e => e.label && e.label.trim() !== '').map(e => ({ label: e.label.trim(), amount: Number(e.amount) || 0 }))
  ];
  const previewDeductions = deductions
    .filter(d => d.label && d.label.trim() !== '')
    .map(d => ({ label: d.label.trim(), amount: Number(d.amount) || 0 }));
  const previewMaxRows = Math.max(previewEarnings.length, previewDeductions.length, 1);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      {/* Inline Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #salary-slip-printable, #salary-slip-printable * {
            visibility: visible;
          }
          #salary-slip-printable {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: activeTab === 'preview' ? 880 : 840, 
          width: '95%', 
          maxHeight: '94vh', 
          overflowY: 'auto', 
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header with Tabs */}
        <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: '#ECFDF5',
              color: '#059669',
              padding: '8px 10px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IndianRupee size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  {existingSlip ? 'Salary Slip Details' : 'Salary Release & Statement'}
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: existingSlip ? '#ECFDF5' : '#FEF3C7',
                  color: existingSlip ? '#059669' : '#D97706',
                  border: `1px solid ${existingSlip ? '#A7F3D0' : '#FDE68A'}`,
                }}>
                  {existingSlip ? 'Released' : 'Draft / Unreleased'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Employee: <strong style={{ color: '#0F172A' }}>{employee.name}</strong> ({employee.email})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Tab Switcher Pills */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                style={{
                  border: 'none',
                  background: activeTab === 'form' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'form' ? '#0F172A' : '#64748B',
                  fontWeight: activeTab === 'form' ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Edit3 size={14} /> Edit Breakdown
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  border: 'none',
                  background: activeTab === 'preview' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'preview' ? '#059669' : '#64748B',
                  fontWeight: activeTab === 'preview' ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye size={14} /> Preview Payslip
              </button>
            </div>

            <button className="modal-close" onClick={onClose} style={{ marginLeft: 8 }}><X size={20} /></button>
          </div>
        </div>

        {/* Tab 1: Edit Form */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Pay Period & Employee Info Row */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 14,
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Pay Month</label>
                  <select 
                    className="form-select" 
                    value={month} 
                    onChange={e => {
                      setMonth(e.target.value);
                      setNotes(`Salary released for ${e.target.value} ${year}`);
                    }}
                    style={{ borderRadius: 8, fontSize: '0.875rem' }}
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Pay Year</label>
                  <select 
                    className="form-select" 
                    value={year} 
                    onChange={e => {
                      const y = Number(e.target.value);
                      setYear(y);
                      setNotes(`Salary released for ${month} ${y}`);
                    }}
                    style={{ borderRadius: 8, fontSize: '0.875rem' }}
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Payment Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)}
                    style={{ borderRadius: 8, fontSize: '0.875rem' }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Employee ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={employeeId} 
                    onChange={e => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-001"
                    style={{ borderRadius: 8, fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Designation</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={designation} 
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Relationship Manager"
                    style={{ borderRadius: 8, fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Two Column Layout: Earnings vs Deductions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
                
                {/* Earnings Column */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                        Earnings & Allowances
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                      ₹{grossEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Base Salary Input */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      Base / Basic Monthly Salary (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={baseSalary}
                      onChange={e => setBaseSalary(e.target.value)}
                      placeholder="Enter base salary"
                      style={{ borderRadius: 8, fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}
                      required
                    />
                  </div>

                  {/* Additional Earnings List */}
                  {earnings.map((row) => (
                    <div key={row.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Allowance title (e.g. Incentive)"
                        value={row.label}
                        onChange={e => updateEarningRow(row.id, 'label', e.target.value)}
                        style={{ flex: 1.5, borderRadius: 8, fontSize: '0.85rem' }}
                      />
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="₹ Amount"
                        value={row.amount}
                        onChange={e => updateEarningRow(row.id, 'amount', e.target.value)}
                        style={{ flex: 1, borderRadius: 8, fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeEarningRow(row.id)}
                        style={{ color: '#EF4444', padding: 6 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Add Allowance Button & Quick Chips */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => addEarningRow('', '')}
                      style={{ borderRadius: 8, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
                    >
                      <Plus size={14} /> Add Allowance / Incentive
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', alignSelf: 'center' }}>Quick add:</span>
                      {['Incentive', 'Performance Bonus', 'HRA', 'Travel Allowance'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => addEarningRow(chip, '')}
                          style={{
                            fontSize: '0.72rem',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            borderRadius: 12,
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                        Deductions
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#DC2626' }}>
                      -₹{totalDeductions.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {deductions.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No deductions added (PF, Tax, LOP, etc.)
                    </div>
                  ) : (
                    deductions.map((row) => (
                      <div key={row.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Deduction title (e.g. PF)"
                          value={row.label}
                          onChange={e => updateDeductionRow(row.id, 'label', e.target.value)}
                          style={{ flex: 1.5, borderRadius: 8, fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          placeholder="₹ Amount"
                          value={row.amount}
                          onChange={e => updateDeductionRow(row.id, 'amount', e.target.value)}
                          style={{ flex: 1, borderRadius: 8, fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeDeductionRow(row.id)}
                          style={{ color: '#EF4444', padding: 6 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Add Deduction Button & Quick Chips */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => addDeductionRow('', '')}
                      style={{ borderRadius: 8, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
                    >
                      <Plus size={14} /> Add Deduction
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', alignSelf: 'center' }}>Quick add:</span>
                      {['Provident Fund (PF)', 'Professional Tax', 'TDS / Tax', 'Unpaid Leave (LOP)'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => addDeductionRow(chip, '')}
                          style={{
                            fontSize: '0.72rem',
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            color: '#991B1B',
                            borderRadius: 12,
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Calculation Summary Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 20,
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Gross Earnings
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34D399', marginTop: 2 }}>
                      ₹{grossEarnings.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid #334155', paddingLeft: 24 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Total Deductions
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F87171', marginTop: 2 }}>
                      -₹{totalDeductions.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Net Take-Home Pay
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', lineHeight: 1.1, marginTop: 4 }}>
                    ₹{netPay.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Remarks / Notes */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Remarks / Payment Note
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Salary credited via IMPS/NEFT"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ borderRadius: 8, fontSize: '0.85rem' }}
                />
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer', color: '#1E293B', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={e => setSendEmailNotification(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#059669' }}
                  />
                  Send official Salary Statement email to <strong>{employee.email}</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={updateDefaultSalary}
                    onChange={e => setUpdateDefaultSalary(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0EA5E9' }}
                  />
                  Update base salary (₹{baseSalaryNum.toLocaleString('en-IN')}) and designation as default for this employee profile
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting} style={{ borderRadius: 8 }}>
                Cancel
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#0284C7',
                    borderColor: '#BAE6FD',
                    background: '#F0F9FF',
                    fontWeight: 600
                  }}
                >
                  <Eye size={16} /> Preview Salary Slip
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || grossEarnings <= 0}
                  style={{
                    background: '#059669',
                    borderColor: '#059669',
                    borderRadius: 8,
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#FFF' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Confirm & Release Salary (₹{netPay.toLocaleString('en-IN')})
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Salary Slip Preview */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="modal-body" style={{ padding: '24px', background: '#F8FAFC' }}>
              
              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={16} color="#059669" /> Exact representation of the official document issued to the employee.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {existingSlip?._id && (
                    <button
                      type="button"
                      onClick={() => window.open(`/api/salary-slip?download=pdf&slipId=${existingSlip._id}`, '_blank')}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#ECFDF5',
                        color: '#059669',
                        borderColor: '#A7F3D0',
                        fontWeight: 600
                      }}
                    >
                      <Download size={15} /> Download PDF
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn btn-outline btn-sm"
                    style={{
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 600
                    }}
                  >
                    <Printer size={15} /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="btn btn-outline btn-sm"
                    style={{
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFFFFF',
                      color: '#0284C7',
                      fontWeight: 600
                    }}
                  >
                    <Edit3 size={15} /> Edit Values
                  </button>
                </div>
              </div>

              {/* Printable / Realistic Corporate Salary Slip Document */}
              <div 
                id="salary-slip-printable"
                ref={printRef}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  padding: '36px 40px',
                  color: '#1E293B',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0EA5E9', paddingBottom: 20, marginBottom: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <img 
                        src="/logo.png" 
                        alt="Investrow Logo" 
                        style={{ height: 42, width: 'auto', objectFit: 'contain' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                      Investrow Financial Services Private Limited
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      Wealth Management & Advisory Services &bull; CIN: U67190MH2021PTC368921
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#E0F2FE',
                      color: '#0369A1',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 6
                    }}>
                      Confidential Payslip
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      {month.toUpperCase()} {year}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                      Pay Date: <strong>{formattedPayDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Employee Details Meta Box */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  padding: '16px 20px',
                  marginBottom: 26,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px 20px',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Employee Name
                    </span>
                    <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{employee.name}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Employee ID
                    </span>
                    <strong style={{ color: '#0EA5E9', fontSize: '0.92rem' }}>{employeeId || 'N/A'}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Designation
                    </span>
                    <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{designation || 'Staff'}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Payment Method
                    </span>
                    <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>Direct Bank Transfer / NEFT</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Email Address
                    </span>
                    <span style={{ color: '#334155' }}>{employee.email}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Mobile Contact
                    </span>
                    <span style={{ color: '#334155' }}>{employee.phone || 'N/A'}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Pay Period
                    </span>
                    <span style={{ color: '#334155' }}>{month} {year}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontWeight: 600 }}>
                      Release Status
                    </span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      &bull; {existingSlip ? 'Processed & Credited' : 'Verified Ready'}
                    </span>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden', marginBottom: 24, fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#0F172A', color: '#FFFFFF' }}>
                      <th style={{ padding: '12px 18px', textAlign: 'left', width: '35%', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Earnings & Allowances
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'right', width: '15%', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Amount (₹)
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', width: '35%', borderLeft: '1px solid #334155', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Deductions
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'right', width: '15%', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: previewMaxRows }).map((_, idx) => {
                      const earn = previewEarnings[idx];
                      const ded = previewDeductions[idx];
                      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

                      return (
                        <tr key={idx} style={{ background: bg, borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '11px 18px', color: '#334155' }}>
                            {earn ? earn.label : '-'}
                          </td>
                          <td style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                            {earn ? `₹${Number(earn.amount).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ padding: '11px 18px', color: '#334155', borderLeft: '1px solid #E2E8F0' }}>
                            {ded ? ded.label : '-'}
                          </td>
                          <td style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 600, color: '#DC2626' }}>
                            {ded ? `₹${Number(ded.amount).toLocaleString('en-IN')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F1F5F9', borderTop: '2px solid #CBD5E1', fontWeight: 800 }}>
                      <td style={{ padding: '12px 18px', color: '#0F172A' }}>Total Gross Earnings</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', color: '#059669', fontSize: '0.95rem' }}>
                        ₹{grossEarnings.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#0F172A', borderLeft: '1px solid #CBD5E1' }}>Total Deductions</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', color: '#DC2626', fontSize: '0.95rem' }}>
                        ₹{totalDeductions.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Net Pay Highlight Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  borderRadius: 12,
                  padding: '22px 28px',
                  color: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 22,
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                      Net Take-Home Pay (In-Hand)
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.95 }}>
                      <strong>Amount in words:</strong> {numberToWordsINR(netPay)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      ₹{netPay.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Notes & Authorized Signatory */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'flex-end', paddingTop: 10 }}>
                  <div>
                    {notes && (
                      <div style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6', padding: '10px 14px', borderRadius: 6, fontSize: '0.82rem', color: '#1E40AF', marginBottom: 12 }}>
                        <strong>Remarks:</strong> {notes}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.5 }}>
                      Note: This is a computer-generated salary statement issued by Investrow CRM. It does not require a physical signature. For discrepancies, please notify the Accounts/HR Department within 5 working days.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', borderTop: '1px dashed #CBD5E1', paddingTop: 12 }}>
                    <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>
                        Investrow Financial
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                      Authorized Signatory
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      Investrow Management
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer in Preview Mode */}
            <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setActiveTab('form')}
                style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit3 size={15} /> Back to Edit Breakdown
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-outline"
                  style={{
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                  }}
                >
                  <Printer size={16} /> Print / Save PDF
                </button>

                {!existingSlip && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={submitting || grossEarnings <= 0}
                    style={{
                      background: '#059669',
                      borderColor: '#059669',
                      borderRadius: 8,
                      padding: '10px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#FFF' }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Confirm & Release Salary (₹{netPay.toLocaleString('en-IN')})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
