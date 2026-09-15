'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import FollowUpCalendar from '@/components/FollowUpCalendar';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import { Calendar, RefreshCw, Search } from 'lucide-react';

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

export default function CalendarPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [service, setService] = useState('');

  // Active lead for follow-up modal
  const [activeFollowUpLead, setActiveFollowUpLead] = useState(null);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 200, // Fetch up to 200 for rich calendar plotting
      });

      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (!startDate && !endDate) params.set('preset', 'all');

      if (service) params.set('service', service);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/followups?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setFollowUps(data.followUps || []);
      } else {
        addToast(data.error || 'Failed to load follow-ups', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, service, search, addToast]);

  useEffect(() => {
    fetchFollowUps();
  }, [startDate, endDate, service, search, fetchFollowUps]);

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
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
        fetchFollowUps();
      } else {
        addToast(data.error || 'Failed to update follow-up', 'error');
      }
    } catch (e) {
      addToast('Network error while saving follow-up', 'error');
    }
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={26} style={{ color: '#0ea5e9' }} />
            Follow-up Calendar & Range Planner
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Check follow-ups across custom date ranges, monthly call pipelines, and client meetings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 200 }}>
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

          {/* Service filter */}
          <select
            className="form-select"
            style={{ height: 38, borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, width: 160 }}
            value={service}
            onChange={e => setService(e.target.value)}
          >
            <option value="">All Products</option>
            {SERVICES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => fetchFollowUps()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, borderRadius: 10 }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Calendar View */}
      <FollowUpCalendar
        followUps={followUps}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onLogFollowUp={(lead) => setActiveFollowUpLead(lead)}
        loading={loading}
      />

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
