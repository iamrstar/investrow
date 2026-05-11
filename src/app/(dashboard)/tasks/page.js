'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, ListTodo, X, CheckCircle, Clock, AlertCircle, 
  Edit, Trash2, Mail, Send, UserPlus, Users, Phone,
  Video, Calendar, ChevronLeft, ChevronRight, Filter, Search
} from 'lucide-react';
import LogFollowUpModal from '@/components/LogFollowUpModal';

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    counts: { leadTasks: 0, meetings: 0, calls: 0 },
    tabs: { today: 0, upcoming: 0, missed: 0 }
  });
  
  // View States
  const [activeTab, setActiveTab] = useState('today'); // today, upcoming, missed, range
  const [viewMode, setViewMode] = useState('list'); // list, calendar
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState(null); // null, Task, Meeting, Call
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [activeTaskForFollowUp, setActiveTaskForFollowUp] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [teamUsers, setTeamUsers] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/stats');
      const data = await res.json();
      if (data.counts) setStats(data);
    } catch (err) { console.error('Failed to fetch stats', err); }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('dateFilter', activeTab);
      if (search) params.set('search', search);
      if (activeTab === 'range') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }
      if (typeFilter) params.set('type', typeFilter);
      
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [activeTab, search, startDate, endDate, typeFilter, addToast]);

  useEffect(() => { 
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetch('/api/users?role=user').then(r => r.json()).then(d => setTeamUsers(d.users || []));
    }
  }, [user]);

  const handleSaveTask = async (formData) => {
    try {
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
      fetchStats();
    } catch { addToast('Failed to save task', 'error'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: newStatus }) 
      });
      if (!res.ok) throw new Error('Failed');
      addToast(`Task marked as ${newStatus}`, 'success');
      fetchTasks();
      fetchStats();
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleLogFollowUp = async (formData) => {
    try {
      const res = await fetch(`/api/leads/${followUpLead._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to log follow-up');

      // Also complete the task
      if (activeTaskForFollowUp) {
        await fetch(`/api/tasks/${activeTaskForFollowUp._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed', outcomeId: activeTaskForFollowUp._id }), // simplified
        });
      }

      addToast('Follow-up record created and task completed!', 'success');
      setShowFollowUp(false);
      setFollowUpLead(null);
      setActiveTaskForFollowUp(null);
      fetchTasks();
      fetchStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    addToast('Task deleted', 'success');
    fetchTasks();
    fetchStats();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Organize and manage your task sequence.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowModal(true); }}>
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        <div 
          className={`task-stat-card ${typeFilter === 'Task' ? 'active' : ''}`} 
          onClick={() => setTypeFilter(typeFilter === 'Task' ? null : 'Task')}
          style={{ cursor: 'pointer', background: typeFilter === 'Task' ? 'var(--secondary)' : 'white', color: typeFilter === 'Task' ? 'white' : 'inherit' }}
        >
          <div className="stat-icon-wrapper" style={{ color: typeFilter === 'Task' ? 'white' : 'inherit', background: typeFilter === 'Task' ? 'rgba(255,255,255,0.2)' : 'var(--bg-body)' }}><ListTodo size={24} /></div>
          <div className="stat-label">LEAD TASKS</div>
          <div className="stat-value">{stats.counts.leadTasks}</div>
        </div>
        <div 
          className={`task-stat-card ${typeFilter === 'Meeting' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'Meeting' ? null : 'Meeting')}
          style={{ cursor: 'pointer', background: typeFilter === 'Meeting' ? '#8b5cf6' : 'white', color: typeFilter === 'Meeting' ? 'white' : 'inherit' }}
        >
          <div className="stat-icon-wrapper" style={{ color: typeFilter === 'Meeting' ? 'white' : '#8b5cf6', background: typeFilter === 'Meeting' ? 'rgba(255,255,255,0.2)' : '#f5f3ff' }}><Video size={24} /></div>
          <div className="stat-label">MEETINGS</div>
          <div className="stat-value">{stats.counts.meetings}</div>
        </div>
        <div 
          className={`task-stat-card ${typeFilter === 'Call' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'Call' ? null : 'Call')}
          style={{ cursor: 'pointer', background: typeFilter === 'Call' ? 'var(--secondary)' : 'white', color: typeFilter === 'Call' ? 'white' : 'inherit' }}
        >
          <div className="stat-icon-wrapper" style={{ color: typeFilter === 'Call' ? 'white' : 'var(--secondary)', background: typeFilter === 'Call' ? 'rgba(255,255,255,0.2)' : 'var(--secondary-50)' }}><Phone size={24} /></div>
          <div className="stat-label">CALL SCHEDULES</div>
          <div className="stat-value">{stats.counts.calls}</div>
        </div>
      </div>

      {/* Tabs and View Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'var(--bg-card)', padding: '12px 24px', borderRadius: 16, border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            TODAY <span className="tab-count">{stats.tabs.today}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            UPCOMING <span className="tab-count">{stats.tabs.upcoming}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'missed' ? 'active' : ''}`}
            onClick={() => setActiveTab('missed')}
          >
            MISSED <span className="tab-count">{stats.tabs.missed}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'range' ? 'active' : ''}`}
            onClick={() => setActiveTab('range')}
          >
            RANGE
          </button>
        </div>

        {activeTab === 'range' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderLeft: '1px solid var(--border-light)', margin: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>FROM:</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: 130, height: 32, padding: '0 8px', fontSize: '0.8rem', borderRadius: 8 }} 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>TO:</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: 130, height: 32, padding: '0 8px', fontSize: '0.8rem', borderRadius: 8 }} 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ width: 240, margin: 0 }}>
            <Search size={16} />
            <input className="form-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListTodo size={18} /></button>
            <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}><Calendar size={18} /></button>
          </div>
        </div>
      </div>

      {/* Task List or Calendar */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner"></div></div>
      ) : viewMode === 'list' ? (
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ background: 'white', border: '1px solid var(--border-light)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Calendar size={32} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Workspace Clear</h3>
              <p>No tasks pending for this category.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tasks.map(task => (
                <div key={task._id} className="task-card">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div className={`task-type-icon ${task.type.toLowerCase()}`}>
                      {task.type === 'Call' ? <Phone size={20} /> : task.type === 'Meeting' ? <Video size={20} /> : <ListTodo size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>{task.title}</h4>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {task.scheduledAt ? new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.leadId && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {task.leadId.name}</span>}
                            {task.meetingType && <span className="badge badge-blue">{task.meetingType}</span>}
                          </div>
                        </div>
                        <div className="task-actions">
                          {task.status !== 'Completed' && (
                            <button 
                              className="btn btn-success btn-sm" 
                              onClick={() => {
                                if (task.type === 'Call' || task.type === 'Meeting') {
                                  setFollowUpLead(task.leadId);
                                  setActiveTaskForFollowUp(task);
                                  setShowFollowUp(true);
                                } else {
                                  handleStatusChange(task, 'Completed');
                                }
                              }}
                            >
                              <CheckCircle size={16} /> Confirm
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTask(task); setShowModal(true); }}><Edit size={16} /></button>
                          <button className="btn btn-ghost btn-sm danger" onClick={() => handleDeleteTask(task._id)}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {task.notes && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 8, background: '#f8fafc', padding: '12px', borderRadius: 12 }}>{task.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <CustomCalendar tasks={tasks} />
      )}

      {/* Modals */}
      {showModal && (
        <TaskFormModal
          task={editingTask}
          users={teamUsers}
          currentUser={user}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSave={handleSaveTask}
        />
      )}

      {showFollowUp && followUpLead && (
        <LogFollowUpModal
          lead={followUpLead}
          onClose={() => { setShowFollowUp(false); setFollowUpLead(null); }}
          onSave={handleLogFollowUp}
        />
      )}

      <style jsx>{`
        .task-stat-card {
          padding: 32px;
          border-radius: 24px;
          background: white;
          border: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .task-stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        .task-stat-card.active {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          alignItems: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 900;
        }
        .tab-btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--secondary);
          color: white;
        }
        .tab-count {
          padding: 2px 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 20px;
          font-size: 0.75rem;
        }
        .tab-btn.active .tab-count {
          background: rgba(255,255,255,0.2);
        }
        .view-toggle {
          display: flex;
          background: var(--bg-body);
          padding: 4px;
          border-radius: 10px;
        }
        .toggle-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .toggle-btn.active {
          background: white;
          color: var(--secondary);
          box-shadow: var(--shadow-sm);
        }
        .task-card {
          padding: 24px;
          background: white;
          border-radius: 20px;
          border: 1px solid var(--border-light);
          transition: all 0.2s;
        }
        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--secondary-100);
        }
        .task-type-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .task-type-icon.call { background: var(--secondary-50); color: var(--secondary); }
        .task-type-icon.meeting { background: #f5f3ff; color: #8b5cf6; }
        .task-type-icon.task { background: #f1f5f9; color: #64748b; }
      `}</style>
    </div>
  );
}

