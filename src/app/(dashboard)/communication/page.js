'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  MessageSquare, Send, Phone, Mail, User, CheckCircle2,
  Clock, Sparkles, Copy, ExternalLink, Calendar
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'welcome',
    title: 'Welcome Client Message',
    badge: 'Onboarding',
    color: '#0EA5E9',
    text: 'Dear {name}, welcome to Investrow Financial Services! We are committed to helping you achieve your financial goals. Your portfolio advisor is available for any questions. Thank you for placing your trust in us.',
  },
  {
    id: 'sip',
    title: 'Monthly SIP Due Reminder',
    badge: 'Investment',
    color: '#10B981',
    text: 'Hello {name}, this is a gentle reminder that your monthly SIP contribution is scheduled soon. Keeping your SIP active ensures consistent compounding and rupee cost averaging. Happy investing! - Investrow',
  },
  {
    id: 'insurance',
    title: 'Insurance Premium Due Date',
    badge: 'Protection',
    color: '#F97316',
    text: 'Dear {name}, your insurance policy renewal premium is approaching its due date. Ensure timely payment to maintain seamless coverage for you and your family. Reach out if you need assistance. - Investrow',
  },
  {
    id: 'followup',
    title: 'Portfolio Review & Follow-up',
    badge: 'Advisory',
    color: '#6366F1',
    text: 'Hi {name}, hope you are doing well! It is a great time to review your investment portfolio and align with current market trends. When would be a convenient time for a quick 10-minute catch-up? - Investrow',
  },
];

export default function CommunicationPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].text);
  const [history, setHistory] = useState([
    { id: 1, name: 'Amit Kumar', phone: '9876541234', template: 'SIP Reminder', time: '10:15 AM', channel: 'WhatsApp' },
    { id: 2, name: 'Priya Sinha', phone: '9812345678', template: 'Insurance Premium', time: '09:40 AM', channel: 'WhatsApp' },
    { id: 3, name: 'Neha Gupta', phone: '9654328765', template: 'Portfolio Review', time: 'Yesterday', channel: 'WhatsApp' },
  ]);

  const handleTemplateChange = (tpl) => {
    setSelectedTemplate(tpl);
    const resolved = tpl.text.replace('{name}', recipientName || 'Valued Client');
    setCustomMessage(resolved);
  };

  const handleNameChange = (val) => {
    setRecipientName(val);
    if (selectedTemplate) {
      const resolved = selectedTemplate.text.replace('{name}', val || 'Valued Client');
      setCustomMessage(resolved);
    }
  };

  const handleLaunchWhatsApp = () => {
    if (!recipientPhone.trim()) {
      return addToast('Please enter recipient phone number', 'error');
    }

    const clean = recipientPhone.replace(/[^0-9]/g, '');
    let finalPhone = clean;
    if (finalPhone.length === 10) finalPhone = '91' + finalPhone;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');

    setHistory(prev => [
      {
        id: Date.now(),
        name: recipientName || 'Client',
        phone: recipientPhone,
        template: selectedTemplate.title,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);

    addToast('Opened in WhatsApp Web!', 'success');
  };

  return (
    <div style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
          Communication Hub
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
          Compose and dispatch personalized WhatsApp and email reminders to clients
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left: Message Composer */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={20} color="#22C55E" />
            <span>WhatsApp Composer</span>
          </h3>

          {/* Recipient Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Client Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Kumar"
                value={recipientName}
                onChange={e => handleNameChange(e.target.value)}
                style={{ height: 42, borderRadius: 10 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Mobile Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                style={{ height: 42, borderRadius: 10 }}
              />
            </div>
          </div>

          {/* Template Selectors */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 8, display: 'block' }}>
              Select Pre-Built Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TEMPLATES.map(tpl => {
                const isSelected = selectedTemplate.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tpl)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      textAlign: 'left',
                      background: isSelected ? '#F0FDF4' : '#F8FAFC',
                      border: isSelected ? '2px solid #22C55E' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: tpl.color, textTransform: 'uppercase' }}>
                        {tpl.badge}
                      </span>
                      {isSelected && <CheckCircle2 size={14} color="#22C55E" />}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0F172A' }}>
                      {tpl.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Message Content</label>
            <textarea
              className="form-textarea"
              rows={5}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              style={{ borderRadius: 12, lineHeight: 1.6 }}
            />
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunchWhatsApp}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              background: '#22C55E',
              color: 'white',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}
          >
            <Send size={18} /> Open & Send via WhatsApp Web
          </button>
        </div>

        {/* Right: Message Templates Preview & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Preview Box */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              WhatsApp Message Preview
            </h3>
            <div style={{
              background: '#EFEAE2',
              borderRadius: 16,
              padding: 20,
              position: 'relative'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '0 12px 12px 12px',
                padding: '14px 16px',
                fontSize: '0.85rem',
                color: '#111827',
                lineHeight: 1.6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                maxWidth: '90%'
              }}>
                {customMessage || 'Select a template or write message...'}
                <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#9CA3AF', marginTop: 4 }}>
                  10:30 AM ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Recent Outbound History */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              Recent Communication History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.phone} • {item.template}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
