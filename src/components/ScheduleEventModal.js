'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function ScheduleEventModal({ lead, type, onClose, onSave }) {
  const [form, setForm] = useState({
    title: type === 'Call' ? `Call with ${lead.name}` : `Meeting with ${lead.name}`,
    subject: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    meetingType: 'Online',
    platform: 'Google Meet',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const scheduledAt = new Date(`${form.date}T${form.time}`);
    await onSave({
      title: form.title,
      subject: form.subject,
      notes: form.notes,
      scheduledAt,
      meetingType: type === 'Meeting' ? form.meetingType : '',
      platform: type === 'Meeting' && form.meetingType === 'Online' ? form.platform : '',
    });
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--secondary)', padding: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Schedule {type}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Subject</label>
            <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder={`Purpose of ${type.toLowerCase()}`} required />
          </div>

          {type === 'Meeting' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label">Meeting Type</label>
                <select className="form-select" value={form.meetingType} onChange={e => setForm({ ...form, meetingType: e.target.value })}>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              {form.meetingType === 'Online' && (
                <div>
                  <label className="form-label">Platform</label>
                  <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." style={{ minHeight: 100 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Time</label>
              <input type="time" className="form-input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ height: 48, borderRadius: 12 }}>
            {saving ? 'Scheduling...' : `Schedule ${type}`}
          </button>
        </form>
      </div>
    </div>
  );
}
