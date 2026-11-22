const fs = require('fs');
const path = require('path');
const os = require('os');

// In-memory photo cache
const memoryPhotoStore = new Map();

// Dynamic @vercel/blob loader
let blobPut = null;
let blobList = null;
let blobDel = null;
let blobLoaded = false;

function getBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN.trim();
  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) return process.env.VERCEL_BLOB_READ_WRITE_TOKEN.trim();
  if (process.env.STORAGE_BLOB_READ_WRITE_TOKEN) return process.env.STORAGE_BLOB_READ_WRITE_TOKEN.trim();
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().includes('BLOB') && k.toUpperCase().includes('TOKEN') && typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
}

async function getBlobHelpers() {
  if (blobLoaded && blobPut) return { put: blobPut, list: blobList, del: blobDel };
  try {
    const mod = await import('@vercel/blob');
    blobPut = mod.put || (mod.default && mod.default.put);
    blobList = mod.list || (mod.default && mod.default.list);
    blobDel = mod.del || (mod.default && mod.default.del);
    if (blobPut) blobLoaded = true;
  } catch (e) {
    try {
      const mod = require('@vercel/blob');
      blobPut = mod.put;
      blobList = mod.list;
      blobDel = mod.del;
      if (blobPut) blobLoaded = true;
    } catch (e2) {
      console.warn('[StudentPhoto] @vercel/blob not available, using disk/memory fallback:', e2.message);
    }
  }
  return { put: blobPut, list: blobList, del: blobDel };
}

function getStoragePaths() {
  const list = [];
  try {
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

function wrapResponse(res) {
  if (!res.status) {
    res.status = function(code) { this.statusCode = code; return this; };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };
  }
  if (!res.send) {
    res.send = function(data) {
      return this.end(data);
    };
  }
  if (!res.redirect) {
    res.redirect = function(status, targetUrl) {
      if (typeof status === 'string') { targetUrl = status; status = 302; }
      this.writeHead(status || 302, { Location: targetUrl });
      this.end();
      return this;
    };
  }
}

module.exports = async function handler(req, res) {
  wrapResponse(res);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!req.query && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch (e) {
      req.query = {};
    }
  }
  req.query = req.query || {};

  // 1. SERVE PHOTO
  if (req.method === 'GET') {
    const rawId = req.query.id || req.query.studentId || req.query.student || req.query.lrn;
    const key = normalizeKey(rawId);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    const lookupKeys = getLookupKeys(rawId, req.query.lrn, req.query.studentNumber);
    const { list } = await getBlobHelpers();

    try {
      // Tier 1: Try Vercel Blob if available
      const token = getBlobToken();
      if (list) {
        try {
          const prefixes = new Set();
          for (const testKey of [key, ...lookupKeys]) {
            const sk = normalizeKey(testKey);
            prefixes.add(`student-photos/${sk}.`);
            prefixes.add(`student-photos/STU-${sk}.`);
            prefixes.add(`student-photos/${testKey}.`);
          }
          for (const pfx of prefixes) {
            const listOpts = { prefix: pfx };
            if (token) listOpts.token = token;
            const { blobs } = await list(listOpts);
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
    if (!req.body) {
      try {
        let rawBody = '';
        await new Promise((resolve) => {
          req.on('data', chunk => rawBody += chunk);
          req.on('end', resolve);
        });
        req.body = JSON.parse(rawBody || '{}');
      } catch (e) {
        req.body = {};
      }
    }

    const { id, photo, dataUrl, lrn, studentNumber } = req.body || {};
    const rawId = id || lrn || studentNumber;
    const key = normalizeKey(rawId);
    const rawData = photo || dataUrl;

    if (!key || !rawData) {
      return res.status(400).json({ error: 'Missing id or photo data' });
    }

    const lookupKeys = getLookupKeys(rawId, lrn, studentNumber);
    let blobUrl = null;
    let blobError = null;
    const { put } = await getBlobHelpers();

    // Tier 1: Try Vercel Blob
    if (put) {
      try {
        const match = rawData.match(/^data:(image\/\w+);base64,(.+)$/);
        const contentType = match ? match[1] : 'image/jpeg';
        const ext = contentType === 'image/png' ? 'png' : 'jpg';
        const base64Data = match ? match[2] : rawData.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const token = getBlobToken();
        const opts = {
          access: 'public',
          contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
        if (token) opts.token = token;

        const blob = await put(`student-photos/${key}.${ext}`, buffer, opts);
        if (blob && blob.url) {
          blobUrl = blob.url;
          console.log(`[StudentPhoto] Successfully uploaded photo to Vercel Blob:`, blobUrl);
        }
      } catch (blobErr) {
        console.error('[StudentPhoto] Vercel Blob put error (falling back to disk):', blobErr.message);
        blobError = blobErr.message;
      }
    }

    // Tier 2: Always persist to disk and memory storage
    savePhotosToDisk(lookupKeys, rawData);

    const publicUrl = blobUrl || `/api/student-photo?id=${encodeURIComponent(rawId)}&img=1`;
    return res.status(200).json({ ok: true, success: true, url: publicUrl, blobUrl, isBlob: Boolean(blobUrl), blobError });
  }

  // 3. DELETE PHOTO
  if (req.method === 'DELETE') {
    const rawId = req.query.id || req.query.studentId || req.query.student || req.query.lrn;
    const key = normalizeKey(rawId);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    const lookupKeys = getLookupKeys(rawId, req.query.lrn, req.query.studentNumber);

    // Tier 1: Delete from Vercel Blob
    const { list, del } = await getBlobHelpers();
    if (del && list) {
      try {
        const token = getBlobToken();
        const prefixes = new Set();
        for (const testKey of [key, ...lookupKeys]) {
          const sk = normalizeKey(testKey);
          prefixes.add(`student-photos/${sk}.`);
          prefixes.add(`student-photos/STU-${sk}.`);
          prefixes.add(`student-photos/${testKey}.`);
        }
        for (const pfx of prefixes) {
          const listOpts = { prefix: pfx };
          if (token) listOpts.token = token;
          const { blobs } = await list(listOpts);
          if (blobs && blobs.length > 0) {
            const urlsToDelete = blobs.map(b => b.url);
            const delOpts = {};
            if (token) delOpts.token = token;
            await del(urlsToDelete, delOpts);
            console.log(`[StudentPhoto] Deleted photo blobs from Vercel Blob:`, urlsToDelete);
          }
        }
      } catch (blobDelErr) {
        console.error('[StudentPhoto] Vercel Blob del error:', blobDelErr.message);
      }
    }

    // Tier 2: Delete from disk and memory store across all lookup keys
    savePhotosToDisk(lookupKeys, null);
    return res.status(200).json({ ok: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
