/**
 * Mission durability helpers
 * --------------------------
 * Browser-local checkpoint/export/import support for resumable missions.
 */

import { CHAT_MISSION_TIMELINE_KEY, createChatMissionTimelineStore } from '../chat/chat-page-session-state.js';

const CAPSULE_INDEX_KEY = 'eon:mission-capsules:v1';
const MAX_CAPSULE_INDEX = 24;
const CAPSULE_SCHEMA = 'mission-capsule/v1';
const CHECKPOINT_MANIFEST_SCHEMA = 'eonapp.foreground-mission-checkpoint.a15.v1';
const LEGACY_MANIFEST_SCHEMA = 'agent-job-manifest/v1';
const CAPSULE_ENCRYPTION_ALG = 'AES-GCM-256';
const CAPSULE_KDF_ITERATIONS = 600000;

/**
 * @typedef {Object} MissionCapsule
 * @property {string} schema
 * @property {string} capsuleId
 * @property {number} createdAt
 * @property {string} jobId
 * @property {string} title
 * @property {string} status
 * @property {any} manifest
 * @property {boolean} [encrypted]
 * @property {string} [encryption]
 * @property {string} [salt]
 * @property {string} [iv]
 * @property {string} [ct]
 * @property {string} [mac]
 * @property {string} [capsuleHash]
 */

/**
 * @typedef {Object} CapsuleIndexEntry
 * @property {string} id
 * @property {number} ts
 * @property {string} [jobId]
 * @property {string} [title]
 * @property {string} [status]
 * @property {string} [capsuleHash]
 * @property {string} [manifestHash]
 * @property {boolean} [encrypted]
 */

/**
 * @typedef {Object} MissionManifest
 * @property {string} schema
 * @property {string} [manifestHash]
 * @property {{ id?: string, title?: string, status?: string }} [job]
 */

/**
 * @param {string} prefix
 * @returns {string}
 */
