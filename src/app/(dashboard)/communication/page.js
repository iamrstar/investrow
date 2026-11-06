'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  MessageSquare, Send, Phone, Mail, User, CheckCircle2,
  Clock, Sparkles, Copy, ExternalLink, Calendar, Bell, ArrowRight,
  IndianRupee, Cake, PartyPopper, Gift, Search, Users, Flame, RefreshCw, Check,
  Play, Pause, Square, Smartphone, HelpCircle,
  Image as ImageIcon, Paperclip, Upload, X, Eye, Download, Trash2, CheckCheck, ChevronDown
} from 'lucide-react';

const BIRTHDAY_TONES = [
  {
    id: 'warm',
    title: 'Warm & Joyous',
    text: 'Dear {name}, 🎂 Happy Birthday! May your day be filled with joy, and may this coming year bring you vibrant health, boundless happiness, and continuous success. Thank you for being a cherished part of the Investrow family! - Best wishes, {advisor} & Team Investrow'
  },
  {
    id: 'prosperity',
    title: 'Wealth & Prosperity',
    text: 'Wishing you a very Happy Birthday, {name}! 🎉 On your special day, Team Investrow wishes you compounding happiness, great health, and lasting financial prosperity. Have a wonderful celebration! - {advisor}, Investrow'
  },
  {
    id: 'short',
    title: 'Short & Sweet',
    text: 'Happy Birthday {name}! 🎂 Wishing you a fantastic year ahead filled with joy, good health, and success. Best wishes from Team Investrow!'
  }
];

const FESTIVAL_TEMPLATES = [
  {
    id: 'prosperity',
    title: 'Prosperity & Joy',
    text: 'Dear {name}, 🪔 Team Investrow wishes you and your family a very joyous and blessed {festival}! May this festive season illuminate your life with good health, happiness, and abundant financial prosperity. Warmest festive greetings, {advisor} & Team Investrow.'
  },
  {
    id: 'festive_warm',
    title: 'Warm Blessings',
    text: 'Warm greetings on the auspicious occasion of {festival} to you and your loved ones, {name}! ✨ May the festivities bring peace, unity, and flourishing growth to your home. Happy {festival}! - From {advisor} & Investrow Financial Services.'
  },
  {
    id: 'succinct',
    title: 'Short Festive Wish',
    text: 'Happy {festival} to you and your family, {name}! 🎆 May this festival bring peace, joy, and prosperity to your life. Best wishes, Team Investrow.'
  }
];

const STANDARD_TEMPLATES = [
  {
    id: 'welcome',
    title: 'Welcome Client Message',
    badge: 'Onboarding',
    color: '#0EA5E9',
    text: 'Dear {name}, welcome to Investrow Financial Services! We are committed to helping you achieve your financial goals. Your portfolio advisor is available for any questions. Thank you for placing your trust in us.',
  },
  {
    id: 'sip',
    title: 'Monthly SIP Due Reminder',
    badge: 'Investment',
    color: '#10B981',
    text: 'Hello {name}, this is a gentle reminder that your monthly SIP contribution is scheduled soon. Keeping your SIP active ensures consistent compounding and rupee cost averaging. Happy investing! - Investrow',
  },
  {
    id: 'insurance',
    title: 'Insurance Premium Due Date',
    badge: 'Protection',
    color: '#F97316',
    text: 'Dear {name}, your insurance policy renewal premium is approaching its due date. Ensure timely payment to maintain seamless coverage for you and your family. Reach out if you need assistance. - Investrow',
  },
  {
    id: 'followup',
    title: 'Portfolio Review & Follow-up',
    badge: 'Advisory',
    color: '#6366F1',
    text: 'Hi {name}, hope you are doing well! It is a great time to review your investment portfolio and align with current market trends. When would be a convenient time for a quick 10-minute catch-up? - Investrow',
  },
];

const PRESET_ATTACHMENTS = [
  {
    id: 'sip-growth',
    title: 'SIP & Wealth Compounding',
    category: 'Investment',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000&auto=format&fit=crop&q=80',
    badge: '📈 Wealth'
  },
  {
    id: 'investrow-logo',
    title: 'Investrow Welcome Banner',
    category: 'Branding',
    url: '/investrow-logo.png',
    badge: '🤝 Official'
  },
  {
    id: 'portfolio-review',
    title: 'Portfolio Review & Advisory',
    category: 'Advisory',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80',
    badge: '📊 Advisory'
  },
  {
    id: 'festive-card',
    title: 'Festive Greetings Card',
    category: 'Festive',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
    badge: '🪔 Festive'
  },
  {
    id: 'birthday-card',
    title: 'Happy Birthday Celebration',
    category: 'Birthday',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1000&auto=format&fit=crop&q=80',
    badge: '🎂 Birthday'
  }
];

