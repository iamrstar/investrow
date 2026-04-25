'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, UserPlus, FileText, ListTodo,
  Activity, Settings, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = {
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { section: 'Management' },
    { label: 'Leads', href: '/leads', icon: FileText },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Tasks', href: '/tasks', icon: ListTodo },
    { label: 'Users', href: '/users', icon: Users },
    { section: 'Insights' },
    { label: 'Activity Log', href: '/activity', icon: Activity },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  manager: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { section: 'Management' },
    { label: 'Leads', href: '/leads', icon: FileText },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Tasks', href: '/tasks', icon: ListTodo },
    { section: 'Insights' },
    { label: 'Activity Log', href: '/activity', icon: Activity },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  user: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { section: 'My Work' },
    { label: 'My Leads', href: '/leads', icon: FileText },
    { label: 'My Clients', href: '/clients', icon: Users },
    { label: 'My Tasks', href: '/tasks', icon: ListTodo },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      const fetchCount = async () => {
        try {
          const res = await fetch('/api/leads/unassigned-count');
          const data = await res.json();
          if (data.count !== undefined) setUnassignedCount(data.count);
        } catch (err) {
          console.error('Failed to fetch unassigned count');
        }
      };
      
      fetchCount();
      // Optional: interval to keep it fresh
      const interval = setInterval(fetchCount, 60000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  const items = navItems[user.role] || navItems.user;

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{ position: 'fixed', top: 14, left: 12, zIndex: 101 }}>
        <Menu size={24} />
      </button>

      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.8rem', color: 'white', letterSpacing: '0.05em', flexShrink: 0,
          }}>CRM</div>
          <span className="sidebar-brand">Investrow</span>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            style={{ display: mobileOpen ? 'flex' : 'none', marginLeft: 'auto', color: 'white' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map((item, i) => {
            if (item.section) {
              return <div key={i} className="sidebar-section">{item.section}</div>;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const hasBadge = item.label === 'Tasks' && unassignedCount > 0;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon size={20} />
                  {hasBadge && (
                    <span style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid #1e293b',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {unassignedCount > 99 ? '99+' : unassignedCount}
                    </span>
                  )}
                </div>
                {item.label}
                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </a>
            );
          })}
        </nav>


        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button className="btn-ghost" onClick={logout} style={{ color: 'rgba(255,255,255,0.6)', padding: 6 }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
