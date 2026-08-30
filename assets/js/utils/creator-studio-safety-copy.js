/**
 * creator-studio-safety-copy.js — W142 Creator Studio safety/copy cleanup.
 *
 * The Creator Studio must feel powerful without implying unsafe automation,
 * guaranteed outcomes, copyright certainty, private competitor intel, or
 * auto-publishing without human review. This module defines the public copy
 * contract, creates a redacted proof receipt, and keeps the remaining roadmap
 * aligned after W145 data survival was completed.
 */

export const W142_CREATOR_SAFETY_COPY_SCHEMA = 'eonapp.w142.creator-studio-safety-copy.v1';
export const W142_CREATOR_SAFETY_RECEIPT_KEY = 'eon:creator:safety-copy-proof:v1';

export const W142_BLOCKED_COPY_PATTERNS = Object.freeze([
  Object.freeze({ id: 'one-click-publish', pattern: /one[-\s]?click\s+publish/i, reason: 'implies unattended publishing' }),
  Object.freeze({ id: 'auto-publish', pattern: /auto[-\s]?publish/i, reason: 'publishing must stay review-first' }),
  Object.freeze({ id: 'ai-powered-badge', pattern: /AI\s+powered/i, reason: 'use AI-assisted to clarify human review' }),
  Object.freeze({ id: 'post-now-primary', pattern: /Post\s+Now/i, reason: 'use Review & Post to avoid bypassing checks' }),
  Object.freeze({ id: 'guaranteed-results', pattern: /guarantee(?:d)?\s+(?:viral|views|sales|profit|income|followers|ranking)/i, reason: 'no result promises' }),
  Object.freeze({ id: 'copyright-certainty', pattern: /copyright[-\s]?safe|rights[-\s]?cleared|royalty[-\s]?free\s+guaranteed/i, reason: 'rights must be user-reviewed' }),
  Object.freeze({ id: 'private-competitor-intel', pattern: /competitor\s+intel/i, reason: 'use public landscape notes unless a user provides data' })
]);

export const W142_REQUIRED_CREATOR_GUARDRAILS = Object.freeze([
  Object.freeze({ id: 'human-review', label: 'Human review required', detail: 'Publishing, scheduling, marketplace listing, and minting must require deliberate user review.' }),
  Object.freeze({ id: 'rights-review', label: 'Rights and likeness review', detail: 'Images, voice, music, scripts, and video exports must be reviewed for ownership, consent, and platform terms.' }),
  Object.freeze({ id: 'no-result-promises', label: 'No result promises', detail: 'Creator copy must not promise views, viral growth, income, sales, ranking, or profit.' }),
  Object.freeze({ id: 'public-data-boundary', label: 'Public data boundary', detail: 'Trend and competitor features must avoid claiming private data or live verification unless connected sources supply it.' }),
  Object.freeze({ id: 'local-secret-boundary', label: 'Local secret boundary', detail: 'API keys stay in the local Vault; safety receipts never expose key values, salts, or tokens.' }),
  Object.freeze({ id: 'sensitive-content-review', label: 'Sensitive content review', detail: 'Medical, legal, financial, minors, violence, hate, adult, and impersonation-adjacent content needs extra user review.' })
]);

export const W142_REMAINING_PHASES_AFTER_COMPLETION = Object.freeze([
  Object.freeze({ id: 'W143', title: 'Legal/billing/trust/support final copy', status: 'pending', focus: 'Final public trust wording across legal, billing, refund, privacy, wallet-risk, and support surfaces.' }),
  Object.freeze({ id: 'W144', title: 'Final enterprise certification', status: 'pending', focus: 'One release-candidate gate that proves routes, build, copy, persistence, support, and safety surfaces.' }),
  Object.freeze({ id: 'W146', title: 'EON City high-end AAA graphics expansion', status: 'recommended-extra', focus: 'Desktop-only cinematic graphics, richer NPC skins, lighting, district density, and screenshot proof.' }),
  Object.freeze({ id: 'W147', title: 'EON City NPC voice/proximity/social pass', status: 'recommended-extra', focus: 'NPC proximity voice, speech bubbles, safe social interactions, and station work loops.' }),
  Object.freeze({ id: 'W148', title: 'EON City all-device visual proof lab', status: 'recommended-extra', focus: 'Screenshot and performance proof for low phone, tablet, laptop, high desktop, and reduced-motion modes.' })
]);

function safeString(value = '') {
  if (value == null) return '';
  return String(value);
}

