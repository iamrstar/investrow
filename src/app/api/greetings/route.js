import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser, unauthorized } from '@/lib/middleware';

// Fallback Indian & National Festivals reference
const FALLBACK_FESTIVALS = [
  { id: 'new_year', name: 'New Year', defaultMonth: 1, defaultDay: 1, icon: '🎉', color: '#6366F1' },
  { id: 'makar_sankranti', name: 'Makar Sankranti / Pongal', defaultMonth: 1, defaultDay: 14, icon: '🪁', color: '#F59E0B' },
  { id: 'republic_day', name: 'Republic Day', defaultMonth: 1, defaultDay: 26, icon: '🇮🇳', color: '#EA580C' },
  { id: 'maha_shivratri', name: 'Maha Shivratri', defaultMonth: 2, defaultDay: 26, icon: '🔱', color: '#8B5CF6' },
  { id: 'holi', name: 'Holi - Festival of Colors', defaultMonth: 3, defaultDay: 14, icon: '🎨', color: '#EC4899' },
  { id: 'eid_ul_fitr', name: 'Eid ul-Fitr', defaultMonth: 3, defaultDay: 31, icon: '🌙', color: '#10B981' },
  { id: 'ram_navami', name: 'Ram Navami', defaultMonth: 4, defaultDay: 6, icon: '🏹', color: '#F97316' },
  { id: 'baisakhi', name: 'Baisakhi / Poila Baisakh', defaultMonth: 4, defaultDay: 14, icon: '🌾', color: '#EAB308' },
  { id: 'eid_al_adha', name: 'Eid al-Adha (Bakrid)', defaultMonth: 6, defaultDay: 7, icon: '🕌', color: '#059669' },
  { id: 'independence_day', name: 'Independence Day', defaultMonth: 8, defaultDay: 15, icon: '🇮🇳', color: '#EA580C' },
  { id: 'raksha_bandhan', name: 'Raksha Bandhan', defaultMonth: 8, defaultDay: 28, icon: '🧵', color: '#EC4899' },
  { id: 'janmashtami', name: 'Krishna Janmashtami', defaultMonth: 9, defaultDay: 4, icon: '🦚', color: '#0284C7' },
  { id: 'ganesh_chaturthi', name: 'Ganesh Chaturthi', defaultMonth: 9, defaultDay: 14, icon: '🐘', color: '#F97316' },
  { id: 'navratri', name: 'Navratri Starts', defaultMonth: 10, defaultDay: 11, icon: '🪔', color: '#DC2626' },
  { id: 'dussehra', name: 'Dussehra / Vijayadashami', defaultMonth: 10, defaultDay: 20, icon: '🏹', color: '#D97706' },
  { id: 'karwa_chauth', name: 'Karwa Chauth', defaultMonth: 10, defaultDay: 29, icon: '🌕', color: '#BE185D' },
  { id: 'dhanteras', name: 'Dhanteras', defaultMonth: 11, defaultDay: 6, icon: '🪙', color: '#CA8A04' },
  { id: 'diwali', name: 'Diwali - Deepawali', defaultMonth: 11, defaultDay: 8, icon: '🪔', color: '#EA580C' },
  { id: 'bhai_dooj', name: 'Bhai Dooj', defaultMonth: 11, defaultDay: 10, icon: '✨', color: '#9333EA' },
  { id: 'guru_nanak_jayanti', name: 'Guru Nanak Jayanti', defaultMonth: 11, defaultDay: 24, icon: '🙏', color: '#D97706' },
  { id: 'christmas', name: 'Merry Christmas', defaultMonth: 12, defaultDay: 25, icon: '🎄', color: '#16A34A' },
];

// Helper to assign vibrant festive icons & colors
function getFestivalMeta(name) {
  const n = String(name || '').toLowerCase();
  if (/diwali|deepawali/i.test(n)) return { icon: '🪔', color: '#EA580C' };
  if (/holi/i.test(n)) return { icon: '🎨', color: '#EC4899' };
  if (/eid/i.test(n)) return { icon: '🌙', color: '#10B981' };
  if (/republic|independence/i.test(n)) return { icon: '🇮🇳', color: '#EA580C' };
  if (/new year/i.test(n)) return { icon: '🎉', color: '#6366F1' };
  if (/christmas/i.test(n)) return { icon: '🎄', color: '#16A34A' };
  if (/pongal|sankranti|lohri/i.test(n)) return { icon: '🪁', color: '#F59E0B' };
  if (/raksha|rakhi/i.test(n)) return { icon: '🧵', color: '#EC4899' };
  if (/ganesh/i.test(n)) return { icon: '🐘', color: '#F97316' };
  if (/janmashtami|krishna/i.test(n)) return { icon: '🦚', color: '#0284C7' };
  if (/navratri|durga/i.test(n)) return { icon: '🪔', color: '#DC2626' };
  if (/dussehra|vijayadashami/i.test(n)) return { icon: '🏹', color: '#D97706' };
  if (/dhanteras/i.test(n)) return { icon: '🪙', color: '#CA8A04' };
  if (/buddha|guru|mahavir/i.test(n)) return { icon: '🙏', color: '#D97706' };
  if (/shivratri/i.test(n)) return { icon: '🔱', color: '#8B5CF6' };
  return { icon: '✨', color: '#7C3AED' };
}

// In-memory cache for live external festival calendar
let cachedFestivals = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours cache

