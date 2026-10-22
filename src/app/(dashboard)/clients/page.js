'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ScheduleEventModal from '@/components/ScheduleEventModal';
import ClientDocumentsModal from '@/components/ClientDocumentsModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import FamilyTreeTab from '@/components/FamilyTreeTab';
import AddFamilyMemberModal from '@/components/AddFamilyMemberModal';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import FollowUpHistoryTab from '@/components/FollowUpHistoryTab';
import ClientTasksModal from '@/components/ClientTasksModal';
import AddServiceSchemeModal from '@/components/AddServiceSchemeModal';
import {
  Plus, Search, Eye, Edit, Trash2, UserPlus, Phone,
  Filter, FileText, ChevronLeft, ChevronRight, X, Mail, Send, Activity,
  MoreVertical, Users, Clock, CheckCircle, Video, Calendar,
  CalendarClock, User, TrendingUp, Shield, ArrowUpRight, Upload, AlertCircle, IndianRupee, UserCheck, UserX, Info,
  HeartPulse, Landmark, PiggyBank, BarChart2, Calculator, Car, Edit2, Percent, PieChart, Award,
  Download, MessageSquare, FileSpreadsheet
} from 'lucide-react';

const SERVICES = [
  'Mutual Funds', 'Life Insurance', 'Health Insurance', 'Tax Planning',
  'General Insurance', 'FD & Bond', 'Stock Market & Demat', 'NPS',
];

const SIP_DAYS = [1, 5, 7, 10, 15, 20, 25, 28];
const TENURE_OPTIONS = [1, 3, 5, 7, 10, 15, 20];

const formatSipDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return d;
  }
};

