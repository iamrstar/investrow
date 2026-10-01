'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  X, Plus, CheckCircle, Clock, Calendar, User, Phone, Video, 
  ListTodo, AlertCircle, Upload, Image as ImageIcon, ArrowRight,
  ShieldAlert, Check, ExternalLink, Trash2
} from 'lucide-react';

export default function ClientTasksModal({ client, onClose, onTaskUpdated }) {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamUsers, setTeamUsers] = useState([]);

  // Create Task Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'Task',
    priority: 'Medium',
    assignedTo: currentUser?._id || currentUser?.id || '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '11:00',
  });

  // Complete Task Modal State
  const [completingTask, setCompletingTask] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionScreenshot, setCompletionScreenshot] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Screenshot Preview Modal
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!client?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?leadId=${client._id}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  }, [client?._id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // Fetch users for assignment dropdown
    fetch('/api/users?role=user')
      .then(r => r.json())
      .then(d => {
        const users = d.users || [];
        setTeamUsers(users);
        if (!newTask.assignedTo && users.length > 0) {
          setNewTask(prev => ({ ...prev, assignedTo: currentUser?._id || users[0]._id }));
        }
      })
      .catch(err => console.error('Failed to fetch team users', err));
  }, [currentUser]);

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      return addToast('Please enter a task title', 'error');
    }

    setCreating(true);
    try {
      let combinedDueDate = null;
      if (newTask.dueDate) {
        const timePart = newTask.dueTime ? `T${newTask.dueTime}:00` : 'T12:00:00';
        combinedDueDate = new Date(`${newTask.dueDate}${timePart}`);
      }

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        type: newTask.type,
        priority: newTask.priority,
        assignedTo: newTask.assignedTo || currentUser?._id,
        leadId: client._id,
        dueDate: combinedDueDate,
        scheduledAt: combinedDueDate,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create task');
      }

      addToast('Task created and assigned successfully!', 'success');
      setShowCreateForm(false);
      setNewTask({
        title: '',
        description: '',
        type: 'Task',
        priority: 'Medium',
        assignedTo: currentUser?._id || (teamUsers[0]?._id || ''),
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:00',
      });
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  // Handle Accept Task
  const handleAcceptTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Accepted' }),
      });

      if (!res.ok) throw new Error('Failed to accept task');

      addToast('Task accepted! It is now in progress.', 'success');
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle Screenshot File Upload
  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload screenshot');
      }

      setCompletionScreenshot(data.url);
      addToast('Screenshot uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // Handle Submit Complete Task
  const handleSubmitCompleteTask = async (e) => {
    e.preventDefault();
    if (!completingTask?._id) return;

    setCompleting(true);
    try {
      const payload = {
        status: 'Completed',
        remarks: completionRemarks.trim(),
        screenshot: completionScreenshot || '',
      };

      const res = await fetch(`/api/tasks/${completingTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to complete task');
      }

      addToast('Task marked as completed! Remarks & history recorded.', 'success');
      setCompletingTask(null);
      setCompletionRemarks('');
      setCompletionScreenshot('');
      fetchTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent': return { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' };
      case 'High': return { bg: '#FFEDD5', color: '#C2410C', border: '#FDBA74' };
      case 'Low': return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
      default: return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span style={{ 
            fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', 
            borderRadius: 8, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <Check size={12} /> Completed
          </span>
        );
      case 'Accepted':
      case 'In Progress':
        return (
          <span style={{ 
            fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', 
            borderRadius: 8, background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <Clock size={12} /> In Progress / Accepted
          </span>
        );
      default:
        return (
          <span style={{ 
            fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', 
            borderRadius: 8, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <AlertCircle size={12} /> Pending Acceptance
          </span>
        );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 680, 
          width: '95%',
          borderRadius: 24, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          background: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 28px', 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, #0EA5E9, #2563EB)', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ListTodo size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Tasks for {client?.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Assign action items, accept responsibilities, and track completion proofs
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!showCreateForm && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateForm(true)}
                style={{ 
                  borderRadius: 10, 
                  padding: '7px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
                  border: 'none',
                  color: '#FFFFFF'
                }}
              >
                <Plus size={15} /> Add Task
              </button>
            )}
            <button className="modal-close" onClick={onClose} style={{ padding: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          
          {/* Create Task Form */}
          {showCreateForm && (
            <div style={{ 
              marginBottom: 24, 
              padding: '20px', 
              background: '#F8FAFC', 
              borderRadius: 18, 
              border: '1.5px solid #0EA5E9',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                  Create & Assign Task
                </h4>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowCreateForm(false)}
                  style={{ color: '#64748B', padding: 4 }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>

              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Collect PAN card & cancelled cheque for mandate"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      background: '#FFFFFF'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Task Type
                    </label>
                    <select
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="Task">Task / Operational</option>
                      <option value="Call">Phone Call</option>
                      <option value="Meeting">Meeting</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent / Immediate</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Assign To Staff *
                    </label>
                    <select
                      value={newTask.assignedTo}
                      onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        background: '#FFFFFF'
                      }}
                    >
                      {currentUser && (
                        <option value={currentUser._id || currentUser.id}>
                          Assign to Myself ({currentUser.name})
                        </option>
                      )}
                      {teamUsers.filter(u => String(u._id) !== String(currentUser?._id || currentUser?.id)).map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Target Time
                    </label>
                    <input
                      type="time"
                      value={newTask.dueTime}
                      onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Instructions / Notes for Staff (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide context or steps for the assigned staff member..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                      background: '#FFFFFF',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowCreateForm(false)}
                    style={{ borderRadius: 8 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="btn btn-primary btn-sm"
                    style={{ 
                      borderRadius: 8, 
                      padding: '8px 18px', 
                      background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
                      border: 'none',
                      fontWeight: 700
                    }}
                  >
                    {creating ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Task List */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 12 }}>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px', 
              background: '#F8FAFC', 
              borderRadius: 20, 
              border: '1.5px dashed #CBD5E1' 
            }}>
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: '#E0F2FE', 
                color: '#0284C7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 14px' 
              }}>
                <Clock size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                No Tasks Found for This Client
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748B', maxWidth: 380, marginInline: 'auto' }}>
                Create a task to assign KYC collection, follow-up calls, or financial reviews to staff.
              </p>
              {!showCreateForm && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateForm(true)}
                  style={{ borderRadius: 10, padding: '8px 18px', fontWeight: 700 }}
                >
                  <Plus size={15} /> Create First Task
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tasks.map(task => {
                const isCompleted = task.status === 'Completed';
                const isAccepted = task.status === 'Accepted' || task.status === 'In Progress';
                const isPending = !isCompleted && !isAccepted;
                const pStyle = getPriorityStyle(task.priority);

                // Check if current user is the assignee or admin/RM
                const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(currentUser?._id || currentUser?.id);
                const isAdminOrCreator = currentUser?.role === 'admin' || String(task.createdBy?._id || task.createdBy) === String(currentUser?._id || currentUser?.id);
                const canAct = isAssignee || isAdminOrCreator;

                return (
                  <div 
                    key={task._id}
                    style={{
                      background: isCompleted ? '#F8FAFC' : '#FFFFFF',
                      border: `1.5px solid ${isCompleted ? '#E2E8F0' : (isAccepted ? '#BAE6FD' : '#CBD5E1')}`,
                      borderRadius: 18,
                      padding: '18px 20px',
                      boxShadow: isCompleted ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 260 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 12, 
                          background: task.type === 'Call' ? '#DCFCE7' : (task.type === 'Meeting' ? '#F3E8FF' : '#E0F2FE'),
                          color: task.type === 'Call' ? '#15803D' : (task.type === 'Meeting' ? '#7E22CE' : '#0284C7'),
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {task.type === 'Call' ? <Phone size={18} /> : (task.type === 'Meeting' ? <Video size={18} /> : <ListTodo size={18} />)}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ 
                              fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                              background: pStyle.bg, color: pStyle.color, border: `1px solid ${pStyle.border}` 
                            }}>
                              {task.priority || 'Medium'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                              {task.type}
                            </span>
                            {getStatusBadge(task.status)}
                          </div>

                          <h4 style={{ 
                            margin: '0 0 4px', 
                            fontSize: '0.98rem', 
                            fontWeight: 800, 
                            color: isCompleted ? '#64748B' : '#0F172A',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                              {task.description}
                            </p>
                          )}

                          {/* People and dates info */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.76rem', color: '#64748B', marginTop: 6 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={13} style={{ color: '#0EA5E9' }} />
                              <strong>Assigned to:</strong> {task.assignedTo?.name || 'Staff Member'}
                            </span>
                            {task.createdBy && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <strong>By:</strong> {task.createdBy?.name || 'Admin'}
                              </span>
                            )}
                            {(task.dueDate || task.scheduledAt) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={13} style={{ color: '#F59E0B' }} />
                                <strong>Due:</strong> {new Date(task.dueDate || task.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Accept / Complete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {isPending && canAct && (
                          <button
                            type="button"
                            onClick={() => handleAcceptTask(task._id)}
                            className="btn btn-outline btn-sm"
                            style={{
                              borderRadius: 10,
                              padding: '6px 14px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              color: '#0284C7',
                              borderColor: '#BAE6FD',
                              background: '#F0F9FF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Check size={14} /> Accept Task
                          </button>
                        )}

                        {!isCompleted && canAct && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompletingTask(task);
                              setCompletionRemarks('');
                              setCompletionScreenshot('');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{
                              borderRadius: 10,
                              padding: '6px 14px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              border: 'none',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <CheckCircle size={14} /> Mark Complete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Completion Details & Screenshot View */}
                    {isCompleted && (
                      <div style={{ 
                        marginTop: 14, 
                        padding: '12px 16px', 
                        background: '#F0FDF4', 
                        borderRadius: 12, 
                        border: '1px solid #BBF7D0',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ color: '#166534', fontWeight: 700 }}>
                            ✓ Resolved & Completed {task.completedAt ? `on ${new Date(task.completedAt).toLocaleString()}` : ''}
                            {task.completedBy?.name ? ` by ${task.completedBy.name}` : ''}
                          </span>
                          
                          {task.screenshot && (
                            <button
                              type="button"
                              onClick={() => setViewScreenshotUrl(task.screenshot)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #86EFAC',
                                color: '#15803D',
                                padding: '3px 10px',
                                borderRadius: 6,
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <ImageIcon size={13} /> View Proof Screenshot
                            </button>
                          )}
                        </div>

                        {task.remarks && (
                          <div style={{ marginTop: 6, color: '#334155', fontStyle: 'italic' }}>
                            <strong>Staff Remarks:</strong> "{task.remarks}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 28px', 
          background: '#F8FAFC', 
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Showing {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </span>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={onClose}
            style={{ borderRadius: 10, padding: '7px 20px', fontWeight: 700 }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Completion Modal */}
      {completingTask && (
        <div 
          className="modal-backdrop" 
          onClick={() => setCompletingTask(null)}
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.6)' }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 520, borderRadius: 24, padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Complete Task</h4>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748B' }}>Provide resolution remarks and optional screenshot proof</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setCompletingTask(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitCompleteTask} style={{ padding: '24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Resolution Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record outcome, steps taken, or client response..."
                  value={completionRemarks}
                  onChange={e => setCompletionRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.86rem',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Proof Screenshot / Document (Optional)
                </label>
                
                {completionScreenshot ? (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#F0FDF4', 
                    border: '1.5px solid #86EFAC', 
                    borderRadius: 12, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ImageIcon size={20} style={{ color: '#16A34A' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                        Proof Attached
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewScreenshotUrl(completionScreenshot)}
                        style={{ color: '#0EA5E9', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCompletionScreenshot('')}
                        style={{ color: '#EF4444', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <label 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '16px',
                        borderRadius: 12,
                        border: '1.5px dashed #CBD5E1',
                        background: '#F8FAFC',
                        cursor: uploadingScreenshot ? 'wait' : 'pointer',
                        fontSize: '0.84rem',
                        color: '#64748B',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Upload size={18} style={{ color: '#0EA5E9' }} />
                      <span>{uploadingScreenshot ? 'Uploading image...' : 'Click to upload screenshot proof (PNG, JPG)'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingScreenshot}
                        onChange={handleScreenshotUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setCompletingTask(null)}
                  style={{ borderRadius: 10 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={completing || !completionRemarks.trim()}
                  className="btn btn-primary"
                  style={{ 
                    borderRadius: 10, 
                    padding: '9px 24px', 
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {completing ? 'Submitting...' : 'Mark as Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Screenshot Preview Modal */}
      {viewScreenshotUrl && (
        <div 
          className="modal-backdrop" 
          onClick={() => setViewScreenshotUrl(null)}
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.85)' }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 750, width: '90%', borderRadius: 20, padding: 0, overflow: 'hidden', background: '#0F172A' }}
          >
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={16} /> Task Completion Proof
              </span>
              <button 
                onClick={() => setViewScreenshotUrl(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 16, textAlign: 'center', maxHeight: '75vh', overflow: 'auto' }}>
              <img 
                src={viewScreenshotUrl} 
                alt="Proof Screenshot" 
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
