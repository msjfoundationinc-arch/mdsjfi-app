import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { put, list } from '@vercel/blob';

// In-memory file cache for fast retrieval and serverless execution
const memoryFileStore = new Map();

function getStoragePaths() {
  const list = [];
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    list.push(path.resolve(__dirname, '..', 'data', 'student-files.json'));
  } catch (e) {}
  try {
    list.push(path.resolve(process.cwd(), 'data', 'student-files.json'));
  } catch (e) {}
  try {
    list.push(path.join(os.tmpdir(), 'mdsj_student_files.json'));
  } catch (e) {}
  return Array.from(new Set(list));
}

function loadFilesFromDisk() {
  const paths = getStoragePaths();
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (k && v && typeof v === 'object') {
              const cleanKey = String(k).trim();
              memoryFileStore.set(cleanKey, v);
              memoryFileStore.set(cleanKey.toLowerCase(), v);
              const stripped = cleanKey.replace(/^STU-/i, '');
              memoryFileStore.set(stripped, v);
              memoryFileStore.set(stripped.toLowerCase(), v);
            }
          }
        }
      }
    } catch (e) {}
  }
}

// Initial load
loadFilesFromDisk();

function saveFilesToDisk(keys, docType, docObj) {
  loadFilesFromDisk();
  for (const k of keys) {
    const cleanK = String(k).trim();
    let current = memoryFileStore.get(cleanK) || {};
    if (docObj) {
      current[docType] = docObj;
    } else {
      delete current[docType];
    }
    memoryFileStore.set(cleanK, current);
    memoryFileStore.set(cleanK.toLowerCase(), current);
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
        let studentDisk = currentDisk[cleanK] || {};
        if (docObj) {
          studentDisk[docType] = docObj;
        } else {
          delete studentDisk[docType];
        }
        currentDisk[cleanK] = studentDisk;
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

function normalizeDocType(type) {
  return String(type || '')
    .trim()
    .toLowerCase()
    .replace(/^view/, '')
    .replace(/[^a-z0-9_-]/g, '_');
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

  // 1. SERVE OR LIST FILES
  if (req.method === 'GET') {
    const rawId = req.query.id || req.query.studentId || req.query.student || req.query.lrn;
    const key = normalizeKey(rawId);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    const lookupKeys = getLookupKeys(rawId, req.query.lrn, req.query.studentNumber);

    try {
      // A. SERVE A SPECIFIC PDF INLINE
      if (req.query.type && req.query.raw === '1') {
        const docType = normalizeDocType(req.query.type);

        // Tier 1: Try Vercel Blob if token is available
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            for (const testKey of [key, ...lookupKeys]) {
              const strippedKey = normalizeKey(testKey);
              const { blobs } = await list({ prefix: `student-files/${strippedKey}/${docType}` });
              if (blobs && blobs.length > 0) {
                const fileRes = await fetch(blobs[0].url, {
                  headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
                });
                if (fileRes.ok) {
                  const arrayBuffer = await fileRes.arrayBuffer();
                  const blobContentType = fileRes.headers.get('content-type') || 'application/pdf';
                  res.setHeader('Content-Type', blobContentType);
                  res.setHeader('Content-Disposition', `inline; filename="${docType}.pdf"`);
                  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                  return res.send(Buffer.from(arrayBuffer));
                }
              }
            }
          } catch (blobErr) {
            console.warn('[StudentFile] Vercel Blob read warning:', blobErr.message);
          }
        }

        // Tier 2: Try disk/memory fallback
        loadFilesFromDisk();
        for (const testKey of lookupKeys) {
          const studentDocs = memoryFileStore.get(testKey) || memoryFileStore.get(testKey.toLowerCase());
          if (studentDocs && typeof studentDocs === 'object') {
            let docObj = studentDocs[docType];
            if (!docObj) {
              for (const [k, v] of Object.entries(studentDocs)) {
                if (normalizeDocType(k) === docType) {
                  docObj = v;
                  break;
                }
              }
            }
            if (docObj) {
              const rawData = typeof docObj === 'string' ? docObj : (docObj.data || docObj.file || '');
              if (rawData) {
                const mimeMatch = rawData.match(/^data:([^;]+);base64,(.+)$/);
                const contentType = mimeMatch ? mimeMatch[1] : 'application/pdf';
                const base64Data = mimeMatch ? mimeMatch[2] : rawData.replace(/^data:[^;]+;base64,/, '');
                const buf = Buffer.from(base64Data, 'base64');
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `inline; filename="${docType}.pdf"`);
                res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                return res.send(buf);
              }
            }
          }
        }

        return res.status(404).json({ error: 'File not found' });
      }

      // B. LIST ALL UPLOADED DOCS FOR THIS STUDENT
      const files = {};

      // Check Vercel Blob
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          for (const testKey of [key, ...lookupKeys]) {
            const strippedKey = normalizeKey(testKey);
            const { blobs } = await list({ prefix: `student-files/${strippedKey}/` });
            if (blobs && blobs.length > 0) {
              for (const blob of blobs) {
                const filename = blob.pathname.split('/').pop().replace(/\.pdf$/i, '');
                if (filename && !files[filename]) {
                  files[filename] = `/api/student-file?id=${encodeURIComponent(rawId)}&type=${encodeURIComponent(filename)}&raw=1`;
                }
              }
            }
          }
        } catch (blobListErr) {
          console.warn('[StudentFile] Vercel Blob list warning:', blobListErr.message);
        }
      }

      // Check Disk / Memory store
      loadFilesFromDisk();
      for (const testKey of lookupKeys) {
        const studentDocs = memoryFileStore.get(testKey) || memoryFileStore.get(testKey.toLowerCase());
        if (studentDocs && typeof studentDocs === 'object') {
          for (const [docName, docVal] of Object.entries(studentDocs)) {
            if (docVal && !files[docName]) {
              files[docName] = `/api/student-file?id=${encodeURIComponent(rawId)}&type=${encodeURIComponent(docName)}&raw=1`;
            }
          }
        }
      }

      return res.status(200).json({ ok: true, id: key, files });
    } catch (err) {
      console.error('[StudentFile] GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. UPLOAD PDF
  if (req.method === 'POST') {
    const { id, type, docType: altType, file, dataUrl, doc, lrn, studentNumber } = req.body || {};
    const rawId = id || lrn || studentNumber;
    const key = normalizeKey(rawId);
    const docType = normalizeDocType(type || altType);
    const rawData = file || dataUrl || (doc && doc.data);

    if (!key || !docType || !rawData) {
      return res.status(400).json({ error: 'Missing id, type, or file data' });
    }

    const lookupKeys = getLookupKeys(rawId, lrn, studentNumber);
    let blobUrl = null;

    // Tier 1: Upload to Vercel Blob with private access if token is present
    const mimeMatch = rawData.match(/^data:([^;]+);base64,(.+)$/);
    const contentType = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const ext = contentType.includes('png') ? 'png' : (contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'pdf');
    const base64Data = mimeMatch ? mimeMatch[2] : rawData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`student-files/${key}/${docType}.${ext}`, buffer, {
          access: 'private',
          contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        blobUrl = blob.url;
      } catch (blobPutErr) {
        console.warn('[StudentFile] Vercel Blob put warning (falling back to disk):', blobPutErr.message);
      }
    }

    // Tier 2: Always persist to disk and memory storage across all identifier keys
    const storedObj = typeof doc === 'object' && doc !== null ? { ...doc, data: rawData, type: contentType } : {
      name: `${docType}.${ext}`,
      type: contentType,
      data: rawData,
      size: 'Attached',
      dateUploaded: new Date().toISOString()
    };
      data: rawData,
      size: 'Attached',
      dateUploaded: new Date().toISOString()
    };
    saveFilesToDisk(lookupKeys, docType, storedObj);

    const secureUrl = `/api/student-file?id=${encodeURIComponent(rawId)}&type=${encodeURIComponent(docType)}&raw=1`;
    return res.status(200).json({ ok: true, url: secureUrl, blobUrl });
  }

  // 3. DELETE PDF
  if (req.method === 'DELETE') {
    const rawId = req.query.id || req.query.studentId;
    const key = normalizeKey(rawId);
    const docType = normalizeDocType(req.query.type);
    if (!key || !docType) return res.status(400).json({ error: 'Missing id or type' });

    const lookupKeys = getLookupKeys(rawId);
    saveFilesToDisk(lookupKeys, docType, null);
    return res.status(200).json({ ok: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
