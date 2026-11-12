const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Helper to load .env.local if environment variables are not already present
function getEnvCredentials() {
    let user = process.env.GMAIL_USER;
    let pass = process.env.GMAIL_APP_PASSWORD;
    let admin = process.env.ADMIN_EMAIL;

    if (!user || !pass || !admin) {
        // Try multiple possible locations for .env.local
        const possiblePaths = [
            path.resolve(process.cwd(), '.env.local'),
            path.resolve(__dirname, '../.env.local'),
            path.resolve(__dirname, '.env.local')
        ];

        for (const p of possiblePaths) {
            try {
                if (fs.existsSync(p)) {
                    const content = fs.readFileSync(p, 'utf8');
                    content.split('\n').forEach(line => {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('#')) {
                            const eqIdx = trimmed.indexOf('=');
                            if (eqIdx !== -1) {
                                const key = trimmed.slice(0, eqIdx).trim();
                                const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                                if (key === 'GMAIL_USER' && !user) user = val;
                                if (key === 'GMAIL_APP_PASSWORD' && !pass) pass = val;
                                if (key === 'ADMIN_EMAIL' && !admin) admin = val;
                            }
                        }
                    });
                    if (user && pass && admin) break;
                }
            } catch (e) {
                // Ignore filesystem read errors in constrained environments
            }
        }
    }

    // Default fallbacks provided by user if not found in environment
    user = user || 'msj.foundationinc@gmail.com';
    pass = pass || 'jgiv dbar emux sttx';
    admin = admin || 'msj.foundationinc@gmail.com';

    // Strip internal spaces from Google App Password
    const cleanPass = pass.replace(/\s+/g, '');

    return { user, pass: cleanPass, admin };
}

// Convert camelCase or snake_case key to human-readable Title Case
function formatLabel(key) {
    if (!key) return '';
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_\-]+/g, ' ')
        .replace(/^\w/, c => c.toUpperCase())
        .trim();
}

// Clean and sanitize detail values for presentation (e.g. collapse base64 data)
function sanitizeValue(key, val) {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') {
        if (/amount|fee|tuition|salary|rate|total|cutoff/i.test(key)) {
            return '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return val.toString();
    }
    if (typeof val === 'object') {
        if (val.name && val.size) return `${val.name} (${val.size})`;
        if (Array.isArray(val)) {
            if (val.length === 0) return 'None';
            return `${val.length} item(s)`;
        }
        return JSON.stringify(val);
    }
    const str = String(val).trim();
    if (str.startsWith('data:image/') || (str.length > 300 && /^[A-Za-z0-9+/=]+$/.test(str.slice(0, 100)))) {
        return '[Embedded Image / Biometric Data Attached]';
    }
    if (str.startsWith('data:application/pdf')) {
        return '[Attached PDF Document]';
    }
    return str;
}

