'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Users, X, Edit, Trash2, Shield, UserCheck, UserX, Search, Eye, EyeOff } from 'lucide-react';

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



  if (user?.role !== 'admin') {
    return (
      <div className="page-content">
        <div className="empty-state">
          <Shield size={64} />
          <h3>Access Denied</h3>
          <p>Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

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
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title"><Users size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />User Management</h1>
        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search />
          <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Password</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><Users size={48} /><h3>No users found</h3></div></td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${roleColor(u.role)}`}>{u.role}</span></td>
                    <td style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.9rem', 
                      color: showPasswords[u._id] ? 'var(--secondary-dark)' : 'var(--text-muted)',
                      background: showPasswords[u._id] ? 'var(--secondary-50)' : 'transparent',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontWeight: showPasswords[u._id] ? '700' : '400'
                    }}>
                      {showPasswords[u._id] ? (u.plainPassword || '(No password found - please update it)') : '••••••••'}
                    </td>

                    <td>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={u.isActive} onChange={() => toggleActive(u)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => setShowPasswords(prev => ({ ...prev, [u._id]: !prev[u._id] }))}
                          title={showPasswords[u._id] ? 'Hide Password' : 'Show Password'}
                        >
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingUser(u); setShowModal(true); }}><Edit size={16} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u._id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
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
