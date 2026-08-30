/**
 * agent-orchestrator.js
 * Policy-enforced orchestration for EONBOT, Creator Studio, and remote command bridges.
 *
 * Goals:
 * - Keep autonomous workflows useful without allowing unsafe or spammy automation.
 * - Require explicit human approval for high-risk actions.
 * - Keep remote channels (for example Telegram bridges) sandboxed by default.
 * 
 * Phase 1.1 enhancements: Audit trail, retry logic, rate limiting, error categorization, admin override
 * Phase 3.1 enhancement: Structured logging integration (logger injected via setLogger)
 */

// Logger reference (injected from outside to avoid circular deps)
/** @type {any} */
let loggerInstance = null;

/**
 * @param {any} logger
 */
export function setAgentOrchestratorLogger(/** @type {any} */ logger) {
  loggerInstance = logger;
}

/** @returns {any} */
export function getAgentOrchestratorLogger() {
  return loggerInstance;
}

const JOBS_KEY = 'eon:agent-orchestrator:jobs:v1';
const NONCE_CACHE_KEY = 'eon:agent-orchestrator:nonces:v1';
const AUDIT_LOG_KEY = 'eon:agent-orchestrator:audit:v1';
const RATE_LIMIT_KEY = 'eon:agent-orchestrator:rate-limits:v1';

const MAX_JOBS = 200;
const MAX_NONCES = 300;
const MAX_AUDIT_ENTRIES = 500;
const NONCE_WINDOW_MS = 1000 * 60 * 10;
const JOB_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // 7 days — P1 expiry policy
const MANIFEST_SCHEMA_VERSION = 'agent-job-manifest/v1';
const RECEIPT_SCHEMA_VERSION = 'approval-receipt/v1';
const BROWSER_TIMELINE_SCHEMA_VERSION = 'browser-action-timeline/v1';
const STEP_RESULT_SCHEMA_VERSION = 'agent-step-result/v1';
const MISSION_SCHEMA_VERSION = 'agent-mission/v2';

// Rate limiting: actions per hour (per action type)
const RATE_LIMITS = {
  publish: { limit: 5, window: 1000 * 60 * 60 }, // 5 per hour
  voice: { limit: 20, window: 1000 * 60 * 60 },
  video: { limit: 10, window: 1000 * 60 * 60 },
  default: { limit: 50, window: 1000 * 60 * 60 }
};

// Retry policy: exponential backoff
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
};

const /** @type {any} */
ALLOWED_ACTIONS = new Set([
  'plan',
  'research',
  'idea',
  'build',
  'code',
  'image',
  'music',
  'script',
  'voice',
  'subtitles',
  'video',
  'distribute_prepare',
  'publish',
  'chat_reply',
  'eonbrowser_assist'
]);

const /** @type {any} */
ALWAYS_BLOCKED_PATTERNS = [
  /(mass\s*(like|follow|comment|dm|message))/i,
  /(auto\s*(like|follow|comment|dm|message))/i,
  /(credential\s*stuffing|token\s*theft|wallet\s*drain)/i
];

const /** @type {any} */
HIGH_RISK_ACTIONS = new Set(['publish']);
const /** @type {any} */
REMOTE_CHANNELS = new Set(['telegram', 'webhook', 'api-bridge']);

function safeParseJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch {}
  return fallback;
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function uid(/** @type {any} */ prefix = 'job') {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

function sanitizeText(/** @type {any} */ value, /** @type {any} */ max = 4000) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function maskSecretLikeText(/** @type {any} */ value, /** @type {any} */ max = 4000) {
  return sanitizeText(value, max)
    .replace(/\b(sk-(?:proj-)?[A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|sk-or-v1-[A-Za-z0-9_-]{12,})\b/g, '[redacted-api-key]')
    .replace(/\b(gsk_[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{12,}|hf_[A-Za-z0-9]{12,})\b/g, '[redacted-api-key]')
    .replace(/\b([A-Fa-f0-9]{32,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, '[redacted-token]');
}

/**
 * @param {any} value
 * @param {number} depth
 * @returns {any}
 */
function redactForAudit(value, depth = 0) {
  if (value == null) return value;
  if (depth > 5) return '[redacted-depth-limit]';
  if (typeof value === 'string') return maskSecretLikeText(value, 1200);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((/** @type {any} */ item) => redactForAudit(item, depth + 1));
  if (typeof value === 'object') {
    const /** @type {any} */ out = {};
    for (const [key, item] of Object.entries(value)) {
      if (/(key|secret|token|password|credential|authorization|signature)/i.test(key)) {
        out[key] = '[redacted]';
      } else {
        out[key] = redactForAudit(item, depth + 1);
      }
    }
    return out;
  }
  return maskSecretLikeText(String(value), 1200);
}

/**
 * @param {any} value
 * @returns {string}
 */
function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((/** @type {any} */ item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((/** @type {string} */ key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

/**
 * @param {any} value
 * @returns {string}
 */
function localAuditHash(value) {
  const input = stableStringify(redactForAudit(value));
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

/**
 * @param {any} seed
 * @returns {string}
 */
function buildIdempotencyKey(seed) {
  return `idem:${localAuditHash(seed)}`;
}

/**
 * @param {any} step
 * @returns {string}
 */
function buildStepRole(step) {
  const normalized = normalizeAction(step);
  if (normalized === 'research') return 'planner';
  if (normalized === 'plan' || normalized === 'idea' || normalized === 'script') return 'planner';
  if (normalized === 'build' || normalized === 'code' || normalized === 'image' || normalized === 'music' || normalized === 'video' || normalized === 'voice' || normalized === 'subtitles') return 'worker';
  if (normalized === 'publish' || normalized === 'distribute_prepare' || normalized === 'chat_reply' || normalized === 'eonbrowser_assist') return 'verifier';
  return 'worker';
}

/**
 * @param {any} step
 * @returns {string}
 */
function buildStepRisk(step) {
  const normalized = normalizeAction(step);
  if (normalized === 'publish') return 'high';
  if (normalized === 'video' || normalized === 'music' || normalized === 'code') return 'medium';
  return 'low';
}

/**
 * @param {any} job
 * @returns {any}
 */
function buildMissionObject(job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  return {
    schema: MISSION_SCHEMA_VERSION,
    missionId: sanitizeText(job?.id || uid('mission'), 120),
    title: sanitizeText(job?.title || 'Untitled mission', 160),
    origin: sanitizeText(job?.origin || 'local-ui', 80),
    intentText: sanitizeText(job?.intentText || '', 1200),
    idempotencyKey: sanitizeText(job?.idempotencyKey || '', 160),
    status: sanitizeText(job?.status || 'ready', 40),
    steps: steps.map((/** @type {any} */ step, /** @type {number} */ index) => ({
      step: normalizeAction(step),
      stepIndex: index,
      role: buildStepRole(step),
      risk: buildStepRisk(step),
      requiresApproval: HIGH_RISK_ACTIONS.has(normalizeAction(step))
    })),
    approvals: {
      approvedByHuman: Boolean(job?.approvedByHuman),
      pendingApprovals: Array.isArray(job?.pendingApprovals) ? job.pendingApprovals.slice() : []
    },
    metadata: redactForAudit(job?.metadata || {}),
    createdAt: Number(job?.createdAt || Date.now()),
    updatedAt: Number(job?.updatedAt || Date.now())
  };
}

/**
 * @param {any} job
 * @returns {any}
 */
function normalizeMissionJobRecord(job) {
  if (!job || typeof job !== 'object') return null;
  const steps = Array.isArray(job.steps) ? job.steps.map((/** @type {any} */ step) => normalizeAction(step)).filter((/** @type {any} */ step) => ALLOWED_ACTIONS.has(step)) : [];
  const idempotencyKey = sanitizeText(job.idempotencyKey || '', 160) || buildIdempotencyKey({
    id: sanitizeText(job.id || '', 120),
    origin: sanitizeText(job.origin || '', 80),
    intentText: sanitizeText(job.intentText || '', 1200),
    steps
  });
  const mission = buildMissionObject({
    ...job,
    steps,
    idempotencyKey
  });
  return {
    ...job,
    schema: MISSION_SCHEMA_VERSION,
    idempotencyKey,
    mission,
    steps,
    metadata: redactForAudit(job.metadata || {}),
    policyDecisions: redactForAudit(job.policyDecisions || []),
    pendingApprovals: Array.isArray(job.pendingApprovals) ? job.pendingApprovals : [],
    approvalReceipt: job.approvalReceipt && typeof job.approvalReceipt === 'object' ? redactForAudit(job.approvalReceipt) : null,
    execution: job.execution && typeof job.execution === 'object' ? redactForAudit(job.execution) : null,
    browserTimeline: job.browserTimeline && typeof job.browserTimeline === 'object' ? redactForAudit(job.browserTimeline) : null,
    retries: Array.isArray(job.retries) ? redactForAudit(job.retries) : [],
    errorLog: Array.isArray(job.errorLog) ? redactForAudit(job.errorLog) : [],
    updatedAt: Number(job.updatedAt || Date.now())
  };
}

/**
 * @param {any} job
 * @returns {string}
 */
function buildHumanSummary(job) {
  const steps = Array.isArray(job?.steps) ? job.steps.join(' -> ') : 'no steps';
  return `${job?.title || 'Untitled job'} | ${job?.origin || 'unknown-origin'} | ${steps}`;
}

/**
 * @param {any} action
 * @returns {string}
 */
function normalizeAction(action) {
  const normalized = sanitizeText(action, 80).toLowerCase().replace(/\s+/g, '_');
  return normalized;
}

/**
 * @param {any} origin
 * @returns {string}
 */
function normalizeOrigin(origin) {
  return sanitizeText(origin, 60).toLowerCase() || 'local-ui';
}

async function generateHMACSHA256(/** @type {string} */ message, /** @type {string} */ key) {
  try {
    const webCrypto = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
    if (!webCrypto?.subtle) return '';
    const enc = new TextEncoder();
    const cryptoKey = await webCrypto.subtle.importKey(
      'raw',
      enc.encode(String(key || '')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await webCrypto.subtle.sign('HMAC', cryptoKey, enc.encode(String(message || '')));
    return Array.from(new Uint8Array(sig)).map((/** @type {number} */ b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

function secureCompare(/** @type {string} */ a, /** @type {string} */ b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parseIntentToPlan(/** @type {any} */ text) {
  const lower = sanitizeText(text, 600).toLowerCase();

  if (!lower) {
    return {
      title: 'Empty intent',
      steps: ['plan']
    };
  }

  const wantsPublish = /(publish|post|distribute|ship|upload)/i.test(lower);
  const wantsVoice = /(voice|podcast|tts|audio)/i.test(lower);
  const wantsVideo = /(video|reel|short|youtube)/i.test(lower);
  const wantsMusic = /(music|song|beat|audio track|mix|remix|dj)/i.test(lower);
  const wantsImage = /(image|thumbnail|poster|graphic|cover art|visual)/i.test(lower);
  const wantsCode = /(code|coding|website|app|builder|monaco|editor)/i.test(lower);
  const wantsResearch = /(research|browse|browser|compare|analyze|analysis|investigate|summarize|scan|scrape|competitor|market)/i.test(lower);
  const wantsBrowserAssist = /(browser|navigate|open|login|click|form|website|page|tab|url)/i.test(lower);
  const wantsReply = /(reply|respond|answer|draft response|message|email response)/i.test(lower);

  const /** @type {any} */
steps = ['plan', 'idea', 'script'];
  if (wantsResearch) steps.unshift('research');
  if (wantsCode) steps.unshift('build');
  if (wantsImage) steps.push('image');
  if (wantsMusic) steps.push('music');
  if (wantsVoice) steps.push('voice', 'subtitles');
  if (wantsVideo) steps.push('video');
  if (wantsBrowserAssist) steps.push('eonbrowser_assist');
  if (wantsReply) steps.push('chat_reply');
  steps.push('distribute_prepare');
  if (wantsPublish) steps.push('publish');

  return {
    title: sanitizeText(text, 100) || 'Creator pipeline request',
    steps
  };
}

function hasAlwaysBlockedPattern(/** @type {any} */ text) {
  return ALWAYS_BLOCKED_PATTERNS.some((/** @type {any} */ rx) => rx.test(String(text || '')));
}

function validateAction(/** @type {any} */ action) {
  const normalized = normalizeAction(action);
  if (!ALLOWED_ACTIONS.has(normalized)) {
    return { ok: false, reason: `Action not allowlisted: ${normalized}` };
  }
  return { ok: true, action: normalized };
}

/**
 * @returns {any[]}
 */
function loadJobs() {
  const rows = safeParseJson(JOBS_KEY, { jobs: [] });
  if (!Array.isArray(rows.jobs)) return [];
  // P1: Purge jobs older than 7 days to prevent unbounded localStorage growth
  const cutoff = Date.now() - JOB_EXPIRY_MS;
  const fresh = rows.jobs
    .filter((/** @type {any} */ job) => job && job.createdAt && job.createdAt >= cutoff)
    .map((/** @type {any} */ job) => normalizeMissionJobRecord(job))
    .filter(Boolean);
  return fresh.slice(-MAX_JOBS);
}

/**
 * @param {any[]} jobs
 */
function saveJobs(jobs) {
  saveJson(JOBS_KEY, { jobs: jobs.slice(-MAX_JOBS) });
}

/**
 * @returns {any[]}
 */
function loadNonces() {
  const rows = safeParseJson(NONCE_CACHE_KEY, { nonces: [] });
  const now = Date.now();
  const nonces = Array.isArray(rows.nonces)
    ? rows.nonces.filter((/** @type {any} */ entry) => entry && entry.ts && now - entry.ts <= NONCE_WINDOW_MS)
    : [];
  return nonces.slice(-MAX_NONCES);
}

/**
 * @param {any[]} nonces
 */
function saveNonces(nonces) {
  saveJson(NONCE_CACHE_KEY, { nonces: nonces.slice(-MAX_NONCES) });
}

/**
 * @returns {any[]}
 */
function loadAuditLog() {
  const rows = safeParseJson(AUDIT_LOG_KEY, { entries: [] });
  if (!Array.isArray(rows.entries)) return [];
  let previousHash = '';
  return rows.entries.slice(-MAX_AUDIT_ENTRIES).map((/** @type {any} */ raw) => {
    const entry = /** @type {any} */ ({
      id: sanitizeText(raw?.id || uid('audit'), 80),
      jobId: sanitizeText(raw?.jobId || '', 120),
      action: sanitizeText(raw?.action || 'legacy_audit_event', 120),
      status: sanitizeText(raw?.status || 'unknown', 80),
      result: maskSecretLikeText(raw?.result || '', 500),
      errorLog: maskSecretLikeText(raw?.errorLog || '', 500),
      details: redactForAudit(raw?.details || {}),
      previousHash,
      timestamp: Number(raw?.timestamp || Date.now())
    });
    entry.entryHash = localAuditHash(entry);
    previousHash = entry.entryHash;
    return entry;
  });
}

/**
 * @param {any[]} entries
 */
function saveAuditLog(entries) {
  saveJson(AUDIT_LOG_KEY, { entries: entries.slice(-MAX_AUDIT_ENTRIES) });
}

/**
 * @param {{ jobId?: any, action?: any, status?: any, result?: any, errorLog?: any, details?: any }} param0
 */
function addAuditEntry({ jobId, action, status, result, errorLog = '', details = {} }) {
  const entries = loadAuditLog();
  const previousHash = entries.length ? entries[entries.length - 1].entryHash || '' : '';
  const entry = /** @type {any} */ ({
    id: uid('audit'),
    jobId,
    action: sanitizeText(action, 120),
    status: sanitizeText(status, 80), // 'pending', 'executing', 'success', 'failed', 'retrying', 'rejected'
    result: maskSecretLikeText(String(result || ''), 500),
    errorLog: maskSecretLikeText(String(errorLog || ''), 500),
    details: redactForAudit(details),
    previousHash,
    timestamp: Date.now()
  });
  entry.entryHash = localAuditHash(entry);
  entries.push(entry);
  saveAuditLog(entries);
  return entry;
}

/**
 * @returns {Record<string, number[]>}
 */
function loadRateLimits() {
  const rows = safeParseJson(RATE_LIMIT_KEY, { perAction: {} });
  if (!rows.perAction || typeof rows.perAction !== 'object') return {};
  return rows.perAction;
}

/**
 * @param {Record<string, number[]>} perAction
 */
function saveRateLimits(perAction) {
  saveJson(RATE_LIMIT_KEY, { perAction });
}

/**
 * @param {string} action
 */
function checkAndUpdateRateLimit(action) {
  const limits = /** @type {Record<string, number[]>} */ (loadRateLimits());
  const now = Date.now();
  const config = /** @type {Record<string, { limit: number, window: number }>} */ (RATE_LIMITS)[String(action)] || RATE_LIMITS.default;

  if (!limits[action]) {
    limits[action] = [];
  }

  // Purge old entries outside the window
  limits[action] = limits[action].filter((/** @type {any} */ ts) => now - ts < config.window);

  const count = limits[action].length;
  if (count >= config.limit) {
    return {
      allowed: false,
      reason: `Rate limit exceeded for action '${action}': ${count}/${config.limit} in last hour.`,
      count,
      limit: config.limit,
      resetAtMs: limits[action][0] + config.window
    };
  }

  // Record this action
  limits[action].push(now);
  saveRateLimits(limits);

  return {
    allowed: true,
    count: count + 1,
    limit: config.limit,
    remaining: config.limit - (count + 1)
  };
}

/**
 * @param {any} error
 * @returns {string}
 */
function categorizeError(error) {
  const msg = String(error || '').toLowerCase();
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('econnrefused')) {
    return 'transient'; // Retryable
  }
  if (msg.includes('policy') || msg.includes('permission') || msg.includes('blocked')) {
    return 'policy'; // Non-retryable
  }
  if (msg.includes('invalid') || msg.includes('syntax')) {
    return 'technical'; // Non-retryable
  }
  return 'permanent'; // Unknown, assume permanent
}

async function verifyAdminOverride(/** @type {any} */ { nonce, timestamp, signature = '', adminKey = '' }) {
  const now = Date.now();
  // Admin nonce window: 5 minutes
  if (Math.abs(now - timestamp) > 1000 * 60 * 5) {
    return { ok: false, reason: 'Admin override expired (> 5 min old).' };
  }

  if (!signature) {
    return { ok: false, reason: 'Missing admin signature.' };
  }

  // W636: an admin override key must be supplied for this one reviewed call.
  // Ordinary localStorage is not a trusted administrative custody boundary.
  const resolvedKey = String(adminKey || '').trim();
  if (!resolvedKey) {
    return { ok: false, reason: 'An explicit non-persistent admin key is required for signature verification.' };
  }

  // Use message format: "override:<nonce>:<timestamp>"
  const messageForVerification = `override:${nonce}:${timestamp}`;
  const expectedSignature = await generateHMACSHA256(messageForVerification, resolvedKey);
  if (!expectedSignature || !secureCompare(String(signature), expectedSignature)) {
    return { ok: false, reason: 'Admin signature verification failed.' };
  }

  // Check nonce uniqueness (replay protection)
  const nonces = loadNonces();
  if (nonces.some((/** @type {any} */ entry) => entry.nonce === nonce)) {
    return { ok: false, reason: 'Admin nonce already used (replay attempt detected).' };
  }

  nonces.push({ nonce, ts: Date.now(), channel: 'admin-override' });
  saveNonces(nonces);

  return { ok: true };
}

class AgentOrchestrator {
  constructor() {
    this.jobs = loadJobs();
    this.migrateLegacyJobs();
  }

  migrateLegacyJobs() {
    let changed = false;
    this.jobs = this.jobs.map((/** @type {any} */ job) => {
      const normalized = normalizeMissionJobRecord(job);
      if (!normalized) return job;
      changed = changed || normalized.schema !== job.schema || normalized.idempotencyKey !== job.idempotencyKey || JSON.stringify(normalized.steps) !== JSON.stringify(job.steps);
      return normalized;
    });
    if (changed) saveJobs(this.jobs);
    return { ok: true, changed };
  }

  // ============ AUDIT LOG & OBSERVABILITY ============

  getAuditLog(/** @type {any} */ limit = 50) {
    const entries = loadAuditLog();
    return entries.slice(-Math.max(1, Math.min(100, limit))).reverse();
  }

  getJobExecutionHistory(/** @type {any} */ jobId) {
    const entries = loadAuditLog();
    return entries.filter((/** @type {any} */ e) => e.jobId === jobId);
  }

  /**
   * @param {any[]} entries
   * @returns {{ ok: boolean, entries?: number, lastHash?: string, brokenAt?: any }}
   */
  verifyAuditChain(entries = loadAuditLog()) {
    const rows = Array.isArray(entries) ? entries : [];
    let previousHash = '';
    for (const entry of rows) {
      const expectedPrevious = entry.previousHash || '';
      const recordedHash = entry.entryHash || '';
      const clone = /** @type {any} */ ({ ...entry });
      delete clone.entryHash;
      if (expectedPrevious !== previousHash || recordedHash !== localAuditHash(clone)) {
        return { ok: false, brokenAt: entry.id || entry.timestamp || 'unknown' };
      }
      previousHash = recordedHash;
    }
    return { ok: true, entries: rows.length, lastHash: previousHash };
  }

  /**
   * @param {any} job
   * @param {any} approver
   * @returns {any}
   */
  createApprovalReceipt(job, approver = 'operator') {
    const receipt = /** @type {any} */ ({
      schema: RECEIPT_SCHEMA_VERSION,
      receiptId: uid('approval'),
      jobId: job.id,
      approvedBy: sanitizeText(approver, 80) || 'operator',
      approvedAt: Date.now(),
      title: sanitizeText(job.title, 160),
      origin: sanitizeText(job.origin, 80),
      approvedSteps: Array.isArray(job.pendingApprovals) && job.pendingApprovals.length
        ? job.pendingApprovals.slice()
        : (Array.isArray(job.steps) ? job.steps.filter((/** @type {any} */ step) => HIGH_RISK_ACTIONS.has(step)) : []),
      humanSummary: buildHumanSummary(job),
      safetySummary: {
        highRiskActions: Array.from(HIGH_RISK_ACTIONS),
        approvalRequiredFor: Array.isArray(job.pendingApprovals) ? job.pendingApprovals.slice() : [],
        remotePublishDefault: 'blocked-until-human-approval'
      }
    });
    receipt.receiptHash = localAuditHash(receipt);
    receipt.receiptText = `Approval ${receipt.receiptId}: ${receipt.humanSummary}. Approved by ${receipt.approvedBy} at ${new Date(receipt.approvedAt).toISOString()}. Hash ${receipt.receiptHash}.`;
    return receipt;
  }

  /**
   * @param {{ jobId: any, step?: any, action?: any, target?: any, outcome?: any, status?: any, evidence?: any }} param0
   * @returns {any}
   */
  recordBrowserAction({ jobId, step = 'browser_action', action = '', target = '', outcome = '', status = 'success', evidence = {} }) {
    const job = this.getJob(jobId);
    if (!job) return null;

    if (!job.browserTimeline) {
      job.browserTimeline = {
        schema: BROWSER_TIMELINE_SCHEMA_VERSION,
        startedAt: Date.now(),
        steps: []
      };
    }

    const previousHash = job.browserTimeline.steps.length
      ? job.browserTimeline.steps[job.browserTimeline.steps.length - 1].stepHash || ''
      : '';
    const timelineStep = /** @type {any} */ ({
      id: uid('browser-step'),
      step: sanitizeText(step, 100),
      action: maskSecretLikeText(action, 300),
      target: maskSecretLikeText(target, 500),
      outcome: maskSecretLikeText(outcome, 500),
      status: sanitizeText(status, 80),
      evidence: redactForAudit(evidence),
      previousHash,
      timestamp: Date.now()
    });
    timelineStep.stepHash = localAuditHash(timelineStep);
    job.browserTimeline.steps.push(timelineStep);
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: `browser:${timelineStep.step}`,
      status: timelineStep.status,
      result: timelineStep.outcome,
      details: {
        target: timelineStep.target,
        stepHash: timelineStep.stepHash,
        previousHash: timelineStep.previousHash
      }
    });

    return timelineStep;
  }

  /**
   * @param {any} jobId
   * @returns {any}
   */
  exportJobManifest(jobId) {
    const job = this.getJob(jobId);
    if (!job) return null;
    const auditEntries = this.getJobExecutionHistory(jobId);
    const manifest = /** @type {any} */ ({
      schema: MANIFEST_SCHEMA_VERSION,
      exportedAt: Date.now(),
      job: redactForAudit({
        id: job.id,
        schema: job.schema || MISSION_SCHEMA_VERSION,
        title: job.title,
        origin: job.origin,
        intentText: job.intentText,
        idempotencyKey: job.idempotencyKey || '',
        steps: job.steps,
        status: job.status,
        pendingApprovals: job.pendingApprovals,
        approvedByHuman: job.approvedByHuman,
        approvedAt: job.approvedAt,
        approvedBy: job.approvedBy,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        notes: job.notes,
        failureReason: job.failureReason,
        metadata: job.metadata,
        mission: job.mission || buildMissionObject(job)
      }),
      approvalReceipt: redactForAudit(job.approvalReceipt || null),
      execution: redactForAudit(job.execution || null),
      retries: redactForAudit(job.retries || []),
      browserTimeline: redactForAudit(job.browserTimeline || null),
      auditTrail: redactForAudit(auditEntries),
      auditVerification: this.verifyAuditChain(loadAuditLog())
    });
    manifest.manifestHash = localAuditHash(manifest);
    return manifest;
  }

  /**
   * @param {any} manifestInput
   * @returns {any}
   */
  importJobManifest(manifestInput) {
    let manifest = manifestInput;
    if (typeof manifestInput === 'string') {
      try {
        manifest = JSON.parse(manifestInput);
      } catch {
        return { ok: false, reason: 'Invalid mission manifest JSON.' };
      }
    }

    if (!manifest || manifest.schema !== MANIFEST_SCHEMA_VERSION || typeof manifest !== 'object') {
      return { ok: false, reason: `Unsupported mission manifest schema. Expected ${MANIFEST_SCHEMA_VERSION}.` };
    }

    const rawJob = manifest.job && typeof manifest.job === 'object' ? manifest.job : null;
    if (!rawJob) {
      return { ok: false, reason: 'Mission manifest is missing a job payload.' };
    }

    const jobId = sanitizeText(rawJob.id || uid('job'), 120);
    const existingIndex = this.jobs.findIndex((/** @type {any} */ job) => job.id === jobId);
    const existing = existingIndex >= 0 ? this.jobs[existingIndex] : null;
    const nextJob = /** @type {any} */ ({
      ...(existing || {}),
      id: jobId,
      schema: MISSION_SCHEMA_VERSION,
      title: sanitizeText(rawJob.title || existing?.title || 'Imported mission', 160),
      origin: sanitizeText(rawJob.origin || existing?.origin || 'imported', 80),
      intentText: sanitizeText(rawJob.intentText || existing?.intentText || '', 1200),
      idempotencyKey: sanitizeText(rawJob.idempotencyKey || existing?.idempotencyKey || '', 160),
      steps: Array.isArray(rawJob.steps) ? rawJob.steps.map((/** @type {any} */ step) => normalizeAction(step)).filter((/** @type {any} */ step) => ALLOWED_ACTIONS.has(step)) : (Array.isArray(existing?.steps) ? existing.steps : []),
      status: sanitizeText(rawJob.status || existing?.status || 'ready', 40),
      pendingApprovals: Array.isArray(rawJob.pendingApprovals) ? rawJob.pendingApprovals.slice() : (Array.isArray(existing?.pendingApprovals) ? existing.pendingApprovals : []),
      approvedByHuman: Boolean(rawJob.approvedByHuman || existing?.approvedByHuman),
      approvedAt: rawJob.approvedAt || existing?.approvedAt || null,
      approvedBy: sanitizeText(rawJob.approvedBy || existing?.approvedBy || '', 80),
      createdAt: Number(rawJob.createdAt || existing?.createdAt || Date.now()),
      updatedAt: Date.now(),
      completedAt: rawJob.completedAt || existing?.completedAt || null,
      failedAt: rawJob.failedAt || existing?.failedAt || null,
      notes: sanitizeText(rawJob.notes || existing?.notes || '', 500),
      failureReason: sanitizeText(rawJob.failureReason || existing?.failureReason || '', 500),
      metadata: redactForAudit(rawJob.metadata || existing?.metadata || {}),
      policyDecisions: redactForAudit(rawJob.policyDecisions || existing?.policyDecisions || []),
      execution: rawJob.execution && typeof rawJob.execution === 'object' ? redactForAudit(rawJob.execution) : (existing?.execution || null),
      retries: Array.isArray(rawJob.retries) ? redactForAudit(rawJob.retries) : (Array.isArray(existing?.retries) ? existing.retries : []),
      browserTimeline: rawJob.browserTimeline && typeof rawJob.browserTimeline === 'object'
        ? redactForAudit(rawJob.browserTimeline)
        : (existing?.browserTimeline || null),
      approvalReceipt: rawJob.approvalReceipt && typeof rawJob.approvalReceipt === 'object'
        ? redactForAudit(rawJob.approvalReceipt)
        : (existing?.approvalReceipt || null),
      errorLog: Array.isArray(rawJob.errorLog) ? redactForAudit(rawJob.errorLog) : (Array.isArray(existing?.errorLog) ? existing.errorLog : []),
      mission: rawJob.mission && typeof rawJob.mission === 'object'
        ? redactForAudit(rawJob.mission)
        : (existing?.mission || buildMissionObject({
          ...rawJob,
          steps: Array.isArray(rawJob.steps) ? rawJob.steps : []
        }))
    });

    if (existingIndex >= 0) {
      this.jobs[existingIndex] = nextJob;
    } else {
      this.jobs.push(nextJob);
    }

    nextJob.mission = buildMissionObject(nextJob);
    nextJob.mission.missionId = nextJob.id;

    saveJobs(this.jobs);
    addAuditEntry({
      jobId,
      action: 'job_manifest_imported',
      status: 'imported',
      result: `Imported mission manifest for "${nextJob.title}".`,
      details: {
        manifestHash: manifest.manifestHash || '',
        exportedAt: manifest.exportedAt || null,
        status: nextJob.status,
        stepCount: Array.isArray(nextJob.steps) ? nextJob.steps.length : 0
      }
    });

    return { ok: true, job: nextJob };
  }

  // ============ RATE LIMITING ============

  /**
   * @param {string} action
   * @returns {any}
   */
  checkRateLimit(action) {
    return checkAndUpdateRateLimit(action);
  }

  // ============ ERROR CATEGORIZATION & RETRY ============

  /**
   * @param {string} errorCategory
   * @returns {any}
   */
  getRetryPolicy(errorCategory) {
    if (errorCategory === 'transient') {
      return { shouldRetry: true, ...RETRY_CONFIG };
    }
    return { shouldRetry: false, reason: `Error category '${errorCategory}' is not retryable.` };
  }

  // ============ ADMIN OVERRIDE ============

  /**
   * @param {{ jobId: any, adminNonce: any, adminTimestamp: any, adminSignature: any, adminKey?: any }} param0
   * @returns {Promise<any>}
   */
  async canOverride({ jobId, adminNonce, adminTimestamp, adminSignature, adminKey = '' }) {
    const verification = await verifyAdminOverride({
      nonce: adminNonce,
      timestamp: adminTimestamp,
      signature: adminSignature,
      adminKey
    });

    if (!verification.ok) {
      return verification;
    }

    const job = this.getJob(jobId);
    if (!job) {
      return { ok: false, reason: 'Job not found.' };
    }

    return { ok: true, job };
  }

  /**
   * @param {{ jobId: any, adminNonce: any, adminTimestamp: any, adminSignature: any, adminKey?: any, reason?: any }} param0
   * @returns {Promise<any>}
   */
  async overrideJobBlocked({ jobId, adminNonce, adminTimestamp, adminSignature, adminKey = '', reason = 'admin override' }) {
    const verification = await this.canOverride({ jobId, adminNonce, adminTimestamp, adminSignature, adminKey });
    if (!verification.ok) {
      return verification;
    }

    const job = verification.job;
    job.status = 'ready';
    job.blockedOverrideAt = Date.now();
    job.blockedOverrideReason = sanitizeText(reason, 200);
    job.blockedOverrideNonce = adminNonce;
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: 'override_blocked',
      status: 'admin-override',
      result: `Job unblocked via admin override. Reason: ${reason}`
    });

    return { ok: true, job };
  }

  // ============ ENHANCED JOB TRACKING ============

  /**
   * @param {{ jobId: any, step: any, result: any, status?: any, errorLog?: any, artifact?: any, mission?: any, routing?: any, details?: any }} param0
   * @returns {any}
   */
  recordJobExecution({
    jobId,
    step,
    result,
    status = 'success',
    errorLog = '',
    artifact = null,
    mission = null,
    routing = null,
    details = {}
  }) {
    const job = this.getJob(jobId);
    if (!job) return;

    if (!job.execution) {
      job.execution = {
        startedAt: Date.now(),
        steps: []
      };
    }

    const stepExecutionId = sanitizeText(details?.stepExecutionId || `${jobId}:${step}:${job.execution.steps.length}`, 200);
    const stepIdempotencyKey = sanitizeText(details?.idempotencyKey || job.idempotencyKey || '', 160);
    const errorCategory = errorLog ? categorizeError(errorLog) : null;
    const stepRole = sanitizeText(details?.role || buildStepRole(step), 40);
    const stepRisk = sanitizeText(details?.risk || buildStepRisk(step), 20);
    job.execution.steps.push(/** @type {any} */ ({
      schema: STEP_RESULT_SCHEMA_VERSION,
      stepExecutionId,
      idempotencyKey: stepIdempotencyKey,
      step,
      role: stepRole,
      risk: stepRisk,
      status,
      result: maskSecretLikeText(String(result || ''), 300),
      errorLog: maskSecretLikeText(String(errorLog || ''), 300),
      errorCategory,
      artifact: redactForAudit(artifact),
      mission: redactForAudit(mission),
      routing: redactForAudit(routing),
      details: redactForAudit(details),
      timestamp: Date.now()
    }));

    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: `execute_step:${step}`,
      status,
      result,
      errorLog,
      details: {
        step,
        stepExecutionId,
        idempotencyKey: stepIdempotencyKey,
        role: stepRole,
        risk: stepRisk,
        errorCategory,
        executionStepCount: job.execution.steps.length,
        hasArtifact: !!artifact,
        hasMission: !!mission,
        hasRouting: !!routing
      }
    });

    job.mission = buildMissionObject(job);
    job.mission.missionId = job.id;

    return job;
  }

  recordJobRetry(/** @type {any} */ { jobId, step, retryCount, nextRetryAtMs, errorLog = '' }) {
    const job = this.getJob(jobId);
    if (!job) return;

    if (!job.retries) {
      job.retries = [];
    }

    job.retries.push({
      step,
      retryCount,
      nextRetryAtMs,
      errorLog: maskSecretLikeText(String(errorLog || ''), 300),
      timestamp: Date.now()
    });

    job.status = 'retrying';
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: `retry:${step}`,
      status: 'retrying',
      result: `Retry ${retryCount} scheduled, will retry at ${new Date(nextRetryAtMs).toISOString()}`,
      errorLog,
      details: { step, retryCount, nextRetryAtMs, errorCategory: categorizeError(errorLog) }
    });

    return job;
  }

  recordJobFailure(/** @type {any} */ { jobId, reason, errorLog = '' }) {
    const job = this.getJob(jobId);
    if (!job) return;

    job.status = 'failed';
    job.failedAt = Date.now();
    job.failureReason = sanitizeText(reason, 300);
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: 'job_failed',
      status: 'failed',
      result: reason,
      errorLog,
      details: { errorCategory: categorizeError(errorLog || reason) }
    });

    return job;
  }

  recordJobSuccess(/** @type {any} */ { jobId, result = '' }) {
    const job = this.getJob(jobId);
    if (!job) return;

    job.status = 'completed';
    job.completedAt = Date.now();
    job.completionResult = sanitizeText(String(result || ''), 500);
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: 'job_completed',
      status: 'success',
      result,
      details: { completedAt: job.completedAt, stepCount: Array.isArray(job.steps) ? job.steps.length : 0 }
    });

    return job;
  }

  getPolicySummary() {
    return {
      allowedActions: Array.from(ALLOWED_ACTIONS),
      highRiskActions: Array.from(HIGH_RISK_ACTIONS),
      blockedAutomation: ['mass likes', 'mass follows', 'mass comments', 'mass direct messages'],
      remoteChannels: Array.from(REMOTE_CHANNELS),
      remotePublishDefault: 'blocked-until-human-approval',
      rateLimits: RATE_LIMITS,
      retryConfig: RETRY_CONFIG
    };
  }

  listJobs(/** @type {any} */ limit = 25) {
    return this.jobs.slice(-Math.max(1, Math.min(100, limit))).reverse();
  }

  getJob(/** @type {any} */ jobId) {
    return this.jobs.find((/** @type {any} */ job) => job.id === jobId) || null;
  }

  evaluateAction(/** @type {any} */ { action, origin = 'local-ui', intentText = '', approvedByHuman = false }) {
    const originNorm = normalizeOrigin(origin);
    const intentNorm = sanitizeText(intentText, 1000);

    // ===== E1.1d: BETTER ERROR MESSAGES WITH CATEGORIZATION =====

    if (hasAlwaysBlockedPattern(intentNorm)) {
      return {
        allowed: false,
        blocked: true,
        errorCode: 'ANTI_ABUSE_BLOCKED',
        reason: 'Blocked by anti-abuse policy: mass automation or unsafe intent detected. Remediation: Contact admin if this is a legitimate use case.',
        category: 'policy'
      };
    }

    const valid = validateAction(action);
    if (!valid.ok) {
      return {
        allowed: false,
        blocked: true,
        errorCode: 'ACTION_NOT_ALLOWED',
        reason: `Action not allowed: ${valid.reason}. Allowed actions: ${Array.from(ALLOWED_ACTIONS).join(', ')}`,
        category: 'policy'
      };
    }

    const requiresHumanApproval = HIGH_RISK_ACTIONS.has(valid.action);
    if (requiresHumanApproval && !approvedByHuman) {
      return {
        allowed: false,
        blocked: false,
        requiresHumanApproval: true,
        errorCode: 'APPROVAL_REQUIRED',
        reason: `High-risk action '${valid.action}' requires explicit human approval. Please approve this action to proceed.`,
        category: 'policy'
      };
    }

    if (REMOTE_CHANNELS.has(originNorm) && valid.action === 'publish' && !approvedByHuman) {
      return {
        allowed: false,
        blocked: false,
        requiresHumanApproval: true,
        errorCode: 'REMOTE_PUBLISH_SANDBOXED',
        reason: 'Remote publish is sandboxed: approve locally in the app UI before posting to remote channels.',
        category: 'policy'
      };
    }

    return {
      allowed: true,
      blocked: false,
      requiresHumanApproval: false,
      errorCode: 'ALLOWED',
      reason: 'Action allowed by policy.',
      category: 'allowed',
      action: valid.action
    };
  }

  createPipelineJob(/** @type {any} */ { origin = 'local-ui', intentText = '', requestedSteps = [], metadata = {}, idempotencyKey = '' }) {
    const originNorm = normalizeOrigin(origin);
    const intent = sanitizeText(intentText, 1200);

    const parsed = parseIntentToPlan(intent);
    const planSteps = (Array.isArray(requestedSteps) && requestedSteps.length ? requestedSteps : parsed.steps)
      .map((/** @type {any} */ step) => normalizeAction(step))
      .filter((/** @type {any} */ step) => ALLOWED_ACTIONS.has(step));

    const publicationSteps = planSteps.filter((/** @type {any} */ s) => s === 'publish');
    const computedIdempotencyKey = sanitizeText(metadata?.idempotencyKey || idempotencyKey || '', 160) || buildIdempotencyKey({
      origin: originNorm,
      intent,
      steps: planSteps,
      metadata: redactForAudit(metadata && typeof metadata === 'object' ? metadata : {})
    });
    const existingByIdempotency = this.jobs.find((/** @type {any} */ job) => String(job?.idempotencyKey || '') === computedIdempotencyKey);
    if (existingByIdempotency) {
      addAuditEntry({
        jobId: existingByIdempotency.id,
        action: 'job_idempotent_reuse',
        status: 'reused',
        result: 'Reused existing job for identical mission request.',
        details: {
          idempotencyKey: computedIdempotencyKey,
          title: existingByIdempotency.title,
          status: existingByIdempotency.status
        }
      });
      return existingByIdempotency;
    }

    // Single canonical publish limit check lives here so bridge callers do not double-count it.
    if (publicationSteps.length > 0) {
      const rateLimitCheck = checkAndUpdateRateLimit('publish');
      if (!rateLimitCheck.allowed) {
        return {
          id: uid('job'),
          status: 'rate_limited',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMsg: rateLimitCheck.reason,
          resetAtMs: rateLimitCheck.resetAtMs,
          createdAt: Date.now()
        };
      }
    }

    const policyChecks = planSteps.map((/** @type {any} */ step) => ({
      step,
      decision: this.evaluateAction({
        action: step,
        origin: originNorm,
        intentText: intent,
        approvedByHuman: false
      })
    }));

    const blocked = policyChecks.find((/** @type {any} */ row) => row.decision.blocked);
    const needsApproval = policyChecks.filter((/** @type {any} */ row) => row.decision.requiresHumanApproval).map((/** @type {any} */ row) => row.step);

    const /** @type {any} */
job = {
      id: uid('job'),
      schema: MISSION_SCHEMA_VERSION,
      title: parsed.title,
      origin: originNorm,
      intentText: intent,
      idempotencyKey: computedIdempotencyKey,
      steps: planSteps,
      status: blocked ? 'blocked' : needsApproval.length ? 'awaiting_approval' : 'ready',
      pendingApprovals: needsApproval,
      approvedByHuman: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: redactForAudit(metadata && typeof metadata === 'object' ? metadata : {}),
      policyDecisions: redactForAudit(policyChecks),
      notes: blocked ? blocked.decision.reason : '',
      // ===== E1.1a: EXECUTION TRACKING =====
      execution: null,
      retries: [],
      browserTimeline: null,
      approvalReceipt: null,
      errorLog: [],
      mission: buildMissionObject({
        id: uid('mission'),
        title: parsed.title,
        origin: originNorm,
        intentText: intent,
        idempotencyKey: computedIdempotencyKey,
        steps: planSteps,
        status: blocked ? 'blocked' : needsApproval.length ? 'awaiting_approval' : 'ready',
        pendingApprovals: needsApproval,
        approvedByHuman: false,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    };
    job.mission.missionId = job.id;

    this.jobs.push(job);
    saveJobs(this.jobs);

    addAuditEntry({
      jobId: job.id,
      action: 'job_created',
      status: 'pending',
      result: `Job created with ${planSteps.length} steps: ${planSteps.join(', ')}`,
      details: {
        title: job.title,
        origin: job.origin,
        status: job.status,
        idempotencyKey: job.idempotencyKey,
        pendingApprovals: needsApproval,
        blockedReason: blocked?.decision?.reason || '',
        policyChecks
      }
    });

    return job;
  }

  approveJob(/** @type {any} */ jobId, /** @type {any} */ approver = 'operator') {
    const job = this.getJob(jobId);
    if (!job) return { ok: false, reason: 'Job not found.' };

    job.approvedByHuman = true;
    job.approvedAt = Date.now();
    job.approvedBy = sanitizeText(approver, 80) || 'operator';
    job.approvalReceipt = this.createApprovalReceipt(job, job.approvedBy);
    job.status = 'ready';
    job.updatedAt = Date.now();
    saveJobs(this.jobs);

    addAuditEntry({
      jobId,
      action: 'job_approved',
      status: 'approved',
      result: job.approvalReceipt.receiptText,
      details: {
        receiptId: job.approvalReceipt.receiptId,
        receiptHash: job.approvalReceipt.receiptHash,
        approvedSteps: job.approvalReceipt.approvedSteps
      }
    });

    return { ok: true, job };
  }

  markJobStatus(/** @type {any} */ jobId, /** @type {any} */ status, /** @type {any} */ notes = '') {
    const job = this.getJob(jobId);
    if (!job) return;
    job.status = status;
    job.notes = maskSecretLikeText(notes, 400);
    job.updatedAt = Date.now();
    saveJobs(this.jobs);
    addAuditEntry({
      jobId,
      action: 'job_status_changed',
      status,
      result: job.notes,
      details: { status }
    });
  }

  ensureJobExecutionRuntime(/** @type {any} */ jobId) {
    const job = this.getJob(jobId);
    if (!job) return null;

    if (!job.execution) {
      job.execution = {
        startedAt: Date.now(),
        steps: [],
        runtime: {
          schema: 'agent-execution-runtime/v1',
          state: 'queued',
          currentStepIndex: 0,
          currentStep: '',
          startedAt: null,
          lastStepAt: null,
          lastUpdatedAt: Date.now(),
          completedAt: null,
          failedAt: null,
          waitingApproval: false,
          resumeAllowed: true
        }
      };
    }

    if (!job.execution.runtime || typeof job.execution.runtime !== 'object') {
      job.execution.runtime = {
        schema: 'agent-execution-runtime/v1',
        state: 'queued',
        currentStepIndex: 0,
        currentStep: '',
        startedAt: null,
        lastStepAt: null,
        lastUpdatedAt: Date.now(),
        completedAt: null,
        failedAt: null,
        waitingApproval: false,
        resumeAllowed: true
      };
    }

    if (!Array.isArray(job.execution.steps)) {
      job.execution.steps = [];
    }

    job.updatedAt = Date.now();
    saveJobs(this.jobs);
    return job;
  }

  updateJobExecutionRuntime(/** @type {any} */ jobId, /** @type {any} */ updates = {}) {
    const job = this.ensureJobExecutionRuntime(jobId);
    if (!job) return null;
    job.execution.runtime = {
      ...(job.execution.runtime || {}),
      ...redactForAudit(updates),
      lastUpdatedAt: Date.now()
    };
    job.updatedAt = Date.now();
    saveJobs(this.jobs);
    return job.execution.runtime;
  }

  parseRemoteEnvelope(/** @type {any} */ envelope) {
    const channel = normalizeOrigin(envelope?.channel || 'webhook');
    const nonce = sanitizeText(envelope?.nonce || '', 120);
    const intentText = sanitizeText(envelope?.intent || '', 1200);
    const ts = Number(envelope?.ts || 0);

    if (!REMOTE_CHANNELS.has(channel)) {
      return { ok: false, reason: `Unsupported channel: ${channel}` };
    }
    if (!nonce || !intentText || !Number.isFinite(ts)) {
      return { ok: false, reason: 'Remote envelope missing nonce, timestamp, or intent.' };
    }
    if (Math.abs(Date.now() - ts) > NONCE_WINDOW_MS) {
      return { ok: false, reason: 'Remote envelope expired.' };
    }

    const nonces = loadNonces();
    if (nonces.some((/** @type {any} */ entry) => entry.nonce === nonce)) {
      return { ok: false, reason: 'Replay blocked: nonce already used.' };
    }

    nonces.push({ nonce, ts: Date.now(), channel });
    saveNonces(nonces);

    return {
      ok: true,
      channel,
      intentText,
      metadata: {
        from: sanitizeText(envelope?.from || '', 120),
        requestId: sanitizeText(envelope?.requestId || '', 120)
      }
    };
  }
}

/** @type {any} */
let _orchestrator = null;

/** @returns {any} */
export function getAgentOrchestrator() {
  if (!_orchestrator) {
    _orchestrator = new AgentOrchestrator();
  }
  return _orchestrator;
}

/**
 * @param {any} text
 * @returns {any}
 */
export function parseAgentCommand(text) {
  const input = sanitizeText(text, 1200);
  if (!input) return null;

  const directPrefix = input.match(/^\/(agent|orchestrate|pipeline)\s+(.+)$/i);
  if (directPrefix) {
    return {
      command: directPrefix[1].toLowerCase(),
      payload: directPrefix[2].trim()
    };
  }

  if (/\b(run|start|execute)\b.*\b(pipeline|workflow)\b/i.test(input)) {
    return {
      command: 'pipeline',
      payload: input
    };
  }

  return null;
}