// Build email HTML body
function generateHtmlEmail({ category, action, title, submittedAt, submittedBy, details }) {
    const detailRows = Object.entries(details || {})
        .filter(([k]) => !/password|hash|salt|fingerprint|faceEmbedding/i.test(k)) // Hide sensitive secrets
        .map(([key, rawVal]) => {
            const label = formatLabel(key);
            const value = sanitizeValue(key, rawVal);
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #334155; width: 38%; vertical-align: top; background: #f8fafc; font-size: 13px;">${label}</td>
                <td style="padding: 10px 14px; color: #0f172a; width: 62%; vertical-align: top; font-size: 13.5px; word-break: break-word;">${value}</td>
            </tr>`;
        }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Data Encoded Alert</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 12px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0b2545 0%, #17375e 100%); padding: 26px 28px; text-align: left;">
                                <div style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.15); border-radius: 20px; color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                    Automatic System Notification
                                </div>
                                <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                                    Montessori de San Jose Foundation Inc.
                                </h1>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">
                                    School Database Management System &bull; New Entry Encoded
                                </p>
                            </td>
                        </tr>

                        <!-- Summary Alert Box -->
                        <tr>
                            <td style="padding: 22px 28px 16px 28px;">
                                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
                                    <div style="font-size: 15px; font-weight: 700; color: #166534; margin-bottom: 4px;">
                                        ${action || 'New Data Successfully Saved'}
                                    </div>
                                    <div style="font-size: 13px; color: #15803d; line-height: 1.4;">
                                        <strong>${title || category || 'New Entry'}</strong> was newly encoded and committed to the school database.
                                    </div>
                                </div>

                                <!-- Metadata info grid -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td style="padding: 12px 16px; width: 50%; border-right: 1px solid #e2e8f0;">
                                            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Date &amp; Time Submitted</div>
                                            <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 2px;">${submittedAt || new Date().toLocaleString('en-PH')}</div>
                                        </td>
                                        <td style="padding: 12px 16px; width: 50%;">
                                            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Encoded By / Account</div>
                                            <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 2px;">${submittedBy || 'Authorized Staff'}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding: 10px 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
                                            <strong>Module:</strong> ${category || 'General Registry'}
                                        </td>
                                    </tr>
                                </table>

                                <!-- Details Table -->
                                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px;">
                                    Complete Encoded Details
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; border-collapse: collapse;">
                                    ${detailRows}
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="margin: 0; font-size: 11.5px; color: #64748b; line-height: 1.5;">
                                    This automated alert was sent via Nodemailer &amp; Gmail SMTP to <strong>${getEnvCredentials().admin}</strong>.
                                    <br>
                                    Montessori de San Jose Foundation Inc. &copy; ${new Date().getFullYear()}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

// Build text fallback
function generateTextEmail({ category, action, title, submittedAt, submittedBy, details }) {
    let out = `MONTESSORI DE SAN JOSE FOUNDATION INC. - NEW DATA ENCODED ALERT\n`;
    out += `=================================================================\n\n`;
    out += `Action: ${action || 'New Record Saved'}\n`;
    out += `Module: ${category || 'General'}\n`;
    out += `Title: ${title || 'N/A'}\n`;
    out += `Submitted At: ${submittedAt || new Date().toLocaleString('en-PH')}\n`;
    out += `Encoded By: ${submittedBy || 'Authorized Staff'}\n\n`;
    out += `ENCODED DETAILS:\n`;
    out += `-----------------------------------------------------------------\n`;
    Object.entries(details || {}).forEach(([k, v]) => {
        if (!/password|hash|salt|fingerprint|faceEmbedding/i.test(k)) {
            out += `${formatLabel(k)}: ${sanitizeValue(k, v)}\n`;
        }
    });
    out += `\n=================================================================\n`;
    out += `Auto-generated by Montessori Student Database App\n`;
    return out;
}

// Primary sending function
async function sendDataAlert(data) {
    const creds = getEnvCredentials();

    if (!creds.user || !creds.pass) {
        throw new Error('Gmail credentials are missing. Please verify GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: creds.user,
            pass: creds.pass
        }
    });

    const category = data.category || 'School Registry';
    const action = data.action || 'New Data Saved';
    const title = data.title || 'Database Record';
    const submittedAt = data.submittedAt || new Date().toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'medium' });
    const submittedBy = data.submittedBy || 'Authorized User';
    const details = data.details || {};

    const subject = `[MDSJFI Alert] ${action}: ${title} (${submittedAt})`;
    const htmlBody = generateHtmlEmail({ category, action, title, submittedAt, submittedBy, details });
    const textBody = generateTextEmail({ category, action, title, submittedAt, submittedBy, details });

    const mailOptions = {
        from: `"MDSJFI Student DB" <${creds.user}>`,
        to: creds.admin,
        subject: subject,
        text: textBody,
        html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    return {
        success: true,
        messageId: info.messageId,
        recipient: creds.admin,
        timestamp: submittedAt
    };
}

// Serverless handler for Vercel / Node HTTP server
async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.writeHead ? res.writeHead(200).end() : res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        const errorResponse = { error: 'Method Not Allowed. Use POST.' };
        if (res.writeHead) {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(errorResponse));
        } else {
            res.status(405).json(errorResponse);
        }
        return;
    }

    try {
        let payload = req.body;
        // In case body is not parsed yet by body-parser / micro
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch(e){}
        } else if (!payload && req.on) {
            // Buffer stream if raw Node HTTP request
            payload = await new Promise((resolve, reject) => {
                let data = '';
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => {
                    try { resolve(JSON.parse(data || '{}')); }
                    catch(err) { reject(err); }
                });
                req.on('error', reject);
            });
        }

        const result = await sendDataAlert(payload || {});

        const successJson = JSON.stringify(result);
        if (res.writeHead) {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(successJson);
        } else {
            res.status(200).json(result);
        }
    } catch (err) {
        console.error('[send-alert error]', err);
        const errJson = JSON.stringify({ success: false, error: err.message || 'Failed to send alert email' });
        if (res.writeHead) {
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(errJson);
        } else {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = handler;
module.exports.sendDataAlert = sendDataAlert;
module.exports.getEnvCredentials = getEnvCredentials;
