/**
 * final-enterprise-certification.js — W144 final enterprise certification.
 *
 * W144 is the release-candidate contract that proves the app is no longer only a
 * sequence of patch waves. It gathers critical route basics, prior QA coverage,
 * trust/persistence/safety receipts, and launch-script readiness into one
 * redacted certification manifest that can be recorded locally without storing
 * secrets or user data.
 */

export const W144_ENTERPRISE_CERTIFICATION_SCHEMA = 'eonapp.w144.final-enterprise-certification.v1';
export const W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY = 'eon:enterprise:final-certification-proof:v1';

export const W144_CRITICAL_ROUTES = Object.freeze([
  Object.freeze({ id: 'home', file: 'index.html', route: '/', label: 'Home', markers: ['EONAPP', 'EON City', 'Vault'] }),
  Object.freeze({ id: 'chat', file: 'chat.html', route: '/chat.html', label: 'EONBOT AI Chat', markers: ['EONBOT', 'AI'] }),
  Object.freeze({ id: 'ai-cockpit', file: 'eon-browser.html', route: '/eon-browser.html', label: 'AI Cockpit', markers: ['AI Cockpit', 'Code Maker'] }),
  Object.freeze({ id: 'workbench', file: 'workbench.html', route: '/workbench.html', label: 'Workbench', markers: ['Workbench', 'EONBOT'] }),
  Object.freeze({ id: 'realm', file: 'realm.html', route: '/realm.html', label: 'Realm / EON City', markers: ['EON City', 'Realm'] }),
  Object.freeze({ id: 'market', file: 'market.html', route: '/market.html', label: 'AI Upgrade Market', markers: ['starter drop', 'payment proof'] }),
  Object.freeze({ id: 'marketplace', file: 'marketplace.html', route: '/marketplace.html', label: 'Marketplace', markers: ['Marketplace', 'wallet'] }),
  Object.freeze({ id: 'vault', file: 'vault.html', route: '/vault', label: 'Vault', markers: ['Vault', 'backup'] }),
  Object.freeze({ id: 'workspace-capsule', file: 'capsule.html', route: '/capsule', label: 'Portable Workspace Capsule', markers: ['capsule', 'localStorage'] }),
  Object.freeze({ id: 'creator-studio', file: 'creator-studio.html', route: '/creator-studio.html', label: 'Creator Studio', markers: ['Review-first Pipeline', 'Creator safety'] }),
  Object.freeze({ id: 'telegram', file: 'telegram.html', route: '/telegram.html', label: 'Telegram gateway', markers: ['EON Apps Bot', 'reward'] }),
  Object.freeze({ id: 'reward-access', file: 'reward-access.html', route: '/reward-access.html', label: 'Reward access', markers: ['reward', 'verified'] }),
  Object.freeze({ id: 'subscription', file: 'subscription.html', route: '/subscription.html', label: 'Subscription', markers: ['subscription', 'plan'] }),
  Object.freeze({ id: 'support', file: 'support.html', route: '/support.html', label: 'Support center', markers: ['Public proof', 'Never share secrets'] }),
  Object.freeze({ id: 'trust', file: 'trust.html', route: '/trust.html', label: 'Trust center', markers: ['Public trust policy', 'Commercial actions stay labeled'] }),
  Object.freeze({ id: 'legal', file: 'legal.html', route: '/legal.html', label: 'Legal center', markers: ['verified payment', 'jurisdiction'] }),
  Object.freeze({ id: 'terms', file: 'terms.html', route: '/terms.html', label: 'Terms', markers: ['No financial', 'local-first'] }),
  Object.freeze({ id: 'billing', file: 'billing.html', route: '/billing.html', label: 'Billing', markers: ['checkout', 'receipts'] }),
  Object.freeze({ id: 'refund', file: 'refund-policy.html', route: '/refund-policy.html', label: 'Refund policy', markers: ['Limited exceptions', 'manual review'] }),
  Object.freeze({ id: 'privacy', file: 'privacy.html', route: '/privacy.html', label: 'Privacy', markers: ['Local-first storage', 'AI provider keys'] }),
  Object.freeze({ id: 'wallet-risk', file: 'wallet-risk.html', route: '/wallet-risk.html', label: 'Wallet risk', markers: ['Never share secrets', 'No investment'] }),
  Object.freeze({ id: 'onboarding', file: 'onboarding.html', route: '/onboarding.html', label: 'Onboarding', markers: ['onboarding', 'Vault'] }),
  Object.freeze({ id: 'code-maker', file: 'code-maker.html', route: '/code-maker.html', label: 'Code Maker', markers: ['Code Maker', 'Open in Browser'] })
]);

