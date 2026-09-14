'use client';

import { useState } from 'react';
import { X, Phone, Clock } from 'lucide-react';

export default function LogFollowUpModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    response: lead.response || 'Pending',
    callStatus: lead.callStatus || 'Pending',
    interestedInService: lead.interestedInService || 'Pending',
    serviceTaken: lead.serviceTaken || 'Pending',
    nextCallDate: lead.nextCallDate ? lead.nextCallDate.split('T')[0] : (lead.followUpDate ? lead.followUpDate.split('T')[0] : ''),
    followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : (lead.nextCallDate ? lead.nextCallDate.split('T')[0] : ''),
    interactionDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.remarks) return alert('Please add some remarks about the call.');
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, borderRadius: 32, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
          padding: '32px', 
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'var(--secondary)', padding: 8, borderRadius: 12 }}>
              <Phone size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Log Interaction</h3>
          </div>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.95rem' }}>How did the conversation with <strong>{lead.name}</strong> go?</p>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: 32, right: 32, background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white', padding: 6, borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '32px', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Response Outcome / Stage</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="form-select" 
                    value={form.response} 
                    onChange={e => setForm({ ...form, response: e.target.value })}
                    style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
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
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Call Status</label>
                <select 
                  className="form-select" 
                  value={form.callStatus} 
                  onChange={e => setForm({ ...form, callStatus: e.target.value })}
                  style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                >
                  <option value="Received">Connected</option>
                  <option value="Not Received">No Answer / Busy</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ color: '#64748b' }}>Conversation Remarks</label>
              <textarea 
                className="form-textarea" 
                value={form.remarks} 
                onChange={e => setForm({ ...form, remarks: e.target.value })} 
                placeholder="Briefly describe what was discussed..."
                style={{ 
                  minHeight: 120, 
                  borderRadius: 16, 
                  border: '2px solid #e2e8f0', 
                  padding: '16px',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#0284C7', fontWeight: 700 }}>Next Call / Follow-up Date</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={form.nextCallDate || form.followUpDate} 
                  onChange={e => setForm({ ...form, nextCallDate: e.target.value, followUpDate: e.target.value })} 
                  style={{ height: 48, borderRadius: 12, border: '2px solid #0EA5E9', fontWeight: 600, background: '#F0F9FF' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Call Interaction Date</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={form.interactionDate} 
                  onChange={e => setForm({ ...form, interactionDate: e.target.value })} 
                  style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
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
