'use client';

import { useState } from 'react';
import { X, UserCheck, Shield, IndianRupee, Building2, CreditCard, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const SERVICES = [
  'Mutual Funds',
  'Life Insurance',
  'Health Insurance',
  'Tax Planning',
  'General Insurance',
  'FD & Bond',
  'Stock Market & Demat',
  'NPS',
];

const SIP_DAYS = [1, 5, 7, 10, 15, 20, 25, 28];

export default function ConvertToClientModal({ lead, onClose, onConverted }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    whatsappNumber: lead?.whatsappNumber || lead?.phone || '',
    email: lead?.email || '',
    city: lead?.city || lead?.location || '',
    address: lead?.address || '',
    panNumber: lead?.panNumber || '',
    aadhaarNumber: lead?.aadhaarNumber || '',
    bankName: lead?.bankName || '',
    bankAccountNumber: lead?.bankAccountNumber || '',
    bankIfscCode: lead?.bankIfscCode || '',
    service: lead?.service || 'Mutual Funds',
    schemeName: lead?.schemeName || '',
    investmentType: lead?.investmentType || 'Monthly SIP',
    sipAmount: lead?.sipAmount || '',
    sipDay: lead?.sipDay || 10,
    investmentAmount: lead?.investmentAmount || '',
    remarks: 'Client KYC verified and onboarding completed.',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!form.name?.trim()) {
      return addToast('Client name is required', 'error');
    }
    if (!form.whatsappNumber?.trim() && !form.phone?.trim()) {
      return addToast('Phone / WhatsApp number is mandatory', 'error');
    }
    if (!form.service?.trim()) {
      return addToast('Please select which Service/Product client is opting for', 'error');
    }

    if (form.investmentType === 'Monthly SIP' || form.investmentType === 'Both') {
      if (!form.sipAmount || Number(form.sipAmount) <= 0) {
        return addToast('Monthly SIP Amount (₹) is mandatory', 'error');
      }
      if (!form.sipDay || Number(form.sipDay) < 1 || Number(form.sipDay) > 31) {
        return addToast('Please select a valid SIP Debit Day (1st - 31st)', 'error');
      }
    }

    if (form.investmentType === 'Lumpsum' || form.investmentType === 'Both') {
      if (!form.investmentAmount || Number(form.investmentAmount) <= 0) {
        return addToast('Lumpsum Investment Amount (₹) is mandatory', 'error');
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...lead,
        ...form,
        stage: 'Converted',
        response: 'Converted',
        serviceTaken: 'Yes',
        callStatus: 'Received',
        location: form.city || lead.location || 'Dhanbad',
        city: form.city || lead.city || 'Dhanbad',
        sipAmount: Number(form.sipAmount) || 0,
        sipDay: Number(form.sipDay) || null,
        investmentAmount: Number(form.investmentAmount) || 0,
        panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
        bankIfscCode: form.bankIfscCode ? form.bankIfscCode.toUpperCase().trim() : '',
      };

      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert lead');
      }

      // Also log follow-up entry for conversion record
      await fetch(`/api/leads/${lead._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: 'Converted',
          stage: 'Converted',
          callStatus: 'Received',
          service: form.service,
          schemeName: form.schemeName,
          investmentType: form.investmentType,
          sipAmount: Number(form.sipAmount) || 0,
          sipDay: Number(form.sipDay) || null,
          investmentAmount: Number(form.investmentAmount) || 0,
          medium: 'In-Person Meeting',
          remarks: `Converted to Client: ${form.service} (${form.investmentType}) - ${form.remarks}`,
        }),
      });

      addToast(`🎉 ${form.name} successfully converted to Client!`, 'success');
      if (onConverted) onConverted(data.lead || payload);
      onClose();
    } catch (err) {
      console.error('Conversion Error:', err);
      addToast(err.message || 'Could not convert lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 680, 
          borderRadius: 24, 
          padding: 0, 
          overflow: 'hidden', 
          border: 'none', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)', 
          padding: '22px 24px', 
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, display: 'flex' }}>
              <UserCheck size={26} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
                  Convert Lead to Client
                </h3>
                <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8 }}>
                  VERIFIED PORTFOLIO
                </span>
              </div>
              <p style={{ margin: '2px 0 0', opacity: 0.9, fontSize: '0.86rem' }}>
                Complete KYC, Bank Mandate & Financial Product Setup for <strong>{lead.name}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', 
              border: 'none', color: 'white', padding: 6, borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div className="modal-body" style={{ padding: '20px 24px', background: '#F8FAFC' }}>

            {/* SECTION 1: KYC & Contact Information */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #E2E8F0', 
              borderRadius: 16, 
              padding: '16px 18px', 
              marginBottom: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Shield size={18} style={{ color: '#10B981' }} />
                1. Client KYC & Identity Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Client Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required 
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>WhatsApp Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.whatsappNumber} 
                    onChange={e => setForm({ ...form, whatsappNumber: e.target.value, phone: e.target.value })} 
                    placeholder="10-digit mobile"
                    required 
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    placeholder="client@email.com"
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>PAN Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.panNumber} 
                    onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} 
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ height: 40, borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Aadhaar Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.aadhaarNumber} 
                    onChange={e => setForm({ ...form, aadhaarNumber: e.target.value })} 
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>City / Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.city} 
                    onChange={e => setForm({ ...form, city: e.target.value })} 
                    placeholder="e.g. Dhanbad"
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Bank Details */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #E2E8F0', 
              borderRadius: 16, 
              padding: '16px 18px', 
              marginBottom: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Building2 size={18} style={{ color: '#0EA5E9' }} />
                2. Bank Account & Auto-Debit Mandate
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Bank Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.bankName} 
                    onChange={e => setForm({ ...form, bankName: e.target.value })} 
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Account Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.bankAccountNumber} 
                    onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })} 
                    placeholder="Bank Account No."
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>IFSC Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.bankIfscCode} 
                    onChange={e => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })} 
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    style={{ height: 40, borderRadius: 8, textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Financial Product & Investment Setup */}
            <div style={{ 
              background: '#F0FDF4', 
              border: '1.5px solid #86EFAC', 
              borderRadius: 16, 
              padding: '16px 18px', 
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IndianRupee size={18} />
                3. Financial Product & Investment Setup *
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                    Service / Product Category *
                  </label>
                  <select 
                    className="form-select" 
                    value={form.service} 
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    required
                    style={{ height: 40, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 700 }}
                  >
                    {SERVICES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                    Investment Type *
                  </label>
                  <select 
                    className="form-select" 
                    value={form.investmentType} 
                    onChange={e => setForm({ ...form, investmentType: e.target.value })}
                    required
                    style={{ height: 40, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 700 }}
                  >
                    <option value="Monthly SIP">Monthly SIP (Recurring)</option>
                    <option value="Lumpsum">Lumpsum (One-Time)</option>
                    <option value="Both">Both (Monthly SIP + Lumpsum)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Inputs: Monthly SIP vs Lumpsum */}
              <div style={{ display: 'grid', gridTemplateColumns: form.investmentType === 'Both' ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 12 }}>
                {(form.investmentType === 'Monthly SIP' || form.investmentType === 'Both') && (
                  <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 12, padding: '12px 14px' }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369A1' }}>
                        Monthly SIP Amount (₹) *
                      </label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={form.sipAmount} 
                        onChange={e => setForm({ ...form, sipAmount: e.target.value })} 
                        placeholder="e.g. 10000"
                        required
                        style={{ height: 40, borderRadius: 8, border: '1.5px solid #0EA5E9', fontWeight: 800, fontSize: '1rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                        SIP Debit Day of Month *
                      </label>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                        {SIP_DAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setForm({ ...form, sipDay: day })}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: form.sipDay === day ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                              background: form.sipDay === day ? '#0284C7' : '#F8FAFC',
                              color: form.sipDay === day ? 'white' : '#475569',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {day}th
                          </button>
                        ))}
                      </div>
                      <input 
                        type="number" 
                        min="1" 
                        max="31" 
                        className="form-input" 
                        value={form.sipDay || ''} 
                        onChange={e => setForm({ ...form, sipDay: Number(e.target.value) })} 
                        placeholder="Custom day (1 - 31)"
                        required
                        style={{ height: 36, borderRadius: 6, fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                )}

                {(form.investmentType === 'Lumpsum' || form.investmentType === 'Both') && (
                  <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 12, padding: '12px 14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D97706' }}>
                        Lumpsum Investment Amount (₹) *
                      </label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={form.investmentAmount} 
                        onChange={e => setForm({ ...form, investmentAmount: e.target.value })} 
                        placeholder="e.g. 500000"
                        required
                        style={{ height: 40, borderRadius: 8, border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: '1rem' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4, display: 'block' }}>
                        Total one-time capital invested / policy premium
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheme / Policy Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Scheme / Policy / Plan Name (Optional)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.schemeName} 
                  onChange={e => setForm({ ...form, schemeName: e.target.value })} 
                  placeholder="e.g. Parag Parikh Flexi Cap, HDFC Top 100, LIC Tech Term"
                  style={{ height: 38, borderRadius: 8, background: 'white' }}
                />
              </div>
            </div>

            {/* SECTION 4: Conversion Remarks */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>
                Onboarding & Conversion Notes
              </label>
              <textarea 
                className="form-textarea" 
                value={form.remarks} 
                onChange={e => setForm({ ...form, remarks: e.target.value })} 
                placeholder="Details of the conversion..."
                style={{ minHeight: 60, borderRadius: 10, fontSize: '0.85rem' }}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ 
            background: 'white', 
            borderTop: '1px solid #E2E8F0', 
            padding: '14px 24px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Lead will move to <strong>Converted Clients</strong> tab immediately.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose} 
                disabled={saving}
                style={{ borderRadius: 10 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn" 
                disabled={saving}
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                  color: 'white', 
                  borderRadius: 10,
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <UserCheck size={18} />
                {saving ? 'Converting...' : 'Confirm & Convert to Client'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
