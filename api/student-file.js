const fs = require('fs');
const path = require('path');
const os = require('os');

// In-memory cache for fast retrieval and serverless resilience
const memoryDocStore = new Map();

// Helper to determine persistent storage paths
function getStorageCandidates() {
    const list = [];
    try {
        const projectDataDir = path.resolve(__dirname, '..', 'data');
        if (!fs.existsSync(projectDataDir)) {
            fs.mkdirSync(projectDataDir, { recursive: true });
        }
        list.push(path.join(projectDataDir, 'student-files.json'));
    } catch (e) {
        // Ignored
    }

    try {
        const cwdDataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(cwdDataDir)) {
            fs.mkdirSync(cwdDataDir, { recursive: true });
        }
        list.push(path.join(cwdDataDir, 'student-files.json'));
    } catch (e) {
        // Ignored
    }

    try {
        list.push(path.join(os.tmpdir(), 'mdsj_student_files.json'));
    } catch (e) {
        // Ignored
    }

    return Array.from(new Set(list));
}

// Load documents from disk into memory cache
function loadDocsFromDisk() {
    const candidates = getStorageCandidates();
    for (const filePath of candidates) {
        try {
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(raw || '{}');
                if (parsed && typeof parsed === 'object') {
                    for (const [k, v] of Object.entries(parsed)) {
                        if (k && v && typeof v === 'object') {
                            const cleanKey = k.trim();
                            memoryDocStore.set(cleanKey, v);
                            memoryDocStore.set(cleanKey.toLowerCase(), v);
                        }
                    }
                }
            }
        } catch (e) {
            // Fallback non-blocking
        }
    }
}

// Persist documents from memory cache to disk
function saveDocsToDisk() {
    const obj = {};
    for (const [k, v] of memoryDocStore.entries()) {
        obj[k] = v;
    }
    const jsonStr = JSON.stringify(obj);

    const candidates = getStorageCandidates();
    let saved = false;
    for (const filePath of candidates) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, jsonStr, 'utf8');
            saved = true;
        } catch (e) {
            // Try next candidate
        }
    }
    return saved;
}

// Initial load
loadDocsFromDisk();

