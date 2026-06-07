'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Users, CheckCircle, Target, TrendingUp, Search, Calendar } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/analytics?${params}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTotals(data.totals);
      } else {
        addToast(data.error || 'Failed to fetch analytics', 'error');
      }
    } catch (err) {
      addToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if admin
    if (user?.role === 'admin') {
      fetchAnalytics();
    } else if (user) {
      setLoading(false); // Stop loading if not admin
    }
  }, [startDate, endDate, user]);

  if (user && user.role !== 'admin') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, background: 'var(--secondary-50)', color: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <BarChart3 size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>Only administrators can view Team Analytics.</p>
        </div>
      </div>
    );
  }

  const filteredStats = stats.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <BarChart3 size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Team Analytics
        </h1>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 250 }}>
          <Search size={18} />
          <input 
            className="form-input" 
            placeholder="Search users..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
          <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FROM</span>
            <input type="date" className="form-input" style={{ width: 130, height: 36, padding: '0 8px', border: 'none', background: 'transparent' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TO</span>
            <input type="date" className="form-input" style={{ width: 130, height: 36, padding: '0 8px', border: 'none', background: 'transparent' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner"></div></div>
      ) : (
        <>
          {totals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
              <div className="dashboard-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Leads Created</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totals.leadsCreated}</div>
                </div>
              </div>
              <div className="dashboard-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assigned</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totals.leadsAssigned}</div>
                </div>
              </div>
              <div className="dashboard-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clients Converted</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totals.clientsConverted}</div>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={20} style={{ color: 'var(--secondary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>User Performance</h3>
            </div>
            
            <div className="sheet-container" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th style={{ textAlign: 'center' }}>Leads Created</th>
                    <th style={{ textAlign: 'center' }}>Leads Assigned</th>
                    <th style={{ textAlign: 'center' }}>Converted to Client</th>
                    <th style={{ textAlign: 'center' }}>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No user data found.
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map(userStat => (
                      <tr key={userStat.userId}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--secondary-dark)' }}>{userStat.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userStat.email}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{userStat.leadsCreated}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{userStat.leadsAssigned}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                            {userStat.clientsConverted}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <div style={{ flex: 1, maxWidth: 100, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(userStat.conversionRate, 100)}%`, background: 'var(--success)' }}></div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {userStat.conversionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
