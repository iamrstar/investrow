'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Users, UserPlus, UserCheck, Calendar, Clock,
  TrendingUp, BarChart2, Shield, CheckCircle2,
  Phone, MessageSquare, Plus, Upload, FileText,
  AlertTriangle, ArrowUpRight, Check, X, Send,
  Briefcase, IndianRupee, Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ phone: '', name: '', template: 'followUp', customMsg: '' });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', service: 'Mutual Funds', source: 'Website' });
  const [leadSaving, setLeadSaving] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) {
      return addToast('Please enter client name and phone number', 'error');
    }
    setLeadSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      if (res.ok) {
        addToast('New lead created successfully!', 'success');
        setShowLeadModal(false);
        setNewLead({ name: '', phone: '', email: '', service: 'Mutual Funds', source: 'Website' });
        fetchDashboardStats();
      } else {
        addToast('Failed to create lead', 'error');
      }
    } catch (err) {
      addToast('Network error while creating lead', 'error');
    } finally {
      setLeadSaving(false);
    }
  };

  const handleSendWhatsApp = (mobile, name = 'Client') => {
    const cleanPhone = String(mobile).replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.length === 10) finalPhone = '91' + finalPhone;

    let text = `Hello ${name}, greetings from Investrow Financial Services! How may we assist you with your investments today?`;
    if (whatsAppData.template === 'sip') {
      text = `Hello ${name}, this is a gentle reminder regarding your monthly SIP with Investrow Financial Services. Stay invested for long-term wealth creation!`;
    } else if (whatsAppData.template === 'insurance') {
      text = `Dear ${name}, your insurance policy renewal is approaching. Please contact your Investrow advisor to keep your cover active.`;
    } else if (whatsAppData.customMsg.trim()) {
      text = whatsAppData.customMsg.trim();
    }

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowWhatsAppModal(false);
  };

  if (loading || !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontWeight: 600 }}>Loading Investrow Dashboard...</p>
      </div>
    );
  }

  // Leads by Source Donut Chart Data
  const donutData = {
    labels: stats.leadsBySource.map(s => s.name),
    datasets: [{
      data: stats.leadsBySource.map(s => s.percentage),
      backgroundColor: stats.leadsBySource.map(s => s.color),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6,
    }],
  };

  // Business Overview Grouped Bar Chart Data
  const barData = {
    labels: stats.businessOverview.months,
    datasets: [
      {
        label: 'SIP Book (₹ Lakh)',
        data: stats.businessOverview.sipBook,
        backgroundColor: '#0EA5E9',
        borderRadius: 4,
      },
      {
        label: 'AUM (₹ Crore)',
        data: stats.businessOverview.aum,
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
      {
        label: 'Insurance (₹ Lakh)',
        data: stats.businessOverview.insurance,
        backgroundColor: '#F97316',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      {/* 1. Welcome & Greeting Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 4px 0'
          }}>
            Welcome Back, {user.name?.split(' ')[0] || 'Birendra'}!
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* Skyblue & Orange Brand Quote Card */}
        <div style={{
          background: 'linear-gradient(135deg, #F0F9FF 0%, #FFF7ED 100%)',
          border: '1px solid #BAE6FD',
          borderRadius: 14,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369A1' }}>
              &ldquo;Discipline today,
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EA580C' }}>
              Financial freedom tomorrow.&rdquo;
            </div>
          </div>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(249, 115, 22, 0.25)'
          }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* 2. Top 8 Metric KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* 1. Total Leads */}
        <div
          onClick={() => router.push('/leads')}
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.28)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <Users size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.totalLeads}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Total Leads</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>↑ 12% vs last month</div>
        </div>

        {/* 2. New Leads */}
        <div
          onClick={() => router.push('/leads')}
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <UserPlus size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.newLeads}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>New Leads</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>↑ 25% vs last month</div>
        </div>

        {/* 3. Follow-up Due (Brand Orange) */}
        <div
          onClick={() => router.push('/follow-ups')}
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.28)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <Calendar size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.followUpDue}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Follow-up Due</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.95, marginTop: 6, fontWeight: 700 }}>
            🕒 {stats.overdueFollowUps} Overdue
          </div>
        </div>

        {/* 4. Total Clients (Deep Sky Blue) */}
        <div
          onClick={() => router.push('/clients')}
          style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <UserCheck size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.totalClients}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Total Clients</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>↑ 10% vs last month</div>
        </div>

        {/* 5. Monthly SIP Book (Sky Blue Light) */}
        <div
          onClick={() => router.push('/clients')}
          style={{
            background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontWeight: 900
          }}>
            ₹
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.monthlySipBook}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Monthly SIP Book</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>↑ 18%</div>
        </div>

        {/* 6. Total AUM (Bright Orange) */}
        <div
          onClick={() => router.push('/clients')}
          style={{
            background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <BarChart2 size={20} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.totalAum}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Total AUM</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>↑ 22%</div>
        </div>

        {/* 7. Insurance Policies */}
        <div
          onClick={() => router.push('/clients')}
          style={{
            background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <Shield size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.insurancePolicies}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Insurance Policies</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>{stats.insurancePremium} Premium</div>
        </div>

        {/* 8. Pending Tasks */}
        <div
          onClick={() => router.push('/tasks')}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stats.pendingTasks}</div>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.95, marginTop: 4 }}>Pending Tasks</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.95, marginTop: 6, fontWeight: 700 }}>
            🕒 {stats.overdueTasks} Overdue
          </div>
        </div>
      </div>

      {/* 3. Middle Analytics Row (3 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 24
      }}>
        {/* Card 1: Leads by Source */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            Leads by Source
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-between' }}>
            {/* Donut with center text */}
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <Doughnut
                data={donutData}
                options={{
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                  cutout: '72%',
                  maintainAspectRatio: false,
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {stats.totalLeads}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Leads</span>
              </div>
            </div>

            {/* Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {stats.leadsBySource.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{s.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Lead Conversion Funnel */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            Lead Conversion Funnel
          </h3>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {/* Visual Funnel Tiers */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.funnel.map((tier, idx) => {
                const widthPercent = 100 - idx * 11;
                return (
                  <div
                    key={tier.label}
                    style={{
                      width: `${widthPercent}%`,
                      margin: '0 auto',
                      background: tier.color,
                      color: 'white',
                      borderRadius: 6,
                      padding: '5px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    <span>{tier.count}</span>
                    <span style={{ opacity: 0.95 }}>{tier.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Conversion Rate Highlight */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '16px',
              textAlign: 'center',
              minWidth: 120
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                Conversion Rate
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>
                {stats.conversionRate}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                ↑ 2.5% vs last month
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Business Overview (This Month) */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Business Overview (This Month)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', fontWeight: 600, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ color: '#0EA5E9' }}>● SIP Book (₹ Lakh)</span>
            <span style={{ color: '#10B981' }}>● AUM (₹ Crore)</span>
            <span style={{ color: '#F97316' }}>● Insurance (₹ Lakh)</span>
          </div>

          <div style={{ height: 160 }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: '#F1F5F9' }, ticks: { stepSize: 5 } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom Operational Row (Today's Follow-ups & Recent Activities) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {/* Today's Follow-ups */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Today&apos;s Follow-ups ({stats.todayFollowUpsList.length})
            </h3>
            <button
              onClick={() => router.push('/follow-ups')}
              style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Time</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Mobile</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayFollowUpsList.map((item) => {
                  const statusBg = item.status === 'Overdue' ? '#FEE2E2' : item.status === 'Due' ? '#FFE4E6' : '#FEF3C7';
                  const statusColor = item.status === 'Overdue' ? '#EF4444' : item.status === 'Due' ? '#E11D48' : '#D97706';

                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px 10px', color: '#475569', fontWeight: 600 }}>{item.time}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0F172A' }}>{item.name}</td>
                      <td style={{ padding: '12px 10px', color: '#64748B' }}>{item.mobile}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{item.product}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: statusBg,
                          color: statusColor
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          {/* Call Icon */}
                          <a
                            href={`tel:${item.mobile}`}
                            style={{
                              color: '#10B981',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Call client"
                          >
                            <Phone size={16} />
                          </a>
                          {/* WhatsApp Icon */}
                          <button
                            onClick={() => {
                              setWhatsAppData({ phone: item.mobile, name: item.name, template: 'followUp', customMsg: '' });
                              setShowWhatsAppModal(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#22C55E',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Send WhatsApp"
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Recent Activities
            </h3>
            <button
              onClick={() => router.push('/activity')}
              style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.recentActivities.map((act) => (
              <div key={act._id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, minWidth: 60 }}>
                    {act.time}
                  </span>
                  <span style={{ color: '#1E293B', fontWeight: 500, lineHeight: 1.4 }}>
                    {act.activity}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {act.by}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bottom Quick Action Bar */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '14px 20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
      }}>
        {/* 1. Add New Lead */}
        <button
          onClick={() => setShowLeadModal(true)}
          style={{
            flex: 1, minWidth: 150, height: 44, borderRadius: 10,
            background: '#0EA5E9', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(14, 165, 233, 0.28)'
          }}
        >
          <Plus size={18} /> Add New Lead
        </button>

        {/* 2. Add New Client */}
        <button
          onClick={() => router.push('/clients')}
          style={{
            flex: 1, minWidth: 150, height: 44, borderRadius: 10,
            background: '#10B981', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Plus size={18} /> Add New Client
        </button>

        {/* 3. Schedule Follow-up */}
        <button
          onClick={() => router.push('/follow-ups')}
          style={{
            flex: 1, minWidth: 160, height: 44, borderRadius: 10,
            background: '#F97316', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(249, 115, 22, 0.28)'
          }}
        >
          <Calendar size={18} /> Schedule Follow-up
        </button>

        {/* 4. Upload Document */}
        <button
          onClick={() => router.push('/vault')}
          style={{
            flex: 1, minWidth: 150, height: 44, borderRadius: 10,
            background: '#0284C7', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
          }}
        >
          <Upload size={18} /> Upload Document
        </button>

        {/* 5. Send WhatsApp */}
        <button
          onClick={() => setShowWhatsAppModal(true)}
          style={{
            flex: 1, minWidth: 150, height: 44, borderRadius: 10,
            background: '#22C55E', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(34, 197, 94, 0.25)'
          }}
        >
          <MessageSquare size={18} /> Send WhatsApp
        </button>

        {/* 6. View Reports */}
        <button
          onClick={() => router.push('/analytics')}
          style={{
            flex: 1, minWidth: 140, height: 44, borderRadius: 10,
            background: '#0F172A', color: 'white', border: 'none',
            fontSize: '0.875rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)'
          }}
        >
          <BarChart2 size={18} /> View Reports
        </button>
      </div>

      {/* 6. Corporate Footer */}
      <footer style={{
        padding: '16px 0',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.78rem',
        color: '#64748B'
      }}>
        <div style={{ fontWeight: 600, color: '#334155' }}>
          Investrow Financial Services Pvt Ltd | Investrow IMF Pvt Ltd
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span>Mutual Funds</span>
          <span>•</span>
          <span>Insurance</span>
          <span>•</span>
          <span>Bonds</span>
          <span>•</span>
          <span>Demat</span>
          <span>•</span>
          <span>Tax Services</span>
          <span>•</span>
          <span>Financial Planning</span>
        </div>

        <div style={{ fontWeight: 700, color: '#0EA5E9' }}>
          Your Partner in Financial Growth
        </div>
      </footer>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="modal-backdrop" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, borderRadius: 24 }}>
            <div className="modal-header" style={{ background: '#22C55E', color: 'white', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={22} />
                <h3 className="modal-title" style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>
                  Send WhatsApp Message
                </h3>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Client Mobile Number (with country code)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={whatsAppData.phone}
                  onChange={e => setWhatsAppData({ ...whatsAppData, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Select Message Template</label>
                <select
                  className="form-select"
                  value={whatsAppData.template}
                  onChange={e => setWhatsAppData({ ...whatsAppData, template: e.target.value })}
                >
                  <option value="followUp">General Follow-up Greeting</option>
                  <option value="sip">Monthly SIP Investment Reminder</option>
                  <option value="insurance">Insurance Policy Renewal Due</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>

              {whatsAppData.template === 'custom' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Custom Message Text</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Type your WhatsApp message..."
                    value={whatsAppData.customMsg}
                    onChange={e => setWhatsAppData({ ...whatsAppData, customMsg: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowWhatsAppModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSendWhatsApp(whatsAppData.phone, whatsAppData.name)}
                style={{ flex: 1, background: '#22C55E', borderColor: '#22C55E' }}
              >
                <Send size={16} /> Open in WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Lead Modal */}
      {showLeadModal && (
        <div className="modal-backdrop" onClick={() => setShowLeadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 24 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </div>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>Quick Add Lead</h3>
              </div>
              <button onClick={() => setShowLeadModal(false)} className="modal-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="modal-body" style={{ padding: 24 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Client full name"
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="10-digit mobile"
                      value={newLead.phone}
                      onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="client@email.com"
                      value={newLead.email}
                      onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Interested Product</label>
                    <select
                      className="form-select"
                      value={newLead.service}
                      onChange={e => setNewLead({ ...newLead, service: e.target.value })}
                    >
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Health Insurance">Health Insurance</option>
                      <option value="FD & Bond">FD & Bond</option>
                      <option value="Tax Planning">Tax Planning</option>
                      <option value="Stock Market & Demat">Stock Market & Demat</option>
                      <option value="NPS">NPS</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Lead Source</label>
                    <select
                      className="form-select"
                      value={newLead.source}
                      onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                    >
                      <option value="Website">Website</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Referral">Referral</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Employee">Employee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowLeadModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={leadSaving} style={{ flex: 1, background: '#0EA5E9', borderColor: '#0EA5E9' }}>
                  {leadSaving ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
