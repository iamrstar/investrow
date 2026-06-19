'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import ScheduleEventModal from '@/components/ScheduleEventModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import {
  Plus, Search, Eye, Edit, Trash2, UserPlus, Phone,
  Filter, FileText, ChevronLeft, ChevronRight, X, Mail, Send, Activity,
  MoreVertical, Clock, CheckCircle, Video, Calendar
} from 'lucide-react';

const SERVICES = [
  'Mutual Funds', 'Life Insurance', 'Health Insurance', 'Tax Planning',
  'General Insurance', 'FD & Bond', 'Stock Market & Demat', 'NPS',
];

export default function LeadsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterResponse, setFilterResponse] = useState('');
  const [filterCallStatus, setFilterCallStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLead, setAssignLead] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLead, setEmailLead] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [activeMenuLead, setActiveMenuLead] = useState(null);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksLead, setTasksLead] = useState(null);
  const [assignRole, setAssignRole] = useState(''); // 'user'
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customEmailData, setCustomEmailData] = useState({ subject: '', content: '' });
  const [formSettings, setFormSettings] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [converting, setConverting] = useState(false);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showScheduleMeet, setShowScheduleMeet] = useState(false);
  const [scheduleLead, setScheduleLead] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onboardingData, setOnboardingData] = useState([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const toggleActivity = (id) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const canCreate = user?.role === 'admin' || user?.role === 'user';
  const canAssign = user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (filterService) params.set('service', filterService);
      if (filterResponse) params.set('response', filterResponse);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (filterDate) params.set('followUpDate', filterDate);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      addToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterResponse, filterCallStatus, filterUser, filterDate, startDate, endDate, addToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetch('/api/form-control?type=lead&t=' + Date.now()).then(r => r.json()).then(data => {
      if (data.success) setFormSettings(data.settings);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (canAssign) {
      // Fetch users for assignment
      fetch('/api/users?role=user').then(r => r.json()).then(d => setTeamUsers(d.users || []));
    }
  }, [canAssign]);

  const handleSaveLead = async (formData) => {
    try {
      const isEdit = !!(editingLead || formData?._id);
      const leadId = editingLead?._id || formData?._id;

      if (isEdit && editingLead && !confirm('Are you sure you want to update this lead?')) return;
      
      const url = isEdit ? `/api/leads/${leadId}` : '/api/leads';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      addToast(editingLead ? 'Lead updated!' : 'Lead created! Awaiting assignment in Tasks.', 'success');
      setShowModal(false);
      setEditingLead(null);
      fetchLeads(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLogFollowUp = async (formData) => {
    try {
      const res = await fetch(`/api/leads/${followUpLead._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      addToast('Follow-up record created successfully!', 'success');
      setShowFollowUp(false);
      setFollowUpLead(null);
      fetchLeads(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      addToast('Lead deleted', 'success');
      fetchLeads(pagination.page);
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleAssign = async (leadId, userId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast('Lead assigned!', 'success');
      setShowAssignModal(false);
      setAssignLead(null);
      setAssignRole('');
      fetchLeads(pagination.page);
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

  const handleConvertLead = (lead) => {
    setConvertLead(lead);
    // Initialize onboarding data based on settings
    if (formSettings?.onboardingFields) {
      const initialData = formSettings.onboardingFields.map(f => ({
        label: f.label,
        fieldType: f.fieldType,
        value: f.fieldType === 'Multiple choice' || f.fieldType === 'Dropdown' ? (f.options[0] || '') : (f.fieldType === 'Checkboxes' ? [] : ''),
        file: null // to store actual file before upload
      }));
      setOnboardingData(initialData);
    } else {
      setOnboardingData([]);
    }
  };

  const confirmConvertLead = async () => {
    if (!convertLead) return;

    // Validate required fields
    if (formSettings?.onboardingFields) {
      for (let i = 0; i < formSettings.onboardingFields.length; i++) {
        const field = formSettings.onboardingFields[i];
        const data = onboardingData[i];
        if (field.isRequired && (!data.value || (Array.isArray(data.value) && data.value.length === 0)) && !data.file) {
          addToast(`${field.label} is required for onboarding.`, 'error');
          return;
        }
      }
    }

    setConverting(true);
    try {
      // First, handle any file uploads
      const processedOnboardingData = [];
      for (const data of onboardingData) {
        let finalValue = data.value;
        if (data.fieldType === 'File upload' && data.file) {
          const formData = new FormData();
          formData.append('file', data.file);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) throw new Error(`Failed to upload ${data.label}`);
          const uploadData = await uploadRes.json();
          finalValue = uploadData.url;
        } else if (Array.isArray(finalValue)) {
          finalValue = finalValue.join(', ');
        }
        
        processedOnboardingData.push({
          label: data.label,
          value: finalValue,
          fieldType: data.fieldType
        });
      }

      const res = await fetch(`/api/leads/${convertLead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'Converted', onboardingData: processedOnboardingData }),
      });

      if (!res.ok) throw new Error('Failed to convert lead');
      
      addToast('Lead converted to Customer successfully!', 'success');
      setConvertLead(null);
      fetchLeads(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleSendEmail = async (templateType) => {
    if (!emailLead?.email) {
      addToast('Client does not have an email address', 'error');
      return;
    }

    if (templateType === 'custom' && (!customEmailData.subject || !customEmailData.content)) {
      addToast('Please fill in both subject and message', 'error');
      return;
    }

    setEmailSending(true);
    try {
      const payload = { leadId: emailLead._id, templateType };
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
      if (filterResponse) params.set('response', filterResponse);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', '1000'); // Get all
      
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      const exportLeads = data.leads || [];
      
      if (exportLeads.length === 0) return addToast('No data to export', 'error');

      // Simple CSV export
      const headers = ['Name', 'Phone', 'Email', 'Service', 'Response', 'Call Status', 'Assigned To', 'Follow-up Date', 'Remarks', 'Created At'];
      const csvData = exportLeads.map(l => [
        l.name,
        l.phone,
        l.email || '',
        l.service,
        l.response,
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
      link.setAttribute("download", `Leads_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Report downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to generate report', 'error');
    }
  };

  const RenderLeadActions = ({ lead }) => (
    <div className="table-actions">
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => { window.location.href = `tel:${lead.phone}`; setFollowUpLead(lead); setShowFollowUp(true); }}
        title="Call & Log Follow-up"
        style={{ color: 'var(--secondary)', border: '1px solid var(--secondary-100)', background: 'var(--secondary-50)' }}
      >
        <Phone size={16} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => setActiveMenuLead(lead)} 
        title="More Actions"
        style={{ background: 'var(--border-light)' }}
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );

  const getFieldConfig = (name) => {
    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Lead Reference', required: false },
      response: { label: 'Response', required: false },
      callStatus: { label: 'Call Status', required: false },
      interestedInService: { label: 'Interested in Service', required: false },
      serviceTaken: { label: 'Service Taken', required: false },
      nextCallDate: { label: 'Next Call Date', required: false },
      followUpDate: { label: 'Follow-up Date', required: false },
      remarks: { label: 'Remarks', required: false }
    };
    if (!formSettings?.defaultFields) return defaults[name] || { label: name, required: false };
    const conf = formSettings.defaultFields.find(f => f.name === name);
    return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : (defaults[name] || { label: name, required: false });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <FileText size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Lead Management
        </h1>
        {canCreate && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline add-lead-btn" onClick={() => setShowBulkUpload(true)}>
              <Plus size={20} /> <span>Bulk Upload</span>
            </button>
            <button className="btn btn-primary add-lead-btn" onClick={() => { setEditingLead(null); setShowModal(true); }}>
              <Plus size={20} /> <span>Add Lead</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filters-scroll-row">
          <select className="form-select" value={filterService} onChange={e => setFilterService(e.target.value)}>
            <option value="">All Services</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select" value={filterResponse} onChange={e => setFilterResponse(e.target.value)}>
            <option value="">All Responses</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Pending">Pending</option>
            <option value="Converted">Converted</option>
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
        ) : leads.length === 0 ? (
          <div className="empty-state"><FileText size={48} /><h3>No leads found</h3><p>Create your first lead to get started</p></div>
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
                <th>Response</th>
                <th>Call Status</th>
                <th>Assigned To</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={lead._id}>
                  <td data-label="Sr. No.">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td className="lead-name" data-label="Name">{lead.name}</td>
                  <td data-label="Phone / Mobile">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      {lead.phone}
                    </div>
                  </td>
                  <td data-label="Email">{lead.email || '—'}</td>
                  <td data-label="Address">{lead.address || '—'}</td>
                  <td data-label="City">{lead.city || '—'}</td>
                  <td data-label="Pan Number">{lead.panNumber || '—'}</td>
                  <td data-label="Pincode">{lead.pincode || '—'}</td>
                  <td data-label="Date Of Birth">{lead.dateOfBirth || '—'}</td>
                  <td data-label="Service"><span className="badge badge-blue">{lead.service || '—'}</span></td>
                  <td data-label="Response">
                    <span className={`badge badge-${lead.response === 'Positive' ? 'positive' : lead.response === 'Negative' ? 'negative' : lead.response === 'Converted' ? 'converted' : 'pending'}`}>
                      {lead.response}
                    </span>
                  </td>
                  <td data-label="Call Status">
                    <span className={`badge ${lead.callStatus === 'Received' ? 'badge-green' : lead.callStatus === 'Not Received' ? 'badge-red' : 'badge-gray'}`}>
                      {lead.callStatus}
                    </span>
                  </td>
                  <td data-label="Assigned To">{lead.assignedTo?.name || '—'}</td>
                  <td data-label="Follow-up">
                    {lead.followUpDate ? (
                      <button 
                        onClick={() => setFilterDate(lead.followUpDate.split('T')[0])}
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
                        {new Date(lead.followUpDate).toLocaleDateString()}
                      </button>
                    ) : '—'}
                  </td>
                  <td>
                    <RenderLeadActions lead={lead} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={fetchLeads} />

      {/* Create/Edit Modal */}
      {showModal && (
        <LeadFormModal
          lead={editingLead}
          users={teamUsers}
          canAssign={canAssign}
          formSettings={formSettings}
          onClose={() => { setShowModal(false); setEditingLead(null); }}
          onSave={handleSaveLead}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && assignLead && (
        <div className="modal-backdrop" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Lead</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                Assign <strong>{assignLead.name}</strong> to:
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
                      onSelect={(userId) => handleAssign(assignLead._id, userId)} 
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
      {showEmailModal && emailLead && (
        <div className="modal-backdrop" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Push Email Notification</h3>
              <button className="modal-close" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              {!showCustomEmail ? (
                <>
                  <p style={{ marginBottom: 20 }}>Choose a meaningful email scenario for <strong>{emailLead.name}</strong>:</p>
                  
                  <div style={{ display: 'grid', gap: 12 }}>
                    {emailLead.response === 'Converted' ? (
                      <>
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
                              Encourage client to start their monthly investment for {emailLead.service}.
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
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn btn-outline" 
                          style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                          onClick={() => handleSendEmail('promotional')}
                          disabled={emailSending}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                              <Send size={16} /> Promotional Message
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              Send a promotional offer or service highlight to this lead.
                            </div>
                          </div>
                        </button>

                        <button 
                          className="btn btn-outline" 
                          style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                          onClick={() => handleSendEmail('strategyMarketing')}
                          disabled={emailSending}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary)' }}>
                              <Send size={16} /> Strategy Marketing Mail
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              A strategic marketing email to engage the lead.
                            </div>
                          </div>
                        </button>
                      </>
                    )}

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
                          Type your own subject and message for this {emailLead.response === 'Converted' ? 'client' : 'lead'}.
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

              {!emailLead.email && (
                <div style={{ marginTop: 16, padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <X size={16} /> This lead is missing an email address.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEmailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUp && followUpLead && (
        <LogFollowUpModal
          lead={followUpLead}
          onClose={() => { setShowFollowUp(false); setFollowUpLead(null); }}
          onSave={handleLogFollowUp}
        />
      )}

      {/* Email Sending Loader */}
      {emailSending && <LogoLoader message="Pushing Email Notification..." />}

      {/* Schedule Call Modal */}
      {showScheduleCall && scheduleLead && (
        <ScheduleEventModal
          lead={scheduleLead}
          type="Call"
          onClose={() => { setShowScheduleCall(false); setScheduleLead(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleLead._id,
                  type: 'Call',
                  assignedTo: scheduleLead.assignedTo?._id || scheduleLead.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule call');
              addToast('Call scheduled successfully!', 'success');
              setShowScheduleCall(false);
              setScheduleLead(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}

      {/* Schedule Meet Modal */}
      {showScheduleMeet && scheduleLead && (
        <ScheduleEventModal
          lead={scheduleLead}
          type="Meeting"
          onClose={() => { setShowScheduleMeet(false); setScheduleLead(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleLead._id,
                  type: 'Meeting',
                  assignedTo: scheduleLead.assignedTo?._id || scheduleLead.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule meeting');
              addToast('Meeting scheduled successfully!', 'success');
              setShowScheduleMeet(false);
              setScheduleLead(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}

      {/* Action Menu (Bottom Sheet) */}
      {activeMenuLead && (
        <ActionMenu 
          lead={activeMenuLead}
          onClose={() => setActiveMenuLead(null)}
          onAction={(action) => {
            setActiveMenuLead(null);
            switch(action) {
              case 'view': viewDetail(activeMenuLead._id); break;
              case 'tasks': setTasksLead(activeMenuLead); setShowTasksModal(true); break;
              case 'followup': setFollowUpLead(activeMenuLead); setShowFollowUp(true); break;
              case 'history': viewDetail(activeMenuLead._id); break;
              case 'email': setEmailLead(activeMenuLead); setShowEmailModal(true); break;
              case 'edit': setEditingLead(activeMenuLead); setShowModal(true); break;
              case 'assign': setAssignLead(activeMenuLead); setShowAssignModal(true); break;
              case 'convert': handleConvertLead(activeMenuLead); break;
              case 'delete': handleDelete(activeMenuLead._id); break;
              case 'schedule_call': setScheduleLead(activeMenuLead); setShowScheduleCall(true); break;
              case 'schedule_meet': setScheduleLead(activeMenuLead); setShowScheduleMeet(true); break;
            }
          }}
          canAssign={canAssign}
          canDelete={canDelete}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailData && (
        <div className="modal-backdrop" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Lead Details</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">{getFieldConfig('name').label}</div><div className="detail-value">{detailData.lead?.name}</div></div>
                <div className="detail-item"><div className="detail-label">{getFieldConfig('phone').label}</div><div className="detail-value">{detailData.lead?.phone}</div></div>
                <div className="detail-item"><div className="detail-label">{getFieldConfig('email').label}</div><div className="detail-value">{detailData.lead?.email || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">{getFieldConfig('service').label}</div><div className="detail-value"><span className="badge badge-blue">{detailData.lead?.service}</span></div></div>
                <div className="detail-item"><div className="detail-label">Response</div><div className="detail-value"><span className={`badge badge-${detailData.lead?.response?.toLowerCase() === 'positive' ? 'positive' : detailData.lead?.response?.toLowerCase() === 'negative' ? 'negative' : detailData.lead?.response?.toLowerCase() === 'converted' ? 'converted' : 'pending'}`}>{detailData.lead?.response}</span></div></div>
                <div className="detail-item"><div className="detail-label">Call Status</div><div className="detail-value">{detailData.lead?.callStatus}</div></div>
                <div className="detail-item"><div className="detail-label">Interested</div><div className="detail-value">{detailData.lead?.interestedInService}</div></div>
                <div className="detail-item"><div className="detail-label">Service Taken</div><div className="detail-value">{detailData.lead?.serviceTaken}</div></div>
                <div className="detail-item"><div className="detail-label">Next Call</div><div className="detail-value">{detailData.lead?.nextCallDate ? new Date(detailData.lead?.nextCallDate).toLocaleDateString() : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Follow-up</div><div className="detail-value">{detailData.lead?.followUpDate ? new Date(detailData.lead?.followUpDate).toLocaleDateString() : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Assigned To</div><div className="detail-value">{detailData.lead?.assignedTo?.name || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Created By</div><div className="detail-value">{detailData.lead?.createdBy?.name || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">{getFieldConfig('location').label}</div><div className="detail-value">{detailData.lead?.location || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">{getFieldConfig('leadReference').label}</div><div className="detail-value">{detailData.lead?.leadReference || '—'}</div></div>
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
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">Remarks</div><div className="detail-value">{detailData.lead?.remarks || '—'}</div></div>
              </div>

              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '2px solid var(--border-light)' }}>
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Activity size={22} style={{ color: 'var(--secondary)' }} /> 
                      Conversation History
                    </h4>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => { setShowFollowUp(true); setFollowUpLead(detailData.lead); }}
                      style={{ borderRadius: 14, padding: '8px 20px', boxShadow: '0 4px 12px rgba(14,165,233,0.2)' }}
                    >
                      <Plus size={18} /> New Interaction
                    </button>
                  </div>

                  <div className="interaction-history" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 32,
                    padding: '4px' 
                  }}>
                    {Object.entries(
                      (detailData.followups || []).reduce((groups, fu) => {
                        const date = new Date(fu.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' });
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(fu);
                        return groups;
                      }, {})
                    ).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, items]) => (
                      <div key={date} className="date-group" style={{ position: 'relative' }}>
                        <div style={{ 
                          padding: '12px 0',
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          color: 'var(--text-muted)', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.1em',
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: 'white',
                          position: 'relative',
                          zIndex: 5
                        }}>
                          <span style={{ whiteSpace: 'nowrap', padding: '6px 16px', background: 'var(--secondary-50)', color: 'var(--secondary-dark)', borderRadius: 20, border: '1px solid var(--secondary-100)' }}>{date}</span>
                          <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, var(--secondary-100), transparent)' }}></div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 24,
                          borderLeft: '2px solid var(--secondary-100)',
                          marginLeft: 20,
                          paddingLeft: 28,
                          paddingBottom: 20,
                          position: 'relative'
                        }}>
                          {items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(fu => (
                            <div 
                              key={fu._id} 
                              className="follow-up-card-container"
                              style={{ position: 'relative' }}
                            >
                              <div style={{ 
                                position: 'absolute',
                                left: -33,
                                top: 24,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: fu.response === 'Positive' ? '#22c55e' : fu.response === 'Negative' ? '#ef4444' : 'var(--secondary)',
                                border: '4px solid white',
                                boxShadow: '0 0 0 2px var(--secondary-50)'
                              }}></div>

                              <div 
                                className="follow-up-card"
                                style={{ 
                                  background: expandedActivities[fu._id] ? 'white' : 'var(--bg-card)',
                                  borderRadius: 20,
                                  border: expandedActivities[fu._id] ? '2px solid var(--secondary-100)' : '1px solid var(--border-light)',
                                  boxShadow: expandedActivities[fu._id] ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                                  overflow: 'hidden',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              >
                                <div style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: 12, 
                                        background: 'var(--secondary-100)', 
                                        color: 'var(--secondary-dark)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: 800
                                      }}>
                                        {(fu.userId?.name || 'S').charAt(0)}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                          {fu.userId?.name || 'System User'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Clock size={12} />
                                          {new Date(fu.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`badge badge-${fu.response === 'Positive' ? 'positive' : fu.response === 'Negative' ? 'negative' : 'blue'}`} style={{ borderRadius: 10, padding: '4px 12px' }}>
                                      {fu.response}
                                    </span>
                                  </div>
                                  
                                  <div style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--text-secondary)', 
                                    lineHeight: 1.6,
                                    marginBottom: 16
                                  }}>
                                    {expandedActivities[fu._id] ? fu.remarks : (fu.remarks?.substring(0, 80) + (fu.remarks?.length > 80 ? '...' : '')) || 'No notes provided.'}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                                    <button 
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => toggleActivity(fu._id)}
                                      style={{ color: 'var(--secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                      {expandedActivities[fu._id] ? 'Hide Details' : 'View Details'}
                                      <ChevronRight size={16} style={{ transform: expandedActivities[fu._id] ? 'rotate(-90deg)' : 'rotate(90deg)', transition: '0.2s' }} />
                                    </button>
                                  </div>
                                  
                                  {expandedActivities[fu._id] && (
                                    <div style={{ 
                                      marginTop: 16, 
                                      padding: 16, 
                                      background: 'var(--bg-body)', 
                                      borderRadius: 16, 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(2, 1fr)', 
                                      gap: 16 
                                    }}>
                                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ padding: 6, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}><Phone size={14} /></div>
                                        <div>
                                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Call Status</div>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{fu.callStatus}</div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ padding: 6, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}><CheckCircle size={14} /></div>
                                        <div>
                                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Interested</div>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{fu.interestedInService}</div>
                                        </div>
                                      </div>
                                      {fu.nextCallDate && (
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', gridColumn: '1 / -1', background: 'var(--secondary-50)', padding: '12px', borderRadius: 12 }}>
                                          <Clock size={14} style={{ color: 'var(--secondary)' }} />
                                          <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--secondary-dark)', textTransform: 'uppercase', fontWeight: 800 }}>Next Call Scheduled</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{new Date(fu.nextCallDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {(!detailData.followups || detailData.followups.length === 0) && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 40px', 
                        background: 'linear-gradient(135deg, var(--secondary-50), white)', 
                        borderRadius: 32, 
                        border: '2px dashed var(--secondary-100)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 16
                      }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          background: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-md)'
                        }}>
                          <Phone size={40} style={{ color: 'var(--secondary)', opacity: 0.8 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary-dark)' }}>Start the Conversation</div>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: 4 }}>No interaction history recorded for this lead yet.</p>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => { setShowFollowUp(true); setFollowUpLead(detailData.lead); }}
                          style={{ marginTop: 8, borderRadius: 12 }}
                        >
                          <Plus size={18} /> Record First Interaction
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Convert Lead Modal */}
      <>
        {convertLead && (
          <div className="modal-backdrop" onClick={() => !converting && setConvertLead(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: '32px 24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 64, height: 64, background: 'var(--secondary-50)', color: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', flexShrink: 0 }}>
                <UserPlus size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textAlign: 'center' }}>
                Onboarding Process & Convert
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>
                Please fill in the onboarding details to convert <strong>{convertLead.name}</strong> to a client. <br/>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Once done, the lead will be converted.</span>
              </p>

              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24, padding: '0 8px' }}>
                {formSettings?.onboardingFields?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {formSettings.onboardingFields.map((field, idx) => {
                      const data = onboardingData[idx] || {};
                      return (
                        <div key={idx} className="form-group">
                          <label className="form-label">
                            {field.label} {field.isRequired && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {field.fieldType === 'Short answer' && (
                            <input className="form-input" value={data.value || ''} onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].value = e.target.value;
                              setOnboardingData(updated);
                            }} />
                          )}
                          {field.fieldType === 'Paragraph' && (
                            <textarea className="form-textarea" value={data.value || ''} onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].value = e.target.value;
                              setOnboardingData(updated);
                            }} />
                          )}
                          {field.fieldType === 'Dropdown' && (
                            <select className="form-select" value={data.value || ''} onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].value = e.target.value;
                              setOnboardingData(updated);
                            }}>
                              <option value="">Select...</option>
                              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )}
                          {field.fieldType === 'File upload' && (
                            <input className="form-input" type="file" onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].file = e.target.files[0];
                              updated[idx].value = e.target.files[0]?.name || '';
                              setOnboardingData(updated);
                            }} />
                          )}
                          {field.fieldType === 'Date' && (
                            <input className="form-input" type="date" value={data.value || ''} onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].value = e.target.value;
                              setOnboardingData(updated);
                            }} />
                          )}
                          {['Time', 'Number', 'Text'].includes(field.fieldType) && (
                            <input className="form-input" type={field.fieldType === 'Time' ? 'time' : field.fieldType === 'Number' ? 'number' : 'text'} value={data.value || ''} onChange={e => {
                              const updated = [...onboardingData];
                              updated[idx].value = e.target.value;
                              setOnboardingData(updated);
                            }} />
                          )}
                          {field.fieldType === 'Multiple choice' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {field.options.map(o => (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <input type="radio" name={`onboarding-${idx}`} value={o} checked={data.value === o} onChange={e => {
                                    const updated = [...onboardingData];
                                    updated[idx].value = e.target.value;
                                    setOnboardingData(updated);
                                  }} /> {o}
                                </label>
                              ))}
                            </div>
                          )}
                          {field.fieldType === 'Checkboxes' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {field.options.map(o => (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <input type="checkbox" checked={Array.isArray(data.value) && data.value.includes(o)} onChange={e => {
                                    const updated = [...onboardingData];
                                    let currentVal = Array.isArray(updated[idx].value) ? updated[idx].value : [];
                                    if (e.target.checked) currentVal.push(o);
                                    else currentVal = currentVal.filter(v => v !== o);
                                    updated[idx].value = currentVal;
                                    setOnboardingData(updated);
                                  }} /> {o}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No onboarding fields configured by admin.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConvertLead(null)} disabled={converting}>
                  Cancel
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={confirmConvertLead} disabled={converting}>
                  {converting ? 'Converting...' : 'Complete & Convert'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTasksModal && tasksLead && (
          <LeadTasksModal lead={tasksLead} onClose={() => { setShowTasksModal(false); setTasksLead(null); }} />
        )}
      </>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => { setShowBulkUpload(false); fetchLeads(pagination.page); }}
        />
      )}
    </div>
  );
}

function LeadTasksModal({ lead, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?leadId=${lead._id}`);
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [lead._id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, borderRadius: 28 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--secondary-50)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Tasks for {lead.name}</h3>
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
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No tasks found for this lead</p>
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

function LeadFormModal({ lead, users, canAssign, formSettings, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    service: lead?.service || '',
    leadReference: lead?.leadReference || '',
    assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
    response: lead?.response || 'Pending',
    interestedInService: lead?.interestedInService || 'Pending',
    serviceTaken: lead?.serviceTaken || 'Pending',
    nextCallDate: lead?.nextCallDate ? lead.nextCallDate.split('T')[0] : '',
    followUpDate: lead?.followUpDate ? lead.followUpDate.split('T')[0] : '',
    remarks: lead?.remarks || '',
    callStatus: lead?.callStatus || 'Pending',
    location: lead?.location || '',
    address: lead?.address || '',
    city: lead?.city || '',
    panNumber: lead?.panNumber || '',
    pincode: lead?.pincode || '',
    dateOfBirth: lead?.dateOfBirth || '',
    customFields: lead?.customFields || [],
  });

  const getFieldConfig = (name) => {
    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Lead Reference', required: false },
      response: { label: 'Response', required: false },
      callStatus: { label: 'Call Status', required: false },
      interestedInService: { label: 'Interested in Service', required: false },
      serviceTaken: { label: 'Service Taken', required: false },
      nextCallDate: { label: 'Next Call Date', required: false },
      followUpDate: { label: 'Follow-up Date', required: false },
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
    const defaultFields = ['name', 'phone', 'email', 'service', 'location', 'leadReference', 'callStatus', 'interestedInService', 'serviceTaken', 'nextCallDate', 'followUpDate', 'remarks', 'address', 'city', 'panNumber', 'pincode', 'dateOfBirth'];
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
          <h3 className="modal-title">{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 24 }}>
              {formSettings?.defaultFields?.filter(f => !['callStatus', 'interestedInService', 'serviceTaken', 'nextCallDate', 'followUpDate', 'remarks', 'response'].includes(f.name)).map((dField) => {
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
                        type={dField.name === 'email' ? 'email' : dField.name === 'dateOfBirth' ? 'date' : 'text'}
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
                                    name={`radio-user-${idx}`} 
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

            {/* Interaction Tracking Section - Only show if any tracking fields are enabled */}
            {(formSettings?.defaultFields?.some(f => ['response', 'callStatus', 'interestedInService', 'serviceTaken', 'nextCallDate', 'followUpDate', 'remarks'].includes(f.name))) && (
              <>
                <div style={{ height: 1, background: 'var(--border-light)', margin: '24px 0' }} />
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                    Interaction Tracking
                  </label>
                  <div className="form-row">
                    {formSettings.defaultFields.some(f => f.name === 'response') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('response').label || 'Response'}</label>
                        <select className="form-select" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </div>
                    )}
                    {formSettings.defaultFields.some(f => f.name === 'callStatus') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('callStatus').label}</label>
                        <select className="form-select" value={form.callStatus} onChange={e => setForm({ ...form, callStatus: e.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="Received">Received</option>
                          <option value="Not Received">Not Received</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    {formSettings.defaultFields.some(f => f.name === 'interestedInService') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('interestedInService').label}</label>
                        <select className="form-select" value={form.interestedInService} onChange={e => setForm({ ...form, interestedInService: e.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    )}
                    {formSettings.defaultFields.some(f => f.name === 'serviceTaken') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('serviceTaken').label}</label>
                        <select className="form-select" value={form.serviceTaken} onChange={e => setForm({ ...form, serviceTaken: e.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    {formSettings.defaultFields.some(f => f.name === 'nextCallDate') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('nextCallDate').label}</label>
                        <input className="form-input" type="date" value={form.nextCallDate} onChange={e => setForm({ ...form, nextCallDate: e.target.value })} />
                      </div>
                    )}
                    {formSettings.defaultFields.some(f => f.name === 'followUpDate') && (
                      <div className="form-group">
                        <label className="form-label">{getFieldConfig('followUpDate').label}</label>
                        <input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
                      </div>
                    )}
                  </div>
                  {formSettings.defaultFields.some(f => f.name === 'remarks') && (
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label className="form-label">{getFieldConfig('remarks').label}</label>
                      <textarea className="form-textarea" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Add notes..." style={{ minHeight: 100 }} />
                    </div>
                  )}
                </div>
              </>
            )}

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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !isFormValid()}>
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




function ActionMenu({ lead, onClose, onAction, canAssign, canDelete }) {
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title">{lead.name}</div>
          <div className="bottom-sheet-subtitle">{lead.phone} • {lead.service}</div>
        </div>
        
        <div className="bottom-sheet-grid">
          <button className="bottom-sheet-item" onClick={() => onAction('view')}>
            <Eye size={20} /> View Detail
          </button>
          <a href={`tel:${lead.phone}`} className="bottom-sheet-item" style={{ color: 'var(--success, #10b981)', textDecoration: 'none' }}>
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
          <button className="bottom-sheet-item" onClick={() => onAction('followup')}>
            <Phone size={20} /> Log Follow-up
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('history')}>
            <Activity size={20} /> Activity Log
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('email')}>
            <Mail size={20} /> Send Email
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('edit')}>
            <Edit size={20} /> Edit Lead
          </button>
          {canAssign && (
            <button className="bottom-sheet-item" onClick={() => onAction('assign')}>
              <UserPlus size={20} /> Assign Lead
            </button>
          )}
          <button className="bottom-sheet-item" style={{ color: 'var(--success, #10b981)' }} onClick={() => onAction('convert')}>
            <UserPlus size={20} /> Convert to Customer
          </button>
          {canDelete && (
            <button className="bottom-sheet-item danger" onClick={() => onAction('delete')}>
              <Trash2 size={20} /> Delete Lead
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
    <button key={u._id} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start' }}
      onClick={() => onSelect(u._id)}>
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
      <button 
        className="pagination-btn" 
        disabled={pagination.page <= 1} 
        onClick={() => onPageChange(pagination.page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: pagination.pages }, (_, i) => (
        <button 
          key={i + 1} 
          className={`pagination-btn ${pagination.page === i + 1 ? 'active' : ''}`} 
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button 
        className="pagination-btn" 
        disabled={pagination.page >= pagination.pages} 
        onClick={() => onPageChange(pagination.page + 1)}
      >
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
