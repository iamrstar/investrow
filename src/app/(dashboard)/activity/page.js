'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, ChevronLeft, ChevronRight, Phone, Calendar, Clock, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react';

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterType, setFilterType] = useState('');

  const [expandedActivities, setExpandedActivities] = useState({});

  const toggleActivity = (id) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchActivities = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (filterType) params.set('entityType', filterType);
      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  if (user?.role === 'user') {
    return (
      <div className="page-content">
        <div className="empty-state">
          <Activity size={64} />
          <h3>Access Restricted</h3>
          <p>Activity logs are available for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <Activity size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Activity & Follow-up History Log
        </h1>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All Types</option>
          <option value="Lead">Leads & Follow-ups</option>
          <option value="Task">Tasks</option>
          <option value="User">Users</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {pagination.total} total entries
        </span>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div>
          ) : activities.length === 0 ? (
            <div className="empty-state"><Activity size={48} /><h3>No activity yet</h3></div>
          ) : (
            <div className="timeline" style={{ paddingLeft: 32 }}>
              {activities.map(act => {
                const isExpanded = expandedActivities[act._id];
                const d = act.details || {};
                const isFollowUp = d.type === 'followup' || d.callStatus || d.followupId || (act.action && act.action.toLowerCase().includes('follow-up'));
                const hasChanges = Object.keys(d).length > 0;

                return (
                  <div key={act._id} className="timeline-item" style={{ marginBottom: 20 }}>
                    <div 
                      className="timeline-dot" 
                      style={{ 
                        background: isFollowUp ? '#0284C7' : (act.entityType === 'Lead' ? 'var(--secondary)' : act.entityType === 'Task' ? 'var(--accent)' : '#8b5cf6') 
                      }}
                    ></div>

                    <div className="timeline-header">
                      <div className="timeline-action" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge badge-${isFollowUp ? 'blue' : (act.entityType === 'Lead' ? 'blue' : act.entityType === 'Task' ? 'orange' : 'purple')}`}>
                          {isFollowUp ? 'Follow-up Call' : act.entityType}
                        </span>
                        <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>
                          {act.action}
                        </strong>
                      </div>
                      <div className="timeline-time" style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {new Date(act.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="timeline-user" style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 10px 0' }}>
                      Logged by <strong>{act.userId?.name || 'Staff Advisor'}</strong>
                    </div>

                    {/* Rich Follow-up Details Card */}
                    {isFollowUp ? (
                      <div style={{ 
                        background: '#FFFFFF', 
                        border: '1.5px solid #BAE6FD', 
                        borderRadius: 14, 
                        padding: '16px 18px', 
                        marginTop: 10,
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
                      }}>
                        {/* Top Interaction Row: Medium, Call Status, Outcome */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {d.medium && (
                              <span style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                                {d.medium}
                              </span>
                            )}
                            <span style={{ 
                              background: d.callStatus === 'Received' || d.callStatus === 'Connected' ? '#DCFCE7' : '#FEF3C7',
                              color: d.callStatus === 'Received' || d.callStatus === 'Connected' ? '#15803D' : '#B45309',
                              border: d.callStatus === 'Received' || d.callStatus === 'Connected' ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                              padding: '3px 8px', 
                              borderRadius: 6, 
                              fontSize: '0.75rem', 
                              fontWeight: 700 
                            }}>
                              📞 {d.callStatus === 'Received' ? 'Connected' : (d.callStatus || 'Call Completed')}
                            </span>
                            {(d.response || d.stage) && (
                              <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                                Outcome: {d.response || d.stage}
                              </span>
                            )}
                          </div>
                          {d.interactionDate && (
                            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={13} />
                              Called on: <strong>{new Date(d.interactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </div>
                          )}
                        </div>

                        {/* Discussion & Response Notes */}
                        {d.remarks && (
                          <div style={{ 
                            background: '#F8FAFC', 
                            borderLeft: '3px solid #0EA5E9', 
                            borderRadius: '0 8px 8px 0', 
                            padding: '10px 14px', 
                            fontSize: '0.88rem', 
                            color: '#1E293B',
                            marginBottom: 10,
                            lineHeight: 1.5
                          }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MessageSquare size={12} style={{ color: '#0EA5E9' }} />
                              Discussion & Client Feedback:
                            </div>
                            <div>{d.remarks}</div>
                          </div>
                        )}

                        {/* Interested In: Service, Scheme, Amount */}
                        {(d.service || d.schemeName || d.sipAmount > 0 || d.investmentAmount > 0) && (
                          <div style={{ 
                            background: '#F0FDF4', 
                            border: '1px solid #BBF7D0', 
                            borderRadius: 10, 
                            padding: '8px 12px', 
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                            marginBottom: 10
                          }}>
                            <div style={{ fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <TrendingUp size={14} /> Interested In:
                            </div>
                            {d.service && (
                              <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                🏷️ {d.service}
                              </span>
                            )}
                            {d.schemeName && (
                              <span style={{ color: '#166534', fontWeight: 700 }}>
                                📈 {d.schemeName}
                              </span>
                            )}
                            {d.sipAmount > 0 && (
                              <span style={{ color: '#15803D', fontWeight: 700 }}>
                                💰 ₹{Number(d.sipAmount).toLocaleString('en-IN')}/mo SIP {d.sipDay ? `(Debit: ${d.sipDay}th)` : ''}
                              </span>
                            )}
                            {d.investmentAmount > 0 && (
                              <span style={{ color: '#15803D', fontWeight: 700 }}>
                                💼 ₹{Number(d.investmentAmount).toLocaleString('en-IN')} Lumpsum
                              </span>
                            )}
                          </div>
                        )}

                        {/* Next Follow-up Requested */}
                        {d.nextFollowUpDate && (
                          <div style={{ 
                            background: '#EFF6FF', 
                            border: '1px solid #BFDBFE', 
                            borderRadius: 8, 
                            padding: '8px 12px', 
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#1E40AF',
                            fontWeight: 700
                          }}>
                            <Calendar size={14} style={{ color: '#2563EB' }} />
                            Next Follow-up Requested: 
                            <strong style={{ color: '#1D4ED8' }}>
                              {new Date(d.nextFollowUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            </strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Standard Attribute Change Diff */
                      hasChanges && (
                        <div>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleActivity(act._id)}
                            style={{ padding: '4px 0', fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700 }}
                          >
                            {isExpanded ? 'Hide changes' : `+ View ${Object.keys(d).length} updated fields`}
                          </button>

                          {isExpanded && (
                            <div className="timeline-details" style={{ background: '#0F172A', color: 'white', padding: '12px 14px', borderRadius: '10px', marginTop: '8px' }}>
                              <div className="change-log">
                                {Object.entries(d).map(([field, vals]) => {
                                  const isDiff = vals && typeof vals === 'object' && ('from' in vals || 'to' in vals);
                                  return (
                                    <div key={field} className="change-item" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                                      <span className="change-label" style={{ color: '#94A3B8', fontWeight: 700, marginRight: 8 }}>
                                        {field.replace(/([A-Z])/g, ' $1')}:
                                      </span>
                                      {isDiff ? (
                                        <span style={{ color: '#E2E8F0' }}>
                                          <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{String(vals.from || 'None')}</span>
                                          {' → '}
                                          <span style={{ color: '#10B981', fontWeight: 700 }}>{String(vals.to || 'None')}</span>
                                        </span>
                                      ) : (
                                        <span style={{ color: '#38BDF8', fontWeight: 600 }}>{String(vals)}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '0 24px 24px' }}>
            <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchActivities(pagination.page - 1)}><ChevronLeft size={16} /></button>
            <span style={{ padding: '0 12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button className="pagination-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchActivities(pagination.page + 1)}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
