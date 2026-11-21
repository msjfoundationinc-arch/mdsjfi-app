const fs = require('fs');
const path = require('path');
const os = require('os');

// In-memory cache for fast retrieval and serverless cold-start resilience
const memoryPhotoStore = new Map();

// Helper to determine persistent storage paths
function getStorageCandidates() {
    const list = [];
    try {
        const projectDataDir = path.resolve(__dirname, '..', 'data');
        if (!fs.existsSync(projectDataDir)) {
            fs.mkdirSync(projectDataDir, { recursive: true });
        }
        list.push(path.join(projectDataDir, 'student-photos.json'));
    } catch (e) {
        // Ignored if root is read-only
    }

    try {
        const cwdDataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(cwdDataDir)) {
            fs.mkdirSync(cwdDataDir, { recursive: true });
        }
        list.push(path.join(cwdDataDir, 'student-photos.json'));
    } catch (e) {
        // Ignored
    }

    try {
        list.push(path.join(os.tmpdir(), 'mdsj_student_photos.json'));
    } catch (e) {
        // Ignored
    }

    return Array.from(new Set(list));
}

// Load photos from disk into memory cache
function loadPhotosFromDisk() {
    const candidates = getStorageCandidates();
    for (const filePath of candidates) {
        try {
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(raw || '{}');
                if (parsed && typeof parsed === 'object') {
                    for (const [k, v] of Object.entries(parsed)) {
                        if (k && v && typeof v === 'string') {
                            const cleanKey = k.trim();
                            memoryPhotoStore.set(cleanKey, v);
                            memoryPhotoStore.set(cleanKey.toLowerCase(), v);
                        }
                    }
                }
            }
        } catch (e) {
            // Non-blocking fallback
        }
    }
}

// Persist photos from memory cache to disk
function savePhotosToDisk() {
    const obj = {};
    for (const [k, v] of memoryPhotoStore.entries()) {
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
            // Continue to next candidate
        }
    }
    return saved;
}

// Initial load
loadPhotosFromDisk();

module.exports = async function studentPhotoHandler(req, res) {
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

    // GET /api/student-photo?id=...
    if (req.method === 'GET') {
        const queryId = parsedUrl.searchParams.get('id') || 
                        parsedUrl.searchParams.get('student') || 
                        parsedUrl.searchParams.get('lrn') || 
                        parsedUrl.searchParams.get('studentNumber');

        const wantRawImage = parsedUrl.searchParams.get('img') === '1' ||
                             parsedUrl.searchParams.get('raw') === '1' ||
                             (req.headers.accept && req.headers.accept.includes('image/') && !req.headers.accept.includes('application/json'));

        if (!queryId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Missing student identifier (id, lrn, or studentNumber)' }));
        }

        const idClean = String(queryId).trim();
        const idLower = idClean.toLowerCase();
        const rawId = idClean.replace(/^STU-/i, '');
        const rawIdLower = rawId.toLowerCase();

        // Refresh cache from disk
        loadPhotosFromDisk();

        let photo = memoryPhotoStore.get(idClean) ||
                    memoryPhotoStore.get(idLower) ||
                    memoryPhotoStore.get(rawId) ||
                    memoryPhotoStore.get(rawIdLower) ||
                    memoryPhotoStore.get('STU-' + rawId) ||
                    memoryPhotoStore.get('stu-' + rawIdLower);

        if (!photo) {
            // Fuzzy search across keys
            for (const [key, val] of memoryPhotoStore.entries()) {
                const kLower = key.toLowerCase();
                if (kLower === idLower || kLower === rawIdLower || kLower === ('stu-' + rawIdLower)) {
                    photo = val;
                    break;
                }
            }
        }

        if (photo && typeof photo === 'string' && photo.length > 10) {
            // If raw image binary is requested (e.g. for direct <img src="..."> in mobile/QR views)
            if (wantRawImage) {
                try {
                    const match = photo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                    if (match) {
                        const contentType = match[1] || 'image/jpeg';
                        const buffer = Buffer.from(match[2], 'base64');
                        res.writeHead(200, {
                            'Content-Type': contentType,
                            'Content-Length': buffer.length,
                            'Cache-Control': 'public, max-age=120, must-revalidate',
                            'Access-Control-Allow-Origin': '*'
                        });
                        return res.end(buffer);
                    }
                } catch (e) {
                    // Fall back to JSON response
                }
            }

            // Return JSON payload
            const rawUrl = `/api/student-photo?id=${encodeURIComponent(idClean)}&img=1`;
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, must-revalidate'
            });
            return res.end(JSON.stringify({
                success: true,
                id: idClean,
                photo: photo,
                url: rawUrl
            }));
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Photo not found for student ' + idClean }));
    }

    // POST /api/student-photo
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            // Limit payload to 10MB
            if (body.length > 10 * 1024 * 1024) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Payload too large (max 10MB)' }));
                req.destroy();
            }
        });

        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const photo = payload.photo;
                const id = payload.id ? String(payload.id).trim() : '';
                const lrn = payload.lrn ? String(payload.lrn).trim() : '';
                const studentNumber = payload.studentNumber ? String(payload.studentNumber).trim() : '';

                if (!photo || (!id && !lrn && !studentNumber)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Valid photo and at least one student identifier required' }));
                }

                // Register keys across all normalized permutations
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

                for (const k of keysToStore) {
                    memoryPhotoStore.set(k, photo);
                }

                savePhotosToDisk();
                console.log(`[StudentPhoto API] Persisted photo for ${id || studentNumber || lrn} (${keysToStore.size} lookup keys)`);

                const primaryId = id || studentNumber || lrn;
                const rawUrl = `/api/student-photo?id=${encodeURIComponent(primaryId)}&img=1`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    message: 'Photo persisted successfully',
                    id: primaryId,
                    url: rawUrl,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error('[StudentPhoto API] Parse error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload', error: err.message }));
            }
        });
        return;
    }

    // DELETE /api/student-photo
    if (req.method === 'DELETE') {
        const queryId = parsedUrl.searchParams.get('id') || 
                        parsedUrl.searchParams.get('student') || 
                        parsedUrl.searchParams.get('lrn');

        if (queryId) {
            const idClean = String(queryId).trim();
            const rawId = idClean.replace(/^STU-/i, '');
            memoryPhotoStore.delete(idClean);
            memoryPhotoStore.delete(idClean.toLowerCase());
            memoryPhotoStore.delete(rawId);
            memoryPhotoStore.delete(rawId.toLowerCase());
            memoryPhotoStore.delete('STU-' + rawId);
            memoryPhotoStore.delete('stu-' + rawId.toLowerCase());
            savePhotosToDisk();
            console.log('[StudentPhoto API] Deleted photo for', idClean);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Photo deleted successfully' }));
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
};
