'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, ListTodo, X, CheckCircle, Clock, AlertCircle, 
  Edit, Trash2, Mail, Send, UserPlus, Users, Phone 
} from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // States
  const [tasks, setTasks] = useState([]);
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'unassigned'
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTask, setEmailTask] = useState(null);
  
  // Filters & Misc
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [teamUsers, setTeamUsers] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [assignRole, setAssignRole] = useState(''); // 'manager' or 'user'

  // Fetchers
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, addToast]);

  const fetchUnassignedLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/leads?assignedTo=unassigned');
      const data = await res.json();
      setUnassignedLeads(data.leads || []);
    } catch { if (!silent) addToast('Failed to load new loads', 'error'); }
    finally { if (!silent) setLoading(false); }
  }, [addToast]);

  useEffect(() => { 
    if (activeTab === 'tasks') {
      fetchTasks();
    } else {
      fetchUnassignedLeads();
    }
  }, [activeTab, fetchTasks, fetchUnassignedLeads]);

  useEffect(() => {
    // Initial fetch for unassigned count if we're on the tasks tab
    if (activeTab === 'tasks') {
      fetchUnassignedLeads(true);
    }
  }, []); // Only once on mount

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      // Only fetch managers for the assignment list as per requirement
      fetch('/api/users?role=manager').then(r => r.json()).then(d => {
        setTeamUsers(d.users || []);
      });
    }
  }, [user]);

  // Handlers
  const handleSaveTask = async (formData) => {
    try {
      if (editingTask && !confirm('Are you sure you want to update this task?')) return;
      const url = editingTask ? `/api/tasks/${editingTask._id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      });
      if (!res.ok) throw new Error('Failed');
      addToast(editingTask ? 'Task updated!' : 'Task created!', 'success');
      setShowModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch { addToast('Failed to save task', 'error'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (!confirm(`Mark this task as ${newStatus}?`)) return;
    try {
      await fetch(`/api/tasks/${task._id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: newStatus }) 
      });
      addToast(`Task marked as ${newStatus}`, 'success');
      fetchTasks();
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    addToast('Task deleted', 'success');
    fetchTasks();
  };

  const handleAssignLead = async (leadId, userId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast('Lead assigned successfully!', 'success');
      setShowAssignModal(false);
      setLeadToAssign(null);
      setAssignRole('');
      fetchUnassignedLeads();
    } catch {
      addToast('Failed to assign lead', 'error');
    }
  };

  const handleSendReminder = async (task) => {
    if (!task?.assignedTo?.email) {
      addToast('Assigned user does not have an email address', 'error');
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task._id, templateType: 'taskReminder' }),
      });
      if (!res.ok) throw new Error('Failed to send');
      addToast('Reminder sent to team member!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEmailSending(false);
    }
  };

  // UI Helpers
  const statusIcon = (s) => {
    if (s === 'Completed') return <CheckCircle size={16} style={{ color: '#22c55e' }} />;
    if (s === 'In Progress') return <Clock size={16} style={{ color: '#f59e0b' }} />;
    return <AlertCircle size={16} style={{ color: '#94a3b8' }} />;
  };

  const priorityBadge = (p) => {
    const cls = p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-orange' : 'badge-gray';
    return <span className={`badge ${cls}`}>{p}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title"><ListTodo size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />Task Management</h1>
        <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowModal(true); }}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{ 
            padding: '12px 4px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: activeTab === 'tasks' ? 'var(--secondary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'tasks' ? '2px solid var(--secondary)' : '2px solid transparent',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'var(--transition)'
          }}
        >
          My Tasks
        </button>
        <button 
          onClick={() => setActiveTab('unassigned')}
          style={{ 
            padding: '12px 4px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: activeTab === 'unassigned' ? 'var(--secondary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'unassigned' ? '2px solid var(--secondary)' : '2px solid transparent',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'var(--transition)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          New Loads (Unassigned)
          {unassignedLeads.length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{unassignedLeads.length}</span>}
        </button>
      </div>

      <div className="card">
        {activeTab === 'tasks' ? (
          <>
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div className="filters-bar" style={{ margin: 0 }}>
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <select className="form-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Lead</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7}><div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div></td></tr>
                  ) : tasks.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><ListTodo size={48} /><h3>No tasks found</h3><p>Create a task to track follow-ups</p></div></td></tr>
                  ) : (
                    tasks.map(task => (
                      <tr key={task._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</div>
                          {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                        </td>
                        <td>{priorityBadge(task.priority)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {statusIcon(task.status)}
                            <span style={{ fontSize: '0.8125rem' }}>{task.status}</span>
                          </div>
                        </td>
                        <td>{task.assignedTo?.name || '—'}</td>
                        <td>{task.leadId?.name || '—'}</td>
                        <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className="table-actions">
                            {task.status !== 'Completed' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(task, task.status === 'Pending' ? 'In Progress' : 'Completed')} title="Update Status">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={() => handleSendReminder(task)} title="Remind User" style={{ color: '#ef4444' }} disabled={emailSending}><Send size={16} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTask(task); setShowModal(true); }}><Edit size={16} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(task._id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>Created At</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div></td></tr>
                ) : unassignedLeads.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><Users size={48} /><h3>No unassigned leads</h3><p>New loads will appear here</p></div></td></tr>
                ) : (
                  unassignedLeads.map(lead => (
                    <tr key={lead._id}>
                      <td style={{ fontWeight: 600 }}>{lead.name}</td>
                      <td><Phone size={14} style={{ marginRight: 4 }} />{lead.phone}</td>
                      <td><span className="badge badge-blue">{lead.service}</span></td>
                      <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td>{lead.createdBy?.name || 'System'}</td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => { setLeadToAssign(lead); setShowAssignModal(true); }}
                        >
                          <UserPlus size={16} /> Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskFormModal
          task={editingTask}
          users={teamUsers}
          currentUser={user}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSave={handleSaveTask}
        />
      )}

      {/* Lead Assignment Modal */}
      {showAssignModal && leadToAssign && (
        <div className="modal-backdrop" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Lead</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20 }}>Assign <strong>{leadToAssign.name}</strong> to a team member:</p>
              
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
                      onSelect={(userId) => handleAssignLead(leadToAssign._id, userId)} 
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentList({ role, onSelect }) {
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
    <button key={u._id} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}
      onClick={() => onSelect(u._id)}>
      <UserPlus size={16} /> {u.name} ({u.email})
    </button>
  ));
}

function TaskFormModal({ task, users, currentUser, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'Pending',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || currentUser?._id || currentUser?.id || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const allUsers = [...(users || [])];
  if (currentUser && !allUsers.find(u => (u._id === currentUser._id || u._id === currentUser.id))) {
    allUsers.unshift({ _id: currentUser._id || currentUser.id, name: currentUser.name, email: currentUser.email });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Select user</option>
                  {allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : task ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
