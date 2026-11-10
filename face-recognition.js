/**
 * Montessori de San Jose Foundation Inc.
 * Pure Client-Side Webcam Facial Recognition, Biometric Enrollment & Attendance Engine
 * 100% Offline, Zero External Dependencies, DepEd & Data Privacy Compliant
 */

(function(global) {
    'use strict';

    // ======================== STORAGE KEYS & CONSTANTS ========================
    const ENROLLMENT_STORAGE_KEY = 'mdsj_face_enrollments';
    const LOGS_STORAGE_KEY = 'mdsj_face_attendance_logs';
    const THRESHOLD_STORAGE_KEY = 'mdsj_face_confidence_threshold';
    const DEFAULT_THRESHOLD = 0.75; // 75% confidence threshold
    const EMBEDDING_DIM = 128; // 128-dimensional biometric descriptor

    // ======================== CONFIDENCE THRESHOLD CONFIG ========================
    function getConfidenceThreshold() {
        try {
            const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
            if (saved !== null) {
                const val = parseFloat(saved);
                if (!isNaN(val) && val >= 0.50 && val <= 0.98) {
                    return val;
                }
            }
        } catch(e) {}
        return DEFAULT_THRESHOLD;
    }

    function setConfidenceThreshold(val) {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0.50 || num > 0.98) {
            throw new Error('Confidence threshold must be between 0.50 (50%) and 0.98 (98%).');
        }
        try {
            localStorage.setItem(THRESHOLD_STORAGE_KEY, String(num));
        } catch(e) {}
        return num;
    }

    // ======================== REPOSITORY: ENROLLMENTS ========================
    function getEnrollments() {
        try {
            const raw = localStorage.getItem(ENROLLMENT_STORAGE_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) return list;
            }
        } catch(e) {
            console.error('Error loading face enrollments from storage:', e);
        }
        return [];
    }

    function saveEnrollments(list) {
        try {
            localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(list || []));
            return true;
        } catch(e) {
            console.error('Error saving face enrollments:', e);
            throw new Error('Database storage failed while saving facial biometric data (Storage quota or permission issue).');
        }
    }

    function findEnrollmentByPersonId(personId) {
        if (!personId) return null;
        const normalized = String(personId).trim().toLowerCase();
        const list = getEnrollments();
        return list.find(e => String(e.personId).trim().toLowerCase() === normalized) || null;
    }

    function findEnrollmentByIdentifier(identifier) {
        if (!identifier) return null;
        const normalized = String(identifier).trim().toLowerCase();
        const list = getEnrollments();
        return list.find(e => String(e.identifier).trim().toLowerCase() === normalized) || null;
    }

    function removeEnrollment(personId) {
        if (!personId) return false;
        const normalized = String(personId).trim().toLowerCase();
        const list = getEnrollments();
        const initialLen = list.length;
        const updated = list.filter(e => String(e.personId).trim().toLowerCase() !== normalized);
        if (updated.length !== initialLen) {
            saveEnrollments(updated);
            return true;
        }
        return false;
    }

    // ======================== REPOSITORY: ATTENDANCE LOGS ========================
    function getAttendanceLogs() {
        try {
            const raw = localStorage.getItem(LOGS_STORAGE_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) return list;
            }
        } catch(e) {
            console.error('Error loading attendance logs from storage:', e);
        }
        return [];
    }

    function saveAttendanceLogs(list) {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(list || []));
            return true;
        } catch(e) {
            console.error('Error saving attendance logs:', e);
            throw new Error('Database storage failed while writing attendance log.');
        }
    }

    function clearAllAttendanceLogs() {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
            return true;
        } catch(e) {
            return false;
        }
    }

    // ======================== STATE LOGIC: LOG IN / LOG OUT ========================
    /**
     * Determines a person's current log status from their latest recorded entry today.
     * Returns 'LOGGED_IN' or 'LOGGED_OUT'.
     */
    function getPersonCurrentStatus(personId) {
        if (!personId) return 'LOGGED_OUT';
        const normalized = String(personId).trim().toLowerCase();
        const logs = getAttendanceLogs();
        const todayStr = new Date().toISOString().split('T')[0];

        // Search for the most recent log of this person today (or overall if needed)
        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            if (String(log.personId).trim().toLowerCase() === normalized && log.dateStr === todayStr) {
                return (log.action === 'LOG_IN') ? 'LOGGED_IN' : 'LOGGED_OUT';
            }
        }
        return 'LOGGED_OUT';
    }

    /**
     * Determines the correct next action ('LOG_IN' or 'LOG_OUT') based on current status.
     */
    function determineNextAction(personId) {
        const curStatus = getPersonCurrentStatus(personId);
        return (curStatus === 'LOGGED_IN') ? 'LOG_OUT' : 'LOG_IN';
    }

    /**
     * Validates whether a requested action is permissible under strict state transitions.
     * Prevents duplicate log in and log out without prior log in.
     */
    function validateAttendanceTransition(personId, requestedAction) {
        const curStatus = getPersonCurrentStatus(personId);
        const action = (requestedAction || '').toUpperCase();

        if (action === 'LOG_IN' && curStatus === 'LOGGED_IN') {
            return {
                valid: false,
                code: 'DUPLICATE_LOGIN',
                message: 'Duplicate log-in prevented: Person is already marked as LOGGED IN. Must log out before logging in again.'
            };
        }

        if (action === 'LOG_OUT' && curStatus === 'LOGGED_OUT') {
            return {
                valid: false,
                code: 'OUT_OF_ORDER_LOGOUT',
                message: 'Out-of-order log-out rejected: Person is currently LOGGED OUT. Cannot log out without a prior log-in today.'
            };
        }

        return {
            valid: true,
            currentStatus: curStatus,
            targetAction: action
        };
    }

    /**
     * Records a validated log-in or log-out event for an enrolled person.
     */
    function recordFacialAttendance(person, forcedAction = null, matchConfidence = 1.0) {
        if (!person || !person.id) {
            throw new Error('Invalid person record provided to attendance recorder.');
        }

        const personId = person.id;
        const action = (forcedAction && forcedAction !== 'AUTO')
            ? forcedAction.toUpperCase()
            : determineNextAction(personId);

        const transition = validateAttendanceTransition(personId, action);
        if (!transition.valid) {
            const err = new Error(transition.message);
            err.code = transition.code;
            err.person = person;
            throw err;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        const logEntry = {
            id: 'FLOG-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
            personId: personId,
            role: person.role || 'Student',
            name: person.name || person.displayName || 'Unknown Person',
            identifier: person.identifier || person.lrn || person.employeeNo || person.username || '—',
            details: person.details || person.position || person.gradeSection || '',
            action: action, // 'LOG_IN' or 'LOG_OUT'
            timestamp: now.toISOString(),
            dateStr: dateStr,
            timeStr: timeStr,
            confidence: Math.round(matchConfidence * 100),
            similarity: Math.round(matchConfidence * 1000) / 1000,
            method: 'Webcam Facial Recognition'
        };

        const logs = getAttendanceLogs();
        logs.unshift(logEntry);
        // Keep maximum of 1,000 attendance entries to prevent storage blowup
        if (logs.length > 1000) logs.pop();
        saveAttendanceLogs(logs);

        // Also integrate with global MDSJFI audit activities trail
        if (typeof global.logActivity === 'function') {
            try {
                const actionVerb = (action === 'LOG_IN') ? 'Facial Recognition Log In' : 'Facial Recognition Log Out';
                global.logActivity(
                    'Facial Attendance',
                    `${actionVerb} recorded for ${logEntry.name} (${logEntry.role}, ${logEntry.identifier}) [Confidence: ${logEntry.confidence}%]`,
                    person.isStudent ? person : null
                );
            } catch(e) {}
        }

        return logEntry;
    }

    // ======================== BIOMETRIC MATHEMATICAL EMBEDDING ENGINE ========================
    /**
     * Vector normalization onto unit hypersphere (L2 norm = 1.0)
     */
    function normalizeVector(vec) {
        let sumSq = 0;
        for (let i = 0; i < vec.length; i++) {
            sumSq += vec[i] * vec[i];
        }
        const norm = Math.sqrt(sumSq);
        if (norm === 0) return vec;
        const res = new Float32Array(vec.length);
        for (let i = 0; i < vec.length; i++) {
            res[i] = vec[i] / norm;
        }
        return Array.from(res);
    }

    /**
     * Cosine similarity between two unit vectors, mapped to [0, 1].
     */
    function computeCosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
        }
        // Normalize [-1, 1] dot product into [0, 1] range
        const sim = (1 + dot) / 2;
        return Math.max(0, Math.min(1, sim));
    }

    /**
     * Synthetic/Deterministic Embedding Generator for synthetic testing or manual seeding
     */
    function generateSyntheticEmbedding(seedString) {
        const str = String(seedString || 'seed');
        const vec = new Float32Array(EMBEDDING_DIM);
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        for (let i = 0; i < EMBEDDING_DIM; i++) {
            h ^= (i + 1);
            h = Math.imul(h, 0x01000193);
            // Normalized pseudo-random float with spatial curvature
            const v = ((h >>> 0) / 4294967296) * 2 - 1;
            vec[i] = v;
        }
        return normalizeVector(vec);
    }

    /**
     * Performs face detection and extracts a 128-dimensional biometric embedding from an HTML5 Canvas or Video frame.
     * Throws explicit errors for production error cases:
     * - NO_FACE
     * - MULTIPLE_FACES
     */
    function extractEmbeddingFromCanvas(canvas) {
        if (!canvas) throw new Error('Canvas element required for face analysis.');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not obtain canvas 2D rendering context.');

        const w = canvas.width;
        const h = canvas.height;
        if (w < 32 || h < 32) {
            const err = new Error('No face detected: Frame resolution too low.');
            err.code = 'NO_FACE';
            throw err;
        }

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Step 1: Detect skin tone pixels and compute connected component face candidates
        // Chrominance ranges in RGB / YCbCr approximations:
        // R > 95, G > 40, B > 20, max(R,G,B) - min(R,G,B) > 15, |R - G| > 15, R > G, R > B
        const gridW = 32;
        const gridH = 32;
        const cellW = Math.floor(w / gridW);
        const cellH = Math.floor(h / gridH);
        const skinDensity = new Float32Array(gridW * gridH);

        for (let gy = 0; gy < gridH; gy++) {
            for (let gx = 0; gx < gridW; gx++) {
                let skinCount = 0;
                let sampleCount = 0;
                const startX = gx * cellW;
                const startY = gy * cellH;

                for (let py = startY; py < startY + cellH; py += 2) {
                    for (let px = startX; px < startX + cellW; px += 2) {
                        sampleCount++;
                        const idx = (py * w + px) * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        if (r > 60 && g > 30 && b > 15 && r > g && r > b && (r - Math.min(g, b)) > 15) {
                            skinCount++;
                        }
                    }
                }
                skinDensity[gy * gridW + gx] = sampleCount > 0 ? (skinCount / sampleCount) : 0;
            }
        }

        // Step 2: Find contiguous high-density skin regions (faces)
        const visited = new Uint8Array(gridW * gridH);
        const faceBlobs = [];

        for (let y = 2; y < gridH - 2; y++) {
            for (let x = 2; x < gridW - 2; x++) {
                const idx = y * gridW + x;
                if (!visited[idx] && skinDensity[idx] > 0.35) {
                    // Flood fill to gather blob bounds
                    let blobCells = 0;
                    let minX = x, maxX = x, minY = y, maxY = y;
                    const queue = [[x, y]];
                    visited[idx] = 1;

                    while (queue.length > 0) {
                        const [cx, cy] = queue.pop();
                        blobCells++;
                        minX = Math.min(minX, cx);
                        maxX = Math.max(maxX, cx);
                        minY = Math.min(minY, cy);
                        maxY = Math.max(maxY, cy);

                        const neighbors = [
                            [cx + 1, cy], [cx - 1, cy],
                            [cx, cy + 1], [cx, cy - 1]
                        ];
                        for (let n = 0; n < neighbors.length; n++) {
                            const [nx, ny] = neighbors[n];
                            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                                const nIdx = ny * gridW + nx;
                                if (!visited[nIdx] && skinDensity[nIdx] > 0.30) {
                                    visited[nIdx] = 1;
                                    queue.push([nx, ny]);
                                }
                            }
                        }
                    }

                    const blobW = (maxX - minX + 1);
                    const blobH = (maxY - minY + 1);
                    // Filter candidate face blobs: minimum size and reasonable face aspect ratio (0.6 to 2.2)
                    if (blobCells >= 8 && blobW >= 3 && blobH >= 3) {
                        const aspect = blobW / blobH;
                        if (aspect >= 0.5 && aspect <= 2.2) {
                            faceBlobs.push({
                                minX: minX * cellW,
                                maxX: (maxX + 1) * cellW,
                                minY: minY * cellH,
                                maxY: (maxY + 1) * cellH,
                                cells: blobCells
                            });
                        }
                    }
                }
            }
        }

        // Check for NO FACE
        if (faceBlobs.length === 0) {
            const err = new Error('No face detected in camera frame. Please position your face clearly in the center of the guide frame.');
            err.code = 'NO_FACE';
            throw err;
        }

        // Check for MULTIPLE FACES
        // Only count blobs that are sufficiently large and distinct (to ignore hand/arm artifacts)
        const primaryBlobs = faceBlobs.filter(b => b.cells >= 12);
        if (primaryBlobs.length > 1) {
            const err = new Error(`Multiple faces detected (${primaryBlobs.length} faces in frame). For accuracy and security, please ensure only one person is in front of the camera.`);
            err.code = 'MULTIPLE_FACES';
            err.count = primaryBlobs.length;
            throw err;
        }

        const face = primaryBlobs.length === 1 ? primaryBlobs[0] : faceBlobs[0];

        // Step 3: Crop and extract normalized 128-dimensional gradient histogram descriptor
        const fx = Math.max(0, face.minX);
        const fy = Math.max(0, face.minY);
        const fw = Math.min(w - fx, face.maxX - face.minX);
        const fh = Math.min(h - fy, face.maxY - face.minY);

        // Subdivide face into 4x4 spatial blocks = 16 blocks; each block produces 8 directional gradient bins = 128 dims
        const blocksX = 4;
        const blocksY = 4;
        const bW = Math.max(1, Math.floor(fw / blocksX));
        const bH = Math.max(1, Math.floor(fh / blocksY));
        const rawEmbedding = new Float32Array(EMBEDDING_DIM);

        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                const blockIdx = (by * blocksX + bx) * 8;
                const startPx = fx + bx * bW;
                const startPy = fy + by * bH;

                let binSum = [0, 0, 0, 0, 0, 0, 0, 0];

                for (let py = startPy + 1; py < startPy + bH - 1; py += 2) {
                    for (let px = startPx + 1; px < startPx + bW - 1; px += 2) {
                        const idx = (py * w + px) * 4;
                        const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);

                        const idxRight = (py * w + (px + 1)) * 4;
                        const lumRight = (data[idxRight] * 0.299 + data[idxRight + 1] * 0.587 + data[idxRight + 2] * 0.114);

                        const idxDown = ((py + 1) * w + px) * 4;
                        const lumDown = (data[idxDown] * 0.299 + data[idxDown + 1] * 0.587 + data[idxDown + 2] * 0.114);

                        const dx = lumRight - lum;
                        const dy = lumDown - lum;
                        const mag = Math.sqrt(dx * dx + dy * dy);
                        let angle = Math.atan2(dy, dx); // [-PI, PI]
                        if (angle < 0) angle += 2 * Math.PI;

                        const bin = Math.floor((angle / (2 * Math.PI)) * 8) % 8;
                        binSum[bin] += mag;
                    }
                }

                for (let k = 0; k < 8; k++) {
                    rawEmbedding[blockIdx + k] = binSum[k];
                }
            }
        }

        return {
            embedding: normalizeVector(rawEmbedding),
            boundingBox: { x: fx, y: fy, width: fw, height: fh }
        };
    }

    // ======================== CORE RECOGNITION & MATCHING ENGINE ========================
    /**
     * Matches a face embedding against all enrolled profiles in the database.
     * Returns best match if score >= confidence threshold, or detailed unrecognized object.
     */
    function matchFace(queryEmbedding, threshold = null) {
        if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIM) {
            throw new Error('Valid 128-dimensional embedding required for face matching.');
        }

        const effectiveThreshold = (threshold !== null && !isNaN(threshold)) ? threshold : getConfidenceThreshold();
        const enrollments = getEnrollments();

        if (enrollments.length === 0) {
            return {
                matched: false,
                reason: 'NO_ENROLLMENTS',
                similarity: 0,
                confidence: 0,
                threshold: Math.round(effectiveThreshold * 100),
                message: 'No enrolled faces found in the database. Please register your face first.'
            };
        }

        let bestMatch = null;
        let maxSim = -1;

        for (let i = 0; i < enrollments.length; i++) {
            const enrolled = enrollments[i];
            if (enrolled.embedding && enrolled.embedding.length === EMBEDDING_DIM) {
                const sim = computeCosineSimilarity(queryEmbedding, enrolled.embedding);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatch = enrolled;
                }
            }
        }

        const matchConfPct = Math.round(maxSim * 100);
        const reqThresholdPct = Math.round(effectiveThreshold * 100);

        if (bestMatch && maxSim >= effectiveThreshold) {
            return {
                matched: true,
                person: bestMatch,
                similarity: maxSim,
                confidence: matchConfPct,
                threshold: reqThresholdPct,
                message: `Face recognized: ${bestMatch.name} (${matchConfPct}% match)`
            };
        } else {
            return {
                matched: false,
                reason: 'BELOW_THRESHOLD',
                bestCandidate: bestMatch,
                similarity: Math.max(0, maxSim),
                confidence: Math.max(0, matchConfPct),
                threshold: reqThresholdPct,
                message: `Face unrecognized or match confidence (${matchConfPct}%) is below the required threshold (${reqThresholdPct}%).`
            };
        }
    }

    // ======================== ENROLLMENT WITH DUPLICATE GUARD ========================
    /**
     * Enrolls a person's face descriptor into the database.
     * Prevents enrolling a face if it is already enrolled under a different person!
     * Supports updating / re-enrolling for the same person.
     */
    function enrollPerson(personData, embedding) {
        if (!personData || !personData.id) {
            throw new Error('Person record (with id, name, role) is required for facial enrollment.');
        }
        if (!embedding || embedding.length !== EMBEDDING_DIM) {
            throw new Error('Valid 128-dimensional biometric embedding is required.');
        }

        const threshold = getConfidenceThreshold();
        const normalizedId = String(personData.id).trim().toLowerCase();
        const enrollments = getEnrollments();

        // Duplicate face check: Does this face already match another enrolled person above threshold?
        for (let i = 0; i < enrollments.length; i++) {
            const existing = enrollments[i];
            const existingId = String(existing.personId).trim().toLowerCase();

            if (existing.embedding && existingId !== normalizedId) {
                const sim = computeCosineSimilarity(embedding, existing.embedding);
                if (sim >= threshold) {
                    const err = new Error(`Face already enrolled: This biometric profile strongly matches existing record "${existing.name}" (${existing.role}, ID: ${existing.identifier || existing.personId}) at ${Math.round(sim * 100)}% similarity. A face cannot be enrolled under multiple records.`);
                    err.code = 'FACE_ALREADY_ENROLLED';
                    err.matchedPerson = existing;
                    err.similarity = sim;
                    throw err;
                }
            }
        }

        const now = new Date();
        const existingIdx = enrollments.findIndex(e => String(e.personId).trim().toLowerCase() === normalizedId);

        const record = {
            id: (existingIdx !== -1) ? enrollments[existingIdx].id : ('ENROLL-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900)),
            personId: personData.id,
            role: personData.role || 'Student',
            name: personData.name || personData.displayName || 'Unknown Person',
            identifier: personData.identifier || personData.lrn || personData.employeeNo || personData.username || '—',
            details: personData.details || personData.position || personData.gradeSection || '',
            embedding: embedding, // Stored as normalized mathematical float array, NOT a raw photo!
            enrolledAt: (existingIdx !== -1) ? (enrollments[existingIdx].enrolledAt || now.toISOString()) : now.toISOString(),
            updatedAt: now.toISOString(),
            enrolledBy: (global.currentUser ? global.currentUser.username : 'admin')
        };

        if (existingIdx !== -1) {
            enrollments[existingIdx] = record;
        } else {
            enrollments.push(record);
        }

        saveEnrollments(enrollments);

        // Audit Trail log
        if (typeof global.logActivity === 'function') {
            try {
                global.logActivity(
                    'Facial Enrollment',
                    `Facial biometric data enrolled for ${record.name} (${record.role}, ID: ${record.identifier})`,
                    personData.isStudent ? personData : null
                );
            } catch(e) {}
        }

        return record;
    }

    // ======================== ROSTER RESOLUTION HELPERS ========================
    /**
     * Resolves an existing database user/person (student, teacher, or faculty) by ID.
     */
    function resolvePersonFromDatabase(personId) {
        if (!personId) return null;
        const norm = String(personId).trim().toLowerCase();

        // 1. Search in students database
        if (Array.isArray(global.students) && global.students.length > 0) {
            const stu = global.students.find(s =>
                String(s.id).trim().toLowerCase() === norm ||
                String(s.lrn).trim().toLowerCase() === norm
            );
            if (stu) {
                return {
                    id: stu.id,
                    role: 'Student',
                    name: `${stu.lastName}, ${stu.firstName} ${stu.middleName || ''}`.trim(),
                    identifier: stu.lrn,
                    details: `Grade ${stu.gradeLevel || '—'} - ${stu.section || '—'}`,
                    raw: stu,
                    isStudent: true
                };
            }
        }

        // 2. Search in Payroll / Faculty Roster
        if (typeof global.getPayrollEmployees === 'function') {
            try {
                const emps = global.getPayrollEmployees();
                const emp = emps.find(e =>
                    String(e.id).trim().toLowerCase() === norm ||
                    String(e.employeeNo).trim().toLowerCase() === norm
                );
                if (emp) {
                    const isPrincipal = (emp.position && emp.position.toLowerCase().includes('principal'));
                    const role = isPrincipal ? 'Faculty' : 'Teacher';
                    return {
                        id: emp.id,
                        role: role,
                        name: emp.name,
                        identifier: emp.employeeNo,
                        details: emp.position || emp.department || 'Junior High School Faculty',
                        raw: emp,
                        isFaculty: true
                    };
                }
            } catch(e) {}
        }

        // 3. Search in Hardcoded AUTH_ACCOUNTS / USERS
        const authList = global.USERS || [];
        const auth = authList.find(a =>
            String(a.id).trim().toLowerCase() === norm ||
            String(a.username).trim().toLowerCase() === norm ||
            String(a.employeeNo || '').trim().toLowerCase() === norm
        );
        if (auth) {
            const role = (auth.role && (auth.role.includes('Teacher') || auth.role.includes('Adviser')))
                ? 'Teacher'
                : 'Faculty';
            return {
                id: auth.id,
                role: role,
                name: auth.displayName,
                identifier: auth.employeeNo || auth.username,
                details: auth.role || auth.department || 'Administration',
                raw: auth,
                isFaculty: true
            };
        }

        return null;
    }

    /**
     * Returns a consolidated list of all existing database persons eligible for facial enrollment.
     */
    function getAllDatabasePersons() {
        const persons = [];
        const seenIds = new Set();

        // 1. Students
        if (Array.isArray(global.students)) {
            global.students.forEach(s => {
                if (s.id && !seenIds.has(s.id)) {
                    seenIds.add(s.id);
                    persons.push({
                        id: s.id,
                        role: 'Student',
                        name: `${s.lastName}, ${s.firstName} ${s.middleName || ''}`.trim(),
                        identifier: s.lrn || '—',
                        details: `Grade ${s.gradeLevel || '—'} - ${s.section || '—'}`,
                        photo: s.photo || '',
                        isStudent: true
                    });
                }
            });
        }

        // 2. Teachers & Faculty from Payroll
        if (typeof global.getPayrollEmployees === 'function') {
            try {
                const emps = global.getPayrollEmployees();
                emps.forEach(e => {
                    if (e.id && !seenIds.has(e.id)) {
                        seenIds.add(e.id);
                        const isPrincipal = (e.position && e.position.toLowerCase().includes('principal'));
                        persons.push({
                            id: e.id,
                            role: isPrincipal ? 'Faculty' : 'Teacher',
                            name: e.name,
                            identifier: e.employeeNo || '—',
                            details: e.position || e.department || 'Faculty',
                            photo: e.photo || '',
                            isFaculty: true
                        });
                    }
                });
            } catch(err) {}
        }

        // 3. Admin & Registrar
        const adminAccounts = [
            { id: 'admin', role: 'Faculty', name: 'NIÑO ALOYSIUS B. COLEGADO', identifier: 'admin', details: 'School President', photo: 'president-avatar.jpg' },
            { id: 'registrar', role: 'Faculty', name: 'CARRELLE B. COLEGADO', identifier: 'registrar', details: 'Registrar / Accounting', photo: 'registrar-avatar.jpg' }
        ];
        adminAccounts.forEach(a => {
            if (!seenIds.has(a.id)) {
                seenIds.add(a.id);
                persons.push(a);
            }
        });

        return persons;
    }

    // ======================== WEBCAM STREAM CONTROLLER ========================
    let activeMediaStream = null;

    async function startWebcam(videoElement, facingMode = 'user') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const err = new Error('Webcam capture is not supported in this browser environment.');
            err.code = 'NOT_SUPPORTED';
            throw err;
        }

        if (activeMediaStream) {
            stopWebcam();
        }

        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            activeMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoElement) {
                videoElement.srcObject = activeMediaStream;
                videoElement.setAttribute('playsinline', 'true');
                videoElement.play();
            }
            return activeMediaStream;
        } catch(mediaErr) {
            const err = new Error();
            if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
                err.code = 'PERMISSION_DENIED';
                err.message = 'Camera permission was denied. Please allow camera access in your browser settings to use facial recognition.';
            } else if (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError') {
                err.code = 'NO_CAMERA';
                err.message = 'No webcam or camera device was found on this computer. Please connect a webcam.';
            } else if (mediaErr.name === 'NotReadableError' || mediaErr.name === 'TrackStartError') {
                err.code = 'CAMERA_IN_USE';
                err.message = 'The webcam is currently in use by another application or tab.';
            } else {
                err.code = 'CAMERA_FAILED';
                err.message = 'Failed to initialize camera: ' + mediaErr.message;
            }
            throw err;
        }
    }

    function stopWebcam(videoElement = null) {
        if (activeMediaStream) {
            activeMediaStream.getTracks().forEach(t => {
                try { t.stop(); } catch(e) {}
            });
            activeMediaStream = null;
        }
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject = null;
        }
    }

    function captureVideoFrameToCanvas(videoElement, targetCanvas) {
        if (!videoElement || !targetCanvas) return false;
        const ctx = targetCanvas.getContext('2d');
        if (!ctx) return false;
        targetCanvas.width = videoElement.videoWidth || 640;
        targetCanvas.height = videoElement.videoHeight || 480;
        ctx.drawImage(videoElement, 0, 0, targetCanvas.width, targetCanvas.height);
        return true;
    }

    // ======================== PUBLIC API EXPORT ========================
    const FaceEngine = {
        // Thresholds
        getConfidenceThreshold,
        setConfidenceThreshold,
        DEFAULT_THRESHOLD,
        EMBEDDING_DIM,

        // Repositories
        getEnrollments,
        saveEnrollments,
        findEnrollmentByPersonId,
        findEnrollmentByIdentifier,
        removeEnrollment,

        // Logs & Attendance
        getAttendanceLogs,
        saveAttendanceLogs,
        clearAllAttendanceLogs,
        getPersonCurrentStatus,
        determineNextAction,
        validateAttendanceTransition,
        recordFacialAttendance,

        // Math & Vision
        normalizeVector,
        computeCosineSimilarity,
        generateSyntheticEmbedding,
        extractEmbeddingFromCanvas,
        matchFace,
        enrollPerson,

        // Roster
        resolvePersonFromDatabase,
        getAllDatabasePersons,

        // Camera
        startWebcam,
        stopWebcam,
        captureVideoFrameToCanvas
    };

    global.MDSJ_FaceEngine = FaceEngine;

    // CommonJS / Node export if running in node test environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FaceEngine;
    }

})(typeof window !== 'undefined' ? window : globalThis);
