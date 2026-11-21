const http = require('http');
const fs = require('fs');
const path = require('path');
const sendAlertHandler = require('./api/send-alert.js');
let studentPhotoHandler = null;
(async () => {
    try {
        const mod = await import('./api/student-photo.js');
        studentPhotoHandler = mod.default || mod;
    } catch (e) {
        try {
            studentPhotoHandler = require('./api/student-photo.js');
            if (studentPhotoHandler && studentPhotoHandler.default) {
                studentPhotoHandler = studentPhotoHandler.default;
            }
        } catch (err) {}
    }
})();
let studentFileHandler = null;
(async () => {
    try {
        const mod = await import('./api/student-file.js');
        studentFileHandler = mod.default || mod;
    } catch (e) {
        try {
            studentFileHandler = require('./api/student-file.js');
            if (studentFileHandler && studentFileHandler.default) {
                studentFileHandler = studentFileHandler.default;
            }
        } catch (err) {}
    }
})();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf'
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // API Routes
    if (pathname === '/api/send-alert' || pathname === '/api/send-email') {
        return sendAlertHandler(req, res);
    }

    if (pathname === '/api/student-photo' || pathname.startsWith('/api/student-photo/')) {
        if (!studentPhotoHandler) {
            try {
                const mod = await import('./api/student-photo.js');
                studentPhotoHandler = mod.default || mod;
            } catch (err) {
                console.error('[Server] studentPhotoHandler load error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
        }
        if (!req.query) {
            req.query = Object.fromEntries(url.searchParams.entries());
        }
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
        if (!res.redirect) {
            res.redirect = function(status, targetUrl) {
                if (typeof status === 'string') { targetUrl = status; status = 302; }
                this.writeHead(status || 302, { Location: targetUrl });
                this.end();
                return this;
            };
        }
        if (req.method === 'POST' && !req.body) {
            let rawBody = '';
            req.on('data', chunk => rawBody += chunk);
            req.on('end', () => {
                try { req.body = JSON.parse(rawBody); } catch(e) { req.body = {}; }
                return studentPhotoHandler(req, res);
            });
            return;
        }
        return studentPhotoHandler(req, res);
    }

    if (pathname === '/api/student-file' || pathname.startsWith('/api/student-file/')) {
        if (!studentFileHandler) {
            try {
                const mod = await import('./api/student-file.js');
                studentFileHandler = mod.default || mod;
            } catch (err) {
                console.error('[Server] studentFileHandler load error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
        }
        if (!req.query) {
            req.query = Object.fromEntries(url.searchParams.entries());
        }
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
        if (req.method === 'POST' && !req.body) {
            let rawBody = '';
            req.on('data', chunk => rawBody += chunk);
            req.on('end', () => {
                try { req.body = JSON.parse(rawBody); } catch(e) { req.body = {}; }
                return studentFileHandler(req, res);
            });
            return;
        }
        return studentFileHandler(req, res);
    }

    // Direct Student Profile SPA Route (/student/:id or /profile/:id)
    if (pathname.startsWith('/student/') || pathname.startsWith('/profile/')) {
        const filePath = path.join(ROOT, 'index.html');
        return fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Server Error');
            }
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        });
    }

    // Static File Serving
    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
    
    // Security check: prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback to index.html for SPA if not an asset
            if (!path.extname(pathname)) {
                filePath = path.join(ROOT, 'index.html');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('File Not Found');
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Server Error');
            }
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    console.log(`Montessori Student Database Server running at http://localhost:${PORT}`);
    console.log(`Email Alert API ready at http://localhost:${PORT}/api/send-alert`);
});