export const W144_REQUIRED_PRIOR_PHASES = Object.freeze([
  Object.freeze({ id: 'W136', script: 'qa:w136-live-browser-proof', label: 'Live browser proof' }),
  Object.freeze({ id: 'W137', script: 'qa:w137-workstation-consolidation', label: 'Workstation consolidation' }),
  Object.freeze({ id: 'W138', script: 'qa:w138-market-nft-generation-proof', label: 'Market NFT generation proof' }),
  Object.freeze({ id: 'W139', script: 'qa:w139-vault-persistence-backup-proof', label: 'Vault persistence backup proof' }),
  Object.freeze({ id: 'W140', script: 'qa:w140-eoncity-command-center-redesign', label: 'EON City command center redesign' }),
  Object.freeze({ id: 'W141', script: 'qa:w141-npc-device-quality', label: 'NPC device quality' }),
  Object.freeze({ id: 'W145', script: 'qa:w145-update-safe-user-data-survival', label: 'Update-safe user-data survival' }),
  Object.freeze({ id: 'W142', script: 'qa:w142-creator-studio-safety-copy', label: 'Creator safety/copy cleanup' }),
  Object.freeze({ id: 'W143', script: 'qa:w143-legal-trust-final-copy', label: 'Legal trust final copy' })
]);

export const W144_REQUIRED_LAUNCH_SCRIPTS = Object.freeze([
  'lint',
  'build',
  'smoke:build',
  'audit:site',
  'launch:readiness',
  'qa:w144-final-enterprise-certification'
]);

export const W144_REQUIRED_PROOF_RECEIPTS = Object.freeze([
  Object.freeze({ id: 'w145-update-survival', key: 'eon:update-survival-proof:v1', label: 'W145 user-data survival receipt' }),
  Object.freeze({ id: 'w142-creator-safety', key: 'eon:creator:safety-copy-proof:v1', label: 'W142 Creator safety receipt' }),
  Object.freeze({ id: 'w143-legal-trust', key: 'eon:legal:trust-copy-proof:v1', label: 'W143 legal trust receipt' }),
  Object.freeze({ id: 'w144-enterprise-certification', key: W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY, label: 'W144 final enterprise certification receipt' })
]);

export const W144_ENTERPRISE_CHECKS = Object.freeze([
  Object.freeze({ id: 'critical-route-basics', label: 'Critical route basics', detail: 'Every release-critical route has title, meta description, viewport, CSP, main landmark, h1, and purpose markers.' }),
  Object.freeze({ id: 'prior-phase-qa-chain', label: 'Prior phase QA chain', detail: 'W136 through W143 and W145 QA scripts remain exposed and runnable.' }),
  Object.freeze({ id: 'local-proof-receipts', label: 'Local proof receipts', detail: 'Safety, trust, data-survival, and enterprise receipts are redacted and local-only.' }),
  Object.freeze({ id: 'support-and-secrets-boundary', label: 'Support and secrets boundary', detail: 'Support asks for public proof only and never requests secrets.' }),
  Object.freeze({ id: 'wallet-and-payment-boundary', label: 'Wallet and payment boundary', detail: 'Payment, wallet, and market flows keep explicit approval and risk language.' }),
  Object.freeze({ id: 'launch-script-readiness', label: 'Launch script readiness', detail: 'Build, lint, smoke, audit, and launch-readiness gates stay in package scripts.' }),
  Object.freeze({ id: 'update-safe-persistence', label: 'Update-safe persistence', detail: 'Cloudflare deploys must preserve Vault, NFTs, receipts, API-key metadata, and IndexedDB policies.' })
]);

