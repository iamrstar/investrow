'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search, Bell, Calendar, ChevronDown, LogOut, Settings, User,
  X, Loader2, ArrowRight, Phone, ShieldCheck, UserCheck, Sparkles, MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setSearchOpen(true);
      } catch (err) {
        console.error('Failed to search records:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 220);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  if (!user) return null;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const handleSelectResult = (item) => {
    setSearchOpen(false);
    const identifier = item.leadId || item.name || '';
    if (item.isClient) {
      router.push(`/clients?search=${encodeURIComponent(identifier)}`);
    } else {
      router.push(`/leads?search=${encodeURIComponent(identifier)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    searchInputRef.current?.focus();
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
      {/* Search Input with Instant Results Dropdown */}
      <div className="header-search-wrapper" ref={searchWrapperRef}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!searchOpen && e.target.value.trim()) setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by Name, Mobile, Client ID, Folio, PAN..."
            style={{
              width: '100%',
              height: 42,
              background: '#f8fafc',
              border: searchOpen ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
              borderRadius: 10,
              paddingLeft: 42,
              paddingRight: searchQuery ? 38 : 16,
              fontSize: '0.85rem',
              color: '#0f172a',
              outline: 'none',
              boxShadow: searchOpen ? '0 0 0 3px rgba(14, 165, 233, 0.12)' : 'none',
              transition: 'all 0.2s ease',
            }}
          />

          {/* Right Action: Loading indicator or Clear button */}
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 2,
          }}>
            {searchLoading ? (
              <Loader2 size={16} className="spinner" style={{ color: '#0ea5e9' }} />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Live Search Instant Dropdown */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: 'min(500px, 92vw)',
            maxHeight: '460px',
            overflowY: 'auto',
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            zIndex: 100,
            padding: '6px 0',
          }}>
            {/* Dropdown Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                {searchLoading ? 'Searching...' : `Found ${searchResults.length} Match${searchResults.length === 1 ? '' : 'es'}`}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Press <kbd style={{ padding: '1px 5px', background: '#e2e8f0', borderRadius: 4, fontSize: '0.7rem' }}>Enter</kbd> to search all
              </span>
            </div>

            {/* Results List */}
            {searchResults.length > 0 ? (
              <div style={{ padding: '4px 0' }}>
                {searchResults.map((item) => {
                  const initials = getInitials(item.name);
                  const isClient = item.isClient;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectResult(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        borderBottom: '1px solid #f8fafc',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Left: Avatar & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'white',
                          background: isClient
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                          boxShadow: isClient
                            ? '0 2px 6px rgba(16, 185, 129, 0.25)'
                            : '0 2px 6px rgba(14, 165, 233, 0.25)',
                        }}>
                          {initials}
                        </div>

                        {/* Text Details */}
                        <div style={{ minWidth: 0, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                              {item.name}
                            </span>

                            {/* ID Badge */}
                            {item.leadId && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                letterSpacing: '0.02em',
                              }}>
                                {item.leadId}
                              </span>
                            )}

                            {/* Stage / Type Badge */}
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background: isClient ? '#dcfce7' : '#e0f2fe',
                              color: isClient ? '#15803d' : '#0369a1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              {isClient ? <UserCheck size={11} /> : null}
                              {isClient ? 'Client' : (item.stage || item.response || 'Lead')}
                            </span>
                          </div>

                          {/* Sub-line: Phone, Scheme, City */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 3,
                            fontSize: '0.75rem',
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={11} style={{ color: '#94a3b8' }} />
                                {item.phone}
                              </span>
                            )}

                            {item.schemeName && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{
                                  color: '#0284c7',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 180,
                                }}>
                                  {item.schemeName}
                                </span>
                              </>
                            )}

                            {item.service && !item.schemeName && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{ color: '#64748b' }}>{item.service}</span>
                              </>
                            )}

                            {item.city && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <MapPin size={10} style={{ color: '#94a3b8' }} />
                                  {item.city}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Navigate Icon */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#94a3b8',
                        paddingLeft: 8,
                      }}>
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !searchLoading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                <Search size={24} style={{ color: '#cbd5e1', margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  No records found matching &ldquo;{searchQuery}&rdquo;
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  Check spelling or press Enter to search the full Leads database
                </div>
              </div>
            ) : null}

            {/* Dropdown Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderTop: '1px solid #f1f5f9',
              background: '#fafafa',
            }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Instant live search across Leads & Clients
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0ea5e9',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                View all in Leads <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
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
