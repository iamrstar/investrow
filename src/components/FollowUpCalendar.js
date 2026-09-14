'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  Phone, MessageSquare, CalendarClock, Filter, X, ArrowRight,
  Sparkles, CheckCircle2
} from 'lucide-react';

export default function FollowUpCalendar({
  followUps = [],
  startDate = '',
  endDate = '',
  onDateRangeChange,
  onLogFollowUp,
  loading = false,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Default to startDate or today
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [rangeSelectingStart, setRangeSelectingStart] = useState(null);

  // Month navigation helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  const isCurrentMonth = todayY === year && todayM === month;

  // Group followUps by YYYY-MM-DD
  const followUpsByDate = useMemo(() => {
    const map = {};
    followUps.forEach(lead => {
      const dateVal = lead.nextCallDate || lead.followUpDate;
      if (!dateVal) return;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(lead);
    });
    return map;
  }, [followUps]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const t = new Date();
    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    setSelectedDayDate(todayStr);
  };

  // Preset Range buttons
  const applyPreset = (presetKey) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (presetKey === 'today') {
      const s = toISO(now);
      onDateRangeChange?.(s, s);
      setSelectedDayDate(s);
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (presetKey === 'tomorrow') {
      const tm = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const s = toISO(tm);
      onDateRangeChange?.(s, s);
      setSelectedDayDate(s);
      setCurrentMonth(new Date(tm.getFullYear(), tm.getMonth(), 1));
    } else if (presetKey === 'next7days') {
      const s = toISO(now);
      const e = toISO(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
      onDateRangeChange?.(s, e);
      setSelectedDayDate(null);
    } else if (presetKey === 'next30days') {
      const s = toISO(now);
      const e = toISO(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
      onDateRangeChange?.(s, e);
      setSelectedDayDate(null);
    } else if (presetKey === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onDateRangeChange?.(toISO(start), toISO(end));
      setSelectedDayDate(null);
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (presetKey === 'nextMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      onDateRangeChange?.(toISO(start), toISO(end));
      setSelectedDayDate(null);
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    } else if (presetKey === 'all') {
      onDateRangeChange?.('', '');
      setSelectedDayDate(null);
    }
  };

  // Day Click handling: can select single day or define range by clicking two days
  const handleDayClick = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    const clickedStr = `${year}-${pad(month + 1)}-${pad(day)}`;

    if (!rangeSelectingStart) {
      // First click: sets as start date candidate or single day view
      setRangeSelectingStart(clickedStr);
      setSelectedDayDate(clickedStr);
      onDateRangeChange?.(clickedStr, clickedStr);
    } else {
      // Second click: finalize range
      let s = rangeSelectingStart;
      let e = clickedStr;
      if (new Date(s) > new Date(e)) {
        const tmp = s;
        s = e;
        e = tmp;
      }
      onDateRangeChange?.(s, e);
      setRangeSelectingStart(null);
      setSelectedDayDate(null);
    }
  };

  // Check if day is in active range
  const isDayInRange = (day) => {
    if (!startDate || !endDate) return false;
    const pad = (n) => String(n).padStart(2, '0');
    const dayStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    return dayStr >= startDate && dayStr <= endDate;
  };

  const isDaySelected = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    const dayStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    return selectedDayDate === dayStr;
  };

  // Follow-ups to display below the calendar
  const displayedFollowUps = useMemo(() => {
    if (selectedDayDate) {
      return followUpsByDate[selectedDayDate] || [];
    }
    return followUps;
  }, [selectedDayDate, followUpsByDate, followUps]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Filter & Range Selector Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {/* Row 1: Quick Range Presets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#0ea5e9' }} /> Range Presets:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'next7days', label: 'Next 7 Days' },
              { id: 'next30days', label: 'Next 30 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'nextMonth', label: 'Next Month' },
              { id: 'all', label: 'All Dates' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.color = '#0284c7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {(startDate || endDate || selectedDayDate) && (
            <button
              type="button"
              onClick={() => {
                onDateRangeChange?.('', '');
                setSelectedDayDate(null);
                setRangeSelectingStart(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <X size={13} /> Reset Range
            </button>
          )}
        </div>

        {/* Row 2: Date Inputs & Active Range Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid #f1f5f9'
        }}>
          {/* Custom Date Inputs */}
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
              <CalendarIcon size={16} style={{ color: '#0ea5e9' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>FROM</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setSelectedDayDate(null);
                    onDateRangeChange?.(e.target.value, endDate);
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
                    setSelectedDayDate(null);
                    onDateRangeChange?.(startDate, e.target.value);
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

            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              💡 Tip: Click any two dates on the calendar below to select a range
            </span>
          </div>

          {/* Active Range Summary */}
          {(startDate || endDate) && (
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#0284c7',
              background: '#e0f2fe',
              padding: '6px 14px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>
                {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Start'}
                {' → '}
                {endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'End'}
              </span>
              <span style={{ color: '#0369a1', fontWeight: 800 }}>({followUps.length} follow-up{followUps.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}>
        {/* Calendar Navigation Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(to right, #ffffff, #f8fafc)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
              {isCurrentMonth && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#0ea5e9',
                  background: '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: 12,
                  textTransform: 'uppercase'
                }}>
                  Current Month
                </span>
              )}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Select dates to filter follow-ups or inspect daily call pipeline
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px 12px', borderRadius: 8 }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px 16px', borderRadius: 8, fontWeight: 700 }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="btn btn-outline btn-sm"
              style={{ padding: '6px 12px', borderRadius: 8 }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, idx) => (
            <div
              key={dayName}
              style={{
                padding: '12px 6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: idx === 0 || idx === 6 ? '#94a3b8' : '#475569',
                letterSpacing: '0.05em'
              }}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {/* Leading blank slots */}
          {blanks.map(b => (
            <div
              key={`blank-${b}`}
              style={{
                minHeight: 110,
                background: '#fafafa',
                borderRight: '1px solid #f1f5f9',
                borderBottom: '1px solid #f1f5f9'
              }}
            />
          ))}

          {/* Actual Month Days */}
          {days.map(day => {
            const pad = (n) => String(n).padStart(2, '0');
            const dayKey = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayFollowUps = followUpsByDate[dayKey] || [];
            const isToday = isCurrentMonth && day === todayD;
            const inRange = isDayInRange(day);
            const isSelected = isDaySelected(day) || rangeSelectingStart === dayKey;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                style={{
                  minHeight: 110,
                  padding: '10px 8px',
                  borderRight: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  background: isSelected
                    ? '#bae6fd'
                    : (inRange ? '#f0f9ff' : (isToday ? '#fefce8' : '#ffffff')),
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isSelected && !inRange) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={e => {
                  if (!isSelected && !inRange) {
                    e.currentTarget.style.background = isToday ? '#fefce8' : '#ffffff';
                  }
                }}
              >
                {/* Day Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: isToday || isSelected ? 800 : 600,
                    background: isToday ? '#0ea5e9' : (isSelected ? '#0369a1' : 'transparent'),
                    color: isToday || isSelected ? '#ffffff' : '#1e293b'
                  }}>
                    {day}
                  </span>

                  {dayFollowUps.length > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#0284c7',
                      background: '#e0f2fe',
                      padding: '2px 6px',
                      borderRadius: 10
                    }}>
                      {dayFollowUps.length} call{dayFollowUps.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Follow-up previews on this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayFollowUps.slice(0, 2).map(item => (
                    <div
                      key={item._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogFollowUp?.(item);
                      }}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 6,
                        background: '#ffffff',
                        border: '1px solid #e0f2fe',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${item.name} (${item.service || 'Mutual Funds'}) - Click to log follow-up`}
                    >
                      📞 {item.name}
                    </div>
                  ))}

                  {dayFollowUps.length > 2 && (
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, paddingLeft: 4 }}>
                      +{dayFollowUps.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Range or Day Follow-ups Schedule List */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={18} style={{ color: '#0ea5e9' }} />
              {selectedDayDate ? (
                <span>
                  Follow-ups for {new Date(selectedDayDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              ) : (startDate || endDate) ? (
                <span>
                  Follow-ups in Selected Range ({displayedFollowUps.length})
                </span>
              ) : (
                <span>
                  All Scheduled Follow-ups ({displayedFollowUps.length})
                </span>
              )}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {selectedDayDate
                ? `Showing ${displayedFollowUps.length} follow-up(s) due on this day`
                : (startDate || endDate)
                ? `Showing ${displayedFollowUps.length} follow-up(s) scheduled between selected dates`
                : 'Click any day or select a date range to filter'}
            </p>
          </div>

          {selectedDayDate && (
            <button
              type="button"
              onClick={() => setSelectedDayDate(null)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Show Full Range List
            </button>
          )}
        </div>

        {displayedFollowUps.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
            <CalendarIcon size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>
              No follow-ups scheduled for this selection
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Choose a different date range or click on days with call badges above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {displayedFollowUps.map(lead => {
              const targetDate = lead.nextCallDate || lead.followUpDate;
              const dateObj = targetDate ? new Date(targetDate) : null;
              const formattedDate = dateObj
                ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Not Set';
              const dayOfWeek = dateObj
                ? dateObj.toLocaleDateString('en-IN', { weekday: 'short' })
                : '';

              return (
                <div
                  key={lead._id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#0ea5e9';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    {/* Date and Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#0284c7',
                        background: '#e0f2fe',
                        padding: '3px 10px',
                        borderRadius: 8
                      }}>
                        <CalendarIcon size={14} />
                        <span>{formattedDate} ({dayOfWeek})</span>
                      </div>

                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 8,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        {lead.service || 'Mutual Funds'}
                      </span>
                    </div>

                    {/* Client Name & Phone */}
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginBottom: 2 }}>
                      {lead.name || 'Unnamed Client'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{lead.phone || 'No phone'}</span>
                      {lead.city && <span>• {lead.city}</span>}
                    </div>

                    {/* Remarks note */}
                    {lead.remarks && (
                      <div style={{
                        marginTop: 10,
                        padding: '6px 10px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        color: '#334155'
                      }}>
                        💬 {lead.remarks}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 8,
                          background: '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          border: '1px solid #bbf7d0'
                        }}
                      >
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                    )}

                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 8,
                          background: '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          border: '1px solid #bbf7d0'
                        }}
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => onLogFollowUp?.(lead)}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        background: '#0ea5e9',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <CalendarClock size={13} />
                      <span>Log</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