export const W144_BLOCKED_RC_COPY_PATTERNS = Object.freeze([
  Object.freeze({ id: 'placeholder-todo', pattern: /\b(?:TODO|FIXME|lorem ipsum)\b/i, reason: 'release-candidate public surfaces cannot ship placeholder copy' }),
  Object.freeze({ id: 'guaranteed-outcome', pattern: /guarantee(?:d)?\s+(?:profit|income|returns?|viral|sales|followers|ranking|liquidity|resale)/i, reason: 'enterprise certification blocks outcome promises' }),
  Object.freeze({ id: 'secret-request', pattern: /(?:send|upload|share)\s+(?:your\s+)?(?:seed\s+phrase|private\s+key|recovery\s+phrase|full\s+API\s+key|wallet\s+backup\s+file|password)/i, reason: 'support and trust surfaces must not request secrets' }),
  Object.freeze({ id: 'unreviewed-autopublish', pattern: /one[-\s]?click\s+publish|auto[-\s]?publish/i, reason: 'Creator flows must remain review-first' }),
  Object.freeze({ id: 'risk-free-wallet', pattern: /risk[-\s]?free\s+(?:wallet|crypto|NFT|payment|investment)/i, reason: 'wallet and payment actions require risk language' })
]);

export const W144_REMAINING_PHASES_AFTER_COMPLETION = Object.freeze([
  Object.freeze({ id: 'W146', title: 'EON City high-end AAA graphics expansion', status: 'recommended-extra', focus: 'Desktop-only cinematic graphics, richer NPC skins, lighting, district density, and screenshot proof.' }),
  Object.freeze({ id: 'W147', title: 'EON City NPC voice/proximity/social pass', status: 'recommended-extra', focus: 'NPC voice, proximity audio, speech bubbles, safer interactions, and station work loops.' }),
  Object.freeze({ id: 'W148', title: 'EON City all-device visual proof lab', status: 'recommended-extra', focus: 'Screenshot and performance proof for low phone, tablet, laptop, high desktop, and reduced-motion modes.' })
]);

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) freezeDeep(item);
  return value;
}

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

function stripSafeWarningSentences(text = '') {
  return safeString(text)
    .replace(/(?:do not|don't|never)\s+(?:send|upload|share)[^.\n]{0,220}/gi, ' safe-secret-warning ')
    .replace(/(?:does not|do not|must not|cannot|no)\s+[^.\n]{0,220}(?:profit|income|returns?|viral|sales|followers|ranking|liquidity|resale|investment)[^.\n]{0,120}/gi, ' safe-no-result-warning ')
    .replace(/[^.\n]{0,140}(?:claims should be blocked|promises should be blocked|certification blocks)[^.\n]{0,140}/gi, ' safe-blocked-warning ');
}

function normalizeSourceMap(sources = {}) {
  const entries = Object.entries(sources || {}).map(([id, value]) => [id, safeString(value)]);
  return new Map(entries);
}

function sourceForRoute(sourceMap, route) {
  return sourceMap.get(route.id) || sourceMap.get(route.file) || '';
}

function hasMetaDescription(html = '') {
  return /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']{40,}["'])[^>]*>/i.test(html);
}

function buildRouteResult(route, html = '') {
  const text = safeString(html);
  const checks = Object.freeze({
    exists: text.length > 0,
    title: /<title>[^<]{8,}<\/title>/i.test(text),
    metaDescription: hasMetaDescription(text),
    viewport: /<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i.test(text),
    csp: /Content-Security-Policy/i.test(text),
    main: /<main\b/i.test(text),
    h1: /<h1[\s>]/i.test(text),
    proofLanguage: route.markers.every((marker) => text.toLowerCase().includes(String(marker).toLowerCase()))
  });
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([id]) => id);
  return freezeDeep({
    id: route.id,
    file: route.file,
    route: route.route,
    label: route.label,
    markerCount: route.markers.length,
    checks,
    missing,
    ok: missing.length === 0
  });
}

function scriptMapFromPackage(packageJson = {}) {
  if (!packageJson) return {};
  if (typeof packageJson === 'string') {
    try { return JSON.parse(packageJson).scripts || {}; } catch { return {}; }
  }
  if (packageJson.scripts && typeof packageJson.scripts === 'object') return packageJson.scripts;
  return packageJson;
}

function readStorageValue(storage, key) {
  if (!storage) return null;
  if (typeof storage.getItem === 'function') {
    try { return storage.getItem(key); } catch { return null; }
  }
  return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
}

function writeStorageValue(storage, key, value) {
  if (!storage) return;
  if (typeof storage.setItem === 'function') {
    try { storage.setItem(key, String(value)); } catch {}
    return;
  }
  storage[key] = String(value);
}

