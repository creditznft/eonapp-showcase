/**
 * legal-trust-copy.js — W143 legal/billing/trust/support final copy.
 *
 * This module defines the public trust contract for policy pages that cover
 * current Legal, Billing, Privacy, Terms, and Support boundaries.
 * It records a redacted local proof receipt without storing user secrets.
 */

export const W143_LEGAL_TRUST_COPY_SCHEMA = 'eonapp.w143.legal-billing-trust-support-final-copy.v2';
export const W143_LEGAL_TRUST_RECEIPT_KEY = 'eon:legal:trust-copy-proof:v1';

export const W143_REQUIRED_POLICY_SURFACES = Object.freeze([
  Object.freeze({ id: 'legal', file: 'legal.html', label: 'Legal center', required: ['local-first', 'support', 'jurisdiction'] }),
  Object.freeze({ id: 'terms', file: 'terms.html', label: 'Terms of Service', required: ['No financial', 'Dodo Payments hosted checkout', 'local-first'] }),
  Object.freeze({ id: 'billing', file: 'billing.html', label: 'Plans & billing', required: ['Dodo Payments hosted checkout', 'signed server webhook', 'receipt'] }),
  Object.freeze({ id: 'privacy', file: 'privacy.html', label: 'Privacy notes', required: ['Local-first storage', 'AI provider keys', 'third-party'] }),
  Object.freeze({ id: 'support', file: 'support.html', label: 'Support center', required: ['Public proof', 'Never send secrets', 'Dodo-only subscription checkout'] })
]);

export const W143_REQUIRED_TRUST_PRINCIPLES = Object.freeze([
  Object.freeze({ id: 'dodo-hosted-checkout-only', label: 'Dodo hosted checkout only', detail: 'Paid plans start only through the canonical Billing page and Dodo Payments hosted checkout.' }),
  Object.freeze({ id: 'server-verified-billing-entitlements', label: 'Server-verified billing entitlements', detail: 'Plan access changes only after signed Dodo lifecycle events update the server entitlement ledger.' }),
  Object.freeze({ id: 'public-proof-only-support', label: 'Public-proof-only support', detail: 'Support requests safe public proof only, not secrets.' }),
  Object.freeze({ id: 'local-first-privacy', label: 'Local-first privacy', detail: 'Browser storage and Vault backups remain local unless a user explicitly verifies a provider or exports a backup.' }),
  Object.freeze({ id: 'no-wallet-transaction', label: 'No wallet transaction', detail: 'The current product routes do not request wallet signatures, transfers, token payments, or contract calls.' }),
  Object.freeze({ id: 'processor-backed-refunds', label: 'Processor-backed refunds and disputes', detail: 'Refund, cancellation, expiry and dispute handling must match Dodo lifecycle evidence; browser state is not payment authority.' }),
  Object.freeze({ id: 'eonkeys-not-subscriptions', label: 'EONKEYS are not subscriptions', detail: 'EONKEYS unlock selected individual features or limits and never create a free plan, discount, renewal credit, cash value, or provider credit.' }),
  Object.freeze({ id: 'no-investment-or-result-promises', label: 'No investment or result promises', detail: 'No profit, income, resale, liquidity, viral, legal, tax, medical, or guaranteed-result framing.' }),
  Object.freeze({ id: 'no-secrets-in-support', label: 'No secrets in support', detail: 'Seed phrases, private keys, full API keys, wallet backup files, passwords, and full card data must not be requested.' }),
  Object.freeze({ id: 'third-party-and-jurisdiction-boundary', label: 'Third-party and jurisdiction boundary', detail: 'Dodo Payments, user-owned AI providers, local runtimes, privacy duties, and local rules remain user-visible.' })
]);

