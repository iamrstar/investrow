import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import CampaignState from '@/models/CampaignState';
import { getAuthUser, unauthorized } from '@/lib/middleware';
import { sendEmail, templates } from '@/lib/email';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to resolve card file on disk or remote and build email attachment
async function getCardAttachment(bannerUrl, festName = 'Festive') {
  const festSlug = (festName || 'festive').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const safeFilename = `investrow-${festSlug}-greeting.jpg`;

  try {
    // 1. Look for uploaded file in public/uploads/
    if (bannerUrl && bannerUrl.includes('/uploads/')) {
      const filename = bannerUrl.split('/uploads/').pop().split('?')[0];
      const diskPath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (fs.existsSync(diskPath)) {
        return {
          filename: safeFilename,
          path: diskPath,
          cid: 'festiveCard'
        };
      }
    }

    // 2. Look for static file in public/
    if (bannerUrl && bannerUrl.startsWith('/') && !bannerUrl.startsWith('//')) {
      const cleanRel = bannerUrl.replace(/^\/+/, '');
      const diskPath = path.join(process.cwd(), 'public', cleanRel);
      if (fs.existsSync(diskPath)) {
        return {
          filename: safeFilename,
          path: diskPath,
          cid: 'festiveCard'
        };
      }
    }

    // 3. Fallback: remote image URL
    if (bannerUrl && bannerUrl.startsWith('http') && !bannerUrl.includes('localhost')) {
      const res = await fetch(bannerUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        return {
          filename: `investrow-${festSlug}-greeting.${ext}`,
          content: buffer,
          contentType,
          cid: 'festiveCard'
        };
      }
    }

    // 4. Auto-detect fallback: look in public/uploads/ for the latest uploaded image
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => ({ name: f, time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      if (files.length > 0) {
        const latestPath = path.join(uploadsDir, files[0].name);
        return {
          filename: safeFilename,
          path: latestPath,
          cid: 'festiveCard'
        };
      }
    }
  } catch (err) {
    console.warn('Error resolving card attachment for email:', err.message);
  }

  return null;
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  try {
    const body = await request.json();
    const {
      action,
      testEmail,
      subject,
      festivalName = 'Diwali',
      bannerUrl,
      customMessage,
      serviceFilter = 'All',
      limit = 100
    } = body;

    const festName = festivalName.trim() || 'Diwali';
    const advisorName = authUser.name || 'Team Investrow';

    // 0. RESET CAMPAIGN TO EVERYONE (FRESH START)
    if (action === 'reset') {
      await dbConnect();
      const festClean = festName.trim();
      const state = await CampaignState.findOneAndUpdate(
        { festivalName: festClean },
        {
          $set: {
            campaignStartedAt: new Date(),
            status: 'idle',
            lastBatchAt: new Date()
          },
          $inc: { resetCount: 1 }
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: `Campaign reset! The queue is now open to all clients for a fresh start of ${festClean}.`,
        campaignStartedAt: state.campaignStartedAt
      });
    }

    // Resolve card attachment once
    const cardAttachment = await getCardAttachment(bannerUrl, festName);
    const emailAttachments = cardAttachment ? [cardAttachment] : [];

    // 1. TEST MODE: Send only 1 email to the testEmail address
    if (testEmail) {
      const emailPayload = templates.festiveGreeting({
        clientName: 'Valued Client (Test)',
        festivalName: festName,
        messageHtml: (customMessage || '')
          .replace(/{name}/g, 'Valued Client')
          .replace(/{festival}/g, festName)
          .replace(/{advisor}/g, advisorName),
        hasCardAttachment: !!cardAttachment,
        bannerUrl,
        advisorName
      });

      const result = await sendEmail({
        to: testEmail,
        subject: subject || emailPayload.subject,
        html: emailPayload.html,
        attachments: emailAttachments
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send test email'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isTest: true,
        hasAttachment: !!cardAttachment,
        message: `Test email with attached card successfully delivered to ${testEmail}!`
      });
    }

    // 2. BULK BROADCAST MODE
    await dbConnect();

    // Fetch or create campaign state to know when this campaign was started/reset
    const festClean = festName.trim();
    let campaignState = await CampaignState.findOne({ festivalName: festClean });
    if (!campaignState) {
      campaignState = await CampaignState.create({
        festivalName: festClean,
        campaignStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      });
    }
    const campaignStartedAt = campaignState.campaignStartedAt || new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Query clients already sent THIS specific festive email since campaign was started/reset
    const festRegex = new RegExp(festClean.replace(/[^a-zA-Z0-9]/g, '.*'), 'i');

    const recentSentLogs = await ActivityLog.find({
      $or: [
        { action: { $regex: festRegex } },
        { 'details.festivalName': { $regex: festRegex } }
      ],
      createdAt: { $gte: campaignStartedAt }
    }).select('entityId details.email').lean();

    const recentSentEntityIds = recentSentLogs
      .map(l => l.entityId)
      .filter(Boolean);

    const recentSentEmails = recentSentLogs
      .map(l => l.details?.email ? l.details.email.trim().toLowerCase() : null)
      .filter(Boolean);

    const sentEmailsSet = new Set(recentSentEmails);

    const query = {
      response: 'Converted',
      email: { $exists: true, $ne: '' }
    };
    if (recentSentEntityIds.length > 0) {
      query._id = { $nin: recentSentEntityIds };
    }
    if (recentSentEmails.length > 0) {
      query.email = {
        $exists: true,
        $ne: '',
        $nin: Array.from(sentEmailsSet)
      };
    }
    if (serviceFilter && serviceFilter !== 'All') {
      query.service = serviceFilter;
    }

    // STRICT: Limit each batch to at most 100 emails
    const batchLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 100);
    const totalRemainingBeforeBatch = await Lead.countDocuments(query);

    const clients = await Lead.find(query)
      .select('name email service phone assignedTo')
      .limit(batchLimit)
      .lean();

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        totalTargeted: 0,
        sentCount: 0,
        failedCount: 0,
        remainingClients: 0,
        message: 'All converted clients have already received the festive email greeting today!'
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];
    let isRateLimited = false;

    for (const client of clients) {
      const cleanEmail = client.email ? client.email.trim().toLowerCase() : '';
      if (!cleanEmail || !cleanEmail.includes('@') || sentEmailsSet.has(cleanEmail)) {
        failedCount++;
        continue;
      }
      sentEmailsSet.add(cleanEmail);

      try {
        const personalizedMsg = (customMessage || '')
          .replace(/{name}/g, client.name || 'Valued Client')
          .replace(/{festival}/g, festName)
          .replace(/{advisor}/g, advisorName);

        const emailPayload = templates.festiveGreeting({
          clientName: client.name || 'Valued Client',
          festivalName: festName,
          messageHtml: personalizedMsg,
          hasCardAttachment: !!cardAttachment,
          bannerUrl,
          advisorName
        });

        const sendRes = await sendEmail({
          to: client.email.trim(),
          subject: subject || emailPayload.subject,
          html: emailPayload.html,
          attachments: emailAttachments
        });

        if (sendRes.success) {
          sentCount++;
          try {
            await ActivityLog.create({
              userId: authUser._id || authUser.id,
              action: `Festive Email Sent (${festName})`,
              entityType: 'Lead',
              entityId: client._id,
              details: {
                clientName: client.name,
                email: client.email,
                channel: 'Email',
                festivalName: festName,
                hasAttachment: !!cardAttachment,
                sentAt: new Date()
              }
            });
          } catch (logErr) {}
        } else {
          failedCount++;
          if (errors.length < 5) errors.push(`${client.email}: ${sendRes.error}`);
          if (sendRes.error?.includes('Too many login attempts') || sendRes.code === 'EAUTH') {
            isRateLimited = true;
            break;
          }
        }
      } catch (err) {
        failedCount++;
        if (errors.length < 5) errors.push(`${client.email}: ${err.message}`);
      }

      // Safe pacing: 500ms between emails so Google never flags flood protection
      await new Promise(r => setTimeout(r, 500));
    }

    const remainingClients = Math.max(0, totalRemainingBeforeBatch - sentCount);

    if (isRateLimited) {
      return NextResponse.json({
        success: false,
        rateLimited: true,
        sentCount,
        failedCount,
        remainingClients,
        totalTargeted: clients.length,
        message: `Google SMTP temporary cooldown active (sent ${sentCount} before cooldown). Google automatically resets this in 10-15 minutes.`
      }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      totalTargeted: clients.length,
      sentCount,
      failedCount,
      remainingClients,
      errors: errors.slice(0, 5),
      message: `Batch complete! Sent ${sentCount} festive emails (${remainingClients} clients remaining).`
    });

  } catch (error) {
    console.error('Bulk festive email campaign error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. STATS & COUNTER ENDPOINT
export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('serviceFilter') || 'All';
    const festName = (searchParams.get('festivalName') || 'Diwali').trim();
    const festRegex = new RegExp(festName.replace(/[^a-zA-Z0-9]/g, '.*'), 'i');

    // 1. Total Converted Clients with email
    const baseQuery = {
      response: 'Converted',
      email: { $exists: true, $ne: '' }
    };
    if (serviceFilter && serviceFilter !== 'All') {
      baseQuery.service = serviceFilter;
    }
    const totalEligible = await Lead.countDocuments(baseQuery);

    // Fetch campaign state for this festival
    let campaignState = await CampaignState.findOne({ festivalName: festName });
    const campaignStartedAt = campaignState?.campaignStartedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 2. Query clients who received THIS specific festive email since campaign was started/reset
    const recentSentLogs = await ActivityLog.find({
      $or: [
        { action: { $regex: festRegex } },
        { 'details.festivalName': { $regex: festRegex } }
      ],
      createdAt: { $gte: campaignStartedAt }
    }).select('entityId details.email').lean();

    const recentSentEntityIds = recentSentLogs
      .map(l => l.entityId)
      .filter(Boolean);

    const recentSentEmails = recentSentLogs
      .map(l => l.details?.email ? l.details.email.trim().toLowerCase() : null)
      .filter(Boolean);

    const sentEmailsSet = new Set(recentSentEmails);

    // 3. Remaining unsent query
    const remainingQuery = { ...baseQuery };
    if (recentSentEntityIds.length > 0) {
      remainingQuery._id = { $nin: recentSentEntityIds };
    }
    if (sentEmailsSet.size > 0) {
      remainingQuery.email = {
        $exists: true,
        $ne: '',
        $nin: Array.from(sentEmailsSet)
      };
    }

    const remainingCount = await Lead.countDocuments(remainingQuery);
    const sentCount = Math.max(0, totalEligible - remainingCount);
    const percentage = totalEligible > 0 ? Math.round((sentCount / totalEligible) * 100) : 0;

    return NextResponse.json({
      success: true,
      totalEligible,
      sentCount,
      remainingCount,
      percentage,
      batchSize: 100
    });
  } catch (err) {
    console.error('Error fetching campaign stats:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
