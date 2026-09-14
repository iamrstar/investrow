'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import FollowUpCalendar from '@/components/FollowUpCalendar';
import {
  CalendarClock, Calendar, Clock, AlertTriangle, CheckCircle2,
  Filter, Search, Phone, MessageSquare, Mail, RefreshCw,
  ChevronRight, ChevronLeft, ArrowRight, UserCheck, Briefcase,
  X, ExternalLink, Plus, Save, LayoutList
} from 'lucide-react';

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

export default function FollowUpsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    overdue: 0,
    today: 0,
    tomorrow: 0,
    upcoming: 0,
    sevenDays: 0,
    oneMonth: 0,
    twoMonths: 0,
    threeMonths: 0,
    sixMonths: 0,
  });

  // Filter Tab: 'today', 'overdue', 'tomorrow', 'upcoming', 'range', 'all'
  const [activeTab, setActiveTab] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Modal / Drawer
  const [activeFollowUpLead, setActiveFollowUpLead] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  // Inline "Add Follow-up" Form State (Panel 6)
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [inlineDateTime, setInlineDateTime] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [inlineMode, setInlineMode] = useState('Call');
  const [inlineNextDate, setInlineNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [inlineRemarks, setInlineRemarks] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);

  const fetchFollowUps = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: viewMode === 'calendar' ? 200 : 20,
      });

      // Map tab to preset or range
      if (activeTab === 'range') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (!startDate && !endDate) params.set('preset', 'all');
      } else if (activeTab === 'today') params.set('preset', 'today');
      else if (activeTab === 'overdue') params.set('preset', 'overdue');
      else if (activeTab === 'tomorrow') params.set('preset', 'tomorrow');
      else if (activeTab === 'upcoming') params.set('preset', 'upcoming');
      else if (activeTab === 'all') params.set('preset', 'all');

      if (service) params.set('service', service);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/followups?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setFollowUps(data.followUps || []);
        setMetrics(data.metrics || {
          total: 0,
          overdue: 0,
          today: 0,
          tomorrow: 0,
          upcoming: 0,
          sevenDays: 0,
          oneMonth: 0,
          twoMonths: 0,
          threeMonths: 0,
          sixMonths: 0,
        });
        setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
      } else {
        addToast(data.error || 'Failed to load follow-ups', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, service, search, startDate, endDate, viewMode, addToast]);

  useEffect(() => {
    fetchFollowUps(1);
  }, [activeTab, service, search, startDate, endDate, viewMode, fetchFollowUps]);

  // Check ?view=calendar in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'calendar') setViewMode('calendar');
    }
  }, []);

  const [allLeads, setAllLeads] = useState([]);

  // Fetch full leads list for the inline follow-up creator
  useEffect(() => {
    async function loadAllLeads() {
      try {
        const res = await fetch('/api/leads?limit=300');
        const data = await res.json();
        if (res.ok && data.leads) {
          setAllLeads(data.leads);
          if (!selectedLeadId && data.leads.length > 0) {
            setSelectedLeadId(data.leads[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching leads list', err);
      }
    }
    loadAllLeads();
  }, []);

  // Set default selected lead when list changes
  useEffect(() => {
    if (!selectedLeadId) {
      if (allLeads.length > 0) {
        setSelectedLeadId(allLeads[0]._id);
      } else if (followUps.length > 0) {
        setSelectedLeadId(followUps[0]._id);
      }
    }
  }, [followUps, allLeads, selectedLeadId]);

  const handleSaveFollowUp = async (formData) => {
    try {
      const res = await fetch(`/api/leads/${formData._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callStatus: formData.callStatus,
          response: formData.response,
          interestedInService: formData.interestedInService,
          serviceTaken: formData.serviceTaken,
          nextCallDate: formData.nextCallDate,
          followUpDate: formData.followUpDate,
          remarks: formData.remarks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('Follow-up updated successfully!', 'success');
        setActiveFollowUpLead(null);
        fetchFollowUps(page);
      } else {
        addToast(data.error || 'Failed to update follow-up', 'error');
      }
    } catch (e) {
      addToast('Network error while saving follow-up', 'error');
    }
  };

  // Submit Inline Follow-up form (Panel 6)
  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) {
      addToast('Please select a client or lead', 'error');
      return;
    }
    setInlineSaving(true);
    try {
      const res = await fetch(`/api/leads/${selectedLeadId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callStatus: 'Received',
          response: 'Interested',
          followUpDate: inlineNextDate,
          nextCallDate: inlineNextDate,
          remarks: `[${inlineMode}] ${inlineRemarks || 'Follow-up scheduled'}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Follow-up added successfully!', 'success');
        setInlineRemarks('');
        fetchFollowUps(page);
      } else {
        addToast(data.error || 'Failed to add follow-up', 'error');
      }
    } catch (err) {
      addToast('Error saving follow-up', 'error');
    } finally {
      setInlineSaving(false);
    }
  };

  const formatBadgeStatus = (dateStr) => {
    if (!dateStr) return { label: 'Scheduled', color: '#0ea5e9', bg: '#e0f2fe' };
    const target = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)}d Overdue`, color: '#ea580c', bg: '#ffedd5' };
    } else if (diffDays === 0) {
      return { label: 'Due Today', color: '#d97706', bg: '#fef3c7' };
    } else if (diffDays === 1) {
      return { label: 'Tomorrow', color: '#0284c7', bg: '#e0f2fe' };
    } else {
      return { label: `In ${diffDays} days`, color: '#0ea5e9', bg: '#e0f2fe' };
    }
  };

  const formatFollowUpDate = (dateStr) => {
    if (!dateStr) return { date: 'Not Set', subtext: 'No date assigned', isOverdue: false, isToday: false };
    const target = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const dateFormatted = target.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const dayName = target.toLocaleDateString('en-IN', { weekday: 'short' });

    let relative = '';
    if (diffDays < 0) {
      relative = `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays === 0) {
      relative = 'Today';
    } else if (diffDays === 1) {
      relative = 'Tomorrow';
    } else {
      relative = `In ${diffDays} days`;
    }

    return {
      date: dateFormatted,
      subtext: `${dayName} • ${relative}`,
      relative,
      diffDays,
      isOverdue: diffDays < 0,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
    };
  };

  const applyPresetRange = (presetKey) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (presetKey === 'next7days') {
      setStartDate(toISO(now));
      setEndDate(toISO(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)));
    } else if (presetKey === 'next30days') {
      setStartDate(toISO(now));
      setEndDate(toISO(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)));
    } else if (presetKey === 'thisMonth') {
      setStartDate(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    } else if (presetKey === 'nextMonth') {
      setStartDate(toISO(new Date(now.getFullYear(), now.getMonth() + 1, 1)));
      setEndDate(toISO(new Date(now.getFullYear(), now.getMonth() + 2, 0)));
    } else if (presetKey === 'clear') {
      setStartDate('');
      setEndDate('');
      setActiveTab('all');
      return;
    }
    setActiveTab('range');
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarClock size={26} style={{ color: '#0ea5e9' }} />
            Follow-up Management & Calendar
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Panel 6 • Daily follow-up pipeline, custom date range filtering, and interactive calendar
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 10,
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? '#0ea5e9' : '#64748b',
                boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutList size={15} />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'calendar' ? '#ffffff' : 'transparent',
                color: viewMode === 'calendar' ? '#0ea5e9' : '#64748b',
                boxShadow: viewMode === 'calendar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={15} />
              <span>Calendar View</span>
            </button>
          </div>

          <button
            onClick={() => fetchFollowUps(page)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, borderRadius: 10 }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Panel 6 Filter Pills & Search */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'today', label: `Today (${metrics.today || 0})` },
              { id: 'overdue', label: `Overdue (${metrics.overdue || 0})` },
              { id: 'tomorrow', label: `Tomorrow (${metrics.tomorrow || 0})` },
              { id: 'upcoming', label: `Upcoming (${metrics.upcoming || 0})` },
              { id: 'range', label: `📅 Date Range${(startDate || endDate) ? ` (${followUps.length})` : ''}` },
              { id: 'all', label: `All (${metrics.total || 0})` },
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                    if (tab.id !== 'range' && (startDate || endDate)) {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                    background: isSelected ? '#0ea5e9' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    boxShadow: isSelected ? '0 4px 10px rgba(14, 165, 233, 0.25)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Product Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 34, height: 38, borderRadius: 10, fontSize: '0.85rem' }}
                placeholder="Search client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, width: 160 }}
              value={service}
              onChange={e => { setService(e.target.value); setPage(1); }}
            >
              <option value="">All Products</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Date Range Sub-Bar (shown when activeTab === 'range' or range is set) */}
        {(activeTab === 'range' || startDate || endDate) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 10,
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '4px 12px'
              }}>
                <Calendar size={15} style={{ color: '#0ea5e9' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>FROM</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setActiveTab('range');
                      setPage(1);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TO</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setActiveTab('range');
                      setPage(1);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Range Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[
                  { id: 'next7days', label: 'Next 7D' },
                  { id: 'next30days', label: 'Next 30D' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'nextMonth', label: 'Next Month' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPresetRange(p.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => applyPresetRange('clear')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <X size={12} /> Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {viewMode === 'calendar' ? (
        <FollowUpCalendar
          followUps={followUps}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            if (s || e) setActiveTab('range');
            else setActiveTab('all');
          }}
          onLogFollowUp={(lead) => setActiveFollowUpLead(lead)}
          loading={loading}
        />
      ) : (
        /* Main Grid: Left is Follow-up Table (Panel 6), Right or Bottom is Inline Add Follow-up */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
        {/* Table Card (Panel 6) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa'
          }}>
            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
              Follow-ups Schedule
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing {followUps.length} entries
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 10px', color: '#0ea5e9' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>Loading schedule...</p>
            </div>
          ) : followUps.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: '#f0f9ff',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <CalendarClock size={24} />
              </div>
              <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: 700 }}>No Follow-ups in this Tab</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                All clear! No calls or tasks due under current filter.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Next Follow-up Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Client / Lead</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Product</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Remarks</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((lead, idx) => {
                    const targetDate = lead.nextCallDate || lead.followUpDate;
                    const dateInfo = formatFollowUpDate(targetDate);
                    const badge = formatBadgeStatus(targetDate);

                    return (
                      <tr
                        key={lead._id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Next Follow-up Date & Time */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: dateInfo.isOverdue ? '#fee2e2' : (dateInfo.isToday ? '#fef3c7' : '#e0f2fe'),
                              color: dateInfo.isOverdue ? '#dc2626' : (dateInfo.isToday ? '#b45309' : '#0284c7'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Calendar size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
                                {dateInfo.date}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{dateInfo.subtext}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Name & Phone */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#f0f9ff',
                              color: '#0ea5e9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem'
                            }}>
                              {lead.name ? lead.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                {lead.name || 'Unnamed Client'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {lead.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Product */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0'
                          }}>
                            {lead.service || 'Mutual Funds'}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td style={{ padding: '14px 18px', maxWidth: 220 }}>
                          {lead.remarks ? (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#334155',
                              background: '#f8fafc',
                              padding: '5px 9px',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={lead.remarks}>
                              💬 {lead.remarks}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: badge.color,
                            background: badge.bg,
                          }}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Action buttons matching Panel 6 (Call & WhatsApp) */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            {/* Call button */}
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: '#dcfce7',
                                  color: '#16a34a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  border: '1px solid #bbf7d0'
                                }}
                                title="Call Client"
                              >
                                <Phone size={15} />
                              </a>
                            ) : null}

                            {/* WhatsApp button */}
                            {lead.phone ? (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: '#dcfce7',
                                  color: '#16a34a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  border: '1px solid #bbf7d0'
                                }}
                                title="WhatsApp Client"
                              >
                                <MessageSquare size={15} />
                              </a>
                            ) : null}

                            {/* Log Follow-up Button */}
                            <button
                              type="button"
                              onClick={() => setActiveFollowUpLead(lead)}
                              style={{
                                height: 34,
                                padding: '0 12px',
                                borderRadius: 8,
                                background: '#0ea5e9',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <CalendarClock size={14} />
                              <span>Log</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 6: Add Follow-up Form Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#0ea5e9',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Add Follow-up
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
              Inline scheduler (Panel 6)
            </span>
          </div>

          <form onSubmit={handleInlineSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Select Lead / Client */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  Client / Lead *
                </label>
                <select
                  className="form-select"
                  style={{ height: 42, borderRadius: 10, fontSize: '0.85rem', fontWeight: 600 }}
                  value={selectedLeadId}
                  onChange={e => setSelectedLeadId(e.target.value)}
                  required
                >
                  <option value="">Select a Client</option>
                  {(allLeads.length > 0 ? allLeads : followUps).map(l => (
                    <option key={l._id} value={l._id}>{l.name} ({l.phone || l.service || 'Lead'})</option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  style={{ height: 42, borderRadius: 10, fontSize: '0.85rem' }}
                  value={inlineDateTime}
                  onChange={e => setInlineDateTime(e.target.value)}
                />
              </div>

              {/* Mode */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  Mode
                </label>
                <select
                  className="form-select"
                  style={{ height: 42, borderRadius: 10, fontSize: '0.85rem', fontWeight: 600 }}
                  value={inlineMode}
                  onChange={e => setInlineMode(e.target.value)}
                >
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              {/* Next Follow-up */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ height: 42, borderRadius: 10, fontSize: '0.85rem' }}
                  value={inlineNextDate}
                  onChange={e => setInlineNextDate(e.target.value)}
                />
              </div>
            </div>

            {/* Remarks and Save Button */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  Remarks
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: 42, borderRadius: 10, fontSize: '0.85rem' }}
                  placeholder="e.g. Client asked for scheme details. Call back tomorrow."
                  value={inlineRemarks}
                  onChange={e => setInlineRemarks(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={inlineSaving}
                className="btn btn-primary"
                style={{
                  height: 42,
                  padding: '0 24px',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0ea5e9',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                }}
              >
                <Save size={16} />
                <span>{inlineSaving ? 'Saving...' : 'Save Follow-up'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Log Follow-up Modal */}
      {activeFollowUpLead && (
        <LogFollowUpModal
          lead={activeFollowUpLead}
          onClose={() => setActiveFollowUpLead(null)}
          onSave={handleSaveFollowUp}
        />
      )}
    </div>
  );
}

