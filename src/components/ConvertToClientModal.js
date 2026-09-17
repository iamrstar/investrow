'use client';

import { useState } from 'react';
import { X, UserCheck, Shield, IndianRupee, Building2, CreditCard, Calendar, FileText, Plus, Trash2 } from 'lucide-react';
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
const TENURE_OPTIONS = [1, 3, 5, 7, 10, 15, 20];

export default function ConvertToClientModal({ lead, onClose, onConverted }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    whatsappNumber: lead?.whatsappNumber || lead?.phone || '',
    email: lead?.email || '',
    dateOfBirth: lead?.dateOfBirth || '',
    city: lead?.city || lead?.location || '',
    address: lead?.address || '',
    pincode: lead?.pincode || '',
    panNumber: lead?.panNumber || '',
    aadhaarNumber: lead?.aadhaarNumber || '',
    kycStatus: lead?.kycStatus || 'Verified',
    riskProfile: lead?.riskProfile || 'Moderate',
    familyMembers: lead?.familyMembers || '',
    bankName: lead?.bankName || '',
    bankAccountNumber: lead?.bankAccountNumber || '',
    bankIfscCode: lead?.bankIfscCode || '',
    remarks: 'Client KYC verified and onboarding completed.',
  });

  // Multiple Schemes / Policies State
  const [schemes, setSchemes] = useState(() => {
    if (lead?.schemes && Array.isArray(lead.schemes) && lead.schemes.length > 0) {
      return lead.schemes.map((s, idx) => ({
        id: s._id || idx + 1,
        service: s.service || lead.service || 'Mutual Funds',
        investmentType: s.investmentType || lead.investmentType || 'Monthly SIP',
        schemeName: s.schemeName || '',
        sipAmount: s.sipAmount !== undefined && s.sipAmount !== null ? String(s.sipAmount) : '',
        sipDay: s.sipDay || 10,
        investmentAmount: s.investmentAmount !== undefined && s.investmentAmount !== null ? String(s.investmentAmount) : '',
        tenureYears: s.tenureYears || lead?.tenureYears || '',
      }));
    }
    return [
      {
        id: 1,
        service: lead?.service || 'Mutual Funds',
        investmentType: lead?.investmentType || 'Monthly SIP',
        schemeName: lead?.schemeName || '',
        sipAmount: lead?.sipAmount ? String(lead.sipAmount) : '',
        sipDay: lead?.sipDay || 10,
        investmentAmount: lead?.investmentAmount ? String(lead.investmentAmount) : '',
        tenureYears: lead?.tenureYears || '',
      }
    ];
  });

  const handleSchemeChange = (index, field, value) => {
    setSchemes(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddScheme = () => {
    setSchemes(prev => [
      ...prev,
      {
        id: Date.now(),
        service: prev[prev.length - 1]?.service || 'Mutual Funds',
        investmentType: 'Monthly SIP',
        schemeName: '',
        sipAmount: '',
        sipDay: 10,
        investmentAmount: '',
        tenureYears: '',
      }
    ]);
  };

  const handleRemoveScheme = (index) => {
    if (schemes.length <= 1) return;
    setSchemes(prev => prev.filter((_, i) => i !== index));
  };

  // Live Auto-calculated Totals
  const totalMonthlySip = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
      return sum + (Number(s.sipAmount) || 0);
    }
    return sum;
  }, 0);

  const totalLumpsum = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
      return sum + (Number(s.investmentAmount) || 0);
    }
    return sum;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!form.name?.trim()) {
      return addToast('Client name is required', 'error');
    }
    if (!form.whatsappNumber?.trim() && !form.phone?.trim()) {
      return addToast('Phone / WhatsApp number is mandatory', 'error');
    }

    if (!schemes || schemes.length === 0) {
      return addToast('At least one investment scheme/product is required', 'error');
    }

    // Validate each scheme
    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const sNum = i + 1;

      if (!s.service?.trim()) {
        return addToast(`Scheme #${sNum}: Please select Service / Product Category`, 'error');
      }

      if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
        if (!s.sipAmount || Number(s.sipAmount) <= 0) {
          return addToast(`Scheme #${sNum}: Monthly SIP Amount (₹) is mandatory`, 'error');
        }
        if (!s.sipDay || Number(s.sipDay) < 1 || Number(s.sipDay) > 31) {
          return addToast(`Scheme #${sNum}: Please select a valid SIP Debit Day (1st - 31st)`, 'error');
        }
      }

      if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
        if (!s.investmentAmount || Number(s.investmentAmount) <= 0) {
          return addToast(`Scheme #${sNum}: Lumpsum Investment Amount (₹) is mandatory`, 'error');
        }
      }
    }

    setSaving(true);
    try {
      const formattedSchemes = schemes.map(s => ({
        service: s.service,
        investmentType: s.investmentType,
        schemeName: s.schemeName ? s.schemeName.trim() : '',
        sipAmount: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipAmount) || 0) : 0,
        sipDay: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipDay) || 10) : null,
        investmentAmount: (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') ? (Number(s.investmentAmount) || 0) : 0,
        tenureYears: s.tenureYears ? Number(s.tenureYears) : null,
      }));

      const primaryService = formattedSchemes[0]?.service || 'Mutual Funds';
      const combinedSchemeNames = formattedSchemes.map(s => s.schemeName).filter(Boolean).join(', ');
      const overallInvestmentType = totalMonthlySip > 0 && totalLumpsum > 0 
        ? 'Both' 
        : totalMonthlySip > 0 
        ? 'Monthly SIP' 
        : totalLumpsum > 0 
        ? 'Lumpsum' 
        : 'Monthly SIP';

      const payload = {
        ...lead,
        ...form,
        stage: 'Converted',
        response: 'Converted',
        serviceTaken: 'Yes',
        callStatus: 'Received',
        location: form.city || lead.location || '',
        city: form.city || lead.city || '',
        address: form.address ? form.address.trim() : '',
        pincode: form.pincode ? form.pincode.trim() : '',
        dateOfBirth: form.dateOfBirth || '',
        riskProfile: form.riskProfile || 'Moderate',
        familyMembers: form.familyMembers ? String(form.familyMembers).trim() : '',
        kycStatus: form.kycStatus || 'Verified',
        service: primaryService,
        investmentType: overallInvestmentType,
        sipAmount: totalMonthlySip,
        sipDay: formattedSchemes[0]?.sipDay || 10,
        investmentAmount: totalLumpsum,
        schemeName: combinedSchemeNames,
        tenureYears: formattedSchemes[0]?.tenureYears || null,
        schemes: formattedSchemes,
        panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
        aadhaarNumber: form.aadhaarNumber ? form.aadhaarNumber.trim() : '',
        bankName: form.bankName ? form.bankName.trim() : '',
        bankAccountNumber: form.bankAccountNumber ? form.bankAccountNumber.trim() : '',
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

      // Format comprehensive follow-up activity record with breakdown of all schemes
      const schemeBreakdown = formattedSchemes.map((s, idx) => {
        const parts = [];
        if (s.schemeName) parts.push(`"${s.schemeName}"`);
        parts.push(s.service);
        parts.push(s.investmentType);
        if (s.sipAmount > 0) parts.push(`SIP ₹${s.sipAmount.toLocaleString('en-IN')}/mo (Day ${s.sipDay})`);
        if (s.investmentAmount > 0) parts.push(`Lumpsum ₹${s.investmentAmount.toLocaleString('en-IN')}`);
        if (s.tenureYears > 0) parts.push(`Tenure: ${s.tenureYears} Year${s.tenureYears > 1 ? 's' : ''}`);
        return `[#${idx + 1}: ${parts.join(' - ')}]`;
      }).join(', ');

      await fetch(`/api/leads/${lead._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: 'Converted',
          stage: 'Converted',
          callStatus: 'Received',
          service: primaryService,
          schemeName: combinedSchemeNames,
          investmentType: overallInvestmentType,
          sipAmount: totalMonthlySip,
          sipDay: formattedSchemes[0]?.sipDay || 10,
          investmentAmount: totalLumpsum,
          schemes: formattedSchemes,
          medium: 'In-Person Meeting',
          remarks: `Converted to Client: Total Monthly SIP ₹${totalMonthlySip.toLocaleString('en-IN')}, Total Lumpsum ₹${totalLumpsum.toLocaleString('en-IN')} across ${formattedSchemes.length} scheme(s). Details: ${schemeBreakdown}. Remarks: ${form.remarks}`,
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
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Date of Birth (DOB)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.dateOfBirth} 
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} 
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
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>KYC Status</label>
                  <select 
                    className="form-select" 
                    value={form.kycStatus} 
                    onChange={e => setForm({ ...form, kycStatus: e.target.value })}
                    style={{ height: 40, borderRadius: 8, fontWeight: 700 }}
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Risk Profile</label>
                  <select 
                    className="form-select" 
                    value={form.riskProfile} 
                    onChange={e => setForm({ ...form, riskProfile: e.target.value })}
                    style={{ height: 40, borderRadius: 8, fontWeight: 700 }}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Very Aggressive">Very Aggressive</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Family Members</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.familyMembers} 
                    onChange={e => setForm({ ...form, familyMembers: e.target.value })} 
                    placeholder="e.g. 3 Members"
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                    placeholder="Street / House address"
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
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Pincode</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.pincode} 
                    onChange={e => setForm({ ...form, pincode: e.target.value })} 
                    placeholder="e.g. 826001"
                    maxLength={6}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IndianRupee size={18} />
                  3. Financial Product & Investment Setup *
                </div>

                <span style={{ 
                  background: '#DCFCE7', 
                  color: '#166534', 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  padding: '3px 10px', 
                  borderRadius: 12,
                  border: '1px solid #BBF7D0'
                }}>
                  {schemes.length} {schemes.length === 1 ? 'Scheme' : 'Schemes'} Configured
                </span>
              </div>

              {/* Live Auto-Calculated Totals Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                color: 'white',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                boxShadow: '0 4px 10px rgba(4, 120, 87, 0.2)'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.04em' }}>
                    Total Monthly SIP
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#A7F3D0', marginTop: 2 }}>
                    ₹ {totalMonthlySip.toLocaleString('en-IN')}
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#FFFFFF', marginLeft: 4, opacity: 0.85 }}>/ month</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.04em' }}>
                    Total Lumpsum
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FEF08A', marginTop: 2 }}>
                    ₹ {totalLumpsum.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.04em' }}>
                    Total Combined Value
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                    ₹ {(totalMonthlySip + totalLumpsum).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Dynamic Scheme Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {schemes.map((scheme, index) => {
                  const isSip = scheme.investmentType === 'Monthly SIP' || scheme.investmentType === 'Both';
                  const isLump = scheme.investmentType === 'Lumpsum' || scheme.investmentType === 'Both';

                  return (
                    <div 
                      key={scheme.id || index}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 14,
                        padding: '14px 16px',
                        position: 'relative',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Card Header: Scheme Number & Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            background: '#0284C7',
                            color: 'white',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            Scheme #{index + 1}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                            {scheme.schemeName || scheme.service || 'New Scheme Setup'}
                          </span>
                        </div>

                        {schemes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveScheme(index)}
                            title="Remove this scheme"
                            style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>

                      {/* Row 1: Service / Category & Investment Type */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                            Service / Product Category *
                          </label>
                          <select 
                            className="form-select" 
                            value={scheme.service} 
                            onChange={e => handleSchemeChange(index, 'service', e.target.value)}
                            required
                            style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            {SERVICES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                            Investment Type *
                          </label>
                          <select 
                            className="form-select" 
                            value={scheme.investmentType} 
                            onChange={e => handleSchemeChange(index, 'investmentType', e.target.value)}
                            required
                            style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            <option value="Monthly SIP">Monthly SIP (Recurring)</option>
                            <option value="Lumpsum">Lumpsum (One-Time)</option>
                            <option value="Both">Both (Monthly SIP + Lumpsum)</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Scheme / Policy Name & Investment Horizon (Years) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                            Scheme / Policy / Plan Name
                          </label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={scheme.schemeName} 
                            onChange={e => handleSchemeChange(index, 'schemeName', e.target.value)} 
                            placeholder="e.g. Parag Parikh Flexi Cap, HDFC Top 100, LIC Tech Term"
                            style={{ height: 38, borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Investment Horizon (How many years?)</span>
                            {scheme.tenureYears && (
                              <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 800 }}>
                                {scheme.tenureYears} Year{Number(scheme.tenureYears) > 1 ? 's' : ''}
                              </span>
                            )}
                          </label>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input 
                              type="number" 
                              min="1"
                              max="100"
                              className="form-input" 
                              value={scheme.tenureYears || ''} 
                              onChange={e => handleSchemeChange(index, 'tenureYears', e.target.value ? Number(e.target.value) : '')} 
                              placeholder="Years"
                              style={{ height: 38, width: '75px', borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem', fontWeight: 700 }}
                            />
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {TENURE_OPTIONS.map(yr => (
                                <button
                                  key={yr}
                                  type="button"
                                  onClick={() => handleSchemeChange(index, 'tenureYears', yr)}
                                  style={{
                                    padding: '4px 7px',
                                    borderRadius: 6,
                                    border: Number(scheme.tenureYears) === yr ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                    background: Number(scheme.tenureYears) === yr ? '#0284C7' : '#FFFFFF',
                                    color: Number(scheme.tenureYears) === yr ? 'white' : '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {yr}y
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Inputs for this Scheme: Monthly SIP vs Lumpsum */}
                      <div style={{ display: 'grid', gridTemplateColumns: scheme.investmentType === 'Both' ? '1fr 1fr' : '1fr', gap: 12 }}>
                        {isSip && (
                          <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 10, padding: '10px 12px' }}>
                            <div className="form-group" style={{ marginBottom: 8 }}>
                              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369A1' }}>
                                Monthly SIP Amount (₹) *
                              </label>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={scheme.sipAmount} 
                                onChange={e => handleSchemeChange(index, 'sipAmount', e.target.value)} 
                                placeholder="e.g. 5000"
                                required
                                style={{ height: 38, borderRadius: 8, border: '1.5px solid #0EA5E9', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                              />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                SIP Debit Day of Month *
                              </label>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                {SIP_DAYS.map(day => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSchemeChange(index, 'sipDay', day)}
                                    style={{
                                      padding: '3px 7px',
                                      borderRadius: 6,
                                      border: Number(scheme.sipDay) === day ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                      background: Number(scheme.sipDay) === day ? '#0284C7' : '#FFFFFF',
                                      color: Number(scheme.sipDay) === day ? 'white' : '#334155',
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
                                value={scheme.sipDay || ''} 
                                onChange={e => handleSchemeChange(index, 'sipDay', Number(e.target.value))} 
                                placeholder="Custom day (1 - 31)"
                                required
                                style={{ height: 32, borderRadius: 6, fontSize: '0.78rem', background: 'white' }}
                              />
                            </div>
                          </div>
                        )}

                        {isLump && (
                          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '10px 12px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B45309' }}>
                                Lumpsum Investment Amount (₹) *
                              </label>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={scheme.investmentAmount} 
                                onChange={e => handleSchemeChange(index, 'investmentAmount', e.target.value)} 
                                placeholder="e.g. 100000"
                                required
                                style={{ height: 38, borderRadius: 8, border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                              />
                              <span style={{ fontSize: '0.68rem', color: '#92400E', marginTop: 4, display: 'block' }}>
                                One-time lump sum capital invested / policy premium
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More Scheme / Policy Option */}
              <button
                type="button"
                onClick={handleAddScheme}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '2px dashed #16A34A',
                  background: '#FFFFFF',
                  color: '#15803D',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                <Plus size={16} />
                <span>+ Add Another Scheme / Policy</span>
              </button>
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
