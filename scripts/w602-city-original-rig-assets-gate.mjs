#!/usr/bin/env node
/** W602 source gate — original rigs, direct interaction and truthful voice. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CITY_ASSET_CATALOG, getCityAssetVariant, validateCityAssetCatalog } from '../assets/js/city/eon-city-asset-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const hash = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
const checks = [];
const check = (id, ok, message) => checks.push({ id, ok: Boolean(ok), message });

const validation = validateCityAssetCatalog();
check('catalog-valid', validation.ok, validation.errors.join(' ') || 'Catalog validates.');
for (const assetId of ['operator-hero', 'eonbot-companion']) {
  const asset = CITY_ASSET_CATALOG.find((entry) => entry.id === assetId);
  check(`${assetId}-shipped`, asset?.status === 'shipped', `${assetId} must be explicitly source-shipped.`);
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const variant = getCityAssetVariant(asset, quality);
    const relative = String(variant?.sourcePath || '').replace(/^\//, '');
    const exists = Boolean(relative) && fs.existsSync(path.join(ROOT, 'public', relative));
    check(`${assetId}-${quality}-copied`, exists, `${assetId} ${quality} GLB must be copied to public assets.`);
    check(`${assetId}-${quality}-hash`, exists && hash(path.join('public', relative)) === variant?.sha256, `${assetId} ${quality} hash must match the catalog.`);
  }
}
const station = read('assets/js/eon-city-play-station.js');
const city = read('assets/js/city/eon-city-play-babylon.js');
const css = read('assets/css/eon-city-play.css');
const voice = read('assets/js/voice/eon-voice-consent.js');
check('direct-actions', ['data-eon-play-open-eonbot>EONBOT', 'data-eon-play-open-voice-consent>Voice', 'data-eon-play-open-chat>Chat', 'data-eon-play-open-travel-map>Districts', 'data-eon-play-context-action'].every((value) => station.includes(value)) && !station.includes('data-eon-play-interact'), 'Direct HUD must use named quick actions without generic Interact.');
check('modal-input-layer', station.includes('containModalPointer') && station.includes("panel.style.zIndex = '1200'") && css.includes('.eon-play-first-run-panel{z-index:1200!important;pointer-events:auto;isolation:isolate}'), 'First-run modal must own pointer input above canvas.');
check('landmark-clarity', city.includes('eon-universe-landmark-label-') && city.includes('landmark.radius * 0.9'), 'Landmarks must have labeled enlarged direct hit areas.');
check('rig-runtime', city.includes('createEonCityOriginalRigRuntime') && city.includes('originalRigRuntime.start') && city.includes('proceduralFallbackRoot'), 'City must attach local GLB rigs while keeping fallback recovery.');
check('truthful-voice', voice.includes('explicit-user-action-required') && voice.includes('liveConversationClaimed: false') && voice.includes('automaticChatSend: false'), 'Voice must remain explicit, captions-first and non-autonomous.');
const failed = checks.filter((entry) => !entry.ok);
const report = { schema: 'eon.city.w602.original-rigs.gate.v1', ok: !failed.length, checks, verifiedAt: new Date().toISOString(), remoteNetwork: false, ownerVisualApprovalPending: true };
const output = path.join(ROOT, 'reports', 'w602-city-original-rigs');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
