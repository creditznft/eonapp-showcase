/**
 * W310 — shared local-first Task / Artifact / Review contracts.
 *
 * This is one vocabulary for Chat, Workspace, Guided Workflows and City. The
 * contract contains no raw prompt, provider key, account, URL credential, or
 * execution method. Persistence and rendering are deliberately separate.
 */

export const EON_TASK_GRAPH_SCHEMA = 'eonapp.task-graph.v1';
export const EON_ARTIFACT_SCHEMA = 'eonapp.artifact.v1';
export const EON_REVIEW_SCHEMA = 'eonapp.review-record.v1';

export const EON_TASK_STATES = Object.freeze(['draft', 'ready', 'running', 'review-needed', 'completed', 'paused', 'failed', 'cancelled']);
export const EON_ROLE_PROFILES = Object.freeze(['coordinator', 'researcher', 'writer', 'builder', 'media-planner', 'media-runner', 'reviewer', 'exporter']);
export const EON_PRIVACY_CLASSES = Object.freeze(['device-local', 'direct-to-provider']);
export const EON_ARTIFACT_PROVENANCE = Object.freeze(['guide', 'local-runtime', 'direct-provider', 'user-imported']);
export const EON_ARTIFACT_TRUTH_LABELS = Object.freeze(['drafted', 'generated-locally', 'generated-by-selected-provider', 'prepared-for-export', 'manually-submitted']);

const TASK_ID_RE = /^eontask_[a-z0-9_-]{12,120}$/i;
const ARTIFACT_ID_RE = /^eonart_[a-z0-9_-]{12,120}$/i;
const REVIEW_ID_RE = /^eonreview_[a-z0-9_-]{12,120}$/i;
const PROJECT_ID_RE = /^eonproj_[a-z0-9_-]{4,120}$/i;
const HASH_RE = /^sha256:[A-Za-z0-9_-]{32,128}$/;

function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.getRandomValues) throw new Error('Web Crypto is unavailable in this browser.');
  return api;
}

function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable in this browser.');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function cleanIso(value = '', fallback = Date.now()) {
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function uniqueTextList(value = [], pattern, max) {
  if (!Array.isArray(value) || value.length > max) throw new Error('Task contract list is out of bounds.');
  const records = value.map((item) => String(item || '').trim()).filter(Boolean);
  if (!records.every((item) => pattern.test(item))) throw new Error('Task contract contains an invalid opaque identifier.');
  return Object.freeze([...new Set(records)].sort());
}

function localId(prefix, { cryptoApi = null } = {}) {
  const bytes = cryptoFor(cryptoApi).getRandomValues(new Uint8Array(18));
  return `${prefix}_${toBase64Url(bytes)}`;
}

function safeNode(node = {}, { now = Date.now() } = {}) {
  const source = node && typeof node === 'object' ? node : {};
  const nodeId = String(source.nodeId || '').trim();
  const role = String(source.role || '').trim();
  const state = EON_TASK_STATES.includes(String(source.state || '')) ? String(source.state) : 'draft';
  const privacyClass = EON_PRIVACY_CLASSES.includes(String(source.privacyClass || '')) ? String(source.privacyClass) : 'device-local';
  const expectedArtifacts = Array.isArray(source.expectedArtifacts)
    ? source.expectedArtifacts.map((item) => cleanText(item, 48)).filter(Boolean).slice(0, 8)
    : [];
  if (!/^[a-z][a-z0-9-]{1,80}$/i.test(nodeId) || !EON_ROLE_PROFILES.includes(role)) throw new Error('Task node is invalid.');
  if (state === 'running' && source.foregroundOnly !== true) throw new Error('A local-first task node may run only in the foreground.');
  return Object.freeze({
    nodeId,
    role,
    state,
    privacyClass,
    expectedArtifacts: Object.freeze([...new Set(expectedArtifacts)]),
    foregroundOnly: true,
    externalEffect: false,
    createdAt: cleanIso(source.createdAt, now),
    updatedAt: cleanIso(source.updatedAt, now)
  });
}

export function createEonTaskId(options = {}) { return localId('eontask', options); }
export function createEonArtifactId(options = {}) { return localId('eonart', options); }
export function createEonReviewId(options = {}) { return localId('eonreview', options); }

