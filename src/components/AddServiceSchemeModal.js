'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Shield, HeartPulse, Landmark, TrendingUp, PiggyBank, 
  BarChart2, Calculator, Car, Check, Plus, AlertCircle, Calendar, IndianRupee, FileText, Info,
  Upload, FileSpreadsheet, Download, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Layers, Edit2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import * as XLSX from 'xlsx';
import { parseSipExcel, downloadSipExcelTemplate } from '@/utils/sipExcelParser';

const SERVICE_ICONS = {
  'Life Insurance': Shield,
  'Health Insurance': HeartPulse,
  'General Insurance': Car,
  'Mutual Funds': TrendingUp,
  'FD & Bond': Landmark,
  'NPS': PiggyBank,
  'Stock Market & Demat': BarChart2,
  'Tax Planning': Calculator,
};

const SERVICE_PRESETS = {
  'Life Insurance': {
    providers: ['HDFC Life', 'LIC of India', 'ICICI Prudential Life', 'SBI Life', 'Tata AIA Life', 'Max Life', 'Bajaj Allianz Life', 'Kotak Life', 'Aditya Birla Sun Life', 'Other'],
    defaultInvestmentType: 'Annual',
    schemeLabel: 'Policy / Plan Name',
    schemePlaceholder: 'e.g. HDFC Life Sanchay Plus, LIC Jeevan Labh',
    policyLabel: 'Policy Number',
    policyPlaceholder: 'e.g. POL-89213456',
    amountLabel: 'Premium Amount (₹)',
    coverLabel: 'Sum Assured / Death Benefit (₹)',
  },
  'Health Insurance': {
    providers: ['Star Health Insurance', 'Care Health Insurance', 'Niva Bupa Health', 'HDFC ERGO Health', 'ICICI Lombard', 'Aditya Birla Health', 'Bajaj Allianz', 'Other'],
    defaultInvestmentType: 'Annual',
    schemeLabel: 'Health Plan Name',
    schemePlaceholder: 'e.g. Star Comprehensive Health, Care Supreme',
    policyLabel: 'Policy Number',
    policyPlaceholder: 'e.g. HLT-5542109',
    amountLabel: 'Annual Premium (₹)',
    coverLabel: 'Sum Insured / Floater Cover (₹)',
  },
  'General Insurance': {
    providers: ['ICICI Lombard', 'Bajaj Allianz', 'Go Digit', 'Tata AIG', 'HDFC ERGO', 'New India Assurance', 'National Insurance', 'Other'],
    defaultInvestmentType: 'Annual',
    schemeLabel: 'Policy / Asset Name',
    schemePlaceholder: 'e.g. Comprehensive Motor Insurance - Creta',
    policyLabel: 'Policy / Registration No',
    policyPlaceholder: 'e.g. MOT-981240 / JH10-AB-1234',
    amountLabel: 'Premium Amount (₹)',
    coverLabel: 'IDV / Sum Insured (₹)',
  },
  'Mutual Funds': {
    providers: ['Nippon India Mutual Fund', 'SBI Mutual Fund', 'HDFC Mutual Fund', 'ICICI Prudential Mutual Fund', 'Parag Parikh Financial Advisory', 'Mirae Asset Mutual Fund', 'Kotak Mahindra Mutual Fund', 'Axis Mutual Fund', 'Tata Mutual Fund', 'Quant Mutual Fund', 'Other'],
    defaultInvestmentType: 'Monthly SIP',
    schemeLabel: 'Mutual Fund Scheme Name',
    schemePlaceholder: 'e.g. Nippon India Small Cap Fund - Growth',
    policyLabel: 'Folio Number',
    policyPlaceholder: 'e.g. 91028473/12',
    amountLabel: 'SIP Amount (₹)',
    coverLabel: 'Lumpsum Amount (₹)',
  },
  'FD & Bond': {
    providers: ['Bajaj Finance Ltd', 'Shriram Finance Ltd', 'HDFC Bank Ltd', 'State Bank of India', 'Mahindra Finance', 'Sovereign Gold Bond (SGB)', '54EC Capital Gain Bond', 'RBI Floating Rate Savings Bond', 'Other'],
    defaultInvestmentType: 'Lumpsum',
    schemeLabel: 'Deposit / Bond Scheme Name',
    schemePlaceholder: 'e.g. Bajaj Finance Cumulative Fixed Deposit',
    policyLabel: 'FDR / Application / Folio No',
    policyPlaceholder: 'e.g. FDR-8891024',
    amountLabel: 'Deposit / Investment Amount (₹)',
    coverLabel: 'Maturity Amount (₹)',
  },
  'NPS': {
    providers: ['HDFC Pension Management Co', 'SBI Pension Funds', 'ICICI Prudential Pension', 'UTI Retirement Solutions', 'Kotak Mahindra Pension', 'Aditya Birla Sun Life Pension', 'Other'],
    defaultInvestmentType: 'Monthly SIP',
    schemeLabel: 'NPS Fund / Scheme Name',
    schemePlaceholder: 'e.g. HDFC Pension Management Co. Tier 1 Scheme',
    policyLabel: 'PRAN (12-Digit Permanent Retirement Account Number)',
    policyPlaceholder: 'e.g. 110022334455',
    amountLabel: 'Monthly Contribution (₹)',
    coverLabel: 'Tier Type (e.g. Tier I / Tier II)',
  },
  'Stock Market & Demat': {
    providers: ['Motilal Oswal Financial Services', 'Angel One', 'Zerodha Broking', 'ICICI Direct', 'Groww', 'Sharekhan by BNP Paribas', 'Kotak Securities', 'Other'],
    defaultInvestmentType: 'Lumpsum',
    schemeLabel: 'Advisory Plan / Account Strategy',
    schemePlaceholder: 'e.g. Direct Equity Portfolio, Model Portfolio',
    policyLabel: 'Trading / Demat Client ID',
    policyPlaceholder: 'e.g. 1208160012345678 / MO-9812',
    amountLabel: 'Portfolio / Investment Value (₹)',
    coverLabel: 'Account / Strategy Type',
  },
  'Tax Planning': {
    providers: ['Investrow Tax Advisory', 'Section 80C Planning', 'Section 80D Mediclaim', 'NPS 80CCD(1B)', 'Capital Gains Tax Harvesting', 'Other'],
    defaultInvestmentType: 'Lumpsum',
    schemeLabel: 'Tax Strategy / Section Plan',
    schemePlaceholder: 'e.g. Section 80C ELSS & PPF Max Allocation',
    policyLabel: 'Assessment / Financial Year',
    policyPlaceholder: 'e.g. FY 2024-2025 (AY 2025-2026)',
    amountLabel: 'Planned Tax Saving Investment (₹)',
    coverLabel: 'Projected Tax Savings (₹)',
  }
};

