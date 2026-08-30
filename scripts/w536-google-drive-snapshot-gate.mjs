#!/usr/bin/env node
/** W536 source gate: explicit, encrypted Google Drive snapshot connector. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
function check(id, condition, detail) { checks.push({ id, ok: Boolean(condition), detail }); }

const contract = read('config/w536-google-drive-snapshot-contract.mjs');
const connector = read('assets/js/local-first/eon-google-drive-snapshot-connector.js');
const page = read('assets/js/local-first/eon-workspace-capsule-page.js');
const capsule = read('assets/js/local-first/eon-workspace-capsule.js');
const endpoint = read('functions/api/public/google-drive.js');
const headers = read('_headers');
const publicHeaders = read('public/_headers');
const foundation = read('assets/js/local-first/eon-google-drive-backup-foundation.js');

check('drive-scope-limited', /https:\/\/www\.googleapis\.com\/auth\/drive\.file/.test(contract) && /EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE/.test(connector), 'Connector uses the limited Drive file scope contract.');
check('identity-consent-separated', /Google Login consent reused for Drive/.test(contract) && /googleLoginConsentReusable:\s*false/.test(connector) && /requestGoogleDriveAccess/.test(page), 'Google identity and Drive authorization remain separate moments.');
check('explicit-not-sync', /automaticUpload:\s*false/.test(contract) && /automaticRestore:\s*false/.test(contract) && /automaticCrossDeviceSync:\s*false/.test(contract) && /explicit-encrypted-snapshot-not-sync/.test(connector), 'Drive remains explicit snapshot backup, not sync.');
check('encrypted-capsule-before-network', /createWorkspaceCapsuleFromStorage/.test(page) && /uploadGoogleDriveSnapshot/.test(page) && /Creating one encrypted Capsule in this browser before Google Drive is contacted/.test(page), 'Page creates the encrypted Capsule before Drive upload.');
check('no-token-persistence', !/localStorage|sessionStorage|indexedDB|caches\.open|setItem\s*\(|refresh_token|EON_GOOGLE_DRIVE_OAUTH_CLIENT_SECRET/i.test(connector), 'Connector does not persist Drive tokens or accept a client secret.');
check('no-server-token-store', !/D1|KV|DATABASE|refresh_token|client_secret|access_token/i.test(endpoint.replace(/clientId|configured|scope|reason/g, '')), 'Public endpoint exposes configuration only, with no token or secret storage.');
check('config-is-public-and-no-store', /EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID/.test(endpoint) && /cache-control': 'no-store, max-age=0'/.test(endpoint) && /safeClientId/.test(endpoint), 'Only a validated public client ID can be returned without caching.');
check('gis-late-load-and-explicit-token-request', /https:\/\/accounts\.google\.com\/gsi\/client/.test(connector) && /loadGoogleIdentityServices/.test(connector) && /requestAccessToken\(\)/.test(connector) && /include_granted_scopes:\s*false/.test(connector), 'GIS loads only in the Drive flow and token consent is explicit.');
check('resumable-upload-and-user-selected-restore', /uploadType=resumable/.test(connector) && /downloadGoogleDriveSnapshot/.test(connector) && /trashGoogleDriveSnapshot/.test(connector) && /revokeGoogleDriveAccess/.test(connector), 'Connector supports explicit upload, selected inspect, trash, and revocation actions.');
check('capsule-compresses-before-encryption', /CompressionStream/.test(capsule) && /gzip-before-encryption/.test(capsule) && !/\bfetch\s*\(/.test(capsule), 'Capsule v2 compression remains local and precedes encryption.');
check('coop-and-csp-capsule-only', /https:\/\/accounts\.google\.com/.test(headers) && /connect-src 'self' https:\/\/www\.googleapis\.com/.test(headers) && /\/capsule\n  ! Cross-Origin-Opener-Policy\n  Cross-Origin-Opener-Policy: same-origin-allow-popups/.test(headers) && headers === publicHeaders, 'Capsule alone allows GIS script/popup compatibility and the Drive API while keeping the global default COOP unchanged.');
check('foundation-remains-non-live', /approved-foundation-not-enabled/.test(foundation) && !/requestAccessToken|google\.accounts|uploadType=resumable|fetch\s*\(/.test(foundation), 'The W525A foundation remains a non-live contract separate from the W536 adapter.');

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({ schema: 'eonapp.w536.google-drive-snapshot-source-gate.v1', ok: failed.length === 0, checks }, null, 2));
if (failed.length) process.exitCode = 1;
