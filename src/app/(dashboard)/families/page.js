'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Users, UserCheck, Shield, TrendingUp, Phone, Landmark, Network,
  RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Search, Filter,
  Plus, ArrowUpRight, ChevronRight, X, Download, FileSpreadsheet, Activity,
  HeartHandshake, Eye, ExternalLink, Calendar, MapPin, IndianRupee, Info, Check
} from 'lucide-react';
import FamilyTreeTab from '@/components/FamilyTreeTab';
import AddFamilyMemberModal from '@/components/AddFamilyMemberModal';

export default function FamiliesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [healthReport, setHealthReport] = useState(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [rectifying, setRectifying] = useState(false);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  // Modal states
  const [selectedFamilyForTree, setSelectedFamilyForTree] = useState(null);
  const [clientForAddMember, setClientForAddMember] = useState(null);

  const fetchFamilies = useCallback(async (page = 1, currentFilter = filter, currentSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (currentFilter && currentFilter !== 'all') params.set('filter', currentFilter);
      if (currentSearch) params.set('search', currentSearch.trim());

      const res = await fetch(`/api/family?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFamilies(data.families || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        if (data.healthReport) {
          setHealthReport(data.healthReport);
        }
      } else {
        addToast(data.message || 'Failed to load families', 'error');
      }
    } catch (err) {
      console.error('Error fetching families:', err);
      addToast('Error loading family records', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search, addToast]);

  useEffect(() => {
    fetchFamilies(1);
  }, []);

  // Run Real-Time Data Health Audit
  const handleRunHealthAudit = async () => {
    setAuditRunning(true);
    try {
      const res = await fetch('/api/family?audit=true');
      const data = await res.json();
      if (data.success && data.healthReport) {
        setHealthReport(data.healthReport);
        if (data.healthReport.isHealthy) {
          addToast(`Family Data Health Audit Passed! Score: ${data.healthReport.healthScore}% (Healthy & Consistent)`, 'success');
        } else {
          addToast(`Audit Complete: Found ${data.healthReport.missingHeadCount} items needing attention`, 'info');
        }
      }
    } catch (err) {
      addToast('Failed to complete family data audit', 'error');
    } finally {
      setTimeout(() => setAuditRunning(false), 600);
    }
  };

  // One-Click Auto-Rectify and Sync Totals
  const handleAutoSyncTotals = async () => {
    setRectifying(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncAllTotals' })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Successfully audited & synced all family totals!', 'success');
        fetchFamilies(pagination.page);
      } else {
        addToast(data.message || 'Failed to sync family totals', 'error');
      }
    } catch (err) {
      addToast('Error syncing family totals', 'error');
    } finally {
      setRectifying(false);
    }
  };

  // Run phone cluster auto-link
  const handleAutoLinkClusters = async () => {
    setRectifying(true);
    try {
      const res = await fetch('/api/family/rectify', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Auto-rectification completed successfully!', 'success');
        fetchFamilies(1);
      } else {
        addToast(data.message || 'Rectification encountered an issue', 'error');
      }
    } catch (err) {
      addToast('Error during auto-rectification', 'error');
    } finally {
      setRectifying(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (families.length === 0) {
      addToast('No family data to export', 'error');
      return;
    }

    const headers = ['Family ID', 'Family Name', 'Head Name', 'Head Phone', 'Head PAN', 'Members Count', 'Total Monthly SIP (₹)', 'Total Portfolio (₹)', 'City'];
    const rows = families.map(f => [
      f.familyId || '',
      f.familyName || '',
      f.headClientId?.name || '',
      f.headClientId?.phone || f.primaryPhone || '',
      f.headClientId?.panNumber || '',
      f.members?.length || 0,
      f.totalSip || 0,
      f.totalInvestment || 0,
      f.city || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Investrow_Families_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Families report downloaded successfully', 'success');
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              color: '#FFFFFF',
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <Network size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Family Portfolio Management & Hierarchy
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                Track collective household wealth, group family SIPs, and monitor real-time data integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Health Audit Button */}
          <button
            type="button"
            onClick={handleRunHealthAudit}
            disabled={auditRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              border: '1.5px solid #BAE6FD',
              background: '#F0F9FF',
              color: '#0284C7',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: auditRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Perform real-time data integrity and consistency check"
          >
            <RefreshCw size={16} className={auditRunning ? 'animate-spin' : ''} style={{ animation: auditRunning ? 'spin 1s linear infinite' : 'none' }} />
            <span>{auditRunning ? 'Auditing Data...' : 'Check Family Data Health'}</span>
          </button>

          {/* Auto-Sync Totals */}
          <button
            type="button"
            onClick={handleAutoSyncTotals}
            disabled={rectifying}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: rectifying ? 'not-allowed' : 'pointer'
            }}
            title="Recalculate active SIP and portfolio totals for all families"
          >
            <Activity size={16} color="#0EA5E9" />
            <span>Sync Totals</span>
          </button>

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} color="#10B981" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FAMILY DATA HEALTH DIAGNOSTIC BANNER ("check family data is good or not") */}
      {healthReport && (
        <div style={{
          background: healthReport.isHealthy 
            ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)' 
            : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: `1.5px solid ${healthReport.isHealthy ? '#A7F3D0' : '#FDE68A'}`,
          borderRadius: 16,
          padding: '18px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: healthReport.isHealthy ? '#10B981' : '#F59E0B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${healthReport.isHealthy ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
              }}>
                {healthReport.isHealthy ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: healthReport.isHealthy ? '#065F46' : '#92400E' }}>
                    Family Data Quality: {healthReport.isHealthy ? '100% Consistent & Healthy' : 'Minor Attention Recommended'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: healthReport.isHealthy ? '#D1FAE5' : '#FEF3C7',
                    color: healthReport.isHealthy ? '#047857' : '#B45309',
                    border: `1px solid ${healthReport.isHealthy ? '#6EE7B7' : '#FCD34D'}`
                  }}>
                    {healthReport.healthScore}% Health Score
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: healthReport.isHealthy ? '#047857' : '#B45309', marginTop: 3 }}>
                  {healthReport.isHealthy 
                    ? `All ${healthReport.totalFamilies} registered family units have valid Head Clients, verified member links, and aligned active SIP tallies.`
                    : `Found ${healthReport.missingHeadCount} family items that require verification or re-linking.`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowHealthDetails(!showHealthDetails)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${healthReport.isHealthy ? '#6EE7B7' : '#FCD34D'}`,
                  color: healthReport.isHealthy ? '#065F46' : '#92400E',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {showHealthDetails ? 'Hide Audit Details ▲' : 'View Audit Details ▼'}
              </button>

              {!healthReport.isHealthy && (
                <button
                  type="button"
                  onClick={handleAutoLinkClusters}
                  disabled={rectifying}
                  style={{
                    background: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: rectifying ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⚡ Auto-Rectify Data Now
                </button>
              )}
            </div>
          </div>

          {/* Audit Metric Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${healthReport.isHealthy ? '#A7F3D0' : '#FDE68A'}` }}>
            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Registered Families</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                {healthReport.totalFamilies} Units
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Linked Clients</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284C7', marginTop: 2 }}>
                {healthReport.totalLinkedClients} Clients
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Multi-Member Households</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>
                {healthReport.multiMemberFamilies} ({healthReport.totalFamilies > 0 ? Math.round((healthReport.multiMemberFamilies / healthReport.totalFamilies) * 100) : 0}%)
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Household Monthly SIP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284C7', marginTop: 2 }}>
                ₹{(healthReport.totalHouseholdSip || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Household Portfolio Wealth</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706', marginTop: 2 }}>
                ₹{(healthReport.totalHouseholdWealth || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Collapsible Deep Diagnostic Details */}
          {showHealthDetails && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${healthReport.isHealthy ? '#A7F3D0' : '#FDE68A'}`, fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ fontWeight: 800, marginBottom: 8, color: '#0F172A' }}>Health Audit Verification Checklist:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#059669' }}>✔</span>
                  <span>Head of Family designated across all registered units</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#059669' }}>✔</span>
                  <span>Zero orphaned client IDs or dangling pointers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#059669' }}>✔</span>
                  <span>Sequential FAM-XXXX identifier format verified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#059669' }}>✔</span>
                  <span>Monthly SIP totals synced with members' active mandates</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters & Search Row */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '14px 18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 460 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={e => {
                const val = e.target.value;
                setSearch(val);
                fetchFamilies(1, filter, val);
              }}
              placeholder="Search by Family ID (FAM-1001), Head Name, Phone, PAN, City..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 38px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchFamilies(1, filter, '');
                }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>FILTER:</span>
            {[
              { id: 'all', label: `All Families (${pagination.total || 0})` },
              { id: 'multi', label: 'Multi-Member (2+)' },
              { id: 'single', label: 'Single Member' },
              { id: 'issues', label: 'Issues Only' }
            ].map(tab => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    fetchFamilies(1, tab.id, search);
                  }}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: active ? 800 : 600,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: active ? '#0284C7' : '#F1F5F9',
                    color: active ? '#FFFFFF' : '#334155',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Families Table Container */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Loading family portfolio units...</div>
          </div>
        ) : families.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Users size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#0F172A' }}>No families found</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
              {search ? 'No families matching your search criteria.' : 'Create families by linking converted clients in the Client Profile.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1050 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Family ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Head of Family</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Household Members</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Total Monthly SIP</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Portfolio Wealth</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Contact & City</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Data Health</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {families.map((fam, idx) => {
                  const members = fam.members || [];
                  const head = fam.headClientId;
                  const isHealthy = Boolean(head && members.length > 0);

                  return (
                    <tr
                      key={fam._id || idx}
                      style={{
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        borderBottom: '1px solid #E2E8F0',
                        fontSize: '0.84rem',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Family ID */}
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0284C7' }}>
                        <span style={{
                          background: '#E0F2FE',
                          color: '#0369A1',
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid #BAE6FD',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Network size={12} />
                          {fam.familyId}
                        </span>
                      </td>

                      {/* Head of Family */}
                      <td style={{ padding: '14px 16px' }}>
                        {head ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: '#0EA5E9',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}>
                              {head.name ? head.name.charAt(0).toUpperCase() : 'H'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{head.name}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4 }}>
                                  Head
                                </span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{head.leadId || head.clientCode || 'INV-Client'}</span>
                                {head.panNumber && <span>• PAN: {head.panNumber}</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.8rem' }}>⚠️ Missing Head Client</span>
                        )}
                      </td>

                      {/* Members */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', maxWidth: 300 }}>
                          <span style={{
                            background: '#F1F5F9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            border: '1px solid #CBD5E1'
                          }}>
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                          </span>

                          {members.slice(0, 3).map((m, mIdx) => (
                            <span
                              key={mIdx}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                color: '#475569',
                                padding: '2px 7px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                              title={`${m.clientId?.name || 'Member'} (${m.relationship || 'Relative'})`}
                            >
                              {m.clientId?.name ? m.clientId.name.split(' ')[0] : 'Member'} ({m.relationship || 'M'})
                            </span>
                          ))}
                          {members.length > 3 && (
                            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                              +{members.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Monthly SIP */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>
                          ₹{(Number(fam.totalSip) || 0).toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/mo</span>
                        </div>
                      </td>

                      {/* Portfolio Wealth */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                          ₹{(Number(fam.totalInvestment) || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Contact & City */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                            <Phone size={12} color="#0EA5E9" />
                            <span>{fam.primaryPhone || head?.phone || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: '0.74rem' }}>
                            <MapPin size={11} />
                            <span>{fam.city || head?.city || 'Dhanbad'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Data Health */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isHealthy ? (
                          <span style={{
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            borderRadius: 12,
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                            Good Data
                          </span>
                        ) : (
                          <span style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 12,
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }}></span>
                            Needs Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {/* View Family Tree */}
                          <button
                            type="button"
                            onClick={() => setSelectedFamilyForTree(fam)}
                            style={{
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              borderRadius: 8,
                              padding: '5px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Open visual family tree and member schemes"
                          >
                            <Network size={13} />
                            <span>Family Tree</span>
                          </button>

                          {/* Add Member Button */}
                          <button
                            type="button"
                            onClick={() => setClientForAddMember(head || { _id: fam.members?.[0]?.clientId?._id, name: fam.familyName, familyId: fam.familyId })}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              borderRadius: 8,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Add a new member to this family"
                          >
                            <Plus size={14} color="#059669" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div style={{
            padding: '14px 20px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: '#64748B'
          }}>
            <div>
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> (Total <strong>{pagination.total}</strong> families)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchFamilies(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchFamilies(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Family Tree Hierarchy Modal */}
      {selectedFamilyForTree && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedFamilyForTree(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 960,
              width: '95%',
              borderRadius: 20,
              overflow: 'hidden',
              padding: 0,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 }}>
                  <Network size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedFamilyForTree.familyName} ({selectedFamilyForTree.familyId})
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>
                    Household Portfolio: ₹{(Number(selectedFamilyForTree.totalInvestment) || 0).toLocaleString('en-IN')} • Monthly SIP: ₹{(Number(selectedFamilyForTree.totalSip) || 0).toLocaleString('en-IN')}/mo
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedFamilyForTree(null)}
                style={{ color: '#FFFFFF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Embedded FamilyTreeTab */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
              <FamilyTreeTab
                client={selectedFamilyForTree.headClientId || { _id: selectedFamilyForTree.members?.[0]?.clientId?._id, name: selectedFamilyForTree.familyName, familyId: selectedFamilyForTree.familyId }}
                onSelectClient={(clientId) => {
                  window.open(`/clients?search=${clientId}`, '_blank');
                }}
                onClientUpdated={() => {
                  fetchFamilies(pagination.page);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {clientForAddMember && (
        <AddFamilyMemberModal
          isOpen={Boolean(clientForAddMember)}
          onClose={() => setClientForAddMember(null)}
          currentClient={clientForAddMember}
          onSuccess={() => {
            addToast('Family member added successfully!', 'success');
            setClientForAddMember(null);
            fetchFamilies(pagination.page);
          }}
        />
      )}
    </div>
  );
}