const formatDayOrdinal = (day) => {
  if (!day) return '10th';
  const n = Number(day);
  if (isNaN(n)) return day;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const exportSipCsv = (sipSchemes, leadName) => {
  if (!sipSchemes || sipSchemes.length === 0) return;
  const headers = ['Sr', 'Scheme Name', 'Deduction from Bank', 'Folio Number', 'SIP Amount', 'SIP Frequency', 'SIP Start Date', 'SIP End Date', 'Deduction Date', 'SIP Status'];
  const rows = sipSchemes.map((s, i) => [
    i + 1,
    `"${(s.schemeName || '').replace(/"/g, '""')}"`,
    `"${(s.deductionBank || s.bankName || 'STATE BANK OF INDIA').replace(/"/g, '""')}"`,
    `"${s.policyNumber || '91063718002'}"`,
    s.sipAmount || 0,
    s.sipFrequency || 'Monthly',
    formatSipDate(s.startDate),
    formatSipDate(s.maturityDate || '2099-12-20'),
    formatDayOrdinal(s.sipDay || 20),
    s.status || 'Running'
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${(leadName || 'Client').replace(/\s+/g, '_')}_SIP_Details.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function ClientsPageContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get('search') || '';
  const urlService = searchParams?.get('service') || '';

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    const q = searchParams?.get('search');
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
    const s = searchParams?.get('service');
    if (s !== null && s !== undefined) {
      setFilterService(s);
    } else {
      setFilterService('');
    }
  }, [searchParams]);
  const [filterService, setFilterService] = useState(urlService);
  const [filterCallStatus, setFilterCallStatus] = useState('');
  const [filterClientStatus, setFilterClientStatus] = useState('All');
  const [filterUser, setFilterUser] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignClient, setAssignClient] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [clientDetailTab, setClientDetailTab] = useState('overview');
  const [mfTab, setMfTab] = useState('sips');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailClient, setEmailClient] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [filterDate, setFilterDate] = useState('');
  const [activeMenuClient, setActiveMenuClient] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsClient, setDocumentsClient] = useState(null);
  const [documentDefaultName, setDocumentDefaultName] = useState('');
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasksClient, setTasksClient] = useState(null);
  const [assignRole, setAssignRole] = useState(''); // 'user'
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customEmailData, setCustomEmailData] = useState({ subject: '', content: '' });
  const [formSettings, setFormSettings] = useState(null);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showScheduleMeet, setShowScheduleMeet] = useState(false);
  const [scheduleClient, setScheduleClient] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [familyStats, setFamilyStats] = useState(null);
  const [rectifyingFamilies, setRectifyingFamilies] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [familyModalClient, setFamilyModalClient] = useState(null);
  const [showServiceSchemeModal, setShowServiceSchemeModal] = useState(false);
  const [serviceSchemeTarget, setServiceSchemeTarget] = useState('Life Insurance');
  const [editingSchemeData, setEditingSchemeData] = useState(null);
  const [editingSchemeIndex, setEditingSchemeIndex] = useState(null);
  const [schemeModalInitialTab, setSchemeModalInitialTab] = useState('manual');
  const [deactivateSchemeModal, setDeactivateSchemeModal] = useState({ isOpen: false, schemeIndex: null, scheme: null, remarks: '' });
  const [viewSchemeRemarksModal, setViewSchemeRemarksModal] = useState({ isOpen: false, scheme: null });

  const fetchFamilyStats = useCallback(async () => {
    try {
      const res = await fetch('/api/family/rectify');
      const data = await res.json();
      if (data.success) {
        setFamilyStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching family stats:', err);
    }
  }, []);

  const handleAutoRectifyFamilies = async () => {
    setRectifyingFamilies(true);
    try {
      const res = await fetch('/api/family/rectify', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Rectification failed');
      addToast(data.message, 'success');
      fetchFamilyStats();
      fetchClients(pagination.page);
      if (showDetail) viewDetail(showDetail);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRectifyingFamilies(false);
    }
  };

  const openUploadFor = (docLabel) => {
    setDocumentDefaultName(docLabel);
    setDocumentsClient(detailData?.lead || null);
    setShowDocumentsModal(true);
  };

  const handleQuickKycChange = async (newKycStatus) => {
    if (!detailData?.lead?._id) return;
    try {
      const res = await fetch(`/api/leads/${detailData.lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: newKycStatus }),
      });
      if (!res.ok) throw new Error('Failed to update KYC status');
      addToast(`KYC status updated to ${newKycStatus}`, 'success');
      viewDetail(detailData.lead._id);
      fetchClients(pagination.page);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpClient, setFollowUpClient] = useState(null);

  const handleLogFollowUp = async (formData) => {
    if (!followUpClient?._id) return;
    try {
      const res = await fetch(`/api/leads/${followUpClient._id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log follow-up');
      }

      addToast('Follow-up record created successfully!', 'success');
      setShowFollowUp(false);
      setFollowUpClient(null);
      fetchClients(pagination.page);
      if (showDetail) viewDetail(showDetail);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleActivity = (id) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const canCreate = user?.role === 'admin' || user?.role === 'user' || user?.role === 'relationship_manager' || user?.role === 'rm';
  const canEdit = user?.role === 'admin' || user?.role === 'user' || user?.role === 'relationship_manager' || user?.role === 'rm';
  const canAssign = user?.role === 'admin' || user?.role === 'user' || user?.role === 'relationship_manager' || user?.role === 'rm';
  const canDelete = user?.role === 'admin';

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page, 
        limit: 15,
        response: 'Converted' // Force filter to only show Converted leads (Clients)
      });
      if (search) params.set('search', search);
      if (filterService) params.set('service', filterService);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterClientStatus && filterClientStatus !== 'All') params.set('clientStatus', filterClientStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (filterDate) params.set('followUpDate', filterDate);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setClients(data.leads || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      addToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterCallStatus, filterClientStatus, filterUser, filterDate, startDate, endDate, addToast]);

  useEffect(() => {
    fetchClients();
    fetchFamilyStats();
  }, [fetchClients, fetchFamilyStats]);

  useEffect(() => {
    fetch('/api/form-control?type=client&t=' + Date.now()).then(r => r.json()).then(data => {
      if (data.success) setFormSettings(data.settings);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (canAssign) {
      fetch('/api/users?role=user').then(r => r.json()).then(d => setTeamUsers(d.users || []));
    }
  }, [canAssign]);

  const handleSaveClient = async (formData) => {
    try {
      const isEdit = !!(editingClient || formData?._id);
      const clientId = editingClient?._id || formData?._id;

      if (isEdit && editingClient && !confirm('Are you sure you want to update this client?')) return;
      
      const url = isEdit ? `/api/leads/${clientId}` : '/api/leads';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, response: 'Converted' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      addToast(editingClient ? 'Client updated!' : 'Client created!', 'success');
      setShowModal(false);
      setEditingClient(null);
      fetchClients(pagination.page);
      if (showDetail && (String(showDetail) === String(clientId))) {
        viewDetail(clientId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client record?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      addToast('Client deleted', 'success');
      fetchClients(pagination.page);
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleAssign = async (clientId, userId) => {
    try {
      const res = await fetch(`/api/leads/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast('Client assigned!', 'success');
      setShowAssignModal(false);
      setAssignClient(null);
      setAssignRole('');
      fetchClients(pagination.page);
      if (showDetail) {
        viewDetail(showDetail);
      }
    } catch {
      addToast('Failed to assign', 'error');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load details');
      setDetailData(data);
      setShowDetail(id);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleToggleClientStatus = async (client, targetStatus) => {
    if (!client?._id) return;
    const isClosing = targetStatus === 'Inactive' || targetStatus === 'Closed';
    const confirmMsg = isClosing
      ? `Are you sure you want to mark "${client.name}" as Inactive (Closed)?`
      : `Are you sure you want to reactivate "${client.name}" as Active?`;

    if (!confirm(confirmMsg)) return;

    try {
      const payload = {
        clientStatus: targetStatus,
        status: targetStatus,
        ...(isClosing ? { closedAt: new Date().toISOString() } : { closedAt: null })
      };

      const res = await fetch(`/api/leads/${client._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update client status');
      }

      addToast(isClosing ? 'Client marked as Inactive (Closed)' : 'Client reactivated to Active!', 'success');
      fetchClients(pagination.page);
      if (showDetail) {
        viewDetail(client._id);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleOpenAddScheme = (serviceName, scheme = null, index = null) => {
    setServiceSchemeTarget(serviceName || 'Life Insurance');
    setEditingSchemeData(scheme);
    setEditingSchemeIndex(index);
    setShowServiceSchemeModal(true);
  };

  const handleDeleteScheme = async (schemeIndex, schemeName) => {
    if (!confirm(`Are you sure you want to remove "${schemeName || 'this scheme'}" from the client's portfolio?`)) return;
    if (!detailData?.lead?._id) return;

    const currentSchemes = Array.isArray(detailData.lead.schemes) ? [...detailData.lead.schemes] : [];
    const updatedSchemes = currentSchemes.filter((_, idx) => idx !== schemeIndex);

    try {
      const totalSip = updatedSchemes.reduce((sum, s) => {
        if (s.service === 'Mutual Funds' || s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
          return sum + (Number(s.sipAmount) || 0);
        }
        return sum;
      }, 0);

      const totalLumpsum = updatedSchemes.reduce((sum, s) => {
        if (s.service === 'Mutual Funds' && (s.investmentType === 'Lumpsum' || s.investmentType === 'Both')) {
          return sum + (Number(s.investmentAmount) || 0);
        }
        return sum;
      }, 0);

      const res = await fetch(`/api/leads/${detailData.lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemes: updatedSchemes,
          sipAmount: totalSip,
          investmentAmount: totalLumpsum
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove scheme');

      addToast('Scheme removed successfully', 'success');
      viewDetail(detailData.lead._id);
      fetchClients(pagination.page);
    } catch (err) {
      addToast(err.message || 'Error removing scheme', 'error');
    }
  };

  const handleToggleSchemeStatus = async (schemeIndex, newStatus, remarks = '') => {
    if (!detailData?.lead?._id) return;

    const currentSchemes = Array.isArray(detailData.lead.schemes) ? [...detailData.lead.schemes] : [];
    if (!currentSchemes[schemeIndex]) return;

    const isDeactivating = ['Inactive', 'Closed', 'Discontinued', 'Terminated'].includes(newStatus);

    const updatedScheme = {
      ...currentSchemes[schemeIndex],
      status: newStatus,
      remarks: remarks ? remarks.trim() : (currentSchemes[schemeIndex].remarks || ''),
      deactivationReason: isDeactivating ? (remarks.trim() || 'Discontinued by client') : (currentSchemes[schemeIndex].deactivationReason || ''),
      deactivatedAt: isDeactivating ? new Date().toISOString() : null,
    };

    currentSchemes[schemeIndex] = updatedScheme;

    try {
      const activeSipTotal = currentSchemes.reduce((sum, s) => {
        const isInactive = ['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(s.status);
        if (!isInactive && (s.service === 'Mutual Funds' || s.investmentType === 'Monthly SIP' || s.investmentType === 'Both')) {
          return sum + (Number(s.sipAmount) || 0);
        }
        return sum;
      }, 0);

      const activeLumpsumTotal = currentSchemes.reduce((sum, s) => {
        const isInactive = ['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(s.status);
        if (!isInactive && s.service === 'Mutual Funds' && (s.investmentType === 'Lumpsum' || s.investmentType === 'Both')) {
          return sum + (Number(s.investmentAmount) || 0);
        }
        return sum;
      }, 0);

      const res = await fetch(`/api/leads/${detailData.lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemes: currentSchemes,
          sipAmount: activeSipTotal,
          investmentAmount: activeLumpsumTotal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update scheme status');

      addToast(
        isDeactivating 
          ? `Scheme marked as ${newStatus}` 
          : 'Scheme reactivated as Active / Running!', 
        'success'
      );
      setDeactivateSchemeModal({ isOpen: false, schemeIndex: null, scheme: null, remarks: '' });
      viewDetail(detailData.lead._id);
      fetchClients(pagination.page);
    } catch (err) {
      addToast(err.message || 'Error updating scheme status', 'error');
    }
  };

  const renderSchemeStatusToggle = (s, realSchemeIndex, idx) => {
    const isInactive = ['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(s.status);
    const targetIdx = realSchemeIndex >= 0 ? realSchemeIndex : idx;

    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={() => {
            if (isInactive) {
              if (confirm(`Reactivate "${s.schemeName || 'this scheme'}" back to Active / Running?`)) {
                handleToggleSchemeStatus(targetIdx, 'Running');
              }
            } else {
              setDeactivateSchemeModal({
                isOpen: true,
                schemeIndex: targetIdx,
                scheme: s,
                remarks: s.deactivationReason || s.remarks || ''
              });
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isInactive ? '#FEF2F2' : '#ECFDF5',
            color: isInactive ? '#DC2626' : '#059669',
            border: `1.5px solid ${isInactive ? '#FECACA' : '#A7F3D0'}`,
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
          title={isInactive ? "Scheme Inactive / Discontinued. Click to reactivate" : "Scheme Active / Running. Click to deactivate with remarks"}
        >
          {/* Custom Toggle Switch Pill */}
          <span style={{
            width: 26,
            height: 15,
            background: isInactive ? '#CBD5E1' : '#10B981',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            padding: 1.5,
            transition: 'background 0.2s ease'
          }}>
            <span style={{
              width: 12,
              height: 12,
              background: '#FFFFFF',
              borderRadius: '50%',
              marginLeft: isInactive ? 0 : 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              transition: 'margin 0.2s ease'
            }} />
          </span>
          <span>{isInactive ? 'Inactive' : 'Active'}</span>
        </button>

        {/* Remarks Button / Badge */}
        {(s.remarks || s.deactivationReason) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewSchemeRemarksModal({ isOpen: true, scheme: s });
            }}
            style={{
              background: isInactive ? '#FFF7ED' : '#F0F9FF',
              border: `1px solid ${isInactive ? '#FED7AA' : '#BAE6FD'}`,
              color: isInactive ? '#C2410C' : '#0284C7',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              maxWidth: 140,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={`Remark: "${s.deactivationReason || s.remarks}". Click to read full details.`}
          >
            <MessageSquare size={11} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.deactivationReason || s.remarks}
            </span>
          </button>
        )}
      </div>
    );
  };

  const handleSendEmail = async (templateType) => {
    if (!emailClient?.email) {
      addToast('Client does not have an email address', 'error');
      return;
    }

    if (templateType === 'custom' && (!customEmailData.subject || !customEmailData.content)) {
      addToast('Please fill in both subject and message', 'error');
      return;
    }

    setEmailSending(true);
    try {
      const payload = { leadId: emailClient._id, templateType };
      if (templateType === 'custom') {
        payload.subject = customEmailData.subject;
        payload.content = customEmailData.content;
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      addToast('Email sent successfully!', 'success');
      setShowEmailModal(false);
      setShowCustomEmail(false);
      setCustomEmailData({ subject: '', content: '' });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterService) params.set('service', filterService);
      if (filterCallStatus) params.set('callStatus', filterCallStatus);
      if (filterClientStatus && filterClientStatus !== 'All') params.set('clientStatus', filterClientStatus);
      if (filterUser) params.set('assignedTo', filterUser);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('response', 'Converted');
      params.set('limit', '1000'); // Get all
      
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      const exportClients = data.leads || [];
      
      if (exportClients.length === 0) return addToast('No data to export', 'error');

      // Simple CSV export
      const headers = ['Name', 'Status', 'Phone', 'Email', 'Service', 'Call Status', 'Assigned To', 'Follow-up Date', 'Remarks', 'Created At'];
      const csvData = exportClients.map(l => [
        l.name,
        l.clientStatus || 'Active',
        l.phone,
        l.email || '',
        l.service,
        l.callStatus,
        l.assignedTo?.name || 'Unassigned',
        l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
        (l.remarks || '').replace(/,/g, ';'),
        new Date(l.createdAt).toLocaleDateString()
      ]);

      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Clients_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Report downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to generate report', 'error');
    }
  };

  const RenderClientActions = ({ client }) => (
    <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          window.location.href = `tel:${client.phone}`; 
        }}
        title="Call Now"
        style={{ color: '#059669', border: '1px solid #A7F3D0', background: '#ECFDF5', borderRadius: 8, padding: '6px 8px' }}
      >
        <Phone size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
          const msg = encodeURIComponent(`Hello ${client.name}, this is from Investrow Financial Services.`);
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
        }}
        title="Chat on WhatsApp"
        style={{ color: '#16A34A', border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: 8, padding: '6px 8px' }}
      >
        <Send size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          viewDetail(client._id); 
        }}
        title="View Client Profile"
        style={{ color: '#475569', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '6px 8px' }}
      >
        <Eye size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setEditingClient(client); 
          setShowModal(true); 
        }}
        title="Edit Client Details"
        style={{ color: '#0EA5E9', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '6px 8px' }}
      >
        <Edit size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setFollowUpClient(client);
          setShowFollowUp(true);
        }} 
        title="Log Follow-up"
        style={{ color: '#0EA5E9', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '6px 8px' }}
      >
        <Calendar size={15} />
      </button>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setClientDetailTab('family');
          viewDetail(client._id); 
        }} 
        title="View Family Tree & Hierarchy"
        style={{ color: '#0284C7', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '6px 8px' }}
      >
        <Users size={15} />
      </button>
      {client.clientStatus === 'Inactive' || client.clientStatus === 'Closed' ? (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleToggleClientStatus(client, 'Active');
          }} 
          title="Reactivate Client to Active"
          style={{ color: '#059669', border: '1px solid #A7F3D0', background: '#ECFDF5', borderRadius: 8, padding: '6px 8px' }}
        >
          <UserCheck size={15} />
        </button>
      ) : (
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleToggleClientStatus(client, 'Inactive');
          }} 
          title="Close Client (Mark Inactive)"
          style={{ color: '#DC2626', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 8, padding: '6px 8px' }}
        >
          <UserX size={15} />
        </button>
      )}
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setActiveMenuClient(client); 
        }} 
        title="More Actions"
        style={{ color: '#64748B', border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '6px 8px' }}
      >
        <MoreVertical size={15} />
      </button>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={28} style={{ color: 'var(--secondary)', verticalAlign: 'middle', marginRight: 8 }} />
          Client Management
        </h1>
        {canCreate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline" 
              onClick={handleAutoRectifyFamilies}
              disabled={rectifyingFamilies}
              title="Click to auto-detect and cluster family chains from shared contact details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderColor: '#BAE6FD',
                color: '#0284C7',
                background: '#F0F9FF',
                fontWeight: 700
              }}
            >
              <Users size={18} />
              <span>
                {rectifyingFamilies 
                  ? 'Connecting Families...' 
                  : familyStats 
                    ? `${familyStats.multiMemberFamilies || 0} Family Units (${familyStats.totalLinkedClients || 0} Clients)`
                    : 'Auto-Detect Families'}
              </span>
            </button>
            <button className="btn btn-outline add-lead-btn" onClick={() => setShowBulkUpload(true)}>
              <Plus size={20} /> <span>Bulk Upload</span>
            </button>
            <button className="btn btn-primary add-lead-btn" onClick={() => { setEditingClient(null); setShowModal(true); }}>
              <Plus size={20} /> <span>Add Client</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-input-wrapper" style={{ position: 'relative' }}>
          <Search />
          <input
            className="form-input"
            placeholder="Search clients by name, phone, ID, PAN, scheme..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: search ? 36 : 14 }}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('search');
                  window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
                } catch (e) {}
              }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="filters-scroll-row">
          <select 
            className="form-select" 
            value={filterService} 
            onChange={e => {
              const val = e.target.value;
              setFilterService(val);
              const newParams = new URLSearchParams(window.location.search);
              if (val) {
                newParams.set('service', val);
              } else {
                newParams.delete('service');
              }
              const queryString = newParams.toString();
              window.history.replaceState(null, '', queryString ? `/clients?${queryString}` : '/clients');
            }}
          >
            <option value="">All Services</option>
            <option value="Insurance">All Insurance</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select className="form-select" value={filterCallStatus} onChange={e => setFilterCallStatus(e.target.value)}>
            <option value="">All Call Status</option>
            <option value="Received">Received</option>
            <option value="Not Received">Not Received</option>
            <option value="Pending">Pending</option>
          </select>

          <select 
            className="form-select" 
            value={filterClientStatus} 
            onChange={e => setFilterClientStatus(e.target.value)}
            style={{ 
              fontWeight: 600, 
              minWidth: 155,
              borderColor: filterClientStatus === 'Inactive' ? '#FECACA' : filterClientStatus === 'Active' ? '#A7F3D0' : undefined,
              background: filterClientStatus === 'Inactive' ? '#FEF2F2' : filterClientStatus === 'Active' ? '#ECFDF5' : undefined,
              color: filterClientStatus === 'Inactive' ? '#DC2626' : filterClientStatus === 'Active' ? '#059669' : undefined
            }}
          >
            <option value="All">All Clients (Active & Inactive)</option>
            <option value="Active">Active Clients Only</option>
            <option value="Inactive">Inactive / Closed Clients</option>
          </select>
          
          {/* User Filters for Admin */}
          {user?.role === 'admin' && (
            <select className="form-select" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">All Users</option>
              {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>FROM</span>
            <input type="date" className="form-input" style={{ width: 120, height: 36, padding: '0 8px', fontSize: '0.8rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>TO</span>
            <input type="date" className="form-input" style={{ width: 120, height: 36, padding: '0 8px', fontSize: '0.8rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <button className="btn btn-outline" onClick={handleDownloadReport} title="Download Report">
            <FileText size={18} /> Export
          </button>
        </div>

        {/* Quick Follow-up Preset Filters & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'Active', label: 'Active', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
              { id: 'Inactive', label: 'Inactive / Closed', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
            ].map(s => {
              const isSelected = filterClientStatus === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilterClientStatus(s.id)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 20,
                    height: 28,
                    fontWeight: isSelected ? 800 : 600,
                    background: isSelected ? (s.bg || 'var(--primary)') : 'var(--bg-secondary)',
                    border: `1.5px solid ${isSelected ? (s.border || 'var(--primary)') : 'var(--border)'}`,
                    color: isSelected ? (s.color || '#FFFFFF') : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {s.id === 'Active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>}
                  {s.id === 'Inactive' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }}></span>}
                  {s.label}
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-light)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <CalendarClock size={14} color="var(--secondary)" />
            <span>FOLLOW-UP PRESETS:</span>
          </div>
          {[
            { id: 'all', label: 'All Dates' },
            { id: '7days', label: 'Next 7 Days', days: 7 },
            { id: '1month', label: '1 Month', days: 30 },
            { id: '2months', label: '2 Months', days: 60 },
            { id: '3months', label: '3 Months', days: 90 },
            { id: '6months', label: '6 Months', days: 180 },
            { id: 'today', label: 'Today', days: 0 },
          ].map(p => {
            return (
              <button
                key={p.id}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  if (p.id === 'all') {
                    setStartDate('');
                    setEndDate('');
                    setFilterDate('');
                  } else if (p.id === 'today') {
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(start.toISOString().split('T')[0]);
                    setFilterDate('');
                  } else {
                    const end = new Date(start.getTime() + p.days * 24 * 60 * 60 * 1000);
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(end.toISOString().split('T')[0]);
                    setFilterDate('');
                  }
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 20,
                  height: 28,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {filterService && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: '#F0F9FF', 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid #BAE6FD',
          boxShadow: '0 2px 6px rgba(14, 165, 233, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: '#0EA5E9', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <Shield size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filtered By Service:</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0C4A6E', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{filterService === 'Insurance' ? 'All Insurance Clients' : `${filterService} Clients`}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#E0F2FE', color: '#0284C7' }}>
                  {pagination.total} {pagination.total === 1 ? 'client' : 'clients'} found
                </span>
              </div>
            </div>
          </div>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={() => {
              setFilterService('');
              const newParams = new URLSearchParams(window.location.search);
              newParams.delete('service');
              const queryString = newParams.toString();
              window.history.replaceState(null, '', queryString ? `/clients?${queryString}` : '/clients');
            }}
            style={{ 
              background: '#FFFFFF', 
              borderColor: '#BAE6FD', 
              color: '#0284C7',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            <X size={15} /> Clear Service Filter
          </button>
        </div>
      )}

      {filterDate && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: 'var(--secondary-50)', 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid var(--secondary-100)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'var(--secondary)', color: 'white', borderRadius: 8 }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Showing scheduled items for:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary-dark)' }}>{new Date(filterDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setFilterDate('')}>
            <X size={16} /> Clear Date Filter
          </button>
        </div>
      )}


      {/* Unified Spreadsheet (Sheet) View */}
      <div className="sheet-container">
        {loading ? (
          <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner"></div></div>
        ) : clients.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h3>No clients found</h3><p>Convert your leads to see them here</p></div>
        ) : (
          <table className="sheet-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Phone / Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>City</th>
                <th>Pan Number</th>
                <th>Pincode</th>
                <th>Date Of Birth</th>
                <th>Service</th>
                <th>Nominee</th>
                <th>Call Status</th>
                <th>Assigned To</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => {
                const clientIdStr = client.leadId || (client.leadNumber ? `INV-${client.leadNumber}` : 'INV-—');
                return (
                  <tr 
                    key={client._id}
                    onClick={() => viewDetail(client._id)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    title="Click to view client profile"
                  >
                    <td data-label="ID" style={{ fontWeight: 700, color: '#0EA5E9', fontSize: '0.85rem' }}>
                      {clientIdStr}
                    </td>
                    <td className="lead-name" data-label="Name" style={{ fontWeight: 700, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>{(client.name || '').replace(/\s*\[.*?\]|\s*\(.*?\)/g, '').trim() || client.name}</span>
                        {client.panNumber && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1', background: '#F0F9FF', padding: '1px 6px', borderRadius: 4, border: '1px solid #BAE6FD' }}>
                            {client.panNumber}
                          </span>
                        )}
                        {client.familyId && (
                          <span 
                            title={`Linked to Family ${client.familyId} (${client.familyRole || 'Member'}) - Click to view family tree`}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientDetailTab('family');
                              viewDetail(client._id);
                            }}
                          >
                            <Users size={11} />
                            {client.familyId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Status">
                      {client.clientStatus === 'Inactive' || client.clientStatus === 'Closed' ? (
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#FEF2F2', 
                            color: '#DC2626', 
                            border: '1px solid #FECACA',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title={client.closedAt ? `Closed on ${new Date(client.closedAt).toLocaleDateString()}` : 'Inactive / Closed Client'}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }}></span>
                          Inactive
                        </span>
                      ) : (
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#ECFDF5', 
                            color: '#059669', 
                            border: '1px solid #A7F3D0',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                          Active
                        </span>
                      )}
                    </td>
                    <td data-label="Phone / Mobile">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} style={{ color: '#0EA5E9' }} />
                        <span style={{ fontWeight: 600 }}>{client.phone}</span>
                      </div>
                    </td>
                    <td data-label="Email">{client.email || '—'}</td>
                    <td data-label="Address">{client.address || '—'}</td>
                    <td data-label="City">{client.city || '—'}</td>
                    <td data-label="Pan Number" style={{ fontWeight: 600 }}>{client.panNumber || '—'}</td>
                    <td data-label="Pincode">{client.pincode || '—'}</td>
                    <td data-label="Service">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <span className="badge badge-blue">{client.service || '—'}</span>
                        {client.schemes && client.schemes
                          .map(s => s.service)
                          .filter((s, idx, arr) => s && s !== client.service && arr.indexOf(s) === idx)
                          .map(extraS => (
                            <span key={extraS} className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              + {extraS}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td data-label="Nominee">
                      {client.nomineeName ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                            {client.nomineeName}
                          </span>
                          <span style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            {client.nomineeRelation || 'Nominee'} {client.nomineePhone ? `• ${client.nomineePhone}` : ''}
                          </span>
                        </div>
                      ) : (
                        <span style={{ 
                          fontSize: '0.72rem', 
                          padding: '2px 8px', 
                          borderRadius: 6, 
                          background: '#FEF3C7', 
                          color: '#B45309', 
                          fontWeight: 700 
                        }}>
                          Not Added
                        </span>
                      )}
                    </td>
                    <td data-label="Call Status">
                      <span className={`badge ${client.callStatus === 'Received' ? 'badge-green' : client.callStatus === 'Not Received' ? 'badge-red' : 'badge-gray'}`}>
                        {client.callStatus || 'Received'}
                      </span>
                    </td>
                    <td data-label="Assigned To">{client.assignedTo?.name || '—'}</td>
                    <td data-label="Follow-up">
                      {client.followUpDate ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterDate(client.followUpDate.split('T')[0]);
                          }}
                          style={{ 
                            background: '#FFF7ED', 
                            border: '1px solid #FED7AA',
                            color: '#EA580C',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}
                        >
                          {new Date(client.followUpDate).toLocaleDateString()}
                        </button>
                      ) : '—'}
                    </td>
                    <td data-label="Actions" onClick={e => e.stopPropagation()}>
                      <RenderClientActions client={client} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={fetchClients} />


      {/* Assign Modal */}
      {showAssignModal && assignClient && (
        <div className="modal-backdrop" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Client</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setAssignRole(''); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                Assign <strong>{assignClient.name}</strong> to:
              </p>
              
              {!assignRole ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setAssignRole('user')} style={{ flexDirection: 'column', padding: '24px 12px', height: 'auto', gap: 12 }}>
                    <UserPlus size={24} /> <span>User / Staff</span>
                  </button>
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAssignRole('')} style={{ marginBottom: 16, padding: 0 }}>
                    ← Back to role selection
                  </button>
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AssignmentList 
                      role={assignRole} 
                      onSelect={(userId) => handleAssign(assignClient._id, userId)} 
                      currentUser={user}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailClient && (
        <div className="modal-backdrop" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Push Email Notification</h3>
              <button className="modal-close" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              {!showCustomEmail ? (
                <>
                  <p style={{ marginBottom: 20 }}>Choose a meaningful email scenario for <strong>{emailClient.name}</strong>:</p>
                  
                  <div style={{ display: 'grid', gap: 12 }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                      onClick={() => handleSendEmail('sipReminder')}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                          <Send size={16} /> SIP Investment Reminder
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Encourage client to start their monthly investment for {emailClient.service}.
                        </div>
                      </div>
                    </button>

                    <button 
                      className="btn btn-outline" 
                       style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--border)' }}
                      onClick={() => handleSendEmail('followUp')}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary)' }}>
                          <Send size={16} /> General Follow-up
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          A professional check-in to see if they are ready to proceed.
                        </div>
                      </div>
                    </button>

                    <button 
                      className="btn btn-outline" 
                      style={{ justifyContent: 'flex-start', padding: '16px', textAlign: 'left', height: 'auto', border: '1.5px solid var(--secondary)', background: 'var(--secondary-50)' }}
                      onClick={() => setShowCustomEmail(true)}
                      disabled={emailSending}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-dark)' }}>
                          <Edit size={16} /> Custom Email Message
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Type your own subject and message for this client.
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCustomEmail(false)} style={{ padding: 0, alignSelf: 'flex-start' }}>
                    ← Back to templates
                  </button>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input 
                      className="form-input" 
                      value={customEmailData.subject} 
                      onChange={e => setCustomEmailData({ ...customEmailData, subject: e.target.value })}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message Content</label>
                    <textarea 
                      className="form-textarea" 
                      value={customEmailData.content} 
                      onChange={e => setCustomEmailData({ ...customEmailData, content: e.target.value })}
                      placeholder="Type your message here..."
                      style={{ minHeight: 200 }}
                    />
                  </div>
                  <button 
                    className="btn btn-primary btn-block" 
                    onClick={() => handleSendEmail('custom')}
                    disabled={emailSending}
                  >
                    <Send size={18} /> Send Custom Email
                  </button>
                </div>
              )}

              {!emailClient.email && (
                <div style={{ marginTop: 16, padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <X size={16} /> This client is missing an email address.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowEmailModal(false); setShowCustomEmail(false); }}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* Email Sending Loader */}
      {emailSending && <LogoLoader message="Pushing Email Notification..." />}


      {/* Schedule Call Modal */}
      {showScheduleCall && scheduleClient && (
        <ScheduleEventModal
          lead={scheduleClient}
          type="Call"
          onClose={() => { setShowScheduleCall(false); setScheduleClient(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleClient._id,
                  type: 'Call',
                  assignedTo: scheduleClient.assignedTo?._id || scheduleClient.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule call');
              addToast('Call scheduled successfully!', 'success');
              setShowScheduleCall(false);
              setScheduleClient(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}

      {/* Schedule Meet Modal */}
      {showScheduleMeet && scheduleClient && (
        <ScheduleEventModal
          lead={scheduleClient}
          type="Meeting"
          onClose={() => { setShowScheduleMeet(false); setScheduleClient(null); }}
          onSave={async (data) => {
            try {
              const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  leadId: scheduleClient._id,
                  type: 'Meeting',
                  assignedTo: scheduleClient.assignedTo?._id || scheduleClient.assignedTo || user?._id || user?.id,
                }),
              });
              if (!res.ok) throw new Error('Failed to schedule meeting');
              addToast('Meeting scheduled successfully!', 'success');
              setShowScheduleMeet(false);
              setScheduleClient(null);
            } catch (err) { addToast(err.message, 'error'); }
          }}
        />
      )}


      {/* Action Menu (Bottom Sheet) */}
      {activeMenuClient && (
        <ActionMenu 
          client={activeMenuClient}
          onClose={() => setActiveMenuClient(null)}
          onAction={(action) => {
            setActiveMenuClient(null);
            switch(action) {
              case 'view': viewDetail(activeMenuClient._id); break;
              case 'followup': setFollowUpClient(activeMenuClient); setShowFollowUp(true); break;
              case 'followup_history': setClientDetailTab('followups'); viewDetail(activeMenuClient._id); break;
              case 'family': setClientDetailTab('family'); viewDetail(activeMenuClient._id); break;
              case 'documents': setDocumentsClient(activeMenuClient); setShowDocumentsModal(true); break;
              case 'tasks': setTasksClient(activeMenuClient); setShowTasksModal(true); break;
              case 'schedule_call': setScheduleClient(activeMenuClient); setShowScheduleCall(true); break;
              case 'schedule_meet': setScheduleClient(activeMenuClient); setShowScheduleMeet(true); break;
              case 'history': setClientDetailTab('followups'); viewDetail(activeMenuClient._id); break;
              case 'email': setEmailClient(activeMenuClient); setShowEmailModal(true); break;
              case 'edit': setEditingClient(activeMenuClient); setShowModal(true); break;
              case 'close_client': handleToggleClientStatus(activeMenuClient, 'Inactive'); break;
              case 'reactivate_client': handleToggleClientStatus(activeMenuClient, 'Active'); break;
              case 'assign': setAssignClient(activeMenuClient); setShowAssignModal(true); break;
              case 'delete': handleDelete(activeMenuClient._id); break;
            }
          }}
          canAssign={canAssign}
          canDelete={canDelete}
          canEdit={canEdit}
        />
      )}

      <>
        {showDetail && detailData && (
          <div className="modal-backdrop" onClick={() => setShowDetail(null)}>
            <div 
              className="modal" 
              onClick={e => e.stopPropagation()} 
              style={{ 
                maxWidth: 960, 
                width: '95%',
                borderRadius: 24, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column', 
                maxHeight: '92vh',
                background: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Client Profile Header (Panel 7) */}
              <div style={{ 
                padding: '24px 28px', 
                background: '#FFFFFF', 
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.4rem', 
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                  }}>
                    {detailData.lead?.name ? detailData.lead.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  {(() => {
                    const rawName = detailData.lead?.name || 'Client Details';
                    const cleanName = rawName.replace(/\s*\[.*?\]|\s*\(.*?\)/g, '').trim() || rawName;
                    const pan = (detailData.lead?.panNumber || '').trim();
                    const clientCode = detailData.lead?.clientCode || detailData.lead?.leadId || '';
                    const fullAddress = [
                      detailData.lead?.address,
                      detailData.lead?.city || detailData.lead?.location,
                      detailData.lead?.pincode ? detailData.lead.pincode : ''
                    ].filter(Boolean).join(', ');

                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{cleanName}</span>
                            {pan && (
                              <span style={{ color: '#0284C7', fontWeight: 800 }}>
                                [{pan}]
                              </span>
                            )}
                            {clientCode && (
                              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                                (ID: {clientCode})
                              </span>
                            )}
                          </h2>
                          {detailData.lead?.clientStatus === 'Inactive' || detailData.lead?.clientStatus === 'Closed' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleClientStatus(detailData.lead, 'Active')}
                              style={{ 
                                background: '#FEF2F2', 
                                color: '#DC2626', 
                                border: '1px solid #FECACA',
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                padding: '3px 10px', 
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Client is Inactive / Closed. Click to reactivate as Active."
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }}></span>
                              Inactive (Closed) ↺
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleClientStatus(detailData.lead, 'Inactive')}
                              style={{ 
                                background: '#ECFDF5', 
                                color: '#059669', 
                                border: '1px solid #A7F3D0',
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                padding: '3px 10px', 
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Client is Active. Click to close client."
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                              Active
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap', lineHeight: 1.4 }}>
                          {fullAddress && <span>{fullAddress}</span>}
                          {fullAddress && <span>•</span>}
                          <span>Mob. {detailData.lead?.phone || '—'}</span>
                          {detailData.lead?.email && (
                            <>
                              <span>•</span>
                              <span>{detailData.lead.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {(detailData.lead?.whatsappNumber || detailData.lead?.phone) && (
                    <a
                      href={`https://wa.me/91${(detailData.lead.whatsappNumber || detailData.lead.phone).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{
                        borderRadius: 10,
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#15803D',
                        borderColor: '#BBF7D0',
                        background: '#F0FDF4',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                      title="Open WhatsApp chat with client"
                    >
                      <Phone size={14} /> WhatsApp
                    </a>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setTasksClient(detailData.lead);
                      setShowTasksModal(true);
                    }}
                    style={{
                      borderRadius: 10,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#7C3AED',
                      borderColor: '#DDD6FE',
                      background: '#F5F3FF',
                      fontWeight: 700,
                      fontSize: '0.82rem'
                    }}
                    title="Assign staff task for this client"
                  >
                    <CheckCircle size={14} /> + Task
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setFollowUpClient(detailData.lead);
                      setShowFollowUp(true);
                    }}
                    style={{ 
                      borderRadius: 10, 
                      padding: '8px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(14, 165, 233, 0.3)'
                    }}
                  >
                    <Calendar size={16} /> Log Follow-up
                  </button>
                  {canAssign && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => {
                        setAssignClient(detailData.lead);
                        setShowAssignModal(true);
                      }}
                      style={{ 
                        borderRadius: 10, 
                        padding: '8px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        color: '#6366F1',
                        borderColor: '#6366F1'
                      }}
                    >
                      <UserPlus size={16} /> Assign
                    </button>
                  )}
                  <button 
                    className="btn btn-outline" 
                    onClick={() => {
                      setEditingClient(detailData.lead);
                      setShowModal(true);
                    }}
                    style={{ 
                      borderRadius: 10, 
                      padding: '8px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      color: '#0EA5E9',
                      borderColor: '#0EA5E9'
                    }}
                  >
                    <Edit size={16} /> Edit Client
                  </button>
                  {detailData.lead?.clientStatus === 'Inactive' || detailData.lead?.clientStatus === 'Closed' ? (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleToggleClientStatus(detailData.lead, 'Active')}
                      style={{ 
                        borderRadius: 10, 
                        padding: '8px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        color: '#059669',
                        borderColor: '#A7F3D0',
                        background: '#ECFDF5',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                      title="Reactivate this client"
                    >
                      <UserCheck size={16} /> Reactivate Client
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleToggleClientStatus(detailData.lead, 'Inactive')}
                      style={{ 
                        borderRadius: 10, 
                        padding: '8px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        color: '#DC2626',
                        borderColor: '#FECACA',
                        background: '#FEF2F2',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                      title="Mark this client as closed / inactive"
                    >
                      <UserX size={16} /> Close Client
                    </button>
                  )}
                  <button className="modal-close" onClick={() => setShowDetail(null)} style={{ padding: 8 }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                padding: '12px 28px', 
                background: '#F8FAFC', 
                borderBottom: '1px solid #E2E8F0',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'followups', label: 'Follow-up History' },
                  { id: 'family', label: 'Family Tree & Chain' },
                  { id: 'kyc', label: 'KYC & Documents' },
                  { id: 'investments', label: 'Mutual Fund / Investment' },
                  { id: 'services', label: 'Other Services' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'activities', label: 'Activities' },
                ].map(tab => {
                  const isActive = clientDetailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClientDetailTab(tab.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: isActive ? '1px solid #0EA5E9' : '1px solid transparent',
                        background: isActive ? '#0EA5E9' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body with Multi-Tab Content */}
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px 28px', background: '#FFFFFF' }}>
                
                {/* TAB 1: OVERVIEW */}
                {clientDetailTab === 'overview' && (() => {
                  const allDocs = [
                    ...(detailData.lead?.onboardingData || []).filter(d => d.value && String(d.value).startsWith('/uploads/')).map(d => ({
                      name: d.label,
                      url: d.value
                    })),
                    ...(detailData.lead?.documents || []).map(d => ({
                      name: d.name,
                      url: d.url
                    }))
                  ];
                  const pDoc = allDocs.find(d => /pan/i.test(d.name));
                  const aDoc = allDocs.find(d => /aadhaar|adhar/i.test(d.name));
                  const bDoc = allDocs.find(d => /bank|cheque|mandate/i.test(d.name));

                  return (
                    <div>
                      {/* Client Summary & Quick Metrics Ribbon */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                        marginBottom: 20
                      }}>
                        {/* SIP Book */}
                        <div style={{
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: 14,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IndianRupee size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Monthly SIP Book</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0C4A6E' }}>
                              ₹ {(detailData.lead?.sipAmount || 0).toLocaleString('en-IN')}{detailData.lead?.sipDay ? ` (D-${detailData.lead.sipDay})` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Lumpsum Investments */}
                        <div style={{
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: 14,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700, textTransform: 'uppercase' }}>Lumpsum Holdings</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14532D' }}>
                              ₹ {(detailData.lead?.investmentAmount || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Active Portfolios */}
                        <div style={{
                          background: '#FAF5FF',
                          border: '1px solid #E9D5FF',
                          borderRadius: 14,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#9333EA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#7E22CE', fontWeight: 700, textTransform: 'uppercase' }}>Total Schemes</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#581C87' }}>
                              {(detailData.lead?.schemes && detailData.lead.schemes.length > 0) ? detailData.lead.schemes.length : (detailData.lead?.schemeName ? 1 : 0)} Active
                            </div>
                          </div>
                        </div>

                        {/* Nominee Status */}
                        <div style={{
                          background: detailData.lead?.nomineeName ? '#F5F3FF' : '#FEF3C7',
                          border: detailData.lead?.nomineeName ? '1px solid #DDD6FE' : '1px solid #FDE68A',
                          borderRadius: 14,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: detailData.lead?.nomineeName ? '#7C3AED' : '#D97706',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <UserCheck size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: detailData.lead?.nomineeName ? '#6D28D9' : '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>
                              Nominee Beneficiary
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: detailData.lead?.nomineeName ? '#4C1D95' : '#78350F' }}>
                              {detailData.lead?.nomineeName ? `${detailData.lead.nomineeName} (${detailData.lead.nomineeRelation || 'Nominee'})` : 'Missing Declaration ⚠️'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'stretch' }}>
                        
                        {/* Card 1: Personal & Contact Details */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Personal Details
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Identity & Contact</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#0EA5E9', border: '1px solid #BAE6FD', background: '#F0F9FF', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>DOB</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                  {detailData.lead?.dateOfBirth ? (detailData.lead.dateOfBirth.includes('T') ? detailData.lead.dateOfBirth.split('T')[0] : detailData.lead.dateOfBirth) : '—'}
                                </span>
                                {(() => {
                                  if (!detailData.lead?.dateOfBirth) return null;
                                  const s = String(detailData.lead.dateOfBirth).trim();
                                  const now = new Date();
                                  const m = now.getMonth() + 1;
                                  const d = now.getDate();
                                  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                                  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
                                  const isToday = (ymd && parseInt(ymd[2], 10) === m && parseInt(ymd[3], 10) === d) ||
                                                  (dmy && parseInt(dmy[2], 10) === m && parseInt(dmy[1], 10) === d);
                                  if (!isToday) return null;
                                  const phone = (detailData.lead.whatsappNumber || detailData.lead.phone || '').replace(/[^0-9]/g, '');
                                  const finalPhone = phone.length === 10 ? '91' + phone : phone;
                                  const bdayMsg = `Dear ${detailData.lead.name}, 🎂 Happy Birthday from Team Investrow Financial Services! May this year bring you great health, joy, and success!`;
                                  return (
                                    <a
                                      href={`https://wa.me/${finalPhone}?text=${encodeURIComponent(bdayMsg)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: '0.7rem',
                                        background: '#FEF3C7',
                                        color: '#B45309',
                                        border: '1px solid #FDE68A',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        fontWeight: 800,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 2
                                      }}
                                    >
                                      🎂 Birthday Today!
                                    </a>
                                  );
                                })()}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>PAN Number</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0F172A', fontWeight: 800, letterSpacing: '0.04em' }}>
                                  {detailData.lead?.panNumber || '—'}
                                </span>
                                {pDoc ? (
                                  <a href={pDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                    ✓ Doc
                                  </a>
                                ) : (
                                  <button onClick={() => openUploadFor('PAN Card')} style={{ fontSize: '0.7rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                    + Upload
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Aadhaar Number</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0F172A', fontWeight: 800 }}>
                                  {detailData.lead?.aadhaarNumber ? `•••• ${detailData.lead.aadhaarNumber.slice(-4)}` : '—'}
                                </span>
                                {aDoc ? (
                                  <a href={aDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                    ✓ Doc
                                  </a>
                                ) : (
                                  <button onClick={() => openUploadFor('Aadhaar Card')} style={{ fontSize: '0.7rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                    + Upload
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Phone</span>
                              <a href={`tel:${detailData.lead?.phone}`} style={{ color: '#0EA5E9', fontWeight: 700, textDecoration: 'none' }}>
                                {detailData.lead?.phone || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>WhatsApp</span>
                              <a href={`https://wa.me/91${(detailData.lead?.whatsappNumber || detailData.lead?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
                                {detailData.lead?.whatsappNumber || detailData.lead?.phone || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Email</span>
                              <a href={`mailto:${detailData.lead?.email}`} style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={detailData.lead?.email}>
                                {detailData.lead?.email || '—'}
                              </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Address</span>
                              <span style={{ color: '#0F172A', fontWeight: 600, textAlign: 'right', maxWidth: 180, fontSize: '0.82rem' }}>
                                {detailData.lead?.address || '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>City & Pincode</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {[detailData.lead?.city || detailData.lead?.location, detailData.lead?.pincode].filter(Boolean).join(' - ') || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Financial Advisory Profile */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFEDD5', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Advisory Profile
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Advisor, KYC & Risk</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#EA580C', border: '1px solid #FFEDD5', background: '#FFF7ED', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Advisor / RM</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.assignedTo?.name || 'Birendra Kumar'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Client Since</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                                {new Date(detailData.lead?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>KYC Status</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: detailData.lead?.kycStatus === 'Verified' ? '#DCFCE7' : '#FEF3C7', 
                                color: detailData.lead?.kycStatus === 'Verified' ? '#15803D' : '#B45309', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.kycStatus || (detailData.lead?.panNumber ? 'Verified' : 'Pending')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Risk Profile</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: '#FFF7ED', 
                                color: '#EA580C', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.riskProfile || 'Moderate'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Family Chain</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '0.82rem' }}>
                                  {detailData.lead?.familyId ? `${detailData.lead.familyId} (${detailData.lead.familyRole || 'Member'})` : 'Individual'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setClientDetailTab('family')}
                                  style={{
                                    border: 'none',
                                    background: '#E0F2FE',
                                    color: '#0284C7',
                                    borderRadius: 6,
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  View Tree →
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Primary Service</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.service || 'Mutual Funds'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Investment Plan</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.investmentType || (detailData.lead?.sipAmount ? 'Monthly SIP' : 'Lumpsum')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Monthly SIP Book</span>
                              <span style={{ color: '#0284C7', fontWeight: 800 }}>
                                ₹ {(detailData.lead?.sipAmount || 0).toLocaleString('en-IN')}/mo
                                {detailData.lead?.sipDay ? ` (Day ${detailData.lead.sipDay})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Bank Account & Compliance Vault */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Bank & Compliance
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Mandate & Document Vault</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#15803D', border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> Link / Edit
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Bank Name</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {detailData.lead?.bankName || 'Not Linked'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Account No</span>
                              <span style={{ color: '#0F172A', fontWeight: 700, letterSpacing: '0.04em' }}>
                                {detailData.lead?.bankAccountNumber ? `•••• •••• ${detailData.lead.bankAccountNumber.slice(-4)}` : '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>IFSC Code</span>
                              <span style={{ color: '#0F172A', fontWeight: 700, letterSpacing: '0.04em' }}>
                                {detailData.lead?.bankIfscCode || '—'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>ECS / NACH</span>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 6, 
                                background: detailData.lead?.bankAccountNumber ? '#DCFCE7' : '#FEF3C7', 
                                color: detailData.lead?.bankAccountNumber ? '#15803D' : '#B45309', 
                                fontWeight: 800, 
                                fontSize: '0.76rem' 
                              }}>
                                {detailData.lead?.bankAccountNumber ? 'Active Mandate' : 'Pending Setup'}
                              </span>
                            </div>

                            {/* Vault & Proofs Subsection */}
                            <div style={{ marginTop: 4, padding: '10px 12px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
                                Document Proofs & Actions
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>Cancelled Cheque</span>
                                  {bDoc ? (
                                    <a href={bDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('Cancelled Cheque / Bank Mandate')} style={{ fontSize: '0.72rem', color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload Cheque
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>PAN Card Proof</span>
                                  {pDoc ? (
                                    <a href={pDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('PAN Card')} style={{ fontSize: '0.72rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload PAN
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>Aadhaar Proof</span>
                                  {aDoc ? (
                                    <a href={aDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
                                      ✓ View Proof
                                    </a>
                                  ) : (
                                    <button onClick={() => openUploadFor('Aadhaar Card')} style={{ fontSize: '0.72rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                                      + Upload Aadhaar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Card 4: Nominee & Beneficiary Details */}
                        <div style={{ 
                          background: '#FFFFFF', 
                          border: '1.5px solid #E2E8F0', 
                          borderRadius: 18, 
                          padding: '22px 24px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  Nominee Details
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Folio & Claims Beneficiary</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              style={{ color: '#7C3AED', border: '1px solid #DDD6FE', background: '#F5F3FF', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit size={12} /> {detailData.lead?.nomineeName ? 'Edit' : '+ Add'}
                            </button>
                          </div>

                          {detailData.lead?.nomineeName ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: '0.86rem', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Nominee Name</span>
                                <span style={{ color: '#0F172A', fontWeight: 800, fontSize: '0.92rem' }}>
                                  {detailData.lead.nomineeName}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Relationship</span>
                                <span style={{ 
                                  padding: '2px 10px', 
                                  borderRadius: 6, 
                                  background: '#EDE9FE', 
                                  color: '#6D28D9', 
                                  fontWeight: 800, 
                                  fontSize: '0.76rem' 
                                }}>
                                  {detailData.lead.nomineeRelation || 'Beneficiary'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Contact Number</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                    {detailData.lead.nomineePhone || '—'}
                                  </span>
                                  {detailData.lead.nomineePhone && (
                                    <>
                                      <a 
                                        href={`tel:${detailData.lead.nomineePhone}`} 
                                        title="Call Nominee"
                                        style={{ color: '#0284C7', textDecoration: 'none', background: '#E0F2FE', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}
                                      >
                                        Call
                                      </a>
                                      <a 
                                        href={`https://wa.me/91${detailData.lead.nomineePhone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        title="WhatsApp Nominee"
                                        style={{ color: '#15803D', textDecoration: 'none', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}
                                      >
                                        WhatsApp
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>

                              {detailData.lead.nomineeEmail && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                  <span style={{ color: '#64748B', fontWeight: 600 }}>Email ID</span>
                                  <a href={`mailto:${detailData.lead.nomineeEmail}`} style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {detailData.lead.nomineeEmail}
                                  </a>
                                </div>
                              )}

                              {detailData.lead.nomineeAadhaar && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                  <span style={{ color: '#64748B', fontWeight: 600 }}>Aadhaar</span>
                                  <span style={{ color: '#0F172A', fontWeight: 700, letterSpacing: '0.04em' }}>
                                    {detailData.lead.nomineeAadhaar.length >= 4 
                                      ? `•••• ${detailData.lead.nomineeAadhaar.slice(-4)}`
                                      : detailData.lead.nomineeAadhaar}
                                  </span>
                                </div>
                              )}

                              {detailData.lead.nomineeDob && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F8FAFC' }}>
                                  <span style={{ color: '#64748B', fontWeight: 600 }}>Date of Birth</span>
                                  <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                    {detailData.lead.nomineeDob}
                                  </span>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Share Allocation</span>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: 6, 
                                  background: '#DCFCE7', 
                                  color: '#15803D', 
                                  fontWeight: 800, 
                                  fontSize: '0.78rem' 
                                }}>
                                  {detailData.lead.nomineeAllocation || 100}% Share
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              padding: '24px 12px',
                              background: '#FFFBEB',
                              borderRadius: 14,
                              border: '1px dashed #FDE68A',
                              flex: 1
                            }}>
                              <AlertCircle size={28} color="#D97706" style={{ marginBottom: 8 }} />
                              <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.88rem' }}>
                                No Nominee Assigned
                              </div>
                              <p style={{ fontSize: '0.76rem', color: '#B45309', margin: '6px 0 14px', maxWidth: 220, lineHeight: 1.4 }}>
                                AMFI & IRDAI regulations require nominating a beneficiary for mutual fund folios & policies.
                              </p>
                              <button
                                onClick={() => {
                                  setEditingClient(detailData.lead);
                                  setShowModal(true);
                                }}
                                style={{
                                  border: 'none',
                                  background: '#D97706',
                                  color: '#FFFFFF',
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Plus size={14} /> Add Nominee Details
                              </button>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Family Tree Quick Strip in Overview */}
                      <div style={{
                        marginTop: 20,
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                        border: '1.5px solid #BAE6FD',
                        borderRadius: 16,
                        padding: '18px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 14,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: '#0284C7', color: '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)'
                          }}>
                            <Users size={22} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>Family Chain & Portfolio Hierarchy</span>
                              {detailData.lead?.familyId && (
                                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 8, background: '#E0F2FE', color: '#0369A1', fontWeight: 700 }}>
                                  {detailData.lead.familyId} • {detailData.lead.familyRole || 'Member'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                              Link spouse, children & parents to track collective SIPs, schemes, and family wealth.
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setClientDetailTab('family')}
                            style={{
                              padding: '9px 16px',
                              borderRadius: 10,
                              border: '1.5px solid #BAE6FD',
                              background: '#FFFFFF',
                              color: '#0284C7',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Users size={16} />
                            View Family Tree
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFamilyModalClient(detailData.lead);
                              setShowAddFamilyModal(true);
                            }}
                            style={{
                              padding: '9px 18px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#0284C7',
                              color: '#FFFFFF',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)'
                            }}
                          >
                            <Plus size={16} />
                            Add Family Member
                          </button>
                        </div>
                      </div>

                    {/* IFAPlanet-style SIP Details & Portfolio Schemes Table */}
                    {(() => {
                      const schemesList = detailData.lead?.schemes || [];
                      const sipSchemes = schemesList.filter(s => 
                        (s.sipAmount > 0) || 
                        (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ||
                        (s.service === 'Mutual Funds' && s.investmentType !== 'Lumpsum')
                      );
                      const otherSchemes = schemesList.filter(s => !sipSchemes.includes(s));
                      const activeSips = sipSchemes.filter(s => !['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(s.status));
                      const totalSip = activeSips.reduce((acc, s) => acc + (Number(s.sipAmount) || 0), 0);
                      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                      return (
                        <div style={{ marginTop: 20, borderRadius: 16, overflow: 'hidden', border: '1.5px solid #CBD5E1', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', background: '#FFFFFF' }}>
                          {/* Investrow Brand Blue Banner */}
                          <div style={{
                            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            padding: '12px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF' }}>
                              <Landmark size={20} style={{ color: '#E0F2FE' }} />
                              <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.2px' }}>
                                SIP Details As On {todayFormatted}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => addToast(`Showing all ${sipSchemes.length} SIP mandates`, 'info')}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.18)',
                                  border: '1px solid rgba(255, 255, 255, 0.35)',
                                  color: '#FFFFFF',
                                  padding: '6px 14px',
                                  borderRadius: 6,
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Show All SIPs
                              </button>

                              {/* PDF Button */}
                              <button
                                type="button"
                                title="Download PDF Report"
                                onClick={() => window.print()}
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: '#EF4444',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <FileText size={16} />
                              </button>

                              {/* Excel / CSV Button */}
                              <button
                                type="button"
                                title="Export to Excel / CSV"
                                onClick={() => exportSipCsv(sipSchemes, detailData.lead?.name)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Download size={16} />
                              </button>

                              {/* Email Button */}
                              <button
                                type="button"
                                title="Send SIP Details via Email"
                                onClick={() => {
                                  if (detailData.lead?.email) {
                                    window.open(`mailto:${detailData.lead.email}?subject=Your SIP Portfolio Details - ${todayFormatted}&body=Dear ${detailData.lead.name},%0D%0A%0D%0APlease find your registered SIP schemes summary with total monthly commitment of ₹${totalSip.toLocaleString('en-IN')}.%0D%0A%0D%0ARegards,%0D%0AInvestrow Financial Services`);
                                  } else {
                                    addToast('No email address registered for this client', 'error');
                                  }
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: '#6366F1',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Mail size={16} />
                              </button>

                              {/* WhatsApp Button */}
                              <button
                                type="button"
                                title="Share SIP on WhatsApp"
                                onClick={() => {
                                  const phone = detailData.lead?.whatsappNumber || detailData.lead?.phone;
                                  if (phone) {
                                    const cleanPhone = phone.replace(/[^0-9]/g, '');
                                    const text = encodeURIComponent(`*SIP Details for ${detailData.lead?.name}* (As on ${todayFormatted}):\n\n` +
                                      sipSchemes.map((s, i) => `${i + 1}. *${s.schemeName}*\n   • Amount: ₹${Number(s.sipAmount).toLocaleString('en-IN')}/mo\n   • Folio: ${s.policyNumber || 'Pending'}\n   • Deduction: ${formatDayOrdinal(s.sipDay || 20)} of month\n   • Bank: ${s.deductionBank || s.bankName || 'STATE BANK OF INDIA'}\n   • Status: ${s.status || 'Running'}`).join('\n\n') +
                                      `\n\n*Total Monthly SIP:* ₹${totalSip.toLocaleString('en-IN')}/mo\n\n_Investrow Financial Services_`);
                                    window.open(`https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${text}`, '_blank');
                                  } else {
                                    addToast('No phone number registered for this client', 'error');
                                  }
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: '#22C55E',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <MessageSquare size={16} />
                              </button>

                              {/* Upload XLSX Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('upload');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: 'rgba(255, 255, 255, 0.18)',
                                  border: '1px solid rgba(255, 255, 255, 0.35)',
                                  color: '#FFFFFF',
                                  padding: '7px 13px',
                                  borderRadius: 6,
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Upload SIP portfolio spreadsheet (.xlsx / .csv)"
                              >
                                <FileSpreadsheet size={15} />
                                Upload XLSX
                              </button>

                              {/* Investrow Orange "+ Add SIP Scheme" button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('manual');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '7px 14px',
                                  borderRadius: 6,
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)'
                                }}
                              >
                                <Plus size={15} />
                                + Add SIP Scheme
                              </button>
                            </div>
                          </div>

                          {/* Table Container */}
                          <div style={{ overflowX: 'auto', background: '#FFFFFF' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 950 }}>
                              <thead>
                                <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #E2E8F0' }}>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', width: 65 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                      <input type="checkbox" defaultChecked readOnly style={{ accentColor: '#0284C7', cursor: 'pointer' }} />
                                      <span>Sr.</span>
                                    </div>
                                  </th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Scheme Name</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Deduction from Bank</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Folio Number</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'right' }}>SIP Amount</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>SIP Frequency</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>SIP Start Date</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>SIP End Date</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Deduction Date</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>SIP Status</th>
                                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', width: 80 }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sipSchemes.length === 0 ? (
                                  <tr>
                                    <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
                                      No SIP schemes registered yet. Click <strong style={{ color: '#0284C7', cursor: 'pointer' }} onClick={() => { setServiceSchemeTarget('Mutual Funds'); setShowServiceSchemeModal(true); }}>+ Add SIP Scheme</strong> to create one.
                                    </td>
                                  </tr>
                                ) : (
                                  sipSchemes.map((s, idx) => {
                                    const realSchemeIndex = schemesList.indexOf(s);
                                    return (
                                      <tr 
                                        key={idx} 
                                        style={{ 
                                          background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                          fontSize: '0.82rem',
                                          borderBottom: '1px solid #E2E8F0',
                                          transition: 'background 0.15s'
                                        }}
                                      >
                                        {/* Sr No & checkbox */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <input type="checkbox" defaultChecked style={{ accentColor: '#0284C7', cursor: 'pointer' }} />
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{idx + 1}</span>
                                          </div>
                                        </td>

                                        {/* Scheme Name */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                                          {s.schemeName || 'Mutual Fund SIP Scheme'}
                                        </td>

                                        {/* Deduction from Bank */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', color: '#334155', fontWeight: 600, textTransform: 'uppercase' }}>
                                          {s.deductionBank || s.bankName || detailData.lead?.bankName || 'STATE BANK OF INDIA'}
                                        </td>

                                        {/* Folio Number (bold blue link) */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <span 
                                            onClick={() => {
                                              if (s.policyNumber) {
                                                navigator.clipboard?.writeText(s.policyNumber);
                                                addToast(`Copied Folio: ${s.policyNumber}`, 'success');
                                              }
                                            }}
                                            title="Click to copy folio"
                                            style={{ color: '#0284C7', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                                          >
                                            {s.policyNumber || '91063718002'}
                                          </span>
                                        </td>

                                        {/* SIP Amount */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                                          ₹{(Number(s.sipAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>

                                        {/* SIP Frequency */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                                          {s.sipFrequency || 'Monthly'}
                                        </td>

                                        {/* SIP Start Date */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                                          {formatSipDate(s.startDate) || '20 Nov 2019'}
                                        </td>

                                        {/* SIP End Date */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
                                          {s.maturityDate ? formatSipDate(s.maturityDate) : '20 Dec 2099'}
                                        </td>

                                        {/* Deduction Date (bold blue ordinal badge) */}
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <span style={{ background: '#E0F2FE', color: '#0284C7', fontWeight: 800, fontSize: '0.8rem', padding: '3px 8px', borderRadius: 6 }}>
                                            {formatDayOrdinal(s.sipDay || 20)}
                                          </span>
                                        </td>

                                        {/* SIP Status Toggle with Remarks */}
                                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          {renderSchemeStatusToggle(s, realSchemeIndex, idx)}
                                        </td>

                                        {/* Action buttons (View Remarks, Edit & Delete) */}
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            {(s.remarks || s.deactivationReason) && (
                                              <button
                                                type="button"
                                                title="View Remarks & Status Details"
                                                onClick={() => setViewSchemeRemarksModal({ isOpen: true, scheme: s })}
                                                style={{ background: 'none', border: 'none', color: '#EA580C', cursor: 'pointer', padding: 3 }}
                                              >
                                                <MessageSquare size={15} />
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              title="Edit Scheme Details"
                                              onClick={() => {
                                                setServiceSchemeTarget(s.service || 'Mutual Funds');
                                                setEditingSchemeData(s);
                                                setEditingSchemeIndex(realSchemeIndex >= 0 ? realSchemeIndex : idx);
                                                setShowServiceSchemeModal(true);
                                              }}
                                              style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', padding: 3 }}
                                            >
                                              <Edit2 size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              title="Delete Scheme"
                                              onClick={() => handleDeleteScheme(realSchemeIndex >= 0 ? realSchemeIndex : idx)}
                                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 3 }}
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}

                                {/* Investrow Brand Cyan / Blue Total Row */}
                                {sipSchemes.length > 0 && (
                                  <tr style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderTop: '2px solid #0284C7', borderBottom: '1px solid #BAE6FD', color: '#0369A1', fontWeight: 800, fontSize: '0.84rem' }}>
                                    <td colSpan={4} style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #BAE6FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      Total Active Monthly SIP Commitment
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right', borderRight: '1px solid #BAE6FD', fontSize: '0.95rem', fontWeight: 900, color: '#0284C7' }}>
                                      ₹{totalSip.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={6} style={{ padding: '12px 14px', color: '#0369A1', fontStyle: 'italic', fontSize: '0.78rem' }}>
                                      Active Monthly Mandates ({activeSips.length} active / {sipSchemes.length} total)
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* If other schemes (Lumpsum / Insurance / FD) exist, show them clearly underneath */}
                          {otherSchemes.length > 0 && (
                            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1.5px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                                  Lumpsum & Other Investment Policies ({otherSchemes.length})
                                </span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                                {otherSchemes.map((s, oIdx) => {
                                  const realIdx = schemesList.indexOf(s);
                                  return (
                                    <div key={oIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                                          {s.service || 'Mutual Funds'} • {s.investmentType || 'Lumpsum'}
                                        </div>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                          {s.schemeName || 'Investment Plan'}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706', marginTop: 4 }}>
                                          Lumpsum: ₹{(Number(s.investmentAmount) || 0).toLocaleString('en-IN')}
                                          {s.tenureYears && <span style={{ color: '#64748B', fontWeight: 600 }}> ({s.tenureYears} Yrs)</span>}
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {renderSchemeStatusToggle(s, realIdx, oIdx)}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setServiceSchemeTarget(s.service || 'Mutual Funds');
                                            setEditingSchemeData(s);
                                            setEditingSchemeIndex(realIdx >= 0 ? realIdx : oIdx);
                                            setShowServiceSchemeModal(true);
                                          }}
                                          title="Edit Scheme Details"
                                          style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '6px 8px', color: '#0284C7', cursor: 'pointer' }}
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteScheme(realIdx >= 0 ? realIdx : oIdx)}
                                          title="Delete Scheme"
                                          style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '6px 8px', color: '#EF4444', cursor: 'pointer' }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Quick Add Another Scheme Bar */}
                          <div style={{ padding: '12px 18px', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                              Total Schemes Configured: <strong>{schemesList.length}</strong> (SIPs: <strong>{sipSchemes.length}</strong> • Lumpsum/Other: <strong>{otherSchemes.length}</strong>)
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('upload');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#FFFFFF',
                                  color: '#0284C7',
                                  border: '1px solid #BAE6FD',
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <FileSpreadsheet size={14} />
                                Upload XLSX
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('manual');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#0284C7',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={14} />
                                + Add Another SIP / Scheme
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Follow-up & Assignment Quick Status */}
                    <div style={{
                      marginTop: 20,
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)',
                      border: '1.5px solid #BBF7D0',
                      borderRadius: 18,
                      padding: '20px 24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#DCFCE7',
                          color: '#16A34A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Calendar size={22} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A' }}>
                            Follow-up & RM Assignment
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                            <span><strong>RM:</strong> {detailData.lead?.assignedTo?.name || 'Unassigned'}</span>
                            <span>•</span>
                            <span><strong>Onboarded By:</strong> {detailData.lead?.createdBy?.name || 'System / Direct'}</span>
                            {detailData.lead?.nextCallDate && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#0284C7', fontWeight: 700 }}>
                                  <strong>Next:</strong> {detailData.lead.nextCallDate.split('T')[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setClientDetailTab('followups')}
                          style={{
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontWeight: 700,
                            color: '#059669',
                            borderColor: '#86EFAC',
                            background: '#FFFFFF'
                          }}
                        >
                          View Full History ({detailData.followups?.length || 0}) →
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setFollowUpClient(detailData.lead);
                            setShowFollowUp(true);
                          }}
                          style={{
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none',
                            color: '#FFFFFF'
                          }}
                        >
                          + Log Follow-up
                        </button>
                      </div>
                    </div>

                    {/* Additional Custom Fields if any */}
                    {detailData.lead?.customFields?.length > 0 && (
                      <div style={{ marginTop: 20, background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>Additional Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {detailData.lead.customFields.map((field, idx) => (
                            <div key={idx}>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{field.label}</div>
                              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 700 }}>{field.value || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

                {/* TAB 2: KYC & DOCUMENTS */}
                {clientDetailTab === 'kyc' && (() => {
                  const onboardingDocs = (detailData.lead?.onboardingData || []).filter(d => 
                    d.value && String(d.value).startsWith('/uploads/')
                  ).map(d => ({
                    name: d.label,
                    url: d.value,
                    uploadedAt: detailData.lead?.createdAt,
                    source: 'Onboarding Upload'
                  }));
                  const adhocDocs = (detailData.lead?.documents || []).map(d => ({
                    name: d.name,
                    url: d.url,
                    uploadedAt: d.uploadedAt,
                    source: 'Manual Upload'
                  }));
                  const clientDocs = [...onboardingDocs, ...adhocDocs];
                  const panDoc = clientDocs.find(d => /pan/i.test(d.name));
                  const aadhaarDoc = clientDocs.find(d => /aadhaar|adhar/i.test(d.name));
                  const bankDoc = clientDocs.find(d => /bank|cheque|mandate/i.test(d.name));

                  return (
                    <div>
                      {/* Top KYC Verification Status Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
                        
                        {/* 1. KYC VERIFICATION */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              KYC Verification Status
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 800,
                                background: detailData.lead?.kycStatus === 'Verified' ? '#DCFCE7' : detailData.lead?.kycStatus === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                                color: detailData.lead?.kycStatus === 'Verified' ? '#15803D' : detailData.lead?.kycStatus === 'In Progress' ? '#1D4ED8' : '#B45309',
                              }}>
                                {detailData.lead?.kycStatus || (detailData.lead?.panNumber ? 'Verified' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 4 }}>Quick Change Status:</label>
                            <select
                              value={detailData.lead?.kycStatus || 'Pending'}
                              onChange={(e) => handleQuickKycChange(e.target.value)}
                              className="form-select"
                              style={{ height: 32, fontSize: '0.78rem', borderRadius: 6, padding: '2px 8px' }}
                            >
                              <option value="Verified">Verified (Compliant)</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* 2. PAN STATUS */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                PAN Card Status
                              </div>
                              {panDoc && (
                                <a href={panDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.panNumber ? (
                                <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', letterSpacing: '0.05em' }}>
                                  {detailData.lead.panNumber}
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Pending Upload
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('PAN Card')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {panDoc ? 'Re-upload PAN Card' : '+ Upload PAN Card'}
                            </button>
                          </div>
                        </div>

                        {/* 3. AADHAAR STATUS */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Aadhaar Status
                              </div>
                              {aadhaarDoc && (
                                <a href={aadhaarDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.aadhaarNumber ? (
                                <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', letterSpacing: '0.05em' }}>
                                  •••• •••• {detailData.lead.aadhaarNumber.slice(-4)}
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Pending Upload
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('Aadhaar Card')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {aadhaarDoc ? 'Re-upload Aadhaar' : '+ Upload Aadhaar Card'}
                            </button>
                          </div>
                        </div>

                        {/* 4. BANK MANDATE */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Bank Mandate
                              </div>
                              {bankDoc && (
                                <a href={bankDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textDecoration: 'none' }}>
                                  ✓ View File
                                </a>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.bankAccountNumber ? (
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                  {detailData.lead.bankName || 'Bank'} (•••• {detailData.lead.bankAccountNumber.slice(-4)})
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Not Linked
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => openUploadFor('Cancelled Cheque / Bank Mandate')}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#BBF7D0', color: '#15803D', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Upload size={13} /> {bankDoc ? 'Re-upload Cheque' : '+ Upload Cheque / Mandate'}
                            </button>
                          </div>
                        </div>

                        {/* 5. NOMINEE DECLARATION */}
                        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Nominee Declaration
                              </div>
                              {detailData.lead?.nomineeName && (
                                <span style={{ fontSize: '0.72rem', color: '#6D28D9', background: '#EDE9FE', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  ✓ Declared
                                </span>
                              )}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {detailData.lead?.nomineeName ? (
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                    {detailData.lead.nomineeName}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                                    {detailData.lead.nomineeRelation || 'Nominee'} • {detailData.lead.nomineeAllocation || 100}% Share
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#EA580C', fontSize: '0.82rem', fontWeight: 800, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                                  Declaration Missing
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClient(detailData.lead);
                                setShowModal(true);
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, borderColor: '#DDD6FE', color: '#7C3AED', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px' }}
                            >
                              <Edit size={13} /> {detailData.lead?.nomineeName ? 'Update Nominee' : '+ Declare Nominee'}
                            </button>
                          </div>
                        </div>

                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          Uploaded Client Documents ({clientDocs.length})
                        </h4>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => {
                            setDocumentsClient(detailData.lead);
                            setShowDocumentsModal(true);
                          }}
                          style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Upload size={14} /> Upload New Document
                        </button>
                      </div>

                      {clientDocs.length > 0 ? (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Document Name</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Source</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Uploaded Date</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clientDocs.map((doc, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <FileText size={16} style={{ color: '#0EA5E9' }} />
                                      {doc.name}
                                    </div>
                                  </td>
                                  <td style={{ padding: '14px 20px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#F1F5F9', color: '#475569' }}>
                                      {doc.source}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '0.825rem' }}>
                                    {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                    <a 
                                      href={doc.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#0EA5E9', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Eye size={13} /> View
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <FileText size={22} />
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Documents Uploaded</div>
                          <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>
                            Upload PAN Card, Aadhaar Card, Cancelled Cheque, or signed policy forms for this client.
                          </p>
                          <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => {
                              setDocumentsClient(detailData.lead);
                              setShowDocumentsModal(true);
                            }}
                            style={{ borderRadius: 8, color: '#0EA5E9', borderColor: '#0EA5E9' }}
                          >
                            <Upload size={14} /> Upload First Document
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 3: MUTUAL FUND / INVESTMENT (IFAPlanet Style Portfolio & SIP Details) */}
                {clientDetailTab === 'investments' && (() => {
                  const schemesList = detailData.lead?.schemes || [];
                  const sipSchemes = schemesList.filter(s => 
                    s.service === 'Mutual Funds' || s.investmentType === 'Monthly SIP' || (Number(s.sipAmount) > 0)
                  );
                  const totalSip = sipSchemes.reduce((acc, s) => acc + (Number(s.sipAmount) || 0), 0) || Number(detailData.lead?.sipAmount) || 0;
                  const totalInvestment = Number(detailData.lead?.investmentAmount) || schemesList.reduce((acc, s) => acc + (Number(s.investmentAmount) || (Number(s.sipAmount) * 24) || 0), 0) || 0;
                  const currentValuation = Number(detailData.lead?.currentValuation) || (totalInvestment > 0 ? Math.round(totalInvestment * 1.3901) : 0);
                  const gainLoss = Number(detailData.lead?.totalGainLoss) || (currentValuation - totalInvestment);
                  const absRtn = detailData.lead?.absReturn || (totalInvestment > 0 ? `${((gainLoss / totalInvestment) * 100).toFixed(2)}%` : '0.00%');
                  const cagr = detailData.lead?.cagr || '12.05%';
                  const totalDivPaid = Number(detailData.lead?.totalDivPaid) || 0;
                  const totalDivRein = Number(detailData.lead?.totalDivReinvested) || 0;

                  return (
                    <div>
                      {/* Top 6 IFAPlanet Gradient KPI Summary Cards */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
                        gap: 12, 
                        marginBottom: 20 
                      }}>
                        {/* 1: Total Investment */}
                        <div style={{
                          background: 'linear-gradient(135deg, #185A9D 0%, #2B88D9 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(27, 110, 185, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <Landmark size={15} /> Total Investment
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            ₹ {totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* 2: Valuation */}
                        <div style={{
                          background: 'linear-gradient(135deg, #C93B37 0%, #EA5C57 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(201, 59, 55, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <TrendingUp size={15} /> Valuation
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            ₹ {currentValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* 3: Total Div Paid */}
                        <div style={{
                          background: 'linear-gradient(135deg, #D46A14 0%, #F59648 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(212, 106, 20, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <IndianRupee size={15} /> Total Div Paid
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            ₹ {totalDivPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* 4: Total Div Rein. */}
                        <div style={{
                          background: 'linear-gradient(135deg, #6B388A 0%, #955AB8 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(107, 56, 138, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <Percent size={15} /> Total Div Rein.
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            ₹ {totalDivRein.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* 5: Total Gain / Loss */}
                        <div style={{
                          background: 'linear-gradient(135deg, #1C599E 0%, #3B89E0 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(28, 89, 158, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <TrendingUp size={15} /> Total Gain / Loss
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            {gainLoss >= 0 ? '+' : ''}₹ {Math.abs(gainLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* 6: Abs Rtn. / CAGR */}
                        <div style={{
                          background: 'linear-gradient(135deg, #1F7733 0%, #35A84F 100%)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(31, 119, 51, 0.22)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>
                            <Award size={15} /> Abs Rtn. / CAGR
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6, letterSpacing: '-0.02em' }}>
                            {absRtn} / {cagr}
                          </div>
                        </div>
                      </div>

                      {/* Sub-Navigation Tabs inside Investment (IFAPlanet style: Portfolio, Category, Trxns, SIPs, STPs, SWPs, Allocation, Holdings) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 16,
                        borderBottom: '1px solid #E2E8F0',
                        paddingBottom: 8,
                        overflowX: 'auto'
                      }}>
                        {[
                          { id: 'sips', label: 'SIPs', icon: CheckCircle },
                          { id: 'portfolio', label: 'Portfolio', icon: TrendingUp },
                          { id: 'category', label: 'Category', icon: BarChart2 },
                          { id: 'trxns', label: 'Trxns', icon: FileText },
                          { id: 'stps', label: 'STPs', icon: ArrowUpRight },
                          { id: 'swps', label: 'SWPs', icon: ArrowUpRight },
                          { id: 'allocation', label: 'Allocation', icon: PieChart },
                          { id: 'holdings', label: 'Holdings', icon: Landmark },
                        ].map(subTab => {
                          const isSubActive = (mfTab || 'sips') === subTab.id;
                          const SubIcon = subTab.icon;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setMfTab(subTab.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                borderRadius: 8,
                                fontSize: '0.82rem',
                                fontWeight: isSubActive ? 800 : 600,
                                border: isSubActive ? '1px solid #0EA5E9' : '1px solid #E2E8F0',
                                background: isSubActive ? '#F0F9FF' : '#FFFFFF',
                                color: isSubActive ? '#0284C7' : '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <SubIcon size={14} color={isSubActive ? '#0284C7' : '#64748B'} />
                              <span>{subTab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* When SIPs sub-tab is active */}
                      {(mfTab === 'sips' || !mfTab) && (
                        <div>
                          {/* Investrow Brand Blue Banner */}
                          <div style={{
                            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            borderRadius: '12px 12px 0 0',
                            padding: '12px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#FFFFFF',
                            flexWrap: 'wrap',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <CalendarClock size={20} style={{ color: '#E0F2FE' }} />
                              <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '0.02em' }}>
                                SIP Details As On {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                {sipSchemes.length} Active SIPs
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => addToast(`Showing all ${sipSchemes.length} SIP mandates`, 'info')}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.18)',
                                  border: '1px solid rgba(255, 255, 255, 0.35)',
                                  color: '#FFFFFF',
                                  borderRadius: 6,
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Show All SIPs
                              </button>

                              {/* PDF Export */}
                              <button 
                                onClick={() => window.print()}
                                title="Export PDF"
                                style={{
                                  background: '#EF4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <FileText size={15} />
                              </button>

                              {/* Excel Export */}
                              <button 
                                onClick={() => exportSipCsv(sipSchemes, detailData.lead?.name)}
                                title="Export Excel"
                                style={{
                                  background: '#10B981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Download size={15} />
                              </button>

                              {/* Email */}
                              <button 
                                onClick={() => {
                                  setEmailClient(detailData.lead);
                                  setShowEmailModal(true);
                                }}
                                title="Email Client SIP Schedule"
                                style={{
                                  background: '#6366F1',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Mail size={15} />
                              </button>

                              {/* WhatsApp */}
                              {detailData.lead?.phone && (
                                <a 
                                  href={`https://wa.me/91${detailData.lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${detailData.lead.name}, here is your active SIP schedule total ₹${totalSip.toLocaleString('en-IN')}/mo with Investrow.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp SIP Schedule"
                                  style={{
                                    background: '#22C55E',
                                    color: 'white',
                                    borderRadius: 6,
                                    width: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <MessageSquare size={15} />
                                </a>
                              )}

                              {/* Upload XLSX Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('upload');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: 'rgba(255, 255, 255, 0.18)',
                                  border: '1px solid rgba(255, 255, 255, 0.35)',
                                  color: '#FFFFFF',
                                  borderRadius: 6,
                                  padding: '7px 13px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Upload SIP portfolio spreadsheet (.xlsx / .csv)"
                              >
                                <FileSpreadsheet size={15} />
                                Upload XLSX
                              </button>

                              {/* Add SIP Button (Investrow Brand Orange) */}
                              <button
                                onClick={() => {
                                  setServiceSchemeTarget('Mutual Funds');
                                  setEditingSchemeData(null);
                                  setEditingSchemeIndex(null);
                                  setSchemeModalInitialTab('manual');
                                  setShowServiceSchemeModal(true);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '7px 14px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)'
                                }}
                              >
                                <Plus size={15} /> Add SIP Scheme
                              </button>
                            </div>
                          </div>

                          {/* SIP Details Table */}
                          <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflowX: 'auto', background: '#FFFFFF' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', minWidth: 950 }}>
                              <thead>
                                <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #E2E8F0' }}>
                                  <th style={{ padding: '12px 14px', width: 65, textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                      <input type="checkbox" defaultChecked readOnly style={{ accentColor: '#0284C7', cursor: 'pointer' }} />
                                      <span>Sr.</span>
                                    </div>
                                  </th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Scheme Name</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Deduction from Bank</th>
                                  <th style={{ padding: '12px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Folio Number</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'right', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>SIP Amount</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>SIP Frequency</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>SIP Start Date</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>SIP End Date</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Deduction Date</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>SIP Status</th>
                                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, width: 80 }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sipSchemes.length === 0 ? (
                                  <tr>
                                    <td colSpan={11} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                                      No active SIP schemes configured yet. Click <strong style={{ color: '#0284C7', cursor: 'pointer' }} onClick={() => { setServiceSchemeTarget('Mutual Funds'); setShowServiceSchemeModal(true); }}>+ Add SIP Scheme</strong> above to add one.
                                    </td>
                                  </tr>
                                ) : (
                                  sipSchemes.map((s, idx) => {
                                    const realSchemeIndex = schemesList.indexOf(s);
                                    return (
                                      <tr key={idx} style={{ 
                                        borderBottom: '1px solid #E2E8F0', 
                                        background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                        transition: 'background 0.15s ease'
                                      }}>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <input type="checkbox" defaultChecked style={{ accentColor: '#0284C7', cursor: 'pointer' }} />
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{idx + 1}</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                                          {s.schemeName || s.service || 'Mutual Fund Plan'}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', color: '#334155', fontWeight: 600, textTransform: 'uppercase' }}>
                                          {s.deductionBank || s.bankName || detailData.lead?.bankName || 'STATE BANK OF INDIA'}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <span 
                                            onClick={() => {
                                              if (s.policyNumber) {
                                                navigator.clipboard?.writeText(s.policyNumber);
                                                addToast(`Copied Folio: ${s.policyNumber}`, 'success');
                                              }
                                            }}
                                            title="Click to copy folio"
                                            style={{ color: '#0284C7', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}
                                          >
                                            {s.policyNumber || '91063718002'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                                          ₹{(Number(s.sipAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                                          {s.sipFrequency || s.frequency || 'Monthly'}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                                          {formatSipDate(s.startDate) || '20 Nov 2019'}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
                                          {s.maturityDate ? formatSipDate(s.maturityDate) : '20 Dec 2099'}
                                        </td>
                                        <td style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          <span style={{ background: '#E0F2FE', color: '#0284C7', fontWeight: 800, fontSize: '0.8rem', padding: '3px 8px', borderRadius: 6 }}>
                                            {formatDayOrdinal(s.sipDay || 20)}
                                          </span>
                                        </td>
                                        {/* SIP Status Toggle with Remarks */}
                                        <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                          {renderSchemeStatusToggle(s, realSchemeIndex, idx)}
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            {(s.remarks || s.deactivationReason) && (
                                              <button
                                                type="button"
                                                title="View Remarks & Status Details"
                                                onClick={() => setViewSchemeRemarksModal({ isOpen: true, scheme: s })}
                                                style={{ background: 'none', border: 'none', color: '#EA580C', cursor: 'pointer', padding: 3 }}
                                              >
                                                <MessageSquare size={15} />
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              title="Edit Scheme Details"
                                              onClick={() => {
                                                setServiceSchemeTarget(s.service || 'Mutual Funds');
                                                setEditingSchemeData(s);
                                                setEditingSchemeIndex(realSchemeIndex >= 0 ? realSchemeIndex : idx);
                                                setShowServiceSchemeModal(true);
                                              }}
                                              style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', padding: 3 }}
                                            >
                                              <Edit2 size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              title="Delete Scheme"
                                              onClick={() => handleDeleteScheme(realSchemeIndex >= 0 ? realSchemeIndex : idx)}
                                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 3 }}
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                {/* Investrow Total Summary Row */}
                                {sipSchemes.length > 0 && (
                                  <tr style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderTop: '2px solid #0284C7', borderBottom: '1px solid #BAE6FD', color: '#0369A1', fontWeight: 800, fontSize: '0.84rem' }}>
                                    <td colSpan={4} style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #BAE6FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      Total Active Monthly SIP Commitment
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right', borderRight: '1px solid #BAE6FD', fontSize: '0.95rem', fontWeight: 900, color: '#0284C7' }}>
                                      ₹{totalSip.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={6} style={{ padding: '12px 14px', color: '#0369A1', fontStyle: 'italic', fontSize: '0.78rem' }}>
                                      Active Monthly Mandates ({sipSchemes.filter(s => !['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(s.status)).length} active / {sipSchemes.length} total)
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* When Portfolio / Holdings sub-tab is active */}
                      {mfTab !== 'sips' && (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto', marginTop: 12 }}>
                          <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                              All Schemes & Investment Portfolio ({schemesList.length})
                            </div>
                            <button
                              onClick={() => {
                                setServiceSchemeTarget('Mutual Funds');
                                setEditingSchemeData(null);
                                setEditingSchemeIndex(null);
                                setShowServiceSchemeModal(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ borderRadius: 6, fontSize: '0.8rem', background: '#0284C7' }}
                            >
                              <Plus size={14} /> Add Scheme
                            </button>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.78rem' }}>
                                <th style={{ padding: '10px 14px' }}>Scheme Name</th>
                                <th style={{ padding: '10px 14px' }}>Category</th>
                                <th style={{ padding: '10px 14px' }}>Type</th>
                                <th style={{ padding: '10px 14px', textAlign: 'right' }}>SIP Amount</th>
                                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Lumpsum</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schemesList.map((s, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                                    {s.schemeName || s.service || 'Plan'}
                                  </td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: 6 }}>
                                      {s.service || 'Mutual Funds'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 14px', color: '#475569' }}>
                                    {s.investmentType}
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0284C7' }}>
                                    {s.sipAmount > 0 ? `₹${Number(s.sipAmount).toLocaleString('en-IN')}/mo` : '—'}
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#D97706' }}>
                                    {s.investmentAmount > 0 ? `₹${Number(s.investmentAmount).toLocaleString('en-IN')}` : '—'}
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 6 }}>
                                      {s.status || 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 4: OTHER SERVICES */}
                {clientDetailTab === 'services' && (() => {
                  const schemesList = detailData.lead?.schemes || [];
                  const SERVICE_ICON_MAP = {
                    'Life Insurance': Shield,
                    'Health Insurance': HeartPulse,
                    'General Insurance': Car,
                    'Mutual Funds': TrendingUp,
                    'FD & Bond': Landmark,
                    'NPS': PiggyBank,
                    'Stock Market & Demat': BarChart2,
                    'Tax Planning': Calculator,
                  };

                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Service Portfolio & Offerings</h4>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                            Active client policies, multi-product holdings, and cross-selling opportunities.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenAddScheme('Life Insurance')}
                          className="btn btn-primary btn-sm"
                          style={{
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#0284C7',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          <Plus size={15} /> Add Other Service / Policy
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', alignItems: 'start', gap: 16 }}>
                        {SERVICES.map(srv => {
                          const SrvIcon = SERVICE_ICON_MAP[srv] || Shield;
                          const matchedSchemes = schemesList
                            .map((s, idx) => ({ ...s, originalIndex: idx }))
                            .filter(s => s.service === srv || (srv === 'Mutual Funds' && (!s.service || s.service === 'Mutual Funds')));
                          const isActive = matchedSchemes.length > 0 || (srv === detailData.lead?.service);

                          return (
                            <div 
                              key={srv}
                              style={{
                                background: '#FFFFFF',
                                border: `1.5px solid ${isActive ? '#86EFAC' : '#E2E8F0'}`,
                                borderRadius: 16,
                                padding: '16px 18px',
                                boxShadow: isActive ? '0 3px 10px rgba(16, 185, 129, 0.05)' : '0 1px 3px rgba(0,0,0,0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: 205,
                                boxSizing: 'border-box'
                              }}
                            >
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: isActive ? '#DCFCE7' : '#F1F5F9',
                                    color: isActive ? '#15803D' : '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <SrvIcon size={18} />
                                  </div>
                                  <div>
                                    <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{srv}</h5>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                      {matchedSchemes.length > 0 ? `${matchedSchemes.length} Active Scheme${matchedSchemes.length > 1 ? 's' : ''}` : 'No active policies'}
                                    </span>
                                  </div>
                                </div>

                                <span style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                                  background: isActive ? '#DCFCE7' : '#F1F5F9',
                                  color: isActive ? '#15803D' : '#64748B',
                                  border: `1px solid ${isActive ? '#A7F3D0' : '#E2E8F0'}`
                                }}>
                                  {isActive ? 'ACTIVE' : 'AVAILABLE'}
                                </span>
                              </div>

                              {/* Middle Body (Consistent 84px height) */}
                              {matchedSchemes.length > 0 ? (
                                <div style={{
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 10,
                                  padding: '6px 10px',
                                  height: 84,
                                  overflowY: 'auto',
                                  marginBottom: 8,
                                  boxSizing: 'border-box',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}>
                                  {matchedSchemes.map((scheme) => (
                                    <div
                                      key={scheme.originalIndex}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '3px 0',
                                        borderBottom: '1px dashed #E2E8F0',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      <div style={{ minWidth: 0, paddingRight: 6 }}>
                                        <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                          {scheme.schemeName || 'Active Policy'}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                                          {scheme.sipAmount > 0 
                                            ? `₹${Number(scheme.sipAmount).toLocaleString('en-IN')}/mo` 
                                            : scheme.investmentAmount > 0 
                                              ? `₹${Number(scheme.investmentAmount).toLocaleString('en-IN')} ${scheme.premiumFrequency || ''}`
                                              : (scheme.provider || 'Active')}
                                          {scheme.sumAssured > 0 && ` • ₹${Number(scheme.sumAssured).toLocaleString('en-IN')} Cover`}
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenAddScheme(srv, scheme, scheme.originalIndex)}
                                          title="Edit Policy"
                                          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 4, padding: '2px 4px', cursor: 'pointer', color: '#0284C7', display: 'flex', alignItems: 'center' }}
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteScheme(scheme.originalIndex, scheme.schemeName)}
                                          title="Delete Policy"
                                          style={{ background: '#FFFFFF', border: '1px solid #FCA5A5', borderRadius: 4, padding: '2px 4px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{
                                  height: 84,
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: 8,
                                  boxSizing: 'border-box'
                                }}>
                                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                                    Explore {srv} options, policy schemes, and tailored advisory for this client.
                                  </p>
                                </div>
                              )}

                              {/* Card Action Buttons */}
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button 
                                  type="button"
                                  onClick={() => handleOpenAddScheme(srv)}
                                  style={{ 
                                    flex: 1,
                                    padding: '7px 10px',
                                    borderRadius: 8, 
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    color: isActive ? '#0284C7' : '#0EA5E9',
                                    borderColor: '#BAE6FD',
                                    background: '#F0F9FF',
                                    border: '1px solid #BAE6FD',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <Plus size={13} />
                                  {isActive ? `+ Add Policy` : `+ Add ${srv}`}
                                </button>

                                {isActive && srv === 'Mutual Funds' && (
                                  <button
                                    type="button"
                                    onClick={() => setClientDetailTab('investments')}
                                    title="View Portfolio Schemes"
                                    style={{
                                      padding: '7px 10px',
                                      borderRadius: 8,
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      color: '#475569',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    View All ({matchedSchemes.length})
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 5: TASKS */}
                {clientDetailTab === 'tasks' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Client Tasks & Follow-ups</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                          Real scheduled tasks and reminders linked to this client
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => {
                          setTasksClient(detailData.lead);
                          setShowTasksModal(true);
                        }}
                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> Add Task
                      </button>
                    </div>

                    {detailData.tasks && detailData.tasks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {detailData.tasks.map(task => {
                          const isDone = task.status === 'Completed';
                          return (
                            <div 
                              key={task._id} 
                              style={{ 
                                padding: '14px 18px', 
                                background: isDone ? '#F8FAFC' : '#FFFFFF', 
                                borderRadius: 14, 
                                border: `1px solid ${isDone ? '#E2E8F0' : '#CBD5E1'}`, 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                  width: 34, height: 34, borderRadius: 10, 
                                  background: task.type === 'Call' ? '#E0F2FE' : task.type === 'Meeting' ? '#FAF5FF' : '#F1F5F9',
                                  color: task.type === 'Call' ? '#0284C7' : task.type === 'Meeting' ? '#9333EA' : '#475569',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {task.type === 'Call' ? <Phone size={16} /> : task.type === 'Meeting' ? <Video size={16} /> : <Calendar size={16} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: isDone ? '#94A3B8' : '#0F172A', fontSize: '0.88rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                                    {task.title}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', gap: 8, marginTop: 2 }}>
                                    <span>Type: {task.type}</span>
                                    {task.assignedTo?.name && <span>• Assigned to: {task.assignedTo.name}</span>}
                                    {(task.dueDate || task.scheduledAt) && (
                                      <span>• Due: {new Date(task.dueDate || task.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span style={{ 
                                fontSize: '0.74rem', 
                                fontWeight: 700, 
                                padding: '3px 10px', 
                                borderRadius: 8,
                                background: isDone ? '#DCFCE7' : task.status === 'In Progress' ? '#E0F2FE' : '#FEF3C7',
                                color: isDone ? '#15803D' : task.status === 'In Progress' ? '#0284C7' : '#B45309',
                                border: `1px solid ${isDone ? '#A7F3D0' : task.status === 'In Progress' ? '#BAE6FD' : '#FDE68A'}`
                              }}>
                                {task.status || 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <Calendar size={22} />
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Tasks Scheduled</div>
                        <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>
                          Schedule review calls, document collection, or financial planning tasks for this client.
                        </p>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => {
                            setTasksClient(detailData.lead);
                            setShowTasksModal(true);
                          }}
                          style={{ borderRadius: 8, color: '#4F46E5', borderColor: '#4F46E5' }}
                        >
                          <Plus size={14} /> Schedule First Task
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: ACTIVITIES */}
                {clientDetailTab === 'activities' && (() => {
                  const combinedActivities = [
                    ...(detailData.followups || []).map(f => ({
                      id: `f-${f._id}`,
                      title: f.callStatus ? `Call: ${f.callStatus}` : 'Follow-up Call',
                      badge: f.response || 'Follow-up',
                      badgeColor: f.response === 'Converted' ? '#10B981' : f.response === 'Positive' ? '#0EA5E9' : '#F97316',
                      description: f.remarks || 'No detailed notes provided',
                      date: f.createdAt,
                      user: f.userId?.name || 'Staff',
                      icon: 'phone'
                    })),
                    ...(detailData.activities || []).map(a => ({
                      id: `a-${a._id}`,
                      title: a.action || 'Activity Logged',
                      badge: a.entityType || 'Client',
                      badgeColor: '#6366F1',
                      description: a.details || a.description || 'System event recorded',
                      date: a.createdAt,
                      user: a.userId?.name || 'System',
                      icon: 'activity'
                    }))
                  ].sort((a, b) => new Date(b.date) - new Date(a.date));

                  return (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Interaction & Communication History</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                          Real timeline of all follow-ups, calls, conversions, and updates recorded for this client
                        </p>
                      </div>

                      {combinedActivities.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {combinedActivities.map(item => (
                            <div 
                              key={item.id} 
                              style={{ 
                                display: 'flex', 
                                gap: 14, 
                                padding: '14px 18px', 
                                background: '#F8FAFC', 
                                borderRadius: 14, 
                                border: '1px solid #E2E8F0',
                                alignItems: 'flex-start'
                              }}
                            >
                              <div style={{ 
                                width: 34, height: 34, borderRadius: 10, 
                                background: item.icon === 'phone' ? '#ECFDF5' : '#EEF2FF', 
                                color: item.icon === 'phone' ? '#059669' : '#4F46E5', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 2
                              }}>
                                {item.icon === 'phone' ? <Phone size={16} /> : <Activity size={16} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>{item.title}</span>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                                      background: item.badgeColor ? `${item.badgeColor}15` : '#F1F5F9',
                                      color: item.badgeColor || '#475569'
                                    }}>
                                      {item.badge}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                                    {new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <p style={{ margin: '6px 0 2px', fontSize: '0.82rem', color: '#475569' }}>
                                  {item.description}
                                </p>
                                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                                  Logged by: {item.user}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1.5px dashed #CBD5E1' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Activity size={22} />
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>No Activity Logged Yet</div>
                          <p style={{ fontSize: '0.825rem', color: '#64748B', maxWidth: 420, margin: '0 auto' }}>
                            Communication logs, call entries, and client milestone updates will appear here automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 7: FAMILY TREE & CHAIN */}
                {clientDetailTab === 'family' && (
                  <FamilyTreeTab
                    client={detailData.lead}
                    onSelectClient={(id) => viewDetail(id)}
                    onClientUpdated={() => {
                      viewDetail(detailData.lead._id);
                      fetchClients(pagination.page);
                      fetchFamilyStats();
                    }}
                  />
                )}

                {/* TAB 8: FOLLOW-UP & ASSIGNMENT HISTORY */}
                {clientDetailTab === 'followups' && (
                  <FollowUpHistoryTab
                    lead={detailData.lead}
                    followups={detailData.followups}
                    activities={detailData.activities}
                    onLogFollowUp={() => {
                      setFollowUpClient(detailData.lead);
                      setShowFollowUp(true);
                    }}
                    onAssign={() => {
                      setAssignClient(detailData.lead);
                      setShowAssignModal(true);
                    }}
                    canAssign={canAssign}
                  />
                )}

              </div>
            </div>
          </div>
        )}
        {showTasksModal && tasksClient && (
          <ClientTasksModal 
            client={tasksClient} 
            onClose={() => { setShowTasksModal(false); setTasksClient(null); }} 
            onTaskUpdated={() => {
              fetchClients(pagination.page);
              if (showDetail) viewDetail(showDetail);
            }}
          />
        )}
        {showDocumentsModal && documentsClient && (
          <ClientDocumentsModal
            client={documentsClient}
            defaultDocName={documentDefaultName}
            onClose={() => { 
              setShowDocumentsModal(false); 
              setDocumentsClient(null); 
              setDocumentDefaultName('');
            }}
            onUpdate={() => {
              fetchClients(pagination.page);
              if (showDetail) viewDetail(showDetail);
            }}
          />
        )}
      </>

      {/* Create/Edit Client Modal (Stacked on top of Detail Modal) */}
      {showModal && (
        <ClientFormModal
          client={editingClient}
          users={teamUsers}
          canAssign={canAssign}
          formSettings={formSettings}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
          onSave={handleSaveClient}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => { setShowBulkUpload(false); fetchClients(pagination.page); }}
        />
      )}

      {/* Add Family Member Modal */}
      {showAddFamilyModal && familyModalClient && (
        <AddFamilyMemberModal
          isOpen={showAddFamilyModal}
          onClose={() => {
            setShowAddFamilyModal(false);
            setFamilyModalClient(null);
          }}
          currentClient={familyModalClient}
          onSuccess={() => {
            if (showDetail) viewDetail(showDetail);
            fetchClients(pagination.page);
            fetchFamilyStats();
          }}
        />
      )}

      {/* Log Follow-up Modal */}
      {showFollowUp && followUpClient && (
        <LogFollowUpModal
          lead={followUpClient}
          onClose={() => {
            setShowFollowUp(false);
            setFollowUpClient(null);
          }}
          onSave={handleLogFollowUp}
        />
      )}

      {/* Add / Edit Service Scheme Modal (Dedicated for Life Insurance, Health Insurance, FD, NPS, etc.) */}
      {showServiceSchemeModal && detailData?.lead && (
        <AddServiceSchemeModal
          isOpen={showServiceSchemeModal}
          onClose={() => {
            setShowServiceSchemeModal(false);
            setEditingSchemeData(null);
            setEditingSchemeIndex(null);
          }}
          client={detailData.lead}
          initialService={serviceSchemeTarget}
          editingScheme={editingSchemeData}
          editingIndex={editingSchemeIndex}
          initialTab={schemeModalInitialTab}
          onSuccess={() => {
            viewDetail(detailData.lead._id);
            fetchClients(pagination.page);
          }}
        />
      )}

      {/* Deactivate Scheme Modal with Remarks */}
      {deactivateSchemeModal.isOpen && deactivateSchemeModal.scheme && (
        <div 
          className="modal-backdrop" 
          onClick={() => setDeactivateSchemeModal({ isOpen: false, schemeIndex: null, scheme: null, remarks: '' })}
          style={{ zIndex: 1250 }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 520, borderRadius: 16, overflow: 'hidden', padding: 0, zIndex: 1251 }}
          >
            {/* Modal Header */}
            <div style={{
              background: '#FEF2F2',
              padding: '16px 20px',
              borderBottom: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#FEE2E2', color: '#DC2626', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#991B1B' }}>
                    Deactivate / Discontinue Scheme
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#B91C1C' }}>
                    Mark this specific scheme inactive & log discontinuation remarks
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="modal-close" 
                onClick={() => setDeactivateSchemeModal({ isOpen: false, schemeIndex: null, scheme: null, remarks: '' })}
                style={{ color: '#991B1B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Scheme Summary Card */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                  {deactivateSchemeModal.scheme.schemeName || 'Selected Scheme'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
                  {deactivateSchemeModal.scheme.policyNumber && (
                    <span>Folio: <strong style={{ color: '#0284C7' }}>{deactivateSchemeModal.scheme.policyNumber}</strong></span>
                  )}
                  {deactivateSchemeModal.scheme.sipAmount > 0 && (
                    <span>SIP: <strong style={{ color: '#0F172A' }}>₹{Number(deactivateSchemeModal.scheme.sipAmount).toLocaleString('en-IN')}/mo</strong></span>
                  )}
                  {deactivateSchemeModal.scheme.deductionBank && (
                    <span>Bank: <strong>{deactivateSchemeModal.scheme.deductionBank}</strong></span>
                  )}
                </div>
              </div>

              {/* Remarks label & Quick Preset chips */}
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Reason / Remarks for Discontinuing <span style={{ color: '#DC2626' }}>*</span>
              </label>

              {/* Quick suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {[
                  'Client stopped SIP',
                  'Bank mandate failed',
                  'Switched to another scheme',
                  'Goal achieved / Profit booking',
                  'Financial constraints',
                  'Fund underperformance',
                  'Bank account changed'
                ].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const cur = deactivateSchemeModal.remarks.trim();
                      const next = cur ? `${cur}; ${chip}` : chip;
                      setDeactivateSchemeModal(prev => ({ ...prev, remarks: next }));
                    }}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 14,
                      padding: '3px 9px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                value={deactivateSchemeModal.remarks}
                onChange={e => setDeactivateSchemeModal(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Type discontinuation remarks, client instructions, or specific reason..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.84rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ marginTop: 12, padding: '10px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, fontSize: '0.76rem', color: '#0369A1', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  This will mark only this scheme as <strong>Inactive</strong>. You can view this remark anytime and reactivate the scheme whenever the client resumes.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDeactivateSchemeModal({ isOpen: false, schemeIndex: null, scheme: null, remarks: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  const remarksToSave = deactivateSchemeModal.remarks.trim() || 'Discontinued by client';
                  handleToggleSchemeStatus(deactivateSchemeModal.schemeIndex, 'Inactive', remarksToSave);
                }}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <UserX size={14} />
                Confirm & Mark Inactive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Scheme Remarks Modal */}
      {viewSchemeRemarksModal.isOpen && viewSchemeRemarksModal.scheme && (
        <div 
          className="modal-backdrop" 
          onClick={() => setViewSchemeRemarksModal({ isOpen: false, scheme: null })}
          style={{ zIndex: 1250 }}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 500, borderRadius: 16, overflow: 'hidden', padding: 0, zIndex: 1251 }}
          >
            {/* Modal Header */}
            <div style={{
              background: '#F0F9FF',
              padding: '16px 20px',
              borderBottom: '1px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#E0F2FE', color: '#0284C7', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0C4A6E' }}>
                    Scheme Status & Remarks
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#0369A1' }}>
                    Discontinuation notes, mandate status & advisory remarks
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="modal-close" 
                onClick={() => setViewSchemeRemarksModal({ isOpen: false, scheme: null })}
                style={{ color: '#0369A1' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    {viewSchemeRemarksModal.scheme.schemeName || 'Scheme'}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: ['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(viewSchemeRemarksModal.scheme.status) ? '#FEF2F2' : '#ECFDF5',
                    color: ['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(viewSchemeRemarksModal.scheme.status) ? '#DC2626' : '#059669',
                    border: `1px solid ${['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(viewSchemeRemarksModal.scheme.status) ? '#FECACA' : '#A7F3D0'}`
                  }}>
                    {viewSchemeRemarksModal.scheme.status || 'Active'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
                  {viewSchemeRemarksModal.scheme.policyNumber && <span>Folio: <strong>{viewSchemeRemarksModal.scheme.policyNumber}</strong></span>}
                  {viewSchemeRemarksModal.scheme.sipAmount > 0 && <span>SIP: <strong>₹{Number(viewSchemeRemarksModal.scheme.sipAmount).toLocaleString('en-IN')}/mo</strong></span>}
                  {viewSchemeRemarksModal.scheme.deductionBank && <span>Bank: <strong>{viewSchemeRemarksModal.scheme.deductionBank}</strong></span>}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                  Discontinuation Remark / Notes:
                </div>
                <div style={{
                  padding: '12px 14px',
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  borderRadius: 10,
                  color: '#92400E',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {viewSchemeRemarksModal.scheme.deactivationReason || viewSchemeRemarksModal.scheme.remarks || 'No specific remarks recorded for this scheme.'}
                </div>
              </div>

              {viewSchemeRemarksModal.scheme.deactivatedAt && (
                <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} />
                  <span>Deactivated on: {new Date(viewSchemeRemarksModal.scheme.deactivatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {['Closed', 'Inactive', 'Discontinued', 'Terminated'].includes(viewSchemeRemarksModal.scheme.status) ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    const schemesList = detailData?.lead?.schemes || [];
                    const realIdx = schemesList.indexOf(viewSchemeRemarksModal.scheme);
                    setViewSchemeRemarksModal({ isOpen: false, scheme: null });
                    if (realIdx >= 0) {
                      handleToggleSchemeStatus(realIdx, 'Running');
                    }
                  }}
                  style={{
                    background: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <UserCheck size={14} />
                  Reactivate Scheme Now
                </button>
              ) : <div />}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewSchemeRemarksModal({ isOpen: false, scheme: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFormModal({ client, users, canAssign, formSettings, onClose, onSave }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    whatsappNumber: client?.whatsappNumber || client?.phone || '',
    service: client?.service || '',
    leadReference: client?.leadReference || '',
    assignedTo: client?.assignedTo?._id || client?.assignedTo || '',
    response: 'Converted',
    stage: 'Converted',
    interestedInService: client?.interestedInService || 'Yes',
    serviceTaken: client?.serviceTaken || 'Yes',
    nextCallDate: client?.nextCallDate ? client.nextCallDate.split('T')[0] : '',
    followUpDate: client?.followUpDate ? client.followUpDate.split('T')[0] : '',
    remarks: client?.remarks || '',
    callStatus: client?.callStatus || 'Received',
    location: client?.location || '',
    address: client?.address || '',
    city: client?.city || '',
    pincode: client?.pincode || '',
    dateOfBirth: client?.dateOfBirth ? (client.dateOfBirth.includes('T') ? client.dateOfBirth.split('T')[0] : client.dateOfBirth) : '',
    panNumber: client?.panNumber || '',
    aadhaarNumber: client?.aadhaarNumber || '',
    kycStatus: client?.kycStatus || 'Verified',
    riskProfile: client?.riskProfile || 'Moderate',
    familyMembers: client?.familyMembers || '',
    bankName: client?.bankName || '',
    bankAccountNumber: client?.bankAccountNumber || '',
    bankIfscCode: client?.bankIfscCode || '',
    nomineeName: client?.nomineeName || '',
    nomineeRelation: client?.nomineeRelation || '',
    nomineePhone: client?.nomineePhone || '',
    nomineeEmail: client?.nomineeEmail || '',
    nomineeAadhaar: client?.nomineeAadhaar || '',
    nomineeDob: client?.nomineeDob || '',
    nomineeAllocation: client?.nomineeAllocation !== undefined ? client.nomineeAllocation : 100,
    investmentType: client?.investmentType || (client?.sipAmount ? (client?.investmentAmount ? 'Both' : 'Monthly SIP') : (client?.investmentAmount ? 'Lumpsum' : 'Monthly SIP')),
    investmentAmount: client?.investmentAmount || '',
    sipAmount: client?.sipAmount || '',
    sipDay: client?.sipDay || (client?.sipAmount ? 10 : ''),
    schemeName: client?.schemeName || '',
    clientStatus: client?.clientStatus || 'Active',
    customFields: client?.customFields || [],
  });

  const [schemes, setSchemes] = useState(() => {
    if (client?.schemes && Array.isArray(client.schemes) && client.schemes.length > 0) {
      return client.schemes.map(s => ({
        service: s.service || client?.service || 'Mutual Funds',
        investmentType: s.investmentType || 'Monthly SIP',
        schemeName: s.schemeName || '',
        sipAmount: s.sipAmount || '',
        sipDay: s.sipDay || 10,
        investmentAmount: s.investmentAmount || '',
        tenureYears: s.tenureYears || client?.tenureYears || '',
        deductionBank: s.deductionBank || s.bankName || client?.bankName || 'STATE BANK OF INDIA',
        policyNumber: s.policyNumber || '',
        sipFrequency: s.sipFrequency || 'Monthly',
        startDate: s.startDate || '',
        maturityDate: s.maturityDate || (s.service === 'Mutual Funds' ? '2099-12-20' : ''),
        status: s.status || 'Running',
        provider: s.provider || '',
        remarks: s.remarks || '',
      }));
    }
    return [
      {
        service: client?.service || 'Mutual Funds',
        investmentType: client?.investmentType || (client?.sipAmount ? (client?.investmentAmount ? 'Both' : 'Monthly SIP') : (client?.investmentAmount ? 'Lumpsum' : 'Monthly SIP')),
        schemeName: client?.schemeName || '',
        sipAmount: client?.sipAmount || '',
        sipDay: client?.sipDay || 10,
        investmentAmount: client?.investmentAmount || '',
        tenureYears: client?.tenureYears || '',
        deductionBank: client?.bankName || 'STATE BANK OF INDIA',
        policyNumber: '',
        sipFrequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        maturityDate: '2099-12-20',
        status: 'Running',
        provider: '',
        remarks: '',
      }
    ];
  });

  const handleAddScheme = () => {
    setSchemes(prev => [
      ...prev,
      {
        service: 'Mutual Funds',
        investmentType: 'Monthly SIP',
        schemeName: '',
        sipAmount: '',
        sipDay: 10,
        investmentAmount: '',
        tenureYears: '',
      }
    ]);
  };

  const handleRemoveScheme = (index) => {
    if (schemes.length <= 1) return;
    setSchemes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSchemeChange = (index, field, value) => {
    setSchemes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const totalMonthlySip = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
      return sum + (Number(s.sipAmount) || 0);
    }
    return sum;
  }, 0);

  const totalLumpsum = schemes.reduce((sum, s) => {
    if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
      return sum + (Number(s.investmentAmount) || 0);
    }
    return sum;
  }, 0);

  const totalCombined = totalMonthlySip + totalLumpsum;

  const getFieldConfig = (name) => {
    const defaults = {
      name: { label: 'Name', required: true },
      phone: { label: 'Phone', required: true },
      email: { label: 'Email', required: false },
      service: { label: 'Service', required: true },
      location: { label: 'Location', required: false },
      leadReference: { label: 'Reference', required: false },
      remarks: { label: 'Remarks', required: false },
      address: { label: 'Address', required: false },
      city: { label: 'City', required: false },
      panNumber: { label: 'Pan Number', required: false },
      pincode: { label: 'Pincode', required: false },
      dateOfBirth: { label: 'Date Of Birth', required: false }
    };
    if (!formSettings?.defaultFields) return defaults[name] || { label: name, required: false };
    const conf = formSettings.defaultFields.find(f => f.name === name);
    return conf ? { label: conf.label, required: conf.isRequired, minLength: conf.minLength, maxLength: conf.maxLength } : (defaults[name] || { label: name, required: false });
  };
  const [newField, setNewField] = useState({ label: '', value: '', fieldType: 'Short answer', options: [] });
  const [showAddField, setShowAddField] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFormValid = () => {
    const defaultFields = ['name', 'phone', 'email', 'service', 'location', 'leadReference', 'address', 'city', 'panNumber', 'pincode', 'dateOfBirth'];
    for (const field of defaultFields) {
      const config = getFieldConfig(field);
      if (field === 'service') {
        const sVal = form.service || schemes[0]?.service || '';
        if (config.required && !String(sVal).trim()) return false;
        continue;
      }
      const val = String(form[field] || '');
      
      if (config.required && !val.trim()) return false;
      if (val.trim() && config.minLength && val.trim().length < config.minLength) return false;
      if (val.trim() && config.maxLength && val.trim().length > config.maxLength) return false;
    }

    if (formSettings?.globalCustomFields) {
      for (const gField of formSettings.globalCustomFields) {
        const customFieldValue = form.customFields.find(f => f.label === gField.label)?.value || '';
        
        if (gField.isRequired && !String(customFieldValue).trim()) return false;
        if (String(customFieldValue).trim() && gField.minLength && String(customFieldValue).trim().length < gField.minLength) return false;
        if (String(customFieldValue).trim() && gField.maxLength && String(customFieldValue).trim().length > gField.maxLength) return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      addToast('Client name is required', 'error');
      return;
    }
    if (!form.phone?.trim()) {
      addToast('Phone number is required', 'error');
      return;
    }

    if (!schemes || schemes.length === 0) {
      addToast('At least one investment scheme/product is required', 'error');
      return;
    }

    // Validate each scheme
    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const sNum = i + 1;

      if (!s.service?.trim()) {
        addToast(`Scheme #${sNum}: Please select Service / Product Category`, 'error');
        return;
      }

      if (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') {
        if (!s.sipAmount || Number(s.sipAmount) <= 0) {
          addToast(`Scheme #${sNum}: Monthly SIP Amount (₹) is mandatory`, 'error');
          return;
        }
        if (!s.sipDay || Number(s.sipDay) < 1 || Number(s.sipDay) > 31) {
          addToast(`Scheme #${sNum}: Please select a valid SIP Debit Day (1st - 31st)`, 'error');
          return;
        }
      }

      if (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') {
        if (!s.investmentAmount || Number(s.investmentAmount) <= 0) {
          addToast(`Scheme #${sNum}: Lumpsum Investment Amount (₹) is mandatory`, 'error');
          return;
        }
      }
    }

    if (!isFormValid()) return;
    setSaving(true);

    const formattedSchemes = schemes.map(s => ({
      service: s.service,
      investmentType: s.investmentType,
      schemeName: s.schemeName ? s.schemeName.trim() : '',
      sipAmount: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipAmount) || 0) : 0,
      sipDay: (s.investmentType === 'Monthly SIP' || s.investmentType === 'Both') ? (Number(s.sipDay) || 10) : null,
      investmentAmount: (s.investmentType === 'Lumpsum' || s.investmentType === 'Both') ? (Number(s.investmentAmount) || 0) : 0,
      tenureYears: s.tenureYears ? Number(s.tenureYears) : null,
      deductionBank: s.deductionBank || form.bankName || 'STATE BANK OF INDIA',
      policyNumber: s.policyNumber || '',
      sipFrequency: s.sipFrequency || 'Monthly',
      startDate: s.startDate || '',
      maturityDate: s.maturityDate || '',
      status: s.status || 'Running',
      provider: s.provider || '',
      remarks: s.remarks || '',
    }));

    const primaryService = formattedSchemes[0]?.service || form.service || 'Mutual Funds';
    const combinedSchemeNames = formattedSchemes.map(s => s.schemeName).filter(Boolean).join(', ');
    const overallInvestmentType = totalMonthlySip > 0 && totalLumpsum > 0 
      ? 'Both' 
      : totalMonthlySip > 0 
      ? 'Monthly SIP' 
      : totalLumpsum > 0 
      ? 'Lumpsum' 
      : 'None';

    const payload = { 
      ...form,
      service: primaryService,
      investmentType: overallInvestmentType,
      sipAmount: totalMonthlySip,
      sipDay: formattedSchemes[0]?.sipDay || 10,
      investmentAmount: totalLumpsum,
      schemeName: combinedSchemeNames,
      tenureYears: formattedSchemes[0]?.tenureYears || null,
      schemes: formattedSchemes,
      panNumber: form.panNumber ? form.panNumber.toUpperCase().trim() : '',
      aadhaarNumber: form.aadhaarNumber ? form.aadhaarNumber.trim() : '',
      bankName: form.bankName ? form.bankName.trim() : '',
      bankAccountNumber: form.bankAccountNumber ? form.bankAccountNumber.trim() : '',
      bankIfscCode: form.bankIfscCode ? form.bankIfscCode.toUpperCase().trim() : '',
      nomineeName: form.nomineeName ? form.nomineeName.trim() : '',
      nomineeRelation: form.nomineeRelation || '',
      nomineePhone: form.nomineePhone ? form.nomineePhone.trim() : '',
      nomineeEmail: form.nomineeEmail ? form.nomineeEmail.trim() : '',
      nomineeAadhaar: form.nomineeAadhaar ? form.nomineeAadhaar.trim() : '',
      nomineeDob: form.nomineeDob || '',
      nomineeAllocation: Number(form.nomineeAllocation) || 100,
      kycStatus: form.kycStatus || 'Verified',
      riskProfile: form.riskProfile || 'Moderate',
      clientStatus: form.clientStatus || 'Active',
      status: form.clientStatus || 'Active',
      familyMembers: form.familyMembers ? String(form.familyMembers).trim() : '',
      whatsappNumber: form.whatsappNumber ? form.whatsappNumber.trim() : '',
    };
    // Clean up customFields if any are empty
    payload.customFields = payload.customFields.filter(f => f.label.trim() && (Array.isArray(f.value) ? f.value.length > 0 : String(f.value).trim()));
    await onSave(payload);
    setSaving(false);
  };

  const addCustomField = () => {
    if (!newField.label.trim()) return;
    
    setForm({
      ...form,
      customFields: [...form.customFields, { 
        label: newField.label, 
        value: newField.value, 
        fieldType: newField.fieldType,
        options: newField.options
      }]
    });
    setNewField({ label: '', value: '', fieldType: 'Short answer', options: [] });
    setShowAddField(false);
  };

  const removeCustomField = (index) => {
    const updatedFields = [...form.customFields];
    updatedFields.splice(index, 1);
    setForm({ ...form, customFields: updatedFields });
  };

  const confName = getFieldConfig('name');
  const confPhone = getFieldConfig('phone');
  const confEmail = getFieldConfig('email');
  const confService = getFieldConfig('service');
  const confLocation = getFieldConfig('location');
  const confLeadRef = getFieldConfig('leadReference');

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column', zIndex: 1201, position: 'relative' }}>
        <div className="modal-header">
          <h3 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* SEGMENT 1: CLIENT DETAILS HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                <User size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  Client Information
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Basic profile, contact info, and product/service
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 20px', marginBottom: 20 }}>
              {formSettings?.defaultFields?.filter(f => !['panNumber', 'dateOfBirth'].includes(f.name))?.map((dField) => {
                const value = form[dField.name] || '';
                const onChange = (e) => setForm({ ...form, [dField.name]: e.target.value });
                
                return (
                  <div className="form-group" key={dField.name} style={{ gridColumn: ['location', 'leadReference', 'address'].includes(dField.name) ? 'span 2' : 'span 1' }}>
                    <label className="form-label">{dField.label} {dField.isRequired && '*'}</label>
                    {dField.name === 'service' ? (
                      <select className="form-select" value={value} onChange={onChange} required={dField.isRequired}>
                        <option value="">Select Service</option>
                        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input 
                        className="form-input" 
                        type={dField.name === 'email' ? 'email' : 'text'}
                        value={value} 
                        onChange={onChange} 
                        required={dField.isRequired}
                        minLength={dField.minLength || undefined}
                        maxLength={dField.maxLength || undefined}
                        placeholder={dField.label}
                      />
                    )}
                    {String(value).trim() && dField.minLength && String(value).trim().length < dField.minLength && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                        Minimum {dField.minLength} characters required
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SEGMENT: KYC & ADVISORY PROFILE */}
            <div style={{
              padding: '16px 18px',
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#0284C7', color: 'white', padding: 5, borderRadius: 8, display: 'flex' }}>
                  <Shield size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    KYC & Advisory Profile
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Identity verification, PAN, Aadhaar, risk rating & family details
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>PAN Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.panNumber}
                    onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase', height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Aadhaar Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.aadhaarNumber}
                    onChange={e => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dateOfBirth}
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>KYC Status</label>
                  <select
                    className="form-select"
                    value={form.kycStatus}
                    onChange={e => setForm({ ...form, kycStatus: e.target.value })}
                    style={{ height: 38, borderRadius: 8, fontWeight: 700 }}
                  >
                    <option value="Verified">Verified (Compliant)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Client Status</label>
                  <select
                    className="form-select"
                    value={form.clientStatus || 'Active'}
                    onChange={e => setForm({ ...form, clientStatus: e.target.value })}
                    style={{ 
                      height: 38, 
                      borderRadius: 8, 
                      fontWeight: 700,
                      color: form.clientStatus === 'Inactive' || form.clientStatus === 'Closed' ? '#DC2626' : '#059669',
                      background: form.clientStatus === 'Inactive' || form.clientStatus === 'Closed' ? '#FEF2F2' : '#ECFDF5',
                      borderColor: form.clientStatus === 'Inactive' || form.clientStatus === 'Closed' ? '#FECACA' : '#A7F3D0'
                    }}
                  >
                    <option value="Active">Active Client</option>
                    <option value="Inactive">Inactive / Closed</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Risk Profile</label>
                  <select
                    className="form-select"
                    value={form.riskProfile}
                    onChange={e => setForm({ ...form, riskProfile: e.target.value })}
                    style={{ height: 38, borderRadius: 8 }}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Very Aggressive">Very Aggressive</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Family Members / Dependents</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.familyMembers}
                    onChange={e => setForm({ ...form, familyMembers: e.target.value })}
                    placeholder="e.g. 4"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>WhatsApp Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.whatsappNumber}
                    onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
                    placeholder="WhatsApp No."
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* SEGMENT: BANKING & SETTLEMENT DETAILS */}
            <div style={{
              padding: '16px 18px',
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#475569', color: 'white', padding: 5, borderRadius: 8, display: 'flex' }}>
                  <IndianRupee size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    Banking & Settlement Details
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Linked bank account for SIP auto-debits, redemptions & payouts
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Bank Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Account Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankAccountNumber}
                    onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })}
                    placeholder="e.g. 50100234918231"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>IFSC Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.bankIfscCode}
                    onChange={e => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    style={{ textTransform: 'uppercase', height: 38, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* Nominee & Beneficiary Section */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '18px 20px',
              marginTop: 18,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#EDE9FE',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    Nominee & Beneficiary Details
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Folio nominee for mutual funds, insurance & demat assets
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Nominee Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.nomineeName}
                    onChange={e => setForm({ ...form, nomineeName: e.target.value })}
                    placeholder="Full name of nominee"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Relationship</label>
                  <select
                    className="form-select"
                    value={form.nomineeRelation}
                    onChange={e => setForm({ ...form, nomineeRelation: e.target.value })}
                    style={{ height: 38, borderRadius: 8, fontWeight: 600 }}
                  >
                    <option value="">Select Relation</option>
                    <option value="Spouse">Spouse (Wife / Husband)</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mobile Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.nomineePhone}
                    onChange={e => setForm({ ...form, nomineePhone: e.target.value })}
                    placeholder="10-digit mobile"
                    maxLength={15}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Email ID <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.nomineeEmail}
                    onChange={e => setForm({ ...form, nomineeEmail: e.target.value })}
                    placeholder="nominee@email.com"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Aadhaar Number <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.nomineeAadhaar}
                    onChange={e => setForm({ ...form, nomineeAadhaar: e.target.value })}
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Share / Allocation %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="form-input"
                    value={form.nomineeAllocation}
                    onChange={e => setForm({ ...form, nomineeAllocation: e.target.value })}
                    placeholder="100"
                    style={{ height: 38, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)', margin: '24px 0' }} />

            {/* Global Custom Fields */}
            {formSettings?.globalCustomFields?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                {formSettings.globalCustomFields.map((gField, idx) => {
                  const fieldIndex = form.customFields.findIndex(f => f.label === gField.label);
                  const value = fieldIndex >= 0 ? form.customFields[fieldIndex].value : '';

                  const onChange = (e) => {
                    const updated = [...form.customFields];
                    if (fieldIndex >= 0) {
                      updated[fieldIndex].value = e.target.value;
                    } else {
                      updated.push({
                        label: gField.label,
                        value: e.target.value,
                        fieldType: gField.fieldType,
                        options: gField.options,
                        isRequired: gField.isRequired
                      });
                    }
                    setForm({ ...form, customFields: updated });
                  };

                  return (
                    <div className="form-group" key={`global-${idx}`}>
                      <label className="form-label">{gField.label} {gField.isRequired && '*'}</label>
                        {gField.fieldType === 'Paragraph' ? (
                          <textarea 
                            className="form-textarea" 
                            value={value} 
                            required={gField.isRequired}
                            onChange={onChange}
                            style={{ minHeight: 100 }}
                          />
                        ) : gField.fieldType === 'Dropdown' ? (
                          <select className="form-select" value={value} required={gField.isRequired} onChange={onChange}>
                            <option value="">Select Option</option>
                            {gField.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : gField.fieldType === 'Multiple choice' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {gField.options?.map(opt => (
                              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input 
                                  type="radio" 
                                  name={`radio-${gField.label}`} 
                                  value={opt} 
                                  checked={value === opt} 
                                  onChange={onChange} 
                                  required={gField.isRequired}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : gField.fieldType === 'Checkboxes' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {gField.options?.map(opt => {
                              const checkedValues = Array.isArray(value) ? value : (value ? value.split(', ') : []);
                              const handleCheck = (e) => {
                                let newValues;
                                if (e.target.checked) {
                                  newValues = [...checkedValues, opt];
                                } else {
                                  newValues = checkedValues.filter(v => v !== opt);
                                }
                                onChange({ target: { value: newValues.join(', ') } });
                              };
                              return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    value={opt} 
                                    checked={checkedValues.includes(opt)} 
                                    onChange={handleCheck} 
                                  />
                                  {opt}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input 
                            className="form-input" 
                            type={
                              gField.fieldType === 'Number' ? 'number' : 
                              gField.fieldType === 'Date' ? 'date' : 
                              gField.fieldType === 'Time' ? 'time' : 
                              gField.fieldType === 'File upload' ? 'file' : 'text'
                            } 
                            value={gField.fieldType === 'File upload' ? undefined : value} 
                            required={gField.isRequired}
                            minLength={gField.minLength || undefined}
                            maxLength={gField.maxLength || undefined}
                            onChange={gField.fieldType === 'File upload' ? (e) => {
                                onChange({ target: { value: e.target.files[0]?.name || '' } });
                            } : onChange} 
                          />
                        )}
                        {String(value).trim() && gField.minLength && String(value).trim().length < gField.minLength && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                            Minimum {gField.minLength} characters required
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: 1, background: 'var(--border-light)', margin: '24px 0' }} />

            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '1.1rem', fontWeight: 800 }}>Additional Fields</label>
                {!showAddField && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddField(true)} style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                    <Plus size={14} /> Add more fields
                  </button>
                )}
              </div>

              {form.customFields.filter(f => !formSettings?.globalCustomFields?.some(g => g.label === f.label)).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 12 }}>
                  {form.customFields.map((field, idx) => {
                    if (formSettings?.globalCustomFields?.some(g => g.label === field.label)) return null;
                    return (
                      <div key={idx} className="form-group" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>
                            {field.label} {field.isRequired && '*'}
                          </label>
                          {!field.isRequired && (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCustomField(idx)} style={{ color: '#ef4444', padding: 4 }}>
                              <Trash2 size={14} /> Remove
                            </button>
                          )}
                        </div>
                        {field.fieldType === 'Paragraph' ? (
                          <textarea 
                            className="form-textarea" 
                            value={field.value} 
                            required={field.isRequired}
                            style={{ minHeight: 100 }}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          />
                        ) : field.fieldType === 'Dropdown' ? (
                          <select 
                            className="form-select" 
                            value={field.value} 
                            required={field.isRequired}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          >
                            <option value="">Select Option</option>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              return <option key={o} value={o}>{o}</option>;
                            })}
                          </select>
                        ) : field.fieldType === 'Multiple choice' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              return (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="radio" 
                                    name={`radio-user-client-${idx}`} 
                                    value={o} 
                                    checked={field.value === o} 
                                    onChange={e => {
                                      const updated = [...form.customFields];
                                      updated[idx].value = e.target.value;
                                      setForm({ ...form, customFields: updated });
                                    }} 
                                    required={field.isRequired}
                                  />
                                  {o}
                                </label>
                              );
                            })}
                          </div>
                        ) : field.fieldType === 'Checkboxes' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {(Array.isArray(field.options) ? field.options : field.options?.split(',') || []).map(opt => {
                              const o = typeof opt === 'string' ? opt.trim() : opt;
                              const checkedValues = Array.isArray(field.value) ? field.value : (field.value ? field.value.split(', ') : []);
                              const handleCheck = (e) => {
                                let newValues;
                                if (e.target.checked) {
                                  newValues = [...checkedValues, o];
                                } else {
                                  newValues = checkedValues.filter(v => v !== o);
                                }
                                const updated = [...form.customFields];
                                updated[idx].value = newValues.join(', ');
                                setForm({ ...form, customFields: updated });
                              };
                              return (
                                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    value={o} 
                                    checked={checkedValues.includes(o)} 
                                    onChange={handleCheck} 
                                  />
                                  {o}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input 
                            className="form-input" 
                            type={
                              field.fieldType === 'Number' ? 'number' : 
                              field.fieldType === 'Date' ? 'date' : 
                              field.fieldType === 'Time' ? 'time' : 
                              field.fieldType === 'File upload' ? 'file' : 'text'
                            } 
                            value={field.fieldType === 'File upload' ? undefined : field.value} 
                            required={field.isRequired}
                            onChange={e => {
                              const updated = [...form.customFields];
                              updated[idx].value = field.fieldType === 'File upload' ? (e.target.files[0]?.name || '') : e.target.value;
                              setForm({ ...form, customFields: updated });
                            }}
                          />
                        )}
                      </div>
                    )})}
                </div>
              )}

              {showAddField && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Field Name</label>
                      <input className="form-input" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} placeholder="e.g. Account Type" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Type</label>
                      <select className="form-select" value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value, value: '', options: [] })}>
                        <option value="Short answer">Short answer</option>
                        <option value="Paragraph">Paragraph</option>
                        <option value="Multiple choice">Multiple choice</option>
                        <option value="Checkboxes">Checkboxes</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="File upload">File upload</option>
                        <option value="Date">Date</option>
                        <option value="Time">Time</option>
                        <option value="Number">Number</option>
                      </select>
                    </div>
                  </div>

                  {['Multiple choice', 'Checkboxes', 'Dropdown'].includes(newField.fieldType) && (
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(Array.isArray(newField.options) ? newField.options : []).map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{optIdx + 1}.</div>
                            <input 
                              className="form-input" 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...newField.options];
                                newOpts[optIdx] = e.target.value;
                                setNewField({ ...newField, options: newOpts });
                              }}
                            />
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm" 
                              onClick={() => {
                                const newOpts = newField.options.filter((_, i) => i !== optIdx);
                                setNewField({ ...newField, options: newOpts });
                              }}
                              style={{ color: '#ef4444', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            const newOpts = Array.isArray(newField.options) ? [...newField.options, ''] : [''];
                            setNewField({ ...newField, options: newOpts });
                          }}
                          style={{ color: 'var(--secondary)', justifyContent: 'flex-start', padding: '4px 0', fontWeight: 600 }}
                        >
                          <Plus size={14} /> Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Value / Initial Response</label>
                      {newField.fieldType === 'Paragraph' ? (
                        <textarea className="form-textarea" value={newField.value} onChange={e => setNewField({ ...newField, value: e.target.value })} placeholder="Enter details..." />
                      ) : (
                        <input className="form-input" type={newField.fieldType === 'Number' ? 'number' : newField.fieldType === 'Date' ? 'date' : newField.fieldType === 'Time' ? 'time' : 'text'} value={newField.value} onChange={e => setNewField({ ...newField, value: e.target.value })} placeholder="Enter value..." />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAddField(false)}>Cancel</button>
                    <button type="button" className="btn btn-secondary" onClick={addCustomField}>Save Field</button>
                  </div>
                </div>
              )}
            </div>


            {canAssign && (
              <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ marginBottom: 12 }}>Assign To (Optional)</label>
                <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Assign to Me (Admin)</option>
                  {users.filter(u => u.role === 'user').map(u => (
                    <option key={u._id} value={u._id}>{u.name} (Call Executive)</option>
                  ))}
                </select>
              </div>
            )}
            {/* SEGMENT 2: FOLLOW-UP & SCHEDULE DETAILS */}
            <div style={{
              marginTop: 20,
              padding: 20,
              background: '#f0f9ff',
              borderRadius: 16,
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#0ea5e9', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                  <CalendarClock size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>
                    Follow-up Details & Scheduling
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#0284c7' }}>
                    Set next follow-up date and initial call status
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Next Follow-up Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.followUpDate} 
                    onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[
                      { label: '+1 Day', days: 1 },
                      { label: '+7 Days', days: 7 },
                      { label: '+1 Month', days: 30 },
                      { label: '+3 Months', days: 90 },
                      { label: '+6 Months', days: 180 },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + btn.days);
                          setForm({ ...form, followUpDate: d.toISOString().split('T')[0] });
                        }}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          borderRadius: 6,
                          background: 'white',
                          border: '1px solid #7dd3fc',
                          color: '#0284c7',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Call Status</label>
                  <select 
                    className="form-select" 
                    value={form.callStatus} 
                    onChange={e => setForm({ ...form, callStatus: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received / Connected</option>
                    <option value="Not Received">Not Received / Busy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Client Response</label>
                  <select 
                    className="form-select" 
                    value={form.response} 
                    onChange={e => setForm({ ...form, response: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  >
                    <option value="Converted">Converted (Active Client)</option>
                    <option value="Positive">Positive / Interested</option>
                    <option value="Pending">Pending / Evaluating</option>
                    <option value="Negative">Negative / Not Interested</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Next Call Schedule (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.nextCallDate} 
                    onChange={e => setForm({ ...form, nextCallDate: e.target.value })}
                    style={{ height: 42, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                  />
                </div>
              </div>

              {/* Financial Product & Investment Setup (Multi-Scheme Setup) */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #BBF7D0',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#16A34A', color: 'white', padding: 6, borderRadius: 8, display: 'flex' }}>
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#166534' }}>
                        Financial Product & Investment Setup *
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: '#15803D' }}>
                        Configure all active SIPs, policies, and lumpsum investments for this client
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid #86EFAC'
                  }}>
                    {schemes.length} Scheme{schemes.length > 1 ? 's' : ''} Configured
                  </span>
                </div>

                {/* Auto-Calculated Totals Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: 'white',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>
                      Total Monthly SIP
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8', marginTop: 2 }}>
                      ₹ {totalMonthlySip.toLocaleString('en-IN')}<span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>/ month</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>
                      Total Lumpsum
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FBBF24', marginTop: 2 }}>
                      ₹ {totalLumpsum.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86EFAC', fontWeight: 700 }}>
                      Total Combined Value
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ADE80', marginTop: 2 }}>
                      ₹ {totalCombined.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Scheme Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {schemes.map((scheme, index) => {
                    const isSip = scheme.investmentType === 'Monthly SIP' || scheme.investmentType === 'Both';
                    const isLump = scheme.investmentType === 'Lumpsum' || scheme.investmentType === 'Both';

                    return (
                      <div 
                        key={index}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '14px 16px',
                          position: 'relative',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: '#0284C7',
                              color: 'white',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 6
                            }}>
                              Scheme #{index + 1}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                              {scheme.schemeName || scheme.service || 'New Scheme Setup'}
                            </span>
                          </div>

                          {schemes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveScheme(index)}
                              title="Remove this scheme"
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>

                        {/* Row 1: Service / Category & Investment Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                              Service / Product Category *
                            </label>
                            <select 
                              className="form-select" 
                              value={scheme.service} 
                              onChange={e => handleSchemeChange(index, 'service', e.target.value)}
                              required
                              style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              {SERVICES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534' }}>
                              Investment Type *
                            </label>
                            <select 
                              className="form-select" 
                              value={scheme.investmentType} 
                              onChange={e => handleSchemeChange(index, 'investmentType', e.target.value)}
                              required
                              style={{ height: 38, borderRadius: 8, border: '1.5px solid #86EFAC', background: 'white', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <option value="Monthly SIP">Monthly SIP (Recurring)</option>
                              <option value="Lumpsum">Lumpsum (One-Time)</option>
                              <option value="Both">Both (Monthly SIP + Lumpsum)</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Scheme / Policy Name & Investment Horizon (Years) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                              Scheme / Policy / Plan Name
                            </label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={scheme.schemeName} 
                              onChange={e => handleSchemeChange(index, 'schemeName', e.target.value)} 
                              placeholder="e.g. Parag Parikh Flexi Cap, HDFC Top 100, LIC Tech Term"
                              style={{ height: 38, borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem' }}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Investment Horizon (How many years?)</span>
                              {scheme.tenureYears && (
                                <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 800 }}>
                                  {scheme.tenureYears} Year{Number(scheme.tenureYears) > 1 ? 's' : ''}
                                </span>
                              )}
                            </label>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input 
                                type="number" 
                                min="1"
                                max="100"
                                className="form-input" 
                                value={scheme.tenureYears || ''} 
                                onChange={e => handleSchemeChange(index, 'tenureYears', e.target.value ? Number(e.target.value) : '')} 
                                placeholder="Years"
                                style={{ height: 38, width: '75px', borderRadius: 8, background: '#F8FAFC', fontSize: '0.84rem', fontWeight: 700 }}
                              />
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {TENURE_OPTIONS.map(yr => (
                                  <button
                                    key={yr}
                                    type="button"
                                    onClick={() => handleSchemeChange(index, 'tenureYears', yr)}
                                    style={{
                                      padding: '4px 7px',
                                      borderRadius: 6,
                                      border: Number(scheme.tenureYears) === yr ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                      background: Number(scheme.tenureYears) === yr ? '#0284C7' : '#FFFFFF',
                                      color: Number(scheme.tenureYears) === yr ? 'white' : '#334155',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {yr}y
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Inputs: Monthly SIP vs Lumpsum */}
                        <div style={{ display: 'grid', gridTemplateColumns: scheme.investmentType === 'Both' ? '1fr 1fr' : '1fr', gap: 12 }}>
                          {isSip && (
                            <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 10, padding: '10px 12px' }}>
                              <div className="form-group" style={{ marginBottom: 8 }}>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369A1' }}>
                                  Monthly SIP Amount (₹) *
                                </label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  value={scheme.sipAmount} 
                                  onChange={e => handleSchemeChange(index, 'sipAmount', e.target.value)} 
                                  placeholder="e.g. 5000"
                                  required
                                  style={{ height: 38, borderRadius: 8, border: '1.5px solid #0EA5E9', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                                />
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                                  SIP Debit Day of Month *
                                </label>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                  {SIP_DAYS.map(day => (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => handleSchemeChange(index, 'sipDay', day)}
                                      style={{
                                        padding: '3px 7px',
                                        borderRadius: 6,
                                        border: Number(scheme.sipDay) === day ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                        background: Number(scheme.sipDay) === day ? '#0284C7' : '#FFFFFF',
                                        color: Number(scheme.sipDay) === day ? 'white' : '#334155',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {day}th
                                    </button>
                                  ))}
                                </div>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="31" 
                                  className="form-input" 
                                  value={scheme.sipDay || ''} 
                                  onChange={e => handleSchemeChange(index, 'sipDay', Number(e.target.value))} 
                                  placeholder="Custom day (1 - 31)"
                                  required
                                  style={{ height: 32, borderRadius: 6, fontSize: '0.78rem', background: 'white' }}
                                />
                              </div>
                            </div>
                          )}

                          {isLump && (
                            <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '10px 12px' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B45309' }}>
                                  Lumpsum Investment Amount (₹) *
                                </label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  value={scheme.investmentAmount} 
                                  onChange={e => handleSchemeChange(index, 'investmentAmount', e.target.value)} 
                                  placeholder="e.g. 100000"
                                  required
                                  style={{ height: 38, borderRadius: 8, border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: '0.95rem', background: 'white' }}
                                />
                                <span style={{ fontSize: '0.68rem', color: '#92400E', marginTop: 4, display: 'block' }}>
                                  One-time lump sum capital invested / policy premium
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Another Scheme / Policy Button */}
                <button
                  type="button"
                  onClick={handleAddScheme}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '2px dashed #16A34A',
                    background: '#FFFFFF',
                    color: '#15803D',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ECFDF5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <Plus size={16} />
                  <span>+ Add Another Scheme / Policy</span>
                </button>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#0369a1', fontWeight: 700 }}>Follow-up Remarks / Notes</label>
                <textarea 
                  className="form-textarea" 
                  value={form.remarks} 
                  onChange={e => setForm({ ...form, remarks: e.target.value })} 
                  placeholder="Record conversation details, client needs, or next action items..."
                  style={{ minHeight: 70, borderRadius: 10, border: '1px solid #7dd3fc', background: 'white' }}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !isFormValid()}>
              {saving ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




function ActionMenu({ client, onClose, onAction, canAssign, canDelete, canEdit }) {
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title">{client.name}</div>
          <div className="bottom-sheet-subtitle">{client.phone} • {client.service}</div>
        </div>
        
        <div className="bottom-sheet-grid">
          <button className="bottom-sheet-item" onClick={() => onAction('view')}>
            <Eye size={20} /> View Detail
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('followup')} style={{ color: '#0ea5e9' }}>
            <Calendar size={20} /> Log Follow-up
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('followup_history')} style={{ color: '#059669' }}>
            <Clock size={20} /> Follow-up History
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('family')} style={{ color: '#0284c7' }}>
            <Users size={20} /> Family Tree & Hierarchy
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('documents')} style={{ color: '#ef4444' }}>
            <FileText size={20} /> Documents
          </button>
          <a href={`tel:${client.phone}`} className="bottom-sheet-item" style={{ color: 'var(--success, #10b981)', textDecoration: 'none' }}>
            <Phone size={20} /> Call Now
          </a>
          <button className="bottom-sheet-item" onClick={() => onAction('schedule_call')} style={{ color: 'var(--secondary)' }}>
            <Phone size={20} /> Schedule Call
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('schedule_meet')} style={{ color: '#8b5cf6' }}>
            <Video size={20} /> Meet
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('tasks')} style={{ color: 'var(--secondary)' }}>
            <Calendar size={20} /> Tasks
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('history')}>
            <Activity size={20} /> Activity Log
          </button>
          <button className="bottom-sheet-item" onClick={() => onAction('email')}>
            <Mail size={20} /> Send Email
          </button>
          {canEdit && (
            <button className="bottom-sheet-item" onClick={() => onAction('edit')}>
              <Edit size={20} /> Edit Client
            </button>
          )}
          {client.clientStatus === 'Inactive' || client.clientStatus === 'Closed' ? (
            <button className="bottom-sheet-item" onClick={() => onAction('reactivate_client')} style={{ color: '#059669' }}>
              <UserCheck size={20} /> Reactivate Client
            </button>
          ) : (
            <button className="bottom-sheet-item" onClick={() => onAction('close_client')} style={{ color: '#dc2626' }}>
              <UserX size={20} /> Close Client (Mark Inactive)
            </button>
          )}
          {canAssign && (
            <button className="bottom-sheet-item" onClick={() => onAction('assign')}>
              <UserPlus size={20} /> Assign
            </button>
          )}
          {canDelete && (
            <button className="bottom-sheet-item danger" onClick={() => onAction('delete')}>
              <Trash2 size={20} /> Delete Client
            </button>
          )}
        </div>
        
        <button className="btn btn-outline btn-block" style={{ marginTop: 24 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function AssignmentList({ role, onSelect, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?role=${role}`)
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || []);
        setLoading(false);
      });
  }, [role]);

  if (loading) return <div className="spinner"></div>;
  if (users.length === 0) return <p className="empty-state">No {role}s available</p>;

  return users.map(u => (
    <button key={u._id} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => onSelect(u._id)}>
      <UserPlus size={16} /> {u.name} ({u.email})
    </button>
  ));
}

function AssignmentOptions({ role, currentUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`/api/users?role=${role}`)
      .then(r => r.json())
      .then(d => setUsers(d.users || []));
  }, [role]);

  return users.map(u => <option key={u._id} value={u._id}>{u.name}</option>);
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  
  const { page, pages, total } = pagination;

  // Generate intelligent sliding window of page numbers
  const getPageNumbers = () => {
    const delta = 2; // Show 2 pages on either side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 20,
      padding: '12px 18px',
      background: '#FFFFFF',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Left Info: Current Page & Total Clients */}
      <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
        Page <strong style={{ color: '#0F172A' }}>{page}</strong> of <strong style={{ color: '#0F172A' }}>{pages}</strong>
        {total ? (
          <span> • Showing <strong>{Number(total).toLocaleString('en-IN')}</strong> total clients</span>
        ) : null}
      </div>

      {/* Right Controls: Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* First Page Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title="Go to First Page"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: page <= 1 ? '#F8FAFC' : '#FFFFFF',
            color: page <= 1 ? '#94A3B8' : '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: page <= 1 ? 'not-allowed' : 'pointer'
          }}
        >
          First
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: page <= 1 ? '#F8FAFC' : '#FFFFFF',
            color: page <= 1 ? '#94A3B8' : '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: page <= 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={14} /> Prev
        </button>

        {/* Page Number Chips */}
        {pageNumbers.map((num, idx) => {
          if (num === '...') {
            return (
              <span
                key={`dots-${idx}`}
                style={{
                  padding: '4px 6px',
                  color: '#94A3B8',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  userSelect: 'none'
                }}
              >
                ...
              </span>
            );
          }

          const isCurrent = page === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              style={{
                minWidth: 34,
                height: 32,
                padding: '0 8px',
                borderRadius: 8,
                border: isCurrent ? '1.5px solid #0EA5E9' : '1px solid #CBD5E1',
                background: isCurrent ? '#0EA5E9' : '#FFFFFF',
                color: isCurrent ? '#FFFFFF' : '#334155',
                fontSize: '0.82rem',
                fontWeight: isCurrent ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {num}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: page >= pages ? '#F8FAFC' : '#FFFFFF',
            color: page >= pages ? '#94A3B8' : '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: page >= pages ? 'not-allowed' : 'pointer'
          }}
        >
          Next <ChevronRight size={14} />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(pages)}
          title="Go to Last Page"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: page >= pages ? '#F8FAFC' : '#FFFFFF',
            color: page >= pages ? '#94A3B8' : '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: page >= pages ? 'not-allowed' : 'pointer'
          }}
        >
          Last ({pages})
        </button>
      </div>
    </div>
  );
}

function LogoLoader({ message }) {
  return (
    <div className="logo-loader-backdrop">
      <div className="logo-loader-container">
        <div className="logo-loader-ring"></div>
        <div className="logo-loader-ring"></div>
        <img src="/logo.png" alt="Investrow" className="logo-loader-img" />
      </div>
      <div className="logo-loader-text">
        <div className="logo-loader-title">{message}</div>
        <div className="logo-loader-subtitle">Please wait while we process your request</div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading clients...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
}
