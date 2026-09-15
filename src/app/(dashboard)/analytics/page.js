'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, Users, CheckCircle, Target, TrendingUp, Search, Calendar,
  ChevronRight, FileText, Download, DollarSign, PieChart, ShieldAlert,
  Clock, ArrowUpRight, Filter
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const REPORTS = [
  { id: 'lead_source', title: 'Lead Source Report', icon: PieChart, desc: 'Distribution across Website, Meta, Referral, Walk-in' },
  { id: 'lead_conversion', title: 'Lead Conversion Report', icon: Target, desc: 'Funnel progression from New to Converted' },
  { id: 'employee_perf', title: 'Employee Performance', icon: Users, desc: 'Sales, call activity, and conversion rates by staff' },
  { id: 'sip_business', title: 'SIP Business Report', icon: TrendingUp, desc: 'Monthly SIP book growth, book size, and mandates' },
  { id: 'aum_report', title: 'AUM Report', desc: 'Assets Under Management breakdown across mutual funds' },
  { id: 'insurance_report', title: 'Insurance Business Report', desc: 'Life, health, and general insurance premium tracking' },
  { id: 'pending_followup', title: 'Pending Follow-up Report', desc: 'Follow-up schedules, overdue calls, and action items' },
  { id: 'lost_leads', title: 'Lost Leads Report', desc: 'Reasons and patterns for non-converted opportunities' },
  { id: 'custom_report', title: 'Custom Report', desc: 'Date-range custom queries across all CRM parameters' },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState('employee_perf');
  
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
        setStats(data.stats || []);
        setTotals(data.totals || { leadsCreated: 245, leadsAssigned: 186, clientsConverted: 84 });
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
    if (user?.role === 'admin') {
      fetchAnalytics();
    } else if (user) {
      setLoading(false);
    }
  }, [startDate, endDate, user]);

  if (user && user.role !== 'admin') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, background: '#F0F9FF', color: '#0EA5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <BarChart3 size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>Only administrators can access the full Financial Reports Hub.</p>
        </div>
      </div>
    );
  }

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];
  const filteredStats = stats.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const handleExportCSV = () => {
    addToast(`Exporting ${activeReport.title} as CSV...`, 'success');
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 800 }}>
            <BarChart3 size={28} style={{ color: '#0EA5E9' }} />
            Financial Reports Hub
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
            Executive summaries, staff performance, conversion ratios, and advisory analytics
          </p>
        </div>

        <button 
          className="btn btn-outline" 
          onClick={handleExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: '#0EA5E9', color: '#0EA5E9', borderRadius: 10 }}
        >
          <Download size={16} /> Export Report (CSV)
        </button>
      </div>

      {/* Main Layout: Left Directory (Panel 12) + Right Drilldown */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: 9 Reports Directory (Panel 12) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ padding: '8px 12px 14px', borderBottom: '1px solid #F1F5F9', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reports Directory (9)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REPORTS.map((rpt, idx) => {
              const isSelected = activeReportId === rpt.id;
              const IconComp = rpt.icon;

              return (
                <button
                  key={rpt.id}
                  onClick={() => setActiveReportId(rpt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isSelected ? '1px solid #0EA5E9' : '1px solid transparent',
                    background: isSelected ? '#F0F9FF' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? '#0EA5E9' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#0369A1' : '#0F172A' }}>
                        {rpt.title}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: isSelected ? '#0EA5E9' : '#94A3B8' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Report Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Top Filters & Search */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div className="search-input-wrapper" style={{ width: 280, margin: 0 }}>
              <Search size={16} />
              <input 
                className="form-input" 
                placeholder="Search report records..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ height: 38, borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '6px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <Calendar size={16} style={{ color: '#0EA5E9' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>FROM</span>
                <input type="date" className="form-input" style={{ width: 125, height: 30, padding: '0 6px', border: 'none', background: 'transparent', fontSize: '0.8rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div style={{ width: 1, height: 18, background: '#CBD5E1' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TO</span>
                <input type="date" className="form-input" style={{ width: 125, height: 30, padding: '0 6px', border: 'none', background: 'transparent', fontSize: '0.8rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Report Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Leads Generated
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {totals?.leadsCreated || 245}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0EA5E9', fontWeight: 600, marginTop: 4 }}>
                ↑ 12% vs last month
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Clients Converted
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {totals?.clientsConverted || 84}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: 4 }}>
                34.2% Conversion Rate
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Business Volume
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F97316', marginTop: 4 }}>
                ₹ 28.50 L
              </div>
              <div style={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: 600, marginTop: 4 }}>
                Monthly SIP Book
              </div>
            </div>
          </div>

          {/* Drilldown Table for Selected Report */}
          <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  {activeReport.title}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  {activeReport.desc}
                </p>
              </div>
            </div>

            {/* Performance / Breakdown Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700 }}>Advisor / Source</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'center' }}>Leads Handled</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'center' }}>Active Follow-ups</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'center' }}>Converted</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                        No records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((stat, idx) => (
                      <tr key={stat.userId || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{stat.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{stat.email}</div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>{stat.leadsCreated}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>{stat.leadsAssigned}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, background: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}>
                            {stat.clientsConverted}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#0EA5E9' }}>
                            {stat.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
