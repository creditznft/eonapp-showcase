#!/usr/bin/env node
/** W564 source gate — deterministic, visual-only City Appearance Vault. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/contracts/city/eon-city-vault-reveals.js',
  'assets/js/contracts/city/eon-city-eonbot-companion.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'assets/js/local-first/eon-local-encrypted-export.js',
  'assets/js/vault/eon-vault-lifecycle.js',
  'assets/js/utils/update-safe-user-data.js',
  'tests/unit/w564-city-vault-reveals.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const vault = files['assets/js/contracts/city/eon-city-vault-reveals.js'];
const companion = files['assets/js/contracts/city/eon-city-eonbot-companion.js'];
const babylon = files['assets/js/city/eon-city-play-babylon.js'];
const station = files['assets/js/eon-city-play-station.js'];
const encrypted = files['assets/js/local-first/eon-local-encrypted-export.js'];
const lifecycle = files['assets/js/vault/eon-vault-lifecycle.js'];
const updateSafe = files['assets/js/utils/update-safe-user-data.js'];
const unit = files['tests/unit/w564-city-vault-reveals.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(vault, /EON_CITY_VAULT_REVEALS_SCHEMA\s*=\s*'eon\.city\.vault-reveals\.w564\.v1'/, 'schema-missing');
need(vault, /EON_CITY_VAULT_REVEALS_STORAGE_KEY\s*=\s*'eon:city:cosmetics:v1'/, 'storage-key-missing');
need(vault, /getEonCityEonbotCompanionSkins/, 'companion-skin-catalogue-missing');
need(vault, /visualOnly:\s*true/, 'visual-only-boundary-missing');
need(vault, /includedInFreeCore:\s*true/, 'free-core-boundary-missing');
need(vault, /deterministicReveal:\s*true/, 'deterministic-boundary-missing');
need(vault, /randomChance:\s*false/, 'chance-boundary-missing');
need(vault, /rarityClaimed:\s*false/, 'rarity-boundary-missing');
need(vault, /commercialEntitlementRequired:\s*false/, 'commercial-entitlement-boundary-missing');
need(vault, /subscriptionBenefitClaimed:\s*false/, 'subscription-boundary-missing');
need(vault, /transferable:\s*false/, 'transfer-boundary-missing');
need(vault, /ownershipClaimed:\s*false/, 'ownership-boundary-missing');
need(vault, /marketListingCreated:\s*false/, 'market-boundary-missing');
need(vault, /walletOrTokenCreated:\s*false/, 'wallet-token-boundary-missing');
need(vault, /prepareEonCityVaultReveal/, 'review-preparation-missing');
need(vault, /explicit-user-action-required/, 'explicit-action-boundary-missing');
need(vault, /exactResultVisibleBeforeConfirmation:\s*true/, 'exact-result-review-boundary-missing');
need(vault, /normalizeEonCityVaultRevealInventory/, 'closed-normalizer-missing');
need(vault, /data-eon-play-cosmetic-card/, 'distinct-card-selector-missing');
need(vault, /city-appearance-vault/, 'workroom-lifecycle-missing');
forbid(vault, /(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/i, 'vault-reveals-must-not-network');
forbid(vault, /Math\.random\s*\(/, 'vault-reveals-must-not-randomize');

need(companion, /EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN/, 'companion-default-skin-missing');
need(babylon, /getEonCitySelectedCompanionSkinId/, 'babylon-selected-skin-read-missing');
need(babylon, /skinId:\s*getEonCitySelectedCompanionSkinId\(\)/, 'babylon-selected-skin-plan-missing');
need(station, /renderEonCityVaultReveals/, 'station-vault-render-missing');
need(station, /bindEonCityVaultReveals/, 'station-vault-bind-missing');
need(station, /data-eon-play-open-cosmetics/, 'station-vault-control-missing');
need(vault, /Your selection applies the next time City starts or restarts/, 'next-restart-truth-missing');
need(encrypted, /EON_CITY_VAULT_REVEALS_STORAGE_KEY/, 'encrypted-export-key-missing');
need(encrypted, /normalizeEonCityVaultRevealInventory/, 'encrypted-export-normalizer-missing');
need(lifecycle, /EON_CITY_VAULT_REVEALS_STORAGE_KEY/, 'vault-backup-key-missing');
need(lifecycle, /normalizeEonCityVaultRevealInventory/, 'vault-backup-normalizer-missing');
need(updateSafe, /eon:city:cosmetics:v1/, 'update-safe-cosmetic-key-missing');
need(unit, /W564 exposes exact, visual-only companion styles/, 'w564-catalogue-unit-missing');
need(unit, /W564 requires an explicit exact-result review/, 'w564-review-unit-missing');
need(unit, /W564 preserves only the normalized visual preference/, 'w564-portability-unit-missing');
need(runner, /w564-city-vault-reveals\.test\.mjs/, 'w564-current-suite-registration-missing');

const CHECK_COUNT = 39;
export function inspectW564CityVaultReveals() {
  return Object.freeze({ wave: 'W564', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW564CityVaultReveals();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w564-city-vault-reveals-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
