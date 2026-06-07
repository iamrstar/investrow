'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { FileText, Search, Shield, Users, FolderOpen, User, Folder } from 'lucide-react';
import ClientDocumentsModal from '@/components/ClientDocumentsModal';
import UserDocumentsModal from '@/components/UserDocumentsModal';

export default function DocumentVaultPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'users'
  const [search, setSearch] = useState('');
  
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeClient, setActiveClient] = useState(null);
  const [activeUser, setActiveUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, usersRes] = await Promise.all([
        fetch('/api/leads?response=Converted&limit=2000'),
        fetch('/api/users?limit=1000')
      ]);
      
      const clientsData = await clientsRes.json();
      const usersData = await usersRes.json();
      
      if (clientsData.leads) {
        // Calculate document counts
        const enrichedClients = clientsData.leads.map(c => {
          const onboardingCount = (c.onboardingData || []).filter(d => d.value && String(d.value).startsWith('/uploads/')).length;
          const adhocCount = (c.documents || []).length;
          return { ...c, totalDocs: onboardingCount + adhocCount };
        });
        // Sort by those who have documents first
        enrichedClients.sort((a, b) => b.totalDocs - a.totalDocs);
        setClients(enrichedClients);
      }
      
      if (usersData.users) {
        const enrichedUsers = usersData.users.map(u => {
          return { ...u, totalDocs: (u.documents || []).length };
        });
        enrichedUsers.sort((a, b) => b.totalDocs - a.totalDocs);
        setUsers(enrichedUsers);
      }
      
    } catch (err) {
      addToast('Failed to load vault data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  if (user && user.role !== 'admin') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, background: 'var(--secondary-50)', color: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>Only administrators can access the Document Vault.</p>
        </div>
      </div>
    );
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title">
          <FolderOpen size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Document Vault
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 250, maxWidth: 500 }}>
          <Search size={18} />
          <input 
            className="form-input" 
            placeholder={`Search ${activeTab}...`}
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ borderRadius: 12, border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button 
          className={`btn ${activeTab === 'clients' ? 'btn-secondary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('clients'); setSearch(''); }}
          style={{ borderRadius: 12 }}
        >
          <Users size={18} /> Client Vault
        </button>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-secondary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('users'); setSearch(''); }}
          style={{ borderRadius: 12 }}
        >
          <User size={18} /> Staff Vault
        </button>
      </div>

      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {activeTab === 'clients' && filteredClients.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: 'white', borderRadius: 16 }}>
              <Folder size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text-muted)' }}>No clients found</h3>
            </div>
          )}
          
          {activeTab === 'users' && filteredUsers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: 'white', borderRadius: 16 }}>
              <Folder size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text-muted)' }}>No staff found</h3>
            </div>
          )}

          {activeTab === 'clients' && filteredClients.map(client => (
            <div 
              key={client._id} 
              className="dashboard-card" 
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-light)' }}
              onClick={() => setActiveClient(client)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{client.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{client.phone} • {client.service}</div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: client.totalDocs > 0 ? 'var(--secondary-50)' : 'var(--bg-body)', 
                  color: client.totalDocs > 0 ? 'var(--secondary-dark)' : 'var(--text-muted)', 
                  padding: '6px 12px', 
                  borderRadius: 20, 
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  <FileText size={14} />
                  {client.totalDocs} {client.totalDocs === 1 ? 'Doc' : 'Docs'}
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'users' && filteredUsers.map(u => (
            <div 
              key={u._id} 
              className="dashboard-card" 
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-light)' }}
              onClick={() => setActiveUser(u)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{u.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: u.totalDocs > 0 ? 'var(--secondary-50)' : 'var(--bg-body)', 
                  color: u.totalDocs > 0 ? 'var(--secondary-dark)' : 'var(--text-muted)', 
                  padding: '6px 12px', 
                  borderRadius: 20, 
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  <FileText size={14} />
                  {u.totalDocs} {u.totalDocs === 1 ? 'Doc' : 'Docs'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeClient && (
        <ClientDocumentsModal
          client={activeClient}
          onClose={() => setActiveClient(null)}
          onUpdate={fetchData}
        />
      )}

      {activeUser && (
        <UserDocumentsModal
          user={activeUser}
          onClose={() => setActiveUser(null)}
          onUpdate={fetchData}
        />
      )}

    </div>
  );
}
