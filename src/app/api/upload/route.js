import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique safe filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = file.name || 'document';
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${safeName}`;
    const contentType = file.type || 'application/octet-stream';

    // 1. Save directly into MongoDB GridFS
    await dbConnect();
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: contentType,
      metadata: {
        originalName: originalName,
        contentType: contentType,
        size: file.size,
        uploadedAt: new Date()
      }
    });

    await new Promise((resolve, reject) => {
      Readable.from(buffer).pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // 2. Best-effort mirror to local public/uploads directory (won't fail on read-only cloud/serverless)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), buffer);
    } catch (fsErr) {
      // Intentionally ignored: In deployed read-only serverless environments (Vercel/Lambda),
      // MongoDB GridFS is the persistent source of truth.
    }

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename: originalName,
      size: file.size,
      type: contentType
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }

    const filename = url.replace(/^\/uploads\//, '');
    await dbConnect();
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

    const files = await bucket.find({ filename }).toArray();
    for (const f of files) {
      await bucket.delete(f._id);
    }

    return NextResponse.json({ success: true, message: 'File deleted from storage' });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Delete failed' }, { status: 500 });
  }
}
