import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ARTWORK_EXTENSIONS, extOf } from '@/lib/options';
import { clientIp, db, rateLimit } from '@/lib/supabase';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

// Backup upload path. Some in-app browsers (Facebook, Instagram on Android) cannot PUT straight to
// Supabase Storage, so the form retries through our own server. Vercel caps request bodies near
// 4.5 MB, so bigger files keep the "send it on WhatsApp" fallback instead.
const MAX_DIRECT = 4 * 1024 * 1024;
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
  svg: 'image/svg+xml',
  ai: 'application/postscript',
  eps: 'application/postscript',
};

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`upload:${ip}`, 40, 600))) {
    return NextResponse.json({ error: 'Too many uploads. Wait a few minutes and try again.' }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const folder = String(form?.get('folder') || '');
  if (!(file instanceof File) || !/^[0-9a-f-]{36}$/.test(folder)) return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  const ext = extOf(file.name);
  if (!(ARTWORK_EXTENSIONS as readonly string[]).includes(ext)) {
    return NextResponse.json({ error: `${file.name} is not a supported file type. Use PNG, JPG, PDF, AI, EPS or SVG.` }, { status: 400 });
  }
  if (!file.size || file.size > MAX_DIRECT) return NextResponse.json({ error: 'File too large for the backup upload.' }, { status: 413 });
  const path = `rfq/${folder}/${randomUUID()}.${ext}`;
  const { error } = await db()
    .storage.from(env.artworkBucket())
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: MIME[ext] || 'application/octet-stream', upsert: false });
  if (error) {
    console.error('direct upload failed', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 502 });
  }
  return NextResponse.json({ path });
}