const FREQUENCY_OPTIONS = [
  'Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Single Premium / Lumpsum'
];

const SIP_DAYS = [1, 2, 3, 5, 7, 10, 12, 14, 15, 18, 20, 21, 25, 28];

export default function AddServiceSchemeModal({
  isOpen,
  onClose,
  client,
  initialService = 'Life Insurance',
  editingScheme = null,
  editingIndex = null,
  initialTab = 'manual',
  onSuccess
}) {
  const { addToast } = useToast();

  const [entryMode, setEntryMode] = useState(initialTab || 'manual');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsingFile, setParsingFile] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [importMode, setImportMode] = useState('replace');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [service, setService] = useState(initialService || 'Life Insurance');
  const [provider, setProvider] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [investmentType, setInvestmentType] = useState('Monthly SIP');
  const [sipAmount, setSipAmount] = useState('');
  const [sipDay, setSipDay] = useState(10);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [sumAssured, setSumAssured] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState('Annual');
  const [interestRate, setInterestRate] = useState('');
  const [payoutType, setPayoutType] = useState('Cumulative');
  const [tenureYears, setTenureYears] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [status, setStatus] = useState('Running');
  const [deductionBank, setDeductionBank] = useState('');
  const [sipFrequency, setSipFrequency] = useState('Monthly');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingScheme) {
      setService(editingScheme.service || initialService || 'Mutual Funds');
      setProvider(editingScheme.provider || '');
      setCustomProvider(editingScheme.provider || '');
      setSchemeName(editingScheme.schemeName || '');
      setPolicyNumber(editingScheme.policyNumber || '');
      setInvestmentType(editingScheme.investmentType || 'Monthly SIP');
      setSipAmount(editingScheme.sipAmount ? String(editingScheme.sipAmount) : '');
      setSipDay(editingScheme.sipDay || 10);
      setInvestmentAmount(editingScheme.investmentAmount ? String(editingScheme.investmentAmount) : '');
      setSumAssured(editingScheme.sumAssured ? String(editingScheme.sumAssured) : '');
      setPremiumFrequency(editingScheme.premiumFrequency || 'Annual');
      setInterestRate(editingScheme.interestRate ? String(editingScheme.interestRate) : '');
      setPayoutType(editingScheme.payoutType || 'Cumulative');
      setTenureYears(editingScheme.tenureYears ? String(editingScheme.tenureYears) : '');
      setStartDate(editingScheme.startDate || '');
      setMaturityDate(editingScheme.maturityDate || (editingScheme.service === 'Mutual Funds' ? '2099-12-20' : ''));
      setStatus(editingScheme.status || 'Running');
      setDeductionBank(editingScheme.deductionBank || editingScheme.bankName || client?.bankName || 'STATE BANK OF INDIA');
      setSipFrequency(editingScheme.sipFrequency || 'Monthly');
      setRemarks(editingScheme.remarks || '');
    } else {
      const activeService = initialService || 'Mutual Funds';
      setService(activeService);
      setProvider('');
      setCustomProvider('');
      setSchemeName('');
      setPolicyNumber('');
      setInvestmentType(activeService === 'Mutual Funds' ? 'Monthly SIP' : 'Lumpsum');
      setSipAmount('');
      setSipDay(10);
      setInvestmentAmount('');
      setSumAssured('');
      setPremiumFrequency(activeService.includes('Insurance') ? 'Annual' : 'Monthly');
      setInterestRate('');
      setPayoutType('Cumulative');
      setTenureYears('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setMaturityDate(activeService === 'Mutual Funds' ? '2099-12-20' : '');
      setStatus('Running');
      setDeductionBank(client?.bankName || 'STATE BANK OF INDIA');
      setSipFrequency('Monthly');
      setRemarks('');
    }

    setEntryMode(initialTab || 'manual');
    setUploadedFileName('');
    setParsingFile(false);
    setParsedData(null);
    setImportMode('replace');
    setIsDragging(false);
  }, [isOpen, editingScheme, initialService, initialTab, client]);

  if (!isOpen || !client) return null;

  const preset = SERVICE_PRESETS[service] || SERVICE_PRESETS['Life Insurance'];
  const IconComponent = SERVICE_ICONS[service] || Shield;

  const isInsurance = service.includes('Insurance');
  const isMF = service === 'Mutual Funds';
  const isFD = service === 'FD & Bond';
  const isNPS = service === 'NPS';
  const isDemat = service === 'Stock Market & Demat';
  const isTax = service === 'Tax Planning';

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      addToast('Please upload a valid Excel (.xlsx, .xls) or CSV file', 'error');
      return;
    }
    setUploadedFileName(file.name);
    setParsingFile(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const result = parseSipExcel(workbook);

      if (!result.schemes || result.schemes.length === 0) {
        throw new Error('No valid SIP schemes could be detected in this sheet. Please ensure the Excel contains SIP details with fund names and amounts.');
      }

      setParsedData(result);
      addToast(`Successfully parsed ${result.schemes.length} SIP schemes from ${file.name}!`, 'success');
    } catch (err) {
      console.error('Error parsing Excel:', err);
      addToast(err.message || 'Failed to parse Excel file', 'error');
      setParsedData(null);
    } finally {
      setParsingFile(false);
    }
  };

  const handleRemovePreviewRow = (idxToRemove) => {
    if (!parsedData) return;
    const updated = parsedData.schemes.filter((_, i) => i !== idxToRemove);
    setParsedData({
      ...parsedData,
      schemes: updated
    });
    addToast('Removed scheme from preview list', 'info');
  };

  const handleImportSchemes = async () => {
    if (!parsedData || !parsedData.schemes || parsedData.schemes.length === 0) {
      addToast('No schemes to import', 'error');
      return;
    }

    setSaving(true);
    try {
      const currentSchemes = Array.isArray(client.schemes) ? [...client.schemes] : [];
      let updatedSchemes;

      if (importMode === 'replace') {
        // Keep non-Mutual-Fund schemes and replace SIP schemes with imported ones
        const nonSipSchemes = currentSchemes.filter(s => s.service !== 'Mutual Funds' && s.investmentType !== 'Monthly SIP');
        updatedSchemes = [...nonSipSchemes, ...parsedData.schemes];
      } else {
        // Append mode
        updatedSchemes = [...currentSchemes, ...parsedData.schemes];
      }

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

      const payload = {
        schemes: updatedSchemes,
        sipAmount: totalSip > 0 ? totalSip : (Number(client.sipAmount) || 0),
        investmentAmount: totalLumpsum > 0 ? totalLumpsum : (Number(client.investmentAmount) || 0),
      };

      const res = await fetch(`/api/leads/${client._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save imported schemes');
      }

      addToast(`Successfully imported ${parsedData.schemes.length} SIP schemes for ${client.name}!`, 'success');

      if (onSuccess) {
        onSuccess(data.lead || { ...client, schemes: updatedSchemes });
      }
      onClose();
    } catch (err) {
      console.error('Error importing schemes:', err);
      addToast(err.message || 'Error importing schemes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!schemeName.trim()) {
      addToast(`Please enter the ${preset.schemeLabel || 'Scheme / Policy Name'}`, 'error');
      return;
    }

    const finalProvider = (provider === 'Other' || !provider) ? (customProvider.trim() || provider) : provider;

    const newSchemeItem = {
      service,
      schemeName: schemeName.trim(),
      provider: finalProvider.trim(),
      policyNumber: policyNumber.trim(),
      deductionBank: deductionBank.trim() || client?.bankName || 'STATE BANK OF INDIA',
      sipFrequency: isMF ? (sipFrequency || 'Monthly') : premiumFrequency.trim(),
      investmentType: isMF ? investmentType : (isInsurance ? premiumFrequency : (isNPS ? 'Monthly SIP' : 'Lumpsum')),
      sipAmount: Number(sipAmount) || 0,
      sipDay: (isMF || isNPS) && sipDay ? Number(sipDay) : null,
      investmentAmount: Number(investmentAmount) || 0,
      sumAssured: Number(sumAssured) || 0,
      premiumFrequency: premiumFrequency.trim(),
      interestRate: Number(interestRate) || 0,
      payoutType: payoutType.trim(),
      tenureYears: tenureYears ? Number(tenureYears) : null,
      startDate: startDate || '',
      maturityDate: maturityDate || '',
      status: status || 'Running',
      remarks: remarks.trim()
    };

    setSaving(true);
    try {
      const currentSchemes = Array.isArray(client.schemes) ? [...client.schemes] : [];

      let updatedSchemes;
      if (editingIndex !== null && editingIndex !== undefined && editingIndex >= 0) {
        updatedSchemes = [...currentSchemes];
        updatedSchemes[editingIndex] = newSchemeItem;
      } else {
        updatedSchemes = [...currentSchemes, newSchemeItem];
      }

      // Compute updated overall SIP and investment amounts
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

      const payload = {
        schemes: updatedSchemes,
        sipAmount: totalSip > 0 ? totalSip : (Number(client.sipAmount) || 0),
        investmentAmount: totalLumpsum > 0 ? totalLumpsum : (Number(client.investmentAmount) || 0),
      };

      const res = await fetch(`/api/leads/${client._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save scheme');
      }

      addToast(
        editingIndex !== null ? `${service} scheme updated successfully` : `${service} scheme added successfully`,
        'success'
      );

      if (onSuccess) {
        onSuccess(data.lead || { ...client, schemes: updatedSchemes });
      }
      onClose();
    } catch (err) {
      console.error('Error saving scheme:', err);
      addToast(err.message || 'Error saving scheme', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          width: '100%',
          maxWidth: entryMode === 'upload' && parsedData ? 1040 : 700,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <IconComponent size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                {editingIndex !== null ? `Edit ${service}` : `Add ${service}`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                Client: <strong style={{ color: '#F8FAFC' }}>{client.name}</strong> ({client.leadId || client.clientCode || 'Client'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94A3B8',
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          
          {/* Mode Switcher: Add Manually vs Upload Excel (only when adding new scheme) */}
          {editingIndex === null && (
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: 4,
              borderRadius: 12,
              marginBottom: 20,
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 9,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: entryMode === 'manual' ? '#FFFFFF' : 'transparent',
                  color: entryMode === 'manual' ? '#0F172A' : '#64748B',
                  boxShadow: entryMode === 'manual' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Edit2 size={16} color={entryMode === 'manual' ? '#0284C7' : '#64748B'} />
                Add Manually
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode('upload');
                  setService('Mutual Funds');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 9,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: entryMode === 'upload' ? '#FFFFFF' : 'transparent',
                  color: entryMode === 'upload' ? '#0284C7' : '#64748B',
                  boxShadow: entryMode === 'upload' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileSpreadsheet size={16} color={entryMode === 'upload' ? '#0284C7' : '#64748B'} />
                Upload Excel (.xlsx / .csv)
              </button>
            </div>
          )}

          {entryMode === 'upload' ? (
            /* ============================================================== */
            /* UPLOAD EXCEL VIEW                                              */
            /* ============================================================== */
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => handleFileUpload(e.target.files?.[0])} 
                style={{ display: 'none' }} 
              />

              {!parsedData ? (
                /* File Dropzone */
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? '2.5px dashed #0284C7' : '2px dashed #94A3B8',
                      background: isDragging ? '#F0F9FF' : '#F8FAFC',
                      borderRadius: 16,
                      padding: '48px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12
                    }}
                  >
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.2)'
                    }}>
                      <Upload size={28} />
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        {parsingFile ? 'Analyzing & Parsing Spreadsheet...' : 'Upload Client SIP Portfolio Excel'}
                      </h4>
                      <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                        Drag & drop client <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong> statement here, or <span style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'underline' }}>browse files</span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.74rem', background: '#E2E8F0', color: '#334155', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        ✓ IFA-Planet Exports Supported
                      </span>
                      <span style={{ fontSize: '0.74rem', background: '#E2E8F0', color: '#334155', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        ✓ Multi-Scheme Auto Detection
                      </span>
                      <span style={{ fontSize: '0.74rem', background: '#E2E8F0', color: '#334155', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        ✓ Auto Folio & Dates Mapping
                      </span>
                    </div>
                  </div>

                  {/* Actions & Template Download */}
                  <div style={{
                    marginTop: 18,
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Info size={18} style={{ color: '#0284C7', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.8rem', color: '#0369A1' }}>
                        Need a reference template? Download the official Investrow SIP portfolio sheet format.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadSipExcelTemplate(client.name, client.pan)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#FFFFFF',
                        border: '1px solid #0284C7',
                        color: '#0284C7',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={14} />
                      Download Sample Template
                    </button>
                  </div>
                </div>
              ) : (
                /* Parsed Data Preview View */
                <div>
                  {/* Top File & Verification Banner */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileSpreadsheet size={24} style={{ color: '#0284C7' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                          {uploadedFileName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Found <strong>{parsedData.schemes.length}</strong> SIP mandates ready to import
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setParsedData(null);
                        setUploadedFileName('');
                        fileInputRef.current?.click();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={14} />
                      Change File
                    </button>
                  </div>

                  {/* Client Match Verification */}
                  {parsedData.clientInfo && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      marginBottom: 16,
                      background: (client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) ? '#F0FDF4' : '#FFFBEB',
                      border: (client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) ? (
                          <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
                        ) : (
                          <AlertTriangle size={18} style={{ color: '#D97706' }} />
                        )}
                        <span style={{ fontSize: '0.84rem', color: '#0F172A' }}>
                          Sheet indicates client: <strong>{parsedData.clientInfo.name || 'Client'}</strong> [{parsedData.clientInfo.pan || 'PAN'}]
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: (client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) ? '#DCFCE7' : '#FEF3C7',
                        color: (client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) ? '#166534' : '#92400E'
                      }}>
                        {(client.pan && parsedData.clientInfo.pan && client.pan.toUpperCase() === parsedData.clientInfo.pan.toUpperCase()) 
                          ? `✓ Verified Match for ${client.name}` 
                          : `Importing into ${client.name}`}
                      </span>
                    </div>
                  )}

                  {/* Metrics Banner */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 16
                  }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total SIP Schemes</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                        {parsedData.schemes.length} Mandates
                      </div>
                    </div>

                    <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '12px 16px', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, textTransform: 'uppercase' }}>Total Monthly Commitment</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284C7', marginTop: 2 }}>
                        ₹{parsedData.schemes.reduce((acc, s) => acc + (Number(s.sipAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Target Client Account</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                        {client.name}
                      </div>
                    </div>
                  </div>

                  {/* Import Mode Radio Switcher */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                      Import Strategy:
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', fontWeight: importMode === 'replace' ? 700 : 500, color: '#0F172A' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                        style={{ accentColor: '#0284C7' }} 
                      />
                      <span>Replace existing SIP schemes (Recommended)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer', fontWeight: importMode === 'append' ? 700 : 500, color: '#0F172A' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="append" 
                        checked={importMode === 'append'} 
                        onChange={() => setImportMode('append')}
                        style={{ accentColor: '#0284C7' }} 
                      />
                      <span>Append to existing schemes</span>
                    </label>
                  </div>

                  {/* Preview Table */}
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 20 }}>
                    <div style={{ overflowX: 'auto', maxHeight: 360 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', minWidth: 920 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 1 }}>
                            <th style={{ padding: '10px 12px', width: 45, textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>Sr.</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Scheme Name</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>Deduction Bank</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Folio Number</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'right' }}>SIP Amount</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Frequency</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Start Date</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>End Date</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Deduction</th>
                            <th style={{ padding: '10px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', width: 50 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.schemes.map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 600, color: '#64748B' }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                                {s.schemeName}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                                {s.deductionBank || client.bankName || 'STATE BANK OF INDIA'}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#0284C7', fontWeight: 800 }}>
                                {s.folioNumber || '—'}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                                ₹{Number(s.sipAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#475569' }}>
                                {s.sipFrequency || 'Monthly'}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#475569' }}>
                                {s.startDate || '—'}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>
                                {s.maturityDate || '20 Dec 2099'}
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                <span style={{ background: '#E0F2FE', color: '#0284C7', fontWeight: 800, fontSize: '0.76rem', padding: '2px 8px', borderRadius: 6 }}>
                                  {s.sipDay ? `${s.sipDay}th` : '20th'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  background: s.status === 'Closed' ? '#FEE2E2' : '#DCFCE7',
                                  color: s.status === 'Closed' ? '#991B1B' : '#166534'
                                }}>
                                  {s.status || 'Running'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePreviewRow(idx)}
                                  title="Remove from import"
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {/* Total Row */}
                          <tr style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderTop: '2px solid #0284C7', color: '#0369A1', fontWeight: 800 }}>
                            <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Total Monthly Commitment
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.92rem', fontWeight: 900, color: '#0284C7' }}>
                              ₹{parsedData.schemes.reduce((acc, s) => acc + (Number(s.sipAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td colSpan={6} style={{ padding: '10px 14px', color: '#0369A1', fontStyle: 'italic', fontSize: '0.76rem' }}>
                              {parsedData.schemes.length} Schemes to be imported
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Import Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => setParsedData(null)}
                      disabled={saving}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Clear & Upload Different File
                    </button>

                    <button
                      type="button"
                      onClick={handleImportSchemes}
                      disabled={saving || parsedData.schemes.length === 0}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                      }}
                    >
                      <Check size={16} />
                      {saving ? 'Importing Schemes...' : `Import ${parsedData.schemes.length} SIP Schemes to Portfolio`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
          
          {/* Service Selector Tabs (if creating new) */}
          {editingIndex === null && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Select Service Category
              </label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {Object.keys(SERVICE_PRESETS).map(srv => {
                  const SrvIcon = SERVICE_ICONS[srv] || Shield;
                  const isSel = service === srv;
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => {
                        setService(srv);
                        setProvider('');
                        setCustomProvider('');
                        if (srv === 'Mutual Funds') setInvestmentType('Monthly SIP');
                        else if (srv.includes('Insurance')) setPremiumFrequency('Annual');
                        else setInvestmentType('Lumpsum');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        border: isSel ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                        background: isSel ? '#F0F9FF' : '#FFFFFF',
                        color: isSel ? '#0284C7' : '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <SrvIcon size={14} />
                      {srv}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 1: Scheme & Provider Details */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '18px',
            marginBottom: 20
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} style={{ color: '#0EA5E9' }} />
              {service} Identification & Provider
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {/* Provider / Insurer / AMC */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  {isInsurance ? 'Insurance Company / Insurer' : isMF ? 'Fund House / AMC' : isFD ? 'Bank / Institution / NBFC' : isNPS ? 'Pension Fund Manager (PFM)' : isDemat ? 'Broker / Depository' : 'Institution / Provider'}
                </label>
                <select
                  value={preset.providers.includes(provider) ? provider : (provider ? 'Other' : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProvider(val);
                    if (val !== 'Other') setCustomProvider(val);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                >
                  <option value="">-- Select Provider / Company --</option>
                  {preset.providers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {provider === 'Other' && (
                  <input
                    type="text"
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value)}
                    placeholder="Enter custom provider / company name..."
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #94A3B8',
                      fontSize: '0.82rem',
                      background: '#FFFFFF'
                    }}
                  />
                )}
              </div>

              {/* Policy / Scheme Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  {preset.schemeLabel} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder={preset.schemePlaceholder}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Policy / Folio Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  {preset.policyLabel}
                </label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder={preset.policyPlaceholder}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                >
                  <option value="Running">Running (Active SIP)</option>
                  <option value="Closed">Closed</option>
                  <option value="Paused">Paused / Suspended</option>
                  <option value="Active">Active</option>
                  <option value="In Grace Period">In Grace Period</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Matured">Matured</option>
                  <option value="Lapsed">Lapsed</option>
                  <option value="Surrendered">Surrendered</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Financials & Contribution / Premium */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '18px',
            marginBottom: 20
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IndianRupee size={16} style={{ color: '#16A34A' }} />
              Financials, Premium & Terms
            </h4>

            {/* If Mutual Funds: SIP vs Lumpsum */}
            {isMF && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Investment Type
                  </label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="Monthly SIP">Monthly SIP</option>
                    <option value="Lumpsum">Lumpsum (One-Time)</option>
                    <option value="Both">Both (SIP + Lumpsum)</option>
                  </select>
                </div>

                {(investmentType === 'Monthly SIP' || investmentType === 'Both') && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Deduction from Bank
                      </label>
                      <input
                        type="text"
                        list="bank-options"
                        value={deductionBank}
                        onChange={(e) => setDeductionBank(e.target.value)}
                        placeholder="e.g. STATE BANK OF INDIA"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          background: '#FFFFFF',
                          fontWeight: 600
                        }}
                      />
                      <datalist id="bank-options">
                        <option value="STATE BANK OF INDIA" />
                        <option value="HDFC Bank" />
                        <option value="ICICI Bank" />
                        <option value="Axis Bank" />
                        <option value="Kotak Mahindra Bank" />
                        <option value="Punjab National Bank" />
                        <option value="Bank of Baroda" />
                        <option value="Canara Bank" />
                        <option value="Union Bank of India" />
                        <option value="IndusInd Bank" />
                      </datalist>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Monthly SIP Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sipAmount}
                        onChange={(e) => setSipAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          background: '#FFFFFF',
                          fontWeight: 700,
                          color: '#0284C7'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        SIP Frequency
                      </label>
                      <select
                        value={sipFrequency}
                        onChange={(e) => setSipFrequency(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          background: '#FFFFFF',
                          fontWeight: 600
                        }}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        SIP Deduction Day
                      </label>
                      <select
                        value={sipDay}
                        onChange={(e) => setSipDay(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          background: '#FFFFFF'
                        }}
                      >
                        {SIP_DAYS.map(d => (
                          <option key={d} value={d}>{d}th of every month</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {(investmentType === 'Lumpsum' || investmentType === 'Both') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Lumpsum Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="e.g. 100000"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        background: '#FFFFFF',
                        fontWeight: 700,
                        color: '#D97706'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* If Insurance (Life / Health / General) */}
            {isInsurance && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {preset.amountLabel} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#059669'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Premium Frequency
                  </label>
                  <select
                    value={premiumFrequency}
                    onChange={(e) => setPremiumFrequency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {preset.coverLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sumAssured}
                    onChange={(e) => setSumAssured(e.target.value)}
                    placeholder="e.g. 5000000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#0284C7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Policy Term / Tenure (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(e.target.value)}
                    placeholder="e.g. 15"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              </div>
            )}

            {/* If FD & Bond */}
            {isFD && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Deposit Amount (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="e.g. 100000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#059669'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g. 8.25"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#D97706'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Payout Frequency
                  </label>
                  <select
                    value={payoutType}
                    onChange={(e) => setPayoutType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="Cumulative">Cumulative (At Maturity)</option>
                    <option value="Monthly">Monthly Payout</option>
                    <option value="Quarterly">Quarterly Payout</option>
                    <option value="Annual">Annual Payout</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(e.target.value)}
                    placeholder="e.g. 3"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              </div>
            )}

            {/* If NPS */}
            {isNPS && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#0284C7'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Contribution Debit Day
                  </label>
                  <select
                    value={sipDay}
                    onChange={(e) => setSipDay(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  >
                    {SIP_DAYS.map(d => (
                      <option key={d} value={d}>{d}th of month</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Tier Type
                  </label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="Tier I (Retirement)">Tier I (Mandatory Retirement)</option>
                    <option value="Tier II (Flexible)">Tier II (Voluntary)</option>
                  </select>
                </div>
              </div>
            )}

            {/* If Demat / Stock Market or Tax Planning */}
            {(isDemat || isTax) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {preset.amountLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      color: '#059669'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {isDemat ? 'Account Strategy' : 'Financial Year'}
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={isDemat ? 'e.g. Direct Equity, PMS, Advisory' : 'e.g. FY 2024-2025'}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Important Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Start / Policy Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                    {isMF ? 'SIP End Date' : isInsurance ? 'Renewal / Maturity Date' : 'Maturity / Review Date'}
                  </label>
                  {isMF && (
                    <button
                      type="button"
                      onClick={() => setMaturityDate('2099-12-20')}
                      style={{ fontSize: '0.7rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}
                    >
                      Perpetual (2099)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF'
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Remarks & Advisory Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Advisory Remarks & Policy Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Nominee registered as spouse Sunita Sharma (100%), pre-existing illness declared, renewal reminder scheduled."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                background: '#FFFFFF',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Check size={16} />
              {saving ? 'Saving Scheme...' : editingIndex !== null ? 'Update Scheme' : `Save ${service} Scheme`}
            </button>
          </div>
        </form>
        )}
      </div>
      </div>
    </div>
  );
}