function CustomCalendar({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);
  
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: offset }, (_, i) => i);

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledAt || task.dueDate);
      return taskDate.getDate() === day && taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });
  };

  return (
    <div className="calendar-container" style={{ background: 'white', borderRadius: 24, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div className="calendar-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date(year, month - 1))}><ChevronLeft size={20} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date(year, month + 1))}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>{day}</div>
        ))}
        {prevMonthDays.map(i => <div key={`prev-${i}`} style={{ padding: '20px', background: '#f8fafc', border: '0.5px solid #f1f5f9' }}></div>)}
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          
          return (
            <div key={day} style={{ 
              minHeight: 120, 
              padding: '12px', 
              border: '0.5px solid #f1f5f9',
              background: isToday ? 'var(--secondary-50)' : 'white'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--secondary)' : 'var(--text-primary)', marginBottom: 8 }}>{day}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task._id} style={{ 
                    fontSize: '0.7rem', 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    background: task.type === 'Call' ? 'var(--secondary-100)' : task.type === 'Meeting' ? '#ede9fe' : '#f1f5f9',
                    color: task.type === 'Call' ? 'var(--secondary-dark)' : task.type === 'Meeting' ? '#6d28d9' : '#475569',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 700
                  }}>
                    {task.type === 'Call' ? '📞' : task.type === 'Meeting' ? '🎥' : '📝'} {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: 4 }}>+ {dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskFormModal({ task, users, currentUser, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'Task',
    meetingType: task?.meetingType || '',
    platform: task?.platform || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'Pending',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || currentUser?._id || currentUser?.id || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    scheduledAt: task?.scheduledAt ? task.scheduledAt : null,
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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Task', 'Call', 'Meeting'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    className={`btn ${form.type === t ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setForm({ ...form, type: t })}
                    style={{ flex: 1 }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>

            {form.type === 'Meeting' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meeting Type</label>
                  <select className="form-select" value={form.meetingType} onChange={e => setForm({ ...form, meetingType: e.target.value })}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                {form.meetingType === 'Online' && (
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <input className="form-input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} placeholder="e.g. Google Meet" />
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
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
