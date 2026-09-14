'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Settings, User, Lock, Save, Building2, Filter, Briefcase, 
  Shield, Bell, HardDrive, ChevronRight, CheckCircle, Database
} from 'lucide-react';
import Image from 'next/image';

const SETTINGS_SECTIONS = [
  { id: 'company', label: 'Company Profile', icon: Building2 },
  { id: 'lead_sources', label: 'Lead Sources', icon: Filter },
  { id: 'product_master', label: 'Product Master', icon: Briefcase },
  { id: 'roles', label: 'User Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notification Settings', icon: Bell },
  { id: 'backup', label: 'Backup & Security', icon: HardDrive },
];

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('company');

  // Profile Form States
  const [name, setName] = useState(user?.name || 'Birendra Kumar');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [companyName, setCompanyName] = useState('Investrow Financial Services');
  const [tagline, setTagline] = useState('Lead Today | Client Tomorrow | Growth Together');
  const [supportEmail, setSupportEmail] = useState('itsupport@investrow.in');
  
  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id || user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error('Failed to update');
      addToast('Profile updated!', 'success');
      await checkAuth();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id || user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      addToast('Password changed successfully!', 'success');
      setNewPassword('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: '24px 32px' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 800 }}>
            <Settings size={28} style={{ color: '#0EA5E9' }} />
            Settings
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
            System preferences, company profile, master data, and security controls
          </p>
        </div>
      </div>

      {/* Main Dual Layout: Left Category Directory (Panel 15) + Right Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left: Settings Menu (Panel 15) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ padding: '8px 12px 14px', borderBottom: '1px solid #F1F5F9', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settings Directory
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SETTINGS_SECTIONS.map(item => {
              const isSelected = activeSection === item.id;
              const IconComp = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: isSelected ? '1px solid #0EA5E9' : '1px solid transparent',
                    background: isSelected ? '#F0F9FF' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? '#0EA5E9' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={16} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#0369A1' : '#0F172A' }}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: isSelected ? '#0EA5E9' : '#94A3B8' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Section Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Company Profile Section (Panel 15) */}
          {activeSection === 'company' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Company Profile
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#64748B' }}>
                Corporate identity and branding configuration
              </p>

              {/* Logo Preview Banner */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: 16,
                padding: '20px 24px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 24
              }}>
                <div style={{
                  width: 140,
                  height: 52,
                  background: '#FFFFFF',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '4px 8px'
                }}>
                  <Image 
                    src="/logo.png" 
                    alt="Investrow Logo" 
                    width={130} 
                    height={44} 
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Official Brand Logo</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Brand colors: White, Sky Blue (#0EA5E9) & Orange (#F97316)</div>
                </div>
              </div>

              <form onSubmit={e => { e.preventDefault(); addToast('Company profile settings saved!', 'success'); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Company Name</label>
                    <input className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ borderRadius: 10 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Corporate Tagline</label>
                    <input className="form-input" value={tagline} onChange={e => setTagline(e.target.value)} style={{ borderRadius: 10 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Support Email</label>
                    <input className="form-input" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} style={{ borderRadius: 10 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>Primary Location</label>
                    <input className="form-input" defaultValue="Dhanbad, Jharkhand" style={{ borderRadius: 10 }} />
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" style={{ background: '#0EA5E9', borderRadius: 10, padding: '10px 24px' }}>
                  <Save size={16} /> Save Company Profile
                </button>
              </form>
            </div>
          )}

          {/* Lead Sources Section */}
          {activeSection === 'lead_sources' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Lead Sources Master</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Manage acquisition channels for financial leads</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addToast('Add Lead Source modal ready', 'info')} style={{ background: '#0EA5E9', borderRadius: 8 }}>
                  + Add Source
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Website (Organic)', 'Meta Ads (Facebook & Instagram)', 'Referral / Client Referral', 'Walk-in / Branch', 'Employee Network', 'Direct Campaign'].map((src, i) => (
                  <div key={i} style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{src}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '2px 10px', borderRadius: 10 }}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Master Section */}
          {activeSection === 'product_master' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Product Master</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Advisory products, insurance categories, and investment schemes</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addToast('Add Product modal ready', 'info')} style={{ background: '#0EA5E9', borderRadius: 8 }}>
                  + Add Product
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {[
                  { name: 'Mutual Funds (SIP & Lumpsum)', type: 'Wealth' },
                  { name: 'Life Insurance (Term & Savings)', type: 'Protection' },
                  { name: 'Health Insurance (Family & Individual)', type: 'Health' },
                  { name: 'Fixed Deposit & Government Bonds', type: 'Fixed Income' },
                  { name: 'Stock Market & Demat Accounts', type: 'Equities' },
                  { name: 'Tax Planning & ITR Filing', type: 'Advisory' },
                ].map((prod, i) => (
                  <div key={i} style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase' }}>{prod.type}</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginTop: 4 }}>{prod.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Roles Section */}
          {activeSection === 'roles' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>User Roles & Permissions</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B' }}>Role-based access controls and permissions matrix</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 16, borderRadius: 14, border: '1px solid #BAE6FD', background: '#F0F9FF' }}>
                  <div style={{ fontWeight: 800, color: '#0369A1', fontSize: '0.95rem' }}>Director / Administrator</div>
                  <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: 4 }}>Full access to financial dashboards, employee assignments, KYC verification, and reports.</div>
                </div>

                <div style={{ padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>Relationship Manager (RM)</div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: 4 }}>Portfolio review access, lead follow-ups, client KYC uploads, and communication dispatch.</div>
                </div>

                <div style={{ padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>Sales Executive</div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: 4 }}>Lead creation, initial calls, schedule follow-ups, and customer acquisition logging.</div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Notification Settings</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B' }}>Automated alerts for follow-ups, SIP dues, and policy renewals</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { title: 'WhatsApp Follow-up Reminders', desc: 'Notify staff 15 minutes before scheduled call/meeting' },
                  { title: 'SIP Payment Due Alerts', desc: 'Automatic reminder to clients 3 days prior to SIP mandate' },
                  { title: 'Policy Renewal Alerts', desc: 'Trigger notifications 30 days before insurance expiration' },
                  { title: 'Overdue Follow-up Escalation', desc: 'Highlight overdue follow-up tags on employee dashboard' },
                ].map((notif, i) => (
                  <div key={i} style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{notif.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{notif.desc}</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup & Security Section */}
          {activeSection === 'backup' && (
            <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Backup & Security</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B' }}>Database status, automated backups, and password security</p>

              {/* Database Status Card */}
              <div style={{ padding: 18, borderRadius: 14, border: '1px solid #A7F3D0', background: '#ECFDF5', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <Database size={24} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>MongoDB Database Connected</div>
                  <div style={{ fontSize: '0.8rem', color: '#047857' }}>Cluster: Arogya • Automated daily backups active • 99.99% uptime</div>
                </div>
              </div>

              {/* Password Change Sub-Form */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} color="#0EA5E9" /> Change Password
                </h4>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748B' }}>New Password</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      minLength={6} 
                      placeholder="Minimum 6 characters" 
                      required 
                      style={{ borderRadius: 10 }}
                    />
                  </div>
                  <button className="btn btn-secondary" type="submit" disabled={saving} style={{ borderRadius: 10 }}>
                    <Lock size={16} /> {saving ? 'Changing...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