export default function CommunicationPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('birthdays'); // 'birthdays' | 'festivals' | 'sips' | 'custom'

  // Greetings data
  const [greetingsLoading, setGreetingsLoading] = useState(true);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [sentWishesMap, setSentWishesMap] = useState({});

  // Birthday tab state
  const [selectedBdayTone, setSelectedBdayTone] = useState(BIRTHDAY_TONES[0]);
  const [clientCustomBdayMsgs, setClientCustomBdayMsgs] = useState({});

  // Festival tab state
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [customFestivalName, setCustomFestivalName] = useState('');
  const [selectedFestTemplate, setSelectedFestTemplate] = useState(FESTIVAL_TEMPLATES[0]);
  const [festivalCustomMsg, setFestivalCustomMsg] = useState(FESTIVAL_TEMPLATES[0].text);
  const [festivalClientSearch, setFestivalClientSearch] = useState('');
  const [festivalServiceFilter, setFestivalServiceFilter] = useState('All');
  
  // Guided Broadcast Queue state
  const [isBroadcastQueueOpen, setIsBroadcastQueueOpen] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(3);
  const [showBroadcastInfo, setShowBroadcastInfo] = useState(false);

  // SIP alerts state
  const [upcomingSips, setUpcomingSips] = useState([]);
  const [loadingSips, setLoadingSips] = useState(true);

  // Custom composer state
  const [selectedTemplate, setSelectedTemplate] = useState(STANDARD_TEMPLATES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customMessage, setCustomMessage] = useState(STANDARD_TEMPLATES[0].text);
  const [history, setHistory] = useState([
    { id: 1, name: 'Amit Kumar', phone: '9876541234', action: 'Call completed', detail: 'Discussed SIP options and fund allocation.', time: '09 Sep 10:00 AM', channel: 'Calls' },
    { id: 2, name: 'Priya Sinha', phone: '9812345678', action: 'WhatsApp sent', detail: 'Sent scheme brochure and performance fact sheet.', time: '08 Sep 04:30 PM', channel: 'WhatsApp' },
    { id: 3, name: 'Rajesh Verma', phone: '9765432109', action: 'Email sent', detail: 'Sent KYC document checklist and onboarding form.', time: '07 Sep 11:30 AM', channel: 'Email' },
  ]);

  const advisorName = user?.name || 'Your Advisor';

  // Custom composer image attachment state
  const [attachedImage, setAttachedImage] = useState(null); // { url, name, size, type, isPreset }
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [includeImageLink, setIncludeImageLink] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Quick Client Selector for Custom Composer
  const [clientSearchFilter, setClientSearchFilter] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Full-screen image lightbox modal
  const [previewModalImage, setPreviewModalImage] = useState(null); // { url, name }

  // Festival image attachment state
  const [festivalImage, setFestivalImage] = useState(null);
  const [isUploadingFestivalImage, setIsUploadingFestivalImage] = useState(false);
  const [includeFestivalImageLink, setIncludeFestivalImageLink] = useState(false);
  const [showFestPresetPicker, setShowFestPresetPicker] = useState(false);

  // Bulk Email Campaign State
  const [showEmailCampaignModal, setShowEmailCampaignModal] = useState(false);
  const [emailCampaignSubject, setEmailCampaignSubject] = useState('🪔 Happy Dhanteras & Wealth Wishes from Investrow!');
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || 'itsupport@investrow.in');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isBlastingEmails, setIsBlastingEmails] = useState(false);
  const cancelBulkEmailRef = useRef(false);
  const [emailCampaignResult, setEmailCampaignResult] = useState(null);
  const [emailStats, setEmailStats] = useState({ totalEligible: 0, sentCount: 0, remainingCount: 0, percentage: 0, loading: false });

  // Fetch live campaign counter stats
  const fetchEmailStats = async () => {
    setEmailStats(prev => ({ ...prev, loading: true }));
    try {
      const festName = customFestivalName.trim() || selectedFestival?.name || 'Diwali';
      const res = await fetch(`/api/email/bulk-greetings?serviceFilter=${festivalServiceFilter}&festivalName=${encodeURIComponent(festName)}`);
      const data = await res.json();
      if (data.success) {
        setEmailStats({
          totalEligible: data.totalEligible || 0,
          sentCount: data.sentCount || 0,
          remainingCount: data.remainingCount || 0,
          percentage: data.percentage || 0,
          loading: false
        });
      }
    } catch (e) {
      console.error('Failed to fetch email stats:', e);
      setEmailStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchEmailStats();
  }, [festivalServiceFilter, selectedFestival, customFestivalName, showEmailCampaignModal]);

  // Keep subject in sync with festival
  useEffect(() => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'Diwali';
    setEmailCampaignSubject(`🪔 Happy ${festName} & Wealth Wishes from Investrow!`);
  }, [selectedFestival, customFestivalName]);

  // Load Greetings API
  const loadGreetings = () => {
    setGreetingsLoading(true);
    fetch('/api/greetings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTodayBirthdays(data.todayBirthdays || []);
          setUpcomingBirthdays(data.upcomingBirthdays || []);
          setFestivals(data.festivals || []);
          setAllClients(data.allClients || []);
          if (data.festivals && data.festivals.length > 0) {
            setSelectedFestival(data.festivals[0]);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load greetings:', err);
      })
      .finally(() => setGreetingsLoading(false));
  };

  useEffect(() => {
    loadGreetings();

    // Load SIP alerts from dashboard API
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.stats?.upcomingSipAlerts) {
          setUpcomingSips(data.stats.upcomingSipAlerts);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSips(false));
  }, []);

  // Sync festival message when festival or template changes
  useEffect(() => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    const msg = selectedFestTemplate.text
      .replace(/{festival}/g, festName)
      .replace(/{advisor}/g, advisorName);
    setFestivalCustomMsg(msg);
  }, [selectedFestival, customFestivalName, selectedFestTemplate, advisorName]);

  // Format phone to 91XXXXXXXXXX
  const getCleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    let clean = String(phoneStr).replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return clean;
  };

  // Handle image upload to MongoDB GridFS via /api/upload
  const handleUploadImageFile = async (e, target = 'custom') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return addToast('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF)', 'error');
    }

    if (file.size > 10 * 1024 * 1024) {
      return addToast('Image size exceeds 10MB limit', 'error');
    }

    if (target === 'custom') setIsUploadingImage(true);
    if (target === 'festival') setIsUploadingFestivalImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      const imgObj = {
        url: data.url,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };

      if (target === 'custom') {
        setAttachedImage(imgObj);
        setShowPresetPicker(false);
        setShowUrlInput(false);
        addToast('Image attached! See live message preview on the right.', 'success');
      } else if (target === 'festival') {
        setFestivalImage(imgObj);
        setShowFestPresetPicker(false);
        addToast('Festive banner attached! See live preview.', 'success');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      if (target === 'custom') setIsUploadingImage(false);
      if (target === 'festival') setIsUploadingFestivalImage(false);
      e.target.value = '';
    }
  };

  // Bulletproof safe clipboard text copy that NEVER crashes with unhandled NotAllowedError
  const safeCopyText = async (text, successMsg = null) => {
    if (!text) return false;
    let copied = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (err) {
      // Permission denied or document not focused in Safari/Chrome - fallback to execCommand
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {}
    }

    if (copied && successMsg) {
      addToast(successMsg, 'success');
    }
    return copied;
  };

  // Copy image to clipboard so user can paste (Cmd+V / Ctrl+V) directly into WhatsApp Web
  const handleCopyImageToClipboard = async (imgUrl, file = null) => {
    if (!imgUrl && !file) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({
          'image/png': (async () => {
            let blob = file;
            if (!blob && imgUrl) {
              const res = await fetch(imgUrl);
              blob = await res.blob();
            }
            if (blob && blob.type === 'image/png') {
              return blob;
            }
            // Convert to PNG via canvas for clipboard compatibility
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((b) => {
                  if (b) resolve(b);
                  else reject(new Error('Canvas conversion failed'));
                }, 'image/png');
              };
              img.onerror = reject;
              img.src = imgUrl || (file ? URL.createObjectURL(file) : '');
            });
          })()
        });

        await navigator.clipboard.write([item]);
        addToast('Card image copied! In WhatsApp Web, press ⌘V (Cmd+V) to paste the picture.', 'success');
        return true;
      }
    } catch (e) {
      console.warn('Clipboard image write failed:', e);
      const fullUrl = imgUrl?.startsWith('http') ? imgUrl : (typeof window !== 'undefined' && imgUrl ? window.location.origin + imgUrl : imgUrl);
      if (fullUrl) await safeCopyText(fullUrl, 'Image link copied to clipboard!');
    }
    return false;
  };

  // Download Image utility
  const handleDownloadImage = (imgUrl, name = 'greeting.jpg') => {
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('Image downloaded! You can also drag & drop it directly into WhatsApp.', 'success');
  };

  // Helper to open WhatsApp with proper 4-byte UTF-8 emoji support (bypasses wa.me redirect emoji bug)
  const openWhatsAppChat = (phone, text) => {
    const clean = getCleanPhone(phone);
    if (!clean) return;
    // api.whatsapp.com/send preserves UTF-8 4-byte emoji encoding without the wa.me redirect corruption
    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodedText}`;
    window.open(url, '_blank');
  };

  // Smart Share: Attempts native device share on mobile (iOS/Android)
  // or copies image to clipboard and opens WhatsApp Web on Mac Safari & desktop
  const shareImageWithText = async ({ imageUrl, imageName, text, phone, file: preloadedFile }) => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 1. Try Native Web Share ONLY on mobile devices (iOS / Android) where WhatsApp is a registered app target
    if (isMobile && typeof navigator !== 'undefined' && (preloadedFile || imageUrl)) {
      try {
        let fileToShare = preloadedFile;
        if (!fileToShare && imageUrl) {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.includes('png') ? 'png' : 'jpg';
          fileToShare = new File([blob], imageName || `greeting.${ext}`, { type: mimeType });
        }

        if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            files: [fileToShare],
            text: text,
            title: 'Investrow Greeting'
          });
          addToast('Shared image with message to WhatsApp!', 'success');
          return true;
        }
      } catch (err) {
        if (err.name === 'AbortError') return true; // User cancelled share dialog
        console.warn('Native share not available or failed:', err);
      }
    }

    // 2. Desktop Mac Safari / Chrome with WhatsApp Web:
    // Copy real image to clipboard so user can press ⌘V (or Ctrl+V) into WhatsApp Web
    if (imageUrl || preloadedFile) {
      await handleCopyImageToClipboard(imageUrl, preloadedFile);
    }

    // Open WhatsApp Web with text using api.whatsapp.com/send to protect emojis
    openWhatsAppChat(phone, text);

    addToast('Opened WhatsApp Web! In the chat, press ⌘V (Cmd+V) to paste the picture.', 'success');
    return false;
  };

  // Send Custom Message via WhatsApp
  const handleSendCustomMessage = async () => {
    if (!recipientPhone.trim()) {
      return addToast('Please enter recipient phone / WhatsApp number', 'error');
    }

    const clean = getCleanPhone(recipientPhone);
    if (!clean) {
      return addToast('Invalid phone number format', 'error');
    }

    let finalMsg = customMessage;
    if (attachedImage && includeImageLink) {
      const fullUrl = attachedImage.url.startsWith('http')
        ? attachedImage.url
        : (typeof window !== 'undefined' ? window.location.origin + attachedImage.url : attachedImage.url);
      finalMsg = `${customMessage}\n\n📎 Attached Image: ${fullUrl}`;
    }

    if (attachedImage?.url) {
      await shareImageWithText({
        imageUrl: attachedImage.url,
        imageName: attachedImage.name,
        text: finalMsg,
        phone: recipientPhone,
        file: attachedImage.file
      });
    } else {
      openWhatsAppChat(recipientPhone, finalMsg);
      await safeCopyText(finalMsg);
      addToast('Opened in WhatsApp! (Message text & emojis copied to clipboard)', 'success');
    }

    setHistory(prev => [
      {
        id: Date.now(),
        name: recipientName || 'Client',
        phone: recipientPhone,
        action: attachedImage ? 'WhatsApp sent with Image' : 'WhatsApp sent',
        detail: customMessage.slice(0, 70) + '...',
        imageUrl: attachedImage ? attachedImage.url : null,
        imageName: attachedImage ? attachedImage.name : null,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);
  };

  // 1-Click Send Birthday Wish
  const handleSendBirthdayWish = async (client) => {
    const phone = getCleanPhone(client.whatsappNumber || client.phone);
    if (!phone) {
      return addToast(`${client.name} has no phone/WhatsApp number on file`, 'error');
    }

    const customText = clientCustomBdayMsgs[client._id];
    let msgToSend = customText;
    if (!msgToSend) {
      msgToSend = selectedBdayTone.text
        .replace(/{name}/g, client.name)
        .replace(/{advisor}/g, client.assignedTo || advisorName);
    }

    openWhatsAppChat(phone, msgToSend);
    await safeCopyText(msgToSend);

    setSentWishesMap(prev => ({ ...prev, [client._id]: true }));
    addToast(`Opened WhatsApp birthday greeting for ${client.name}! (Text & emojis copied to clipboard)`, 'success');

    // Log to ActivityLog
    try {
      await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client._id,
          clientName: client.name,
          type: 'birthday',
          message: msgToSend,
          channel: 'WhatsApp'
        })
      });
    } catch (e) {
      console.error(e);
    }

    setHistory(prev => [
      {
        id: Date.now(),
        name: client.name,
        phone: client.phone,
        action: 'Birthday Wish sent',
        detail: `Sent birthday greeting on WhatsApp: "${msgToSend.slice(0, 60)}..."`,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);
  };

  // Copy Birthday Wish
  const handleCopyBirthdayWish = async (client) => {
    const customText = clientCustomBdayMsgs[client._id];
    let msgToSend = customText;
    if (!msgToSend) {
      msgToSend = selectedBdayTone.text
        .replace(/{name}/g, client.name)
        .replace(/{advisor}/g, client.assignedTo || advisorName);
    }
    await safeCopyText(msgToSend, `Copied birthday wish for ${client.name}!`);
  };

  // 1-Click Send Festival Wish to an Individual Client
  const handleSendFestivalWish = async (client) => {
    const rawPhone = client.whatsappNumber || client.phone;
    const phone = getCleanPhone(rawPhone);
    if (!phone) {
      return addToast(`${client.name} has no phone/WhatsApp number on record`, 'error');
    }

    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    let msgToSend = festivalCustomMsg
      .replace(/{name}/g, client.name)
      .replace(/{festival}/g, festName)
      .replace(/{advisor}/g, client.assignedTo || advisorName);

    if (festivalImage && includeFestivalImageLink) {
      const fullUrl = festivalImage.url.startsWith('http')
        ? festivalImage.url
        : (typeof window !== 'undefined' ? window.location.origin + festivalImage.url : festivalImage.url);
      msgToSend = `${msgToSend}\n\n🪔 Festive Greetings Card: ${fullUrl}`;
    }

    if (festivalImage?.url) {
      await shareImageWithText({
        imageUrl: festivalImage.url,
        imageName: festivalImage.name,
        text: msgToSend,
        phone: rawPhone,
        file: festivalImage.file
      });
    } else {
      openWhatsAppChat(phone, msgToSend);
      await safeCopyText(msgToSend);
      addToast(`Opened WhatsApp festival greeting for ${client.name}! (Text & emojis copied)`, 'success');
    }

    setSentWishesMap(prev => ({ ...prev, [`fest-${client._id}`]: true }));

    try {
      await fetch('/api/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client._id,
          clientName: client.name,
          type: 'festival',
          festivalName: festName,
          message: msgToSend,
          channel: 'WhatsApp'
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Copy All Personalized Festival Messages for Bulk / Broadcast List
  const handleCopyAllFestivalMessages = async () => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) {
      return addToast('No clients match current filter', 'error');
    }

    const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
    const festImgUrl = festivalImage && includeFestivalImageLink
      ? (festivalImage.url.startsWith('http') ? festivalImage.url : (typeof window !== 'undefined' ? window.location.origin + festivalImage.url : festivalImage.url))
      : null;

    const compiled = filtered.map(c => {
      let msg = festivalCustomMsg
        .replace(/{name}/g, c.name)
        .replace(/{festival}/g, festName)
        .replace(/{advisor}/g, c.assignedTo || advisorName);
      if (festImgUrl) {
        msg = `${msg}\n\n🪔 Festive Greetings Card: ${festImgUrl}`;
      }
      return `--------------------------------------------------\nCLIENT: ${c.name} (${c.whatsappNumber || c.phone || 'No Phone'})\nMESSAGE:\n${msg}\n`;
    }).join('\n');

    await safeCopyText(compiled, `Copied ${filtered.length} personalized festival greetings to clipboard!`);
  };

  // Filter clients for festival broadcast
  const getFilteredFestivalClients = () => {
    return allClients.filter(c => {
      if (festivalServiceFilter !== 'All' && c.service !== festivalServiceFilter) {
        return false;
      }
      if (festivalClientSearch.trim()) {
        const q = festivalClientSearch.toLowerCase();
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      }
      return true;
    });
  };

  // Copy all clean phone numbers for WhatsApp Broadcast
  const handleCopyAllPhoneNumbers = async () => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) return addToast('No clients found', 'error');
    const numbers = filtered.map(c => getCleanPhone(c.whatsappNumber || c.phone)).filter(Boolean);
    const unique = [...new Set(numbers)];
    await safeCopyText(unique.join(', '), `Copied ${unique.length} phone numbers for WhatsApp Broadcast!`);
  };

  // Export Festival Broadcast CSV formatted specifically for AiSensy / WATI / Meta Cloud API
  const handleExportAiSensyCsv = () => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) return addToast('No clients found to export', 'error');

    const festName = customFestivalName.trim() || selectedFestival?.name || 'Festival';
    const headers = ['Name', 'Phone', 'Email', 'Service', 'GreetingMessage'];
    const rows = filtered.map(c => {
      let cleanPhone = getCleanPhone(c.whatsappNumber || c.phone);
      let msg = festivalCustomMsg
        .replace(/{name}/g, c.name)
        .replace(/{festival}/g, festName)
        .replace(/{advisor}/g, c.assignedTo || advisorName);
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${cleanPhone || ''}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.service || '').replace(/"/g, '""')}"`,
        `"${msg.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Investrow_AiSensy_Broadcast_${filtered.length}_Clients.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filtered.length} clients for AiSensy Broadcast!`, 'success');
  };

  // 1. Send Single Test Email for Festive Campaign Preview
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      return addToast('Please enter a valid email address for testing', 'error');
    }
    setIsSendingTestEmail(true);
    try {
      const festName = customFestivalName.trim() || selectedFestival?.name || 'Dhanteras';
      const festBanner = festivalImage?.url
        ? (festivalImage.url.startsWith('http') ? festivalImage.url : (typeof window !== 'undefined' ? window.location.origin + festivalImage.url : festivalImage.url))
        : null;

      const res = await fetch('/api/email/bulk-greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testEmailAddress.trim(),
          subject: emailCampaignSubject,
          festivalName: festName,
          bannerUrl: festBanner,
          customMessage: festivalCustomMsg
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Test email failed');
      addToast(`Test email successfully delivered to ${testEmailAddress}! Check your inbox.`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to send test email', 'error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // 2a. Send EXACTLY 1 Single Batch (up to 100 clients)
  const handleSendSingleBatch = async () => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'Dhanteras';
    const festBanner = festivalImage?.url
      ? (festivalImage.url.startsWith('http') ? festivalImage.url : (typeof window !== 'undefined' ? window.location.origin + festivalImage.url : festivalImage.url))
      : null;

    setIsBlastingEmails(true);
    setEmailCampaignResult({
      status: 'sending',
      message: 'Broadcasting next batch of 100 emails over single persistent connection...'
    });

    try {
      const res = await fetch('/api/email/bulk-greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailCampaignSubject,
          festivalName: festName,
          bannerUrl: festBanner,
          customMessage: festivalCustomMsg,
          serviceFilter: festivalServiceFilter,
          limit: 100
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch failed');
      }

      setEmailCampaignResult({
        status: 'done',
        sent: data.sentCount,
        failed: data.failedCount,
        remaining: data.remainingClients,
        total: data.totalTargeted,
        message: data.message
      });
      addToast(data.message, 'success');
    } catch (err) {
      console.error(err);
      setEmailCampaignResult({
        status: 'error',
        message: err.message
      });
      addToast(err.message || 'Batch failed', 'error');
    } finally {
      setIsBlastingEmails(false);
    }
  };

  // 2b. Launch Bulk Festive Email Campaign in Batches with Live Progress
  const handleLaunchBulkEmailCampaign = async () => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'Dhanteras';
    const festBanner = festivalImage?.url
      ? (festivalImage.url.startsWith('http') ? festivalImage.url : (typeof window !== 'undefined' ? window.location.origin + festivalImage.url : festivalImage.url))
      : null;

    if (!confirm(`Launch bulk festive email broadcast in smooth batches to all remaining converted clients?`)) {
      return;
    }

    cancelBulkEmailRef.current = false;
    setIsBlastingEmails(true);

    let totalSentAcc = 0;
    let totalFailedAcc = 0;
    let batchNumber = 1;
    const BATCH_SIZE = 100;

    setEmailCampaignResult({
      status: 'sending',
      sent: 0,
      message: 'Starting automated batch broadcast...'
    });

    try {
      while (!cancelBulkEmailRef.current) {
        setEmailCampaignResult({
          status: 'sending',
          sent: totalSentAcc,
          failed: totalFailedAcc,
          message: `Sending Batch #${batchNumber} (${totalSentAcc} delivered so far)...`
        });

        const res = await fetch('/api/email/bulk-greetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: emailCampaignSubject,
            festivalName: festName,
            bannerUrl: festBanner,
            customMessage: festivalCustomMsg,
            serviceFilter: festivalServiceFilter,
            limit: BATCH_SIZE
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.rateLimited) {
            setEmailCampaignResult({
              status: 'error',
              sent: totalSentAcc,
              message: `Google SMTP rate limit reached. Paused at ${totalSentAcc} sent. You can resume anytime.`
            });
            addToast(`Google SMTP paused. ${totalSentAcc} delivered successfully.`, 'info');
            break;
          }
          throw new Error(data.error || 'Batch failed');
        }

        // If no clients were targeted or none sent, all clients are done
        if (data.totalTargeted === 0 || data.sentCount === 0) {
          setEmailCampaignResult({
            status: 'done',
            sent: totalSentAcc,
            failed: totalFailedAcc,
            message: totalSentAcc > 0
              ? `Campaign finished! Delivered ${totalSentAcc} festive emails.`
              : 'All converted clients have already received the festive email greeting today!'
          });
          addToast(totalSentAcc > 0 ? `Delivered ${totalSentAcc} emails!` : 'All clients already received today.', 'success');
          break;
        }

        totalSentAcc += data.sentCount;
        totalFailedAcc += data.failedCount;

        setEmailCampaignResult({
          status: 'sending',
          sent: totalSentAcc,
          failed: totalFailedAcc,
          message: `Batch #${batchNumber} complete! (${totalSentAcc} delivered so far)`
        });

        // If this batch returned fewer than BATCH_SIZE, it reached the end of the client list
        if (data.totalTargeted < BATCH_SIZE) {
          setEmailCampaignResult({
            status: 'done',
            sent: totalSentAcc,
            failed: totalFailedAcc,
            message: `Campaign complete! Successfully delivered ${totalSentAcc} festive emails.`
          });
          addToast(`Campaign complete! Delivered ${totalSentAcc} emails.`, 'success');
          break;
        }

        if (cancelBulkEmailRef.current) {
          setEmailCampaignResult({
            status: 'done',
            sent: totalSentAcc,
            failed: totalFailedAcc,
            message: `Broadcast paused by user. Delivered ${totalSentAcc} emails so far.`
          });
          addToast(`Broadcast paused. Delivered ${totalSentAcc} emails.`, 'info');
          break;
        }

        batchNumber++;
        // 2-second breathing gap between batches
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(err);
      setEmailCampaignResult({
        status: 'error',
        sent: totalSentAcc,
        message: `${err.message || 'Campaign stopped'}. (${totalSentAcc} delivered so far)`
      });
      addToast(err.message || 'Failed to complete campaign', 'error');
    } finally {
      setIsBlastingEmails(false);
    }
  };

  const handleStopBulkEmailCampaign = () => {
    cancelBulkEmailRef.current = true;
    setIsBlastingEmails(false);
    addToast('Stopping email campaign...', 'info');
  };

  // Reset Campaign for Fresh Start to Everyone
  const handleResetCampaign = async () => {
    const festName = customFestivalName.trim() || selectedFestival?.name || 'Diwali';
    if (!confirm(`Are you sure you want to start a FRESH campaign for ${festName}? This will reset the queue so ALL converted clients can receive this new greeting from the beginning.`)) {
      return;
    }

    try {
      const res = await fetch('/api/email/bulk-greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          festivalName: festName
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset campaign');
      }

      setEmailCampaignResult(null);
      await fetchEmailStats();
      addToast(`Campaign reset! Ready for a fresh start to all clients for ${festName}.`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to reset campaign', 'error');
    }
  };

  // Guided & Auto WhatsApp broadcast queue
  const startBroadcastQueue = (auto = false) => {
    const filtered = getFilteredFestivalClients();
    if (filtered.length === 0) {
      return addToast('No clients to send to', 'error');
    }
    setBroadcastIndex(0);
    setIsAutoSending(auto);
    setAutoCountdown(3);
    setIsBroadcastQueueOpen(true);
  };

  const handleSendCurrentQueueClient = () => {
    const filtered = getFilteredFestivalClients();
    const current = filtered[broadcastIndex];
    if (current) {
      handleSendFestivalWish(current);
      if (broadcastIndex + 1 < filtered.length) {
        setBroadcastIndex(prev => prev + 1);
        setAutoCountdown(3);
      } else {
        setIsAutoSending(false);
        setIsBroadcastQueueOpen(false);
        addToast('All clients in broadcast queue processed!', 'success');
      }
    }
  };

  // Automated hands-free dispatch runner
  useEffect(() => {
    let timer;
    if (isBroadcastQueueOpen && isAutoSending) {
      if (autoCountdown > 0) {
        timer = setTimeout(() => {
          setAutoCountdown(prev => prev - 1);
        }, 1000);
      } else {
        const filtered = getFilteredFestivalClients();
        const current = filtered[broadcastIndex];
        if (current) {
          handleSendFestivalWish(current);
          if (broadcastIndex + 1 < filtered.length) {
            setBroadcastIndex(prev => prev + 1);
            setAutoCountdown(3);
          } else {
            setIsAutoSending(false);
            setIsBroadcastQueueOpen(false);
            addToast('All clients in auto-dispatch completed!', 'success');
          }
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isBroadcastQueueOpen, isAutoSending, autoCountdown, broadcastIndex]);

  // Handle direct SIP reminder send
  const handleDirectWhatsAppSip = async (sip) => {
    const raw = sip.whatsappNumber || sip.phone || '';
    const finalPhone = getCleanPhone(raw);
    if (!finalPhone) {
      return addToast('Client has no phone number on record', 'error');
    }
    const msg = `Dear ${sip.name}, this is a gentle reminder from Investrow that your monthly SIP of ${sip.formattedAmount} for ${sip.schemeName || sip.service} is scheduled for debit on the ${sip.sipDay}th (${sip.dueStatus}). Kindly ensure sufficient balance in your linked bank account for seamless investment. Happy Investing! - Investrow`;
    openWhatsAppChat(finalPhone, msg);
    await safeCopyText(msg);

    setHistory(prev => [
      {
        id: Date.now(),
        name: sip.name,
        phone: raw,
        action: 'WhatsApp sent',
        detail: `Sent 5-day prior SIP balance reminder for ${sip.schemeName || 'Mutual Fund'} (${sip.formattedAmount}).`,
        time: 'Just now',
        channel: 'WhatsApp'
      },
      ...prev
    ]);
    addToast(`Opened WhatsApp reminder for ${sip.name}!`, 'success');
  };

  return (
    <div style={{ padding: '24px 32px', background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#E0F2FE', color: '#0284C7', padding: 8, borderRadius: 12 }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Communication & Greetings Hub
              </h1>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '2px 0 0 0' }}>
                1-Click Birthday celebrations, festival broadcasts to all clients, and SIP alerts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadGreetings}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: '#FFFFFF' }}
        >
          <RefreshCw size={14} className={greetingsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Top Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 24,
        background: '#FFFFFF',
        padding: '6px',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Tab 1: Birthdays */}
        <button
          type="button"
          onClick={() => setActiveTab('birthdays')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'birthdays' ? 'linear-gradient(135deg, #F59E0B, #EA580C)' : 'transparent',
            color: activeTab === 'birthdays' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Cake size={18} />
          Birthday Wisher
          {todayBirthdays.length > 0 ? (
            <span style={{
              background: activeTab === 'birthdays' ? '#FFFFFF' : '#EF4444',
              color: activeTab === 'birthdays' ? '#EA580C' : '#FFFFFF',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 900
            }}>
              {todayBirthdays.length} TODAY
            </span>
          ) : (
            <span style={{
              background: activeTab === 'birthdays' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              color: activeTab === 'birthdays' ? '#FFFFFF' : '#64748B',
              borderRadius: 8,
              padding: '2px 6px',
              fontSize: '0.7rem'
            }}>
              {upcomingBirthdays.length} Upcoming
            </span>
          )}
        </button>

        {/* Tab 2: Festival Greetings */}
        <button
          type="button"
          onClick={() => setActiveTab('festivals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'festivals' ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : 'transparent',
            color: activeTab === 'festivals' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={18} />
          Festival Broadcast (All Clients)
          {selectedFestival && (
            <span style={{
              background: activeTab === 'festivals' ? 'rgba(255,255,255,0.25)' : '#EDE9FE',
              color: activeTab === 'festivals' ? '#FFFFFF' : '#6D28D9',
              borderRadius: 8,
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {selectedFestival.name}
            </span>
          )}
        </button>

        {/* Tab 3: SIP Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab('sips')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'sips' ? '#0284C7' : 'transparent',
            color: activeTab === 'sips' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Bell size={18} />
          SIP Due Reminders
          {upcomingSips.length > 0 && (
            <span style={{
              background: activeTab === 'sips' ? '#FFFFFF' : '#E0F2FE',
              color: activeTab === 'sips' ? '#0284C7' : '#0369A1',
              borderRadius: 8,
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {upcomingSips.length}
            </span>
          )}
        </button>

        {/* Tab 4: Custom Message & History */}
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'custom' ? '#0F172A' : 'transparent',
            color: activeTab === 'custom' ? '#FFFFFF' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Send size={18} />
          Custom Composer & Logs
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 🎂 BIRTHDAY WISHER */}
      {/* ========================================================================= */}
      {activeTab === 'birthdays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Today's Birthday Section */}
          <div style={{
            background: todayBirthdays.length > 0
              ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)'
              : '#FFFFFF',
            borderRadius: 22,
            padding: '24px 28px',
            border: todayBirthdays.length > 0 ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#EA580C',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                }}>
                  <PartyPopper size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#78350F', margin: 0 }}>
                      Today&apos;s Client Birthdays
                    </h2>
                    <span style={{
                      background: todayBirthdays.length > 0 ? '#DC2626' : '#64748B',
                      color: '#FFFFFF',
                      borderRadius: 10,
                      padding: '2px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 900
                    }}>
                      {todayBirthdays.length} Celebrating Today
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#92400E' }}>
                    Send personalized 1-click WhatsApp birthday greetings directly from this tab
                  </p>
                </div>
              </div>

              {/* Tone Quick Selector */}
              {todayBirthdays.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: '4px 8px', borderRadius: 12, border: '1px solid #FCD34D' }}>
                  <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: 800 }}>Greeting Tone:</span>
                  {BIRTHDAY_TONES.map(tone => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedBdayTone(tone)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: selectedBdayTone.id === tone.id ? '1.5px solid #EA580C' : '1px solid #E2E8F0',
                        background: selectedBdayTone.id === tone.id ? '#FFEDD5' : '#FFFFFF',
                        color: selectedBdayTone.id === tone.id ? '#9A3412' : '#64748B',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {tone.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List of Clients Celebrating Today */}
            {greetingsLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#B45309', fontWeight: 600 }}>
                Checking client birthdays...
              </div>
            ) : todayBirthdays.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
                {todayBirthdays.map(client => {
                  const currentCustomText = clientCustomBdayMsgs[client._id] ?? selectedBdayTone.text
                    .replace(/{name}/g, client.name)
                    .replace(/{advisor}/g, client.assignedTo || advisorName);

                  const isSent = sentWishesMap[client._id];

                  return (
                    <div
                      key={client._id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 18,
                        padding: '20px',
                        border: '1.5px solid #FCD34D',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Client Header in Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 46,
                              height: 46,
                              borderRadius: 14,
                              background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 900
                            }}>
                              🎂
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                                  {client.name}
                                </h3>
                                {isSent && (
                                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Check size={11} /> Sent
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span>{client.phone}</span>
                                <span>•</span>
                                <span>{client.service}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              background: '#FEF3C7',
                              color: '#B45309',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: '0.76rem',
                              fontWeight: 900,
                              display: 'inline-block'
                            }}>
                              {client.turningAge ? `Turning ${client.turningAge} Today!` : 'Birthday Today!'}
                            </span>
                          </div>
                        </div>

                        {/* Editable Message Box */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                            Personalized Greeting Message:
                          </label>
                          <textarea
                            rows={3}
                            value={currentCustomText}
                            onChange={(e) => setClientCustomBdayMsgs(prev => ({ ...prev, [client._id]: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 10,
                              border: '1px solid #E2E8F0',
                              fontSize: '0.82rem',
                              lineHeight: '1.4',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              background: '#F8FAFC'
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <button
                          type="button"
                          onClick={() => handleSendBirthdayWish(client)}
                          style={{
                            flex: 1,
                            background: isSent ? '#059669' : 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 14px',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <Send size={15} />
                          {isSent ? 'Send Again on WhatsApp' : 'Wish on WhatsApp (1-Click)'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyBirthdayWish(client)}
                          title="Copy Message"
                          className="btn btn-ghost btn-sm"
                          style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 10px', color: '#475569' }}
                        >
                          <Copy size={15} />
                        </button>

                        {client.email && (
                          <a
                            href={`mailto:${client.email}?subject=${encodeURIComponent(`Happy Birthday from Investrow Financial Services!`)}&body=${encodeURIComponent(currentCustomText)}`}
                            title="Send Email"
                            className="btn btn-ghost btn-sm"
                            style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 10px', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            <Mail size={15} />
                          </a>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '30px 20px',
                textAlign: 'center',
                border: '1.5px dashed #CBD5E1'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>☀️</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  No Client Birthdays Today
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: 460, margin: '0 auto' }}>
                  There are no client birthdays scheduled for today. Check upcoming birthdays below to prepare your early greetings.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Birthdays in next 14 Days */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 26px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} style={{ color: '#0EA5E9' }} />
                  Upcoming Birthdays (Next 14 Days)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Clients turning a year older over the next two weeks
                </p>
              </div>
              <span style={{ background: '#F0F9FF', color: '#0284C7', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>
                {upcomingBirthdays.length} Upcoming
              </span>
            </div>

            {upcomingBirthdays.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {upcomingBirthdays.map(client => (
                  <div
                    key={client._id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                          {client.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                        {client.formattedBirthDate} • {client.turningAge ? `Turning ${client.turningAge}` : 'Birthday'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, marginTop: 4 }}>
                        {client.diffDays === 1 ? 'Tomorrow!' : `In ${client.diffDays} days`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendBirthdayWish(client)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        borderColor: '#FCD34D',
                        color: '#B45309',
                        background: '#FFFBEB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Gift size={13} /> Wish Early
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                No other client birthdays coming up in the next 14 days.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 🪔 FESTIVAL GREETINGS (ALL CLIENTS BROADCAST) */}
      {/* ========================================================================= */}
      {activeTab === 'festivals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Festival Selection & Composer Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)',
            borderRadius: 22,
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(109, 40, 217, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    {selectedFestival?.icon || '🪔'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#E9D5FF' }}>
                      Festival Greetings Broadcast
                    </span>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0 }}>
                      Send Festival Wishes to All Clients
                    </h2>
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#DDD6FE', maxWidth: 620 }}>
                  Personalized festival greetings for your entire client base. Reach all active investors via 1-click WhatsApp web dispatch or copy personalized messages.
                </p>
              </div>

              {/* Broadcast Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startBroadcastQueue(true)}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 18px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Play size={16} />
                  Auto-Send to All ({getFilteredFestivalClients().length})
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailCampaignModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontWeight: 900,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)'
                  }}
                  title="Launch festive email greeting to all converted clients"
                >
                  <Mail size={16} />
                  <span>📧 Bulk Festive Email Blast</span>
                  {emailStats.sentCount > 0 && (
                    <span style={{ background: '#FFFFFF', color: '#B45309', borderRadius: 999, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 900 }}>
                      {emailStats.sentCount} sent
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => startBroadcastQueue(false)}
                  style={{
                    background: '#FFFFFF',
                    color: '#6D28D9',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontWeight: 900,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}
                >
                  <Flame size={16} />
                  1-by-1 Queue
                </button>

                <button
                  type="button"
                  onClick={handleExportAiSensyCsv}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                  title="Download CSV formatted for AiSensy / WhatsApp Broadcast"
                >
                  <Download size={15} />
                  Export AiSensy CSV
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllPhoneNumbers}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={15} />
                  Copy Numbers
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllFestivalMessages}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={15} />
                  Copy All Messages
                </button>

                <button
                  type="button"
                  onClick={() => setShowBroadcastInfo(prev => !prev)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#DDD6FE',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={15} />
                  How to blast to all at once?
                </button>
              </div>
            </div>

            {/* Broadcast Info Box */}
            {showBroadcastInfo && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
                fontSize: '0.84rem',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 800, color: '#FDE68A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={16} /> How to send to all clients in 1 single second via WhatsApp:
                </div>
                <div>
                  <strong>Method 1 (Instant WhatsApp Broadcast List):</strong><br />
                  1. Click <strong>&quot;Copy Numbers&quot;</strong> above.<br />
                  2. Open WhatsApp on Mobile / WhatsApp Web ➔ Click <strong>&quot;New Broadcast&quot;</strong>.<br />
                  3. Add your client contacts and paste the Festive Message.<br />
                  4. Hit Send — WhatsApp delivers to <strong>all 100+ clients simultaneously and privately</strong> at the exact same second!
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Method 2 (Hands-Free CRM Auto-Sender):</strong><br />
                  Click <strong>&quot;Auto-Send to All&quot;</strong> above. The CRM automatically sequences through each client every 3 seconds without you having to click next every time.
                </div>
              </div>
            )}

            {/* Festival Picker Pills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E9D5FF', marginBottom: 8 }}>
                Select Festival / Occasion:
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {festivals.slice(0, 10).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFestival(f);
                      setCustomFestivalName('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 10,
                      border: selectedFestival?.id === f.id && !customFestivalName ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: selectedFestival?.id === f.id && !customFestivalName ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      color: selectedFestival?.id === f.id && !customFestivalName ? '#6D28D9' : '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{f.icon}</span>
                    <span>{f.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({f.diffDays === 0 ? 'Today!' : `in ${f.diffDays}d`})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Festival Name Input */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', maxWidth: 450, background: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#E9D5FF', fontWeight: 700, whiteSpace: 'nowrap' }}>Or custom festival:</span>
              <input
                type="text"
                placeholder="e.g. Navratri, Durga Puja, New Financial Year"
                value={customFestivalName}
                onChange={e => setCustomFestivalName(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Festive Message Composer & Live Greeting Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            
            {/* Left: Template Selector & Message Customizer */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '22px 24px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
                1. Choose Greeting Template
              </h3>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {FESTIVAL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedFestTemplate(tpl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: selectedFestTemplate.id === tpl.id ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                      background: selectedFestTemplate.id === tpl.id ? '#EDE9FE' : '#FFFFFF',
                      color: selectedFestTemplate.id === tpl.id ? '#6D28D9' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Message Text (supports placeholder <code style={{ color: '#7C3AED' }}>&#123;name&#125;</code>):
              </label>
              <textarea
                rows={4}
                value={festivalCustomMsg}
                onChange={e => setFestivalCustomMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              {/* Festive Image Attachment */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <ImageIcon size={14} style={{ color: '#7C3AED' }} />
                    Attach Festive Greeting Card / Banner
                  </label>
                  {festivalImage && (
                    <button
                      type="button"
                      onClick={() => setFestivalImage(null)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Remove Card
                    </button>
                  )}
                </div>

                {festivalImage ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <img
                        src={festivalImage.url}
                        alt={festivalImage.name}
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setPreviewModalImage({ url: festivalImage.url, name: festivalImage.name })}
                        title="Click to view full size"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {festivalImage.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
                          Attached to broadcast greetings
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setPreviewModalImage({ url: festivalImage.url, name: festivalImage.name })}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 6 }}
                          title="View full size"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyImageToClipboard(festivalImage.url)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 6 }}
                          title="Copy image to clipboard"
                        >
                          <Copy size={13} /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(festivalImage.url, festivalImage.name)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 6 }}
                          title="Download image"
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </div>

                    {/* Toggle: Include Image Link in Message */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <input
                        type="checkbox"
                        id="includeFestImgLink"
                        checked={includeFestivalImageLink}
                        onChange={e => setIncludeFestivalImageLink(e.target.checked)}
                        style={{ accentColor: '#7C3AED', cursor: 'pointer' }}
                      />
                      <label htmlFor="includeFestImgLink" style={{ fontSize: '0.74rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                        Include web URL link in WhatsApp text (uncheck to keep text clean)
                      </label>
                    </div>

                    {/* How it works guidance */}
                    <div style={{
                      marginTop: 8,
                      fontSize: '0.73rem',
                      color: '#6D28D9',
                      background: '#F5F3FF',
                      border: '1px solid #DDD6FE',
                      borderRadius: 8,
                      padding: '8px 12px',
                      lineHeight: '1.4'
                    }}>
                      💡 <strong>Sending Image on WhatsApp:</strong> Clicking Send automatically copies the image. When WhatsApp opens, simply press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) to send the picture with your message! On phones and tablets, it attaches the photo directly.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}>
                      <Upload size={13} />
                      {isUploadingFestivalImage ? 'Uploading...' : 'Upload Festive Card'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadImageFile(e, 'festival')}
                        style={{ display: 'none' }}
                        disabled={isUploadingFestivalImage}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFestivalImage({
                        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
                        name: 'Festive Greeting Banner.jpg',
                        isPreset: true
                      })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#EDE9FE',
                        border: '1px solid #C4B5FD',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#6D28D9',
                        cursor: 'pointer'
                      }}
                    >
                      🪔 Use Preset Card
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Preview Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              borderRadius: 20,
              padding: '22px 24px',
              border: '1.5px solid #FCD34D',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live WhatsApp Greeting Preview
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>
                    {selectedFestival?.icon || '🪔'}
                  </span>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '16px',
                  border: '1px solid #FDE68A',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  color: '#0F172A',
                  whiteSpace: 'pre-wrap'
                }}>
                  {festivalImage && (
                    <div
                      style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#000', cursor: 'pointer' }}
                      onClick={() => setPreviewModalImage({ url: festivalImage.url, name: festivalImage.name })}
                      title="Click to view full image"
                    >
                      <img
                        src={festivalImage.url}
                        alt="Festive Card Preview"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                  {festivalCustomMsg
                    .replace(/{name}/g, 'Soni Mehta')
                    .replace(/{festival}/g, customFestivalName.trim() || selectedFestival?.name || 'Diwali')
                    .replace(/{advisor}/g, advisorName)}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: '0.74rem', color: '#92400E', fontStyle: 'italic' }}>
                Note: When dispatched to each client, <code style={{ color: '#B45309' }}>&#123;name&#125;</code> will automatically resolve to their full registered name.
              </div>
            </div>

          </div>

          {/* Client Broadcast Audience Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: '#7C3AED' }} />
                  Target Audience: Converted Clients ({getFilteredFestivalClients().length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Click &apos;Send Wish&apos; on any client or launch the guided broadcast queue
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search client name or phone..."
                    value={festivalClientSearch}
                    onChange={e => setFestivalClientSearch(e.target.value)}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      paddingLeft: 30,
                      paddingRight: 10,
                      fontSize: '0.82rem',
                      width: 210
                    }}
                  />
                </div>

                <select
                  value={festivalServiceFilter}
                  onChange={e => setFestivalServiceFilter(e.target.value)}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    padding: '0 10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155'
                  }}
                >
                  <option value="All">All Services</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="FD & Bond">FD & Bond</option>
                </select>
              </div>
            </div>

            {/* Clients Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Client Name</th>
                    <th style={{ padding: '12px 16px' }}>Phone / WhatsApp</th>
                    <th style={{ padding: '12px 16px' }}>Service</th>
                    <th style={{ padding: '12px 16px' }}>Advisor / RM</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredFestivalClients().slice(0, 50).map(client => {
                    const isSent = sentWishesMap[`fest-${client._id}`];
                    return (
                      <tr key={client._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                          {client.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                          {client.whatsappNumber || client.phone || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                            {client.service}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.82rem' }}>
                          {client.assignedTo || 'Investrow Advisory'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleSendFestivalWish(client)}
                            style={{
                              background: isSent ? '#DCFCE7' : '#EDE9FE',
                              color: isSent ? '#15803D' : '#6D28D9',
                              border: isSent ? '1px solid #86EFAC' : '1px solid #DDD6FE',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Send size={13} />
                            {isSent ? 'Sent ✓ (Send Again)' : 'Send Festival Wish'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {getFilteredFestivalClients().length > 50 && (
              <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Showing first 50 clients. Use the search bar to find specific investors.
              </div>
            )}
          </div>

          {/* Guided Broadcast Modal Dialog */}
          {isBroadcastQueueOpen && (() => {
            const list = getFilteredFestivalClients();
            const currentClient = list[broadcastIndex];
            if (!currentClient) return null;

            const festName = customFestivalName.trim() || selectedFestival?.name || 'the Festival';
            const msgForClient = festivalCustomMsg
              .replace(/{name}/g, currentClient.name)
              .replace(/{festival}/g, festName)
              .replace(/{advisor}/g, currentClient.assignedTo || advisorName);

            return (
              <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setIsBroadcastQueueOpen(false)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, borderRadius: 24, overflow: 'hidden', padding: 0 }}>
                  <div style={{ background: 'linear-gradient(135deg, #6D28D9, #7C3AED)', padding: '20px 24px', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#DDD6FE' }}>
                        Guided WhatsApp Broadcast
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                        {broadcastIndex + 1} of {list.length}
                      </span>
                    </div>
                    <h3 style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 900 }}>
                      Send to {currentClient.name}
                    </h3>
                  </div>

                  <div style={{ padding: '24px' }}>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${((broadcastIndex + 1) / list.length) * 100}%`, height: '100%', background: '#7C3AED', transition: 'width 0.3s ease' }} />
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Recipient Phone:</div>
                      <div style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 800 }}>
                        {currentClient.whatsappNumber || currentClient.phone || 'No phone on record'}
                      </div>
                    </div>

                    {festivalImage && (
                      <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#000000' }}>
                        <img
                          src={festivalImage.url}
                          alt={festivalImage.name || 'Festive Card'}
                          style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    )}

                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 800, marginBottom: 4 }}>Prepared Message:</div>
                      <div style={{ fontSize: '0.84rem', color: '#0F172A', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                        {msgForClient}
                      </div>
                    </div>

                    {/* Auto-Dispatch Status Indicator */}
                    {isAutoSending ? (
                      <div style={{
                        background: '#ECFDF5',
                        border: '1.5px solid #86EFAC',
                        borderRadius: 12,
                        padding: '10px 14px',
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontWeight: 800, fontSize: '0.82rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                          Auto-dispatching in progress... Next chat opening in {autoCountdown}s
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAutoSending(false)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Pause size={12} /> Pause
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: 12,
                        padding: '8px 12px',
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                          Auto-sender paused
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoCountdown(2);
                            setIsAutoSending(true);
                          }}
                          style={{
                            background: '#10B981',
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Play size={12} /> Resume Auto-Send
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleSendCurrentQueueClient}
                        style={{
                          flex: 2,
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          cursor: 'pointer'
                        }}
                      >
                        <Send size={16} /> Open WhatsApp & Next ➔
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (broadcastIndex + 1 < list.length) {
                            setBroadcastIndex(prev => prev + 1);
                            setAutoCountdown(3);
                          } else {
                            setIsAutoSending(false);
                            setIsBroadcastQueueOpen(false);
                          }
                        }}
                        style={{
                          flex: 1,
                          background: '#F1F5F9',
                          color: '#475569',
                          border: '1px solid #CBD5E1',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 💸 UPCOMING SIP DEBITS (NEXT 5 DAYS) */}
      {/* ========================================================================= */}
      {activeTab === 'sips' && (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={16} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>5-DAY PRIOR ALERT</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  Upcoming SIP Debits (Next 5 Days)
                </h3>
                <span style={{ background: '#0EA5E9', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {upcomingSips.length} Clients
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                These clients have monthly SIP deductions in the next 5 days. Send a 1-click WhatsApp balance reminder to ensure sufficient bank funds.
              </p>
            </div>
          </div>

          {loadingSips ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
              Checking upcoming SIP deductions...
            </div>
          ) : upcomingSips.length === 0 ? (
            <div style={{
              background: '#F8FAFC',
              padding: '24px 20px',
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '0.875rem'
            }}>
              No SIP debits scheduled for deduction over the next 5 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingSips.map(sip => (
                <div
                  key={sip._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      ₹
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                          {sip.name}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#FEF3C7',
                          color: '#B45309'
                        }}>
                          {sip.dueStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                        {sip.schemeName} • Debit Day {sip.sipDay}th • Phone: {sip.phone || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>
                      {sip.formattedAmount}/mo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDirectWhatsAppSip(sip)}
                      className="btn btn-sm"
                      style={{
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px'
                      }}
                    >
                      <Send size={13} /> Send WhatsApp Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ✉️ CUSTOM COMPOSER, LIVE PREVIEW & COMMUNICATION LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
          
          {/* Left Column: Composer Form */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Compose Direct Message
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Send personalized WhatsApp messages with attached photos, charts, or greeting banners
                </p>
              </div>
              <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>
                1-on-1 Dispatch
              </span>
            </div>

            {/* Quick Select Client from CRM Directory */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} style={{ color: '#0284C7' }} /> Quick Select Existing Client
                </label>
                {recipientName && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientName('');
                      setRecipientPhone('');
                      setClientSearchFilter('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear Recipient
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search client by name or phone to auto-fill..."
                  value={clientSearchFilter}
                  onChange={e => {
                    setClientSearchFilter(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="form-input"
                  style={{ height: 38, borderRadius: 8, fontSize: '0.82rem', paddingLeft: 34 }}
                />
                <Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#94A3B8' }} />
                
                {showClientDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 100,
                    marginTop: 4
                  }}>
                    {allClients
                      .filter(c => {
                        const q = clientSearchFilter.toLowerCase();
                        return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
                      })
                      .slice(0, 10)
                      .map(c => (
                        <div
                          key={c._id}
                          onClick={() => {
                            setRecipientName(c.name);
                            setRecipientPhone(c.whatsappNumber || c.phone || '');
                            setClientSearchFilter(`${c.name} (${c.whatsappNumber || c.phone || 'No phone'})`);
                            setShowClientDropdown(false);
                            if (selectedTemplate) {
                              setCustomMessage(selectedTemplate.text.replace('{name}', c.name));
                            }
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.82rem'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        >
                          <div>
                            <strong style={{ color: '#0F172A' }}>{c.name}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.phone || 'No phone'} • {c.service}</div>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>Select</span>
                        </div>
                      ))}
                    {allClients.length === 0 && (
                      <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
                        No clients loaded
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
                Select Standard Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                {STANDARD_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      const resolved = tpl.text.replace('{name}', recipientName || 'Valued Client');
                      setCustomMessage(resolved);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: selectedTemplate?.id === tpl.id ? `2px solid ${tpl.color}` : '1px solid #E2E8F0',
                      background: selectedTemplate?.id === tpl.id ? `${tpl.color}10` : '#F8FAFC',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: tpl.color, display: 'block' }}>{tpl.badge}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{tpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Soni Mehta"
                  value={recipientName}
                  onChange={e => {
                    setRecipientName(e.target.value);
                    if (selectedTemplate) {
                      setCustomMessage(selectedTemplate.text.replace('{name}', e.target.value || 'Valued Client'));
                    }
                  }}
                  className="form-input"
                  style={{ height: 40, borderRadius: 8, fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  className="form-input"
                  style={{ height: 40, borderRadius: 8, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Message Content
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="form-input"
                style={{ width: '100%', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: '1.45' }}
              />
            </div>

            {/* ========================================================================= */}
            {/* ATTACH IMAGE SECTION */}
            {/* ========================================================================= */}
            <div style={{
              background: '#F8FAFC',
              border: attachedImage ? '1.5px solid #10B981' : '1.5px dashed #CBD5E1',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 20,
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    background: attachedImage ? '#DCFCE7' : '#E2E8F0',
                    color: attachedImage ? '#15803D' : '#475569',
                    padding: 6,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                      Attach Image / Media
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                      Add brochures, charts, greeting cards, or promotional banners
                    </span>
                  </div>
                </div>

                {attachedImage ? (
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> Image Attached
                  </span>
                ) : (
                  <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>
                    Optional
                  </span>
                )}
              </div>

              {/* If an Image is Attached */}
              {attachedImage ? (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    {/* Thumbnail */}
                    <div
                      onClick={() => setPreviewModalImage({ url: attachedImage.url, name: attachedImage.name })}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#0F172A',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: '1px solid #CBD5E1',
                        position: 'relative'
                      }}
                      title="Click to zoom image"
                    >
                      <img
                        src={attachedImage.url}
                        alt={attachedImage.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {attachedImage.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {attachedImage.size && <span>{(attachedImage.size / 1024).toFixed(1)} KB</span>}
                        {attachedImage.isPreset && <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Preset Graphic</span>}
                        <span style={{ color: '#10B981', fontWeight: 700 }}>• Preview Ready</span>
                      </div>
                    </div>

                    {/* Quick Image Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalImage({ url: attachedImage.url, name: attachedImage.name })}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="View full-size image"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyImageToClipboard(attachedImage.url)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Copy image to clipboard for easy Ctrl+V in WhatsApp"
                      >
                        <Copy size={13} /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(attachedImage.url, attachedImage.name)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Download image file"
                      >
                        <Download size={13} /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '5px 8px', color: '#EF4444', borderRadius: 8 }}
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Toggle: Include Image Link in Message */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <input
                      type="checkbox"
                      id="includeImgLinkCheck"
                      checked={includeImageLink}
                      onChange={e => setIncludeImageLink(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#10B981' }}
                    />
                    <label htmlFor="includeImgLinkCheck" style={{ fontSize: '0.76rem', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                      Include direct image URL link in WhatsApp text (off by default to keep message clean)
                    </label>
                  </div>

                  {/* How it works guidance */}
                  <div style={{
                    marginTop: 8,
                    fontSize: '0.73rem',
                    color: '#065F46',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 8,
                    padding: '8px 12px',
                    lineHeight: '1.4'
                  }}>
                    💡 <strong>Sending Image on WhatsApp:</strong> Clicking Send automatically copies the image. When WhatsApp opens, simply press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) to send the picture with your message!
                  </div>
                </div>
              ) : (
                /* When No Image is Attached */
                <div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    {/* Upload File Button */}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#10B981',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}>
                      <Upload size={14} />
                      {isUploadingImage ? 'Uploading Image...' : 'Upload Image File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleUploadImageFile(e, 'custom')}
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Presets Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowPresetPicker(!showPresetPicker);
                        setShowUrlInput(false);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: showPresetPicker ? '#0284C7' : '#FFFFFF',
                        color: showPresetPicker ? '#FFFFFF' : '#0284C7',
                        border: '1.5px solid #0284C7',
                        padding: '8px 14px',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={14} />
                      {showPresetPicker ? 'Hide Presets' : 'Choose Preset Graphic'}
                    </button>

                    {/* URL Input Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUrlInput(!showUrlInput);
                        setShowPresetPicker(false);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#FFFFFF',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '8px 14px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Paste Image URL
                    </button>
                  </div>

                  {/* Preset Graphics Grid */}
                  {showPresetPicker && (
                    <div style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #BAE6FD',
                      borderRadius: 12,
                      padding: '12px',
                      marginBottom: 10
                    }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369A1', marginBottom: 8 }}>
                        Quick Select Financial & Advisory Visuals:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                        {PRESET_ATTACHMENTS.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setAttachedImage({
                                url: item.url,
                                name: `${item.title}.jpg`,
                                isPreset: true
                              });
                              fetch(item.url)
                                .then(r => r.blob())
                                .then(blob => {
                                  const f = new File([blob], `${item.title}.jpg`, { type: blob.type || 'image/jpeg' });
                                  setAttachedImage(prev => (prev?.url === item.url ? { ...prev, file: f } : prev));
                                })
                                .catch(() => {});
                              setShowPresetPicker(false);
                              addToast(`Attached "${item.title}" graphic!`, 'success');
                            }}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: 8,
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              background: '#F8FAFC',
                              transition: 'transform 0.15s, border-color 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#0284C7';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6 }}
                            />
                            <div>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7' }}>{item.badge}</span>
                              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                                {item.title}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL Input Box */}
                  {showUrlInput && (
                    <div style={{ display: 'flex', gap: 8, background: '#FFFFFF', padding: 8, borderRadius: 10, border: '1px solid #CBD5E1', marginBottom: 8 }}>
                      <input
                        type="url"
                        placeholder="https://example.com/banner.jpg"
                        value={customImageUrlInput}
                        onChange={e => setCustomImageUrlInput(e.target.value)}
                        className="form-input"
                        style={{ height: 34, fontSize: '0.8rem', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customImageUrlInput.trim()) return addToast('Please enter a valid image URL', 'error');
                          setAttachedImage({
                            url: customImageUrlInput.trim(),
                            name: 'Web Image URL',
                            isPreset: false
                          });
                          setShowUrlInput(false);
                          setCustomImageUrlInput('');
                          addToast('Image attached from URL!', 'success');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.76rem', borderRadius: 6 }}
                      >
                        Attach
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                    Supported formats: PNG, JPG, JPEG, WEBP, GIF up to 10MB. Stored persistently in MongoDB GridFS.
                  </div>
                </div>
              )}
            </div>

            {/* Launch Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSendCustomMessage}
                style={{
                  flex: 2,
                  minWidth: 200,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 20px',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Send size={18} /> Launch in WhatsApp Web
              </button>

              <button
                type="button"
                onClick={() => {
                  safeCopyText(customMessage, 'Message text copied to clipboard!');
                }}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Copy size={15} /> Copy Text
              </button>

              {attachedImage && (
                <button
                  type="button"
                  onClick={() => handleCopyImageToClipboard(attachedImage.url)}
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    padding: '14px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderColor: '#10B981',
                    color: '#059669'
                  }}
                  title="Copy image so you can paste (Ctrl+V) into WhatsApp"
                >
                  <Copy size={15} /> Copy Image
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Live Visual Message & Media Preview + History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Live WhatsApp / Message Smartphone Preview */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 22,
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Preview Header Bar */}
              <div style={{
                background: '#0F172A',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Live Message & Media Preview
                      <span style={{ background: '#059669', color: '#FFFFFF', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                        REAL-TIME
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Exact visual layout as seen by your client on WhatsApp
                    </div>
                  </div>
                </div>

                {attachedImage ? (
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <ImageIcon size={12} /> Image Ready
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    Text Only
                  </span>
                )}
              </div>

              {/* Smartphone Chat Canvas */}
              <div style={{
                background: '#E5DDD5',
                backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                padding: '16px',
                minHeight: 360,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Chat Top Contact Bar */}
                <div style={{
                  background: '#075E54',
                  borderRadius: '12px 12px 0 0',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#128C7E',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    {(recipientName || 'Client').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {recipientName || 'Valued Client'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                      Online {recipientPhone ? `• ${recipientPhone}` : ''}
                    </div>
                  </div>
                </div>

                {/* Message Bubble Canvas */}
                <div style={{
                  background: '#EFEAE2',
                  borderRadius: '0 0 12px 12px',
                  padding: '16px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  {/* Sent Message Bubble */}
                  <div style={{
                    alignSelf: 'flex-end',
                    maxWidth: '92%',
                    background: '#D9FDD3',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '6px 6px 6px 6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Image Preview inside Bubble */}
                    {attachedImage ? (
                      <div
                        style={{
                          position: 'relative',
                          marginBottom: 6,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#000000',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPreviewModalImage({ url: attachedImage.url, name: attachedImage.name })}
                        title="Click to view full image in lightbox"
                      >
                        <img
                          src={attachedImage.url}
                          alt={attachedImage.name || 'Attached preview'}
                          style={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        {/* Hover Overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.65)',
                          color: '#FFFFFF',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Eye size={11} /> Click to Zoom
                        </div>
                        {attachedImage.name && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                            color: '#FFFFFF',
                            fontSize: '0.7rem',
                            padding: '12px 8px 4px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {attachedImage.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(0,0,0,0.03)',
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.72rem',
                        color: '#64748B'
                      }}>
                        <ImageIcon size={15} style={{ color: '#94A3B8' }} />
                        <span>No image attached. Attach an image on the left to see both image & message previewed together here!</span>
                      </div>
                    )}

                    {/* Message Text inside Bubble */}
                    <div style={{
                      padding: '2px 8px 4px 8px',
                      fontSize: '0.84rem',
                      color: '#111827',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {customMessage || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Your message text will appear here...</span>}
                    </div>

                    {/* Image link note if attached */}
                    {attachedImage && includeImageLink && (
                      <div style={{
                        margin: '4px 8px',
                        padding: '4px 8px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        borderRadius: 6,
                        fontSize: '0.68rem',
                        color: '#065F46',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Check size={11} /> Rich Image Card Link will be appended
                      </div>
                    )}

                    {/* Bubble Timestamp & Double Blue Tick */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 4,
                      paddingRight: 6,
                      marginTop: 2
                    }}>
                      <span style={{ fontSize: '0.68rem', color: '#667781' }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <CheckCheck size={14} style={{ color: '#53BDEB' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preview Actions */}
              <div style={{ padding: '10px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {attachedImage && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyImageToClipboard(attachedImage.url)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: '0.74rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      <Copy size={12} /> Copy Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewModalImage({ url: attachedImage.url, name: attachedImage.name })}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.74rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      <Eye size={12} /> Expand
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    safeCopyText(customMessage, 'Message text copied to clipboard!');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, fontSize: '0.74rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <Copy size={12} /> Copy Text
                </button>
              </div>
            </div>

            {/* Activity Logs Card */}
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: '22px 24px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Recent Communication Logs
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                  {history.length} records
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                {history.map(item => (
                  <div key={item.id} style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start'
                  }}>
                    {/* Log item image thumbnail if attached */}
                    {item.imageUrl ? (
                      <div
                        onClick={() => setPreviewModalImage({ url: item.imageUrl, name: item.imageName || 'Attached Image' })}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#0F172A',
                          cursor: 'pointer',
                          flexShrink: 0,
                          border: '1px solid #CBD5E1'
                        }}
                        title="Click to view image"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.imageName || 'Log image'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#E2E8F0',
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MessageSquare size={16} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A' }}>{item.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.time}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{item.phone}</span>
                        <span>•</span>
                        <span>{item.action}</span>
                        {item.imageUrl && (
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>
                            Image Attached
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: 4, lineHeight: 1.35 }}>
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK FESTIVE EMAIL CAMPAIGN MODAL */}
      {/* ========================================================================= */}
      {showEmailCampaignModal && (
        <div className="modal-backdrop" style={{ zIndex: 1350 }} onClick={() => !isBlastingEmails && setShowEmailCampaignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660, width: '92%', borderRadius: 24, padding: '28px', background: '#FFFFFF', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Bulk Festive Email Campaign
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Send {customFestivalName.trim() || selectedFestival?.name || 'Diwali'} greeting card & wealth wishes to your clients directly via email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isBlastingEmails && setShowEmailCampaignModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 6, color: '#94A3B8' }}
                disabled={isBlastingEmails}
              >
                <X size={20} />
              </button>
            </div>

            {/* LIVE CAMPAIGN DELIVERY COUNTER DASHBOARD */}
            <div style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 18
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} style={{ color: '#2563EB' }} />
                  Live Campaign Delivery Counter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.72rem', padding: '4px 10px' }}>
                    {festivalServiceFilter === 'All' ? 'All Services' : festivalServiceFilter}
                  </span>
                  <button
                    type="button"
                    onClick={fetchEmailStats}
                    disabled={emailStats.loading || isBlastingEmails}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6, border: '1px solid #CBD5E1' }}
                    title="Refresh live counter counts"
                  >
                    <RefreshCw size={12} className={emailStats.loading ? 'animate-spin' : ''} />
                    Refresh Counter
                  </button>
                </div>
              </div>

              {/* 3 Live Metric Counter Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Total Clients</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                    {emailStats.totalEligible || getFilteredFestivalClients().length}
                  </div>
                </div>

                <div style={{ background: '#ECFDF5', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #A7F3D0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: 700 }}>Delivered Today</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>
                    {emailStats.sentCount}
                  </div>
                </div>

                <div style={{ background: '#EFF6FF', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #BFDBFE', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>Remaining Unsent</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#2563EB', marginTop: 2 }}>
                    {emailStats.remainingCount}
                  </div>
                </div>
              </div>

              {/* Visual Live Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: 5 }}>
                  <span>Delivery Progress: <strong style={{ color: '#059669' }}>{emailStats.percentage}%</strong></span>
                  <span>Batch Limit: <strong>100 per send</strong></span>
                </div>
                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, emailStats.percentage))}%`,
                      background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
                      borderRadius: 999,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Festival Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', whiteSpace: 'nowrap' }}>
                Occasion / Festival:
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Diwali', 'Dhanteras', 'New Year'].map(fest => {
                  const isActive = (customFestivalName || selectedFestival?.name || 'Diwali').toLowerCase().includes(fest.toLowerCase());
                  return (
                    <button
                      key={fest}
                      type="button"
                      disabled={isBlastingEmails}
                      onClick={() => {
                        setCustomFestivalName(fest);
                        setEmailCampaignSubject(`🪔 Happy ${fest} & Wealth Wishes from Investrow!`);
                      }}
                      className="btn btn-sm"
                      style={{
                        background: isActive ? '#6D28D9' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#475569',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        border: isActive ? '1.5px solid #6D28D9' : '1px solid #CBD5E1',
                        padding: '4px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      {fest === 'Diwali' ? '🪔 Diwali' : fest === 'Dhanteras' ? '🪙 Dhanteras' : '🎉 New Year'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Subject Line */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Email Subject Line:
              </label>
              <input
                type="text"
                value={emailCampaignSubject}
                onChange={e => setEmailCampaignSubject(e.target.value)}
                disabled={isBlastingEmails}
                className="form-input"
                style={{ width: '100%', fontSize: '0.88rem', fontWeight: 600, padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1' }}
                placeholder="e.g. 🪔 Happy Diwali & Wealth Wishes from Team Investrow!"
              />
            </div>

            {/* Attached Card Preview & Uploader */}
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                {festivalImage?.url ? (
                  <img
                    src={festivalImage.url}
                    alt="Card Preview"
                    style={{ width: 68, height: 50, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #F59E0B', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 68, height: 50, background: '#FEF3C7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', fontSize: '1.3rem', flexShrink: 0, border: '1.5px dashed #F59E0B' }}>
                    🪔
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{festivalImage?.name || `${customFestivalName.trim() || selectedFestival?.name || 'Diwali'} Greeting Card`}</span>
                    <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>
                      Attached
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B45309', marginTop: 3 }}>
                    Embedded right inside the email body + attached as a downloadable file for clients.
                  </div>
                </div>
              </div>

              {/* Upload / Change Image button inside modal */}
              <div>
                <input
                  type="file"
                  id="modal-card-image-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageUpload(e, 'festival')}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('modal-card-image-upload')?.click()}
                  disabled={isUploadingFestivalImage || isBlastingEmails}
                  className="btn btn-outline"
                  style={{
                    borderColor: '#D97706',
                    color: '#92400E',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    borderRadius: 8,
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Paperclip size={14} />
                  {isUploadingFestivalImage ? 'Uploading...' : (festivalImage ? 'Change Image' : 'Attach Image')}
                </button>
              </div>
            </div>

            {/* Step 1: Send Test Email */}
            <div style={{
              background: '#F1F5F9',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 20,
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                Step 1: Send a Test Email to Yourself First (Recommended)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={e => setTestEmailAddress(e.target.value)}
                  disabled={isSendingTestEmail || isBlastingEmails}
                  placeholder="Enter test email address..."
                  style={{ flex: 1, fontSize: '0.84rem', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF' }}
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail || isBlastingEmails}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', fontWeight: 800, borderRadius: 8, padding: '8px 14px', whiteSpace: 'nowrap' }}
                >
                  {isSendingTestEmail ? 'Sending Test...' : 'Send Test Email'}
                </button>
              </div>
            </div>

            {/* Campaign Progress / Results Alert */}
            {emailCampaignResult && (
              <div style={{
                background: emailCampaignResult.status === 'done' ? '#ECFDF5' : emailCampaignResult.status === 'error' ? '#FEF2F2' : '#EFF6FF',
                border: `1.5px solid ${emailCampaignResult.status === 'done' ? '#10B981' : emailCampaignResult.status === 'error' ? '#EF4444' : '#3B82F6'}`,
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20
              }}>
                <div style={{
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: emailCampaignResult.status === 'done' ? '#065F46' : emailCampaignResult.status === 'error' ? '#991B1B' : '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {emailCampaignResult.status === 'done' && <CheckCircle2 size={18} />}
                  {emailCampaignResult.status === 'error' && <X size={18} />}
                  {emailCampaignResult.status === 'sending' && <RefreshCw size={18} className="animate-spin" />}
                  <span>{emailCampaignResult.message}</span>
                </div>
                {emailCampaignResult.status === 'done' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                    <span>✅ Delivered: {emailCampaignResult.sent}</span>
                    <span>⚠️ Skipped / Invalid: {emailCampaignResult.failed}</span>
                    {emailCampaignResult.remaining !== undefined && (
                      <span style={{ color: '#B45309' }}>⏳ Remaining to send: {emailCampaignResult.remaining}</span>
                    )}
                    {emailCampaignResult.total !== undefined && (
                      <span>🎯 Targeted: {emailCampaignResult.total}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Main Launch / Stop Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowEmailCampaignModal(false)}
                className="btn btn-ghost"
                disabled={isBlastingEmails}
                style={{ fontSize: '0.86rem', borderRadius: 10, padding: '10px 18px' }}
              >
                Close
              </button>

              {isBlastingEmails ? (
                <button
                  type="button"
                  onClick={handleStopBulkEmailCampaign}
                  className="btn"
                  style={{
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 22px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Square size={16} fill="white" /> ⏹ Stop Campaign
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleResetCampaign}
                    className="btn btn-outline"
                    style={{
                      borderColor: '#DC2626',
                      color: '#DC2626',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Reset queue to send this new wish to ALL 2,418 clients"
                  >
                    <RefreshCw size={15} /> 🔄 Start Fresh to Everyone
                  </button>

                  <button
                    type="button"
                    onClick={handleSendSingleBatch}
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 18px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                    }}
                  >
                    <Send size={16} /> 📨 Send 1 Batch (100 Clients)
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchBulkEmailCampaign}
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 22px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Play size={16} fill="white" /> 🚀 Auto-Send All (100/Batch)
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {previewModalImage && (
        <div className="modal-backdrop" style={{ zIndex: 1400 }} onClick={() => setPreviewModalImage(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '92%', borderRadius: 20, overflow: 'hidden', padding: 0, background: '#0F172A', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <ImageIcon size={16} style={{ color: '#10B981' }} />
                <span>{previewModalImage.name || 'Image Preview'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={previewModalImage.url}
                  download={previewModalImage.name || 'image'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ color: '#FFFFFF', borderColor: '#475569', fontSize: '0.76rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Download size={13} /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#94A3B8', padding: 6 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '75vh', overflow: 'auto', background: '#090D16' }}>
              <img
                src={previewModalImage.url}
                alt={previewModalImage.name || 'Preview'}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