export const W143_BLOCKED_COPY_PATTERNS = Object.freeze([
  Object.freeze({ id: 'guaranteed-profit', pattern: /guarantee(?:d)?\s+(?:profit|income|returns?|resale|liquidity|appreciation|trading\s+performance)/i, reason: 'financial outcomes cannot be promised' }),
  Object.freeze({ id: 'risk-free-crypto', pattern: /risk[-\s]?free\s+(?:crypto|wallet|NFT|payment|investment)/i, reason: 'crypto and wallet actions require risk language' }),
  Object.freeze({ id: 'instant-refund-promise', pattern: /instant\s+(?:refund|reversal|chargeback)|refund\s+guarantee/i, reason: 'refunds require evidence-based manual review' }),
  Object.freeze({ id: 'legal-advice-claim', pattern: /we\s+provide\s+(?:legal|tax|medical|financial|investment)\s+advice/i, reason: 'EONAPP must not claim regulated advice' }),
  Object.freeze({ id: 'private-key-request', pattern: /(?:send|upload|share)\s+(?:your\s+)?(?:seed\s+phrase|private\s+key|recovery\s+phrase|keystore\s+password|full\s+API\s+key|wallet\s+backup\s+file)/i, reason: 'support must never request secrets' }),
  Object.freeze({ id: 'reversible-chain-promise', pattern: /(?:all|every)\s+(?:blockchain|crypto|on[-\s]?chain)\s+(?:payments?|transactions?)\s+(?:can|will)\s+be\s+(?:reversed|refunded|recovered)/i, reason: 'blockchain payments may be irreversible' }),
  Object.freeze({ id: 'always-available', pattern: /(?:always|guaranteed)\s+(?:available|online|uninterrupted\s+access)/i, reason: 'availability must not be absolute' })
]);

