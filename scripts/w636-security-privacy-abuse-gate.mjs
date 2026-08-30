#!/usr/bin/env node
/** W636 source-only security, privacy, secrets and abuse-resistance gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_REQUEST_LIMITS } from '../functions/_shared/eon-request-security.js';
import { validateW636SecurityPrivacyAbuseContract, W636_SECURITY_PRIVACY_ABUSE_CONTRACT } from '../config/w636-security-privacy-abuse-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

function packageLockChecks() {
  let lock = null;
  try { lock = JSON.parse(read('package-lock.json')); } catch {}
  const packages = lock?.packages && typeof lock.packages === 'object' ? Object.values(lock.packages) : [];
  const insecureResolved = packages.filter((entry) => typeof entry?.resolved === 'string' && entry.resolved.startsWith('http:'));
  const missingIntegrity = packages.filter((entry) => entry && entry.resolved && !entry.integrity && !entry.link);
  return freeze({
    parsed: Boolean(lock),
    lockfileVersion: Number(lock?.lockfileVersion || 0),
    packageCount: packages.length,
    insecureResolvedCount: insecureResolved.length,
    missingIntegrityCount: missingIntegrity.length,
    ok: Boolean(lock) && Number(lock.lockfileVersion || 0) >= 3 && insecureResolved.length === 0 && missingIntegrity.length === 0
  });
}


function workflowPinChecks() {
  const directory = path.join(root, '.github/workflows');
  const files = fs.readdirSync(directory).filter((name) => /\.ya?ml$/i.test(name)).sort();
  const uses = [];
  for (const name of files) {
    const source = fs.readFileSync(path.join(directory, name), 'utf8');
    for (const match of source.matchAll(/\buses:\s*([^\s#]+)(?:\s*#\s*([^\n]+))?/g)) {
      const reference = String(match[1] || '');
      if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
      uses.push({ file: name, reference, comment: String(match[2] || '').trim() });
    }
  }
  const mutable = uses.filter(({ reference }) => !/@[0-9a-f]{40}$/i.test(reference));
  return freeze({ files, uses, mutable, ok: uses.length > 0 && mutable.length === 0 });
}

function sourceChecks() {
  const contract = validateW636SecurityPrivacyAbuseContract();
  const helper = read('functions/_shared/eon-request-security.js');
  const checkout = read('functions/api/billing/checkout.js');
  const action = read('functions/api/billing/subscription-action.js');
  const referrals = read('functions/api/referrals.js');
  const deletion = read('functions/api/account/delete-request.js');
  const runtime = read('assets/js/billing/eon-dodo-live-runtime.js');
  const csp = read('functions/csp-report.js');
  const toolRegistry = read('assets/js/utils/tool-registry.js');
  const orchestrator = read('assets/js/utils/agent-orchestrator.js');
  const hardening = read('assets/js/utils/security-hardening.js');
  const auth = read('functions/_shared/eon-auth.js');
  const attachments = read('assets/js/chat/local-attachments.js');
  const legacyKeyStore = read('assets/js/utils/quantum-safe-keys.js');
  const privacy = read('privacy.html');
  const support = read('help.html');
  const vaultPage = read('vault.html');
  const lock = packageLockChecks();
  const workflowPins = workflowPinChecks();
  const mutationSources = [checkout, action, referrals, deletion];
  const limitsMatch = JSON.stringify(EON_REQUEST_LIMITS) === JSON.stringify(W636_SECURITY_PRIVACY_ABUSE_CONTRACT.requestLimits);

  return freeze([
    freeze({ id: 'contract', pass: contract.ok, detail: 'canonical W636 contract' }),
    freeze({ id: 'request-helper', pass: /readBoundedText/.test(helper) && /readBoundedJson/.test(helper) && /unsupported_media_type/.test(helper) && /reader\.cancel/.test(helper) && /fatal: true/.test(helper) && /invalid_utf8/.test(helper), detail: 'stream, media-type and strict UTF-8 bounds' }),
    freeze({ id: 'request-limits', pass: limitsMatch, detail: JSON.stringify(EON_REQUEST_LIMITS) }),
    freeze({ id: 'mutation-routes', pass: mutationSources.every((source) => /enforceSameOriginMutation/.test(source) && /readBoundedJson/.test(source)), detail: 'same-origin plus bounded JSON' }),
    freeze({ id: 'session-cookie', pass: /__Host-eon_session/.test(auth) && /HttpOnly/.test(auth) && /parts\.push\(`SameSite=/.test(auth) && /Secure/.test(auth), detail: 'host-only secure opaque session' }),
    freeze({ id: 'api-response-headers', pass: /x-frame-options': 'DENY'/.test(auth) && /cross-origin-resource-policy': 'same-origin'/.test(auth) && /permissions-policy': 'camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\), usb=\(\)'/.test(auth), detail: 'JSON APIs deny framing, cross-origin embedding and ambient device permissions' }),
    freeze({ id: 'checkout-url', pass: /safeDodoUrl/.test(runtime) && /untrusted_checkout_url/.test(runtime), detail: 'allowlisted Dodo checkout URL' }),
    freeze({ id: 'webhook-replay', pass: /payload_hash/.test(runtime) && /webhook_id_payload_mismatch/.test(runtime) && /httpStatus: applied\.conflict \? 409/.test(runtime), detail: 'event id bound to payload hash' }),
    freeze({ id: 'webhook-body', pass: /providerWebhook/.test(runtime) && /readBoundedText/.test(runtime) && /isJsonContentType/.test(runtime), detail: 'signed bounded JSON webhook' }),
    freeze({ id: 'public-identifiers', pass: !/signedIn: true, accountId/.test(runtime) && !/checkoutUrl, sessionId/.test(runtime), detail: 'account and provider session ids suppressed' }),
    freeze({ id: 'plaintext-provider-alias', pass: /ApiKeyVault\.retrieve\('alchemy'\)/.test(toolRegistry) && !/localStorage\.getItem\(['"]eon:vault:api-keys:v1/.test(toolRegistry), detail: 'Alchemy reads encrypted vault only' }),
    freeze({ id: 'browser-admin-trust', pass: /runtime-origin-trust-mutation-retired/.test(hardening) && /safeStorageRemove\(RETIRED_HMAC_STORAGE_KEY\)/.test(hardening) && !/localStorage\.getItem\(['"]eon:security:hmac-key/.test(orchestrator), detail: 'no persistent browser admin HMAC' }),
    freeze({ id: 'fixed-origins', pass: /return \['https:\/\/eonapp\.ch', 'http:\/\/127\.0\.0\.1:8000'\]/.test(hardening), detail: 'code-reviewed browser origin roots' }),
    freeze({ id: 'csp-telemetry', pass: /readBoundedText/.test(csp) && /split\(';', 1\)/.test(csp) && /redactUrl/.test(csp) && /redactOrigin/.test(csp) && !/headers\.get\(['"](?:cookie|authorization)/i.test(csp), detail: 'bounded exact-media-type redacted CSP telemetry' }),
    freeze({ id: 'public-copy-truth', pass: /Google Login is not a backup and does not create automatic cloud sync/.test(privacy) && /no wallet or chain action/.test(privacy) && /(?:human review availability is not promised|no guaranteed response time|response-time promise is not made)/i.test(support) && /intentionally excludes API\/provider keys/.test(vaultPage) && !/explicit wallet approval/.test(privacy), detail: 'privacy, support and Vault copy match actual custody and support boundaries' }),
    freeze({ id: 'legacy-key-store-truth', pass: /Legacy encrypted provider-key compatibility store/.test(legacyKeyStore) && /legacy-provider-key-store-retired/.test(legacyKeyStore) && /legacy-provider-key-export-retired/.test(legacyKeyStore) && /legacy-provider-key-import-retired/.test(legacyKeyStore) && /postQuantumReady: false/.test(legacyKeyStore) && !/Provides encrypted key storage using Dilithium/.test(legacyKeyStore), detail: 'legacy PBKDF2/AES store is migration-only and never advertised as post-quantum' }),
    freeze({ id: 'attachment-abuse', pass: /MAX_LOCAL_ATTACHMENT_COUNT = 8/.test(attachments) && /MAX_LOCAL_ATTACHMENT_BYTES = 5 \* 1024 \* 1024/.test(attachments) && /SECRET_CONTENT_PATTERN/.test(attachments) && /BLOCKED_EXTENSIONS/.test(attachments), detail: 'bounded local-only file intake' }),
    freeze({ id: 'workflow-pins', pass: workflowPins.ok, detail: `${workflowPins.uses.length} external uses; ${workflowPins.mutable.length} mutable` }),
    freeze({ id: 'lockfile', pass: lock.ok, detail: `${lock.packageCount} packages; ${lock.insecureResolvedCount} insecure; ${lock.missingIntegrityCount} missing integrity` }),
    freeze({ id: 'evidence-fence', pass: W636_SECURITY_PRIVACY_ABUSE_CONTRACT.productionCertified === false, detail: 'external production evidence pending' }),
    freeze({ id: 'files', pass: ['config/w636-security-privacy-abuse-contract.mjs', 'config/w636-security-privacy-abuse-contract.json', 'tests/unit/w636-security-privacy-abuse.test.mjs'].every(exists), detail: 'contract and maintained test set' })
  ]);
}

export function inspectW636SecurityPrivacyAbuse({ writeArtifact = false } = {}) {
  const checks = sourceChecks();
  const result = freeze({
    schema: 'eonapp.gate.w636.security-privacy-abuse.2026-07-11.v1',
    wave: 'W636',
    ok: checks.every((row) => row.pass),
    total: checks.length,
    passed: checks.filter((row) => row.pass).length,
    checks,
    productionCertified: false,
    limitations: freeze(W636_SECURITY_PRIVACY_ABUSE_CONTRACT.externalEvidenceRequired)
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts/w636-security-privacy-abuse');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'source-receipt.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = inspectW636SecurityPrivacyAbuse({ writeArtifact: true });
  for (const check of result.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.id} — ${check.detail}`);
  console.log(`\nW636 security/privacy/abuse source gate: ${result.passed}/${result.total}`);
  if (!result.ok) process.exitCode = 1;
}
