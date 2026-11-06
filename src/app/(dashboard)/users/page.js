'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Users, X, Edit, Trash2, Shield, UserCheck, UserX, Search, Eye, EyeOff, FileText, IndianRupee } from 'lucide-react';
import UserDocumentsModal from '@/components/UserDocumentsModal';
import SalarySlipModal from '@/components/SalarySlipModal';

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
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryEmployee, setSalaryEmployee] = useState(null);
  const [salaryEmpId, setSalaryEmpId] = useState('');
  const [salaryExistingSlip, setSalaryExistingSlip] = useState(null);



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
      const url = isUpdate ? `/api/users/${editingUser._id}` : '/api/users';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      addToast(editingUser ? 'User updated successfully!' : 'User created successfully!', 'success');
      setShowModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) { 
      console.error(err);
      addToast(err.message || 'Failed to save user', 'error'); 
    }
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
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right', minWidth: 260, width: 260 }}>Action</th>
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
                  const roleLabel = u.designation || (u.role === 'admin' ? 'Director (Admin)' : (idx % 2 === 0 ? 'Sales Executive' : 'Relationship Manager'));

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
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                            {u.designation && (
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{u.designation}</div>
                            )}
                          </div>
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
                      <td style={{ padding: '14px 20px', textAlign: 'right', minWidth: 260, width: 260, whiteSpace: 'nowrap' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
                          {isAdmin && (
                            <button 
                              type="button"
                              className="btn-pill-action" 
                              onClick={() => { 
                                setSalaryExistingSlip(null);
                                setSalaryEmployee(u); 
                                setSalaryEmpId(empId); 
                                setShowSalaryModal(true); 
                              }}
                              title="Mark Salary Released & Send Payslip"
                              style={{
                                width: 'auto',
                                minWidth: 'max-content',
                                height: 32,
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                padding: '0 12px',
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              <IndianRupee size={14} style={{ flexShrink: 0 }} /> <span>Release Salary</span>
                            </button>
                          )}
                          <button 
                            type="button"
                            className="btn btn-ghost btn-sm" 
                            onClick={() => { setDocumentsUser(u); setShowDocumentsModal(true); }}
                            title="Documents"
                            style={{ color: '#0EA5E9', padding: '6px 8px', flexShrink: 0 }}
                          >
                            <FileText size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button 
                                type="button"
                                className="btn btn-ghost btn-sm" 
                                onClick={() => { setEditingUser(u); setShowModal(true); }}
                                title="Edit"
                                style={{ color: '#0F172A', padding: '6px 8px', flexShrink: 0 }}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button"
                                className="btn btn-ghost btn-sm" 
                                onClick={() => handleDelete(u._id)} 
                                title="Delete"
                                style={{ color: '#EF4444', padding: '6px 8px', flexShrink: 0 }}
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
          isAdmin={isAdmin}
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

      {showSalaryModal && salaryEmployee && (
        <SalarySlipModal
          employee={salaryEmployee}
          empId={salaryEmpId}
          existingSlip={salaryExistingSlip}
          initialTab={salaryExistingSlip ? 'preview' : 'form'}
          onClose={() => { setShowSalaryModal(false); setSalaryEmployee(null); setSalaryExistingSlip(null); }}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
}

function UserFormModal({ editUser, isAdmin, onClose, onSave }) {
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'user',
    phone: editUser?.phone || '',
    salary: editUser?.salary !== undefined ? editUser.salary : '',
    designation: editUser?.designation || '',
    pf: editUser?.pf !== undefined ? editUser.pf : '',
    professionalTax: editUser?.professionalTax !== undefined ? editUser.professionalTax : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password && editUser) delete data.password;
    data.salary = data.salary !== '' && data.salary !== undefined ? Number(data.salary) : 0;
    data.pf = data.pf !== '' && data.pf !== undefined ? Number(data.pf) : 0;
    data.professionalTax = data.professionalTax !== '' && data.professionalTax !== undefined ? Number(data.professionalTax) : 0;
    data.designation = data.designation ? data.designation.trim() : '';
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

            {isAdmin && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Relationship Manager / Sales Executive" 
                      value={form.designation} 
                      onChange={e => setForm({ ...form, designation: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Monthly Salary (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="e.g. 35000" 
                      value={form.salary} 
                      onChange={e => setForm({ ...form, salary: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Default PF Deduction (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="e.g. 1800 (optional)" 
                      value={form.pf} 
                      onChange={e => setForm({ ...form, pf: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Professional Tax (PT) (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="e.g. 200 (optional)" 
                      value={form.professionalTax} 
                      onChange={e => setForm({ ...form, professionalTax: e.target.value })} 
                    />
                  </div>
                </div>
              </>
            )}
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
