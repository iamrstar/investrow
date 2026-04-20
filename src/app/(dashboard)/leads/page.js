'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Search, Eye, Edit, Trash2, UserPlus, Phone,
  Filter, FileText, ChevronLeft, ChevronRight, X, Mail, Send, Activity,
  MoreVertical
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
  const [filterManager, setFilterManager] = useState('');
  const [managers, setManagers] = useState([]);
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
  const [expandedActivities, setExpandedActivities] = useState({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [activeMenuLead, setActiveMenuLead] = useState(null);
  const [assignRole, setAssignRole] = useState(''); // 'manager' or 'user'

  const toggleActivity = (id) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const canCreate = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'user';
  const canAssign = user?.role === 'admin' || user?.role === 'manager';
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
      if (filterManager) params.set('managerId', filterManager);
      if (filterDate) params.set('followUpDate', filterDate);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      addToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterResponse, filterCallStatus, filterUser, filterManager, filterDate, addToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (canAssign) {
      // Fetch only managers for assignment as per requirement
      fetch('/api/users?role=manager').then(r => r.json()).then(d => setTeamUsers(d.users || []));
    }
    if (user?.role === 'admin') {
      fetch('/api/users?role=manager').then(r => r.json()).then(d => setManagers(d.users || []));
    }
  }, [canAssign, user?.role]);

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

  const handleSendEmail = async (templateType) => {
    if (!emailLead?.email) {
      addToast('Client does not have an email address', 'error');
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: emailLead._id, templateType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      addToast('Email sent successfully!', 'success');
      setShowEmailModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const RenderLeadActions = ({ lead }) => (
    <div className="table-actions">
      <a 
        href={`tel:${lead.phone}`}
        className="btn btn-ghost btn-sm" 
        title={`Call ${lead.name}`}
        style={{ color: '#10b981', border: '1px solid #d1fae5' }}
      >
        <Phone size={16} />
      </a>
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

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <FileText size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Lead Management
        </h1>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => { setEditingLead(null); setShowModal(true); }}>
            <Plus size={18} /> Add Lead
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
        
        {/* User/Manager Filters for Admin/Manager */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <select className="form-select" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Users</option>
            {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
        
        {user?.role === 'admin' && (
          <select className="form-select" value={filterManager} onChange={e => setFilterManager(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Managers</option>
            {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        )}
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
                <th>Name</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Response</th>
                <th>Call Status</th>
                <th>Assigned To</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead._id}>
                  <td className="lead-name">{lead.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      {lead.phone}
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{lead.service}</span></td>
                  <td>
                    <span className={`badge badge-${lead.response === 'Positive' ? 'positive' : lead.response === 'Negative' ? 'negative' : lead.response === 'Converted' ? 'converted' : 'pending'}`}>
                      {lead.response}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lead.callStatus === 'Received' ? 'badge-green' : lead.callStatus === 'Not Received' ? 'badge-red' : 'badge-gray'}`}>
                      {lead.callStatus}
                    </span>
                  </td>
                  <td>{lead.assignedTo?.name || '—'}</td>
                  <td>
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
            <div className="modal-body">
              <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                Assign <strong>{assignLead.name}</strong> to:
              </p>
              
              {!assignRole ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {user?.role === 'admin' && (
                    <button className="btn btn-outline" onClick={() => setAssignRole('manager')} style={{ flexDirection: 'column', padding: '24px 12px', height: 'auto', gap: 12 }}>
                      <Users size={24} /> <span>Manager</span>
                    </button>
                  )}
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
        <div className="modal-backdrop" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Push Email Notification</h3>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20 }}>Choose a meaningful email scenario for <strong>{emailLead.name}</strong>:</p>
              
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
              </div>

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

      {/* Action Menu (Bottom Sheet) */}
      {activeMenuLead && (
        <ActionMenu 
          lead={activeMenuLead}
          onClose={() => setActiveMenuLead(null)}
          onAction={(action) => {
            setActiveMenuLead(null);
            switch(action) {
              case 'view': viewDetail(activeMenuLead._id); break;
              case 'followup': setFollowUpLead(activeMenuLead); setShowFollowUp(true); break;
              case 'history': viewDetail(activeMenuLead._id); break;
              case 'email': setEmailLead(activeMenuLead); setShowEmailModal(true); break;
              case 'edit': setEditingLead(activeMenuLead); setShowModal(true); break;
              case 'assign': setAssignLead(activeMenuLead); setShowAssignModal(true); break;
              case 'delete': handleDelete(activeMenuLead._id); break;
            }
          }}
          canAssign={canAssign}
          canDelete={canDelete}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailData && (
        <div className="modal-backdrop" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, borderRadius: 24, overflow: 'hidden' }}>
            <div className="modal-header">
              <h3 className="modal-title">Lead Details</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{detailData.lead?.name}</div></div>
                <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{detailData.lead?.phone}</div></div>
                <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{detailData.lead?.email || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Service</div><div className="detail-value"><span className="badge badge-blue">{detailData.lead?.service}</span></div></div>
                <div className="detail-item"><div className="detail-label">Response</div><div className="detail-value"><span className={`badge badge-${detailData.lead?.response?.toLowerCase() === 'positive' ? 'positive' : detailData.lead?.response?.toLowerCase() === 'negative' ? 'negative' : detailData.lead?.response?.toLowerCase() === 'converted' ? 'converted' : 'pending'}`}>{detailData.lead?.response}</span></div></div>
                <div className="detail-item"><div className="detail-label">Call Status</div><div className="detail-value">{detailData.lead?.callStatus}</div></div>
                <div className="detail-item"><div className="detail-label">Interested</div><div className="detail-value">{detailData.lead?.interestedInService}</div></div>
                <div className="detail-item"><div className="detail-label">Service Taken</div><div className="detail-value">{detailData.lead?.serviceTaken}</div></div>
                <div className="detail-item"><div className="detail-label">Next Call</div><div className="detail-value">{detailData.lead?.nextCallDate ? new Date(detailData.lead?.nextCallDate).toLocaleDateString() : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Follow-up</div><div className="detail-value">{detailData.lead?.followUpDate ? new Date(detailData.lead?.followUpDate).toLocaleDateString() : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Assigned To</div><div className="detail-value">{detailData.lead?.assignedTo?.name || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Created By</div><div className="detail-value">{detailData.lead?.createdBy?.name || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">Lead Reference</div><div className="detail-value">{detailData.lead?.leadReference || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">Remarks</div><div className="detail-value">{detailData.lead?.remarks || '—'}</div></div>
              </div>

              {(detailData.followups?.length > 0 || detailData.activities?.length > 0) && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={16} /> Structured Interaction History
                  </h4>
                  <div className="timeline">
                    {/* Follow-up Records */}
                    {detailData.followups?.map(fu => {
                       const isExpanded = expandedActivities[fu._id];
                       return (
                         <div key={fu._id} className="timeline-item" onClick={() => toggleActivity(fu._id)} style={{ cursor: 'pointer' }}>
                           <div className="timeline-dot" style={{ background: 'var(--secondary)' }}></div>
                           <div className="timeline-header">
                             <div className="timeline-action" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <Phone size={14} /> Call Recorded
                               <span className={`badge badge-${fu.response?.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{fu.response}</span>
                             </div>
                             <div className="timeline-time">{new Date(fu.createdAt).toLocaleString()}</div>
                           </div>
                           <div className="timeline-user">
                             <UserPlus size={14} /> {fu.userId?.name || 'System'}
                           </div>
                           
                           <div style={{ 
                             background: isExpanded ? 'white' : 'var(--secondary-50)', 
                             padding: '12px', 
                             borderRadius: '12px', 
                             border: isExpanded ? '2px solid var(--secondary-100)' : '1px solid transparent',
                             marginTop: 8, 
                             fontSize: '0.875rem',
                             transition: 'all 0.2s ease'
                           }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? 12 : 0 }}>
                               <div style={{ fontWeight: 600, color: 'var(--secondary-dark)' }}>
                                 {fu.callStatus} Status
                               </div>
                               {!isExpanded && <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>Click to view details →</div>}
                             </div>
                             
                             {isExpanded && (
                               <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                   <div>
                                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Interested</div>
                                     <div style={{ fontWeight: 600 }}>{fu.interestedInService}</div>
                                   </div>
                                   <div>
                                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Taken</div>
                                     <div style={{ fontWeight: 600 }}>{fu.serviceTaken}</div>
                                   </div>
                                   <div>
                                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Call</div>
                                     <div style={{ fontWeight: 600 }}>{fu.nextCallDate ? new Date(fu.nextCallDate).toLocaleDateString() : '—'}</div>
                                   </div>
                                   <div>
                                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Follow-up</div>
                                     <div style={{ fontWeight: 600 }}>{fu.followUpDate ? new Date(fu.followUpDate).toLocaleDateString() : '—'}</div>
                                   </div>
                                 </div>
                                 <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, borderLeft: '4px solid var(--secondary)' }}>
                                   <div style={{ fontSize: '0.7rem', color: 'var(--secondary-dark)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Call Remarks:</div>
                                   <div style={{ lineHeight: 1.5, color: '#1e293b' }}>{fu.remarks || 'No remarks recorded for this call.'}</div>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                    })}

                    {/* Old/Generic Activity Logs */}
                    {detailData.activities?.filter(act => !detailData.followups?.some(fu => fu.createdAt === act.createdAt)).map(act => {
                      const isExpanded = expandedActivities[act._id];
                      const changes = act.details || {};
                      const hasChanges = Object.keys(changes).length > 0;

                      return (
                        <div key={act._id} className="timeline-item" onClick={() => hasChanges && toggleActivity(act._id)}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-header">
                            <div className="timeline-action">{act.action}</div>
                            <div className="timeline-time">{new Date(act.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="timeline-user" style={{ marginBottom: hasChanges ? 8 : 0 }}>
                            <UserPlus size={14} /> {act.userId?.name || 'System'}
                          </div>
                          
                          {isExpanded && hasChanges && (
                            <div className="timeline-details">
                              <div className="change-log">
                                {Object.entries(changes).map(([field, vals]) => {
                                  return (
                                    <div key={field} className="change-item">
                                      <span className="change-label">{field.replace(/([A-Z])/g, ' $1')}</span>
                                      <div className="change-diff">
                                        <span className="val-old">{vals.from ? (typeof vals.from === 'string' && vals.from.includes('T') ? new Date(vals.from).toLocaleDateString() : String(vals.from)) : 'None'}</span>
                                        <span className="diff-arrow">→</span>
                                        <span className="val-new">{vals.to ? (typeof vals.to === 'string' && vals.to.includes('T') ? new Date(vals.to).toLocaleDateString() : String(vals.to)) : 'None'}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadFormModal({ lead, users, canAssign, onClose, onSave }) {
  const { user } = useAuth();
  const [assignRole, setAssignRole] = useState(lead?.assignedTo?.role || '');
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
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Service *</label>
                <select className="form-select" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required>
                  <option value="">Select Service</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Reference</label>
              <input className="form-input" value={form.leadReference} onChange={e => setForm({ ...form, leadReference: e.target.value })} placeholder="Optional reference" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Response</label>
                <select className="form-select" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Call Status</label>
                <select className="form-select" value={form.callStatus} onChange={e => setForm({ ...form, callStatus: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                  <option value="Not Received">Not Received</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interested in Service</label>
                <select className="form-select" value={form.interestedInService} onChange={e => setForm({ ...form, interestedInService: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Taken</label>
                <select className="form-select" value={form.serviceTaken} onChange={e => setForm({ ...form, serviceTaken: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Next Call Date</label>
                <input className="form-input" type="date" value={form.nextCallDate} onChange={e => setForm({ ...form, nextCallDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
              </div>
            </div>
            {canAssign && user?.role !== 'user' && (
              <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ marginBottom: 12 }}>Assign To</label>
                {!assignRole ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {user?.role === 'admin' && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setAssignRole('manager')}>Managers</button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setAssignRole('user')}>Users / Staff</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>{assignRole === 'manager' ? 'Managers' : 'Team Members'}</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAssignRole(''); setForm({ ...form, assignedTo: '' }); }} style={{ padding: 0 }}>Change Role</button>
                    </div>
                    <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      <AssignmentOptions role={assignRole} currentUser={user} />
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea className="form-textarea" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Add notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogFollowUpModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    response: lead.response || 'Pending',
    callStatus: lead.callStatus || 'Pending',
    interestedInService: lead.interestedInService || 'Pending',
    serviceTaken: lead.serviceTaken || 'Pending',
    nextCallDate: lead.nextCallDate ? lead.nextCallDate.split('T')[0] : '',
    followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Include the original lead data to ensure constraints are met
    await onSave({ ...lead, ...form });
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))', 
          padding: '24px 32px', 
          color: 'white',
          position: 'relative'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Record Call Result</h3>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Updating timeline for <strong>{lead.name}</strong></p>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white', padding: 4, borderRadius: 8, cursor: 'pointer' 
            }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '32px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Call Status</label>
                <select className="form-select" value={form.callStatus} onChange={e => setForm({ ...form, callStatus: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                  <option value="Not Received">Not Received</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Response</label>
                <select className="form-select" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interested?</label>
                <select className="form-select" value={form.interestedInService} onChange={e => setForm({ ...form, interestedInService: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Taken?</label>
                <select className="form-select" value={form.serviceTaken} onChange={e => setForm({ ...form, serviceTaken: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Next Call Date</label>
                <input className="form-input" type="date" value={form.nextCallDate} onChange={e => setForm({ ...form, nextCallDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Call Remarks</label>
              <textarea 
                className="form-textarea" 
                value={form.remarks} 
                onChange={e => setForm({ ...form, remarks: e.target.value })} 
                placeholder="What was discussed in this call?"
                style={{ minHeight: 120 }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Follow-up'}
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
          <button className="bottom-sheet-item" onClick={() => onAction('followup')}>
            <Phone size={20} /> Follow-up
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

