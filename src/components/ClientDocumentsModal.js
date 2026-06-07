'use client';

import { useState, useRef } from 'react';
import { X, FileText, UploadCloud, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ClientDocumentsModal({ client, onClose, onUpdate }) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef(null);

  // Combine onboarding files + adhoc docs
  const onboardingDocs = (client.onboardingData || []).filter(d => 
    d.value && String(d.value).startsWith('/uploads/')
  ).map(d => ({
    _id: `onb-${d.label}`,
    name: d.label,
    url: d.value,
    uploadedAt: client.createdAt,
    isOnboarding: true
  }));

  const adhocDocs = client.documents || [];
  const allDocs = [...onboardingDocs, ...adhocDocs];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docName.trim()) return addToast('Please provide a document name', 'error');
    
    const file = fileInputRef.current?.files[0];
    if (!file) return addToast('Please select a file to upload', 'error');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      // Update lead documents array
      const newDoc = {
        name: docName,
        url: uploadData.url,
        uploadedAt: new Date().toISOString()
      };
      
      const newDocsArray = [...adhocDocs, newDoc];
      
      const res = await fetch(`/api/leads/${client._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocsArray })
      });
      
      if (!res.ok) throw new Error('Failed to update client record');
      
      addToast('Document uploaded successfully', 'success');
      setDocName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh client data in parent
      if (onUpdate) onUpdate();
      
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docIndex) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const newDocsArray = [...adhocDocs];
      newDocsArray.splice(docIndex, 1);
      
      const res = await fetch(`/api/leads/${client._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocsArray })
      });
      
      if (!res.ok) throw new Error('Failed to delete document');
      
      addToast('Document deleted', 'success');
      if (onUpdate) onUpdate();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h3 className="modal-title">Documents for {client.name}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px', background: 'var(--bg-body)' }}>
          
          {/* Upload Section */}
          <div style={{ background: 'white', padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>Upload New Document</h4>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Document Name / Label</label>
                <input 
                  className="form-input" 
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. PAN Card, Agreement"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Select File</label>
                <input 
                  type="file"
                  className="form-input"
                  ref={fileInputRef}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={uploading}
                style={{ alignSelf: 'flex-start' }}
              >
                {uploading ? 'Uploading...' : <><UploadCloud size={18} /> Upload Document</>}
              </button>
            </form>
          </div>

          {/* Existing Documents */}
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>All Documents</h4>
          {allDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 16 }}>
              <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)' }}>No documents found for this client.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {allDocs.map((doc, idx) => (
                <div key={doc._id || idx} style={{ 
                  background: 'white', 
                  padding: 16, 
                  borderRadius: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 10, background: 'var(--secondary-50)', color: 'var(--secondary)', borderRadius: 8 }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                        {doc.isOnboarding && <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Onboarding</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      View
                    </a>
                    {!doc.isOnboarding && (
                      <button 
                        onClick={() => handleDelete(idx - onboardingDocs.length)} 
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