function uid(prefix = 'capsule') {
  if (!globalThis.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param {any} value
 * @param {number} max
 * @returns {string}
 */
function sanitize(value, max = 4000) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

/**
 * @param {ArrayLike<number> | Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
  return Array.from(bytes || [], (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
  const clean = String(hex || '').trim();
  const out = new Uint8Array(Math.ceil(clean.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2) || '00', 16) || 0;
  }
  return out;
}

/**
 * @param {any} value
 * @returns {string}
 */
function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

/**
 * @param {any} value
 * @returns {string}
 */
function capsuleHash(value) {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

function getCrypto() {
  return globalThis.crypto?.subtle ? globalThis.crypto : null;
}

/**
 * @param {string} passphrase
 * @param {string} saltHex
 */
async function deriveCapsuleKeys(passphrase, saltHex) {
  const crypto = getCrypto();
  if (!crypto) throw new Error('WebCrypto unavailable.');
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', enc.encode(String(passphrase || '')), 'PBKDF2', false, ['deriveKey']);
  const salt = hexToBytes(saltHex);
  const aesKey = await crypto.subtle.deriveKey(
    /** @type {any} */ ({ name: 'PBKDF2', salt, iterations: CAPSULE_KDF_ITERATIONS, hash: 'SHA-256' }),
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const macKey = await crypto.subtle.deriveKey(
    /** @type {any} */ ({ name: 'PBKDF2', salt: new Uint8Array([...salt, 0x7a]), iterations: CAPSULE_KDF_ITERATIONS, hash: 'SHA-256' }),
    material,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
  return { aesKey, macKey };
}

/**
 * @param {any} payload
 * @param {string} passphrase
 */
async function encryptCapsulePayload(payload, passphrase) {
  const crypto = getCrypto();
  if (!crypto) throw new Error('WebCrypto unavailable.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const saltHex = bytesToHex(salt);
  const { aesKey, macKey } = await deriveCapsuleKeys(passphrase, saltHex);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);
  const ct = new Uint8Array(cipher);
  const macBuffer = await crypto.subtle.sign('HMAC', macKey, ct);
  return {
    encrypted: true,
    encryption: CAPSULE_ENCRYPTION_ALG,
    salt: saltHex,
    iv: bytesToHex(iv),
    ct: bytesToHex(ct),
    mac: bytesToHex(new Uint8Array(macBuffer))
  };
}

/**
 * @param {Partial<MissionCapsule> & { salt?: string, iv?: string, ct?: string, mac?: string }} encrypted
 * @param {string} passphrase
 */
async function decryptCapsulePayload(encrypted, passphrase) {
  const crypto = getCrypto();
  if (!crypto) throw new Error('WebCrypto unavailable.');
  const saltHex = String(encrypted?.salt || '').trim();
  const ivHex = String(encrypted?.iv || '').trim();
  const ctBytes = hexToBytes(String(encrypted?.ct || ''));
  const macBytes = hexToBytes(String(encrypted?.mac || ''));
  const { aesKey, macKey } = await deriveCapsuleKeys(passphrase, saltHex);
  const macOk = await crypto.subtle.verify('HMAC', macKey, /** @type {any} */ (macBytes), /** @type {any} */ (ctBytes));
  if (!macOk) throw new Error('Mission capsule signature verification failed.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: /** @type {any} */ (hexToBytes(ivHex)) }, aesKey, /** @type {any} */ (ctBytes));
  return JSON.parse(new TextDecoder().decode(plain));
}

/**
 * @returns {CapsuleIndexEntry[]}
 */
function loadCapsuleIndex() {
  try {
    const rows = JSON.parse(localStorage.getItem(CAPSULE_INDEX_KEY) || 'null');
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * @param {CapsuleIndexEntry[]} rows
 */
function saveCapsuleIndex(rows) {
  try {
    localStorage.setItem(CAPSULE_INDEX_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
  } catch {}
}

/**
 * @param {Partial<CapsuleIndexEntry>} entry
 * @returns {CapsuleIndexEntry}
 */
function pushCapsuleIndex(entry) {
  const rows = loadCapsuleIndex();
  const next = {
    id: uid('capsule'),
    ts: Date.now(),
    ...entry
  };
  rows.push(next);
  saveCapsuleIndex(rows);
  return next;
}


/**
 * @param {string} filename
 * @param {string} text
 * @param {string} type
 */
function downloadTextFile(filename, text, type = 'application/json') {
  const blob = new Blob([String(text ?? '')], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function listMissionCapsules() {
  return loadCapsuleIndex().slice().reverse();
}

function missionTimelineStore() {
  return createChatMissionTimelineStore({
    storage: typeof localStorage !== 'undefined' ? localStorage : null,
    timelineKey: CHAT_MISSION_TIMELINE_KEY
  });
}

function normalizeMissionPlan(row = {}) {
  const id = sanitize(row.missionId || row.planId || row.id || '', 120);
  if (!id) return null;
  const status = sanitize(row.status || 'planned', 40).toLowerCase();
  const createdAt = Number(row.createdAt || row.timestamp || row.ts || Date.now());
  return Object.freeze({
    id,
    title: sanitize(row.title || row.summary || row.prompt || 'Local mission plan', 160),
    status,
    summary: sanitize(row.summary || '', 400),
    prompt: sanitize(row.prompt || '', 4000),
    taskClass: sanitize(row.taskClass || row.mode || 'mission-plan', 80),
    providerId: sanitize(row.providerId || row.provider || 'guide', 80).toLowerCase(),
    providerLabel: sanitize(row.providerLabel || row.provider || 'Guide plan', 100),
    model: sanitize(row.model || 'none', 180),
    budgetMode: sanitize(row.budgetMode || row.budget?.mode || 'auto', 40),
    routing: row.routing && typeof row.routing === 'object' ? { ...row.routing } : {},
    createdAt,
    updatedAt: Number(row.updatedAt || row.completedAt || createdAt),
    execution: 'not-active',
    reviewRequired: status === 'awaiting_approval' || status === 'review-needed' || status === 'planned'
  });
}

function checkpointManifest(plan) {
  const record = {
    schema: CHECKPOINT_MANIFEST_SCHEMA,
    createdAt: Date.now(),
    plan: {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      summary: plan.summary,
      prompt: plan.prompt,
      taskClass: plan.taskClass,
      providerId: plan.providerId,
      providerLabel: plan.providerLabel,
      model: plan.model,
      budgetMode: plan.budgetMode,
      routing: plan.routing,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      execution: 'not-active',
      reviewRequired: true
    },
    authority: {
      foregroundOnly: true,
      backgroundExecution: false,
      providerRequestCreated: false,
      externalActionAuthority: false
    }
  };
  return Object.freeze({ ...record, manifestHash: capsuleHash(record) });
}

export function getResumableMissionJobs() {
  const rows = missionTimelineStore().load();
  const allowed = new Set(['planned', 'awaiting_approval', 'review-needed', 'ready']);
  const byId = new Map();
  for (const row of rows) {
    const plan = normalizeMissionPlan(row);
    if (!plan || !allowed.has(plan.status)) continue;
    const current = byId.get(plan.id);
    if (!current || plan.updatedAt >= current.updatedAt) byId.set(plan.id, plan);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getLatestResumableMissionJob() {
  return getResumableMissionJobs()[0] || null;
}

/**
 * @param {string} jobId
 * @returns {MissionCapsule | null}
 */
export function createMissionCapsule(jobId) {
  const target = sanitize(jobId, 120);
  const plan = getResumableMissionJobs().find((row) => row.id === target);
  if (!plan) return null;
  const manifest = checkpointManifest(plan);
  /** @type {MissionCapsule} */
  const capsule = {
    schema: CAPSULE_SCHEMA,
    capsuleId: uid('capsule'),
    createdAt: Date.now(),
    jobId: plan.id,
    title: plan.title,
    status: plan.status,
    manifest: /** @type {any} */ (manifest)
  };
  capsule.capsuleHash = capsuleHash({ capsuleId: capsule.capsuleId, manifestHash: manifest.manifestHash });
  return capsule;
}

/**
 * @param {string} jobId
 * @param {{ download?: boolean, passphrase?: string }} [options]
 */
export async function exportMissionCapsule(jobId, { download = true, passphrase = '' } = {}) {
  const capsule = createMissionCapsule(jobId);
  if (!capsule) return { ok: false, reason: 'Local mission plan not found.' };

  /** @type {MissionCapsule} */
  let outputCapsule = capsule;
  if (passphrase) {
    outputCapsule = {
      ...capsule,
      ...await encryptCapsulePayload(capsule.manifest, passphrase),
      manifest: null
    };
  }

  outputCapsule.capsuleHash = capsuleHash({
    capsuleId: outputCapsule.capsuleId,
    jobId: outputCapsule.jobId,
    title: outputCapsule.title,
    status: outputCapsule.status,
    encrypted: Boolean(outputCapsule.encrypted),
    manifestHash: capsule.manifest?.manifestHash || ''
  });

  const index = loadCapsuleIndex();
  const indexed = index.length < MAX_CAPSULE_INDEX;
  if (indexed) {
    pushCapsuleIndex({
      jobId: outputCapsule.jobId,
      title: outputCapsule.title,
      status: outputCapsule.status,
      capsuleHash: outputCapsule.capsuleHash,
      manifestHash: capsule.manifest?.manifestHash || '',
      encrypted: Boolean(outputCapsule.encrypted)
    });
  }

  if (download) {
    const file = `${outputCapsule.jobId}-mission-capsule-${Date.now()}.json`;
    downloadTextFile(file, JSON.stringify(outputCapsule, null, 2), 'application/json');
  }

  return {
    ok: true,
    capsule: outputCapsule,
    indexed,
    warning: indexed ? '' : 'Checkpoint exported, but the local checkpoint index is full. Delete or export older index entries before adding another.',
    mirror: { enabled: false, reason: 'external_relay_mirroring_not_active' }
  };
}

function normalizeImportedManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return null;
  if (manifest.schema === CHECKPOINT_MANIFEST_SCHEMA) {
    const expected = capsuleHash({
      schema: manifest.schema,
      createdAt: manifest.createdAt,
      plan: manifest.plan,
      authority: manifest.authority
    });
    if (manifest.manifestHash && manifest.manifestHash !== expected) return null;
    return normalizeMissionPlan(manifest.plan);
  }
  if (manifest.schema === LEGACY_MANIFEST_SCHEMA) {
    const job = manifest.job && typeof manifest.job === 'object' ? manifest.job : {};
    return normalizeMissionPlan({
      id: job.id,
      title: job.title,
      status: ['ready', 'running', 'retrying', 'awaiting_approval'].includes(String(job.status || '')) ? 'review-needed' : 'planned',
      summary: 'Imported legacy local plan for review only. No legacy executor was reactivated.',
      prompt: job.intentText || '',
      taskClass: job.taskType || job.action || 'legacy-plan',
      provider: 'guide',
      model: 'none',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      routing: { importedFrom: LEGACY_MANIFEST_SCHEMA, legacyExecutionAuthority: false }
    });
  }
  return null;
}

/**
 * @param {string} jsonText
 * @param {string} passphrase
 */
export async function importMissionCapsuleText(jsonText, passphrase = '') {
  let capsule = null;
  try {
    capsule = JSON.parse(String(jsonText || ''));
  } catch {
    return { ok: false, reason: 'Invalid mission capsule JSON.' };
  }

  let manifest = capsule?.manifest || capsule;
  if (capsule?.encrypted) {
    if (!passphrase) return { ok: false, reason: 'Encrypted mission capsule requires a passphrase.' };
    try {
      manifest = await decryptCapsulePayload(capsule, passphrase);
    } catch (error) {
      return { ok: false, reason: /** @type {any} */ (error)?.message || 'Failed to decrypt mission capsule.' };
    }
  }

  const plan = normalizeImportedManifest(manifest);
  if (!plan) return { ok: false, reason: 'Unsupported or invalid mission checkpoint schema.' };
  const timeline = missionTimelineStore();
  const rows = timeline.load();
  const before = rows.find((row) => String(row?.missionId || row?.planId || row?.id || '') === plan.id) || null;
  const importedRow = {
    mode: 'mission-import',
    missionId: plan.id,
    planId: plan.id,
    title: plan.title,
    prompt: plan.prompt,
    status: 'planned',
    provider: 'guide',
    providerLabel: 'Imported local plan',
    model: 'none',
    summary: plan.summary || 'Local plan imported for explicit review.',
    budgetMode: plan.budgetMode,
    taskClass: plan.taskClass,
    routing: { ...plan.routing, imported: true, externalActionAuthority: false },
    ts: Date.now(),
    createdAt: plan.createdAt,
    updatedAt: Date.now()
  };
  const next = rows.filter((row) => String(row?.missionId || row?.planId || row?.id || '') !== plan.id);
  next.push(importedRow);
  timeline.save(next);
  const verified = getResumableMissionJobs().find((row) => row.id === plan.id);
  if (!verified) {
    timeline.save(rows);
    return { ok: false, reason: 'Mission checkpoint write verification failed.' };
  }

  const index = loadCapsuleIndex();
  if (index.length < MAX_CAPSULE_INDEX) {
    pushCapsuleIndex({
      jobId: plan.id,
      title: plan.title,
      status: 'planned',
      capsuleHash: sanitize(capsule?.capsuleHash || manifest?.manifestHash || '', 120),
      manifestHash: sanitize(manifest?.manifestHash || '', 120),
      encrypted: Boolean(capsule?.encrypted)
    });
  }

  return { ok: true, job: verified, replaced: Boolean(before), execution: 'not-active' };
}

/**
 * @param {File | null | undefined} file
 * @param {string} passphrase
 */
export async function importMissionCapsuleFile(file, passphrase = '') {
  if (!file) return { ok: false, reason: 'No file selected.' };
  const text = await file.text();
  return importMissionCapsuleText(text, passphrase);
}

/**
 * @param {string} jobId
 * @param {{ surface?: string, origin?: string }} [context]
 */
export async function resumeMissionJob(jobId, context = {}) {
  const target = sanitize(jobId, 120);
  if (!target) return { ok: false, reason: 'No local plan selected.' };
  const job = getResumableMissionJobs().find((row) => row.id === target);
  if (!job) return { ok: false, reason: 'Local plan not found.' };
  return {
    ok: true,
    planned: true,
    job,
    reviewUrl: '/workspace',
    context: {
      surface: sanitize(context.surface || 'local-plan-review', 80),
      origin: sanitize(context.origin || 'browser', 80)
    },
    message: 'Local plan remains saved. Review it in Workspace before taking any action.'
  };
}

export function getMissionDurabilitySummary() {
  const resumable = getResumableMissionJobs();
  const capsules = listMissionCapsules();
  return {
    resumableCount: resumable.length,
    capsuleCount: capsules.length,
    latestResumable: resumable[0] || null,
    latestCapsule: capsules[0] || null,
    execution: 'not-active',
    relayMirror: 'not-active',
    legacyExecutorLoaded: false,
    checkpointSchema: CHECKPOINT_MANIFEST_SCHEMA
  };
}

/**
 * Compatibility descriptor for retired local-node UI. This release has no
 * node installer, remote worker, compute marketplace, wallet requirement,
 * relay mirror, or background runtime.
 */
export function getMissionNodeSpec() {
  return {
    name: 'Local plan archive',
    mode: 'not-active',
    purpose: 'Export and import browser-local planning checkpoints only.',
    capabilities: ['local checkpoint export', 'local checkpoint import'],
    suggestedEndpoints: [],
    marketplaceCompatibility: { supported: false, mode: 'not-active', providerType: 'none', confidence: 'not-active', walletRequired: false, providerFields: [], routingHints: [] }
  };
}

export function getMissionNodeMarketplaceCompatibility() {
  return getMissionNodeSpec().marketplaceCompatibility;
}

export function getMissionNodeBootstrapGuide() {
  return '# Local plan archive\n\nThis release has no local node, relay, remote worker, wallet, marketplace, or background execution. Use encrypted local checkpoint export/import only.';
}

export function getMissionNodeInstallerKit() {
  return '# Local plan archive\n\nNo installer is provided. EONAPP does not install a node or background helper in this release.';
}

export function downloadMissionNodeInstallerKit() {
  const text = getMissionNodeInstallerKit();
  downloadTextFile(`eon-local-plan-archive-${Date.now()}.md`, text, 'text/markdown');
  return text;
}

export function downloadMissionNodeBootstrapGuide() {
  const text = getMissionNodeBootstrapGuide();
  downloadTextFile(`eon-local-plan-archive-${Date.now()}.md`, text, 'text/markdown');
  return text;
}
