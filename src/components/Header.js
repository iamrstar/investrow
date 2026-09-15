'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search, Bell, Calendar, ChevronDown, LogOut, Settings, User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="top-nav-header" style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Search Input */}
      <div className="header-search-wrapper">
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8'
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search by Name, Mobile, Client ID, Folio, PAN..."
          style={{
            width: '100%',
            height: 42,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            paddingLeft: 42,
            paddingRight: 16,
            fontSize: '0.85rem',
            color: '#0f172a',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0ea5e9';
            e.target.style.background = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.background = '#f8fafc';
          }}
        />
      </div>

      {/* Right Elements */}
      <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Tagline & Date */}
        <div style={{
          textAlign: 'right',
          fontSize: '0.8rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }} className="header-tagline-block">
          <span style={{ fontStyle: 'italic', fontWeight: 600, color: '#0f172a' }}>
            &ldquo;Building Better Financial Futures&rdquo;
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontWeight: 500 }}>
            {todayStr}
          </span>
        </div>

        {/* Bell notification */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => router.push('/follow-ups')}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569'
          }}>
            <Bell size={18} />
          </div>
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#F97316',
            color: 'white',
            borderRadius: 10,
            fontSize: '0.7rem',
            fontWeight: 800,
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 5px rgba(249, 115, 22, 0.4)'
          }}>
            3
          </span>
        </div>

        {/* Calendar icon */}
        <div
          className="header-calendar-btn"
          onClick={() => router.push('/follow-ups')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            cursor: 'pointer'
          }}
          title="Open Calendar & Schedule"
        >
          <Calendar size={18} />
        </div>

        {/* User Profile dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 12,
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
            }}>
              {getInitials(user.name)}
            </div>

            <div className="header-user-info" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                {user.name || 'Birendra Kumar'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {user.role === 'admin' ? 'Director (Admin)' : (user.designation || 'Sales Executive')}
              </div>
            </div>

            <ChevronDown size={16} style={{ color: '#94a3b8' }} />
          </div>

          {/* Profile dropdown menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: 210,
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              padding: '6px',
              zIndex: 50
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Signed in as</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user.email}</div>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: '#334155',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  textAlign: 'left'
                }}
              >
                <Settings size={16} /> Account Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  textAlign: 'left'
                }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
