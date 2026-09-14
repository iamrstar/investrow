'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Users, UserPlus, UserCheck, Calendar, Clock, CalendarClock,
  TrendingUp, BarChart2, Shield, CheckCircle2,
  Phone, MessageSquare, Plus, Upload, FileText,
  AlertTriangle, ArrowUpRight, Check, X, Send,
  Briefcase, IndianRupee, Sparkles, Target
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
  const [dashboardMode, setDashboardMode] = useState('admin'); // 'admin' or 'employee'

  // Quick Action Modals
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ phone: '', name: '', template: 'followUp', customMsg: '' });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', service: 'Mutual Funds', source: 'Website' });
  const [leadSaving, setLeadSaving] = useState(false);

  // Staff Interactive Features & Modals
  const [completedTasks, setCompletedTasks] = useState({});
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ name: '', phone: '', date: '', remarks: '', service: 'Mutual Funds' });
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callNumber, setCallNumber] = useState('');

  useEffect(() => {
    if (user?.role === 'user') {
      setDashboardMode('employee');
    }
  }, [user]);

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

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.name || !followUpForm.phone) {
      return addToast('Please enter client name and phone number', 'error');
    }
    setFollowUpSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: followUpForm.name,
          phone: followUpForm.phone,
          service: followUpForm.service,
          followUpDate: followUpForm.date || new Date().toISOString().split('T')[0],
          remarks: followUpForm.remarks || 'Follow-up scheduled from Quick Actions',
          response: 'Follow-up'
        })
      });
      if (res.ok) {
        addToast('Follow-up scheduled successfully!', 'success');
        setShowFollowUpModal(false);
        setFollowUpForm({ name: '', phone: '', date: '', remarks: '', service: 'Mutual Funds' });
        fetchDashboardStats();
      } else {
        addToast('Failed to schedule follow-up', 'error');
      }
    } catch (err) {
      addToast('Network error while scheduling follow-up', 'error');
    } finally {
      setFollowUpSaving(false);
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

  // Real employee statistics from database (defaulting to 0/empty while loading)
  const empStats = stats?.employeeStats || {
    myTotalLeads: 0,
    myClients: 0,
    myFollowUps: 0,
    myOverdueFollowUps: 0,
    mySipBook: '₹ 0',
    myAum: '₹ 0',
    activeSipsCount: 0,
    activeLumpsumCount: 0,
    upcomingSipAlerts: [],
    myPendingTasks: 0,
    myOverdueTasks: 0,
    followUpsList: [],
    recentLeads: [],
    tasks: [],
    targets: [
      { key: 'leads', label: 'New Leads', current: 0, target: 50, percentage: 0, color: '#0EA5E9' },
      { key: 'clients', label: 'Converted Clients', current: 0, target: 15, percentage: 0, color: '#10B981' },
      { key: 'sip', label: 'SIP Book (₹)', current: '0.00', target: '5', unit: 'Lakh', percentage: 0, color: '#6366F1' },
      { key: 'aum', label: 'AUM (₹)', current: '0.00', target: '100', unit: 'Lakh', percentage: 0, color: '#D97706' },
    ],
  };

  return (
    <div className="dashboard-page-container">
      {/* 1. Header Banner */}
      {dashboardMode === 'employee' ? (
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
              Hello {user?.name?.split(' ')[0] || 'Rahul'},
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#475569', margin: 0, fontWeight: 500 }}>
              Here is your work summary for today.
            </p>
          </div>

          <div style={{
            fontStyle: 'italic',
            color: '#1E293B',
            fontSize: '0.95rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            &ldquo;Small steps with clients, big growth for your future.&rdquo;
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp; Have a Great Day!
              </div>
            </div>

            {/* Target Achievement Badge */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px solid #FCD34D',
              borderRadius: 12,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.12)'
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(217, 119, 6, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B45309'
              }}>
                <Target size={22} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', lineHeight: 1.25 }}>
                Meet Clients<br />Create Value<br />Grow Together
              </div>
            </div>

            {/* View Switcher Pill for Admin */}
            {user?.role === 'admin' && (
              <div style={{
                display: 'flex',
                background: '#FFFFFF',
                padding: 4,
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                <button
                  onClick={() => setDashboardMode('admin')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#64748B',
                  }}
                >
                  Admin View
                </button>
                <button
                  onClick={() => setDashboardMode('employee')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.28)'
                  }}
                >
                  Staff View
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Admin Header */
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
              Welcome Back, {user?.name?.split(' ')[0] || 'Birendra'}!
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>

          {/* View Switcher Pill & Brand Quote Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              background: '#FFFFFF',
              padding: 4,
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <button
                onClick={() => setDashboardMode('admin')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: dashboardMode === 'admin' ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'transparent',
                  color: dashboardMode === 'admin' ? '#FFFFFF' : '#64748B',
                  boxShadow: dashboardMode === 'admin' ? '0 2px 8px rgba(14, 165, 233, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Admin / Manager View
              </button>
              <button
                onClick={() => setDashboardMode('employee')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: dashboardMode === 'employee' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'transparent',
                  color: dashboardMode === 'employee' ? '#FFFFFF' : '#64748B',
                  boxShadow: dashboardMode === 'employee' ? '0 2px 8px rgba(249, 115, 22, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Staff / Employee View
              </button>
            </div>

            {/* Skyblue & Orange Brand Quote Card */}
            <div style={{
              background: 'linear-gradient(135deg, #F0F9FF 0%, #FFF7ED 100%)',
              border: '1px solid #BAE6FD',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369A1' }}>
                  “Discipline today,
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EA580C' }}>
                  Financial freedom tomorrow.”
                </div>
              </div>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 10px rgba(249, 115, 22, 0.25)'
              }}>
                <TrendingUp size={18} />
              </div>
            </div>
          </div>
        </div>
      )}

      {dashboardMode === 'admin' ? (
        <>
          {/* 2. Top 8 Metric KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 14,
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
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>All in CRM ({stats.activePipelineCount || 9} Active)</div>
        </div>

        {/* 2. New Leads */}
        <div
          onClick={() => router.push('/leads?status=New')}
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
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>Awaiting First Call</div>
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
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 6 }}>Converted from leads</div>
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
          <div style={{ fontSize: '0.72rem', opacity: 0.95, marginTop: 6, fontWeight: 700 }}>
            {stats.activeSipsCount || 0} Active SIPs
          </div>
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
          <div style={{ fontSize: '0.72rem', opacity: 0.95, marginTop: 6, fontWeight: 700 }}>
            {stats.totalClients || 0} Portfolios
          </div>
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

      {/* Admin Upcoming SIP Debits Alert Banner */}
      {stats.upcomingSipAlerts?.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
          border: '1px solid #BFDBFE',
          borderRadius: 18,
          padding: '16px 20px',
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#3B82F6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
              }}>
                <CalendarClock size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Upcoming SIP Debits (Next 3 Days)
                  <span style={{ fontSize: '0.72rem', background: '#3B82F6', color: 'white', fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                    {stats.upcomingSipAlerts.length} Due
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 1 }}>
                  Automated ECS / NACH debits scheduled within 3 days across all company clients.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
            {stats.upcomingSipAlerts.map(sip => (
              <div
                key={sip._id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{sip.name}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: sip.dueStatus === 'Today' ? '#FEE2E2' : (sip.dueStatus === 'Tomorrow' ? '#FEF3C7' : '#E0F2FE'),
                      color: sip.dueStatus === 'Today' ? '#DC2626' : (sip.dueStatus === 'Tomorrow' ? '#D97706' : '#0284C7'),
                    }}>
                      {sip.dueStatus} ({sip.sipDay}th)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                    {sip.schemeName} • <strong style={{ color: '#059669' }}>{sip.formattedAmount}/mo</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cleanPhone = String(sip.phone).replace(/[^0-9]/g, '');
                    const finalPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                    const text = `Dear ${sip.name}, this is a gentle reminder from Investrow Financial Services that your monthly SIP of ${sip.formattedAmount} for ${sip.schemeName} is scheduled for debit on ${sip.sipDay}th. Kindly maintain sufficient bank balance to avoid ECS bounce charges. Happy Investing!`;
                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  title="Send WhatsApp Balance Reminder"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                    flexShrink: 0
                  }}
                >
                  <Send size={12} /> Remind
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Middle Analytics Row (3 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Lead Conversion Funnel
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: '#F0F9FF',
              color: '#0284C7',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #BAE6FD'
            }}>
              Live Pipeline Sync
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {/* Visual Funnel Tiers */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.funnel.map((tier, idx) => {
                const widthPercent = 100 - idx * 8;
                return (
                  <div
                    key={tier.label}
                    onClick={() => {
                      if (tier.stageKey === 'Converted') {
                        router.push('/clients');
                      } else {
                        router.push(`/leads?status=${tier.stageKey}`);
                      }
                    }}
                    title={`Click to view ${tier.label} leads`}
                    style={{
                      width: `${widthPercent}%`,
                      margin: '0 auto',
                      background: tier.color,
                      color: 'white',
                      borderRadius: 8,
                      padding: '6px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, filter 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{tier.label}</span>
                      {tier.badge && (
                        <span style={{
                          background: 'rgba(255,255,255,0.22)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: '0.68rem',
                          fontWeight: 600
                        }}>
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.85rem' }}>{tier.count}</span>
                      <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({tier.percentage})</span>
                    </div>
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
              minWidth: 130
            }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                Conversion Rate
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>
                {stats.conversionRate}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginBottom: 6 }}>
                {stats.totalClients} of {stats.totalLeads} Converted
              </div>
              <div style={{
                background: '#ECFDF5',
                color: '#047857',
                padding: '3px 6px',
                borderRadius: 6,
                fontSize: '0.68rem',
                fontWeight: 700,
                border: '1px solid #A7F3D0'
              }}>
                {stats.activePipelineCount || 9} Active in Pipeline
              </div>
            </div>
          </div>

          {/* Current Active Pipeline Summary Strip */}
          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem',
            flexWrap: 'wrap',
            gap: 6
          }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Active Stages:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span 
                onClick={() => router.push('/leads?status=New')}
                style={{ cursor: 'pointer', background: '#F0F9FF', color: '#0284C7', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
              >
                New ({stats.pipelineBreakdown?.new ?? 5})
              </span>
              <span 
                onClick={() => router.push('/leads?status=Contacted')}
                style={{ cursor: 'pointer', background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
              >
                Contacted ({stats.pipelineBreakdown?.contacted ?? 0})
              </span>
              <span 
                onClick={() => router.push('/leads?status=Interested')}
                style={{ cursor: 'pointer', background: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
              >
                Interested ({stats.pipelineBreakdown?.interested ?? 4})
              </span>
              <span 
                onClick={() => router.push('/leads?status=Meeting')}
                style={{ cursor: 'pointer', background: '#FAF5FF', color: '#9333EA', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
              >
                Meeting ({stats.pipelineBreakdown?.meeting ?? 0})
              </span>
              <span 
                onClick={() => router.push('/clients')}
                style={{ cursor: 'pointer', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}
              >
                Converted ({stats.totalClients})
              </span>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                {(!stats.todayFollowUpsList || stats.todayFollowUpsList.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '28px 10px', textAlign: 'center', color: '#94A3B8' }}>
                      No follow-ups due today.
                    </td>
                  </tr>
                ) : (
                  stats.todayFollowUpsList.map((item) => {
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
                })
              )}
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
            {(!stats.recentActivities || stats.recentActivities.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94A3B8', fontSize: '0.85rem' }}>
                No recent activity logged yet.
              </div>
            ) : (
              stats.recentActivities.map((act) => (
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
              ))
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        /* ====== EMPLOYEE DASHBOARD VIEW (Panel 3) ====== */
        <div>
          {/* Top 6 Metric KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 14,
            marginBottom: 24
          }}>
            {/* 1. My Total Leads */}
            <div
              onClick={() => router.push('/leads')}
              style={{
                background: '#0284C7',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Users size={22} color="white" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{empStats.myTotalLeads}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>My Total Leads</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>•</span> Active in CRM
              </div>
            </div>

            {/* 2. My Clients */}
            <div
              onClick={() => router.push('/clients')}
              style={{
                background: '#10B981',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <UserPlus size={22} color="white" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{empStats.myClients}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>My Clients</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>•</span> Active Clients
              </div>
            </div>

            {/* 3. Today's Follow-ups */}
            <div
              onClick={() => router.push('/follow-ups')}
              style={{
                background: '#F97316',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.28)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Calendar size={22} color="white" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{empStats.myFollowUps}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>Today&apos;s Follow-ups</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.95, marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: '50%', background: 'white', color: '#F97316', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>!</span>
                {empStats.myOverdueFollowUps} Overdue
              </div>
            </div>

            {/* 4. My SIP Book */}
            <div
              onClick={() => router.push('/clients')}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.28)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <IndianRupee size={22} color="white" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1 }}>{empStats.mySipBook}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>My SIP Book</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.95, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 10 }}>
                  {empStats.activeSipsCount || 0} Active SIPs
                </span>
                <span>• Monthly</span>
              </div>
            </div>

            {/* 5. My AUM */}
            <div
              onClick={() => router.push('/clients')}
              style={{
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <TrendingUp size={22} color="white" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1 }}>{empStats.myAum}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>My AUM</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.95, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 10 }}>
                  {empStats.myClients || 0} Clients Won
                </span>
                <span>• Assets</span>
              </div>
            </div>

            {/* 6. My Pending Tasks */}
            <div
              onClick={() => router.push('/tasks')}
              style={{
                background: '#06B6D4',
                color: 'white',
                borderRadius: 16,
                padding: '20px 22px',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <CheckCircle2 size={22} color="white" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{empStats.myPendingTasks}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, marginTop: 6 }}>My Pending Tasks</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.95, marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⏱</span> {empStats.myOverdueTasks} Overdue
              </div>
            </div>
          </div>

          {/* Staff Upcoming SIP Debits Alert Banner */}
          {empStats.upcomingSipAlerts?.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: 18,
              padding: '16px 20px',
              marginBottom: 24,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                  }}>
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      My Upcoming SIP Debits (Next 3 Days)
                      <span style={{ fontSize: '0.72rem', background: '#3B82F6', color: 'white', fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                        {empStats.upcomingSipAlerts.length} Due
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 1 }}>
                      Your assigned clients with automated SIP debits scheduled within 3 days. Send 1-click WhatsApp balance reminders to prevent bounces!
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
                {empStats.upcomingSipAlerts.map(sip => (
                  <div
                    key={sip._id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{sip.name}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: sip.dueStatus === 'Today' ? '#FEE2E2' : (sip.dueStatus === 'Tomorrow' ? '#FEF3C7' : '#E0F2FE'),
                          color: sip.dueStatus === 'Today' ? '#DC2626' : (sip.dueStatus === 'Tomorrow' ? '#D97706' : '#0284C7'),
                        }}>
                          {sip.dueStatus} ({sip.sipDay}th)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                        {sip.schemeName} • <strong style={{ color: '#059669' }}>{sip.formattedAmount}/mo</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const cleanPhone = String(sip.phone).replace(/[^0-9]/g, '');
                        const finalPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                        const text = `Dear ${sip.name}, this is a gentle reminder from Investrow Financial Services that your monthly SIP of ${sip.formattedAmount} for ${sip.schemeName} is scheduled for debit on ${sip.sipDay}th. Kindly maintain sufficient bank balance to avoid ECS bounce charges. Happy Investing!`;
                        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      title="Send WhatsApp Balance Reminder"
                      style={{
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                        flexShrink: 0
                      }}
                    >
                      <Send size={12} /> Remind
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Middle Row: Today's Follow-ups & My Recent Leads */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}>
            {/* Left Card: Today's Follow-ups */}
            <div style={{
              background: 'white',
              borderRadius: 18,
              padding: 22,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Today&apos;s Follow-ups ({empStats.followUpsList?.length || 0})
                </h3>
                <button
                  onClick={() => router.push('/follow-ups')}
                  style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  View All
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Time</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!empStats.followUpsList || empStats.followUpsList.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 10px', textAlign: 'center', color: '#94A3B8' }}>
                          No follow-ups scheduled for today.
                        </td>
                      </tr>
                    ) : (
                      empStats.followUpsList.map((item, idx) => (
                      <tr key={item._id || idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '12px 10px', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.time}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>{item.name}</td>
                        <td style={{ padding: '12px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{item.product}</td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: item.status === 'Overdue' ? '#FEE2E2' : '#E0F2FE',
                            color: item.status === 'Overdue' ? '#DC2626' : '#0284C7'
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <button
                              onClick={() => {
                                setCallNumber(item.phone || '9876541234');
                                setShowCallModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Call Client"
                            >
                              <Phone size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setWhatsAppData({ phone: item.phone || '', name: item.name, template: 'followUp', customMsg: '' });
                                setShowWhatsAppModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Send WhatsApp"
                            >
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Card: My Recent Leads */}
            <div style={{
              background: 'white',
              borderRadius: 18,
              padding: 22,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  My Recent Leads
                </h3>
                <button
                  onClick={() => router.push('/leads')}
                  style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  View All
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Source</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!empStats.recentLeads || empStats.recentLeads.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 10px', textAlign: 'center', color: '#94A3B8' }}>
                          No recent leads assigned.
                        </td>
                      </tr>
                    ) : (
                      empStats.recentLeads.map((lead, idx) => {
                      let badgeBg = '#F1F5F9';
                      let badgeColor = '#475569';
                      if (lead.status === 'Interested') {
                        badgeBg = '#DCFCE7';
                        badgeColor = '#16A34A';
                      } else if (lead.status === 'Follow-up') {
                        badgeBg = '#FFEDD5';
                        badgeColor = '#EA580C';
                      } else if (lead.status === 'Contacted') {
                        badgeBg = '#E0F2FE';
                        badgeColor = '#0284C7';
                      } else if (lead.status === 'New') {
                        badgeBg = '#F3E8FF';
                        badgeColor = '#7E22CE';
                      }

                      return (
                        <tr key={lead._id || idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>{lead.name}</td>
                          <td style={{ padding: '12px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.source}</td>
                          <td style={{ padding: '12px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.product}</td>
                          <td style={{ padding: '12px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{lead.date}</td>
                          <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: badgeBg,
                              color: badgeColor
                            }}>
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Row: My Targets, My Tasks, Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}>
            {/* Card 1: My Targets (Sep 2026) */}
            <div style={{
              background: 'white',
              borderRadius: 18,
              padding: 22,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  My Targets ({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                </h3>
                <button
                  onClick={() => router.push('/analytics')}
                  style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  View Details
                </button>
              </div>

              {(empStats.targets || []).map((t, idx, arr) => (
                <div key={t.key || idx} style={{ marginBottom: idx === arr.length - 1 ? 0 : 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{t.label}</span>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        {t.current} / {t.target} {t.unit ? t.unit : ''}
                      </span>
                      <span style={{ fontWeight: 800, color: t.color, minWidth: 36, textAlign: 'right' }}>{t.percentage}%</span>
                    </div>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, t.percentage))}%`, height: '100%', background: t.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Card 2: My Tasks (5) */}
            <div style={{
              background: 'white',
              borderRadius: 18,
              padding: 22,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  My Tasks ({empStats.tasks?.length || 0})
                </h3>
                <button
                  onClick={() => router.push('/tasks')}
                  style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(!empStats.tasks || empStats.tasks.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No pending tasks.
                  </div>
                ) : (
                  empStats.tasks.map((t, idx) => {
                  const isDone = completedTasks[t._id || idx];
                  let dueBg = '#E0F2FE';
                  let dueColor = '#0284C7';
                  if (t.dueTag === 'Overdue') {
                    dueBg = '#FEE2E2';
                    dueColor = '#DC2626';
                  } else if (t.dueTag === 'Today') {
                    dueBg = '#FEF3C7';
                    dueColor = '#D97706';
                  }

                  return (
                    <div
                      key={t._id || idx}
                      onClick={() => setCompletedTasks(prev => ({ ...prev, [t._id || idx]: !prev[t._id || idx] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: 'pointer',
                        padding: '4px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isDone ? '2px solid #10B981' : (t.dueTag === 'Overdue' ? '2px solid #DC2626' : '2px solid #CBD5E1'),
                          background: isDone ? '#10B981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          {isDone && <Check size={13} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: isDone ? '#94A3B8' : '#1E293B',
                          textDecoration: isDone ? 'line-through' : 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          {t.title}
                        </span>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: dueBg,
                        color: dueColor,
                        whiteSpace: 'nowrap'
                      }}>
                        {t.dueTag}
                      </span>
                    </div>
                  );
                })
              )}
              </div>
            </div>

            {/* Card 3: Quick Actions (2x2 Grid) */}
            <div style={{
              background: 'white',
              borderRadius: 18,
              padding: 22,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Quick Actions
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                flex: 1
              }}>
                {/* Action 1: Add New Lead */}
                <button
                  onClick={() => setShowLeadModal(true)}
                  style={{
                    background: '#0EA5E9',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.28)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <UserPlus size={24} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Add New Lead</span>
                </button>

                {/* Action 2: Add Follow-up */}
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Calendar size={24} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Add Follow-up</span>
                </button>

                {/* Action 3: Call Client */}
                <button
                  onClick={() => setShowCallModal(true)}
                  style={{
                    background: '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Phone size={24} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Call Client</span>
                </button>

                {/* Action 4: Send WhatsApp */}
                <button
                  onClick={() => {
                    setWhatsAppData({ phone: '', name: 'Client', template: 'followUp', customMsg: '' });
                    setShowWhatsAppModal(true);
                  }}
                  style={{
                    background: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.28)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <MessageSquare size={24} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Quick Action Bar (Admin View Only) */}
      {dashboardMode === 'admin' && (
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
            onClick={() => setShowFollowUpModal(true)}
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
      )}

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

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: '#64748B' }}>
          <span>Knowledge</span>
          <span>|</span>
          <span>Service</span>
          <span>|</span>
          <span>Trust</span>
          <span>|</span>
          <span>Long-Term Growth</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
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

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-backdrop" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, borderRadius: 20 }}>
            <div className="modal-header" style={{ background: '#10B981', color: 'white', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} />
                <h3 className="modal-title" style={{ color: 'white', margin: 0, fontSize: '1.15rem' }}>
                  Schedule New Follow-up
                </h3>
              </div>
              <button onClick={() => setShowFollowUpModal(false)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp}>
              <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Priya Sinha"
                    value={followUpForm.name}
                    onChange={e => setFollowUpForm({ ...followUpForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Client Mobile Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={followUpForm.phone}
                    onChange={e => setFollowUpForm({ ...followUpForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={followUpForm.date}
                      onChange={e => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Interested Product</label>
                    <select
                      className="form-select"
                      value={followUpForm.service}
                      onChange={e => setFollowUpForm({ ...followUpForm, service: e.target.value })}
                    >
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="SIP">SIP</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Health Insurance">Health Insurance</option>
                      <option value="Demat">Demat</option>
                      <option value="FD & Bond">FD & Bond</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Remarks / Next Action</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Discuss monthly SIP allocation or portfolio rebalance..."
                    value={followUpForm.remarks}
                    onChange={e => setFollowUpForm({ ...followUpForm, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowFollowUpModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={followUpSaving} style={{ flex: 1, background: '#10B981', borderColor: '#10B981' }}>
                  {followUpSaving ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Call Modal */}
      {showCallModal && (
        <div className="modal-backdrop" onClick={() => setShowCallModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 20 }}>
            <div className="modal-header" style={{ background: '#6366F1', color: 'white', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={20} />
                <h3 className="modal-title" style={{ color: 'white', margin: 0, fontSize: '1.15rem' }}>
                  Call Client
                </h3>
              </div>
              <button onClick={() => setShowCallModal(false)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Phone size={28} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ textAlign: 'left' }}>Client Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Enter 10-digit number"
                  value={callNumber}
                  onChange={e => setCallNumber(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}
                />
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                Click below to launch mobile dialer or default call application.
              </p>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCallModal(false)} style={{ flex: 1 }}>
                Close
              </button>
              <a
                href={callNumber ? `tel:${callNumber}` : '#'}
                onClick={() => {
                  if (!callNumber) addToast('Please enter a phone number', 'error');
                  else setShowCallModal(false);
                }}
                className="btn btn-primary"
                style={{ flex: 1, background: '#6366F1', borderColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                <Phone size={16} /> Dial Call
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
