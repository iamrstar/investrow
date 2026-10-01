'use client';

import { useState } from 'react';
import { 
  Phone, MessageSquare, Users, Video, Mail, Calendar, 
  CheckCircle, Clock, Plus, UserPlus, AlertCircle, 
  IndianRupee, ChevronDown, ChevronUp, UserCheck, ShieldCheck, Tag
} from 'lucide-react';

export default function FollowUpHistoryTab({
  lead,
  followups = [],
  activities = [],
  onLogFollowUp,
  onAssign,
  canAssign = false
}) {
  const [filterMedium, setFilterMedium] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'calls', 'assignments'

  // Combine followups and relevant activities (assignments, milestones)
  const timelineItems = [
    // 1. FollowUp records
    ...followups.map(f => ({
      id: `f-${f._id}`,
      type: 'followup',
      itemType: f.callStatus === 'Assigned' ? 'assignment' : 'call',
      date: f.interactionDate || f.createdAt,
      medium: f.medium || 'Phone Call',
      callStatus: f.callStatus || 'Received',
      response: f.response || 'Follow-up',
      remarks: f.remarks || 'No remarks provided',
      user: f.userId?.name || 'Staff',
      userRole: f.userId?.role || 'user',
      nextCallDate: f.nextCallDate || f.followUpDate,
      sipAmount: f.sipAmount,
      schemeName: f.schemeName,
      service: f.service,
      raw: f
    })),

    // 2. Assignment, Task & Onboarding activities from ActivityLog
    ...activities
      .filter(a => {
        const isAssignment = a.details?.type === 'assignment' || (a.action && a.action.toLowerCase().includes('assigned'));
        const isCreated = a.action && a.action.toLowerCase().includes('created');
        const isTask = a.action && a.action.toLowerCase().includes('task');
        return isAssignment || isCreated || isTask;
      })
      .map(a => {
        const isAssignment = a.details?.type === 'assignment' || (a.action && a.action.toLowerCase().includes('assigned'));
        const isTask = a.action && a.action.toLowerCase().includes('task');
        return {
          id: `a-${a._id}`,
          type: 'activity',
          itemType: isAssignment ? 'assignment' : (isTask ? 'assignment' : 'milestone'),
          date: a.createdAt,
          title: a.action,
          assignedBy: a.details?.assignedBy || a.userId?.name || 'Admin',
          assignedTo: a.details?.assignedTo || a.details?.assignedToName || 'Staff',
          previousAssignee: a.details?.previousAssignee,
          notes: a.details?.remarks || a.details?.notes || (a.details?.screenshot ? '• Proof Screenshot Attached' : ''),
          user: a.userId?.name || 'System',
          raw: a
        };
      })
  ];

  // Deduplicate and sort chronologically descending
  const sortedItems = timelineItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply filters
  const filteredItems = sortedItems.filter(item => {
    if (filterType === 'calls' && item.itemType !== 'call') return false;
    if (filterType === 'assignments' && item.itemType !== 'assignment') return false;
    if (filterMedium && item.medium !== filterMedium) return false;
    return true;
  });

  const getMediumIcon = (medium) => {
    switch (medium) {
      case 'WhatsApp': return <MessageSquare size={16} />;
      case 'In-Person Meeting': return <Users size={16} />;
      case 'Office Visit': return <UserCheck size={16} />;
      case 'Email': return <Mail size={16} />;
      default: return <Phone size={16} />;
    }
  };

  const getMediumBadgeColor = (medium) => {
    switch (medium) {
      case 'WhatsApp': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'In-Person Meeting': return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      case 'Office Visit': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'Email': return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
      default: return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    }
  };

  const getResponseColor = (resp) => {
    switch (resp) {
      case 'Converted': return { bg: '#DCFCE7', text: '#15803D' };
      case 'Interested':
      case 'Positive': return { bg: '#E0F2FE', text: '#0284C7' };
      case 'Meeting': return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'Assigned': return { bg: '#EEF2FF', text: '#4F46E5' };
      case 'Lost':
      case 'Negative': return { bg: '#FEE2E2', text: '#B91C1C' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      {/* Top Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        border: '1.5px solid #BAE6FD',
        borderRadius: 18,
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', fontWeight: 700 }}>
              Total Follow-ups
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
              {followups.length} Logged
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#CBD5E1' }} />

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', fontWeight: 700 }}>
              Assigned RM / Executive
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{lead?.assignedTo?.name || 'Unassigned'}</span>
              {canAssign && onAssign && (
                <button
                  type="button"
                  onClick={onAssign}
                  style={{
                    border: 'none',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Reassign
                </button>
              )}
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#CBD5E1' }} />

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', fontWeight: 700 }}>
              Next Follow-up Date
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: lead?.nextCallDate || lead?.followUpDate ? '#D97706' : '#64748B', marginTop: 2 }}>
              {lead?.nextCallDate || lead?.followUpDate 
                ? new Date(lead.nextCallDate || lead.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'None Scheduled'}
            </div>
          </div>
        </div>

        {/* Action Button: Log Follow-up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onLogFollowUp}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Phone size={16} />
            + Log Follow-up / Interaction
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All History' },
            { id: 'calls', label: 'Interactions & Calls' },
            { id: 'assignments', label: 'Assignments & Handoffs' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                border: filterType === f.id ? '1px solid #0284C7' : '1px solid #E2E8F0',
                background: filterType === f.id ? '#F0F9FF' : '#FFFFFF',
                color: filterType === f.id ? '#0284C7' : '#64748B',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={filterMedium}
          onChange={(e) => setFilterMedium(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#FFFFFF',
            color: '#334155'
          }}
        >
          <option value="">All Mediums (Phone, WhatsApp, Meeting)</option>
          <option value="Phone Call">📞 Phone Call</option>
          <option value="WhatsApp">💬 WhatsApp</option>
          <option value="In-Person Meeting">🤝 In-Person Meeting</option>
          <option value="Office Visit">🏢 Office Visit</option>
          <option value="Email">✉️ Email</option>
        </select>
      </div>

      {/* Chronological Timeline */}
      {filteredItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredItems.map(item => {
            if (item.itemType === 'assignment') {
              // ASSIGNMENT / HANDOFF CARD
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#EEF2FF',
                    border: '1.5px solid #C7D2FE',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    <UserPlus size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#312E81', fontSize: '0.92rem' }}>
                          Client Handed Off / Assigned
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#E0E7FF',
                          color: '#3730A3'
                        }}>
                          RM Assignment
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#6366F1', fontWeight: 600 }}>
                        {new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 4px', fontSize: '0.85rem', color: '#3730A3', fontWeight: 600 }}>
                      Assigned by <strong style={{ color: '#1E1B4B' }}>{item.assignedBy || item.user}</strong> to <strong style={{ color: '#4338CA' }}>{item.assignedTo || 'Staff'}</strong>
                      {item.previousAssignee && item.previousAssignee !== 'Unassigned' && (
                        <span> (Previously handled by {item.previousAssignee})</span>
                      )}
                    </p>

                    {item.notes && (
                      <div style={{
                        marginTop: 6,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: '#FFFFFF',
                        border: '1px solid #E0E7FF',
                        fontSize: '0.8rem',
                        color: '#4B5563'
                      }}>
                        <strong>Note:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // STANDARD FOLLOW-UP / INTERACTION CARD
            const mediumColors = getMediumBadgeColor(item.medium);
            const respColors = getResponseColor(item.response);

            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: mediumColors.bg,
                  color: mediumColors.text,
                  border: `1px solid ${mediumColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  {getMediumIcon(item.medium)}
                </div>

                <div style={{ flex: 1 }}>
                  {/* Card Header: Medium, Outcome, and Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                        {item.medium} • {item.callStatus}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: respColors.bg,
                        color: respColors.text
                      }}>
                        {item.response}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                      {new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  {/* Remarks / Discussion Summary */}
                  <p style={{ margin: '8px 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    {item.remarks}
                  </p>

                  {/* Portfolio / Financial agreed details if any */}
                  {(item.sipAmount > 0 || item.schemeName) && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#15803D',
                      marginBottom: 6
                    }}>
                      <IndianRupee size={13} />
                      <span>
                        {item.sipAmount > 0 ? `₹${Number(item.sipAmount).toLocaleString('en-IN')}/mo SIP` : ''} 
                        {item.schemeName ? ` • ${item.schemeName}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Footer metadata: Next scheduled call date & Caller name */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    fontSize: '0.75rem',
                    color: '#64748B',
                    borderTop: '1px solid #F8FAFC',
                    paddingTop: 8,
                    marginTop: 4
                  }}>
                    <div>
                      Logged by: <strong style={{ color: '#0F172A' }}>{item.user}</strong>
                    </div>

                    {item.nextCallDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D97706', fontWeight: 700 }}>
                        <Calendar size={13} />
                        Next Follow-up: {new Date(item.nextCallDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#F8FAFC',
          borderRadius: 18,
          border: '2px dashed #CBD5E1'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#E0F2FE',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <Phone size={26} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            No Follow-ups Logged Yet
          </h4>
          <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#64748B', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Record calls, WhatsApp chats, meetings, and client updates to keep the entire relationship history organized.
          </p>
          <button
            type="button"
            onClick={onLogFollowUp}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Plus size={16} />
            Log First Follow-up
          </button>
        </div>
      )}
    </div>
  );
}
