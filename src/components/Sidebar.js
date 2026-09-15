'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Users, UserCheck, TrendingUp, Shield, Layers,
  CalendarClock, Calendar, MessageSquare, BarChart3,
  FolderOpen, Settings, LogOut, Menu, X, Sprout
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Leads', staffLabel: 'My Leads', href: '/leads', icon: Users },
  { label: 'Clients', staffLabel: 'My Clients', href: '/clients', icon: UserCheck },
  { label: 'Follow-ups', href: '/follow-ups', icon: CalendarClock },
  { label: 'Tasks', href: '/tasks', icon: Layers },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Mutual Fund', href: '/clients?service=Mutual+Funds', icon: TrendingUp },
  { label: 'Insurance', href: '/clients?service=Life+Insurance', icon: Shield },
  { label: 'Documents', href: '/vault', icon: FolderOpen },
  { label: 'Communication', href: '/communication', icon: MessageSquare },
  { label: 'Reports', staffLabel: 'Reports (My)', href: '/analytics', icon: BarChart3 },
  { label: 'Employees', href: '/users', icon: Users, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed',
          top: 14,
          left: 12,
          zIndex: 101,
          background: '#0EA5E9',
          color: 'white',
          border: 'none',
          padding: 8,
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
        }}
      >
        <Menu size={22} />
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        style={{
          display: mobileOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99
        }}
      />

      <aside
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
      >
        {/* Brand Header with prominent authentic logo.png */}
        <div style={{
          padding: '14px 16px 14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
          background: '#FFFFFF',
          minHeight: 74
        }}>
          <a
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flex: 1,
              overflow: 'hidden',
              height: 62
            }}
          >
            <div style={{
              width: '100%',
              height: 62,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden'
            }}>
              <img
                src="/logo.png"
                alt="Investrow Financial Services"
                style={{
                  width: 240,
                  height: 240,
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                  marginLeft: -4
                }}
              />
            </div>
          </a>

          <button
            onClick={() => setMobileOpen(false)}
            style={{
              display: mobileOpen ? 'flex' : 'none',
              color: '#64748B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {navItems.map((item) => {
            if (item.adminOnly && user.role !== 'admin') return null;

            const Icon = item.icon;
            const itemLabel = (user.role === 'user' && item.staffLabel) ? item.staffLabel : item.label;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) || (item.label === 'Employees' && (pathname === '/users' || pathname === '/employees'));

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  boxShadow: isActive ? '0 4px 12px rgba(14, 165, 233, 0.28)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#F0F9FF';
                    e.currentTarget.style.color = '#0284C7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#FFFFFF' : '#0EA5E9'} />
                <span style={{ flex: 1 }}>{itemLabel}</span>
                {isActive && (
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#F97316',
                    boxShadow: '0 0 6px rgba(249, 115, 22, 0.8)'
                  }} />
                )}
              </a>
            );
          })}
        </nav>

        {/* Discipline Today Better Tomorrow Brand Card (Matching Staff Reference UI) */}
        <div style={{
          padding: '12px 14px',
          margin: '10px 12px',
          background: 'linear-gradient(135deg, #071E3D 0%, #0B2545 100%)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
        }}>
          {/* Chart Icon with Gold/Orange Accent */}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.35)',
            flexShrink: 0
          }}>
            <TrendingUp size={20} />
          </div>

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
              Discipline Today Better Tomorrow
            </div>
            <div style={{ fontSize: '0.66rem', color: '#38BDF8', fontWeight: 700, marginTop: 2 }}>
              INVESTROW • Financial Growth
            </div>
          </div>
        </div>

        {/* User Profile & Logout Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #F1F5F9',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.78rem',
              boxShadow: '0 2px 6px rgba(14, 165, 233, 0.25)'
            }}>
              {user.name?.charAt(0).toUpperCase() || 'B'}
            </div>
            <div style={{ lineHeight: 1.15, maxWidth: 130 }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              cursor: 'pointer',
              padding: 7,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.borderColor = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
