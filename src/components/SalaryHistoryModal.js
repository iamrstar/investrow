'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  X, History, Search, Download, Eye, Calendar, 
  IndianRupee, ArrowLeft, RefreshCw, CheckCircle2, User, Building2 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import SalarySlipModal from './SalarySlipModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SalaryHistoryModal({ employee = null, onClose }) {
  const { addToast } = useToast();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [previewingSlip, setPreviewingSlip] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employee?._id) params.set('userId', employee._id);
      if (search) params.set('search', search);
      if (monthFilter) params.set('month', monthFilter);
      if (yearFilter) params.set('year', yearFilter);

      const res = await fetch(`/api/salary-slip?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch history');

      setSlips(data.slips || []);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error loading salary history', 'error');
    } finally {
      setLoading(false);
    }
  }, [employee, search, monthFilter, yearFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalDisbursed = slips.reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  const totalGross = slips.reduce((sum, s) => sum + (Number(s.grossEarnings) || 0), 0);

  const handleDownloadPdf = (slip) => {
    if (!slip?._id) return;
    window.open(`/api/salary-slip?download=pdf&slipId=${slip._id}`, '_blank');
  };

  // If currently previewing a specific slip, show the slip preview
  if (previewingSlip) {
    return (
      <SalarySlipModal
        employee={{
          _id: previewingSlip.userId,
          name: previewingSlip.employeeName,
          email: previewingSlip.employeeEmail,
          designation: previewingSlip.designation,
          salary: previewingSlip.baseSalary,
        }}
        empId={previewingSlip.employeeId}
        existingSlip={previewingSlip}
        initialTab="preview"
        onClose={() => setPreviewingSlip(null)}
        onSuccess={fetchHistory}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 1040, 
          width: '96%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '18px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: '#F0F9FF',
              color: '#0284C7',
              padding: '8px 10px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #BAE6FD'
            }}>
              <History size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {employee ? `Salary Release History: ${employee.name}` : 'Salary Slips & Payroll History'}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                {employee 
                  ? `Showing all released payslips and payment records for ${employee.email}` 
                  : 'Comprehensive audit trail of all released employee salary slips and disbursements'}
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '22px 26px', background: '#F8FAFC' }}>
          
          {/* Summary Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 20
          }}>
            <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Slips Released
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {slips.length}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Net Disbursed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                ₹{totalDisbursed.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Gross Earnings
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
                ₹{totalGross.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            {!employee && (
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by employee, ID, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, borderRadius: 10, fontSize: '0.85rem' }}
                />
              </div>
            )}

            <select
              className="form-select"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{ width: 140, borderRadius: 10, fontSize: '0.85rem' }}
            >
              <option value="">All Months</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              style={{ width: 120, borderRadius: 10, fontSize: '0.85rem' }}
            >
              <option value="">All Years</option>
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchHistory}
              title="Refresh"
              style={{ borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>

          {/* Slips Table */}
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Period</th>
                  {!employee && <th style={{ padding: '12px 18px', fontWeight: 700 }}>Employee</th>}
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Basic</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Gross</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Deductions</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Net Pay</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Released At</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right', minWidth: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={employee ? 7 : 8} style={{ padding: 40, textAlign: 'center' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px auto' }} />
                      <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Loading salary slip records...</div>
                    </td>
                  </tr>
                ) : slips.length === 0 ? (
                  <tr>
                    <td colSpan={employee ? 7 : 8} style={{ padding: 40, textAlign: 'center' }}>
                      <History size={40} style={{ color: '#94A3B8', margin: '0 auto 10px auto' }} />
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>No salary slips found</div>
                      <div style={{ color: '#64748B', fontSize: '0.82rem', marginTop: 4 }}>
                        {employee ? 'No salary slips have been released for this employee yet.' : 'No salary slips matching the selected criteria.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  slips.map((slip) => {
                    const releasedDate = slip.releasedAt 
                      ? new Date(slip.releasedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })
                      : 'N/A';

                    return (
                      <tr key={slip._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} style={{ color: '#0284C7' }} />
                            <span>{slip.month} {slip.year}</span>
                          </div>
                        </td>

                        {!employee && (
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#E0F2FE',
                                color: '#0284C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}>
                                {slip.employeeName ? slip.employeeName.charAt(0).toUpperCase() : 'E'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{slip.employeeName}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{slip.employeeEmail}</div>
                              </div>
                            </div>
                          </td>
                        )}

                        <td style={{ padding: '12px 18px', color: '#334155' }}>
                          ₹{Number(slip.baseSalary || 0).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0284C7' }}>
                          ₹{Number(slip.grossEarnings || 0).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '12px 18px', fontWeight: 600, color: '#DC2626' }}>
                          -₹{Number(slip.totalDeductions || 0).toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}>
                            ₹{Number(slip.netPay || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', fontSize: '0.78rem', color: '#64748B' }}>
                          {releasedDate}
                        </td>

                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewingSlip(slip)}
                              title="View Payslip"
                              style={{
                                border: '1px solid #BAE6FD',
                                background: '#F0F9FF',
                                color: '#0284C7',
                                padding: '5px 10px',
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(slip)}
                              title="Download PDF"
                              style={{
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                padding: '5px 10px',
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '14px 26px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ borderRadius: 8 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

