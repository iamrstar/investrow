'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Save, Plus, Trash2, Settings, ListPlus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function FormControlPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [settings, setSettings] = useState({
    defaultFields: [],
    globalCustomFields: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    fetch('/api/form-control')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/form-control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('Form settings updated successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateDefaultField = (index, field, value) => {
    const updated = [...settings.defaultFields];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, defaultFields: updated });
  };

  const addGlobalCustomField = () => {
    setSettings({
      ...settings,
      globalCustomFields: [
        ...settings.globalCustomFields,
        { label: 'New Custom Field', fieldType: 'Text', options: [], isRequired: false }
      ]
    });
  };

  const updateGlobalCustomField = (index, field, value) => {
    const updated = [...settings.globalCustomFields];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, globalCustomFields: updated });
  };

  const removeGlobalCustomField = (index) => {
    const updated = [...settings.globalCustomFields];
    updated.splice(index, 1);
    setSettings({ ...settings, globalCustomFields: updated });
  };

  if (user?.role !== 'admin') {
    return <div className="page-content"><h3>Unauthorized</h3></div>;
  }

  if (loading) return <div className="page-content"><div className="spinner"></div></div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">
            <Settings size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
            Form Control Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Customize the default fields and add global custom fields for all leads and clients.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '12px 24px', borderRadius: 12 }}
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 32, gridTemplateColumns: '1fr' }}>
        
        {/* Default Fields Configuration */}
        <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListPlus size={20} style={{ color: 'var(--secondary)' }} />
            Standard Form Fields
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1fr 1fr', gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid var(--border-light)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <div>System Field</div>
            <div>Display Label</div>
            <div>Required?</div>
            <div>Min Length</div>
            <div>Max Length</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {settings.defaultFields.map((field, idx) => (
              <div key={field.name} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1fr 1fr', gap: 16, alignItems: 'center', background: 'var(--bg-body)', padding: '16px', borderRadius: 12 }}>
                <div style={{ fontFamily: 'monospace', color: 'var(--secondary-dark)', fontWeight: 600 }}>{field.name}</div>
                <div>
                  <input 
                    className="form-input" 
                    value={field.label} 
                    onChange={e => updateDefaultField(idx, 'label', e.target.value)}
                    style={{ background: 'white' }}
                  />
                </div>
                <div>
                  <button 
                    className={`btn ${field.isRequired ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                    onClick={() => updateDefaultField(idx, 'isRequired', !field.isRequired)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {field.isRequired ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} 
                    {field.isRequired ? 'Yes' : 'No'}
                  </button>
                </div>
                <div>
                  <input 
                    className="form-input" 
                    type="number"
                    placeholder="None"
                    value={field.minLength || ''} 
                    onChange={e => updateDefaultField(idx, 'minLength', e.target.value ? parseInt(e.target.value) : null)}
                    style={{ background: 'white' }}
                  />
                </div>
                <div>
                  <input 
                    className="form-input" 
                    type="number"
                    placeholder="None"
                    value={field.maxLength || ''} 
                    onChange={e => updateDefaultField(idx, 'maxLength', e.target.value ? parseInt(e.target.value) : null)}
                    style={{ background: 'white' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Custom Fields Configuration */}
        <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={20} style={{ color: 'var(--secondary)' }} />
              Global Custom Fields
            </h2>
            <button className="btn btn-outline" onClick={addGlobalCustomField} style={{ borderRadius: 12 }}>
              <Plus size={16} /> Add Custom Field
            </button>
          </div>
          
          {settings.globalCustomFields.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px', background: 'var(--bg-body)', borderRadius: 16 }}>
              <ListPlus size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p>No global custom fields defined yet.</p>
              <button className="btn btn-secondary btn-sm" onClick={addGlobalCustomField} style={{ marginTop: 12 }}>Add First Field</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {settings.globalCustomFields.map((field, idx) => (
                <div key={idx} style={{ background: 'var(--bg-body)', padding: 24, borderRadius: 16, border: '1px solid var(--border-light)', position: 'relative' }}>
                  <button 
                    onClick={() => removeGlobalCustomField(idx)}
                    style={{ position: 'absolute', top: 16, right: 16, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40 }}>
                    <div className="form-group">
                      <label className="form-label">Field Label</label>
                      <input 
                        className="form-input" 
                        value={field.label} 
                        onChange={e => updateGlobalCustomField(idx, 'label', e.target.value)} 
                        style={{ background: 'white' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Type</label>
                      <select 
                        className="form-select" 
                        value={field.fieldType} 
                        onChange={e => updateGlobalCustomField(idx, 'fieldType', e.target.value)}
                        style={{ background: 'white' }}
                      >
                        <option value="Text">Text Input</option>
                        <option value="Number">Number Input</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40 }}>
                    <div className="form-group">
                      <label className="form-label">Min Length</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="Unlimited" 
                        value={field.minLength || ''} 
                        onChange={e => updateGlobalCustomField(idx, 'minLength', e.target.value ? parseInt(e.target.value) : null)} 
                        style={{ background: 'white' }} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Length</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="Unlimited" 
                        value={field.maxLength || ''} 
                        onChange={e => updateGlobalCustomField(idx, 'maxLength', e.target.value ? parseInt(e.target.value) : null)} 
                        style={{ background: 'white' }} 
                      />
                    </div>
                  </div>                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Requirement:</label>
                    <button 
                      className={`btn ${field.isRequired ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                      onClick={() => updateGlobalCustomField(idx, 'isRequired', !field.isRequired)}
                    >
                      {field.isRequired ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} 
                      {field.isRequired ? 'Required Field' : 'Optional Field'}
                    </button>
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
