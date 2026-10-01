'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Search, UserPlus, Users, Link2, Check, AlertCircle, 
  IndianRupee, Calendar, Phone, CreditCard, Shield, Heart, UserCheck
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const RELATIONSHIPS = [
  'Spouse',
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'Child',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Head',
  'Other'
];

export default function AddFamilyMemberModal({
  isOpen,
  onClose,
  currentClient,
  onSuccess
}) {
  const { addToast } = useToast();
  const [mode, setMode] = useState('existing'); // 'existing' | 'manual'
  const [submitting, setSubmitting] = useState(false);

  // Existing mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [existingRelation, setExistingRelation] = useState('Spouse');

  // Manual mode state
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Spouse',
    phone: '',
    dateOfBirth: '',
    panNumber: '',
    sipAmount: 1000, // Default 1000 SIP as requested
    schemeName: 'Mutual Fund SIP',
    service: 'Mutual Funds',
  });

  const searchTimeoutRef = useRef(null);

  // Sync phone on open
  useEffect(() => {
    if (isOpen && currentClient) {
      setFormData(prev => ({
        ...prev,
        phone: currentClient.phone || '',
        relationship: 'Spouse',
        sipAmount: 1000,
        schemeName: 'Mutual Fund SIP'
      }));
      setExistingRelation('Spouse');
      setSelectedClient(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, currentClient]);

  // Live search debounced
  useEffect(() => {
    if (!isOpen || mode !== 'existing') return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(searchQuery.trim())}&response=Converted&limit=8`);
        const data = await res.json();
        const filtered = (data.leads || []).filter(l => String(l._id) !== String(currentClient?._id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, mode, isOpen, currentClient]);

  if (!isOpen || !currentClient) return null;

  const handleLinkExisting = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      addToast('Please search and select a client to link', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'existing',
          clientId: currentClient._id,
          targetClientId: selectedClient._id,
          relationship: existingRelation
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to link family member');
      }

      addToast(`Successfully linked ${selectedClient.name} as ${existingRelation}!`, 'success');
      if (onSuccess) onSuccess(data.family);
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Full name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          clientId: currentClient._id,
          relationship: formData.relationship,
          newMember: {
            ...formData,
            sipAmount: Number(formData.sipAmount) || 1000
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create and link family member');
      }

      addToast(`New family member ${formData.name} created and linked!`, 'success');
      if (onSuccess) onSuccess(data.family);
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 16
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 580,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        animation: 'modalFadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Add Family Member
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                Linking member for <strong style={{ color: '#0284C7' }}>{currentClient.name}</strong> ({currentClient.leadId || currentClient.clientCode || 'Client'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          padding: '6px',
          margin: '16px 24px 0',
          background: '#F1F5F9',
          borderRadius: 12,
          gap: 6
        }}>
          <button
            type="button"
            onClick={() => setMode('existing')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 9,
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: mode === 'existing' ? '#FFFFFF' : 'transparent',
              color: mode === 'existing' ? '#0284C7' : '#64748B',
              boxShadow: mode === 'existing' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={16} />
            Add Existing Client
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 9,
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: mode === 'manual' ? '#FFFFFF' : 'transparent',
              color: mode === 'manual' ? '#0284C7' : '#64748B',
              boxShadow: mode === 'manual' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            Manual Entry (New Client)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* MODE 1: ADD EXISTING */}
          {mode === 'existing' ? (
            <form onSubmit={handleLinkExisting} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Search Existing Client
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search by Name, Phone, INV-ID, PAN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    autoFocus
                  />
                  {searching && (
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#64748B' }}>
                      Searching...
                    </span>
                  )}
                </div>
              </div>

              {/* Search Results Dropdown List */}
              {searchResults.length > 0 && !selectedClient && (
                <div style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  maxHeight: 220,
                  overflowY: 'auto',
                  background: '#F8FAFC',
                  padding: 6
                }}>
                  {searchResults.map(client => (
                    <div
                      key={client._id}
                      onClick={() => {
                        setSelectedClient(client);
                        setSearchResults([]);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FFFFFF',
                        border: '1px solid #F1F5F9',
                        marginBottom: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: 10, marginTop: 2 }}>
                          <span>ID: <strong style={{ color: '#0284C7' }}>{client.leadId || client.clientCode}</strong></span>
                          <span>Phone: {client.phone || 'N/A'}</span>
                          {client.panNumber && <span>PAN: {client.panNumber}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          background: '#ECFDF5',
                          color: '#059669',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          ₹{Number(client.sipAmount || 0).toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Client Card */}
              {selectedClient && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                        {selectedClient.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: 1 }}>
                        {selectedClient.leadId || selectedClient.clientCode} • {selectedClient.phone || 'No phone'} • ₹{Number(selectedClient.sipAmount || 0).toLocaleString('en-IN')}/mo
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClient(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#15803D',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Relationship Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Relationship to {currentClient.name}
                </label>
                <select
                  value={existingRelation}
                  onChange={(e) => setExistingRelation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.95rem',
                    background: '#FFFFFF',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#1E293B'
                  }}
                >
                  {RELATIONSHIPS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  Selecting this will link their portfolio & SIP to this family chain.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedClient || submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: (!selectedClient || submitting) ? '#94A3B8' : '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: (!selectedClient || submitting) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: selectedClient ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                  }}
                >
                  <Link2 size={16} />
                  {submitting ? 'Linking...' : 'Link to Family Tree'}
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: MANUAL CREATION */
            <form onSubmit={handleCreateManual} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Devi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      background: '#FFFFFF',
                      outline: 'none',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  >
                    {RELATIONSHIPS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    placeholder="DD Mon YYYY / YYYY-MM-DD"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Monthly SIP Amount (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748B' }}>₹</span>
                    <input
                      type="number"
                      placeholder="1000"
                      value={formData.sipAmount}
                      onChange={(e) => setFormData({ ...formData, sipAmount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 30px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600 }}>Default: ₹1,000 / month</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Scheme Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBI Small Cap Fund / Mutual Fund SIP"
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: submitting ? '#94A3B8' : '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <UserPlus size={16} />
                  {submitting ? 'Creating...' : 'Create & Link to Family'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
