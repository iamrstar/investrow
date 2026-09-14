'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Users, X, Edit, Trash2, Shield, UserCheck, UserX, Search, Eye, EyeOff, FileText } from 'lucide-react';
import UserDocumentsModal from '@/components/UserDocumentsModal';

export default function UsersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPasswords, setShowPasswords] = useState({}); // Track visibility per user ID
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsUser, setDocumentsUser] = useState(null);



  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch { addToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers, roleFilter]);



  const isAdmin = user?.role === 'admin';

  const handleSave = async (formData) => {
    try {
      const isUpdate = !!editingUser;
      if (isUpdate && !confirm('Are you sure you want to update this user?')) return;
      
      const url = isUpdate ? `/api/users/${editingUser._id}` : '/api/users';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      addToast(editingUser ? 'User updated!' : 'User created!', 'success');
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const toggleActive = async (u) => {
    try {
      await fetch(`/api/users/${u._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !u.isActive }) });
      addToast(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchUsers();
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    addToast('User deleted', 'success');
    fetchUsers();
  };

  const roleColor = (r) => r === 'admin' ? 'badge-purple' : 'badge-orange';

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 800 }}>
            <Users size={28} style={{ color: '#0EA5E9' }} />
            Employee Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
            Manage staff credentials, assigned portfolios, and role permissions
          </p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            style={{ background: '#0EA5E9', borderRadius: 10, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Add Employee
          </button>
        )}
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input className="form-input" placeholder="Search employees by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: 10 }} />
        </div>
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180, borderRadius: 10 }}>
          <option value="">All Roles</option>
          <option value="admin">Administrator</option>
          <option value="user">Relationship Manager / Staff</option>
        </select>
      </div>

      <div className="card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div className="table-container">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ID</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Email</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Mobile</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><Users size={48} /><h3>No employees found</h3></div></td></tr>
              ) : (
                users.map((u, idx) => {
                  const empId = `EMP-${String(idx + 1).padStart(3, '0')}`;
                  const roleLabel = u.role === 'admin' ? 'Director (Admin)' : (idx % 2 === 0 ? 'Sales Executive' : 'Relationship Manager');

                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0EA5E9', fontSize: '0.85rem' }}>
                        {empId}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#E0F2FE', 
                            color: '#0284C7', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '3px 10px', 
                          borderRadius: 12, 
                          background: u.role === 'admin' ? '#EEF2FF' : '#F0F9FF', 
                          color: u.role === 'admin' ? '#4F46E5' : '#0284C7',
                          fontSize: '0.78rem',
                          fontWeight: 700 
                        }}>
                          {roleLabel}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748B' }}>{u.email}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#334155' }}>
                        {u.phone || '98XXXX1234'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 12,
                          background: u.isActive !== false ? '#ECFDF5' : '#FEF2F2',
                          color: u.isActive !== false ? '#059669' : '#DC2626',
                          border: `1px solid ${u.isActive !== false ? '#A7F3D0' : '#FECACA'}`,
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive !== false ? '#10B981' : '#EF4444' }} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { setDocumentsUser(u); setShowDocumentsModal(true); }}
                            title="Documents"
                            style={{ color: '#0EA5E9', padding: 6 }}
                          >
                            <FileText size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                onClick={() => { setEditingUser(u); setShowModal(true); }}
                                title="Edit"
                                style={{ color: '#0F172A', padding: 6 }}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                onClick={() => handleDelete(u._id)} 
                                title="Delete"
                                style={{ color: '#EF4444', padding: 6 }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UserFormModal
          editUser={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSave={handleSave}
        />
      )}
      
      {showDocumentsModal && documentsUser && (
        <UserDocumentsModal
          user={documentsUser}
          onClose={() => { setShowDocumentsModal(false); setDocumentsUser(null); }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}

function UserFormModal({ editUser, onClose, onSave }) {
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'user',
    phone: editUser?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password && editUser) delete data.password;
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editUser ? 'Edit User' : 'Create User'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                   <option value="user">User (Call Executive)</option>
                   <option value="admin">Admin</option>
                </select>
              </div>

            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editUser ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
