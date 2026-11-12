const http = require('http');
const fs = require('fs');
const path = require('path');
const sendAlertHandler = require('./api/send-alert.js');

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