function fingerprint(value = '') {
  const text = safeString(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stripAllowedTechnicalReferences(text = '') {
  return safeString(text)
    .replace(/script-src[^\n;]*'unsafe-inline'[^\n;]*/gi, 'csp-inline-style-token-redacted')
    .replace(/style-src[^\n;]*'unsafe-inline'[^\n;]*/gi, 'csp-inline-style-token-redacted')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

export function getW142CreatorSafetyChecklist() {
  return W142_REQUIRED_CREATOR_GUARDRAILS.map((item) => Object.freeze({ ...item }));
}

export function buildW142CreatorStudioAudit(sources = {}) {
  const combined = stripAllowedTechnicalReferences(Object.values(sources).join('\n'));
  const findings = W142_BLOCKED_COPY_PATTERNS
    .filter((entry) => entry.pattern.test(combined))
    .map((entry) => Object.freeze({ id: entry.id, reason: entry.reason }));
  const requiredLabels = W142_REQUIRED_CREATOR_GUARDRAILS.map((item) => item.label);
  const presentGuardrailCount = W142_REQUIRED_CREATOR_GUARDRAILS.filter((item) => combined.includes(item.label) || combined.includes(item.detail)).length;
  const hasReviewFirst = /review-first|Review & Post|manual review|Human review required/i.test(combined);
  const hasRightsReview = /rights|likeness|platform terms|copyright|ownership|consent/i.test(combined);
  const hasLocalSecretBoundary = /API keys stay|local Vault|never expose|localStorage|Vault/i.test(combined);
  const score = Math.max(0, Math.round(100 - findings.length * 12 - Math.max(0, W142_REQUIRED_CREATOR_GUARDRAILS.length - presentGuardrailCount) * 4));
  const ok = findings.length === 0 && hasReviewFirst && hasRightsReview && hasLocalSecretBoundary;
  return Object.freeze({
    schema: W142_CREATOR_SAFETY_COPY_SCHEMA,
    ok,
    score: ok ? 100 : score,
    generatedAt: new Date().toISOString(),
    blockedFindingCount: findings.length,
    findings,
    requiredGuardrailCount: W142_REQUIRED_CREATOR_GUARDRAILS.length,
    presentGuardrailCount,
    requiredLabels,
    checks: Object.freeze({ hasReviewFirst, hasRightsReview, hasLocalSecretBoundary })
  });
}

export function assertW142CreatorStudioAudit(audit) {
  if (!audit || audit.schema !== W142_CREATOR_SAFETY_COPY_SCHEMA) throw new Error('W142 audit schema mismatch');
  if (!audit.ok) {
    const labels = (audit.findings || []).map((item) => item.id).join(', ') || 'missing required guardrails';
    throw new Error(`W142 Creator Studio safety/copy audit failed: ${labels}`);
  }
  return true;
}

function writeToStorage(storage, key, value) {
  if (!storage) return;
  if (typeof storage.setItem === 'function') {
    try { storage.setItem(key, String(value)); } catch {}
    return;
  }
  storage[key] = String(value);
}

function readFromStorage(storage, key) {
  if (!storage) return null;
  if (typeof storage.getItem === 'function') {
    try { return storage.getItem(key); } catch { return null; }
  }
  return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
}

export function recordW142CreatorSafetyReceipt(storage = globalThis.localStorage, options = {}) {
  const audit = options.audit || buildW142CreatorStudioAudit(options.sources || {});
  const receipt = Object.freeze({
    schema: W142_CREATOR_SAFETY_COPY_SCHEMA,
    key: W142_CREATOR_SAFETY_RECEIPT_KEY,
    ok: Boolean(audit.ok),
    score: audit.score,
    generatedAt: new Date().toISOString(),
    proofVersion: 'w142-creator-studio-safety-copy-cleanup',
    auditFingerprint: fingerprint(JSON.stringify(audit)),
    guardrailIds: W142_REQUIRED_CREATOR_GUARDRAILS.map((item) => item.id),
    blockedFindingCount: audit.blockedFindingCount || 0,
    secretValuesIncluded: false
  });
  writeToStorage(storage, W142_CREATOR_SAFETY_RECEIPT_KEY, JSON.stringify(receipt));
  return receipt;
}

export function getW142CreatorSafetyStatus(storage = globalThis.localStorage) {
  try {
    const raw = readFromStorage(storage, W142_CREATOR_SAFETY_RECEIPT_KEY);
    const receipt = raw ? JSON.parse(raw) : null;
    return Object.freeze({
      schema: `${W142_CREATOR_SAFETY_COPY_SCHEMA}.status`,
      done: Boolean(receipt?.ok),
      receipt
    });
  } catch {
    return Object.freeze({ schema: `${W142_CREATOR_SAFETY_COPY_SCHEMA}.status`, done: false, receipt: null });
  }
}

export function getW142RemainingPhaseSummary() {
  return Object.freeze({
    schema: `${W142_CREATOR_SAFETY_COPY_SCHEMA}.remaining-phases`,
    completedPhase: 'W142',
    creatorSafetyDone: true,
    dataSurvivalDone: true,
    phases: W142_REMAINING_PHASES_AFTER_COMPLETION.map((phase) => Object.freeze({ ...phase }))
  });
}
