'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Save, Plus, Trash2, Settings, ListPlus, ToggleLeft, ToggleRight, GripVertical, ChevronUp, ChevronDown, ArrowLeft, FileText, Users } from 'lucide-react';

export default function FormControlPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [targetType, setTargetType] = useState(null); // 'lead' or 'client'
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'onboarding'
  const [settings, setSettings] = useState({
    defaultFields: [],
    globalCustomFields: [],
    onboardingFields: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [draggedDefaultIndex, setDraggedDefaultIndex] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin' || !targetType) return;
    
    setLoading(true);
    fetch(`/api/form-control?type=${targetType}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user, targetType]);

  const moveDefaultField = (index, direction) => {
    const updated = [...settings.defaultFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setSettings({ ...settings, defaultFields: updated });
  };

  const removeDefaultField = (index) => {
    const updated = [...settings.defaultFields];
    updated.splice(index, 1);
    setSettings({ ...settings, defaultFields: updated });
  };

  const onDragStartDefault = (e, index) => {
    setDraggedDefaultIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverDefault = (e, index) => {
    e.preventDefault();
    if (draggedDefaultIndex === null || draggedDefaultIndex === index) return;
    
    const updated = [...settings.defaultFields];
    const item = updated.splice(draggedDefaultIndex, 1)[0];
    updated.splice(index, 0, item);
    
    setDraggedDefaultIndex(index);
    setSettings({ ...settings, defaultFields: updated });
  };

  const onDragEndDefault = () => {
    setDraggedDefaultIndex(null);
  };

  const moveField = (index, direction) => {
    const updated = [...settings.globalCustomFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setSettings({ ...settings, globalCustomFields: updated });
  };

  const onDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const updated = [...settings.globalCustomFields];
    const item = updated.splice(draggedItemIndex, 1)[0];
    updated.splice(index, 0, item);
    
    setDraggedItemIndex(index);
    setSettings({ ...settings, globalCustomFields: updated });
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/form-control?type=${targetType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`${targetType === 'lead' ? 'Lead' : 'Client'} form settings updated successfully`, 'success');
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
        { label: 'New Custom Field', fieldType: 'Short answer', options: [], isRequired: false },
        ...settings.globalCustomFields,
      ]
    });
  };

  const updateGlobalCustomField = (index, field, value) => {
    const updated = [...settings.globalCustomFields];
    updated[index] = { ...updated[index], [field]: value };
    // If fieldType changes to something without options, clear options
    if (field === 'fieldType' && !['Multiple choice', 'Checkboxes', 'Dropdown'].includes(value)) {
      updated[index].options = [];
    }
    // If fieldType changes to something with options and it's not an array, initialize it
    if (field === 'fieldType' && ['Multiple choice', 'Checkboxes', 'Dropdown'].includes(value) && !Array.isArray(updated[index].options)) {
      updated[index].options = [];
    }
    setSettings({ ...settings, globalCustomFields: updated });
  };

  const removeGlobalCustomField = (index) => {
    const updated = [...settings.globalCustomFields];
    updated.splice(index, 1);
    setSettings({ ...settings, globalCustomFields: updated });
  };

  const addOnboardingField = () => {
    setSettings({
      ...settings,
      onboardingFields: [
        { label: 'New Onboarding Field', fieldType: 'Short answer', options: [], isRequired: false },
        ...(settings.onboardingFields || []),
      ]
    });
  };

  const updateOnboardingField = (index, field, value) => {
    const updated = [...(settings.onboardingFields || [])];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'fieldType' && !['Multiple choice', 'Checkboxes', 'Dropdown'].includes(value)) {
      updated[index].options = [];
    }
    if (field === 'fieldType' && ['Multiple choice', 'Checkboxes', 'Dropdown'].includes(value) && !Array.isArray(updated[index].options)) {
      updated[index].options = [];
    }
    setSettings({ ...settings, onboardingFields: updated });
  };

  const removeOnboardingField = (index) => {
    const updated = [...(settings.onboardingFields || [])];
    updated.splice(index, 1);
    setSettings({ ...settings, onboardingFields: updated });
  };

  const moveOnboardingField = (index, direction) => {
    const updated = [...(settings.onboardingFields || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setSettings({ ...settings, onboardingFields: updated });
  };

  if (user?.role !== 'admin') {
    return <div className="page-content"><h3>Unauthorized</h3></div>;
  }

  if (!targetType) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: 16 }}>Form Control Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Which form would you like to customize?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%', maxWidth: 1000 }}>
          <button 
            onClick={() => setTargetType('lead')}
            style={{ 
              background: 'white', 
              border: '2px solid var(--border-light)', 
              borderRadius: 24, 
              padding: 24, 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              boxShadow: 'var(--shadow-sm)'
            }}
            className="hover-card"
          >
            <div style={{ padding: 20, background: 'var(--secondary-50)', color: 'var(--secondary)', borderRadius: 20 }}>
              <FileText size={48} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Lead Form</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure fields for potential customers and initial inquiries.</p>
            </div>
          </button>

          <button 
            onClick={() => setTargetType('client')}
            style={{ 
              background: 'white', 
              border: '2px solid var(--border-light)', 
              borderRadius: 24, 
              padding: 24, 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              boxShadow: 'var(--shadow-sm)'
            }}
            className="hover-card"
          >
            <div style={{ padding: 20, background: 'var(--accent-50)', color: 'var(--accent)', borderRadius: 20 }}>
              <Users size={48} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Client Form</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure fields for converted customers and active accounts.</p>
            </div>
          </button>

          <button 
            onClick={() => { setTargetType('lead'); setViewMode('onboarding'); }}
            style={{ 
              background: 'white', 
              border: '2px solid var(--border-light)', 
              borderRadius: 24, 
              padding: 24, 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              boxShadow: 'var(--shadow-sm)'
            }}
            className="hover-card"
          >
            <div style={{ padding: 20, background: '#f3e8ff', color: '#9333ea', borderRadius: 20 }}>
              <ListPlus size={48} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Onboarding Form</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure required fields and documents for converting a lead.</p>
            </div>
          </button>
        </div>
        
        <style jsx>{`
          .hover-card:hover {
            transform: translateY(-8px);
            border-color: var(--secondary);
            boxShadow: var(--shadow-md);
          }
        `}</style>
      </div>
    );
  }

  if (loading) return <div className="page-content"><div className="spinner"></div></div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => { setTargetType(null); setViewMode('standard'); setSettings({ defaultFields: [], globalCustomFields: [], onboardingFields: [] }); }}
            style={{ padding: 8, borderRadius: 12 }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title">
              {targetType === 'lead' ? (
                <FileText size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
              ) : (
                <Users size={28} style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 8 }} />
              )}
              {targetType === 'lead' ? (viewMode === 'onboarding' ? 'Onboarding' : 'Lead') : 'Client'} Form Settings
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Customize the fields specifically for your {targetType === 'lead' ? (viewMode === 'onboarding' ? 'onboarding process' : 'leads') : 'clients'}.
            </p>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '12px 24px', borderRadius: 12 }}
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 32, gridTemplateColumns: '1fr' }}>
        
        {/* Default Fields Configuration */}
        {viewMode === 'standard' && (
        <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListPlus size={20} style={{ color: 'var(--secondary)' }} />
            Standard Form Fields
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 2fr 1fr 1fr 1fr 100px', gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid var(--border-light)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <div></div>
            <div>System Field</div>
            <div>Display Label</div>
            <div>Required?</div>
            <div>Min</div>
            <div>Max</div>
            <div>Actions</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {settings.defaultFields.map((field, idx) => (
              <div 
                key={field.name} 
                draggable
                onDragStart={(e) => onDragStartDefault(e, idx)}
                onDragOver={(e) => onDragOverDefault(e, idx)}
                onDragEnd={onDragEndDefault}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 1.2fr 2fr 1fr 1fr 1fr 100px', 
                  gap: 16, 
                  alignItems: 'center', 
                  background: 'var(--bg-body)', 
                  padding: '16px', 
                  borderRadius: 12,
                  opacity: draggedDefaultIndex === idx ? 0.5 : 1,
                  position: 'relative'
                }}
              >
                <div style={{ cursor: 'grab', color: 'var(--text-muted)' }}>
                  <GripVertical size={20} />
                </div>
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
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button 
                      onClick={() => moveDefaultField(idx, 'up')}
                      disabled={idx === 0}
                      style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 4, padding: 2, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      onClick={() => moveDefaultField(idx, 'down')}
                      disabled={idx === settings.defaultFields.length - 1}
                      style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 4, padding: 2, cursor: idx === settings.defaultFields.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === settings.defaultFields.length - 1 ? 0.3 : 1 }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeDefaultField(idx)}
                    style={{ color: '#ef4444', background: 'white', border: '1px solid var(--border-light)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                    title="Remove Standard Field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Global Custom Fields Configuration */}
        {viewMode === 'standard' && (
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
                <div key={idx} style={{ background: 'var(--bg-body)', padding: 24, borderRadius: 16, border: '1px solid var(--border-light)', position: 'relative', opacity: draggedItemIndex === idx ? 0.5 : 1 }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16, 
                      display: 'flex', 
                      gap: 8,
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button 
                        onClick={() => moveField(idx, 'up')}
                        disabled={idx === 0}
                        style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 6, padding: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveField(idx, 'down')}
                        disabled={idx === settings.globalCustomFields.length - 1}
                        style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 6, padding: 4, cursor: idx === settings.globalCustomFields.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === settings.globalCustomFields.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeGlobalCustomField(idx)}
                      style={{ color: '#ef4444', background: 'white', border: '1px solid var(--border-light)', cursor: 'pointer', padding: 8, borderRadius: 8 }}
                      title="Remove Field"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div 
                    draggable
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: 0, 
                      transform: 'translateY(-50%)',
                      padding: '0 8px',
                      cursor: 'grab',
                      color: 'var(--text-muted)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 10
                    }}
                  >
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40, paddingLeft: 32 }}>
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
                        <option value="Short answer">Short answer</option>
                        <option value="Paragraph">Paragraph</option>
                        <option value="Multiple choice">Multiple choice</option>
                        <option value="Checkboxes">Checkboxes</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="File upload">File upload</option>
                        <option value="Date">Date</option>
                        <option value="Time">Time</option>
                        <option value="Number">Number Input</option>
                        <option value="Text">Text (Legacy)</option>
                      </select>
                    </div>
                  </div>

                  {['Multiple choice', 'Checkboxes', 'Dropdown'].includes(field.fieldType) && (
                    <div className="form-group" style={{ marginBottom: 16, paddingRight: 40, paddingLeft: 32 }}>
                      <label className="form-label">Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(Array.isArray(field.options) ? field.options : []).map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{optIdx + 1}.</div>
                            <input 
                              className="form-input" 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...field.options];
                                newOpts[optIdx] = e.target.value;
                                updateGlobalCustomField(idx, 'options', newOpts);
                              }}
                              style={{ background: 'white' }} 
                            />
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => {
                                const newOpts = field.options.filter((_, i) => i !== optIdx);
                                updateGlobalCustomField(idx, 'options', newOpts);
                              }}
                              style={{ color: '#ef4444', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            const newOpts = Array.isArray(field.options) ? [...field.options, ''] : [''];
                            updateGlobalCustomField(idx, 'options', newOpts);
                          }}
                          style={{ color: 'var(--secondary)', justifyContent: 'flex-start', padding: '4px 0', fontWeight: 600 }}
                        >
                          <Plus size={14} /> Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40, paddingLeft: 32 }}>
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
        )}

        {/* Onboarding Fields Configuration */}
        {targetType === 'lead' && viewMode === 'onboarding' && (
        <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={20} style={{ color: 'var(--secondary)' }} />
              Onboarding Process Fields
            </h2>
            <button className="btn btn-outline" onClick={addOnboardingField} style={{ borderRadius: 12 }}>
              <Plus size={16} /> Add Onboarding Field
            </button>
          </div>
          
          {(!settings.onboardingFields || settings.onboardingFields.length === 0) ? (
            <div className="empty-state" style={{ padding: '40px 20px', background: 'var(--bg-body)', borderRadius: 16 }}>
              <ListPlus size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p>No onboarding fields defined yet.</p>
              <button className="btn btn-secondary btn-sm" onClick={addOnboardingField} style={{ marginTop: 12 }}>Add First Field</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {settings.onboardingFields.map((field, idx) => (
                <div key={idx} style={{ background: 'var(--bg-body)', padding: 24, borderRadius: 16, border: '1px solid var(--border-light)', position: 'relative' }}>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16, 
                      display: 'flex', 
                      gap: 8,
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button 
                        onClick={() => moveOnboardingField(idx, 'up')}
                        disabled={idx === 0}
                        style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 6, padding: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveOnboardingField(idx, 'down')}
                        disabled={idx === settings.onboardingFields.length - 1}
                        style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 6, padding: 4, cursor: idx === settings.onboardingFields.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === settings.onboardingFields.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeOnboardingField(idx)}
                      style={{ color: '#ef4444', background: 'white', border: '1px solid var(--border-light)', cursor: 'pointer', padding: 8, borderRadius: 8 }}
                      title="Remove Field"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40 }}>
                    <div className="form-group">
                      <label className="form-label">Field Label</label>
                      <input 
                        className="form-input" 
                        value={field.label} 
                        onChange={e => updateOnboardingField(idx, 'label', e.target.value)} 
                        style={{ background: 'white' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Type</label>
                      <select 
                        className="form-select" 
                        value={field.fieldType} 
                        onChange={e => updateOnboardingField(idx, 'fieldType', e.target.value)}
                        style={{ background: 'white' }}
                      >
                        <option value="Short answer">Short answer</option>
                        <option value="Paragraph">Paragraph</option>
                        <option value="Multiple choice">Multiple choice</option>
                        <option value="Checkboxes">Checkboxes</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="File upload">File upload</option>
                        <option value="Date">Date</option>
                        <option value="Time">Time</option>
                        <option value="Number">Number Input</option>
                        <option value="Text">Text (Legacy)</option>
                      </select>
                    </div>
                  </div>

                  {['Multiple choice', 'Checkboxes', 'Dropdown'].includes(field.fieldType) && (
                    <div className="form-group" style={{ marginBottom: 16, paddingRight: 40 }}>
                      <label className="form-label">Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(Array.isArray(field.options) ? field.options : []).map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{optIdx + 1}.</div>
                            <input 
                              className="form-input" 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...field.options];
                                newOpts[optIdx] = e.target.value;
                                updateOnboardingField(idx, 'options', newOpts);
                              }}
                              style={{ background: 'white' }} 
                            />
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => {
                                const newOpts = field.options.filter((_, i) => i !== optIdx);
                                updateOnboardingField(idx, 'options', newOpts);
                              }}
                              style={{ color: '#ef4444', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            const newOpts = Array.isArray(field.options) ? [...field.options, ''] : [''];
                            updateOnboardingField(idx, 'options', newOpts);
                          }}
                          style={{ color: 'var(--secondary)', justifyContent: 'flex-start', padding: '4px 0', fontWeight: 600 }}
                        >
                          <Plus size={14} /> Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: 16, paddingRight: 40 }}>
                    <div className="form-group">
                      <label className="form-label">Min Length</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="Unlimited" 
                        value={field.minLength || ''} 
                        onChange={e => updateOnboardingField(idx, 'minLength', e.target.value ? parseInt(e.target.value) : null)} 
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
                        onChange={e => updateOnboardingField(idx, 'maxLength', e.target.value ? parseInt(e.target.value) : null)} 
                        style={{ background: 'white' }} 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Requirement:</label>
                    <button 
                      className={`btn ${field.isRequired ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                      onClick={() => updateOnboardingField(idx, 'isRequired', !field.isRequired)}
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
        )}
      </div>
    </div>
  );
}
