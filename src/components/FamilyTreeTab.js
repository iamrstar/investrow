'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Crown, Heart, User, Plus, Trash2, ArrowRight, 
  IndianRupee, Phone, Calendar, Shield, ExternalLink, RefreshCw, Link2, Check, AlertCircle, ChevronDown
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import AddFamilyMemberModal from './AddFamilyMemberModal';

export default function FamilyTreeTab({
  client,
  onSelectClient, // callback to switch active client in detail modal
  onClientUpdated
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!client?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/family?clientId=${client._id}`);
      const data = await res.json();
      if (data.success) {
        setFamilyData(data.family);
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error fetching family:', err);
      addToast('Failed to load family tree', 'error');
    } finally {
      setLoading(false);
    }
  }, [client?._id, addToast]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  const handleUnlink = async (memberClientId, memberName) => {
    if (!familyData?.familyId) return;
    if (!confirm(`Are you sure you want to unlink ${memberName} from this family unit?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/family?familyId=${familyData.familyId}&clientId=${memberClientId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to unlink');

      addToast(`${memberName} unlinked from family`, 'success');
      fetchFamily();
      if (onClientUpdated) onClientUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetHead = async (memberClientId, memberName) => {
    if (!familyData?.familyId) return;
    if (!confirm(`Set ${memberName} as Head of Family?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: familyData.familyId,
          memberClientId,
          makeHead: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update');

      addToast(`${memberName} is now Head of Family`, 'success');
      fetchFamily();
      if (onClientUpdated) onClientUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkSuggestion = async (suggestedClient, relation = 'Member') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'existing',
          clientId: client._id,
          targetClientId: suggestedClient._id,
          relationship: relation
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to link');

      addToast(`Linked ${suggestedClient.name} to family!`, 'success');
      fetchFamily();
      if (onClientUpdated) onClientUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#0284C7' }} />
        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading family chain & hierarchy...</div>
      </div>
    );
  }

  const members = familyData?.members || [];
  const headMember = members.find(m => m.relationship === 'Head' || m.clientId?._id === familyData?.headClientId?._id) || members[0];
  const spouseMembers = members.filter(m => m !== headMember && ['Spouse', 'Husband', 'Wife'].includes(m.relationship));
  const childMembers = members.filter(m => m !== headMember && ['Son', 'Daughter', 'Child'].includes(m.relationship));
  const otherMembers = members.filter(m => m !== headMember && !spouseMembers.includes(m) && !childMembers.includes(m));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
      {/* Top Banner & Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'rgba(2, 132, 199, 0.25)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
                {familyData?.familyName || `${client.name}'s Family`}
              </h2>
              {familyData?.familyId && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {familyData.familyId}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              {members.length > 0 ? `${members.length} Connected Family Members` : 'Single Client Profile'}
              {familyData?.primaryPhone && ` • Mobile: ${familyData.primaryPhone}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Total Family SIP Badge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 18px',
            borderRadius: 14,
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8', fontWeight: 700 }}>
              Collective Monthly SIP
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
              ₹{Number(familyData?.totalSip || client.sipAmount || 0).toLocaleString('en-IN')}
              <span style={{ fontSize: '0.78rem', color: '#86EFAC', fontWeight: 600 }}>/mo</span>
            </div>
          </div>

          {/* Add Family Member Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={18} />
            Add Family Member
          </button>
        </div>
      </div>

      {/* Suggested Unlinked Family Members (if found by shared phone/address) */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: 16,
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertCircle size={18} />
              Found {suggestions.length} other registered client(s) with the same phone ({client.phone}):
            </div>
            <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>Auto-Detected by Investrow</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {suggestions.map(s => (
              <div
                key={s._id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #FCD34D',
                  borderRadius: 12,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {s.leadId || s.clientCode} • SIP: ₹{Number(s.sipAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleLinkSuggestion(s, 'Family Member')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Link2 size={13} />
                  Link Member
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Hierarchy / Family Tree Display */}
      {members.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Level 1: Head of Family */}
          {headMember && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: '#64748B',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Crown size={14} style={{ color: '#EAB308' }} />
                Family Head
              </div>

              <MemberCard
                member={headMember}
                isHead={true}
                isCurrentClient={String(headMember.clientId?._id || headMember.clientId) === String(client._id)}
                onSelectClient={onSelectClient}
                onUnlink={() => handleUnlink(headMember.clientId?._id, headMember.clientId?.name)}
                onSetHead={() => {}}
                canUnlink={members.length > 1}
              />

              {/* Connecting Tree Line */}
              {(spouseMembers.length > 0 || childMembers.length > 0 || otherMembers.length > 0) && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: '#CBD5E1',
                  margin: '4px 0'
                }} />
              )}
            </div>
          )}

          {/* Level 2: Spouse */}
          {spouseMembers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: '#64748B',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Heart size={14} style={{ color: '#EC4899' }} />
                Spouse / Partner
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                {spouseMembers.map(sp => (
                  <MemberCard
                    key={sp.clientId?._id || sp.clientId}
                    member={sp}
                    isHead={false}
                    isCurrentClient={String(sp.clientId?._id || sp.clientId) === String(client._id)}
                    onSelectClient={onSelectClient}
                    onUnlink={() => handleUnlink(sp.clientId?._id, sp.clientId?.name)}
                    onSetHead={() => handleSetHead(sp.clientId?._id, sp.clientId?.name)}
                    canUnlink={true}
                  />
                ))}
              </div>

              {/* Connecting Tree Line */}
              {(childMembers.length > 0 || otherMembers.length > 0) && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: '#CBD5E1',
                  margin: '4px 0'
                }} />
              )}
            </div>
          )}

          {/* Level 3: Children / Dependents */}
          {childMembers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: '#64748B',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <User size={14} style={{ color: '#0284C7' }} />
                Children & Next Generation
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 900 }}>
                {childMembers.map(ch => (
                  <MemberCard
                    key={ch.clientId?._id || ch.clientId}
                    member={ch}
                    isHead={false}
                    isCurrentClient={String(ch.clientId?._id || ch.clientId) === String(client._id)}
                    onSelectClient={onSelectClient}
                    onUnlink={() => handleUnlink(ch.clientId?._id, ch.clientId?.name)}
                    onSetHead={() => handleSetHead(ch.clientId?._id, ch.clientId?.name)}
                    canUnlink={true}
                  />
                ))}
              </div>

              {otherMembers.length > 0 && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: '#CBD5E1',
                  margin: '4px 0'
                }} />
              )}
            </div>
          )}

          {/* Level 4: Other Relatives */}
          {otherMembers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: '#64748B',
                marginBottom: 8
              }}>
                Other Family Members
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                {otherMembers.map(om => (
                  <MemberCard
                    key={om.clientId?._id || om.clientId}
                    member={om}
                    isHead={false}
                    isCurrentClient={String(om.clientId?._id || om.clientId) === String(client._id)}
                    onSelectClient={onSelectClient}
                    onUnlink={() => handleUnlink(om.clientId?._id, om.clientId?.name)}
                    onSetHead={() => handleSetHead(om.clientId?._id, om.clientId?.name)}
                    canUnlink={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#F8FAFC',
          borderRadius: 20,
          border: '2px dashed #CBD5E1'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#E0F2FE',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Users size={32} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
            No Family Chain Linked Yet
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748B', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
            Link spouse, children, or parents to build a unified family hierarchy. Track collective SIP portfolios and future scheme investments easily.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#0284C7',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Plus size={18} />
            Add First Family Member
          </button>
        </div>
      )}

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentClient={client}
        onSuccess={() => {
          fetchFamily();
          if (onClientUpdated) onClientUpdated();
        }}
      />
    </div>
  );
}

// Individual Member Card in the Hierarchy Tree
function MemberCard({
  member,
  isHead,
  isCurrentClient,
  onSelectClient,
  onUnlink,
  onSetHead,
  canUnlink
}) {
  const c = member.clientId || {};
  const rel = member.relationship || 'Member';

  // Relation color styling
  const isSpouse = ['Spouse', 'Husband', 'Wife'].includes(rel);
  const isChild = ['Son', 'Daughter', 'Child'].includes(rel);

  const badgeBg = isHead ? '#FEF08A' : isSpouse ? '#FCE7F3' : isChild ? '#E0F2FE' : '#F1F5F9';
  const badgeColor = isHead ? '#854D0E' : isSpouse ? '#9D174D' : isChild ? '#075985' : '#475569';

  return (
    <div style={{
      width: 290,
      background: isCurrentClient ? '#F0F9FF' : '#FFFFFF',
      border: isCurrentClient ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: isCurrentClient ? '0 8px 20px -4px rgba(2, 132, 199, 0.2)' : '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      transition: 'all 0.2s ease'
    }}>
      {/* Top Card Bar: Relationship Badge & Current Client Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 800,
          background: badgeBg,
          color: badgeColor,
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }}>
          {isHead && <Crown size={12} />}
          {isSpouse && <Heart size={12} />}
          {isChild && <User size={12} />}
          {rel}
        </span>

        {isCurrentClient && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#0284C7',
            background: '#E0F2FE',
            padding: '2px 8px',
            borderRadius: 6
          }}>
            Active Client
          </span>
        )}
      </div>

      {/* Member Details */}
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A', wordBreak: 'break-word' }}>
          {c.name || 'Unknown Client'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
            {c.leadId || c.clientCode || 'Client'}
          </span>
          {c.dateOfBirth && (
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              • DOB: {c.dateOfBirth}
            </span>
          )}
        </div>
      </div>

      {/* SIP & Investment Scheme Info */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #EDF2F7',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
            Monthly SIP
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 1 }}>
            ₹{Number(c.sipAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ textAlign: 'right', maxWidth: 120 }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
            Scheme
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.schemeName || c.schemes?.[0]?.schemeName || 'Mutual Funds'}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
        {!isCurrentClient && onSelectClient ? (
          <button
            type="button"
            onClick={() => onSelectClient(c._id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284C7',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            Switch to Profile
            <ArrowRight size={13} />
          </button>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Current view</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isHead && onSetHead && (
            <button
              type="button"
              title="Promote to Head of Family"
              onClick={onSetHead}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
            >
              <Crown size={14} />
            </button>
          )}

          {canUnlink && (
            <button
              type="button"
              title="Unlink member from family"
              onClick={onUnlink}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