async function getLiveIndianFestivals(year) {
  const now = Date.now();
  if (cachedFestivals && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedFestivals;
  }

  try {
    const res = await fetch(`https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`, {
      headers: { 'User-Agent': 'Investrow-CRM/1.0' },
      next: { revalidate: 43200 }
    });

    if (res.ok) {
      const data = await res.json();
      const yearObj = data[String(year)] || {};
      const events = [];

      for (const [monthKey, days] of Object.entries(yearObj)) {
        for (const [dayKey, val] of Object.entries(days)) {
          // dayKey format: "January 14, 2026, Wednesday"
          const cleanDateStr = dayKey.split(',').slice(0, 2).join(',');
          const eventDate = new Date(cleanDateStr);

          if (!isNaN(eventDate.getTime())) {
            const meta = getFestivalMeta(val.event);
            events.push({
              id: val.event.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: val.event,
              type: val.type || 'Festival',
              defaultMonth: eventDate.getMonth() + 1,
              defaultDay: eventDate.getDate(),
              icon: meta.icon,
              color: meta.color,
              source: 'Calendar Bharat Free API'
            });
          }
        }
      }

      if (events.length > 0) {
        cachedFestivals = events;
        lastFetchTime = now;
        return events;
      }
    }
  } catch (err) {
    console.warn('Calendar Bharat API unavailable, falling back to local list:', err.message);
  }

  return FALLBACK_FESTIVALS;
}

function parseDayMonth(dobStr) {
  if (!dobStr || typeof dobStr !== 'string') return null;
  const s = dobStr.trim();
  
  // Format YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    return {
      year: parseInt(ymd[1], 10),
      month: parseInt(ymd[2], 10),
      day: parseInt(ymd[3], 10)
    };
  }

  // Format DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    return {
      year: parseInt(dmy[3], 10),
      month: parseInt(dmy[2], 10),
      day: parseInt(dmy[1], 10)
    };
  }

  return null;
}

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  try {
    // 1. Fetch all converted clients
    const clients = await Lead.find({ response: 'Converted' })
      .select('name phone whatsappNumber email dateOfBirth service assignedTo city location customFields')
      .populate('assignedTo', 'name phone email')
      .lean();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentDay = now.getDate();

    const todayBirthdays = [];
    const upcomingBirthdays = [];

    // Helper: calculate days difference for birthday in current or next year
    clients.forEach(c => {
      const parsed = parseDayMonth(c.dateOfBirth);
      if (!parsed) return;

      const { year, month, day } = parsed;
      const turningAge = year ? currentYear - year : null;

      // Check if birthday is today
      const isToday = (month === currentMonth && day === currentDay);

      // Date of this year's birthday
      let bdayDate = new Date(currentYear, month - 1, day);
      const todayStart = new Date(currentYear, currentMonth - 1, currentDay);
      let diffDays = Math.round((bdayDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        bdayDate = new Date(currentYear + 1, month - 1, day);
        diffDays = Math.round((bdayDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      }

      const clientInfo = {
        _id: c._id,
        name: c.name || 'Valued Client',
        phone: c.phone || '',
        whatsappNumber: c.whatsappNumber || c.phone || '',
        email: c.email || '',
        dateOfBirth: c.dateOfBirth,
        turningAge,
        service: c.service || 'Mutual Funds',
        assignedTo: c.assignedTo?.name || 'Investrow Advisory',
        city: c.city || c.location || '',
        diffDays,
        formattedBirthDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`
      };

      if (isToday) {
        todayBirthdays.push({ ...clientInfo, isToday: true, diffDays: 0 });
      } else if (diffDays > 0 && diffDays <= 14) {
        upcomingBirthdays.push(clientInfo);
      }
    });

    upcomingBirthdays.sort((a, b) => a.diffDays - b.diffDays);

    // 2. Fetch live festivals from the free calendar API
    const rawFestivals = await getLiveIndianFestivals(currentYear);
    const todayStart = new Date(currentYear, currentMonth - 1, currentDay);

    const calculatedFestivals = rawFestivals.map(f => {
      let festDate = new Date(currentYear, f.defaultMonth - 1, f.defaultDay);
      let diffDays = Math.round((festDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        festDate = new Date(currentYear + 1, f.defaultMonth - 1, f.defaultDay);
        diffDays = Math.round((festDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...f,
        diffDays,
        isToday: diffDays === 0,
        formattedDate: festDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      };
    }).sort((a, b) => a.diffDays - b.diffDays);

    const nextFestival = calculatedFestivals[0] || null;

    return NextResponse.json({
      success: true,
      todayBirthdays,
      upcomingBirthdays,
      festivals: calculatedFestivals,
      nextFestival,
      calendarSource: rawFestivals[0]?.source || 'Calendar Bharat Free API',
      totalClients: clients.length,
      allClients: clients.map(c => ({
        _id: c._id,
        name: c.name || 'Client',
        phone: c.phone || '',
        whatsappNumber: c.whatsappNumber || c.phone || '',
        email: c.email || '',
        service: c.service || 'Mutual Funds',
        assignedTo: c.assignedTo?.name || 'Investrow Advisory'
      }))
    });

  } catch (error) {
    console.error('Error fetching greetings data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  await dbConnect();

  try {
    const body = await request.json();
    const { clientId, clientName, type, festivalName, message, channel } = body;

    if (clientId) {
      await ActivityLog.create({
        userId: authUser.id,
        action: type === 'birthday' ? 'Birthday Greeting Sent' : `Festival Greeting Sent (${festivalName || 'Festival'})`,
        entityType: 'Lead',
        entityId: clientId,
        details: {
          clientName,
          type,
          festivalName,
          channel: channel || 'WhatsApp',
          messageSnippet: message ? message.slice(0, 100) + '...' : '',
          sentAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Greeting logged successfully' });
  } catch (error) {
    console.error('Error logging greeting activity:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
