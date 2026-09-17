'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ScheduleEventModal from '@/components/ScheduleEventModal';
import ClientDocumentsModal from '@/components/ClientDocumentsModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import {
  Plus, Search, Eye, Edit, Trash2, UserPlus, Phone,
  Filter, FileText, ChevronLeft, ChevronRight, X, Mail, Send, Activity,
  MoreVertical, Users, Clock, CheckCircle, Video, Calendar,
  CalendarClock, User, TrendingUp, Shield, ArrowUpRight, Upload, AlertCircle, IndianRupee
} from 'lucide-react';

const SERVICES = [
  'Mutual Funds', 'Life Insurance', 'Health Insurance', 'Tax Planning',
  'General Insurance', 'FD & Bond', 'Stock Market & Demat', 'NPS',
];

const SIP_DAYS = [1, 5, 7, 10, 15, 20, 25, 28];
const TENURE_OPTIONS = [1, 3, 5, 7, 10, 15, 20];

export default function ClientsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterCallStatus, setFilterCallStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignClient, setAssignClient] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [clientDetailTab, setClientDetailTab] = useState('overview');
  const [mfTab, setMfTab] = useState('portfolio');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailClient, setEmailClient] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [filterDate, setFilterDate] = useState('');
  const [activeMenuClient, setActiveMenuClient] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsClient, setDocumentsClient] = useState(null);
  const [documentDefaultName, setDocumentDefaultName] = useState('');
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksClient, setTasksClient] = useState(null);
  const [assignRole, setAssignRole] = useState(''); // 'user'
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customEmailData, setCustomEmailData] = useState({ subject: '', content: '' });
  const [formSettings, setFormSettings] = useState(null);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showScheduleMeet, setShowScheduleMeet] = useState(false);
  const [scheduleClient, setScheduleClient] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const openUploadFor = (docLabel) => {
    setDocumentDefaultName(docLabel);
    setDocumentsClient(detailData?.lead || null);
    setShowDocumentsModal(true);
  };

  const handleQuickKycChange = async (newKycStatus) => {
    if (!detailData?.lead?._id) return;
    try {
      const res = await fetch(`/api/leads/${detailData.lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: newKycStatus }),
      });
      if (!res.ok) throw new Error('Failed to update KYC status');
      addToast(`KYC status updated to ${newKycStatus}`, 'success');
      viewDetail(detailData.lead._id);
      fetchClients(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleActivity = (id) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const canCreate = user?.role === 'admin' || user?.role === 'user';
  const canEdit = user?.role === 'admin';
  const canAssign = user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page, 
        limit: 15,
        response: 'Converted' // Force filter to only show Converted leads (Clients)
      });
      if (search) params.set('search', search);
      if (filterService) params.set('service', filterService);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (filterDate) params.set('followUpDate', filterDate);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setClients(data.leads || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      addToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterCallStatus, filterUser, filterDate, startDate, endDate, addToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetch('/api/form-control?type=client&t=' + Date.now()).then(r => r.json()).then(data => {
      if (data.success) setFormSettings(data.settings);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (canAssign) {
      fetch('/api/users?role=user').then(r => r.json()).then(d => setTeamUsers(d.users || []));
    }
  }, [canAssign]);

  const handleSaveClient = async (formData) => {
    try {
      const isEdit = !!(editingClient || formData?._id);
      const clientId = editingClient?._id || formData?._id;

      if (isEdit && editingClient && !confirm('Are you sure you want to update this client?')) return;
      
      const url = isEdit ? `/api/leads/${clientId}` : '/api/leads';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, response: 'Converted' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      addToast(editingClient ? 'Client updated!' : 'Client created!', 'success');
      setShowModal(false);
      setEditingClient(null);
      fetchClients(pagination.page);
      if (showDetail && (String(showDetail) === String(clientId))) {
        viewDetail(clientId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client record?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      addToast('Client deleted', 'success');
      fetchClients(pagination.page);
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleAssign = async (clientId, userId) => {
    try {
      const res = await fetch(`/api/leads/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast('Client assigned!', 'success');
      setShowAssignModal(false);
      setAssignClient(null);
      setAssignRole('');
      fetchClients(pagination.page);
    } catch {
      addToast('Failed to assign', 'error');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load details');
      setDetailData(data);
      setShowDetail(id);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendEmail = async (templateType) => {
    if (!emailClient?.email) {
      addToast('Client does not have an email address', 'error');
      return;
    }

    if (templateType === 'custom' && (!customEmailData.subject || !customEmailData.content)) {
      addToast('Please fill in both subject and message', 'error');
      return;
    }

    setEmailSending(true);
    try {
      const payload = { leadId: emailClient._id, templateType };
      if (templateType === 'custom') {
        payload.subject = customEmailData.subject;
        payload.content = customEmailData.content;
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      addToast('Email sent successfully!', 'success');
      setShowEmailModal(false);
      setShowCustomEmail(false);
      setCustomEmailData({ subject: '', content: '' });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterService) params.set('service', filterService);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('response', 'Converted');
      params.set('limit', '1000'); // Get all
      
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      const exportClients = data.leads || [];
      
      if (exportClients.length === 0) return addToast('No data to export', 'error');

      // Simple CSV export
      const headers = ['Name', 'Phone', 'Email', 'Service', 'Call Status', 'Assigned To', 'Follow-up Date', 'Remarks', 'Created At'];
      const csvData = exportClients.map(l => [
        l.name,
        l.phone,
        l.email || '',
        l.service,
        l.callStatus,
        l.assignedTo?.name || 'Unassigned',
        l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
        (l.remarks || '').replace(/,/g, ';'),
        new Date(l.createdAt).toLocaleDateString()
      ]);

      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Clients_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Report downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to generate report', 'error');
    }
  };

  const RenderClientActions = ({ client }) => (
    <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          window.location.href = `tel:${client.phone}`; 
        }}
        title="Call Now"
        style={{ color: '#059669', border: '1px solid #A7F3D0', background: '#ECFDF5', borderRadius: 8, padding: '6px 8px' }}
      >
        <Phone size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
          const msg = encodeURIComponent(`Hello ${client.name}, this is from Investrow Financial Services.`);
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
        }}
        title="Chat on WhatsApp"
        style={{ color: '#16A34A', border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: 8, padding: '6px 8px' }}
      >
        <Send size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          viewDetail(client._id); 
        }}
        title="View Client Profile"
        style={{ color: '#475569', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '6px 8px' }}
      >
        <Eye size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setEditingClient(client); 
          setShowModal(true); 
        }}
        title="Edit Client Details"
        style={{ color: '#0EA5E9', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '6px 8px' }}
      >
        <Edit size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setActiveMenuClient(client); 
        }} 
        title="More Actions"
        style={{ color: '#64748B', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '6px 8px' }}
      >
        <MoreVertical size={15} />
      </button>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Client Management
        </h1>
        {canCreate && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline add-lead-btn" onClick={() => setShowBulkUpload(true)}>
              <Plus size={20} /> <span>Bulk Upload</span>
            </button>
            <button className="btn btn-primary add-lead-btn" onClick={() => { setEditingClient(null); setShowModal(true); }}>
              <Plus size={20} /> <span>Add Client</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filters-scroll-row">
          <select className="form-select" value={filterService} onChange={e => setFilterService(e.target.value)}>
            <option value="">All Services</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select className="form-select" value={filterCallStatus} onChange={e => setFilterCallStatus(e.target.value)}>
            <option value="">All Call Status</option>
            <option value="Received">Received</option>
            <option value="Not Received">Not Received</option>
            <option value="Pending">Pending</option>
          </select>
          
          {/* User Filters for Admin */}
          {user?.role === 'admin' && (
            <select className="form-select" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">All Users</option>
              {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>FROM</span>
            <input type="date" className="form-input" style={{ width: 120, height: 36, padding: '0 8px', fontSize: '0.8rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>TO</span>
            <input type="date" className="form-input" style={{ width: 120, height: 36, padding: '0 8px', fontSize: '0.8rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <button className="btn btn-outline" onClick={handleDownloadReport} title="Download Report">
            <FileText size={18} /> Export
          </button>
        </div>

        {/* Quick Follow-up Preset Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <CalendarClock size={14} color="var(--secondary)" />
            <span>FOLLOW-UP PRESETS:</span>
          </div>
          {[
            { id: 'all', label: 'All Dates' },
            { id: '7days', label: 'Next 7 Days', days: 7 },
            { id: '1month', label: '1 Month', days: 30 },
            { id: '2months', label: '2 Months', days: 60 },
            { id: '3months', label: '3 Months', days: 90 },
            { id: '6months', label: '6 Months', days: 180 },
            { id: 'today', label: 'Today', days: 0 },
          ].map(p => {
            return (
              <button
                key={p.id}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  if (p.id === 'all') {
                    setStartDate('');
                    setEndDate('');
                    setFilterDate('');
                  } else if (p.id === 'today') {
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(start.toISOString().split('T')[0]);
                    setFilterDate('');
                  } else {
                    const end = new Date(start.getTime() + p.days * 24 * 60 * 60 * 1000);
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(end.toISOString().split('T')[0]);
                    setFilterDate('');
                  }
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 20,
                  height: 28,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {filterDate && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: 'var(--secondary-50)', 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid var(--secondary-100)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'var(--secondary)', color: 'white', borderRadius: 8 }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Showing scheduled items for:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary-dark)' }}>{new Date(filterDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setFilterDate('')}>
            <X size={16} /> Clear Date Filter
          </button>
        </div>
      )}


      {/* Unified Spreadsheet (Sheet) View */}
      <div className="sheet-container">
        {loading ? (
          <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div>
        ) : clients.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h3>No clients found</h3><p>Convert your leads to see them here</p></div>
        ) : (
          <table className="sheet-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone / Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>City</th>
                <th>Pan Number</th>
                <th>Pincode</th>
                <th>Date Of Birth</th>
                <th>Service</th>
                <th>Call Status</th>
                <th>Assigned To</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => {
                const clientIdStr = client.leadId || `INV-${1000 + (pagination.page - 1) * pagination.limit + index + 1}`;
                return (
                  <tr 
                    key={client._id}
                    onClick={() => viewDetail(client._id)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    title="Click to view client profile"
                  >
                    <td data-label="ID" style={{ fontWeight: 700, color: '#0EA5E9', fontSize: '0.85rem' }}>
                      {clientIdStr}
                    </td>
                    <td className="lead-name" data-label="Name" style={{ fontWeight: 700, color: '#0F172A' }}>
                      {client.name}
                    </td>
                    <td data-label="Phone / Mobile">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} style={{ color: '#0EA5E9' }} />
                        <span style={{ fontWeight: 600 }}>{client.phone}</span>
                      </div>
                    </td>
                    <td data-label="Email">{client.email || '—'}</td>
                    <td data-label="Address">{client.address || '—'}</td>
                    <td data-label="City">{client.city || '—'}</td>
                    <td data-label="Pan Number" style={{ fontWeight: 600 }}>{client.panNumber || '—'}</td>
                    <td data-label="Pincode">{client.pincode || '—'}</td>
                    <td data-label="Date Of Birth">{client.dateOfBirth || '—'}</td>
                    <td data-label="Service"><span className="badge badge-blue">{client.service || '—'}</span></td>
                    <td data-label="Call Status">
                      <span className={`badge ${client.callStatus === 'Received' ? 'badge-green' : client.callStatus === 'Not Received' ? 'badge-red' : 'badge-gray'}`}>
                        {client.callStatus || 'Received'}
                      </span>
                    </td>
                    <td data-label="Assigned To">{client.assignedTo?.name || '—'}</td>
                    <td data-label="Follow-up">
                      {client.followUpDate ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterDate(client.followUpDate.split('T')[0]);
                          }}
                          style={{ 
                            background: '#FFF7ED', 
                            border: '1px solid #FED7AA',
                            color: '#EA580C',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}
                        >
                          {new Date(client.followUpDate).toLocaleDateString()}
                        </button>
                      ) : '—'}
                    </td>
                    <td data-label="Actions" onClick={e => e.stopPropagation()}>
                      <RenderClientActions client={client} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={fetchClients} />


      {/* Assign Modal */}
      {showAssignModal && assignClient && (
        <div className="modal-backdrop" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Client</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                Assign <strong>{assignClient.name}</strong> to:
              </p>
              
              {!assignRole ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setAssignRole('user')} style={{ flexDirection: 'column', padding: '24px 12px', height: 'auto', gap: 12 }}>
                    <UserPlus size={24} /> <span>User / Staff</span>
                  </button>
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAssignRole('')} style={{ marginBottom: 16, padding: 0 }}>
                    ← Back to role selection
                  </button>
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AssignmentList 
                      role={assignRole} 
                      onSelect={(userId) => handleAssign(assignClient._id, userId)} 
                      currentUser={user}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailClient && (
        <div className="modal-backdrop" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Push Email Notification</h3>
              <button className="modal-close" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              {!showCustomEmail ? (
                <>
                  <p style={{ marginBottom: 20 }}>Choose a meaningful email scenario for <strong>{emailClient.name}</strong>:</p>
                  
                  <div style={{ display: 'grid', gap: 12 }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                      onClick={() => handleSendEmail('sipReminder')}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                          <Send size={16} /> SIP Investment Reminder
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Encourage client to start their monthly investment for {emailClient.service}.
                        </div>
                      </div>
                    </button>

                    <button 
                      className="btn btn-outline" 
                       style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                      onClick={() => handleSendEmail('followUp')}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary)' }}>
                          <Send size={16} /> General Follow-up
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          A professional check-in to see if they are ready to proceed.
                        </div>
                      </div>
                    </button>

                    <button 
                      className="btn btn-outline" 
                      style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--secondary)', background: 'var(--secondary-50)' }}
                      onClick={() => setShowCustomEmail(true)}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-dark)' }}>
                          <Edit size={16} /> Custom Email Message
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Type your own subject and message for this client.
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCustomEmail(false)} style={{ padding: 0, alignSelf: 'flex-start' }}>
                    ← Back to templates
                  </button>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input 
                      className="form-input" 
                      value={customEmailData.subject} 
                      onChange={e => setCustomEmailData({ ...customEmailData, subject: e.target.value })}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message Content</label>
                    <textarea 
                      className="form-textarea" 
                      value={customEmailData.content} 
                      onChange={e => setCustomEmailData({ ...customEmailData, content: e.target.value })}
                      placeholder="Type your message here..."
                      style={{ minHeight: 200 }}
                    />
                  </div>
                  <button 
                    className="btn btn-primary btn-block" 
                    onClick={() => handleSendEmail('custom')}
                    disabled={emailSending}
                  >
                    <Send size={18} /> Send Custom Email
                  </button>
                </div>
              )}

              {!emailClient.email && (
                <div style={{ marginTop: 16, padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <X size={16} /> This client is missing an email address.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* Email Sending Loader */}
      {emailSending && <LogoLoader message="Pushing Email Notification..." />}


      {/* Schedule Call Modal */}
      {showScheduleCall && scheduleClient && (
        <ScheduleEventModal
          lead={scheduleClient}
          type="Call"
          onClose={() => { setShowScheduleCall(false); setScheduleClient(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleClient._id,
                  type: 'Call',
                  assignedTo: scheduleClient.assignedTo?._id || scheduleClient.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule call');
              addToast('Call scheduled successfully!', 'success');
              setShowScheduleCall(false);
              setScheduleClient(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}

      {/* Schedule Meet Modal */}
      {showScheduleMeet && scheduleClient && (
        <ScheduleEventModal
          lead={scheduleClient}
          type="Meeting"
          onClose={() => { setShowScheduleMeet(false); setScheduleClient(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleClient._id,
                  type: 'Meeting',
                  assignedTo: scheduleClient.assignedTo?._id || scheduleClient.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule meeting');
              addToast('Meeting scheduled successfully!', 'success');
              setShowScheduleMeet(false);
              setScheduleClient(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}


      {/* Action Menu (Bottom Sheet) */}
      {activeMenuClient && (
        <ActionMenu 
          client={activeMenuClient}
          onClose={() => setActiveMenuClient(null)}
          onAction={(action) => {
            setActiveMenuClient(null);
            switch(action) {
              case 'view': viewDetail(activeMenuClient._id); break;
              case 'documents': setDocumentsClient(activeMenuClient); setShowDocumentsModal(true); break;
              case 'tasks': setTasksClient(activeMenuClient); setShowTasksModal(true); break;
              case 'schedule_call': setScheduleClient(activeMenuClient); setShowScheduleCall(true); break;
              case 'schedule_meet': setScheduleClient(activeMenuClient); setShowScheduleMeet(true); break;
              case 'history': viewDetail(activeMenuClient._id); break;
              case 'email': setEmailClient(activeMenuClient); setShowEmailModal(true); break;
              case 'edit': setEditingClient(activeMenuClient); setShowModal(true); break;
              case 'assign': setAssignClient(activeMenuClient); setShowAssignModal(true); break;
              case 'delete': handleDelete(activeMenuClient._id); break;
            }
          }}
          canAssign={canAssign}
          canDelete={canDelete}
          canEdit={canEdit}
        />
      )}

      <>
        {showDetail && detailData && (
          <div className="modal-backdrop" onClick={() => setShowDetail(null)}>
            <div 
              className="modal" 
              onClick={e => e.stopPropagation()} 
              style={{ 
                maxWidth: 960, 
                width: '95%',
                borderRadius: 24, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column', 
                maxHeight: '92vh',
                background: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Client Profile Header (Panel 7) */}
              <div style={{ 
                padding: '24px 28px', 
                background: '#FFFFFF', 
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.4rem', 
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                  }}>
                    {detailData.lead?.name ? detailData.lead.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {detailData.lead?.name || 'Client Details'}
                      </h2>
                      <span style={{ 
                        background: '#ECFDF5', 
                        color: '#059669', 
                        border: '1px solid #A7F3D0',
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '2px 10px', 
                        borderRadius: 12 
                      }}>
                        Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.85rem', color: '#64748B', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#0EA5E9' }}>
                        {detailData.lead?.leadId || '—'}
                      </span>
                      <span>•</span>
                      <span>{detailData.lead?.phone || '—'}</span>
                      {detailData.lead?.email && (
                        <>
                          <span>•</span>
                          <span>{detailData.lead.email}</span>
                        </>
                      )}
                      {(detailData.lead?.city || detailData.lead?.location) && (
                        <>
                          <span>•</span>
                          <span>{detailData.lead.city || detailData.lead.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => {
                      setEditingClient(detailData.lead);
                      setShowModal(true);
                    }}
                    style={{ 
                      borderRadius: 10, 
                      padding: '8px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      color: '#0EA5E9',
                      borderColor: '#0EA5E9'
                    }}
                  >
                    <Edit size={16} /> Edit Client
                  </button>
                  <button className="modal-close" onClick={() => setShowDetail(null)} style={{ padding: 8 }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                padding: '12px 28px', 
                background: '#F8FAFC', 
                borderBottom: '1px solid #E2E8F0',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'kyc', label: 'KYC & Documents' },
                  { id: 'investments', label: 'Mutual Fund / Investment' },
                  { id: 'services', label: 'Other Services' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'activities', label: 'Activities' },
                ].map(tab => {
                  const isActive = clientDetailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClientDetailTab(tab.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: isActive ? '1px solid #0EA5E9' : '1px solid transparent',
                        background: isActive ? '#0EA5E9' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body with Multi-Tab Content */}
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px 28px', background: '#FFFFFF' }}>
                
                {/* TAB 1: OVERVIEW */}
                {clientDetailTab === 'overview' && (() => {
                  const allDocs = [
                    ...(detailData.lead?.onboardingData || []).filter(d => d.value && String(d.value).startsWith('/uploads/')).map(d => ({
                      name: d.label,
                      url: d.value
                    })),
                    ...(detailData.lead?.documents || []).map(d => ({
                      name: d.name,
                      url: d.url
                    }))
                  ];
                  const pDoc = allDocs.find(d => /pan/i.test(d.name));
                  const aDoc = allDocs.find(d => /aadhaar|adhar/i.test(d.name));
                  const bDoc = allDocs.find(d => /bank|cheque|mandate/i.test(d.name));

                  return (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, alignItems: 'stretch' }}>
                        
                        {/* Card 1: Personal & Contact Details */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Personal Details
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Identity & Contact</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#0EA5E9', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>DOB</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.dateOfBirth ? (detailData.lead.dateOfBirth.includes('T') ? detailData.lead.dateOfBirth.split('T')[0] : detailData.lead.dateOfBirth) : '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>PAN Number</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0F172A', fontWeight: 800, letterSpacing: '0.04em' }}>
                                  {detailData.lead?.panNumber || '—'}
                                </span>
                                {pDoc ? (
                                  <a href={pDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                    ✓ Doc
                                  </a>
                                ) : (
                                  <button onClick={() => openUploadFor('PAN Card')} style={{ fontSize: '0.7rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                    + Upload
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Aadhaar Number</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0F172A', fontWeight: 800 }}>
                                  {detailData.lead?.aadhaarNumber ? `•••• ${detailData.lead.aadhaarNumber.slice(-4)}` : '—'}
                                </span>
                                {aDoc ? (
                                  <a href={aDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                    ✓ Doc
                                  </a>
                                ) : (
                                  <button onClick={() => openUploadFor('Aadhaar Card')} style={{ fontSize: '0.7rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                    + Upload
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Phone</span>
                              <a href={`tel:${detailData.lead?.phone}`} style={{ color: '#0EA5E9', fontWeight: 700, textDecoration: 'none' }}>
                                {detailData.lead?.phone || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>WhatsApp</span>
                              <a href={`https://wa.me/91${(detailData.lead?.whatsappNumber || detailData.lead?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
                                {detailData.lead?.whatsappNumber || detailData.lead?.phone || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Email</span>
                              <a href={`mailto:${detailData.lead?.email}`} style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={detailData.lead?.email}>
                                {detailData.lead?.email || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Address</span>
                              <span style={{ color: '#0F172A', fontWeight: 600, textAlign: 'right', maxWidth: 180, fontSize: '0.82rem' }}>
                                {detailData.lead?.address || '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>City & Pincode</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {[detailData.lead?.city || detailData.lead?.location, detailData.lead?.pincode].filter(Boolean).join(' - ') || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Financial Advisory Profile */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFEDD5', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Advisory Profile
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Advisor, KYC & Risk</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#EA580C', border: '1px solid #FFEDD5', background: '#FFF7ED', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Advisor / RM</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.assignedTo?.name || 'Birendra Kumar'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Client Since</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                                {new Date(detailData.lead?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>KYC Status</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: detailData.lead?.kycStatus === 'Verified' ? '#DCFCE7' : '#FEF3C7', 
                                color: detailData.lead?.kycStatus === 'Verified' ? '#15803D' : '#B45309', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.kycStatus || (detailData.lead?.panNumber ? 'Verified' : 'Pending')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Risk Profile</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: '#FFF7ED', 
                                color: '#EA580C', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.riskProfile || 'Moderate'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Family Members</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                                {detailData.lead?.familyMembers ? `${detailData.lead.familyMembers} Members` : '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Primary Service</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.service || 'Mutual Funds'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Investment Plan</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.investmentType || (detailData.lead?.sipAmount ? 'Monthly SIP' : 'Lumpsum')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Monthly SIP Book</span>
                              <span style={{ color: '#0284C7', fontWeight: 800 }}>
                                ₹ {(detailData.lead?.sipAmount || 0).toLocaleString('en-IN')}/mo
                                {detailData.lead?.sipDay ? ` (Day ${detailData.lead.sipDay})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Bank Account & Compliance Vault */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Bank & Compliance
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Mandate & Document Vault</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#15803D', border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Link / Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Bank Name</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.bankName || 'Not Linked'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Account No</span>
                              <span style={{ color: '#0F172A', fontWeight: 700, letterSpacing: '0.04em' }}>
                                {detailData.lead?.bankAccountNumber ? `•••• •••• ${detailData.lead.bankAccountNumber.slice(-4)}` : '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>IFSC Code</span>
                              <span style={{ color: '#0F172A', fontWeight: 700, letterSpacing: '0.04em' }}>
                                {detailData.lead?.bankIfscCode || '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>ECS / NACH</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: detailData.lead?.bankAccountNumber ? '#DCFCE7' : '#FEF3C7', 
                                color: detailData.lead?.bankAccountNumber ? '#15803D' : '#B45309', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.bankAccountNumber ? 'Active Mandate' : 'Pending Setup'}
                              </span>
                            </div>

                            {/* Vault & Proofs Subsection */}
                            <div style={{ marginTop: 4, padding: '10px 12px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
                                Document Proofs & Actions
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>Cancelled Cheque</span>
                                  {bDoc ? (
                                    <a href={bDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('Cancelled Cheque / Bank Mandate')} style={{ fontSize: '0.72rem', color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload Cheque
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>PAN Card Proof</span>
                                  {pDoc ? (
                                    <a href={pDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('PAN Card')} style={{ fontSize: '0.72rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload PAN
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>Aadhaar Proof</span>
                                  {aDoc ? (
                                    <a href={aDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('Aadhaar Card')} style={{ fontSize: '0.72rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload Aadhaar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>

                    {/* All Configured Investment Schemes & Policies */}
                    {detailData.lead?.schemes && detailData.lead.schemes.length > 0 ? (
                      <div style={{ 
                        marginTop: 20, 
                        background: '#F0FDF4', 
                        border: '1.5px solid #86EFAC', 
                        borderRadius: 16, 
                        padding: '20px 24px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#15803D', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IndianRupee size={18} />
                            Configured Investment Schemes & Policies ({detailData.lead.schemes.length})
                          </h4>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '4px 10px', borderRadius: 8 }}>
                            Total SIP: ₹{(detailData.lead?.sipAmount || 0).toLocaleString('en-IN')}/mo • Lumpsum: ₹{(detailData.lead?.investmentAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                          {detailData.lead.schemes.map((s, idx) => (
                            <div key={idx} style={{ background: 'white', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 800, background: '#E0F2FE', padding: '2px 8px', borderRadius: 6 }}>
                                  Scheme #{idx + 1} • {s.service}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {s.tenureYears && (
                                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 6 }}>
                                      {s.tenureYears} Yrs
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                                    {s.investmentType}
                                  </span>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                                {s.schemeName || 'Standard Policy / Plan'}
                              </div>
                              {s.sipAmount > 0 && (
                                <div style={{ fontSize: '0.86rem', color: '#0369A1', fontWeight: 700, marginTop: 6 }}>
                                  SIP: ₹{Number(s.sipAmount).toLocaleString('en-IN')}/mo <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({s.sipDay || 10}th of each month)</span>
                                </div>
                              )}
                              {s.investmentAmount > 0 && (
                                <div style={{ fontSize: '0.86rem', color: '#D97706', fontWeight: 700, marginTop: 4 }}>
                                  Lumpsum: ₹{Number(s.investmentAmount).toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 20, background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>No investment schemes configured yet</div>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => { setEditingClient(detailData.lead); setShowModal(true); }}
                          style={{ marginTop: 8, color: '#0EA5E9', borderColor: '#BAE6FD' }}
                        >
                          + Configure Schemes / Products
                        </button>
                      </div>
                    )}

                    {/* Additional Custom Fields if any */}
                    {detailData.lead?.customFields?.length > 0 && (
                      <div style={{ marginTop: 20, background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>Additional Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {detailData.lead.customFields.map((field, idx) => (
                            <div key={idx}>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{field.label}</div>
                              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 700 }}>{field.value || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

                {/* TAB 2: KYC & DOCUMENTS */}
                {clientDetailTab === 'kyc' && (() => {
                  const onboardingDocs = (detailData.lead?.onboardingData || []).filter(d => 
                    d.value && String(d.value).startsWith('/uploads/')
                  ).map(d => ({
                    name: d.label,
                    url: d.value,
                    uploadedAt: detailData.lead?.createdAt,
                    source: 'Onboarding Upload'
                  }));
                  const adhocDocs = (detailData.lead?.documents || []).map(d => ({
                    name: d.name,
                    url: d.url,
                    uploadedAt: d.uploadedAt,
                    source: 'Manual Upload'
                  }));
                  const clientDocs = [...onboardingDocs, ...adhocDocs];
                  const panDoc = clientDocs.find(d => /pan/i.test(d.name));
                  const aadhaarDoc = clientDocs.find(d => /aadhaar|adhar/i.test(d.name));
                  const bankDoc = clientDocs.find(d => /bank|cheque|mandate/i.test(d.name));

                  return (
                    <div>
                      {/* Top KYC Verification Status Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
                        
                        {/* 1. KYC VERIFICATION */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              KYC Verification Status
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 800,
                                background: detailData.lead?.kycStatus === 'Verified' ? '#DCFCE7' : detailData.lead?.kycStatus === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                                color: detailData.lead?.kycStatus === 'Verified' ? '#15803D' : detailData.lead?.kycStatus === 'In Progress' ? '#1D4ED8' : '#B45309',
                              }}>
                                {detailData.lead?.kycStatus || (detailData.lead?.panNumber ? 'Verified' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 4 }}>Quick Change Status:</label>
                            <select
                              value={detailData.lead?.kycStatus || 'Pending'}
                              onChange={(e) => handleQuickKycChange(e.target.value)}
                              className="form-select"
                              style={{ height: 32, fontSize: '0.78rem', borderRadius: 6, padding: '2px 8px' }}
                            >
                              <option value="Verified">Verified (Compliant)</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* 2. PAN STATUS */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                PAN Card Status
                              </div>
                              {panDoc && (
                                <a href={panDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.panNumber ? (
                                <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', letterSpacing: '0.05em' }}>
                                  {detailData.lead.panNumber}
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Pending Upload
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('PAN Card')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {panDoc ? 'Re-upload PAN Card' : '+ Upload PAN Card'}
                            </button>
                          </div>
                        </div>

                        {/* 3. AADHAAR STATUS */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Aadhaar Status
                              </div>
                              {aadhaarDoc && (
                                <a href={aadhaarDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.aadhaarNumber ? (
                                <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', letterSpacing: '0.05em' }}>
                                  •••• •••• {detailData.lead.aadhaarNumber.slice(-4)}
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Pending Upload
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('Aadhaar Card')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {aadhaarDoc ? 'Re-upload Aadhaar' : '+ Upload Aadhaar Card'}
                            </button>
                          </div>
                        </div>

                        {/* 4. BANK MANDATE */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Bank Mandate
                              </div>
                              {bankDoc && (
                                <a href={bankDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.bankAccountNumber ? (
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                  {detailData.lead.bankName || 'Bank'} (•••• {detailData.lead.bankAccountNumber.slice(-4)})
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Not Linked
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('Cancelled Cheque / Bank Mandate')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BBF7D0', color: '#15803D', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {bankDoc ? 'Re-upload Cheque' : '+ Upload Cheque / Mandate'}
                            </button>
                          </div>
                        </div>

                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          Uploaded Client Documents ({clientDocs.length})
                        </h4>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => {
                            setDocumentsClient(detailData.lead);
                            setShowDocumentsModal(true);
                          }}
                          style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Upload size={14} /> Upload New Document
                        </button>
                      </div>

                      {clientDocs.length > 0 ? (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Document Name</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Source</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Uploaded Date</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clientDocs.map((doc, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <FileText size={16} style={{ color: '#0EA5E9' }} />
                                      {doc.name}
                                    </div>
                                  </td>
                                  <td style={{ padding: '14px 20px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#F1F5F9', color: '#475569' }}>
                                      {doc.source}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '0.825rem' }}>
                                    {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                    <a 
                                      href={doc.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#0EA5E9', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Eye size={13} /> View
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <FileText size={22} />
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Documents Uploaded</div>
                          <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>
                            Upload PAN Card, Aadhaar Card, Cancelled Cheque, or signed policy forms for this client.
                          </p>
                          <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => {
                              setDocumentsClient(detailData.lead);
                              setShowDocumentsModal(true);
                            }}
                            style={{ borderRadius: 8, color: '#0EA5E9', borderColor: '#0EA5E9' }}
                          >
                            <Upload size={14} /> Upload First Document
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 3: MUTUAL FUND / INVESTMENT */}
                {clientDetailTab === 'investments' && (() => {
                  const schemesList = detailData.lead?.schemes || [];
                  const dynSip = schemesList.reduce((acc, s) => {
                    if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
                      return acc + (Number(s.sipAmount) || 0);
                    }
                    return acc;
                  }, 0) || Number(detailData.lead?.sipAmount) || 0;

                  const dynLumpsum = schemesList.reduce((acc, s) => {
                    if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
                      return acc + (Number(s.investmentAmount) || 0);
                    }
                    return acc;
                  }, 0) || Number(detailData.lead?.investmentAmount) || 0;

                  const dynAnnual = dynLumpsum + (dynSip * 12);
                  const activeSipCount = schemesList.filter(s => (s.sipAmount || 0) > 0).length || (dynSip > 0 ? 1 : 0);
                  const activeLumpCount = schemesList.filter(s => (s.investmentAmount || 0) > 0).length || (dynLumpsum > 0 ? 1 : 0);

                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Portfolio & Investment Mandates</h4>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => {
                            setEditingClient(detailData.lead);
                            setShowModal(true);
                          }}
                          style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: '#0EA5E9' }}
                        >
                          <Plus size={14} /> Add / Edit Schemes
                        </button>
                      </div>

                      {/* 3 Summary Dynamic KPI Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1px solid #E2E8F0', 
                          borderRadius: 16, 
                          padding: '16px 20px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)' 
                        }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Monthly SIP Book
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
                            ₹ {dynSip.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', fontWeight: 600 }}>/mo</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 4 }}>
                            {activeSipCount} Active SIP Mandate{activeSipCount !== 1 ? 's' : ''}
                          </div>
                        </div>

                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1px solid #E2E8F0', 
                          borderRadius: 16, 
                          padding: '16px 20px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)' 
                        }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Lumpsum Portfolio
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                            ₹ {dynLumpsum.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                            {activeLumpCount} One-time Investment{activeLumpCount !== 1 ? 's' : ''}
                          </div>
                        </div>

                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1px solid #E2E8F0', 
                          borderRadius: 16, 
                          padding: '16px 20px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)' 
                        }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Annual Committed Value
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                            ₹ {dynAnnual.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                            Annual SIP + Lumpsum
                          </div>
                        </div>
                      </div>

                      {/* Real Configured Schemes Table */}
                      {schemesList.length > 0 ? (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>ID</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Scheme / Plan Name</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Category</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Type</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>SIP Amount & Date</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Lumpsum</th>
                                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Tenure / Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schemesList.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>
                                    {`SCH-${String(idx + 1).padStart(3, '0')}`}
                                  </td>
                                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                                    {item.schemeName || item.service || 'Standard Plan'}
                                  </td>
                                  <td style={{ padding: '14px 18px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#E0F2FE', color: '#0284C7', padding: '3px 8px', borderRadius: 6 }}>
                                      {item.service || 'Mutual Funds'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>
                                    {item.investmentType}
                                  </td>
                                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0369A1' }}>
                                    {item.sipAmount > 0 ? (
                                      <div>
                                        ₹{Number(item.sipAmount).toLocaleString('en-IN')}/mo
                                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>Debit: {item.sipDay || 10}th of month</div>
                                      </div>
                                    ) : '—'}
                                  </td>
                                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#D97706' }}>
                                    {item.investmentAmount > 0 ? `₹${Number(item.investmentAmount).toLocaleString('en-IN')}` : '—'}
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 6 }}>
                                      {item.tenureYears ? `${item.tenureYears} Yrs • Active` : 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <IndianRupee size={22} />
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Schemes Configured</div>
                          <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>
                            Configure active SIPs, mutual funds, or insurance policies for this client to track real portfolio metrics.
                          </p>
                          <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => {
                              setEditingClient(detailData.lead);
                              setShowModal(true);
                            }}
                            style={{ borderRadius: 8, color: '#16A34A', borderColor: '#16A34A' }}
                          >
                            <Plus size={14} /> Add First Scheme
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 4: OTHER SERVICES */}
                {clientDetailTab === 'services' && (() => {
                  const schemesList = detailData.lead?.schemes || [];
                  const clientServices = Array.from(new Set([
                    detailData.lead?.service,
                    ...schemesList.map(s => s.service)
                  ].filter(Boolean)));

                  return (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Service Portfolio & Offerings</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                          Active client products and additional investment avenues available for cross-selling.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        {SERVICES.map(srv => {
                          const isActive = clientServices.includes(srv);
                          const matchedSchemes = schemesList.filter(s => s.service === srv);
                          return (
                            <div 
                              key={srv}
                              style={{
                                background: '#FFFFFF',
                                border: `1.5px solid ${isActive ? '#86EFAC' : '#E2E8F0'}`,
                                borderRadius: 16,
                                padding: '20px',
                                boxShadow: isActive ? '0 2px 8px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{srv}</h5>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                                  background: isActive ? '#DCFCE7' : '#F1F5F9',
                                  color: isActive ? '#15803D' : '#64748B',
                                  border: `1px solid ${isActive ? '#A7F3D0' : '#E2E8F0'}`
                                }}>
                                  {isActive ? 'ACTIVE' : 'AVAILABLE'}
                                </span>
                              </div>

                              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 14px' }}>
                                {isActive 
                                  ? `${matchedSchemes.length || 1} product/policy active in client's portfolio.`
                                  : `Explore ${srv} options and advisory for client.`}
                              </p>

                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingClient(detailData.lead);
                                  setShowModal(true);
                                }}
                                style={{ 
                                  width: '100%', 
                                  borderRadius: 8, 
                                  fontSize: '0.78rem',
                                  color: isActive ? '#059669' : '#0EA5E9',
                                  borderColor: isActive ? '#A7F3D0' : '#BAE6FD',
                                  background: isActive ? '#F0FDF4' : '#F0F9FF'
                                }}
                              >
                                {isActive ? 'Manage Schemes' : `+ Add ${srv}`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 5: TASKS */}
                {clientDetailTab === 'tasks' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Client Tasks & Follow-ups</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                          Real scheduled tasks and reminders linked to this client
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => {
                          setTasksClient(detailData.lead);
                          setShowTasksModal(true);
                        }}
                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> Add Task
                      </button>
                    </div>

                    {detailData.tasks && detailData.tasks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {detailData.tasks.map(task => {
                          const isDone = task.status === 'Completed';
                          return (
                            <div 
                              key={task._id} 
                              style={{ 
                                padding: '14px 18px', 
                                background: isDone ? '#F8FAFC' : '#FFFFFF', 
                                borderRadius: 14, 
                                border: `1px solid ${isDone ? '#E2E8F0' : '#CBD5E1'}`, 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                  width: 34, height: 34, borderRadius: 10, 
                                  background: task.type === 'Call' ? '#E0F2FE' : task.type === 'Meeting' ? '#FAF5FF' : '#F1F5F9',
                                  color: task.type === 'Call' ? '#0284C7' : task.type === 'Meeting' ? '#9333EA' : '#475569',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {task.type === 'Call' ? <Phone size={16} /> : task.type === 'Meeting' ? <Video size={16} /> : <Calendar size={16} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: isDone ? '#94A3B8' : '#0F172A', fontSize: '0.88rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                                    {task.title}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', gap: 8, marginTop: 2 }}>
                                    <span>Type: {task.type}</span>
                                    {task.assignedTo?.name && <span>• Assigned to: {task.assignedTo.name}</span>}
                                    {(task.dueDate || task.scheduledAt) && (
                                      <span>• Due: {new Date(task.dueDate || task.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span style={{ 
                                fontSize: '0.74rem', 
                                fontWeight: 700, 
                                padding: '3px 10px', 
                                borderRadius: 8,
                                background: isDone ? '#DCFCE7' : task.status === 'In Progress' ? '#E0F2FE' : '#FEF3C7',
                                color: isDone ? '#15803D' : task.status === 'In Progress' ? '#0284C7' : '#B45309',
                                border: `1px solid ${isDone ? '#A7F3D0' : task.status === 'In Progress' ? '#BAE6FD' : '#FDE68A'}`
                              }}>
                                {task.status || 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <Calendar size={22} />
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Tasks Scheduled</div>
                        <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>
                          Schedule review calls, document collection, or financial planning tasks for this client.
                        </p>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => {
                            setTasksClient(detailData.lead);
                            setShowTasksModal(true);
                          }}
                          style={{ borderRadius: 8, color: '#4F46E5', borderColor: '#4F46E5' }}
                        >
                          <Plus size={14} /> Schedule First Task
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: ACTIVITIES */}
                {clientDetailTab === 'activities' && (() => {
                  const combinedActivities = [
                    ...(detailData.followups || []).map(f => ({
                      id: `f-${f._id}`,
                      title: f.callStatus ? `Call: ${f.callStatus}` : 'Follow-up Call',
                      badge: f.response || 'Follow-up',
                      badgeColor: f.response === 'Converted' ? '#10B981' : f.response === 'Positive' ? '#0EA5E9' : '#F97316',
                      description: f.remarks || 'No detailed notes provided',
                      date: f.createdAt,
                      user: f.userId?.name || 'Staff',
                      icon: 'phone'
                    })),
                    ...(detailData.activities || []).map(a => ({
                      id: `a-${a._id}`,
                      title: a.action || 'Activity Logged',
                      badge: a.entityType || 'Client',
                      badgeColor: '#6366F1',
                      description: a.details || a.description || 'System event recorded',
                      date: a.createdAt,
                      user: a.userId?.name || 'System',
                      icon: 'activity'
                    }))
                  ].sort((a, b) => new Date(b.date) - new Date(a.date));

                  return (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Interaction & Communication History</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                          Real timeline of all follow-ups, calls, conversions, and updates recorded for this client
                        </p>
                      </div>

                      {combinedActivities.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {combinedActivities.map(item => (
                            <div 
                              key={item.id} 
                              style={{ 
                                display: 'flex', 
                                gap: 14, 
                                padding: '14px 18px', 
                                background: '#F8FAFC', 
                                borderRadius: 14, 
                                border: '1px solid #E2E8F0',
                                alignItems: 'flex-start'
                              }}
                            >
                              <div style={{ 
                                width: 34, height: 34, borderRadius: 10, 
                                background: item.icon === 'phone' ? '#ECFDF5' : '#EEF2FF', 
                                color: item.icon === 'phone' ? '#059669' : '#4F46E5', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 2
                              }}>
                                {item.icon === 'phone' ? <Phone size={16} /> : <Activity size={16} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>{item.title}</span>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                                      background: item.badgeColor ? `${item.badgeColor}15` : '#F1F5F9',
                                      color: item.badgeColor || '#475569'
                                    }}>
                                      {item.badge}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                                    {new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <p style={{ margin: '6px 0 2px', fontSize: '0.82rem', color: '#475569' }}>
                                  {item.description}
                                </p>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                                  Logged by: {item.user}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Activity size={22} />
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Activity Logged Yet</div>
                          <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto' }}>
                            Communication logs, call entries, and client milestone updates will appear here automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        )}
        {showTasksModal && tasksClient && (
          <ClientTasksModal 
            client={tasksClient} 
            onClose={() => { setShowTasksModal(false); setTasksClient(null); }} 
          />
        )}
        {showDocumentsModal && documentsClient && (
          <ClientDocumentsModal
            client={documentsClient}
            defaultDocName={documentDefaultName}
            onClose={() => { 
              setShowDocumentsModal(false); 
              setDocumentsClient(null); 
              setDocumentDefaultName('');
            }}
            onUpdate={() => {
              fetchClients(pagination.page);
              if (showDetail) viewDetail(showDetail);
            }}
          />
        )}
      </>

      {/* Create/Edit Client Modal (Stacked on top of Detail Modal) */}
      {showModal && (
        <ClientFormModal
          client={editingClient}
          users={teamUsers}
          canAssign={canAssign}
          formSettings={formSettings}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
          onSave={handleSaveClient}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => { setShowBulkUpload(false); fetchClients(pagination.page); }}
        />
      )}
    </div>
  );
}

function ClientFormModal({ client, users, canAssign, formSettings, onClose, onSave }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    whatsappNumber: client?.whatsappNumber || client?.phone || '',
    service: client?.service || '',
    leadReference: client?.leadReference || '',
    assignedTo: client?.assignedTo?._id || client?.assignedTo || '',
    response: 'Converted',
    stage: 'Converted',
    interestedInService: client?.interestedInService || 'Yes',
    serviceTaken: client?.serviceTaken || 'Yes',
    nextCallDate: client?.nextCallDate ? client.nextCallDate.split('T')[0] : '',
    followUpDate: client?.followUpDate ? client.followUpDate.split('T')[0] : '',
    remarks: client?.remarks || '',
    callStatus: client?.callStatus || 'Received',
    location: client?.location || '',
    address: client?.address || '',
    city: client?.city || '',
    pincode: client?.pincode || '',
    dateOfBirth: client?.dateOfBirth ? (client.dateOfBirth.includes('T') ? client.dateOfBirth.split('T')[0] : client.dateOfBirth) : '',
    panNumber: client?.panNumber || '',
    aadhaarNumber: client?.aadhaarNumber || '',
    kycStatus: client?.kycStatus || 'Verified',
    riskProfile: client?.riskProfile || 'Moderate',
    familyMembers: client?.familyMembers || '',
    bankName: client?.bankName || '',
    bankAccountNumber: client?.bankAccountNumber || '',
    bankIfscCode: client?.bankIfscCode || '',
    investmentType: client?.investmentType || (client?.sipAmount ? (client?.investmentAmount ? 'Both' : 'Monthly SIP') : (client?.investmentAmount ? 'Lumpsum' : 'Monthly SIP')),
    investmentAmount: client?.investmentAmount || '',
    sipAmount: client?.sipAmount || '',
    sipDay: client?.sipDay || (client?.sipAmount ? 10 : ''),
    schemeName: client?.schemeName || '',
    customFields: client?.customFields || [],
  });

  const [schemes, setSchemes] = useState(() => {
    if (client?.schemes && Array.isArray(client.schemes) && client.schemes.length > 0) {
      return client.schemes.map(s => ({
        service: s.service || client?.service || 'Mutual Funds',
        investmentType: s.investmentType || 'Monthly SIP',
        schemeName: s.schemeName || '',
        sipAmount: s.sipAmount || '',
        sipDay: s.sipDay || 10,
        investmentAmount: s.investmentAmount || '',
        tenureYears: s.tenureYears || client?.tenureYears || '',
      }));
    }
    return [
      {
        service: client?.service || 'Mutual Funds',
        investmentType: client?.investmentType || (client?.sipAmount ? (client?.investmentAmount ? 'Both' : 'Monthly SIP') : (client?.investmentAmount ? 'Lumpsum' : 'Monthly SIP')),
        schemeName: client?.schemeName || '',
        sipAmount: client?.sipAmount || '',
        sipDay: client?.sipDay || 10,
        investmentAmount: client?.investmentAmount || '',
        tenureYears: client?.tenureYears || '',
      }
    ];
  });

  const handleAddScheme = () => {
    setSchemes(prev => [
      ...prev,
      {
        service: 'Mutual Funds',
        investmentType: 'Monthly SIP',
        schemeName: '',
        sipAmount: '',
        sipDay: 10,
        investmentAmount: '',
        tenureYears: '',
      }
    ]);
  };

  const handleRemoveScheme = (index) => {
    if (schemes.length <= 1) return;
    setSchemes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSchemeChange = (index, field, value) => {
    setSchemes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const totalMonthlySip = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
      return sum + (Number(s.sipAmount) || 0);
    }
    return sum;
  }, 0);

  const totalLumpsum = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
      return sum + (Number(s.investmentAmount) || 0);
    }
    return sum;
  }, 0);

  const totalCombined = totalMonthlySip + totalLumpsum;

  const getFieldConfig = (name) => {
    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Reference', required: false },
      remarks: { label: 'Remarks', required: false },
      address: { label: 'Address', required: false },
      city: { label: 'City', required: false },
      panNumber: { label: 'Pan Number', required: false },
      pincode: { label: 'Pincode', required: false },
      dateOfBirth: { label: 'Date Of Birth', required: false }
    };
    if (!formSettings?.defaultFields) return defaults[name] || { label: name, required: false };
    const conf = formSettings.defaultFields.find(f => f.name === name);
    return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : (defaults[name] || { label: name, required: false });
  };
  const [newField, setNewField] = useState({ label: '', value: '', fieldType: 'Short answer', options: [] });
  const [showAddField, setShowAddField] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFormValid = () => {
    const defaultFields = ['name', 'phone', 'email', 'service', 'location', 'leadReference', 'address', 'city', 'panNumber', 'pincode', 'dateOfBirth'];
    for (const field of defaultFields) {
      const config = getFieldConfig(field);
      if (field === 'service') {
        const sVal = form.service || schemes[0]?.service || '';
        if (config.required && !String(sVal).trim()) return false;
        continue;
      }
      const val = String(form[field] || '');
      
      if (config.required && !val.trim()) return false;
      if (val.trim() && config.minLength && val.trim().length < config.minLength) return false;
      if (val.trim() && config.maxLength && val.trim().length > config.maxLength) return false;
    }

    if (formSettings?.globalCustomFields) {
      for (const gField of formSettings.globalCustomFields) {
        const customFieldValue = form.customFields.find(f => f.label === gField.label)?.value || '';
        
        if (gField.isRequired && !String(customFieldValue).trim()) return false;
        if (String(customFieldValue).trim() && gField.minLength && String(customFieldValue).trim().length < gField.minLength) return false;
        if (String(customFieldValue).trim() && gField.maxLength && String(customFieldValue).trim().length > gField.maxLength) return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      addToast('Client name is required', 'error');
      return;
    }
    if (!form.phone?.trim()) {
      addToast('Phone number is required', 'error');
      return;
    }

    if (!schemes || schemes.length === 0) {
      addToast('At least one investment scheme/product is required', 'error');
      return;
    }

    // Validate each scheme
    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const sNum = i + 1;

      if (!s.service?.trim()) {
        addToast(`Scheme #${sNum}: Please select Service / Product Category`, 'error');
        return;
      }

      if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
        if (!s.sipAmount || Number(s.sipAmount) <= 0) {
          addToast(`Scheme #${sNum}: Monthly SIP Amount (₹) is mandatory`, 'error');
          return;
        }
        if (!s.sipDay || Number(s.sipDay) < 1 || Number(s.sipDay) > 31) {
          addToast(`Scheme #${sNum}: Please select a valid SIP Debit Day (1st - 31st)`, 'error');
          return;
        }
      }

      if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
        if (!s.investmentAmount || Number(s.investmentAmount) <= 0) {
          addToast(`Scheme #${sNum}: Lumpsum Investment Amount (₹) is mandatory`, 'error');
          return;
        }
      }
    }

    if (!isFormValid()) return;
    setSaving(true);

    const formattedSchemes = schemes.map(s => ({
      service: s.service,
      investmentType: s.investmentType,
      schemeName: s.schemeName ? s.schemeName.trim() : '',
      sipAmount: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipAmount) || 0) : 0,
      sipDay: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipDay) || 10) : null,
      investmentAmount: (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') ? (Number(s.investmentAmount) || 0) : 0,
      tenureYears: s.tenureYears ? Number(s.tenureYears) : null,
    }));

    const primaryService = formattedSchemes[0]?.service || form.service || 'Mutual Funds';
    const combinedSchemeNames = formattedSchemes.map(s => s.schemeName).filter(Boolean).join(', ');
    const overallInvestmentType = totalMonthlySip > 0 && totalLumpsum > 0 
      ? 'Both' 
      : totalMonthlySip > 0 
      ? 'Monthly SIP' 
      : totalLumpsum > 0 
      ? 'Lumpsum' 
      : 'None';

    const payload = { 
      ...form,
      service: primaryService,
      investmentType: overallInvestmentType,
      sipAmount: totalMonthlySip,
      sipDay: formattedSchemes[0]?.sipDay || 10,
      investmentAmount: totalLumpsum,
      schemeName: combinedSchemeNames,
      tenureYears: formattedSchemes[0]?.tenureYears || null,
      schemes: formattedSchemes,
      panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
      aadhaarNumber: form.aadhaarNumber ? form.aadhaarNumber.trim() : '',
      bankName: form.bankName ? form.bankName.trim() : '',
      bankAccountNumber: form.bankAccountNumber ? form.bankAccountNumber.trim() : '',
      bankIfscCode: form.bankIfscCode ? form.bankIfscCode.toUpperCase().trim() : '',
      kycStatus: form.kycStatus || 'Verified',
      riskProfile: form.riskProfile || 'Moderate',
      familyMembers: form.familyMembers ? String(form.familyMembers).trim() : '',
      whatsappNumber: form.whatsappNumber ? form.whatsappNumber.trim() : '',
    };
    // Clean up customFields if any are empty
    payload.customFields = payload.customFields.filter(f => f.label.trim() && (Array.isArray(f.value) ? f.value.length > 0 : String(f.value).trim()));
    await onSave(payload);
    setSaving(false);
  };

  const addCustomField = () => {
    if (!newField.label.trim()) return;
    
    setForm({
      ...form,
      customFields: [...form.customFields, { 
        label: newField.label, 
        value: newField.value, 
        fieldType: newField.fieldType,
        options: newField.options
      }]
    });
    setNewField({ label: '', value: '', fieldType: 'Short answer', options: [] });
    setShowAddField(false);
  };

  const removeCustomField = (index) => {
    const updatedFields = [...form.customFields];
    updatedFields.splice(index, 1);
    setForm({ ...form, customFields: updatedFields });
  };

  const confName = getFieldConfig('name');
  const confPhone = getFieldConfig('phone');
  const confEmail = getFieldConfig('email');
  const confService = getFieldConfig('service');
  const confLocation = getFieldConfig('location');
  const confLeadRef = getFieldConfig('leadReference');

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column', zIndex: 1201, position: 'relative' }}>
        <div className="modal-header">
          <h3 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* SEGMENT 1: CLIENT DETAILS HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                <User size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  Client Information
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Basic profile, contact info, and product/service
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 20px', marginBottom: 20 }}>
              {formSettings?.defaultFields?.filter(f => !['panNumber', 'dateOfBirth'].includes(f.name))?.map((dField) => {
                const value = form[dField.name] || '';
                const onChange = (e) => setForm({ ...form, [dField.name]: e.target.value });
                
                return (
                  <div className="form-group" key={dField.name} style={{ gridColumn: ['location', 'leadReference', 'address'].includes(dField.name) ? 'span 2' : 'span 1' }}>
                    <label className="form-label">{dField.label} {dField.isRequired && '*'}</label>
                    {dField.name === 'service' ? (
                      <select className="form-select" value={value} onChange={onChange} required={dField.isRequired}>
                        <option value="">Select Service</option>
                        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input 
                        className="form-input" 
                        type={dField.name === 'email' ? 'email' : 'text'}
                        value={value} 
                        onChange={onChange} 
                        required={dField.isRequired}
                        minLength={dField.minLength || undefined}
                        maxLength={dField.maxLength || undefined}
                        placeholder={dField.label}
                      />
                    )}
                    {String(value).trim() && dField.minLength && String(value).trim().length < dField.minLength && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                        Minimum {dField.minLength} characters required
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SEGMENT: KYC & ADVISORY PROFILE */}
            <div style={{
              padding: '16px 18px',
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#0284C7', color: 'white', padding: 5, borderRadius: 8, display: 'flex' }}>
                  <Shield size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    KYC & Advisory Profile
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Identity verification, PAN, Aadhaar, risk rating & family details
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>PAN Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.panNumber}
                    onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase', height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Aadhaar Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.aadhaarNumber}
                    onChange={e => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dateOfBirth}
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>KYC Status</label>
                  <select
                    className="form-select"
                    value={form.kycStatus}
                    onChange={e => setForm({ ...form, kycStatus: e.target.value })}
                    style={{ height: 38, borderRadius: 8, fontWeight: 700 }}
                  >
                    <option value="Verified">Verified (Compliant)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Risk Profile</label>
                  <select
                    className="form-select"
                    value={form.riskProfile}
                    onChange={e => setForm({ ...form, riskProfile: e.target.value })}
                    style={{ height: 38, borderRadius: 8 }}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Very Aggressive">Very Aggressive</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Family Members / Dependents</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.familyMembers}
                    onChange={e => setForm({ ...form, familyMembers: e.target.value })}
                    placeholder="e.g. 4"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>WhatsApp Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.whatsappNumber}
                    onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
                    placeholder="WhatsApp No."
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* SEGMENT: BANKING & SETTLEMENT DETAILS */}
            <div style={{
              padding: '16px 18px',
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#475569', color: 'white', padding: 5, borderRadius: 8, display: 'flex' }}>
                  <IndianRupee size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    Banking & Settlement Details
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Linked bank account for SIP auto-debits, redemptions & payouts
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Bank Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Account Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankAccountNumber}
                    onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })}
                    placeholder="e.g. 50100234918231"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>IFSC Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankIfscCode}
                    onChange={e => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    style={{ textTransform: 'uppercase', height: 38, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)', margin: '24px 0' }} />

            {/* Global Custom Fields */}
            {formSettings?.globalCustomFields?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                {formSettings.globalCustomFields.map((gField, idx) => {
                  const fieldIndex = form.customFields.findIndex(f => f.label === gField.label);
                  const value = fieldIndex >= 0 ? form.customFields[fieldIndex].value : '';

                  const onChange = (e) => {
                    const updated = [...form.customFields];
                    if (fieldIndex >= 0) {
                      updated[fieldIndex].value = e.target.value;
                    } else {
                      updated.push({
                        label: gField.label,
                        value: e.target.value,
                        fieldType: gField.fieldType,
                        options: gField.options,
                        isRequired: gField.isRequired
                      });
                    }
                    setForm({ ...form, customFields: updated });
                  };

                  return (
                    <div className="form-group" key={`global-${idx}`}>
                      <label className="form-label">{gField.label} {gField.isRequired && '*'}</label>
                        {gField.fieldType === 'Paragraph' ? (
                          <textarea 
                            className="form-textarea" 
                            value={value} 
                            required={gField.isRequired}
                            onChange={onChange}
                            style={{ minHeight: 100 }}
                          />
                        ) : gField.fieldType === 'Dropdown' ? (
                          <select className="form-select" value={value} required={gField.isRequired} onChange={onChange}>
                            <option value="">Select Option</option>
                            {gField.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : gField.fieldType === 'Multiple choice' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {gField.options?.map(opt => (
                              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input 
                                  type="radio" 
                                  name={`radio-${gField.label}`} 
                                  value={opt} 
                                  checked={value === opt} 
                                  onChange={onChange} 
                                  required={gField.isRequired}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : gField.fieldType === 'Checkboxes' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {gField.options?.map(opt => {
                              const checkedValues = Array.isArray(value) ? value : (value ? value.split(', ') : []);
                              const handleCheck = (e) => {
                                let newValues;
                                if (e.target.checked) {
                                  newValues = [...checkedValues, opt];
                                } else {
                                  newValues = checkedValues.filter(v => v !== opt);
                                }
                                onChange({ target: { value: newValues.join(', ') } });
                              };
                              return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    value={opt} 
                                    checked={checkedValues.includes(opt)} 
                                    onChange={handleCheck} 
                                  />
                                  {opt}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input 
                            className="form-input" 
                            type={
                              gField.fieldType === 'Number' ? 'number' : 
                              gField.fieldType === 'Date' ? 'date' : 
                              gField.fieldType === 'Time' ? 'time' : 
                              gField.fieldType === 'File upload' ? 'file' : 'text'
                            } 
                            value={gField.fieldType === 'File upload' ? undefined : value} 
                            required={gField.isRequired}
                            minLength={gField.minLength || undefined}
                            maxLength={gField.maxLength || undefined}
                            onChange={gField.fieldType === 'File upload' ? (e) => {
                                onChange({ target: { value: e.target.files[0]?.name || '' } });
                            } : onChange} 
                          />
                        )}
                        {String(value).trim() && gField.minLength && String(value).trim().length < gField.minLength && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                            Minimum {gField.minLength} characters required
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: 1, background: 'var(--border-light)', margin: '24px 0' }} />

            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '1.1rem', fontWeight: 800 }}>Additional Fields</label>
                {!showAddField && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddField(true)} style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                    <Plus size={14} /> Add more fields
                  </button>
                )}
              </div>

              {form.customFields.filter(f => !formSettings?.globalCustomFields?.some(g => g.label === f.label)).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 12 }}>
                  {form.customFields.map((field, idx) => {
                    if (formSettings?.globalCustomFields?.some(g => g.label === field.label)) return null;
                    return (
                      <div key={idx} className="form-group" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            {field.label} {field.isRequired && '*'}
                          </label>
                          {!field.isRequired && (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCustomField(idx)} style={{ color: '#ef4444', padding: 4 }}>
                              <Trash2 size={14} /> Remove
                            </button>
                          )}
                        </div>
                        {field.fieldType === 'Paragraph' ? (
                          <textarea 
                            className="form-textarea" 
                            value={field.value} 
                            required={field.isRequired}
                            style={{ minHeight: 100 }}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          />
                        ) : field.fieldType === 'Dropdown' ? (
                          <select 
                            className="form-select" 
                            value={field.value} 
                            required={field.isRequired}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          >
                            <option value="">Select Option</option>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              return <option key={o} value={o}>{o}</option>;
                            })}
                          </select>
                        ) : field.fieldType === 'Multiple choice' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              return (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="radio" 
                                    name={`radio-user-client-${idx}`} 
                                    value={o} 
                                    checked={field.value === o} 
                                    onChange={e => {
                                      const updated = [...form.customFields];
                                      updated[idx].value = e.target.value;
                                      setForm({ ...form, customFields: updated });
                                    }} 
                                    required={field.isRequired}
                                  />
                                  {o}
                                </label>
                              );
                            })}
                          </div>
                        ) : field.fieldType === 'Checkboxes' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              const checkedValues = Array.isArray(field.value) ? field.value : (field.value ? field.value.split(', ') : []);
                              const handleCheck = (e) => {
                                let newValues;
                                if (e.target.checked) {
                                  newValues = [...checkedValues, o];
                                } else {
                                  newValues = checkedValues.filter(v => v !== o);
                                }
                                const updated = [...form.customFields];
                                updated[idx].value = newValues.join(', ');
                                setForm({ ...form, customFields: updated });
                              };
                              return (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    value={o} 
                                    checked={checkedValues.includes(o)} 
                                    onChange={handleCheck} 
                                  />
                                  {o}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input 
                            className="form-input" 
                            type={
                              field.fieldType === 'Number' ? 'number' : 
                              field.fieldType === 'Date' ? 'date' : 
                              field.fieldType === 'Time' ? 'time' : 
                              field.fieldType === 'File upload' ? 'file' : 'text'
                            } 
                            value={field.fieldType === 'File upload' ? undefined : field.value} 
                            required={field.isRequired}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = field.fieldType === 'File upload' ? (e.target.files[0]?.name || '') : e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          />
                        )}
                      </div>
                    )})}
                </div>
              )}

              {showAddField && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Field Name</label>
                      <input className="form-input" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} placeholder="e.g. Account Type" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Type</label>
                      <select className="form-select" value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value, value: '', options: [] })}>
                        <option value="Short answer">Short answer</option>
                        <option value="Paragraph">Paragraph</option>
                        <option value="Multiple choice">Multiple choice</option>
                        <option value="Checkboxes">Checkboxes</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="File upload">File upload</option>
                        <option value="Date">Date</option>
                        <option value="Time">Time</option>
                        <option value="Number">Number</option>
                      </select>
                    </div>
                  </div>

                  {['Multiple choice', 'Checkboxes', 'Dropdown'].includes(newField.fieldType) && (
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(Array.isArray(newField.options) ? newField.options : []).map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{optIdx + 1}.</div>
                            <input 
                              className="form-input" 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...newField.options];
                                newOpts[optIdx] = e.target.value;
                                setNewField({ ...newField, options: newOpts });
                              }}
                            />
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm" 
                              onClick={() => {
                                const newOpts = newField.options.filter((_, i) => i !== optIdx);
                                setNewField({ ...newField, options: newOpts });
                              }}
                              style={{ color: '#ef4444', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            const newOpts = Array.isArray(newField.options) ? [...newField.options, ''] : [''];
                            setNewField({ ...newField, options: newOpts });
                          }}
                          style={{ color: 'var(--secondary)', justifyContent: 'flex-start', padding: '4px 0', fontWeight: 600 }}
                        >
                          <Plus size={14} /> Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Value / Initial Response</label>
                      {newField.fieldType === 'Paragraph' ? (
                        <textarea className="form-textarea" value={newField.value} onChange={e => setNewField({ ...newField, value: e.target.value })} placeholder="Enter details..." />
                      ) : (
                        <input className="form-input" type={newField.fieldType === 'Number' ? 'number' : newField.fieldType === 'Date' ? 'date' : newField.fieldType === 'Time' ? 'time' : 'text'} value={newField.value} onChange={e => setNewField({ ...newField, value: e.target.value })} placeholder="Enter value..." />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAddField(false)}>Cancel</button>
                    <button type="button" className="btn btn-secondary" onClick={addCustomField}>Save Field</button>
                  </div>
                </div>
              )}
            </div>


            {canAssign && (
              <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ marginBottom: 12 }}>Assign To (Optional)</label>
                <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Assign to Me (Admin)</option>
                  {users.filter(u => u.role === 'user').map(u => (
                    <option key={u._id} value={u._id}>{u.name} (Call Executive)</option>
                  ))}
                </select>
              </div>
            )}
            {/* SEGMENT 2: FOLLOW-UP & SCHEDULE DETAILS */}
            <div style={{
              marginTop: 20,
              padding: 20,
              background: '#f0f9ff',
              borderRadius: 16,
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#0ea5e9', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                  <CalendarClock size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>
                    Follow-up Details & Scheduling
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#0284c7' }}>
                    Set next follow-up date and initial call status
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Next Follow-up Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.followUpDate} 
                    onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[
                      { label: '+1 Day', days: 1 },
                      { label: '+7 Days', days: 7 },
                      { label: '+1 Month', days: 30 },
                      { label: '+3 Months', days: 90 },
                      { label: '+6 Months', days: 180 },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + btn.days);
                          setForm({ ...form, followUpDate: d.toISOString().split('T')[0] });
                        }}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          borderRadius: 6,
                          background: 'white',
                          border: '1px solid #7dd3fc',
                          color: '#0284c7',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Call Status</label>
                  <select 
                    className="form-select" 
                    value={form.callStatus} 
                    onChange={e => setForm({ ...form, callStatus: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received / Connected</option>
                    <option value="Not Received">Not Received / Busy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Client Response</label>
                  <select 
                    className="form-select" 
                    value={form.response} 
                    onChange={e => setForm({ ...form, response: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  >
                    <option value="Converted">Converted (Active Client)</option>
                    <option value="Positive">Positive / Interested</option>
                    <option value="Pending">Pending / Evaluating</option>
                    <option value="Negative">Negative / Not Interested</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Next Call Schedule (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.nextCallDate} 
                    onChange={e => setForm({ ...form, nextCallDate: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  />
                </div>
              </div>

              {/* Financial Product & Investment Setup (Multi-Scheme Setup) */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #BBF7D0',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#16A34A', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#166534' }}>
                        Financial Product & Investment Setup *
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: '#15803D' }}>
                        Configure all active SIPs, policies, and lumpsum investments for this client
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid #86EFAC'
                  }}>
                    {schemes.length} Scheme{schemes.length > 1 ? 's' : ''} Configured
                  </span>
                </div>

                {/* Auto-Calculated Totals Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: 'white',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>
                      Total Monthly SIP
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8', marginTop: 2 }}>
                      ₹ {totalMonthlySip.toLocaleString('en-IN')}<span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>/ month</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>
                      Total Lumpsum
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FBBF24', marginTop: 2 }}>
                      ₹ {totalLumpsum.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86EFAC', fontWeight: 700 }}>
                      Total Combined Value
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ADE80', marginTop: 2 }}>
                      ₹ {totalCombined.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Scheme Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {schemes.map((scheme, index) => {
                    const isSip = scheme.investmentType === 'Monthly SIP' || scheme.investmentType === 'Both';
                    const isLump = scheme.investmentType === 'Lumpsum' || scheme.investmentType === 'Both';

                    return (
                      <div 
                        key={index}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '14px 16px',
                          position: 'relative',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: '#0284C7',
                              color: 'white',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 6
                            }}>
                              Scheme #{index + 1}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                              {scheme.schemeName || scheme.service || 'New Scheme Setup'}
                            </span>
                          </div>

                          {schemes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveScheme(index)}
                              title="Remove this scheme"
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>

                        {/* Row 1: Service / Category & Investment Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                              Service / Product Category *
                            </label>
                            <select 
                              className="form-select" 
                              value={scheme.service} 
                              onChange={e => handleSchemeChange(index, 'service', e.target.value)}
                              required
                              style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              {SERVICES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                              Investment Type *
                            </label>
                            <select 
                              className="form-select" 
                              value={scheme.investmentType} 
                              onChange={e => handleSchemeChange(index, 'investmentType', e.target.value)}
                              required
                              style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <option value="Monthly SIP">Monthly SIP (Recurring)</option>
                              <option value="Lumpsum">Lumpsum (One-Time)</option>
                              <option value="Both">Both (Monthly SIP + Lumpsum)</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Scheme / Policy Name & Investment Horizon (Years) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                              Scheme / Policy / Plan Name
                            </label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={scheme.schemeName} 
                              onChange={e => handleSchemeChange(index, 'schemeName', e.target.value)} 
                              placeholder="e.g. Parag Parikh Flexi Cap, HDFC Top 100, LIC Tech Term"
                              style={{ height: 38, borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem' }}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Investment Horizon (How many years?)</span>
                              {scheme.tenureYears && (
                                <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 800 }}>
                                  {scheme.tenureYears} Year{Number(scheme.tenureYears) > 1 ? 's' : ''}
                                </span>
                              )}
                            </label>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input 
                                type="number" 
                                min="1"
                                max="100"
                                className="form-input" 
                                value={scheme.tenureYears || ''} 
                                onChange={e => handleSchemeChange(index, 'tenureYears', e.target.value ? Number(e.target.value) : '')} 
                                placeholder="Years"
                                style={{ height: 38, width: '75px', borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem', fontWeight: 700 }}
                              />
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {TENURE_OPTIONS.map(yr => (
                                  <button
                                    key={yr}
                                    type="button"
                                    onClick={() => handleSchemeChange(index, 'tenureYears', yr)}
                                    style={{
                                      padding: '4px 7px',
                                      borderRadius: 6,
                                      border: Number(scheme.tenureYears) === yr ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                      background: Number(scheme.tenureYears) === yr ? '#0284C7' : '#FFFFFF',
                                      color: Number(scheme.tenureYears) === yr ? 'white' : '#334155',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {yr}y
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Inputs: Monthly SIP vs Lumpsum */}
                        <div style={{ display: 'grid', gridTemplateColumns: scheme.investmentType === 'Both' ? '1fr 1fr' : '1fr', gap: 12 }}>
                          {isSip && (
                            <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 10, padding: '10px 12px' }}>
                              <div className="form-group" style={{ marginBottom: 8 }}>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369A1' }}>
                                  Monthly SIP Amount (₹) *
                                </label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  value={scheme.sipAmount} 
                                  onChange={e => handleSchemeChange(index, 'sipAmount', e.target.value)} 
                                  placeholder="e.g. 5000"
                                  required
                                  style={{ height: 38, borderRadius: 8, border: '1.5px solid #0EA5E9', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                                />
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                  SIP Debit Day of Month *
                                </label>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                  {SIP_DAYS.map(day => (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => handleSchemeChange(index, 'sipDay', day)}
                                      style={{
                                        padding: '3px 7px',
                                        borderRadius: 6,
                                        border: Number(scheme.sipDay) === day ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                        background: Number(scheme.sipDay) === day ? '#0284C7' : '#FFFFFF',
                                        color: Number(scheme.sipDay) === day ? 'white' : '#334155',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {day}th
                                    </button>
                                  ))}
                                </div>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="31" 
                                  className="form-input" 
                                  value={scheme.sipDay || ''} 
                                  onChange={e => handleSchemeChange(index, 'sipDay', Number(e.target.value))} 
                                  placeholder="Custom day (1 - 31)"
                                  required
                                  style={{ height: 32, borderRadius: 6, fontSize: '0.78rem', background: 'white' }}
                                />
                              </div>
                            </div>
                          )}

                          {isLump && (
                            <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '10px 12px' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B45309' }}>
                                  Lumpsum Investment Amount (₹) *
                                </label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  value={scheme.investmentAmount} 
                                  onChange={e => handleSchemeChange(index, 'investmentAmount', e.target.value)} 
                                  placeholder="e.g. 100000"
                                  required
                                  style={{ height: 38, borderRadius: 8, border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                                />
                                <span style={{ fontSize: '0.68rem', color: '#92400E', marginTop: 4, display: 'block' }}>
                                  One-time lump sum capital invested / policy premium
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Another Scheme / Policy Button */}
                <button
                  type="button"
                  onClick={handleAddScheme}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '2px dashed #16A34A',
                    background: '#FFFFFF',
                    color: '#15803D',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <Plus size={16} />
                  <span>+ Add Another Scheme / Policy</span>
                </button>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Follow-up Remarks / Notes</label>
                <textarea 
                  className="form-textarea" 
                  value={form.remarks} 
                  onChange={e => setForm({ ...form, remarks: e.target.value })} 
                  placeholder="Record conversation details, client needs, or next action items..."
                  style={{ minHeight: 70, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !isFormValid()}>
              {saving ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




function ActionMenu({ client, onClose, onAction, canAssign, canDelete, canEdit }) {
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title">{client.name}</div>
          <div className="bottom-sheet-subtitle">{client.phone} • {client.service}</div>
        </div>
        
        <div className="bottom-sheet-grid">
          <button className="bottom-sheet-item" onClick={() => onAction('view')}>
            <Eye size={20} /> View Detail
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('documents')} style={{ color: '#ef4444' }}>
            <FileText size={20} /> Documents
          </button>
          <a href={`tel:${client.phone}`} className="bottom-sheet-item" style={{ color: 'var(--success, #10b981)', textDecoration: 'none' }}>
            <Phone size={20} /> Call Now
          </a>
          <button className="bottom-sheet-item" onClick={() => onAction('schedule_call')} style={{ color: 'var(--secondary)' }}>
            <Phone size={20} /> Schedule Call
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('schedule_meet')} style={{ color: '#8b5cf6' }}>
            <Video size={20} /> Meet
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('tasks')} style={{ color: 'var(--secondary)' }}>
            <Calendar size={20} /> Tasks
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('history')}>
            <Activity size={20} /> Activity Log
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('email')}>
            <Mail size={20} /> Send Email
          </button>
          {canEdit && (
            <button className="bottom-sheet-item" onClick={() => onAction('edit')}>
              <Edit size={20} /> Edit Client
            </button>
          )}
          {canAssign && (
            <button className="bottom-sheet-item" onClick={() => onAction('assign')}>
              <UserPlus size={20} /> Assign
            </button>
          )}
          {canDelete && (
            <button className="bottom-sheet-item danger" onClick={() => onAction('delete')}>
              <Trash2 size={20} /> Delete Client
            </button>
          )}
        </div>
        
        <button className="btn btn-outline btn-block" style={{ marginTop: 24 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function ClientTasksModal({ client, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?leadId=${client._id}`);
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [client._id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, borderRadius: 28 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--secondary-50)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Tasks for {client.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled activities and reminders</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ padding: '24px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--bg-body)', color: 'var(--text-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', opacity: 0.5 }}>
                <Clock size={32} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No tasks found for this client</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tasks.map(task => (
                <div key={task._id} style={{ 
                  padding: '16px', 
                  background: 'var(--bg-body)', 
                  borderRadius: 16, 
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 14, 
                      background: task.type === 'Call' ? '#dcfce7' : '#fef9c3', 
                      color: task.type === 'Call' ? '#166534' : '#854d0e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {task.type === 'Call' ? <Phone size={20} /> : <Video size={20} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{task.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Calendar size={12} />
                        {new Date(task.scheduledAt || task.dueDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${task.status === 'Completed' ? 'badge-green' : 'badge-yellow'}`} style={{ borderRadius: 10, fontSize: '0.7rem' }}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ borderTop: 'none', padding: '0 32px 32px' }}>
          <button className="btn btn-primary btn-block" onClick={onClose} style={{ borderRadius: 12 }}>Understood</button>
        </div>
      </div>
    </div>
  );
}

function AssignmentList({ role, onSelect, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?role=${role}`)
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || []);
        setLoading(false);
      });
  }, [role]);

  if (loading) return <div className="spinner"></div>;
  if (users.length === 0) return <p className="empty-state">No {role}s available</p>;

  return users.map(u => (
    <button key={u._id} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => onSelect(u._id)}>
      <UserPlus size={16} /> {u.name} ({u.email})
    </button>
  ));
}

function AssignmentOptions({ role, currentUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`/api/users?role=${role}`)
      .then(r => r.json())
      .then(d => setUsers(d.users || []));
  }, [role]);

  return users.map(u => <option key={u._id} value={u._id}>{u.name}</option>);
}

function Pagination({ pagination, onPageChange }) {
  if (pagination.pages <= 1) return null;
  
  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: pagination.pages }, (_, i) => (
        <button key={i + 1} className={`pagination-btn ${pagination.page === i + 1 ? 'active' : ''}`} onClick={() => onPageChange(i + 1)}>
          {i + 1}
        </button>
      ))}
      <button className="pagination-btn" disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function LogoLoader({ message }) {
  return (
    <div className="logo-loader-backdrop">
      <div className="logo-loader-container">
        <div className="logo-loader-ring"></div>
        <div className="logo-loader-ring"></div>
        <img src="/logo.png" alt="Investrow" className="logo-loader-img" />
      </div>
      <div className="logo-loader-text">
        <div className="logo-loader-title">{message}</div>
        <div className="logo-loader-subtitle">Please wait while we process your request</div>
      </div>
    </div>
  );
}
