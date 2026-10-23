import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import path from 'path';
import { readFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function getMime(filename, fallback) {
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] || fallback || 'application/octet-stream';
}

export async function GET(request, { params }) {
  try {
    const { filename } = params;
    if (!filename) {
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    await dbConnect();
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

    // 1. Search in MongoDB GridFS
    const files = await bucket.find({ filename }).toArray();

    if (files && files.length > 0) {
      const fileDoc = files[0];
      const contentType = getMime(filename, fileDoc.metadata?.contentType || fileDoc.contentType);
      const originalName = fileDoc.metadata?.originalName || fileDoc.filename;

      const downloadStream = bucket.openDownloadStreamByName(filename);

      // Convert Node.js readable stream into Web ReadableStream for NextResponse
      const webStream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk) => controller.enqueue(chunk));
          downloadStream.on('end', () => controller.close());
          downloadStream.on('error', (err) => controller.error(err));
        }
      });

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', fileDoc.length.toString());
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      // Inline allows in-browser previewing of PDFs and images
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);

      return new Response(webStream, { headers });
    }

    // 2. Fallback to local public/uploads directory (for legacy local files)
    try {
      const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
      const buffer = await readFile(localPath);
      const contentType = getMime(filename, 'application/octet-stream');

      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
        }
      });
    } catch (fsErr) {
      // Not found locally
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (error) {
    console.error('File retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}
