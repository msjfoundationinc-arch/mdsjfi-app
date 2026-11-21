import { put, list } from '@vercel/blob';

function normalizeKey(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/^STU-/, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. SERVE PHOTO
  if (req.method === 'GET') {
    const key = normalizeKey(req.query.id);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    try {
      const { blobs } = await list({ prefix: `student-photos/${key}.` });
      if (!blobs.length) return res.status(404).json({ error: 'Photo not found' });

      // Redirects the <img> tag directly to the permanent Vercel Blob CDN URL
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.redirect(302, blobs[0].url);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. UPLOAD PHOTO
  if (req.method === 'POST') {
    const { id, photo, dataUrl } = req.body || {};
    const key = normalizeKey(id);
    const rawData = photo || dataUrl;

    if (!key || !rawData) {
      return res.status(400).json({ error: 'Missing id or photo data' });
    }

    try {
      // Strip "data:image/jpeg;base64," prefix if present
      const match = rawData.match(/^data:(image\/\w+);base64,(.+)$/);
      const contentType = match ? match[1] : 'image/jpeg';
      const ext = contentType === 'image/png' ? 'png' : 'jpg';
      const base64Data = match ? match[2] : rawData;
      const buffer = Buffer.from(base64Data, 'base64');

      const blob = await put(`student-photos/${key}.${ext}`, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      return res.status(200).json({ ok: true, url: blob.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
