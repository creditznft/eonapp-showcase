#!/usr/bin/env node
/** W518 source gate: one Capsule route, local-only transaction, no old user flow. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
function check(id, condition, detail) { checks.push({ id, ok: Boolean(condition), detail }); }

const capsule = read('assets/js/local-first/eon-workspace-capsule.js');
const page = read('assets/js/local-first/eon-workspace-capsule-page.js');
const html = read('capsule.html');
const legacyRoute = read('vault-backup.html');
const profile = read('profile.html');
const profileJs = read('assets/js/profile-page.js');
const support = read('help.html');
const chat = read('chat.html');

check('capsule-v1-v2-schema-compatibility', /eonapp\.portable-workspace-capsule\.v1/.test(capsule) && /EON_WORKSPACE_CAPSULE_VERSION = 2/.test(capsule) && /EON_WORKSPACE_CAPSULE_LEGACY_VERSION = 1/.test(capsule) && /EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS/.test(capsule), 'Capsule preserves v1 import compatibility while emitting bounded v2 Capsules.');
check('capsule-local-only', !/\bfetch\s*\(|WebSocket|RTCPeerConnection|EventSource|navigator\.sendBeacon|XMLHttpRequest/.test(capsule), 'Capsule core creates no network or P2P transport.');
check('capsule-encrypted-kdf-cipher-compression', /PBKDF2/.test(capsule) && /AES-GCM/.test(capsule) && /CompressionStream/.test(capsule) && /DecompressionStream/.test(capsule) && /gzip-before-encryption/.test(capsule) && /EON_WORKSPACE_CAPSULE_KDF_ITERATIONS = 310_000/.test(capsule), 'Capsule declares bounded Web Crypto encryption and optional gzip-before-encryption metadata.');
check('capsule-atomic-rollback', /atomic-commit-failed-rolled-back/.test(capsule) && /recoverPendingWorkspaceCapsule/.test(capsule) && /EON_WORKSPACE_CAPSULE_JOURNAL_KEY/.test(capsule), 'Capsule has journaled rollback and recovery paths.');
check('capsule-selection-and-drift', /explicit-confirmation-required/.test(capsule) && /local-state-changed-reinspect-required/.test(capsule) && /requires explicit overwrite/.test(capsule), 'Capsule enforces explicit confirmation, selection and stale-stage rejection.');
check('capsule-ui-single-route', /Portable Workspace Capsule/.test(html) && /eon-workspace-capsule-page\.js/.test(html) && !/EON Sync/.test(html), 'Capsule has one public recovery surface.');
check('legacy-route-redirect-only', /window\.location\.replace\('\/capsule'\)/.test(legacyRoute) && !/<input\b/i.test(legacyRoute) && !/eon-vault-backup-page\.js/.test(legacyRoute), 'Legacy backup route is redirect-only with no live restore controls.');
check('profile-no-legacy-sync-ui', !/eon-sync|\/vault\/backup/i.test(profile) && !/eon-sync|eon-sync-backup/i.test(profileJs), 'Profile no longer exposes the legacy EON Sync/export flow.');
check('active-customer-links-converged', !/\/vault\/backup/i.test(`${support}\n${chat}`) && /\/capsule/.test(`${support}\n${chat}`), 'Support and Chat point to Capsule rather than legacy backup.');
check('page-does-not-render-values', /values are not shown/i.test(page) && /rawValuesExposed/.test(capsule), 'Restore plan is key/byte metadata only.');

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({ schema: 'eonapp.w518.workspace-capsule-source-gate.v2', ok: failed.length === 0, checks }, null, 2));
if (failed.length) process.exitCode = 1;
