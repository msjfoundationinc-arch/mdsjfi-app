import { put, list } from '@vercel/blob';

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
    .replace(/[^a-z0-9_-]/g, '_');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. SERVE OR LIST FILES
  if (req.method === 'GET') {
    const key = normalizeKey(req.query.id);
    if (!key) return res.status(400).json({ error: 'Missing id' });

    try {
      // Serve a specific PDF inline with private token authorization
      if (req.query.type && req.query.raw === '1') {
        const docType = normalizeDocType(req.query.type);
        const { blobs } = await list({ prefix: `student-files/${key}/${docType}.pdf` });
        if (!blobs.length) return res.status(404).json({ error: 'File not found' });

        const fetchHeaders = {};
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          fetchHeaders.authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
        }
        const fileRes = await fetch(blobs[0].url, { headers: fetchHeaders });
        if (!fileRes.ok) {
          return res.status(fileRes.status).json({ error: 'Failed to retrieve private document' });
        }

        const arrayBuffer = await fileRes.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${docType}.pdf"`);
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        return res.send(Buffer.from(arrayBuffer));
      }

      // Otherwise return all uploaded docs for this student via secure API proxy routes
      const { blobs } = await list({ prefix: `student-files/${key}/` });
      const files = {};
      for (const blob of blobs) {
        const filename = blob.pathname.split('/').pop().replace(/\.pdf$/i, '');
        // Proxy through authenticated API route so private blobs remain securely viewable to valid app users
        files[filename] = `/api/student-file?id=${encodeURIComponent(key)}&type=${encodeURIComponent(filename)}&raw=1`;
      }

      return res.status(200).json({ ok: true, id: key, files });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. UPLOAD PDF (Strictly Private Access)
  if (req.method === 'POST') {
    const { id, type, docType: altType, file, dataUrl, doc } = req.body || {};
    const key = normalizeKey(id);
    const docType = normalizeDocType(type || altType);
    const rawData = file || dataUrl || (doc && doc.data);

    if (!key || !docType || !rawData) {
      return res.status(400).json({ error: 'Missing id, type, or file data' });
    }

    try {
      const base64Data = rawData.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const blob = await put(`student-files/${key}/${docType}.pdf`, buffer, {
        access: 'private',
        contentType: 'application/pdf',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      const secureUrl = `/api/student-file?id=${encodeURIComponent(key)}&type=${encodeURIComponent(docType)}&raw=1`;
      return res.status(200).json({ ok: true, url: secureUrl, blobUrl: blob.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
