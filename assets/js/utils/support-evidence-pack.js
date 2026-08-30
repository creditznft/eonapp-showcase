/**
 * W280-B1 — local, review-first support evidence packs.
 *
 * This module is deliberately pure and browser-local. It never stores,
 * transmits, files, or queues an issue. A person must inspect the generated
 * pack and choose a manual copy/download action.
 */

export const SUPPORT_EVIDENCE_PACK_SCHEMA = 'eonapp.support.evidence-pack.v1';
export const SUPPORT_EVIDENCE_PACK_SCOPE = 'local-manual-export-only';
export const SUPPORT_EVIDENCE_MAX_TEXT = 800;

const FALLBACK_ROUTE = '/help';
const REDACTION = '[redacted]';
const SAFE_DEVICE_CLASSES = new Set(['desktop', 'mobile', 'tablet', 'unknown']);
const SAFE_BROWSER_CLASSES = new Set(['chromium', 'firefox', 'safari', 'other', 'unknown']);

function text(value, max = SUPPORT_EVIDENCE_MAX_TEXT) {
  const printable = [...String(value ?? '')].filter((character) => {
    const code = character.charCodeAt(0);
    return !(code <= 8 || (code >= 11 && code <= 12) || (code >= 14 && code <= 31) || code === 127);
  }).join('');
  return printable
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function countMatches(value, pattern) {
  const matches = value.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Keeps only a same-app pathname. Query strings and fragments are intentionally
 * excluded because they can contain signed links, keys, or personal context.
 */
export function normalizeSupportRoute(value) {
  const candidate = text(value, 300);
  if (!candidate) return FALLBACK_ROUTE;
  if (candidate.startsWith('//')) return FALLBACK_ROUTE;
  if (candidate.startsWith('/')) {
    const route = candidate.split(/[?#]/, 1)[0].replace(/\/+/g, '/');
    return route.startsWith('/') ? route : FALLBACK_ROUTE;
  }
  return FALLBACK_ROUTE;
}

/**
 * Remove common secret-like and identity-bearing fragments from free text.
 * It is a guardrail, not a guarantee: people still must review before sharing.
 */
export function redactSupportEvidence(value, max = SUPPORT_EVIDENCE_MAX_TEXT) {
  const source = text(value, max * 2);
  let output = source;
  let redactions = 0;
  const replace = (pattern, replacement = REDACTION) => {
    redactions += countMatches(output, pattern);
    output = output.replace(pattern, replacement);
  };

  replace(/https?:\/\/[^\s<>'"`]+/gi, '[redacted-url]');
  replace(/\b(?:bearer)\s+[a-z0-9._~+\u002f-]{12,}\b/gi);
  replace(/\b(?:sk|rk|pk|api|token|secret)[_-][a-z0-9_-]{12,}\b/gi);
  replace(/\b(?:api[_ -]?key|access[_ -]?token|secret|password|private[_ -]?key|seed(?:[_ -]?phrase)?|mnemonic)\s*[:=]\s*[^\s,;]+/gi);
  replace(/\b0x[a-f0-9]{40,}\b/gi);
  replace(/\b(?:\d[ -]*?){13,19}\b/g, '[redacted-number]');
  replace(/\b[a-z0-9_-]{48,}\b/gi);
  replace(/\b\w+(?:\.\w+){11,}\b/gi);

  return Object.freeze({
    text: text(output, max),
    redactions,
    changed: output !== source
  });
}

export function detectSupportDeviceClass(userAgent = '') {
  const source = String(userAgent || '').toLowerCase();
  if (!source) return 'unknown';
  if (/ipad|tablet/.test(source)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(source)) return 'mobile';
  return 'desktop';
}

export function detectSupportBrowserClass(userAgent = '') {
  const source = String(userAgent || '').toLowerCase();
  if (!source) return 'unknown';
  if (/firefox|fxios/.test(source)) return 'firefox';
  if (/edg\//.test(source) || /chrome|crios/.test(source)) return 'chromium';
  if (/safari/.test(source) && !/chrome|crios|android/.test(source)) return 'safari';
  return 'other';
}

function safeClass(value, allowed) {
  const candidate = text(value, 24).toLowerCase();
  return allowed.has(candidate) ? candidate : 'unknown';
}

function safeTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function safeTopic(topicId, allowedTopicIds) {
  const candidate = text(topicId, 64);
  return allowedTopicIds.includes(candidate) ? candidate : 'bug-security';
}

/**
 * Build a finite, redacted, review-first local support pack. This function has
 * no storage, DOM, network, or file side effect.
 */
export function createSupportEvidencePack({
  topicId,
  allowedTopicIds = [],
  routePath,
  deviceClass,
  browserClass,
  expected,
  actual,
  capturedAt = new Date().toISOString(),
  reviewed = false
} = {}) {
  const expectedSafe = redactSupportEvidence(expected);
  const actualSafe = redactSupportEvidence(actual);
  const topic = safeTopic(topicId, Array.isArray(allowedTopicIds) ? allowedTopicIds : []);
  const pack = {
    schema: SUPPORT_EVIDENCE_PACK_SCHEMA,
    scope: SUPPORT_EVIDENCE_PACK_SCOPE,
    status: reviewed ? 'reviewed-for-manual-share' : 'preview-only',
    capturedAt: safeTimestamp(capturedAt),
    topic,
    context: {
      routePath: normalizeSupportRoute(routePath),
      deviceClass: safeClass(deviceClass, SAFE_DEVICE_CLASSES),
      browserClass: safeClass(browserClass, SAFE_BROWSER_CLASSES)
    },
    report: {
      expected: expectedSafe.text,
      actual: actualSafe.text
    },
    review: {
      manualReviewRequired: true,
      confirmedByUser: Boolean(reviewed),
      automaticRedactionsApplied: expectedSafe.redactions + actualSafe.redactions,
      note: 'This local pack is not sent by EONAPP. Inspect it before you manually share it.'
    },
    boundaries: {
      storedByEonapp: false,
      transmittedByEonapp: false,
      createsSupportTicket: false,
      promisesHumanResponse: false,
      includesQueryOrFragment: false,
      includesRawUserAgent: false
    }
  };
  return Object.freeze(pack);
}

export function isSupportEvidencePackReadyForManualShare(pack) {
  return Boolean(
    pack
    && pack.schema === SUPPORT_EVIDENCE_PACK_SCHEMA
    && pack.scope === SUPPORT_EVIDENCE_PACK_SCOPE
    && pack.status === 'reviewed-for-manual-share'
    && pack.review?.manualReviewRequired === true
    && pack.review?.confirmedByUser === true
    && pack.boundaries?.storedByEonapp === false
    && pack.boundaries?.transmittedByEonapp === false
    && pack.boundaries?.createsSupportTicket === false
  );
}

export function formatSupportEvidencePack(pack) {
  return `${JSON.stringify(pack, null, 2)}\n`;
}
