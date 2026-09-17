'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  MessageSquare, Send, Phone, Mail, User, CheckCircle2,
  Clock, Sparkles, Copy, ExternalLink, Calendar, Bell, ArrowRight, IndianRupee
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

  const [upcomingSips, setUpcomingSips] = useState([]);
  const [loadingSips, setLoadingSips] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].text);
  const [channelFilter, setChannelFilter] = useState('All');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.stats?.upcomingSipAlerts) {
          setUpcomingSips(data.stats.upcomingSipAlerts);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSips(false));
  }, []);

  const handleSelectClientForReminder = (sip) => {
    const targetPhone = sip.whatsappNumber || sip.phone || '';
    setRecipientName(sip.name);
    setRecipientPhone(targetPhone);
    const msg = `Dear ${sip.name}, this is a gentle reminder from Investrow that your monthly SIP of ${sip.formattedAmount} for ${sip.schemeName || sip.service} is scheduled for debit on the ${sip.sipDay}th (${sip.dueStatus}). Kindly ensure sufficient balance in your linked bank account for seamless investment. Happy Investing! - Investrow`;
    setCustomMessage(msg);
    addToast(`Loaded ${sip.name}'s reminder into composer!`, 'info');
  };

  const handleDirectWhatsAppSip = (sip) => {
    const raw = sip.whatsappNumber || sip.phone || '';
    const clean = raw.replace(/[^0-9]/g, '');
    let finalPhone = clean;
    if (finalPhone.length === 10) finalPhone = '91' + finalPhone;
    if (!finalPhone) {
      return addToast('Client has no phone number on record', 'error');
    }
    const msg = `Dear ${sip.name}, this is a gentle reminder from Investrow that your monthly SIP of ${sip.formattedAmount} for ${sip.schemeName || sip.service} is scheduled for debit on the ${sip.sipDay}th (${sip.dueStatus}). Kindly ensure sufficient balance in your linked bank account for seamless investment. Happy Investing! - Investrow`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    setHistory(prev => [
      {
        id: Date.now(),
        name: sip.name,
        phone: raw,
        action: 'WhatsApp sent',
        detail: `Sent 5-day prior SIP balance reminder for ${sip.schemeName || 'Mutual Fund'} (${sip.formattedAmount}).`,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);
    addToast(`Opened WhatsApp reminder for ${sip.name}!`, 'success');
  };
  const [history, setHistory] = useState([
    { id: 1, name: 'Amit Kumar', phone: '9876541234', action: 'Call completed', detail: 'Discussed SIP options and fund allocation.', time: '09 Sep 10:00 AM', channel: 'Calls' },
    { id: 2, name: 'Priya Sinha', phone: '9812345678', action: 'WhatsApp sent', detail: 'Sent scheme brochure and performance fact sheet.', time: '08 Sep 04:30 PM', channel: 'WhatsApp' },
    { id: 3, name: 'Rajesh Verma', phone: '9765432109', action: 'Email sent', detail: 'Sent KYC document checklist and onboarding form.', time: '07 Sep 11:30 AM', channel: 'Email' },
    { id: 4, name: 'Neha Gupta', phone: '9654328765', action: 'Meeting', detail: 'Met at office, discussed retirement & wealth goals.', time: '06 Sep 03:30 PM', channel: 'Meeting' },
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

      {/* 5-Day Prior Upcoming SIP Reminder List */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        marginBottom: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>5-DAY PRIOR ALERT</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Upcoming SIP Debits (Next 5 Days)
              </h3>
              <span style={{ background: '#0EA5E9', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                {upcomingSips.length} Clients
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              These clients have monthly SIP deductions in the next 5 days. Send a 1-click WhatsApp balance reminder to ensure sufficient bank funds.
            </p>
          </div>
        </div>

        {loadingSips ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
            Checking upcoming SIP deductions...
          </div>
        ) : upcomingSips.length === 0 ? (
          <div style={{
            background: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: 14,
            border: '1px dashed #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#64748B',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>No client SIP deductions scheduled in the next 5 days. All monthly mandates are current.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {upcomingSips.map(sip => (
              <div 
                key={sip._id}
                style={{
                  background: '#F8FAFC',
                  borderRadius: 16,
                  padding: '16px 18px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                      {sip.name}
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: sip.dueStatus === 'Today' ? '#FEF2F2' : sip.dueStatus === 'Tomorrow' ? '#FFF7ED' : '#EFF6FF',
                      color: sip.dueStatus === 'Today' ? '#DC2626' : sip.dueStatus === 'Tomorrow' ? '#EA580C' : '#2563EB',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: `1px solid ${sip.dueStatus === 'Today' ? '#FECACA' : sip.dueStatus === 'Tomorrow' ? '#FFEDD5' : '#DBEAFE'}`
                    }}>
                      {sip.dueStatus} (Day {sip.sipDay})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 8 }}>
                    {sip.schemeName || sip.service || 'Mutual Funds SIP'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                      {sip.formattedAmount} / mo
                    </span>
                    <span style={{ color: '#94A3B8' }}>•</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>{sip.phone}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => handleSelectClientForReminder(sip)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      flex: 1,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      borderRadius: 8,
                      padding: '6px 10px',
                      justifyContent: 'center'
                    }}
                  >
                    Load in Composer
                  </button>
                  <button
                    onClick={() => handleDirectWhatsAppSip(sip)}
                    className="btn btn-sm"
                    style={{
                      flex: 1.2,
                      background: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      borderRadius: 8,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Send size={13} />
                    <span>WhatsApp Send</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

          {/* Recent Outbound History & Timeline (Panel 11) */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                Communication Timeline
              </h3>
              
              {/* Filter Tabs (Panel 11) */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {['All', 'Calls', 'WhatsApp', 'Email', 'Meeting'].map(ch => {
                  const isSel = channelFilter === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannelFilter(ch)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 14,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: isSel ? '1px solid #0EA5E9' : '1px solid #E2E8F0',
                        background: isSel ? '#0EA5E9' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history
                .filter(item => channelFilter === 'All' || item.channel === channelFilter)
                .map(item => {
                  const isCall = item.channel === 'Calls';
                  const isWA = item.channel === 'WhatsApp';
                  const isMail = item.channel === 'Email';
                  const iconBg = isCall ? '#ECFDF5' : isWA ? '#F0FDF4' : isMail ? '#EFF6FF' : '#F5F3FF';
                  const iconColor = isCall ? '#059669' : isWA ? '#16A34A' : isMail ? '#2563EB' : '#7C3AED';

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#F8FAFC',
                        border: '1px solid #F1F5F9'
                      }}
                    >
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: iconBg, 
                        color: iconColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2
                      }}>
                        {isCall ? <Phone size={16} /> : isWA ? <Send size={16} /> : isMail ? <Mail size={16} /> : <Calendar size={16} />}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                            {item.action}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                            {item.time}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 3 }}>
                          {item.detail}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4, display: 'flex', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#0EA5E9' }}>{item.name}</span>
                          <span>•</span>
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