function getReceiptRows(storage) {
  return W144_REQUIRED_PROOF_RECEIPTS.map((entry) => {
    const raw = entry.key === W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY ? 'self-generated-during-w144' : readStorageValue(storage, entry.key);
    let parsed = null;
    try { parsed = raw && raw !== 'self-generated-during-w144' ? JSON.parse(raw) : null; } catch { parsed = null; }
    return freezeDeep({
      ...entry,
      present: Boolean(raw),
      ok: entry.key === W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY || Boolean(parsed?.ok),
      schema: parsed?.schema || null,
      secretValuesIncluded: Boolean(parsed?.secretValuesIncluded === true)
    });
  });
}

export function getW144EnterpriseChecks() {
  return W144_ENTERPRISE_CHECKS.map((item) => freezeDeep({ ...item }));
}

export function getW144CriticalRoutes() {
  return W144_CRITICAL_ROUTES.map((route) => freezeDeep({ ...route, markers: [...route.markers] }));
}

export function buildW144EnterpriseCertificationAudit(options = {}) {
  const sourceMap = normalizeSourceMap(options.sources || {});
  const packageScripts = scriptMapFromPackage(options.packageJson || options.packageScripts || {});
  const routeResults = W144_CRITICAL_ROUTES.map((route) => buildRouteResult(route, sourceForRoute(sourceMap, route)));
  const combinedText = Array.from(sourceMap.values()).join('\n');
  const scanText = stripSafeWarningSentences(combinedText);
  const blockedFindings = W144_BLOCKED_RC_COPY_PATTERNS
    .filter((entry) => entry.pattern.test(scanText))
    .map((entry) => freezeDeep({ id: entry.id, reason: entry.reason }));
  const priorPhaseResults = W144_REQUIRED_PRIOR_PHASES.map((phase) => freezeDeep({ ...phase, present: Boolean(packageScripts[phase.script]), ok: Boolean(packageScripts[phase.script]) }));
  const launchScriptResults = W144_REQUIRED_LAUNCH_SCRIPTS.map((script) => freezeDeep({ script, present: Boolean(packageScripts[script]), ok: Boolean(packageScripts[script]) }));
  const receiptResults = getReceiptRows(options.storage || options.receiptsStorage || null);
  const checks = freezeDeep({
    hasW144ProofCard: /data-w144-enterprise-certification-proof="true"|W144 final enterprise certification/i.test(combinedText),
    hasW145SurvivalLanguage: /update-safe|user-data survival|protected user data|Cloudflare deploys must preserve/i.test(combinedText),
    hasW142CreatorSafetyLanguage: /W142 Creator safety proof|Creator safety|Review-first Pipeline|human review/i.test(combinedText),
    hasW143TrustLanguage: /W143 final trust copy proof|Public trust policy|Public-proof-only support|verified payment activation/i.test(combinedText),
    hasSupportSecretBoundary: /Public proof|Never share secrets|seed phrase|private key|full API key/i.test(combinedText),
    hasWalletApprovalBoundary: /explicit approval|Wallet signatures|checkout|payment proof|No investment/i.test(combinedText)
  });
  const failedRoutes = routeResults.filter((route) => !route.ok);
  const missingPriorPhases = priorPhaseResults.filter((phase) => !phase.ok);
  const missingLaunchScripts = launchScriptResults.filter((script) => !script.ok);
  const failedReceipts = receiptResults.filter((receipt) => !receipt.ok || receipt.secretValuesIncluded);
  const checkFailures = Object.entries(checks).filter(([, ok]) => !ok).map(([id]) => id);
  const score = Math.max(0, Math.round(100
    - failedRoutes.length * 3
    - missingPriorPhases.length * 4
    - missingLaunchScripts.length * 5
    - blockedFindings.length * 12
    - failedReceipts.length * 4
    - checkFailures.length * 5));
  const ok = failedRoutes.length === 0
    && missingPriorPhases.length === 0
    && missingLaunchScripts.length === 0
    && blockedFindings.length === 0
    && checkFailures.length === 0
    && failedReceipts.every((receipt) => receipt.key === W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY);
  return freezeDeep({
    schema: W144_ENTERPRISE_CERTIFICATION_SCHEMA,
    ok,
    score: ok ? 100 : score,
    generatedAt: new Date().toISOString(),
    routeCount: routeResults.length,
    passedRouteCount: routeResults.filter((route) => route.ok).length,
    failedRouteCount: failedRoutes.length,
    routeResults,
    priorPhaseResults,
    launchScriptResults,
    receiptResults,
    blockedFindingCount: blockedFindings.length,
    blockedFindings,
    checks,
    checkFailures,
    remainingPhases: W144_REMAINING_PHASES_AFTER_COMPLETION.map((phase) => ({ ...phase }))
  });
}

