'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Search, Eye, Edit, Trash2, UserPlus, Phone,
  Filter, FileText, ChevronLeft, ChevronRight, X, Mail, Send, Activity,
  MoreVertical, Clock, CheckCircle
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
  const [expandedActivities, setExpandedActivities] = useState({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [activeMenuLead, setActiveMenuLead] = useState(null);
  const [assignRole, setAssignRole] = useState(''); // 'user'
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customEmailData, setCustomEmailData] = useState({ subject: '', content: '' });

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

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      addToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterResponse, filterCallStatus, filterUser, filterDate, addToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  const handleConvertLead = async (lead) => {
    if (!confirm(`Do you want to confirm this lead and convert as a customer? \n\nName: ${lead.name}`)) return;
    
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: 'Converted' }),
      });

      if (!res.ok) throw new Error('Failed to convert lead');
      
      addToast('Lead converted to Customer successfully!', 'success');
      fetchLeads(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
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

  const RenderLeadActions = ({ lead }) => (
    <div className="table-actions">
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={() => { setFollowUpLead(lead); setShowFollowUp(true); }}
        title="Log Follow-up"
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
        
        {/* User Filters for Admin */}
        {user?.role === 'admin' && (
          <select className="form-select" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Users</option>
            {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
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
              case 'convert': handleConvertLead(activeMenuLead); break;
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Lead Details</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
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
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">Location</div><div className="detail-value">{detailData.lead?.location || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-label">Lead Reference</div><div className="detail-value">{detailData.lead?.leadReference || '—'}</div></div>
                {detailData.lead?.customFields?.map((field, idx) => (
                  <div key={idx} className="detail-item">
                    <div className="detail-label">{field.label}</div>
                    <div className="detail-value">{field.value}</div>
                  </div>
                ))}
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
    </div>
  );
}

function LeadFormModal({ lead, users, canAssign, onClose, onSave }) {
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
    customFields: lead?.customFields || [],
  });
  const [newField, setNewField] = useState({ label: '', value: '' });
  const [showAddField, setShowAddField] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    // Clean up customFields if any are empty
    payload.customFields = payload.customFields.filter(f => f.label.trim() && f.value.trim());
    await onSave(payload);
    setSaving(false);
  };

  const addCustomField = () => {
    if (!newField.label.trim() || !newField.value.trim()) return;
    setForm({
      ...form,
      customFields: [...form.customFields, { ...newField }]
    });
    setNewField({ label: '', value: '' });
    setShowAddField(false);
  };

  const removeCustomField = (index) => {
    const updatedFields = [...form.customFields];
    updatedFields.splice(index, 1);
    setForm({ ...form, customFields: updatedFields });
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
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lead location" />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Reference</label>
              <input className="form-input" value={form.leadReference} onChange={e => setForm({ ...form, leadReference: e.target.value })} placeholder="Optional reference" />
            </div>

            {lead && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Response</label>
                    <select className="form-select" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
                      <option value="Converted">Converted</option>
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
              </>
            )}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Custom Fields</label>
                {!showAddField && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddField(true)} style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                    <Plus size={14} /> Add more fields
                  </button>
                )}
              </div>

              {form.customFields.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 12 }}>
                  {form.customFields.map((field, idx) => (
                    <div key={idx} className="form-group" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>{field.label}</label>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCustomField(idx)} style={{ color: '#ef4444', padding: 4 }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      <input 
                        className="form-input" 
                        value={field.value} 
                        onChange={e => {
                          const updated = [...form.customFields];
                          updated[idx].value = e.target.value;
                          setForm({ ...form, customFields: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {showAddField && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Field Name</label>
                      <input className="form-input" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} placeholder="e.g. Aadhar Number" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Value / Description</label>
                      <input className="form-input" value={newField.value} onChange={e => setNewField({ ...newField, value: e.target.value })} placeholder="Enter value..." />
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
    followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.remarks) return alert('Please add some remarks about the call.');
    setSaving(true);
    await onSave({ ...lead, ...form });
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, borderRadius: 32, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
          padding: '32px', 
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'var(--secondary)', padding: 8, borderRadius: 12 }}>
              <Phone size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Log Interaction</h3>
          </div>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.95rem' }}>How did the conversation with <strong>{lead.name}</strong> go?</p>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: 32, right: 32, background: 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white', padding: 6, borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '32px', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Response Outcome</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="form-select" 
                    value={form.response} 
                    onChange={e => setForm({ ...form, response: e.target.value })}
                    style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                  >
                    <option value="Pending">Pending / Neutral</option>
                    <option value="Positive">Positive / Interested</option>
                    <option value="Negative">Negative / Not Interested</option>
                    <option value="Converted">Successfully Converted</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Call Status</label>
                <select 
                  className="form-select" 
                  value={form.callStatus} 
                  onChange={e => setForm({ ...form, callStatus: e.target.value })}
                  style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                >
                  <option value="Received">Connected</option>
                  <option value="Not Received">No Answer / Busy</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ color: '#64748b' }}>Conversation Remarks</label>
              <textarea 
                className="form-textarea" 
                value={form.remarks} 
                onChange={e => setForm({ ...form, remarks: e.target.value })} 
                placeholder="Briefly describe what was discussed, any objections, or specific interests..."
                style={{ 
                  minHeight: 120, 
                  borderRadius: 16, 
                  border: '2px solid #e2e8f0', 
                  padding: '16px',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Follow-up Date (Today)</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={form.followUpDate} 
                  onChange={e => setForm({ ...form, followUpDate: e.target.value })} 
                  style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#64748b' }}>Schedule Next Call</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={form.nextCallDate} 
                  onChange={e => setForm({ ...form, nextCallDate: e.target.value })} 
                  style={{ height: 48, borderRadius: 12, border: '2px solid #e2e8f0', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 12 }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{ flex: 2, height: 48, borderRadius: 12, background: 'var(--secondary)', boxShadow: '0 4px 12px rgba(14,165,233,0.2)' }}
            >
              {saving ? 'Saving...' : 'Save Interaction'}
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