module.exports = async function studentFileHandler(req, res) {
    // Enable CORS for cross-device mobile scanners and local file browsing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url, `http://${host}`);

    // GET /api/student-file?id=...&type=...
    if (req.method === 'GET') {
        const queryId = parsedUrl.searchParams.get('id') || 
                        parsedUrl.searchParams.get('student') || 
                        parsedUrl.searchParams.get('lrn') || 
                        parsedUrl.searchParams.get('studentNumber');

        const docType = (parsedUrl.searchParams.get('type') || parsedUrl.searchParams.get('docType') || '').toLowerCase().trim();
        const wantRaw = parsedUrl.searchParams.get('raw') === '1' || 
                        parsedUrl.searchParams.get('download') === '1' ||
                        parsedUrl.searchParams.get('inline') === '1';

        if (!queryId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Missing student identifier (id, lrn, or studentNumber)' }));
        }

        const idClean = String(queryId).trim();
        const idLower = idClean.toLowerCase();
        const rawId = idClean.replace(/^STU-/i, '');
        const rawIdLower = rawId.toLowerCase();

        loadDocsFromDisk();

        let studentDocs = memoryDocStore.get(idClean) ||
                          memoryDocStore.get(idLower) ||
                          memoryDocStore.get(rawId) ||
                          memoryDocStore.get(rawIdLower) ||
                          memoryDocStore.get('STU-' + rawId) ||
                          memoryDocStore.get('stu-' + rawIdLower);

        if (!studentDocs) {
            for (const [k, v] of memoryDocStore.entries()) {
                const kLower = k.toLowerCase();
                if (kLower === idLower || kLower === rawIdLower || kLower === ('stu-' + rawIdLower)) {
                    studentDocs = v;
                    break;
                }
            }
        }

        if (!studentDocs || typeof studentDocs !== 'object') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'No documents found for student ' + idClean }));
        }

        // If specific document requested
        if (docType) {
            const docObj = studentDocs[docType] || 
                           studentDocs['view' + docType.charAt(0).toUpperCase() + docType.slice(1)] ||
                           studentDocs[docType + 'Doc'];

            if (!docObj || !docObj.data) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: `Document '${docType}' not found for student ${idClean}` }));
            }

            // Raw binary stream
            if (wantRaw) {
                try {
                    const match = docObj.data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                    if (match) {
                        const contentType = match[1] || 'application/pdf';
                        const buffer = Buffer.from(match[2], 'base64');
                        const fileName = encodeURIComponent(docObj.name || `${docType}.pdf`);
                        res.writeHead(200, {
                            'Content-Type': contentType,
                            'Content-Length': buffer.length,
                            'Content-Disposition': `inline; filename="${fileName}"`,
                            'Cache-Control': 'public, max-age=120, must-revalidate',
                            'Access-Control-Allow-Origin': '*'
                        });
                        return res.end(buffer);
                    }
                } catch (e) {
                    console.error('[StudentFile API] Decode error:', e);
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' });
            return res.end(JSON.stringify({
                success: true,
                id: idClean,
                docType: docType,
                doc: docObj,
                rawUrl: `/api/student-file?id=${encodeURIComponent(idClean)}&type=${encodeURIComponent(docType)}&raw=1`
            }));
        }

        // Return all documents for student
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' });
        return res.end(JSON.stringify({
            success: true,
            id: idClean,
            docs: studentDocs
        }));
    }

    // POST /api/student-file
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            // Limit payload to 15MB
            if (body.length > 15 * 1024 * 1024) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Payload too large (max 15MB)' }));
                req.destroy();
            }
        });

        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const id = payload.id ? String(payload.id).trim() : '';
                const lrn = payload.lrn ? String(payload.lrn).trim() : '';
                const studentNumber = payload.studentNumber ? String(payload.studentNumber).trim() : '';
                const docType = (payload.docType || '').toLowerCase().trim();
                const doc = payload.doc;

                if (!doc || !doc.data || !docType || (!id && !lrn && !studentNumber)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Valid doc object, docType, and at least one student identifier required' }));
                }

                // Register keys
                const keysToStore = new Set();
                const addPermutations = (val) => {
                    if (!val) return;
                    const c = String(val).trim();
                    keysToStore.add(c);
                    keysToStore.add(c.toLowerCase());
                    const raw = c.replace(/^STU-/i, '').trim();
                    if (raw) {
                        keysToStore.add(raw);
                        keysToStore.add(raw.toLowerCase());
                        keysToStore.add('STU-' + raw);
                        keysToStore.add('stu-' + raw.toLowerCase());
                    }
                };

                addPermutations(id);
                addPermutations(lrn);
                addPermutations(studentNumber);

                // Find or create student document collection
                let existingCollection = null;
                for (const k of keysToStore) {
                    if (memoryDocStore.has(k)) {
                        existingCollection = memoryDocStore.get(k);
                        break;
                    }
                }
                if (!existingCollection) {
                    existingCollection = {};
                }

                // Standardize docType key (e.g. birthcert, tor, card, escannexd, escannexf)
                existingCollection[docType] = {
                    data: doc.data,
                    name: doc.name || `${docType}.pdf`,
                    type: doc.type || 'application/pdf',
                    size: doc.size || 'Attached',
                    date: doc.date || new Date().toISOString()
                };

                for (const k of keysToStore) {
                    memoryDocStore.set(k, existingCollection);
                }

                saveDocsToDisk();
                console.log(`[StudentFile API] Persisted document '${docType}' for ${id || studentNumber || lrn}`);

                const primaryId = id || studentNumber || lrn;
                const rawUrl = `/api/student-file?id=${encodeURIComponent(primaryId)}&type=${encodeURIComponent(docType)}&raw=1`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    message: 'File persisted successfully',
                    id: primaryId,
                    docType: docType,
                    url: rawUrl,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error('[StudentFile API] Error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload', error: err.message }));
            }
        });
        return;
    }

    // DELETE /api/student-file
    if (req.method === 'DELETE') {
        const queryId = parsedUrl.searchParams.get('id') || 
                        parsedUrl.searchParams.get('student') || 
                        parsedUrl.searchParams.get('lrn');
        const docType = (parsedUrl.searchParams.get('type') || parsedUrl.searchParams.get('docType') || '').toLowerCase().trim();

        if (queryId) {
            const idClean = String(queryId).trim();
            const rawId = idClean.replace(/^STU-/i, '');
            const keys = [idClean, idClean.toLowerCase(), rawId, rawId.toLowerCase(), 'STU-' + rawId, 'stu-' + rawId.toLowerCase()];
            for (const k of keys) {
                if (memoryDocStore.has(k)) {
                    if (docType) {
                        const obj = memoryDocStore.get(k);
                        if (obj && obj[docType]) delete obj[docType];
                    } else {
                        memoryDocStore.delete(k);
                    }
                }
            }
            saveDocsToDisk();
            console.log(`[StudentFile API] Deleted document ${docType || 'all'} for ${idClean}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Document deleted successfully' }));
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
};
