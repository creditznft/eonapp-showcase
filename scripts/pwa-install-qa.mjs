#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const precache = sw.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
const screenshots = Array.isArray(manifest.screenshots) ? manifest.screenshots : [];
const errors = [];
const warnings = [];
const fileExists = (src) => fs.existsSync(path.join(root, String(src || '').replace(/^\//, '')));

if (!manifest.name || !manifest.short_name) errors.push('name and short_name are required.');
if (manifest.start_url !== '/?source=pwa') errors.push('PWA start_url must remain /?source=pwa while Chat lives at the root route.');
if (!['standalone', 'minimal-ui', 'fullscreen'].includes(String(manifest.display || ''))) warnings.push('display should be standalone/minimal-ui/fullscreen.');
if (!['any', 'natural', 'portrait', 'landscape'].includes(String(manifest.orientation || ''))) warnings.push('orientation should be any/natural/portrait/landscape.');
if (!icons.some((icon) => String(icon.sizes || '').includes('192'))) errors.push('Missing 192x192 icon.');
if (!icons.some((icon) => String(icon.sizes || '').includes('512'))) errors.push('Missing 512x512 icon.');
if (!icons.some((icon) => String(icon.purpose || '').includes('maskable'))) warnings.push('Missing maskable icon purpose.');
for (const icon of icons) if (String(icon.src || '').startsWith('/assets/') && !fileExists(icon.src)) errors.push(`Missing icon file: ${icon.src}`);
for (const required of ['/local-ai', '/eoncity', '/vault', '/workspace']) if (!shortcuts.some((item) => String(item.url || '') === required)) errors.push(`Missing canonical PWA shortcut: ${required}`);
if (shortcuts.some((item) => /realmworld|workbench|cockpit|reward-access/i.test(String(item.url || '') + String(item.name || '')))) errors.push('Manifest shortcuts must not expose retired product identities.');
if (!/Explicit-update bounded cache policy/i.test(sw) || !/const\s+RELEASE_ID\s*=/.test(sw)) errors.push('Service worker explicit-update release identity contract is missing.');
for (const required of ['/local-ai', '/offline.html', '/manifest.webmanifest']) if (!sw.includes(`'${required}'`)) errors.push(`Service-worker stable precache is missing: ${required}`);
for (const forbidden of ['/assets/js/', '/assets/css/']) if (precache.includes(forbidden)) errors.push(`Service-worker precache must not name unhashed source assets: ${forbidden}`);
if (screenshots.length < 2) warnings.push('At least two screenshots are recommended for install prompts.');

const result = {
  ok: errors.length === 0,
  errors,
  warnings,
  manifest: { display: manifest.display, orientation: manifest.orientation, startUrl: manifest.start_url, iconCount: icons.length, shortcutCount: shortcuts.length, screenshotCount: screenshots.length, hasMaskableIcon: icons.some((icon) => String(icon.purpose || '').includes('maskable')) },
  manualDeviceQA: [
    '4 GB Android: portrait Chat, 2D City, no browser-side local-model installation claim, offline fallback.',
    'Mid-range Android: PWA install path, 2D default, optional 3D only after explicit test and landscape choice.',
    'iPhone Safari: Share → Add to Home Screen, portrait composer, safe-area and keyboard check.',
    'Desktop Chrome and Edge: PWA install/update, Local AI runtime discovery/self-test/removal, 2D/3D return path.',
    'Slow network/offline/no-WebGL: cached shell or offline page, no false cloud/live-data claim, 2D only without WebGL.'
  ]
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
