const fs = require('fs');
const path = require('path');
const os = require('os');

// In-memory cache for fast retrieval and serverless cold-start resilience
const memoryPhotoStore = new Map();

// Helper to determine persistent storage path
function getStoragePath() {
    // 1. Try local project directory 'data/student-photos.json'
    const projectDataDir = path.resolve(process.cwd(), 'data');
    try {
        if (!fs.existsSync(projectDataDir)) {
            fs.mkdirSync(projectDataDir, { recursive: true });
        }
        return path.join(projectDataDir, 'student-photos.json');
    } catch (e) {
        // 2. Fall back to OS temp directory (e.g., in Vercel serverless /tmp)
        const tmpDir = os.tmpdir();
        return path.join(tmpDir, 'mdsj_student_photos.json');
    }
}

// Load photos from disk into memory cache
function loadPhotosFromDisk() {
    try {
        const filePath = getStoragePath();
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                for (const [k, v] of Object.entries(parsed)) {
                    if (k && v && typeof v === 'string') {
                        memoryPhotoStore.set(k.trim().toLowerCase(), v);
                        memoryPhotoStore.set(k.trim(), v);
                    }
                }
            }
        }
    } catch (e) {
        // Non-blocking fallback to in-memory store
    }
}

// Persist photos from memory cache to disk
function savePhotosToDisk() {
    try {
        const filePath = getStoragePath();
        const obj = {};
        for (const [k, v] of memoryPhotoStore.entries()) {
            obj[k] = v;
        }
        fs.writeFileSync(filePath, JSON.stringify(obj), 'utf8');
    } catch (e) {
        // Non-blocking fallback
    }
}

// Initial load
loadPhotosFromDisk();

module.exports = async function studentPhotoHandler(req, res) {
    // Enable CORS for cross-device mobile scanners and local file browsing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url, `http://${host}`);
    const pathname = parsedUrl.pathname;

    // GET /api/student-photo?id=...
    if (req.method === 'GET') {
        const queryId = parsedUrl.searchParams.get('id') || 
                        parsedUrl.searchParams.get('student') || 
                        parsedUrl.searchParams.get('lrn') || 
                        parsedUrl.searchParams.get('studentNumber');

        if (!queryId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Missing student identifier (id, lrn, or studentNumber)' }));
        }

        const idClean = String(queryId).trim();
        const idLower = idClean.toLowerCase();
        const rawId = idClean.replace(/^STU-/i, '');
        const rawIdLower = rawId.toLowerCase();

        // Check in-memory store and re-check disk if needed
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
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            });
            return res.end(JSON.stringify({
                success: true,
                id: idClean,
                photo: photo
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
            // Prevent payload exceeding 10MB
            if (body.length > 10 * 1024 * 1024) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Payload too large' }));
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

                // Register keys in memory
                const keysToStore = [];
                if (id) {
                    keysToStore.push(id, id.toLowerCase());
                    const raw = id.replace(/^STU-/i, '');
                    keysToStore.push(raw, raw.toLowerCase(), 'STU-' + raw, 'stu-' + raw.toLowerCase());
                }
                if (lrn) {
                    keysToStore.push(lrn, lrn.toLowerCase());
                }
                if (studentNumber) {
                    keysToStore.push(studentNumber, studentNumber.toLowerCase(), 'STU-' + studentNumber);
                }

                for (const k of keysToStore) {
                    memoryPhotoStore.set(k, photo);
                }

                savePhotosToDisk();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    message: 'Photo persisted successfully',
                    id: id || studentNumber || lrn
                }));
            } catch (err) {
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
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Photo deleted successfully' }));
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
};