export const W143_REMAINING_PHASES_AFTER_COMPLETION = Object.freeze([
  Object.freeze({ id: 'W144', title: 'Final enterprise certification', status: 'pending', focus: 'Release-candidate gate across routes, build, copy, support, persistence, safety receipts, and deployment evidence.' }),
  Object.freeze({ id: 'W146', title: 'EON City high-end AAA graphics expansion', status: 'recommended-extra', focus: 'Desktop-only cinematic graphics, richer NPC skins, lighting, district density, and screenshot proof.' }),
  Object.freeze({ id: 'W147', title: 'EON City NPC voice/proximity/social pass', status: 'recommended-extra', focus: 'NPC voice, proximity audio, speech bubbles, safer interactions, and station work loops.' }),
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

function stripTechnicalNoise(text = '') {
  return safeString(text)
    .replace(/script-src[^\n;]*'unsafe-inline'[^\n;]*/gi, 'csp-inline-style-token-redacted')
    .replace(/style-src[^\n;]*'unsafe-inline'[^\n;]*/gi, 'csp-inline-style-token-redacted')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

function includesAny(text, needles = []) {
  return needles.some((needle) => text.toLowerCase().includes(String(needle).toLowerCase()));
}

function stripSafeWarningSentences(text = '') {
  return safeString(text)
    .replace(/(?:do not|don't|never)\s+(?:send|upload|share)[^.\n]{0,180}/gi, ' safe-secret-warning ')
    .replace(/(?:does not|do not|must not|should not|cannot|not|no)\s+[^.\n]{0,180}(?:profit|income|returns?|resale|liquidity|appreciation|trading\s+performance|result promises?|investment)[^.\n]{0,120}/gi, ' safe-no-result-warning ')
    .replace(/[^.\n]{0,120}(?:claims should be blocked|promises should be blocked)[^.\n]{0,120}/gi, ' safe-blocked-claims-warning ');
}

export function getW143PolicySurfaceChecklist() {
  return W143_REQUIRED_POLICY_SURFACES.map((item) => Object.freeze({ ...item, required: [...item.required] }));
}

export function getW143TrustPrinciples() {
  return W143_REQUIRED_TRUST_PRINCIPLES.map((item) => Object.freeze({ ...item }));
}

export function buildW143LegalTrustCopyAudit(sources = {}) {
  const sourceEntries = Object.entries(sources).map(([id, value]) => [id, stripTechnicalNoise(value)]);
  const combined = sourceEntries.map(([, value]) => value).join('\n');
  const scanText = stripSafeWarningSentences(combined);
  const normalized = combined.toLowerCase();
  const findings = W143_BLOCKED_COPY_PATTERNS
    .filter((entry) => entry.pattern.test(scanText))
    .map((entry) => Object.freeze({ id: entry.id, reason: entry.reason }));
  const presentPrinciples = W143_REQUIRED_TRUST_PRINCIPLES.filter((item) => normalized.includes(item.label.toLowerCase()) || normalized.includes(item.detail.toLowerCase()));
  const surfaceResults = W143_REQUIRED_POLICY_SURFACES.map((surface) => {
    const sourceText = sourceEntries.find(([id]) => id === surface.id || id === surface.file)?.[1] || combined;
    const present = surface.required.filter((needle) => includesAny(sourceText, [needle]));
    return Object.freeze({
      id: surface.id,
      file: surface.file,
      label: surface.label,
      requiredCount: surface.required.length,
      presentCount: present.length,
      missing: surface.required.filter((needle) => !present.includes(needle))
    });
  });
  const hasProofCard = /data-w143-trust-copy-proof="true"|W143 final trust copy proof/i.test(combined);
  const hasSafeEvidence = /public\s*proof|safe\s*evidence|transaction\s+hash|invoice|quote\s+ID/i.test(combined);
  const hasNoSecrets = /Never share secrets|seed phrase|private key|full API key|wallet backup file/i.test(combined);
  const hasManualReview = /manual review|manually reviewed|human review/i.test(combined);
  const hasServerVerifiedBilling = /signed server webhook|signed Dodo lifecycle events|server-verified (?:subscription )?entitlements?|server entitlement ledger/i.test(combined);
  const hasNoInvestment = /No financial|No investment|does not promise profit|not investment|No investment or result promises/i.test(combined);
  const missingSurfaceCount = surfaceResults.filter((surface) => surface.missing.length > 0).length;
  const missingPrincipleCount = Math.max(0, W143_REQUIRED_TRUST_PRINCIPLES.length - presentPrinciples.length);
  const score = Math.max(0, Math.round(100 - findings.length * 12 - missingSurfaceCount * 5 - missingPrincipleCount * 3 - (hasProofCard ? 0 : 8)));
  const ok = findings.length === 0 && hasProofCard && hasSafeEvidence && hasNoSecrets && hasManualReview && hasServerVerifiedBilling && hasNoInvestment && missingSurfaceCount === 0;
  return Object.freeze({
    schema: W143_LEGAL_TRUST_COPY_SCHEMA,
    ok,
    score: ok ? 100 : score,
    generatedAt: new Date().toISOString(),
    blockedFindingCount: findings.length,
    findings,
    surfaceCount: W143_REQUIRED_POLICY_SURFACES.length,
    surfaceResults,
    requiredPrincipleCount: W143_REQUIRED_TRUST_PRINCIPLES.length,
    presentPrincipleCount: presentPrinciples.length,
    presentPrincipleIds: presentPrinciples.map((item) => item.id),
    checks: Object.freeze({ hasProofCard, hasSafeEvidence, hasNoSecrets, hasManualReview, hasServerVerifiedBilling, hasNoInvestment })
  });
}

export function buildW143PageTrustCopyAudit(source = '') {
  const text = stripTechnicalNoise(source);
  const scanText = stripSafeWarningSentences(text);
  const findings = W143_BLOCKED_COPY_PATTERNS
    .filter((entry) => entry.pattern.test(scanText))
    .map((entry) => Object.freeze({ id: entry.id, reason: entry.reason }));
  const normalized = text.toLowerCase();
  const checks = Object.freeze({
    hasNoSecrets: /never share secrets|seed phrase|private key|full api key|wallet backup file/i.test(text),
    hasLocalBoundary: /local-first|no checkout|no wallet|no payment|safe public proof|public proof/i.test(text),
    hasNoInvestment: /no financial|no investment|does not promise profit|no profit or result promises/i.test(text),
    hasManualReview: /manual review|human review|policy exceptions/i.test(text)
  });
  const ok = findings.length === 0 && Object.values(checks).every(Boolean);
  return Object.freeze({
    schema: W143_LEGAL_TRUST_COPY_SCHEMA,
    ok,
    score: ok ? 100 : Math.max(0, 100 - findings.length * 12 - Object.values(checks).filter((value) => !value).length * 8),
    generatedAt: new Date().toISOString(),
    blockedFindingCount: findings.length,
    findings,
    surfaceCount: 1,
    surfaceResults: [],
    requiredPrincipleCount: W143_REQUIRED_TRUST_PRINCIPLES.length,
    presentPrincipleCount: W143_REQUIRED_TRUST_PRINCIPLES.filter((item) => normalized.includes(item.label.toLowerCase()) || normalized.includes(item.detail.toLowerCase())).length,
    checks
  });
}

export function assertW143LegalTrustCopyAudit(audit) {
  if (!audit || audit.schema !== W143_LEGAL_TRUST_COPY_SCHEMA) throw new Error('W143 audit schema mismatch');
  if (!audit.ok) {
    const findingIds = (audit.findings || []).map((item) => item.id);
    const missingSurfaces = (audit.surfaceResults || []).filter((surface) => surface.missing?.length).map((surface) => `${surface.id}:${surface.missing.join('|')}`);
    const reasons = [...findingIds, ...missingSurfaces];
    throw new Error(`W143 legal/billing/trust/support copy audit failed: ${reasons.join(', ') || 'missing required trust proof'}`);
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

export function recordW143LegalTrustCopyReceipt(storage = globalThis.localStorage, options = {}) {
  const audit = options.audit || buildW143LegalTrustCopyAudit(options.sources || {});
  const receipt = Object.freeze({
    schema: W143_LEGAL_TRUST_COPY_SCHEMA,
    key: W143_LEGAL_TRUST_RECEIPT_KEY,
    ok: Boolean(audit.ok),
    score: audit.score,
    generatedAt: new Date().toISOString(),
    proofVersion: 'w143-legal-billing-trust-support-final-copy',
    auditFingerprint: fingerprint(JSON.stringify(audit)),
    principleIds: W143_REQUIRED_TRUST_PRINCIPLES.map((item) => item.id),
    surfaceCount: W143_REQUIRED_POLICY_SURFACES.length,
    blockedFindingCount: audit.blockedFindingCount || 0,
    secretValuesIncluded: false
  });
  writeToStorage(storage, W143_LEGAL_TRUST_RECEIPT_KEY, JSON.stringify(receipt));
  return receipt;
}

export function getW143LegalTrustCopyStatus(storage = globalThis.localStorage) {
  try {
    const raw = readFromStorage(storage, W143_LEGAL_TRUST_RECEIPT_KEY);
    const receipt = raw ? JSON.parse(raw) : null;
    return Object.freeze({
      schema: `${W143_LEGAL_TRUST_COPY_SCHEMA}.status`,
      done: Boolean(receipt?.ok),
      receipt
    });
  } catch {
    return Object.freeze({ schema: `${W143_LEGAL_TRUST_COPY_SCHEMA}.status`, done: false, receipt: null });
  }
}

export function getW143RemainingPhaseSummary() {
  return Object.freeze({
    schema: `${W143_LEGAL_TRUST_COPY_SCHEMA}.remaining-phases`,
    completedPhase: 'W143',
    legalTrustCopyDone: true,
    creatorSafetyDone: true,
    dataSurvivalDone: true,
    phases: W143_REMAINING_PHASES_AFTER_COMPLETION.map((phase) => Object.freeze({ ...phase }))
  });
}

export default Object.freeze({
  W143_LEGAL_TRUST_COPY_SCHEMA,
  W143_LEGAL_TRUST_RECEIPT_KEY,
  W143_REQUIRED_POLICY_SURFACES,
  W143_REQUIRED_TRUST_PRINCIPLES,
  W143_BLOCKED_COPY_PATTERNS,
  W143_REMAINING_PHASES_AFTER_COMPLETION,
  buildW143LegalTrustCopyAudit,
  buildW143PageTrustCopyAudit,
  assertW143LegalTrustCopyAudit,
  getW143PolicySurfaceChecklist,
  getW143TrustPrinciples,
  recordW143LegalTrustCopyReceipt,
  getW143LegalTrustCopyStatus,
  getW143RemainingPhaseSummary
});
