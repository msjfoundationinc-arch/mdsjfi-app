import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { put, list } from '@vercel/blob';

// In-memory photo cache
const memoryPhotoStore = new Map();

function getStoragePaths() {
  const list = [];
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    list.push(path.resolve(__dirname, '..', 'data', 'student-photos.json'));
  } catch (e) {}
  try {
    list.push(path.resolve(process.cwd(), 'data', 'student-photos.json'));
  } catch (e) {}
  try {
    list.push(path.join(os.tmpdir(), 'mdsj_student_photos.json'));
  } catch (e) {}
  return Array.from(new Set(list));
}

function loadPhotosFromDisk() {
  const paths = getStoragePaths();
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (k && v && typeof v === 'string') {
              const cleanKey = String(k).trim();
              memoryPhotoStore.set(cleanKey, v);
              memoryPhotoStore.set(cleanKey.toLowerCase(), v);
              const stripped = cleanKey.replace(/^STU-/i, '');
              memoryPhotoStore.set(stripped, v);
              memoryPhotoStore.set(stripped.toLowerCase(), v);
            }
          }
        }
      }
    } catch (e) {}
  }
}

// Initial load
loadPhotosFromDisk();

function savePhotosToDisk(keys, dataUrl) {
  loadPhotosFromDisk();
  for (const k of keys) {
    const cleanK = String(k).trim();
    if (dataUrl) {
      memoryPhotoStore.set(cleanK, dataUrl);
      memoryPhotoStore.set(cleanK.toLowerCase(), dataUrl);
    } else {
      memoryPhotoStore.delete(cleanK);
      memoryPhotoStore.delete(cleanK.toLowerCase());
    }
  }

  const paths = getStoragePaths();
  for (const p of paths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let currentDisk = {};
      try {
        if (fs.existsSync(p)) {
          currentDisk = JSON.parse(fs.readFileSync(p, 'utf8') || '{}');
        }
      } catch (e) {}
      for (const k of keys) {
        const cleanK = String(k).trim();
        if (dataUrl) {
          currentDisk[cleanK] = dataUrl;
        } else {
          delete currentDisk[cleanK];
        }
      }
      fs.writeFileSync(p, JSON.stringify(currentDisk), 'utf8');
    } catch (e) {}
  }
}

function normalizeKey(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/^STU-/, '');
}

function getLookupKeys(id, lrn, studentNumber) {
  const set = new Set();
  const add = (v) => {
    if (!v) return;
    const s = String(v).trim();
    if (!s) return;
    set.add(s);
    set.add(s.toLowerCase());
    set.add(s.toUpperCase());
    const stripped = s.replace(/^STU-/i, '');
    set.add(stripped);
    set.add(stripped.toLowerCase());
    set.add(stripped.toUpperCase());
    set.add('STU-' + stripped);
    set.add('stu-' + stripped.toLowerCase());
  };
  add(id);
  add(lrn);
  add(studentNumber);
  return Array.from(set);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. SERVE PHOTO
  if (req.method === 'GET') {
    const rawId = req.query.id || req.query.studentId || req.query.student || req.query.lrn;
    const key = normalizeKey(rawId);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    const lookupKeys = getLookupKeys(rawId, req.query.lrn, req.query.studentNumber);

    try {
      // Tier 1: Try Vercel Blob if token is available
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          for (const testKey of [key, ...lookupKeys]) {
            const strippedKey = normalizeKey(testKey);
            const { blobs } = await list({ prefix: `student-photos/${strippedKey}.` });
            if (blobs && blobs.length > 0) {
              res.setHeader('Cache-Control', 'public, max-age=3600');
              return res.redirect(302, blobs[0].url);
            }
          }
        } catch (blobErr) {
          console.warn('[StudentPhoto] Vercel Blob read warning:', blobErr.message);
        }
      }

      // Tier 2: Check disk / memory store
      loadPhotosFromDisk();
      for (const testKey of lookupKeys) {
        const storedPhoto = memoryPhotoStore.get(testKey) || memoryPhotoStore.get(testKey.toLowerCase());
        if (storedPhoto && typeof storedPhoto === 'string' && storedPhoto.length > 20) {
          if (req.query.img === '1' || req.query.raw === '1') {
            const match = storedPhoto.match(/^data:(image\/\w+);base64,(.+)$/);
            const contentType = match ? match[1] : 'image/jpeg';
            const base64Data = match ? match[2] : storedPhoto;
            const buf = Buffer.from(base64Data, 'base64');
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(buf);
          }
          return res.status(200).json({ ok: true, success: true, id: key, photo: storedPhoto, url: `/api/student-photo?id=${encodeURIComponent(rawId)}&img=1` });
        }
      }

      return res.status(404).json({ error: 'Photo not found' });
    } catch (err) {
      console.error('[StudentPhoto] GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. UPLOAD PHOTO
  if (req.method === 'POST') {
    const { id, photo, dataUrl, lrn, studentNumber } = req.body || {};
    const rawId = id || lrn || studentNumber;
    const key = normalizeKey(rawId);
    const rawData = photo || dataUrl;

    if (!key || !rawData) {
      return res.status(400).json({ error: 'Missing id or photo data' });
    }

    const lookupKeys = getLookupKeys(rawId, lrn, studentNumber);
    let blobUrl = null;

    // Tier 1: Try Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
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
        blobUrl = blob.url;
      } catch (blobErr) {
        console.warn('[StudentPhoto] Vercel Blob put warning (falling back to disk):', blobErr.message);
      }
    }

    // Tier 2: Always persist to disk and memory storage
    savePhotosToDisk(lookupKeys, rawData);

    const publicUrl = blobUrl || `/api/student-photo?id=${encodeURIComponent(rawId)}&img=1`;
    return res.status(200).json({ ok: true, success: true, url: publicUrl, blobUrl });
  }

  // 3. DELETE PHOTO
  if (req.method === 'DELETE') {
    const rawId = req.query.id || req.query.studentId;
    const lookupKeys = getLookupKeys(rawId);
    savePhotosToDisk(lookupKeys, null);
    return res.status(200).json({ ok: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
