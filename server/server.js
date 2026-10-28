// Student MIS — Integrated Backend Server & API Gateway
// Institution: St. John College of Engineering and Management, Palghar
// Trust: ALDEL Education Trust
//
// Purpose:
// 1. Provides server-side proxy for Institutional Student API integration.
// 2. Protects college API secrets and credentials away from the browser.
// 3. Serves the frontend static assets with high performance and zero external dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSafeGatewayStatus,
  testGatewayConnection,
  lookupStudentFromInstitutionalApi,
} from './institutionalApiAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = parseInt(process.env.PORT, 10) || 5173;

// MIME type map for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.csv': 'text/csv; charset=utf-8',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
};

// In-memory rate limiting map (IP / user based)
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkServerRateLimit(key) {
  const now = Date.now();
  const history = rateLimiter.get(key) || [];
  const active = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (active.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - active[0])) / 1000) };
  }

  active.push(now);
  rateLimiter.set(key, active);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - active.length };
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Static File Server
function serveStaticFile(req, res, pathname) {
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\\\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(ROOT_DIR, safePath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing: serve index.html if file not found
      const indexPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Create HTTP Server
export const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Handle API Routes
  if (pathname.startsWith('/api/')) {
    // 1. GET /api/v1/integration/status
    if (req.method === 'GET' && pathname === '/api/v1/integration/status') {
      const status = getSafeGatewayStatus();
      return sendJson(res, 200, status);
    }

    // 2. POST /api/v1/integration/test-connection
    if (req.method === 'POST' && pathname === '/api/v1/integration/test-connection') {
      const limit = checkServerRateLimit(`test-conn:${clientIp}`);
      if (!limit.allowed) {
        return sendJson(res, 429, {
          success: false,
          error: 'RATE_LIMITED',
          message: `Too many gateway tests. Please retry in ${limit.retryAfter} seconds.`,
        });
      }

      const result = await testGatewayConnection();
      return sendJson(res, result.httpStatus || (result.success ? 200 : 503), result);
    }

    // 3. POST /api/v1/students/lookup
    if (req.method === 'POST' && pathname === '/api/v1/students/lookup') {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch (err) {
        return sendJson(res, 400, { success: false, error: 'BAD_REQUEST', message: err.message });
      }

      const { pid, caller } = body;

      // Rate limit per caller identity
      const rateLimitKey = `lookup:${caller?.id || clientIp}`;
      const limit = checkServerRateLimit(rateLimitKey);
      if (!limit.allowed) {
        return sendJson(res, 429, {
          success: false,
          error: 'RATE_LIMITED',
          message: `Lookup rate limit exceeded. Please retry in ${limit.retryAfter} seconds.`,
        });
      }

      // Execute institutional lookup
      const result = await lookupStudentFromInstitutionalApi(pid, caller);
      return sendJson(res, result.status || (result.success ? 200 : 500), result);
    }

    // Unmatched API endpoint
    return sendJson(res, 404, {
      success: false,
      error: 'ENDPOINT_NOT_FOUND',
      message: `API route ${req.method} ${pathname} not found.`,
    });
  }

  // Serve Static Assets
  serveStaticFile(req, res, pathname);
});

// Start listener only when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => {
    console.log(`[Student MIS Backend] Server running at http://localhost:${PORT}/`);
    console.log(`[Student MIS Backend] Serving static frontend & institutional API proxy`);
  });
}
