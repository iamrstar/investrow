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
  MoreVertical, Users, Clock, CheckCircle, Video, Calendar
} from 'lucide-react';

const SERVICES = [
  'Mutual Funds', 'Life Insurance', 'Health Insurance', 'Tax Planning',
  'General Insurance', 'FD & Bond', 'Stock Market & Demat', 'NPS',
];

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailClient, setEmailClient] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [filterDate, setFilterDate] = useState('');
  const [activeMenuClient, setActiveMenuClient] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsClient, setDocumentsClient] = useState(null);
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
    <div className="table-actions">
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => { window.location.href = `tel:${client.phone}`; }}
        title="Call Now"
        style={{ color: 'var(--secondary)', border: '1px solid var(--secondary-100)', background: 'var(--secondary-50)' }}
      >
        <Phone size={16} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => setActiveMenuClient(client)} 
        title="More Actions"
        style={{ background: 'var(--border-light)' }}
      >
        <MoreVertical size={16} />
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
                <th>Sr. No.</th>
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
              {clients.map((client, index) => (
                <tr key={client._id}>
                  <td data-label="Sr. No.">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td className="lead-name" data-label="Name">{client.name}</td>
                  <td data-label="Phone / Mobile">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      {client.phone}
                    </div>
                  </td>
                  <td data-label="Email">{client.email || '—'}</td>
                  <td data-label="Address">{client.address || '—'}</td>
                  <td data-label="City">{client.city || '—'}</td>
                  <td data-label="Pan Number">{client.panNumber || '—'}</td>
                  <td data-label="Pincode">{client.pincode || '—'}</td>
                  <td data-label="Date Of Birth">{client.dateOfBirth || '—'}</td>
                  <td data-label="Service"><span className="badge badge-blue">{client.service || '—'}</span></td>
                  <td data-label="Call Status">
                    <span className={`badge ${client.callStatus === 'Received' ? 'badge-green' : client.callStatus === 'Not Received' ? 'badge-red' : 'badge-gray'}`}>
                      {client.callStatus}
                    </span>
                  </td>
                  <td data-label="Assigned To">{client.assignedTo?.name || '—'}</td>
                  <td data-label="Follow-up">
                    {client.followUpDate ? (
                      <button 
                        onClick={() => setFilterDate(client.followUpDate.split('T')[0])}
                        style={{ 
                          background: 'none', 
                          border: 'none',
                          color: 'var(--secondary-dark)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        {new Date(client.followUpDate).toLocaleDateString()}
                      </button>
                    ) : '—'}
                  </td>
                  <td data-label="Actions">
                    <RenderClientActions client={client} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={fetchClients} />

      {/* Create/Edit Modal */}
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
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div className="modal-header">
                <h3 className="modal-title">Client Details</h3>
                <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
                <div className="detail-grid">
                  <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{detailData.lead?.name}</div></div>
                  <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{detailData.lead?.phone}</div></div>
                  <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{detailData.lead?.email || '—'}</div></div>
                  <div className="detail-item"><div className="detail-label">Service</div><div className="detail-value">{detailData.lead?.service}</div></div>
                  <div className="detail-item"><div className="detail-label">Location</div><div className="detail-value">{detailData.lead?.location || '—'}</div></div>
                  <div className="detail-item"><div className="detail-label">Reference</div><div className="detail-value">{detailData.lead?.leadReference || '—'}</div></div>
                  
                  {detailData.lead?.customFields?.map((field, idx) => (
                    <div key={idx} className="detail-item">
                      <div className="detail-label">{field.label}</div>
                      <div className="detail-value">{field.value}</div>
                    </div>
                  ))}
                  
                  {detailData.lead?.onboardingData?.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>Onboarding Documents & Info</h4>
                      <div className="detail-grid">
                        {detailData.lead.onboardingData.map((field, idx) => (
                          <div key={idx} className="detail-item">
                            <div className="detail-label">{field.label}</div>
                            <div className="detail-value">
                              {field.fieldType === 'File upload' && field.value ? (
                                <a href={field.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                                  View File
                                </a>
                              ) : (
                                field.value || '—'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
            onClose={() => { setShowDocumentsModal(false); setDocumentsClient(null); }}
            onUpdate={() => fetchClients(pagination.page)}
          />
        )}
      </>

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
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    service: client?.service || '',
    leadReference: client?.leadReference || '',
    assignedTo: client?.assignedTo?._id || client?.assignedTo || '',
    response: 'Converted',
    interestedInService: client?.interestedInService || 'Yes',
    serviceTaken: client?.serviceTaken || 'Yes',
    nextCallDate: client?.nextCallDate ? client.nextCallDate.split('T')[0] : '',
    followUpDate: client?.followUpDate ? client.followUpDate.split('T')[0] : '',
    remarks: client?.remarks || '',
    callStatus: client?.callStatus || 'Received',
    location: client?.location || '',
    customFields: client?.customFields || [],
  });

  const getFieldConfig = (name) => {
    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Reference', required: false },
      remarks: { label: 'Remarks', required: false }
    };
    if (!formSettings?.defaultFields) return defaults[name] || { label: name, required: false };
    const conf = formSettings.defaultFields.find(f => f.name === name);
    return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : (defaults[name] || { label: name, required: false });
  };
  const [newField, setNewField] = useState({ label: '', value: '', fieldType: 'Short answer', options: [] });
  const [showAddField, setShowAddField] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFormValid = () => {
    const defaultFields = ['name', 'phone', 'email', 'service', 'location', 'leadReference'];
    for (const field of defaultFields) {
      const config = getFieldConfig(field);
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
    if (!isFormValid()) return;
    setSaving(true);
    const payload = { ...form };
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 24 }}>
              {formSettings?.defaultFields?.map((dField) => {
                const value = form[dField.name] || '';
                const onChange = (e) => setForm({ ...form, [dField.name]: e.target.value });
                
                return (
                  <div className="form-group" key={dField.name} style={{ gridColumn: ['location', 'leadReference'].includes(dField.name) ? 'span 2' : 'span 1' }}>
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
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea className="form-textarea" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Add notes..." />
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