export function createEonTaskGraph(input = {}, { now = Date.now(), cryptoApi = null } = {}) {
  const title = cleanText(input.title, 180);
  const projectId = String(input.projectId || '').trim();
  if (!title || !PROJECT_ID_RE.test(projectId)) throw new Error('A task needs a local project ID and a short title.');
  const nodes = (Array.isArray(input.nodes) ? input.nodes : []).map((node) => safeNode(node, { now }));
  if (!nodes.length || nodes.length > 16) throw new Error('A task graph needs between one and sixteen bounded nodes.');
  const nodeIds = new Set(nodes.map((node) => node.nodeId));
  if (nodeIds.size !== nodes.length) throw new Error('Task graph node IDs must be unique.');
  const privacyClass = EON_PRIVACY_CLASSES.includes(String(input.privacyClass || '')) ? String(input.privacyClass) : 'device-local';
  if (privacyClass === 'device-local' && nodes.some((node) => node.privacyClass !== 'device-local')) throw new Error('A device-local task graph cannot include a direct-provider node.');
  const createdAt = cleanIso(input.createdAt, now);
  return Object.freeze({
    schema: EON_TASK_GRAPH_SCHEMA,
    version: 1,
    taskId: TASK_ID_RE.test(String(input.taskId || '')) ? String(input.taskId) : createEonTaskId({ cryptoApi }),
    projectId,
    title,
    state: EON_TASK_STATES.includes(String(input.state || '')) ? String(input.state) : 'draft',
    privacyClass,
    nodes: Object.freeze(nodes),
    foregroundOnly: true,
    backgroundAfterClose: false,
    externalEffect: false,
    rawPromptStored: false,
    createdAt,
    updatedAt: cleanIso(input.updatedAt, now)
  });
}

export function createEonArtifact(input = {}, { now = Date.now(), cryptoApi = null } = {}) {
  const projectId = String(input.projectId || '').trim();
  const taskId = String(input.taskId || '').trim();
  const kind = cleanText(input.kind, 48);
  const contentHash = String(input.contentHash || '').trim();
  const provenance = String(input.provenance || '').trim();
  const truthLabel = String(input.truthLabel || '').trim();
  if (!PROJECT_ID_RE.test(projectId) || !TASK_ID_RE.test(taskId) || !/^[a-z][a-z0-9-]{1,47}$/i.test(kind) || !HASH_RE.test(contentHash)) throw new Error('Artifact binding or hash is invalid.');
  if (!EON_ARTIFACT_PROVENANCE.includes(provenance) || !EON_ARTIFACT_TRUTH_LABELS.includes(truthLabel)) throw new Error('Artifact provenance or truth label is invalid.');
  const reviewStatus = ['unreviewed', 'review-needed', 'reviewed', 'rejected'].includes(String(input.reviewStatus || '')) ? String(input.reviewStatus) : 'unreviewed';
  return Object.freeze({
    schema: EON_ARTIFACT_SCHEMA,
    version: 1,
    artifactId: ARTIFACT_ID_RE.test(String(input.artifactId || '')) ? String(input.artifactId) : createEonArtifactId({ cryptoApi }),
    projectId,
    taskId,
    kind,
    contentHash,
    provenance,
    truthLabel,
    reviewStatus,
    localOnly: true,
    publicUpload: false,
    createdAt: cleanIso(input.createdAt, now)
  });
}

export function createEonReviewRecord(input = {}, { now = Date.now(), cryptoApi = null } = {}) {
  const taskId = String(input.taskId || '').trim();
  const artifactIds = uniqueTextList(input.artifactIds || [], ARTIFACT_ID_RE, 32);
  if (!TASK_ID_RE.test(taskId) || !artifactIds.length) throw new Error('A local review needs one task and at least one artifact reference.');
  const status = ['review-needed', 'reviewed', 'rejected', 'expired'].includes(String(input.status || '')) ? String(input.status) : 'review-needed';
  const createdAt = cleanIso(input.createdAt, now);
  const expiresAt = cleanIso(input.expiresAt, Number(now) + 24 * 60 * 60 * 1000);
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) throw new Error('A local review expiry must be after creation.');
  return Object.freeze({
    schema: EON_REVIEW_SCHEMA,
    version: 1,
    reviewId: REVIEW_ID_RE.test(String(input.reviewId || '')) ? String(input.reviewId) : createEonReviewId({ cryptoApi }),
    taskId,
    artifactIds,
    status,
    createdAt,
    expiresAt,
    externalEffect: false,
    canApproveExternalEffect: false,
    rawContentStored: false
  });
}

export function getEonTaskContractTruth() {
  return Object.freeze({
    schema: EON_TASK_GRAPH_SCHEMA,
    foregroundOnly: true,
    backgroundAfterClose: false,
    externalExecution: false,
    rawPromptStoredByContract: false,
    artifactsRequireHash: true,
    reviewCanApproveExternalEffect: false,
    directNetwork: false,
    localStorage: false
  });
}
