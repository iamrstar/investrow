'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import {
  CalendarClock, Calendar, Clock, AlertTriangle, CheckCircle2,
  Filter, Search, Phone, MessageSquare, Mail, RefreshCw,
  ChevronRight, ChevronLeft, ArrowRight, UserCheck, Briefcase,
  X, ExternalLink, ShieldAlert, Sparkles, User
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

  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    overdue: 0,
    today: 0,
    sevenDays: 0,
    oneMonth: 0,
    twoMonths: 0,
    threeMonths: 0,
    sixMonths: 0,
  });

  // Filters
  const [preset, setPreset] = useState('7days'); // 'today', '7days', '1month', '2months', '3months', '6months', 'overdue', 'all'
  const [service, setService] = useState('');
  const [scope, setScope] = useState('all'); // 'all', 'clients', 'leads'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Modals
  const [activeFollowUpLead, setActiveFollowUpLead] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  const fetchFollowUps = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: 20,
      });

      if (preset && !startDate && !endDate) {
        params.set('preset', preset);
      }
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (service) params.set('service', service);
      if (scope) params.set('scope', scope);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/followups?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setFollowUps(data.followUps || []);
        setMetrics(data.metrics || {
          total: 0,
          overdue: 0,
          today: 0,
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
  }, [page, preset, service, scope, startDate, endDate, search, addToast]);

  useEffect(() => {
    fetchFollowUps(1);
  }, [preset, service, scope, startDate, endDate, search, fetchFollowUps]);

  const handlePresetSelect = (selectedPreset) => {
    setStartDate('');
    setEndDate('');
    setPreset(selectedPreset);
    setPage(1);
  };

  const handleApplyDateRange = () => {
    if (startDate || endDate) {
      setPreset('');
      setPage(1);
    }
  };

  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setPreset('7days');
    setPage(1);
  };

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

  const formatFollowUpBadge = (dateStr) => {
    if (!dateStr) return { text: 'No Date Set', color: '#94a3b8', bg: '#f1f5f9' };

    const target = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    const diffTime = targetDay.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`,
        color: '#ef4444',
        bg: '#fee2e2',
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return { text: 'Due Today', color: '#d97706', bg: '#fef3c7', isToday: true };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: '#0284c7', bg: '#e0f2fe' };
    } else if (diffDays <= 7) {
      return { text: `In ${diffDays} days`, color: '#059669', bg: '#d1fae5' };
    } else if (diffDays <= 30) {
      const weeks = Math.round(diffDays / 7);
      return { text: `In ~${weeks} ${weeks === 1 ? 'week' : 'weeks'}`, color: '#6366f1', bg: '#e0e7ff' };
    } else {
      const months = Math.round(diffDays / 30);
      return { text: `In ~${months} ${months === 1 ? 'month' : 'months'}`, color: '#8b5cf6', bg: '#ede9fe' };
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '24px 32px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0ea5e9, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
            }}>
              <CalendarClock size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Follow-up Management
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                Track, filter by product, and schedule next follow-up dates with clients
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchFollowUps(page)}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10 }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Overdue Card */}
        <div
          onClick={() => handlePresetSelect('overdue')}
          style={{
            background: preset === 'overdue' ? '#fee2e2' : 'white',
            border: preset === 'overdue' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === 'overdue' ? '0 8px 20px rgba(239, 68, 68, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overdue
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#991b1b' }}>
            {metrics.overdue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: 4 }}>Needs immediate action</div>
        </div>

        {/* Due Today Card */}
        <div
          onClick={() => handlePresetSelect('today')}
          style={{
            background: preset === 'today' ? '#fef3c7' : 'white',
            border: preset === 'today' ? '2px solid #d97706' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === 'today' ? '0 8px 20px rgba(217, 119, 6, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Due Today
            </span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#92400e' }}>
            {metrics.today}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 4 }}>Scheduled for today</div>
        </div>

        {/* Next 7 Days Card */}
        <div
          onClick={() => handlePresetSelect('7days')}
          style={{
            background: preset === '7days' ? '#e0f2fe' : 'white',
            border: preset === '7days' ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === '7days' ? '0 8px 20px rgba(14, 165, 233, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Next 7 Days
            </span>
            <CalendarClock size={18} color="#0ea5e9" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0369a1' }}>
            {metrics.sevenDays}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: 4 }}>Upcoming this week</div>
        </div>

        {/* 1 Month Card */}
        <div
          onClick={() => handlePresetSelect('1month')}
          style={{
            background: preset === '1month' ? '#e0e7ff' : 'white',
            border: preset === '1month' ? '2px solid #6366f1' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === '1month' ? '0 8px 20px rgba(99, 102, 241, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1 Month
            </span>
            <Calendar size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4338ca' }}>
            {metrics.oneMonth}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4f46e5', marginTop: 4 }}>Within next 30 days</div>
        </div>

        {/* 2 - 3 Months Card */}
        <div
          onClick={() => handlePresetSelect('3months')}
          style={{
            background: preset === '3months' ? '#ede9fe' : 'white',
            border: preset === '3months' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === '3months' ? '0 8px 20px rgba(139, 92, 246, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3 Months
            </span>
            <Calendar size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#5b21b6' }}>
            {metrics.threeMonths}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6d28d9', marginTop: 4 }}>Quarterly follow-ups</div>
        </div>

        {/* 6 Months Card */}
        <div
          onClick={() => handlePresetSelect('6months')}
          style={{
            background: preset === '6months' ? '#d1fae5' : 'white',
            border: preset === '6months' ? '2px solid #10b981' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: preset === '6months' ? '0 8px 20px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              6 Months
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#065f46' }}>
            {metrics.sixMonths}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4 }}>Semi-annual pipeline</div>
        </div>
      </div>

      {/* Main Filter Control Panel */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '24px',
        marginBottom: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        {/* Row 1: Search, Product/Service, Scope */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Search */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>Search Client / Contact</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 42, height: 44, borderRadius: 10 }}
                placeholder="Search name, phone, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Product / Service Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>Filter by Product / Service</label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-select"
                style={{ height: 44, borderRadius: 10, fontWeight: 600 }}
                value={service}
                onChange={e => { setService(e.target.value); setPage(1); }}
              >
                <option value="">All Products / Services</option>
                {SERVICES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Scope */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>Contact Scope</label>
            <select
              className="form-select"
              style={{ height: 44, borderRadius: 10, fontWeight: 600 }}
              value={scope}
              onChange={e => { setScope(e.target.value); setPage(1); }}
            >
              <option value="all">All Contacts (Clients & Leads)</option>
              <option value="clients">Converted Clients Only</option>
              <option value="leads">Active Leads Only</option>
            </select>
          </div>
        </div>

        {/* Row 2: Quick Preset Pills */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8, display: 'block' }}>
            Quick Follow-up Presets
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: '7days', label: 'Next 7 Days' },
              { id: '1month', label: '1 Month' },
              { id: '2months', label: '2 Months' },
              { id: '3months', label: '3 Months' },
              { id: '6months', label: '6 Months' },
              { id: 'today', label: 'Today' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'all', label: 'All Scheduled' },
            ].map(p => {
              const isSelected = preset === p.id && !startDate && !endDate;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                    background: isSelected ? '#0ea5e9' : '#f8fafc',
                    color: isSelected ? 'white' : '#475569',
                    boxShadow: isSelected ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Custom Date Range Filter */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
            <Calendar size={16} color="#0ea5e9" />
            <span>Custom Date Range:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>From:</span>
              <input
                type="date"
                className="form-input"
                style={{ height: 38, width: 160, borderRadius: 8, fontSize: '0.85rem' }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>To:</span>
              <input
                type="date"
                className="form-input"
                style={{ height: 38, width: 160, borderRadius: 8, fontSize: '0.85rem' }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApplyDateRange}
              style={{ height: 38, padding: '0 16px', borderRadius: 8 }}
            >
              Apply Range
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearDateRange}
                style={{ height: 38, padding: '0 12px', color: '#ef4444' }}
              >
                Clear Range
              </button>
            )}
          </div>

          {(startDate || endDate) && (
            <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 600 }}>
              Filtering from {startDate || 'start'} to {endDate || 'end'}
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups List Table */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa'
        }}>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Follow-up Schedule</span>
            <span style={{
              background: '#0ea5e9',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12
            }}>
              {pagination.total} Clients Found
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing Page {pagination.page} of {pagination.pages}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px', color: '#0ea5e9' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading follow-up records...</p>
          </div>
        ) : followUps.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#94a3b8'
            }}>
              <CalendarClock size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#1e293b', fontWeight: 700 }}>No Follow-ups Found</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              No clients matched your current date range or product filter. Try selecting a broader date preset or clearing filters.
            </p>
            <button
              onClick={handleClearDateRange}
              className="btn btn-outline btn-sm"
              style={{ marginTop: 16, borderRadius: 8 }}
            >
              Reset to Next 7 Days
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>CLIENT NAME & CONTACT</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>PRODUCT / SERVICE</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>NEXT FOLLOW-UP DATE</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>LAST REMARK</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map(lead => {
                  const badge = formatFollowUpBadge(lead.followUpDate);
                  const followUpFormatted = lead.followUpDate
                    ? new Date(lead.followUpDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Not scheduled';

                  return (
                    <tr
                      key={lead._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Client info */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: lead.response === 'Converted' ? '#dcfce7' : '#e0f2fe',
                            color: lead.response === 'Converted' ? '#15803d' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {lead.name ? lead.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                              {lead.name || 'Unnamed Client'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                              {lead.phone && <span>{lead.phone}</span>}
                              {lead.email && <span>• {lead.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product / Service */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Briefcase size={12} color="#0ea5e9" />
                          {lead.service || 'General Inquiry'}
                        </span>
                        {lead.response === 'Converted' && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                              ✓ Converted Client
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Follow-up Date */}
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                            {followUpFormatted}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: badge.color,
                              background: badge.bg,
                            }}>
                              {badge.text}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Call Status & Response */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: lead.callStatus === 'Received' ? '#16a34a' : lead.callStatus === 'Not Received' ? '#dc2626' : '#d97706',
                          }}>
                            ● {lead.callStatus || 'Pending'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {lead.response || 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td style={{ padding: '16px 20px', maxWidth: 220 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.825rem',
                          color: '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={lead.remarks}>
                          {lead.remarks || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No remarks yet</span>}
                        </p>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {/* Log Follow-up Button */}
                          <button
                            onClick={() => setActiveFollowUpLead(lead)}
                            className="btn btn-primary btn-sm"
                            style={{
                              borderRadius: 8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.8rem',
                              padding: '6px 12px'
                            }}
                          >
                            <CalendarClock size={14} />
                            <span>Log Follow-up</span>
                          </button>

                          {/* Quick Call */}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 10px', borderRadius: 8, color: '#16a34a' }}
                              title="Call Client"
                            >
                              <Phone size={14} />
                            </a>
                          )}

                          {/* Quick WhatsApp */}
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 10px', borderRadius: 8, color: '#25d366' }}
                              title="Open WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => setDetailClient(lead)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 8px', borderRadius: 8, color: '#64748b' }}
                            title="View Details"
                          >
                            <ChevronRight size={16} />
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

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa'
          }}>
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchFollowUps(prev);
              }}
              disabled={page <= 1}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => {
                const next = Math.min(pagination.pages, page + 1);
                setPage(next);
                fetchFollowUps(next);
              }}
              disabled={page >= pagination.pages}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Log Follow-up Modal */}
      {activeFollowUpLead && (
        <LogFollowUpModal
          lead={activeFollowUpLead}
          onClose={() => setActiveFollowUpLead(null)}
          onSave={handleSaveFollowUp}
        />
      )}

      {/* Client Detail Drawer / Modal */}
      {detailClient && (
        <div className="modal-backdrop" onClick={() => setDetailClient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, borderRadius: 24 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#0ea5e9',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  {detailClient.name ? detailClient.name.charAt(0) : 'C'}
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>{detailClient.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{detailClient.service || 'Client Details'}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailClient(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Phone Number</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {detailClient.phone || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Email Address</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {detailClient.email || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Next Follow-up Date</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0ea5e9', marginTop: 2 }}>
                    {detailClient.followUpDate ? new Date(detailClient.followUpDate).toLocaleDateString('en-IN') : 'None'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Call Status / Response</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {detailClient.callStatus || 'Pending'} ({detailClient.response || 'Pending'})
                  </div>
                </div>
              </div>

              {detailClient.address && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Address</div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', marginTop: 2 }}>
                    {detailClient.address}, {detailClient.city} {detailClient.pincode}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Latest Follow-up Remarks</div>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 14,
                  fontSize: '0.9rem',
                  color: '#334155',
                  marginTop: 6,
                  lineHeight: 1.6
                }}>
                  {detailClient.remarks || 'No remarks recorded yet.'}
                </div>
              </div>

              {detailClient.assignedTo && (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Assigned To: <strong>{detailClient.assignedTo?.name || 'Staff Member'}</strong>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDetailClient(null)}
                style={{ flex: 1, borderRadius: 10 }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = detailClient;
                  setDetailClient(null);
                  setActiveFollowUpLead(target);
                }}
                style={{ flex: 1, borderRadius: 10 }}
              >
                <CalendarClock size={16} /> Log Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
