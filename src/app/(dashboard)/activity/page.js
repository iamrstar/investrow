'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';

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
      const params = new URLSearchParams({ page, limit: 20 });
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
          Activity Log
        </h1>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Types</option>
          <option value="Lead">Leads</option>
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
                const changes = act.details || {};
                const hasChanges = Object.keys(changes).length > 0;

                return (
                  <div key={act._id} className="timeline-item" onClick={() => hasChanges && toggleActivity(act._id)}>
                    <div className="timeline-dot" style={{ background: act.entityType === 'Lead' ? 'var(--secondary)' : act.entityType === 'Task' ? 'var(--accent)' : '#8b5cf6' }}></div>
                    <div className="timeline-header">
                      <div className="timeline-action">
                         <span className={`badge badge-${act.entityType === 'Lead' ? 'blue' : act.entityType === 'Task' ? 'orange' : 'purple'}`} style={{ marginRight: 8 }}>
                          {act.entityType}
                        </span>
                        {act.action}
                      </div>
                      <div className="timeline-time">{new Date(act.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="timeline-user">
                      <strong>{act.userId?.name || 'System'}</strong> performing action
                    </div>

                    {isExpanded && hasChanges && (
                      <div className="timeline-details" style={{ background: 'var(--primary-dark)', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                        <div className="change-log">
                          {Object.entries(changes).map(([field, vals]) => (
                            <div key={field} className="change-item">
                              <span className="change-label">{field.replace(/([A-Z])/g, ' $1')}</span>
                              <div className="change-diff">
                                <span className="val-old">{vals.from ? (typeof vals.from === 'string' && vals.from.includes('T') ? new Date(vals.from).toLocaleDateString() : String(vals.from)) : 'None'}</span>
                                <span className="diff-arrow">→</span>
                                <span className="val-new">{vals.to ? (typeof vals.to === 'string' && vals.to.includes('T') ? new Date(vals.to).toLocaleDateString() : String(vals.to)) : 'None'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hasChanges && !isExpanded && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: 8, fontWeight: 600 }}>
                        + Click to see {Object.keys(changes).length} changes
                      </div>
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
