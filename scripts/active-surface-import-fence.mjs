import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { A15_BUILD_ROUTE_ROWS } from '../config/a15-current-product-authority.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const LEGACY_PREFIXES = Object.freeze([
  'archive/',
  'games/',
  'tools/',
  'blog/',
  'nowpayments/',
  'Smart Contracts/',
  'assets/js/realm3d/',
  'assets/js/eon-lite/',
  'assets/js/ads/',
  'assets/js/utils/realmworld-',
  'assets/js/utils/lootbox-',
  'assets/js/utils/wallet',
  'assets/js/utils/token-',
]);

export const RETIRED_VALUE_SYSTEM_PATHS = Object.freeze([
  'assets/js/admin-page.js',
  'assets/js/admin-console.js',
  'assets/js/subscription-page.js',
  'assets/js/vault-page.js',
  'assets/js/vault-api-page.js',
  'assets/js/vault/vault-shell.js',
  'assets/js/utils/admin-wallets.js',
  'assets/js/utils/direct-evm-config.js',
  'assets/js/utils/evm-subscription-rails.js',
  'assets/js/utils/eon-city-realm.js',
  'assets/js/utils/entitlements.js',
  'assets/js/utils/contracts-config.js',
  'assets/js/utils/genesis-collection.js',
  'assets/js/utils/nft-asset-backup.js',
  'assets/js/utils/nft-collection.js',
  'assets/js/utils/nft-onchain.js',
  'assets/js/utils/nft-ownership-utility.js',
  'assets/js/utils/nowpayments-config.js',
  'assets/js/utils/payment-reward-proof.js',
  'assets/js/utils/pool-points.js',
  'assets/js/utils/realmworld-commerce-routing.js',
  'assets/js/utils/secure-score.js',
  'assets/js/utils/community-triggers.js',
  'assets/js/utils/referral-cloud-storage.js',
  'assets/js/utils/referral-cta.js',
  'assets/js/utils/referral-share-center.js',
  'assets/js/utils/runtime-loader.js',
  'assets/js/utils/share-reward-policy.js',
  'assets/js/utils/w106-live-integration-registry.js',
  'assets/js/utils/lootbox.js',
  'assets/js/utils/procedural-lootbox.js',
]);

// Compatibility export for earlier gates. New code should use the explicit R3-F1 name.
export const VALUE_BEARING_LEGACY_MODULES = RETIRED_VALUE_SYSTEM_PATHS;

const FORBIDDEN_RUNTIME_LITERALS = Object.freeze([
  /__EON_ADMIN_WALLETS__/,
  /__EON_ADMIN_WALLET_LIMIT__/,
  /ADMIN_PAYMENT_RECEIVER/,
  /DIRECT_EVM_RECIPIENT/,
  /EVM_SUBSCRIPTION_PAYOUT/
]);
const EVM_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/g;

function toRelative(absPath, root = ROOT) {
  return relative(root, absPath).replaceAll('\\', '/');
}

function readSafe(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function isLocalSpecifier(specifier) {
  return specifier.startsWith('.') || specifier.startsWith('/');
}

function resolveLocalSpecifier(specifier, fromFile, root = ROOT) {
  if (!isLocalSpecifier(specifier)) return null;
  const candidate = specifier.startsWith('/')
    ? join(root, specifier.replace(/^\/+/, ''))
    : resolve(dirname(fromFile), specifier);
  const candidates = [candidate];
  if (!extname(candidate)) candidates.push(`${candidate}.js`, join(candidate, 'index.js'));
  return candidates.find(existsSync) || null;
}

function extractLocalScriptSources(html) {
  const scripts = [];
  const re = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const specifier = match[1];
    if (isLocalSpecifier(specifier)) scripts.push(specifier);
  }
  return scripts;
}

function extractJsSpecifiers(source) {
  const specifiers = new Set();
  const patterns = [
    /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:[\s\S]*?\s+from\s+)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) specifiers.add(match[1]);
  }
  return [...specifiers];
}

export function auditActiveSurfaceImports({ root = ROOT } = {}) {
  const entryFiles = A15_BUILD_ROUTE_ROWS
    .map((route) => route.file)
    .filter(Boolean)
    .map((file) => join(root, file))
    .filter(existsSync);

  const queue = [];
  const visited = new Set();
  const routeEntries = {};

  for (const htmlFile of entryFiles) {
    const scripts = extractLocalScriptSources(readSafe(htmlFile));
    routeEntries[toRelative(htmlFile, root)] = scripts;
    for (const specifier of scripts) {
      const resolved = resolveLocalSpecifier(specifier, htmlFile, root);
      if (resolved) queue.push(resolved);
    }
  }

  while (queue.length) {
    const current = queue.shift();
    const rel = toRelative(current, root);
    if (visited.has(rel)) continue;
    visited.add(rel);
    if (!current.endsWith('.js') && !current.endsWith('.mjs')) continue;
    const source = readSafe(current);
    for (const specifier of extractJsSpecifiers(source)) {
      const resolved = resolveLocalSpecifier(specifier, current, root);
      if (resolved) queue.push(resolved);
    }
  }

  const modules = [...visited].sort();
  const legacyPrefixHits = modules.filter((module) => LEGACY_PREFIXES.some((prefix) => module.startsWith(prefix)));
  const legacyValueHits = modules.filter((module) => RETIRED_VALUE_SYSTEM_PATHS.includes(module));
  const forbiddenLiteralHits = [];
  const evmAddressLiteralHits = [];
  for (const module of modules) {
    const source = readSafe(join(root, module));
    if (FORBIDDEN_RUNTIME_LITERALS.some((pattern) => pattern.test(source))) forbiddenLiteralHits.push(module);
    if (source.match(EVM_ADDRESS_PATTERN)) evmAddressLiteralHits.push(module);
  }

  return {
    schema: 'eonapp.active-surface-import-fence.v4',
    routeEntryCount: Object.keys(routeEntries).length,
    moduleCount: modules.length,
    routeEntries,
    reachableModules: modules,
    legacyPrefixHits,
    legacyValueHits,
    forbiddenLiteralHits,
    evmAddressLiteralHits,
    ok: legacyPrefixHits.length === 0 && legacyValueHits.length === 0 && forbiddenLiteralHits.length === 0 && evmAddressLiteralHits.length === 0,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditActiveSurfaceImports();
  const outDir = join(ROOT, 'tmp');
  mkdirSync(outDir, { recursive: true });
  const output = join(outDir, 'active-surface-import-fence.json');
  writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`[active-surface-import-fence] ${result.ok ? 'PASS' : 'FAIL'}: ${result.moduleCount} reachable modules from ${result.routeEntryCount} live/optional/local surfaces.`);
  if (result.legacyPrefixHits.length) console.error(`[active-surface-import-fence] legacy prefix hits: ${result.legacyPrefixHits.join(', ')}`);
  if (result.legacyValueHits.length) console.error(`[active-surface-import-fence] value-bearing legacy hits: ${result.legacyValueHits.join(', ')}`);
  if (result.forbiddenLiteralHits.length) console.error(`[active-surface-import-fence] forbidden runtime literal hits: ${result.forbiddenLiteralHits.join(', ')}`);
  if (result.evmAddressLiteralHits.length) console.error(`[active-surface-import-fence] EVM address literal hits: ${result.evmAddressLiteralHits.join(', ')}`);
  console.log(`[active-surface-import-fence] report: ${toRelative(output)}`);
  process.exitCode = result.ok ? 0 : 1;
}
