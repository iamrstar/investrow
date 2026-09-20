'use client';

import { useState } from 'react';
import { X, Phone, Clock } from 'lucide-react';

export default function LogFollowUpModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    medium: lead.medium || 'Phone Call',
    response: lead.response || 'Pending',
    callStatus: lead.callStatus || 'Pending',
    interestedInService: lead.interestedInService || 'Pending',
    serviceTaken: lead.serviceTaken || 'Pending',
    service: lead.service || 'Mutual Funds',
    investmentType: lead.investmentType || 'Monthly SIP',
    sipAmount: lead.sipAmount || '',
    sipDay: lead.sipDay || 10,
    investmentAmount: lead.investmentAmount || '',
    schemeName: lead.schemeName || '',
    nextCallDate: lead.nextCallDate ? lead.nextCallDate.split('T')[0] : (lead.followUpDate ? lead.followUpDate.split('T')[0] : ''),
    followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : (lead.nextCallDate ? lead.nextCallDate.split('T')[0] : ''),
    interactionDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.remarks) return alert('Please add some remarks about the call.');

    // Enforce necessary financial details if converted
    if (form.response === 'Converted') {
      if (!form.service) {
        return alert('Please select which Service / Product the client converted for.');
      }
      if (form.investmentType === 'Monthly SIP') {
        if (!form.sipAmount || Number(form.sipAmount) <= 0) {
          return alert('Please enter the Monthly SIP Amount (₹) for this converted client.');
        }
        if (!form.sipDay) {
          return alert('Please select the SIP Debit Day of Month (e.g. 5th, 10th, 15th).');
        }
      } else if (form.investmentType === 'Lumpsum') {
        if (!form.investmentAmount || Number(form.investmentAmount) <= 0) {
          return alert('Please enter the Lumpsum Investment Amount (₹) for this converted client.');
        }
      } else if (form.investmentType === 'Both') {
        if (!form.sipAmount || Number(form.sipAmount) <= 0) {
          return alert('Please enter the Monthly SIP Amount (₹).');
        }
        if (!form.sipDay) {
          return alert('Please select the SIP Debit Day of Month.');
        }
        if (!form.investmentAmount || Number(form.investmentAmount) <= 0) {
          return alert('Please enter the Lumpsum Investment Amount (₹).');
        }
      }
    }

    setSaving(true);
    const scheduledNext = form.nextCallDate || form.followUpDate;
    await onSave({ 
      ...lead, 
      ...form,
      stage: form.response === 'Pending' ? 'New' : form.response,
      nextCallDate: scheduledNext,
      followUpDate: scheduledNext,
      interactionDate: form.interactionDate || new Date().toISOString().split('T')[0]
    });
    setSaving(false);
  };

  const showFinancials = ['Converted', 'Interested', 'Meeting', 'Contacted'].includes(form.response);
  const isMandatoryConversion = form.response === 'Converted';
  const sipPills = [1, 5, 10, 15, 20, 25];

  const setQuickFollowUp = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setForm(prev => ({ ...prev, nextCallDate: dateStr, followUpDate: dateStr }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, borderRadius: 32, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
          padding: '22px 20px', 
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'var(--secondary)', padding: 8, borderRadius: 12 }}>
              <Phone size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Log Interaction</h3>
          </div>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.88rem' }}>How did the conversation with <strong>{lead.name}</strong> go?</p>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white', padding: 6, borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          <div className="modal-body" style={{ background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#0EA5E9', fontWeight: 700 }}>Communication Medium *</label>
                <select 
                  className="form-select" 
                  value={form.medium} 
                  onChange={e => setForm({ ...form, medium: e.target.value })}
                  style={{ height: 46, borderRadius: 12, border: '2px solid #BAE6FD', background: '#F0F9FF', fontWeight: 700 }}
                >
                  <option value="Phone Call">📞 Phone Call</option>
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="In-Person Meeting">🤝 In-Person Meeting</option>
                  <option value="Email">✉️ Email</option>
                  <option value="Office Visit">🏢 Office Visit</option>
                  <option value="Other">🌐 Other</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#0F172A', fontWeight: 700 }}>Response Outcome / Stage *</label>
                <select 
                  className="form-select" 
                  value={form.response} 
                  onChange={e => setForm({ ...form, response: e.target.value })}
                  style={{ height: 46, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 700 }}
                >
                  <option value="Contacted">Contacted / Call Connected</option>
                  <option value="Interested">Positive / Interested (Qualified)</option>
                  <option value="Meeting">Meeting Scheduled</option>
                  <option value="Documents">Documents / KYC Stage</option>
                  <option value="Converted">Successfully Converted (Client)</option>
                  <option value="Lost">Negative / Not Interested</option>
                  <option value="Pending">Pending / Not Contacted Yet</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Call Status</label>
                <select 
                  className="form-select" 
                  value={form.callStatus} 
                  onChange={e => setForm({ ...form, callStatus: e.target.value })}
                  style={{ height: 46, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                >
                  <option value="Received">Connected</option>
                  <option value="Not Received">No Answer / Busy</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Dynamic Investment Portfolio Section (Mandatory for Converted, Recommended for Interested/Meeting) */}
            {showFinancials && (
              <div style={{
                background: isMandatoryConversion ? '#F0FDF4' : '#F8FAFC',
                border: isMandatoryConversion ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20,
                boxShadow: isMandatoryConversion ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isMandatoryConversion ? '#15803D' : '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💰 Investment & Portfolio Setup
                  </div>
                  {isMandatoryConversion && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 6 }}>
                      Required for Conversion
                    </span>
                  )}
                </div>

                {/* 1. Service / Product Dropdown */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                    Service / Product Category {isMandatoryConversion && '*'}
                  </label>
                  <select 
                    className="form-select"
                    value={form.service}
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #CBD5E1', background: 'white', fontWeight: 600 }}
                  >
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="FD & Bond">FD & Bond</option>
                    <option value="Stock Market & Demat">Stock Market & Demat</option>
                    <option value="NPS">NPS</option>
                    <option value="Tax Planning">Tax Planning</option>
                    <option value="General Insurance">General Insurance</option>
                  </select>
                </div>

                {/* 2. Investment Plan Type Toggle */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                    Investment Mode {isMandatoryConversion && '*'}
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Monthly SIP', 'Lumpsum', 'Both'].map(type => {
                      const isSelected = form.investmentType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm({ ...form, investmentType: type })}
                          style={{
                            flex: '1 1 120px',
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: isSelected ? '2px solid #0EA5E9' : '1px solid #CBD5E1',
                            background: isSelected ? '#F0F9FF' : 'white',
                            color: isSelected ? '#0284C7' : '#475569',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {type === 'Lumpsum' ? 'One-time Lumpsum' : type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Dynamic Inputs depending on Mode */}
                <div style={{ display: 'grid', gridTemplateColumns: (form.investmentType === 'Both' ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr'), gap: 14 }}>
                  {(form.investmentType === 'Monthly SIP' || form.investmentType === 'Both') && (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label className="form-label" style={{ color: '#0369A1', fontWeight: 700, fontSize: '0.78rem' }}>
                          Monthly SIP Amount (₹) {isMandatoryConversion && '*'}
                        </label>
                        <input 
                          type="number"
                          className="form-input"
                          placeholder="e.g. 10000"
                          value={form.sipAmount}
                          onChange={e => setForm({ ...form, sipAmount: e.target.value })}
                          style={{ height: 40, borderRadius: 8, border: '1.5px solid #0EA5E9', fontWeight: 700, fontSize: '0.95rem' }}
                        />
                      </div>

                      {/* Day of Month for SIP Debit */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>
                          SIP Debit Day of Month {isMandatoryConversion && '*'}
                        </label>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {sipPills.map(day => (
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
                          placeholder="Or enter day (1-31)"
                          value={form.sipDay || ''}
                          onChange={e => setForm({ ...form, sipDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                          style={{ height: 34, borderRadius: 6, fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {(form.investmentType === 'Lumpsum' || form.investmentType === 'Both') && (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ color: '#B45309', fontWeight: 700, fontSize: '0.78rem' }}>
                          Lumpsum Investment Amount (₹) {isMandatoryConversion && '*'}
                        </label>
                        <input 
                          type="number"
                          className="form-input"
                          placeholder="e.g. 200000"
                          value={form.investmentAmount}
                          onChange={e => setForm({ ...form, investmentAmount: e.target.value })}
                          style={{ height: 40, borderRadius: 8, border: '1.5px solid #F59E0B', fontWeight: 700, fontSize: '0.95rem' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4 }}>
                          Directly credits into staff total AUM
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Optional Scheme / Fund Name */}
                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem' }}>
                    Scheme / Fund Name (Optional)
                  </label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Parag Parikh Flexi Cap, HDFC Top 100"
                    value={form.schemeName}
                    onChange={e => setForm({ ...form, schemeName: e.target.value })}
                    style={{ height: 38, borderRadius: 8, fontSize: '0.82rem', background: 'white' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ color: '#64748b' }}>Conversation Remarks *</label>
              <textarea 
                className="form-textarea" 
                value={form.remarks} 
                onChange={e => setForm({ ...form, remarks: e.target.value })} 
                placeholder="Briefly describe what was discussed with the client..."
                style={{ 
                  minHeight: 100, 
                  borderRadius: 14, 
                  border: '2px solid #e2e8f0', 
                  padding: '14px',
                  fontSize: '0.92rem',
                  lineHeight: 1.5
                }}
                required
              />
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0284C7', fontWeight: 700 }}>Next Follow-up Requested Date</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={form.nextCallDate || form.followUpDate} 
                    onChange={e => setForm({ ...form, nextCallDate: e.target.value, followUpDate: e.target.value })} 
                    style={{ height: 44, borderRadius: 12, border: '2px solid #0EA5E9', fontWeight: 600, background: '#F0F9FF' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {[
                      { label: 'Tomorrow', days: 1 },
                      { label: '+3 Days', days: 3 },
                      { label: '+1 Week', days: 7 },
                      { label: '+2 Weeks', days: 14 },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setQuickFollowUp(p.days)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid #BAE6FD',
                          background: '#F0F9FF',
                          color: '#0284C7',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#64748b' }}>When Did You Call? (Interaction Date)</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={form.interactionDate} 
                    onChange={e => setForm({ ...form, interactionDate: e.target.value })} 
                    style={{ height: 44, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 12 }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{ flex: 2, height: 48, borderRadius: 12, background: 'var(--secondary)', boxShadow: '0 4px 12px rgba(14,165,233,0.2)' }}
            >
              {saving ? 'Saving...' : 'Save Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
