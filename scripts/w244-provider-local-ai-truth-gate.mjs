#!/usr/bin/env node
/**
 * W244 Provider, Local AI and EONBOT truth gate.
 *
 * This is a source + optional emitted-output firewall. It proves only that the
 * current package has explicit user intent for loopback probes, current
 * verification evidence for hosted models, Vault-only BYOK entry, and no
 * current route links to retired setup pages. It deliberately does not claim a
 * third-party provider, local runtime, device, or deployment has been tested.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRE_DIST = process.argv.includes('--require-dist');
const errors = [];
const notes = [];

function fail(message) { errors.push(message); }
function assert(condition, message) { if (!condition) fail(message); }
function read(relative) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    fail(`Missing required file: ${relative}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const out = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(absolute));
    else out.push(absolute);
  }
  return out;
}

const runtime = read('assets/js/chat/ai-runtime.js');
const providerCatalog = read('assets/js/chat/ai-provider-catalog.js');
const readiness = read('assets/js/utils/ai-readiness.js');
const chat = read('assets/js/chat-page.js');
const vault = read('vault.html');
const vaultRuntime = read('assets/js/vault/eon-vault-page.js');
const shell = read('assets/js/eon-app-shell.js');
const workspace = read('assets/js/eon-workspace-pages.js');
const onboardingReminder = read('assets/js/utils/onboarding-reminder.js');
const router = read('assets/js/utils/eon-auto-router.js');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(imports.legacyValueHits.length === 0, `Active source graph reaches legacy value module(s): ${imports.legacyValueHits.join(', ')}`);
for (const forbidden of ['assets/js/vault-api-page.js', 'assets/js/vault-page.js']) {
  assert(!imports.reachableModules.includes(forbidden), `Active source graph reaches retired provider/Vault surface: ${forbidden}`);
}

assert(/import\s+\{\s*shouldProbeLocalRuntimes\s*\}/.test(runtime), 'ai-runtime does not import the shared local runtime policy.');
assert(/if\s*\(!shouldProbeLocalRuntimes\(\{\s*force\s*\}\)\)\s*return\s+empty\(\)/.test(runtime), 'ai-runtime can inspect localhost without policy approval.');
assert(/export\s+function\s+getProviderVerification\(/.test(runtime), 'Provider verification evidence function is missing.');
assert(/status\s*===\s*'verified-model-list'/.test(runtime), 'Hosted provider readiness is not limited to verified model-list evidence.');
assert(/local-self-test-required/.test(runtime), 'Local providers are not explicitly deferred to the Local AI device self-test.');
assert((runtime.match(/assertProviderVerifiedForRequest\(provider,\s*[A-Za-z][A-Za-z0-9_]*\)/g) || []).length >= 2, 'Chat request path lacks a provider verification guard.');
assert(!/return\s+current\s*\|\|\s*provider\.defaultModel/.test(runtime), 'Provider model selection can still fall back to a static provider default.');

const resolverStart = runtime.indexOf('function resolveModelPolicyCompat');
const resolverEnd = runtime.indexOf('\nfunction trimHistory', resolverStart);
const resolver = runtime.slice(resolverStart, resolverEnd > resolverStart ? resolverEnd : resolverStart + 5000);
assert(resolverStart >= 0, 'Evidence-aware compatibility resolver is missing.');
assert(/getProviderVerification/.test(resolver), 'Compatibility resolver does not use current verification evidence.');
assert(!/getApiKey\(/.test(resolver), 'Compatibility resolver can still treat a stored key as routing evidence.');
assert(!/fallbackOrder|researchOrder|research-priority-router|code-priority-router/.test(resolver), 'Compatibility resolver retains static provider-priority routing.');
assert(/return guidePlan\('verification-required'\)/.test(resolver), 'Compatibility resolver does not fail closed to Guide Mode.');

const hostedRows = providerCatalog.match(/id:\s*'(?:groq|gemini|cerebras|mistral|deepseek|perplexity|together|cohere|nvidia|sambanova|fireworks|huggingface|openai|openrouter|xai|qwen|anthropic)'[\s\S]{0,700}?defaultModel:\s*'[^']*'/g) || [];
assert(hostedRows.length >= 10, 'Hosted provider registry rows could not be inspected.');
for (const row of hostedRows) assert(/defaultModel:\s*''/.test(row), `Hosted provider retains an operative hard-coded model: ${row.match(/id:\s*'([^']+)'/)?.[1] || 'unknown'}`);
assert(!/badge:\s*'(?:⚡ Free|💳 Paid)'/.test(providerCatalog), 'Provider catalog retains static price/tier badges.');
assert(!/signupUrl:/.test(providerCatalog), 'Provider catalog retains a stale static signup destination.');
assert(/getProviderVerification/.test(router), 'Auto router does not consume provider verification evidence.');
assert(!/routeType === 'free'|routeType === 'premium'/.test(router), 'Auto router still ranks providers by static price labels.');

assert(/getProviderVerification/.test(readiness), 'AI readiness UI is not evidence-aware.');
assert(/CANONICAL_AI_KEYS_PATH\s*=\s*'\/vault#provider-check'/.test(readiness), 'Hosted provider setup does not route to Vault verification.');
assert(/CANONICAL_AI_SETUP_PATH\s*=\s*'\/local-ai'/.test(readiness), 'Local AI setup does not use the canonical Local AI route.');
assert(!/provider\.defaultModel\s*\|\|/.test(readiness), 'Readiness UI can still display an unverified default model.');

assert(/id="provider-check"/.test(vault), 'Vault provider-check anchor is missing.');
assert(/<input[^>]*id="eon-vault-provider-key"[^>]*type="password"/.test(vault), 'Vault provider key entry is not password-protected.');
assert(/verifyProviderReadiness\(/.test(vaultRuntime), 'Vault does not invoke explicit provider verification.');
assert(/ApiKeyVault\.store\(/.test(vaultRuntime), 'Vault no longer supports optional encrypted device-local key storage.');
assert(!/<input[^>]+(?:api[-_ ]?key|provider[-_ ]?key)[^>]*>/i.test(read('chat.html')), 'Chat HTML exposes a credential-entry field.');
assert(!/type\s*[:=]\s*['"]password/i.test(chat), 'Chat runtime exposes a password/credential entry control.');

const retiredRoutePattern = /\/(?:onboarding\.html|get-free-ai-power\.html|vault-api-keys\.html)\b/;
for (const [label, source] of Object.entries({ shell, workspace, readiness, chat, vault, vaultRuntime })) {
  assert(!retiredRoutePattern.test(source), `${label} still refers to a retired provider/setup route.`);
}
assert(/window\.location\.assign\('\/vault#provider-check'\)/.test(chat), 'Chat does not expose the canonical Vault provider-verification route.');
assert(/\/local-ai/.test(workspace) && /(?:href:\s*['"]\/local-ai['"]|href=['"]\/local-ai['"])/.test(shell), 'Current shell does not expose Local AI through its canonical route.');
assert(!/import\([^\n]*eon-chat-widget|from ['"][^'"]*eon-chat-widget/.test([shell, workspace, chat].join('\n')), 'Current runtime paths can still import the retired floating EONBOT widget.');
assert(!/get-free-ai-power\.html/.test(onboardingReminder), 'Active Vault reminder still points to retired Local AI setup.');

const detectionStart = chat.indexOf('async function detectAndApplyLocalRuntimes');
const detectionEnd = chat.indexOf('\nfunction ', detectionStart + 1);
const detectionHandler = chat.slice(detectionStart, detectionEnd > detectionStart ? detectionEnd : detectionStart + 2000);
assert(detectionStart >= 0, 'Chat local-detection handler missing.');
assert(!/saveAISettings\(/.test(detectionHandler), 'Chat saves a detected local runtime as the active provider without its self-test.');
assert(/Local AI self-test/.test(detectionHandler), 'Chat detection flow does not direct the user to the Local AI self-test.');
assert(!/verifyProviderReadiness/.test(chat), 'Chat performs provider verification instead of routing it to Vault.');
assert(/window\.location\.assign\('\/vault#provider-check'\)/.test(chat), 'Chat does not route provider verification to Vault.');

const outputRetiredRouteHits = [];
const outputUnsafeReadyHits = [];
const outputRetiredWidgetHits = [];
if (REQUIRE_DIST) {
  assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before W244 output proof.');
  if (fs.existsSync(DIST)) {
    const outputFiles = walk(DIST).filter((file) => /\.(?:html|m?js)$/i.test(file));
    for (const absolute of outputFiles) {
      const text = fs.readFileSync(absolute, 'utf8');
      const relative = path.relative(ROOT, absolute).replaceAll('\\', '/');
      if (retiredRoutePattern.test(text)) outputRetiredRouteHits.push(relative);
      if (/saved key[^.]{0,80}\bready\b|key saved and ready/i.test(text)) outputUnsafeReadyHits.push(relative);
      if (/eon-chat-widget/.test(text)) outputRetiredWidgetHits.push(relative);
    }
    const builtVault = path.join(DIST, 'vault', 'index.html');
    assert(fs.existsSync(builtVault), 'Built Vault route is missing.');
    if (fs.existsSync(builtVault)) {
      const built = fs.readFileSync(builtVault, 'utf8');
      assert(/id="provider-check"/.test(built), 'Built Vault route lacks the provider verification card.');
      assert(/id="eon-vault-provider-key"/.test(built), 'Built Vault route lacks the provider key field.');
    }
  }
}
assert(outputRetiredRouteHits.length === 0, `Built output still links to retired provider/setup routes: ${outputRetiredRouteHits.join(', ')}`);
assert(outputUnsafeReadyHits.length === 0, `Built output still equates a saved key with readiness: ${outputUnsafeReadyHits.join(', ')}`);
assert(outputRetiredWidgetHits.length === 0, `Built output still contains the retired floating EONBOT widget: ${outputRetiredWidgetHits.join(', ')}`);

const report = {
  schema: 'eonapp.w244.provider-local-ai-eonbot-truth-report.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  requireDist: REQUIRE_DIST,
  activeSurface: {
    routeEntryCount: imports.routeEntryCount,
    moduleCount: imports.moduleCount,
    legacyValueHits: imports.legacyValueHits
  },
  outputRetiredRouteHits,
  outputUnsafeReadyHits,
  notes,
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W244_PROVIDER_LOCAL_AI_TRUTH_REPORT_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error('[W244] Provider / Local AI / EONBOT truth gate failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`[W244] PASS: ${imports.moduleCount} reachable modules; provider readiness is evidence-gated, local scans are user-intent-gated, Vault is the active BYOK surface, and emitted setup links are current.`);
