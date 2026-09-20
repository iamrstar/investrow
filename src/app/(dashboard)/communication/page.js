'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  MessageSquare, Send, Phone, Mail, User, CheckCircle2,
  Clock, Sparkles, Copy, ExternalLink, Calendar, Bell, ArrowRight,
  IndianRupee, Cake, PartyPopper, Gift, Search, Users, Flame, RefreshCw, Check,
  Play, Pause, Square, Smartphone, HelpCircle
} from 'lucide-react';

const BIRTHDAY_TONES = [
  {
    id: 'warm',
    title: 'Warm & Joyous',
    text: 'Dear {name}, 🎂 Happy Birthday! May your day be filled with joy, and may this coming year bring you vibrant health, boundless happiness, and continuous success. Thank you for being a cherished part of the Investrow family! - Best wishes, {advisor} & Team Investrow'
  },
  {
    id: 'prosperity',
    title: 'Wealth & Prosperity',
    text: 'Wishing you a very Happy Birthday, {name}! 🎉 On your special day, Team Investrow wishes you compounding happiness, great health, and lasting financial prosperity. Have a wonderful celebration! - {advisor}, Investrow'
  },
  {
    id: 'short',
    title: 'Short & Sweet',
    text: 'Happy Birthday {name}! 🎂 Wishing you a fantastic year ahead filled with joy, good health, and success. Best wishes from Team Investrow!'
  }
];

const FESTIVAL_TEMPLATES = [
  {
    id: 'prosperity',
    title: 'Prosperity & Joy',
    text: 'Dear {name}, 🪔 Team Investrow wishes you and your family a very joyous and blessed {festival}! May this festive season illuminate your life with good health, happiness, and abundant financial prosperity. Warmest festive greetings, {advisor} & Team Investrow.'
  },
  {
    id: 'festive_warm',
    title: 'Warm Blessings',
    text: 'Warm greetings on the auspicious occasion of {festival} to you and your loved ones, {name}! ✨ May the festivities bring peace, unity, and flourishing growth to your home. Happy {festival}! - From {advisor} & Investrow Financial Services.'
  },
  {
    id: 'succinct',
    title: 'Short Festive Wish',
    text: 'Happy {festival} to you and your family, {name}! 🎆 May this festival bring peace, joy, and prosperity to your life. Best wishes, Team Investrow.'
  }
];