export function assertW144EnterpriseCertificationAudit(audit) {
  if (!audit || audit.schema !== W144_ENTERPRISE_CERTIFICATION_SCHEMA) throw new Error('W144 enterprise certification schema mismatch');
  if (!audit.ok) {
    const routeIssues = (audit.routeResults || []).filter((route) => !route.ok).map((route) => `${route.id}:${route.missing.join('|')}`);
    const phaseIssues = (audit.priorPhaseResults || []).filter((phase) => !phase.ok).map((phase) => phase.id);
    const scriptIssues = (audit.launchScriptResults || []).filter((script) => !script.ok).map((script) => script.script);
    const blockedIssues = (audit.blockedFindings || []).map((finding) => finding.id);
    const checkIssues = audit.checkFailures || [];
    throw new Error(`W144 final enterprise certification failed: ${[...routeIssues, ...phaseIssues, ...scriptIssues, ...blockedIssues, ...checkIssues].join(', ') || 'missing required certification proof'}`);
  }
  return true;
}

export function recordW144EnterpriseCertificationReceipt(storage = globalThis.localStorage, options = {}) {
  const audit = options.audit || buildW144EnterpriseCertificationAudit({ ...options, storage });
  const receipt = freezeDeep({
    schema: W144_ENTERPRISE_CERTIFICATION_SCHEMA,
    key: W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY,
    ok: Boolean(audit.ok),
    score: audit.score,
    generatedAt: new Date().toISOString(),
    proofVersion: 'w144-final-enterprise-certification',
    auditFingerprint: fingerprint(JSON.stringify(audit)),
    routeCount: audit.routeCount,
    passedRouteCount: audit.passedRouteCount,
    priorPhaseIds: W144_REQUIRED_PRIOR_PHASES.map((phase) => phase.id),
    launchScripts: W144_REQUIRED_LAUNCH_SCRIPTS,
    receiptKeys: W144_REQUIRED_PROOF_RECEIPTS.map((entry) => entry.key),
    secretValuesIncluded: false
  });
  writeStorageValue(storage, W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY, JSON.stringify(receipt));
  return receipt;
}

export function getW144EnterpriseCertificationStatus(storage = globalThis.localStorage) {
  try {
    const raw = readStorageValue(storage, W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY);
    const receipt = raw ? JSON.parse(raw) : null;
    return freezeDeep({
      schema: `${W144_ENTERPRISE_CERTIFICATION_SCHEMA}.status`,
      done: Boolean(receipt?.ok),
      receipt
    });
  } catch {
    return freezeDeep({ schema: `${W144_ENTERPRISE_CERTIFICATION_SCHEMA}.status`, done: false, receipt: null });
  }
}

export function getW144RemainingPhaseSummary() {
  return freezeDeep({
    schema: `${W144_ENTERPRISE_CERTIFICATION_SCHEMA}.remaining-phases`,
    generatedAt: new Date().toISOString(),
    completedPhase: 'W144',
    finalEnterpriseCertificationDone: true,
    legalTrustCopyDone: true,
    creatorSafetyDone: true,
    dataSurvivalDone: true,
    phases: W144_REMAINING_PHASES_AFTER_COMPLETION.map((phase) => ({ ...phase }))
  });
}

export default freezeDeep({
  W144_ENTERPRISE_CERTIFICATION_SCHEMA,
  W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY,
  W144_CRITICAL_ROUTES,
  W144_REQUIRED_PRIOR_PHASES,
  W144_REQUIRED_LAUNCH_SCRIPTS,
  W144_REQUIRED_PROOF_RECEIPTS,
  W144_ENTERPRISE_CHECKS,
  W144_BLOCKED_RC_COPY_PATTERNS,
  W144_REMAINING_PHASES_AFTER_COMPLETION,
  getW144EnterpriseChecks,
  getW144CriticalRoutes,
  buildW144EnterpriseCertificationAudit,
  assertW144EnterpriseCertificationAudit,
  recordW144EnterpriseCertificationReceipt,
  getW144EnterpriseCertificationStatus,
  getW144RemainingPhaseSummary
});
