'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users, FileText, TrendingUp, CheckCircle, Phone, Clock,
  ArrowUpRight, BarChart3, PieChart as PieChartIcon, Calendar,
  UserCheck, AlertCircle
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="page-content">
        <div className="loading-page"><div className="spinner"></div><p>Loading dashboard...</p></div>
      </div>
    );
  }

  const roleTitle = user.role === 'admin' ? 'Admin Dashboard' : user.role === 'manager' ? 'Manager Dashboard' : 'My Dashboard';

  const serviceChartData = {
    labels: stats.serviceBreakdown?.map(s => s._id) || [],
    datasets: [{
      data: stats.serviceBreakdown?.map(s => s.count) || [],
      backgroundColor: ['#0EA5E9', '#F97316', '#22c55e', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#ec4899'],
      borderWidth: 0,
    }],
  };

  const responseChartData = {
    labels: ['Positive', 'Negative', 'Pending'],
    datasets: [{
      label: 'Leads',
      data: [stats.positiveLeads, stats.negativeLeads, stats.pendingLeads],
      backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{roleTitle}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Welcome back, {user.name}!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon blue"><FileText size={22} /></div>
          </div>
          <div className="stat-card-value">{stats.totalLeads}</div>
          <div className="stat-card-label">Total Leads</div>
        </div>

        <div className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon green"><TrendingUp size={22} /></div>
          </div>
          <div className="stat-card-value">{stats.conversionRate}%</div>
          <div className="stat-card-label">Conversion Rate</div>
        </div>

        <div className="stat-card orange">
          <div className="stat-card-header">
            <div className="stat-card-icon orange"><Calendar size={22} /></div>
          </div>
          <div className="stat-card-value">{stats.todayFollowUps}</div>
          <div className="stat-card-label">Today&apos;s Follow-ups</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-card-header">
            <div className="stat-card-icon purple"><CheckCircle size={22} /></div>
          </div>
          <div className="stat-card-value">{stats.completedTasks}</div>
          <div className="stat-card-label">Tasks Completed</div>
        </div>

        {user.role === 'admin' && (
          <>
            <div className="stat-card teal">
              <div className="stat-card-header">
                <div className="stat-card-icon teal"><Users size={22} /></div>
              </div>
              <div className="stat-card-value">{stats.totalUsers || 0}</div>
              <div className="stat-card-label">Call Executives</div>
            </div>

            <div className="stat-card red">
              <div className="stat-card-header">
                <div className="stat-card-icon red"><UserCheck size={22} /></div>
              </div>
              <div className="stat-card-value">{stats.totalManagers || 0}</div>
              <div className="stat-card-label">Managers</div>
            </div>
          </>
        )}

        {user.role === 'manager' && (
          <div className="stat-card teal">
            <div className="stat-card-header">
              <div className="stat-card-icon teal"><Users size={22} /></div>
            </div>
            <div className="stat-card-value">{stats.teamSize || 0}</div>
            <div className="stat-card-label">Team Members</div>
          </div>
        )}

        <div className="stat-card red">
          <div className="stat-card-header">
            <div className="stat-card-icon red"><AlertCircle size={22} /></div>
          </div>
          <div className="stat-card-value">{stats.pendingTasks}</div>
          <div className="stat-card-label">Pending Tasks</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChartIcon size={20} style={{ color: 'var(--secondary)' }} />
            Leads by Service
          </div>
          <div style={{ maxWidth: 300, margin: '0 auto' }}>
            {stats.serviceBreakdown?.length > 0 ? (
              <Doughnut data={serviceChartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
                },
                cutout: '60%',
              }} />
            ) : (
              <div className="empty-state"><p>No data yet</p></div>
            )}
          </div>
          
          {/* Service Conversion Table */}
          {stats.serviceBreakdown?.length > 0 && (
            <div style={{ marginTop: 24, padding: '0 10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Service Conversion Performance
              </div>
              {stats.serviceBreakdown.slice(0, 4).map(s => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s._id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${s.conversionRate}%`, height: '100%', background: 'var(--secondary)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary-dark)' }}>{s.conversionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
            Hot Leads (Priority Close)
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.hotLeads?.length > 0 ? (
              stats.hotLeads.map(lead => (
                <div key={lead._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid var(--border-light)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.service} • {lead.phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>Hot Opportunity</div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => window.location.href=`/leads?search=${lead.name}`}>Call Now</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <CheckCircle size={32} style={{ color: '#22c55e', opacity: 0.5, marginBottom: 8 }} />
                <p>No high-priority leads at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Leads */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Leads</h3>
            <a href="/leads" className="btn btn-sm btn-outline">View All <ArrowUpRight size={14} /></a>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.recentLeads?.length > 0 ? (
              stats.recentLeads.map(lead => (
                <div key={lead._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderBottom: '1px solid var(--border-light)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.service}</div>
                  </div>
                  <span className={`badge badge-${lead.response?.toLowerCase() === 'positive' ? 'positive' : lead.response?.toLowerCase() === 'negative' ? 'negative' : 'pending'}`}>
                    {lead.response}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 40 }}><p>No leads yet</p></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            {(user.role === 'admin' || user.role === 'manager') && (
              <a href="/activity" className="btn btn-sm btn-outline">View All <ArrowUpRight size={14} /></a>
            )}
          </div>
          <div className="card-body" style={{ padding: '8px 20px' }}>
            {stats.recentActivities?.length > 0 ? (
              stats.recentActivities.map(act => (
                <div key={act._id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{act.userId?.name || 'System'}</strong> {act.action}
                    </div>
                    <div className="activity-time">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 40 }}><p>No activity yet</p></div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