const STANDARD_TEMPLATES = [
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

  const [activeTab, setActiveTab] = useState('birthdays'); // 'birthdays' | 'festivals' | 'sips' | 'custom'

  // Greetings data
  const [greetingsLoading, setGreetingsLoading] = useState(true);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [sentWishesMap, setSentWishesMap] = useState({});

  // Birthday tab state
  const [selectedBdayTone, setSelectedBdayTone] = useState(BIRTHDAY_TONES[0]);
  const [clientCustomBdayMsgs, setClientCustomBdayMsgs] = useState({});

  // Festival tab state
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [customFestivalName, setCustomFestivalName] = useState('');
  const [selectedFestTemplate, setSelectedFestTemplate] = useState(FESTIVAL_TEMPLATES[0]);
  const [festivalCustomMsg, setFestivalCustomMsg] = useState(FESTIVAL_TEMPLATES[0].text);
  const [festivalClientSearch, setFestivalClientSearch] = useState('');
  const [festivalServiceFilter, setFestivalServiceFilter] = useState('All');
  
  // Guided Broadcast Queue state
  const [isBroadcastQueueOpen, setIsBroadcastQueueOpen] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(3);
  const [showBroadcastInfo, setShowBroadcastInfo] = useState(false);

  // SIP alerts state
  const [upcomingSips, setUpcomingSips] = useState([]);
  const [loadingSips, setLoadingSips] = useState(true);

  // Custom composer state
  const [selectedTemplate, setSelectedTemplate] = useState(STANDARD_TEMPLATES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customMessage, setCustomMessage] = useState(STANDARD_TEMPLATES[0].text);
  const [history, setHistory] = useState([
    { id: 1, name: 'Amit Kumar', phone: '9876541234', action: 'Call completed', detail: 'Discussed SIP options and fund allocation.', time: '09 Sep 10:00 AM', channel: 'Calls' },
    { id: 2, name: 'Priya Sinha', phone: '9812345678', action: 'WhatsApp sent', detail: 'Sent scheme brochure and performance fact sheet.', time: '08 Sep 04:30 PM', channel: 'WhatsApp' },
    { id: 3, name: 'Rajesh Verma', phone: '9765432109', action: 'Email sent', detail: 'Sent KYC document checklist and onboarding form.', time: '07 Sep 11:30 AM', channel: 'Email' },
  ]);

  const advisorName = user?.name || 'Your Advisor';

  // Load Greetings API
  const loadGreetings = () => {
    setGreetingsLoading(true);
    fetch('/api/greetings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTodayBirthdays(data.todayBirthdays || []);
          setUpcomingBirthdays(data.upcomingBirthdays || []);
          setFestivals(data.festivals || []);
          setAllClients(data.allClients || []);
          if (data.festivals && data.festivals.length > 0) {
            setSelectedFestival(data.festivals[0]);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load greetings:', err);
      })
      .finally(() => setGreetingsLoading(false));
  };

  useEffect(() => {
    loadGreetings();

    // Load SIP alerts from dashboard API
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

  // Sync festival message when festival or template changes
  useEffect(() => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    const msg = selectedFestTemplate.text
      .replace(/{festival}/g, festName)
      .replace(/{advisor}/g, advisorName);
    setFestivalCustomMsg(msg);
  }, [selectedFestival, customFestivalName, selectedFestTemplate, advisorName]);

  // Format phone to 91XXXXXXXXXX
  const getCleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    let clean = String(phoneStr).replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return clean;
  };

  // 1-Click Send Birthday Wish
  const handleSendBirthdayWish = async (client) => {
    const phone = getCleanPhone(client.whatsappNumber || client.phone);
    if (!phone) {
      return addToast(`${client.name} has no phone/WhatsApp number on file`, 'error');
    }

    const customText = clientCustomBdayMsgs[client._id];
    let msgToSend = customText;
    if (!msgToSend) {
      msgToSend = selectedBdayTone.text
        .replace(/{name}/g, client.name)
        .replace(/{advisor}/g, client.assignedTo || advisorName);
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msgToSend)}`;
    window.open(url, '_blank');

    setSentWishesMap(prev => ({ ...prev, [client._id]: true }));
    addToast(`Opened WhatsApp birthday greeting for ${client.name}!`, 'success');

    // Log to ActivityLog
    try {
      await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client._id,
          clientName: client.name,
          type: 'birthday',
          message: msgToSend,
          channel: 'WhatsApp'
        })
      });
    } catch (e) {
      console.error(e);
    }

    setHistory(prev => [
      {
        id: Date.now(),
        name: client.name,
        phone: client.phone,
        action: 'Birthday Wish sent',
        detail: `Sent birthday greeting on WhatsApp: "${msgToSend.slice(0, 60)}..."`,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);
  };

  // Copy Birthday Wish
  const handleCopyBirthdayWish = (client) => {
    const customText = clientCustomBdayMsgs[client._id];
    let msgToSend = customText;
    if (!msgToSend) {
      msgToSend = selectedBdayTone.text
        .replace(/{name}/g, client.name)
        .replace(/{advisor}/g, client.assignedTo || advisorName);
    }
    navigator.clipboard.writeText(msgToSend);
    addToast(`Copied birthday wish for ${client.name}!`, 'success');
  };

  // 1-Click Send Festival Wish to an Individual Client
  const handleSendFestivalWish = async (client) => {
    const phone = getCleanPhone(client.whatsappNumber || client.phone);
    if (!phone) {
      return addToast(`${client.name} has no phone/WhatsApp number on record`, 'error');
    }

    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    const msgToSend = festivalCustomMsg
      .replace(/{name}/g, client.name)
      .replace(/{festival}/g, festName)
      .replace(/{advisor}/g, client.assignedTo || advisorName);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msgToSend)}`;
    window.open(url, '_blank');

    setSentWishesMap(prev => ({ ...prev, [`fest-${client._id}`]: true }));
    addToast(`Opened WhatsApp festival greeting for ${client.name}!`, 'success');

    try {
      await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client._id,
          clientName: client.name,
          type: 'festival',
          festivalName: festName,
          message: msgToSend,
          channel: 'WhatsApp'
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Copy All Personalized Festival Messages for Bulk / Broadcast List
  const handleCopyAllFestivalMessages = () => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) {
      return addToast('No clients match current filter', 'error');
    }

    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    const compiled = filtered.map(c => {
      const msg = festivalCustomMsg
        .replace(/{name}/g, c.name)
        .replace(/{festival}/g, festName)
        .replace(/{advisor}/g, c.assignedTo || advisorName);
      return `--------------------------------------------------\nCLIENT: ${c.name} (${c.whatsappNumber || c.phone || 'No Phone'})\nMESSAGE:\n${msg}\n`;
    }).join('\n');

    navigator.clipboard.writeText(compiled);
    addToast(`Copied ${filtered.length} personalized festival greetings to clipboard!`, 'success');
  };

  // Filter clients for festival broadcast
  const getFilteredFestivalClients = () => {
    return allClients.filter(c => {
      if (festivalServiceFilter !== 'All' && c.service !== festivalServiceFilter) {
        return false;
      }
      if (festivalClientSearch.trim()) {
        const q = festivalClientSearch.toLowerCase();
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      }
      return true;
    });
  };

  // Copy all clean phone numbers for WhatsApp Broadcast
  const handleCopyAllPhoneNumbers = () => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) return addToast('No clients found', 'error');
    const numbers = filtered.map(c => getCleanPhone(c.whatsappNumber || c.phone)).filter(Boolean);
    const unique = [...new Set(numbers)];
    navigator.clipboard.writeText(unique.join(', '));
    addToast(`Copied ${unique.length} phone numbers for WhatsApp Broadcast!`, 'success');
  };

  // Guided & Auto WhatsApp broadcast queue
  const startBroadcastQueue = (auto = false) => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) {
      return addToast('No clients to send to', 'error');
    }
    setBroadcastIndex(0);
    setIsAutoSending(auto);
    setAutoCountdown(3);
    setIsBroadcastQueueOpen(true);
  };

  const handleSendCurrentQueueClient = () => {
    const filtered = getFilteredFestivalClients();
    const current = filtered[broadcastIndex];
    if (current) {
      handleSendFestivalWish(current);
      if (broadcastIndex + 1 < filtered.length) {
        setBroadcastIndex(prev => prev + 1);
        setAutoCountdown(3);
      } else {
        setIsAutoSending(false);
        setIsBroadcastQueueOpen(false);
        addToast('All clients in broadcast queue processed!', 'success');
      }
    }
  };

  // Automated hands-free dispatch runner
  useEffect(() => {
    let timer;
    if (isBroadcastQueueOpen && isAutoSending) {
      if (autoCountdown > 0) {
        timer = setTimeout(() => {
          setAutoCountdown(prev => prev - 1);
        }, 1000);
      } else {
        const filtered = getFilteredFestivalClients();
        const current = filtered[broadcastIndex];
        if (current) {
          handleSendFestivalWish(current);
          if (broadcastIndex + 1 < filtered.length) {
            setBroadcastIndex(prev => prev + 1);
            setAutoCountdown(3);
          } else {
            setIsAutoSending(false);
            setIsBroadcastQueueOpen(false);
            addToast('All clients in auto-dispatch completed!', 'success');
          }
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isBroadcastQueueOpen, isAutoSending, autoCountdown, broadcastIndex]);

  // Handle direct SIP reminder send
  const handleDirectWhatsAppSip = (sip) => {
    const raw = sip.whatsappNumber || sip.phone || '';
    const finalPhone = getCleanPhone(raw);
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

  return (
    <div style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#E0F2FE', color: '#0284C7', padding: 8, borderRadius: 12 }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Communication & Greetings Hub
              </h1>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '2px 0 0 0' }}>
                1-Click Birthday celebrations, festival broadcasts to all clients, and SIP alerts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadGreetings}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: '#FFFFFF' }}
        >
          <RefreshCw size={14} className={greetingsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Top Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 24,
        background: '#FFFFFF',
        padding: '6px',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Tab 1: Birthdays */}
        <button
          type="button"
          onClick={() => setActiveTab('birthdays')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'birthdays' ? 'linear-gradient(135deg, #F59E0B, #EA580C)' : 'transparent',
            color: activeTab === 'birthdays' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Cake size={18} />
          Birthday Wisher
          {todayBirthdays.length > 0 ? (
            <span style={{
              background: activeTab === 'birthdays' ? '#FFFFFF' : '#EF4444',
              color: activeTab === 'birthdays' ? '#EA580C' : '#FFFFFF',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 900
            }}>
              {todayBirthdays.length} TODAY
            </span>
          ) : (
            <span style={{
              background: activeTab === 'birthdays' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              color: activeTab === 'birthdays' ? '#FFFFFF' : '#64748B',
              borderRadius: 8,
              padding: '2px 6px',
              fontSize: '0.7rem'
            }}>
              {upcomingBirthdays.length} Upcoming
            </span>
          )}
        </button>

        {/* Tab 2: Festival Greetings */}
        <button
          type="button"
          onClick={() => setActiveTab('festivals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'festivals' ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : 'transparent',
            color: activeTab === 'festivals' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={18} />
          Festival Broadcast (All Clients)
          {selectedFestival && (
            <span style={{
              background: activeTab === 'festivals' ? 'rgba(255,255,255,0.25)' : '#EDE9FE',
              color: activeTab === 'festivals' ? '#FFFFFF' : '#6D28D9',
              borderRadius: 8,
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {selectedFestival.name}
            </span>
          )}
        </button>

        {/* Tab 3: SIP Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab('sips')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'sips' ? '#0284C7' : 'transparent',
            color: activeTab === 'sips' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Bell size={18} />
          SIP Due Reminders
          {upcomingSips.length > 0 && (
            <span style={{
              background: activeTab === 'sips' ? '#FFFFFF' : '#E0F2FE',
              color: activeTab === 'sips' ? '#0284C7' : '#0369A1',
              borderRadius: 8,
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {upcomingSips.length}
            </span>
          )}
        </button>

        {/* Tab 4: Custom Message & History */}
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'custom' ? '#0F172A' : 'transparent',
            color: activeTab === 'custom' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Send size={18} />
          Custom Composer & Logs
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 🎂 BIRTHDAY WISHER */}
      {/* ========================================================================= */}
      {activeTab === 'birthdays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Today's Birthday Section */}
          <div style={{
            background: todayBirthdays.length > 0
              ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)'
              : '#FFFFFF',
            borderRadius: 22,
            padding: '24px 28px',
            border: todayBirthdays.length > 0 ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#EA580C',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                }}>
                  <PartyPopper size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#78350F', margin: 0 }}>
                      Today&apos;s Client Birthdays
                    </h2>
                    <span style={{
                      background: todayBirthdays.length > 0 ? '#DC2626' : '#64748B',
                      color: '#FFFFFF',
                      borderRadius: 10,
                      padding: '2px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 900
                    }}>
                      {todayBirthdays.length} Celebrating Today
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#92400E' }}>
                    Send personalized 1-click WhatsApp birthday greetings directly from this tab
                  </p>
                </div>
              </div>

              {/* Tone Quick Selector */}
              {todayBirthdays.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: '4px 8px', borderRadius: 12, border: '1px solid #FCD34D' }}>
                  <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: 800 }}>Greeting Tone:</span>
                  {BIRTHDAY_TONES.map(tone => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedBdayTone(tone)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: selectedBdayTone.id === tone.id ? '1.5px solid #EA580C' : '1px solid #E2E8F0',
                        background: selectedBdayTone.id === tone.id ? '#FFEDD5' : '#FFFFFF',
                        color: selectedBdayTone.id === tone.id ? '#9A3412' : '#64748B',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {tone.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List of Clients Celebrating Today */}
            {greetingsLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#B45309', fontWeight: 600 }}>
                Checking client birthdays...
              </div>
            ) : todayBirthdays.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
                {todayBirthdays.map(client => {
                  const currentCustomText = clientCustomBdayMsgs[client._id] ?? selectedBdayTone.text
                    .replace(/{name}/g, client.name)
                    .replace(/{advisor}/g, client.assignedTo || advisorName);

                  const isSent = sentWishesMap[client._id];

                  return (
                    <div
                      key={client._id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 18,
                        padding: '20px',
                        border: '1.5px solid #FCD34D',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Client Header in Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 46,
                              height: 46,
                              borderRadius: 14,
                              background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 900
                            }}>
                              🎂
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                                  {client.name}
                                </h3>
                                {isSent && (
                                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Check size={11} /> Sent
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span>{client.phone}</span>
                                <span>•</span>
                                <span>{client.service}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              background: '#FEF3C7',
                              color: '#B45309',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: '0.76rem',
                              fontWeight: 900,
                              display: 'inline-block'
                            }}>
                              {client.turningAge ? `Turning ${client.turningAge} Today!` : 'Birthday Today!'}
                            </span>
                          </div>
                        </div>

                        {/* Editable Message Box */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                            Personalized Greeting Message:
                          </label>
                          <textarea
                            rows={3}
                            value={currentCustomText}
                            onChange={(e) => setClientCustomBdayMsgs(prev => ({ ...prev, [client._id]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 10,
                              border: '1px solid #E2E8F0',
                              fontSize: '0.82rem',
                              lineHeight: '1.4',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              background: '#F8FAFC'
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <button
                          type="button"
                          onClick={() => handleSendBirthdayWish(client)}
                          style={{
                            flex: 1,
                            background: isSent ? '#059669' : 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 14px',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <Send size={15} />
                          {isSent ? 'Send Again on WhatsApp' : 'Wish on WhatsApp (1-Click)'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyBirthdayWish(client)}
                          title="Copy Message"
                          className="btn btn-ghost btn-sm"
                          style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 10px', color: '#475569' }}
                        >
                          <Copy size={15} />
                        </button>

                        {client.email && (
                          <a
                            href={`mailto:${client.email}?subject=${encodeURIComponent(`Happy Birthday from Investrow Financial Services!`)}&body=${encodeURIComponent(currentCustomText)}`}
                            title="Send Email"
                            className="btn btn-ghost btn-sm"
                            style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 10px', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            <Mail size={15} />
                          </a>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '30px 20px',
                textAlign: 'center',
                border: '1.5px dashed #CBD5E1'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>☀️</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  No Client Birthdays Today
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: 460, margin: '0 auto' }}>
                  There are no client birthdays scheduled for today. Check upcoming birthdays below to prepare your early greetings.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Birthdays in next 14 Days */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 26px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} style={{ color: '#0EA5E9' }} />
                  Upcoming Birthdays (Next 14 Days)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Clients turning a year older over the next two weeks
                </p>
              </div>
              <span style={{ background: '#F0F9FF', color: '#0284C7', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>
                {upcomingBirthdays.length} Upcoming
              </span>
            </div>

            {upcomingBirthdays.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {upcomingBirthdays.map(client => (
                  <div
                    key={client._id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                          {client.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                        {client.formattedBirthDate} • {client.turningAge ? `Turning ${client.turningAge}` : 'Birthday'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, marginTop: 4 }}>
                        {client.diffDays === 1 ? 'Tomorrow!' : `In ${client.diffDays} days`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendBirthdayWish(client)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        borderColor: '#FCD34D',
                        color: '#B45309',
                        background: '#FFFBEB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Gift size={13} /> Wish Early
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                No other client birthdays coming up in the next 14 days.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 🪔 FESTIVAL GREETINGS (ALL CLIENTS BROADCAST) */}
      {/* ========================================================================= */}
      {activeTab === 'festivals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Festival Selection & Composer Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)',
            borderRadius: 22,
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(109, 40, 217, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    {selectedFestival?.icon || '🪔'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#E9D5FF' }}>
                      Festival Greetings Broadcast
                    </span>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0 }}>
                      Send Festival Wishes to All Clients
                    </h2>
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#DDD6FE', maxWidth: 620 }}>
                  Personalized festival greetings for your entire client base. Reach all active investors via 1-click WhatsApp web dispatch or copy personalized messages.
                </p>
              </div>

              {/* Broadcast Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startBroadcastQueue(true)}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 18px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Play size={16} />
                  Auto-Send to All ({getFilteredFestivalClients().length})
                </button>

                <button
                  type="button"
                  onClick={() => startBroadcastQueue(false)}
                  style={{
                    background: '#FFFFFF',
                    color: '#6D28D9',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontWeight: 900,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}
                >
                  <Flame size={16} />
                  1-by-1 Queue
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllPhoneNumbers}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={15} />
                  Copy Numbers
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllFestivalMessages}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={15} />
                  Copy All Messages
                </button>

                <button
                  type="button"
                  onClick={() => setShowBroadcastInfo(prev => !prev)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#DDD6FE',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={15} />
                  How to blast to all at once?
                </button>
              </div>
            </div>

            {/* Broadcast Info Box */}
            {showBroadcastInfo && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
                fontSize: '0.84rem',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 800, color: '#FDE68A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={16} /> How to send to all clients in 1 single second via WhatsApp:
                </div>
                <div>
                  <strong>Method 1 (Instant WhatsApp Broadcast List):</strong><br />
                  1. Click <strong>&quot;Copy Numbers&quot;</strong> above.<br />
                  2. Open WhatsApp on Mobile / WhatsApp Web ➔ Click <strong>&quot;New Broadcast&quot;</strong>.<br />
                  3. Add your client contacts and paste the Festive Message.<br />
                  4. Hit Send — WhatsApp delivers to <strong>all 100+ clients simultaneously and privately</strong> at the exact same second!
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Method 2 (Hands-Free CRM Auto-Sender):</strong><br />
                  Click <strong>&quot;Auto-Send to All&quot;</strong> above. The CRM automatically sequences through each client every 3 seconds without you having to click next every time.
                </div>
              </div>
            )}

            {/* Festival Picker Pills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E9D5FF', marginBottom: 8 }}>
                Select Festival / Occasion:
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {festivals.slice(0, 10).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFestival(f);
                      setCustomFestivalName('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      border: selectedFestival?.id === f.id && !customFestivalName ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: selectedFestival?.id === f.id && !customFestivalName ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      color: selectedFestival?.id === f.id && !customFestivalName ? '#6D28D9' : '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{f.icon}</span>
                    <span>{f.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({f.diffDays === 0 ? 'Today!' : `in ${f.diffDays}d`})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Festival Name Input */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', maxWidth: 450, background: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#E9D5FF', fontWeight: 700, whiteSpace: 'nowrap' }}>Or custom festival:</span>
              <input
                type="text"
                placeholder="e.g. Navratri, Durga Puja, New Financial Year"
                value={customFestivalName}
                onChange={e => setCustomFestivalName(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Festive Message Composer & Live Greeting Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            
            {/* Left: Template Selector & Message Customizer */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '22px 24px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
                1. Choose Greeting Template
              </h3>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {FESTIVAL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedFestTemplate(tpl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: selectedFestTemplate.id === tpl.id ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                      background: selectedFestTemplate.id === tpl.id ? '#EDE9FE' : '#FFFFFF',
                      color: selectedFestTemplate.id === tpl.id ? '#6D28D9' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Message Text (supports placeholder <code style={{ color: '#7C3AED' }}>&#123;name&#125;</code>):
              </label>
              <textarea
                rows={4}
                value={festivalCustomMsg}
                onChange={e => setFestivalCustomMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Right: Live Preview Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              borderRadius: 20,
              padding: '22px 24px',
              border: '1.5px solid #FCD34D',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live WhatsApp Greeting Preview
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>
                    {selectedFestival?.icon || '🪔'}
                  </span>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '16px',
                  border: '1px solid #FDE68A',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  color: '#0F172A',
                  whiteSpace: 'pre-wrap'
                }}>
                  {festivalCustomMsg
                    .replace(/{name}/g, 'Soni Mehta')
                    .replace(/{festival}/g, customFestivalName.trim() || selectedFestival?.name || 'Diwali')
                    .replace(/{advisor}/g, advisorName)}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: '0.74rem', color: '#92400E', fontStyle: 'italic' }}>
                Note: When dispatched to each client, <code style={{ color: '#B45309' }}>&#123;name&#125;</code> will automatically resolve to their full registered name.
              </div>
            </div>

          </div>

          {/* Client Broadcast Audience Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: '#7C3AED' }} />
                  Target Audience: Converted Clients ({getFilteredFestivalClients().length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Click &apos;Send Wish&apos; on any client or launch the guided broadcast queue
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search client name or phone..."
                    value={festivalClientSearch}
                    onChange={e => setFestivalClientSearch(e.target.value)}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      paddingLeft: 30,
                      paddingRight: 10,
                      fontSize: '0.82rem',
                      width: 210
                    }}
                  />
                </div>

                <select
                  value={festivalServiceFilter}
                  onChange={e => setFestivalServiceFilter(e.target.value)}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    padding: '0 10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155'
                  }}
                >
                  <option value="All">All Services</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="FD & Bond">FD & Bond</option>
                </select>
              </div>
            </div>

            {/* Clients Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Client Name</th>
                    <th style={{ padding: '12px 16px' }}>Phone / WhatsApp</th>
                    <th style={{ padding: '12px 16px' }}>Service</th>
                    <th style={{ padding: '12px 16px' }}>Advisor / RM</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredFestivalClients().slice(0, 50).map(client => {
                    const isSent = sentWishesMap[`fest-${client._id}`];
                    return (
                      <tr key={client._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                          {client.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                          {client.whatsappNumber || client.phone || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                            {client.service}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.82rem' }}>
                          {client.assignedTo || 'Investrow Advisory'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleSendFestivalWish(client)}
                            style={{
                              background: isSent ? '#DCFCE7' : '#EDE9FE',
                              color: isSent ? '#15803D' : '#6D28D9',
                              border: isSent ? '1px solid #86EFAC' : '1px solid #DDD6FE',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Send size={13} />
                            {isSent ? 'Sent ✓ (Send Again)' : 'Send Festival Wish'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {getFilteredFestivalClients().length > 50 && (
              <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Showing first 50 clients. Use the search bar to find specific investors.
              </div>
            )}
          </div>

          {/* Guided Broadcast Modal Dialog */}
          {isBroadcastQueueOpen && (() => {
            const list = getFilteredFestivalClients();
            const currentClient = list[broadcastIndex];
            if (!currentClient) return null;

            const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
            const msgForClient = festivalCustomMsg
              .replace(/{name}/g, currentClient.name)
              .replace(/{festival}/g, festName)
              .replace(/{advisor}/g, currentClient.assignedTo || advisorName);

            return (
              <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setIsBroadcastQueueOpen(false)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, borderRadius: 24, overflow: 'hidden', padding: 0 }}>
                  <div style={{ background: 'linear-gradient(135deg, #6D28D9, #7C3AED)', padding: '20px 24px', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#DDD6FE' }}>
                        Guided WhatsApp Broadcast
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                        {broadcastIndex + 1} of {list.length}
                      </span>
                    </div>
                    <h3 style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 900 }}>
                      Send to {currentClient.name}
                    </h3>
                  </div>

                  <div style={{ padding: '24px' }}>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${((broadcastIndex + 1) / list.length) * 100}%`, height: '100%', background: '#7C3AED', transition: 'width 0.3s ease' }} />
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Recipient Phone:</div>
                      <div style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 800 }}>
                        {currentClient.whatsappNumber || currentClient.phone || 'No phone on record'}
                      </div>
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 800, marginBottom: 4 }}>Prepared Message:</div>
                      <div style={{ fontSize: '0.84rem', color: '#0F172A', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                        {msgForClient}
                      </div>
                    </div>

                    {/* Auto-Dispatch Status Indicator */}
                    {isAutoSending ? (
                      <div style={{
                        background: '#ECFDF5',
                        border: '1.5px solid #86EFAC',
                        borderRadius: 12,
                        padding: '10px 14px',
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontWeight: 800, fontSize: '0.82rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                          Auto-dispatching in progress... Next chat opening in {autoCountdown}s
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAutoSending(false)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Pause size={12} /> Pause
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: 12,
                        padding: '8px 12px',
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                          Auto-sender paused
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoCountdown(2);
                            setIsAutoSending(true);
                          }}
                          style={{
                            background: '#10B981',
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Play size={12} /> Resume Auto-Send
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleSendCurrentQueueClient}
                        style={{
                          flex: 2,
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          cursor: 'pointer'
                        }}
                      >
                        <Send size={16} /> Open WhatsApp & Next ➔
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (broadcastIndex + 1 < list.length) {
                            setBroadcastIndex(prev => prev + 1);
                            setAutoCountdown(3);
                          } else {
                            setIsAutoSending(false);
                            setIsBroadcastQueueOpen(false);
                          }
                        }}
                        style={{
                          flex: 1,
                          background: '#F1F5F9',
                          color: '#475569',
                          border: '1px solid #CBD5E1',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 💸 UPCOMING SIP DEBITS (NEXT 5 DAYS) */}
      {/* ========================================================================= */}
      {activeTab === 'sips' && (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
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
              padding: '24px 20px',
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '0.875rem'
            }}>
              No SIP debits scheduled for deduction over the next 5 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingSips.map(sip => (
                <div
                  key={sip._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      ₹
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                          {sip.name}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#FEF3C7',
                          color: '#B45309'
                        }}>
                          {sip.dueStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                        {sip.schemeName} • Debit Day {sip.sipDay}th • Phone: {sip.phone || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>
                      {sip.formattedAmount}/mo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDirectWhatsAppSip(sip)}
                      className="btn btn-sm"
                      style={{
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px'
                      }}
                    >
                      <Send size={13} /> Send WhatsApp Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ✉️ CUSTOM COMPOSER & COMMUNICATION LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>
          {/* Composer */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: 18 }}>
              Compose Direct Message
            </h3>

            {/* Template Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
                Select Standard Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                {STANDARD_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      const resolved = tpl.text.replace('{name}', recipientName || 'Valued Client');
                      setCustomMessage(resolved);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: selectedTemplate.id === tpl.id ? `2px solid ${tpl.color}` : '1px solid #E2E8F0',
                      background: selectedTemplate.id === tpl.id ? `${tpl.color}10` : '#F8FAFC',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: tpl.color, display: 'block' }}>{tpl.badge}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{tpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Soni Mehta"
                  value={recipientName}
                  onChange={e => {
                    setRecipientName(e.target.value);
                    if (selectedTemplate) {
                      setCustomMessage(selectedTemplate.text.replace('{name}', e.target.value || 'Valued Client'));
                    }
                  }}
                  className="form-input"
                  style={{ height: 40, borderRadius: 8 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  className="form-input"
                  style={{ height: 40, borderRadius: 8 }}
                />
              </div>
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Message Content
              </label>
              <textarea
                rows={5}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="form-input"
                style={{ width: '100%', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '0.85rem' }}
              />
            </div>

            {/* Launch Button */}
            <button
              type="button"
              onClick={() => {
                if (!recipientPhone.trim()) return addToast('Please enter recipient phone number', 'error');
                const clean = getCleanPhone(recipientPhone);
                const url = `https://wa.me/${finalPhone || clean}?text=${encodeURIComponent(customMessage)}`;
                window.open(url, '_blank');
                setHistory(prev => [
                  {
                    id: Date.now(),
                    name: recipientName || 'Client',
                    phone: recipientPhone,
                    action: 'WhatsApp sent',
                    detail: customMessage.slice(0, 70) + '...',
                    time: 'Just now',
                    channel: 'WhatsApp'
                  },
                  ...prev
                ]);
                addToast('Opened in WhatsApp!', 'success');
              }}
              style={{
                width: '100%',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Send size={16} /> Launch in WhatsApp Web
            </button>
          </div>

          {/* Activity Logs */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
              Recent Communication Logs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(item => (
                <div key={item.id} style={{ padding: '12px 14px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{item.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{item.phone} • {item.action}</div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 4 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
