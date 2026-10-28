import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

console.log('[Postbuild] Optimizing dist for production deployment...');

// Clean unnecessary screenshots from dist
const distScreenshots = path.join(distDir, 'screenshots');
if (fs.existsSync(distScreenshots)) {
  fs.rmSync(distScreenshots, { recursive: true, force: true });
  console.log('[Postbuild] Removed non-runtime screenshots from dist.');
}

const distPublicScreenshots = path.join(distDir, 'public', 'screenshots');
if (fs.existsSync(distPublicScreenshots)) {
  fs.rmSync(distPublicScreenshots, { recursive: true, force: true });
}

// Ensure dist/public/vendor and dist/public/assets exist
const distPublicVendor = path.join(distDir, 'public', 'vendor');
const distPublicAssets = path.join(distDir, 'public', 'assets');
const distAssets = path.join(distDir, 'assets');

fs.mkdirSync(distPublicVendor, { recursive: true });
fs.mkdirSync(distPublicAssets, { recursive: true });
fs.mkdirSync(distAssets, { recursive: true });

// Copy vendor files
fs.cpSync(path.join(publicDir, 'vendor'), distPublicVendor, { recursive: true });

// Copy assets files to both dist/assets and dist/public/assets
fs.cpSync(path.join(publicDir, 'assets'), distPublicAssets, { recursive: true });
fs.cpSync(path.join(publicDir, 'assets'), distAssets, { recursive: true });

// Copy favicons and svg icons
const faviconSrc = path.join(publicDir, 'favicon.svg');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(distDir, 'favicon.svg'));
}
const iconsSrc = path.join(publicDir, 'icons.svg');
if (fs.existsSync(iconsSrc)) {
  fs.copyFileSync(iconsSrc, path.join(distDir, 'icons.svg'));
}

// Netlify SPA Redirects
const redirectsPath = path.join(distDir, '_redirects');
fs.writeFileSync(redirectsPath, '/*    /index.html   200\n', 'utf8');

// Netlify Config
const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
const netlifyTomlContent = `[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
fs.writeFileSync(netlifyTomlPath, netlifyTomlContent, 'utf8');

console.log('[Postbuild] Deployment package ready in dist/.');
