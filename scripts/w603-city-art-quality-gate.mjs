#!/usr/bin/env node
/** W603 source gate — Command Horizon original art, motion, companion and truthful voice handoff. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_ASSET_CATALOG, getCityAssetVariant, validateCityAssetCatalog } from '../assets/js/city/eon-city-asset-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const bytes = (relative) => fs.readFileSync(path.join(ROOT, relative));
const hash = (relative) => crypto.createHash('sha256').update(bytes(relative)).digest('hex');
const checks = [];
const check = (id, ok, message) => checks.push({ id, ok: Boolean(ok), message });

const validation = validateCityAssetCatalog();
check('catalog-valid', validation.ok, validation.errors.join(' ') || 'City asset catalog validates.');
const artIds = ['command-horizon-arrival-gate', 'command-horizon-command-deck', 'command-horizon-wayfinding'];
for (const assetId of artIds) {
  const asset = CITY_ASSET_CATALOG.find((entry) => entry.id === assetId);
  check(`${assetId}-shipped`, asset?.status === 'shipped', `${assetId} is explicitly source-shipped.`);
  check(`${assetId}-provenance`, asset?.provenance?.evidencePath === 'docs/city-art/W603_COMMAND_HORIZON_ART_ASSET_PROVENANCE.md' && asset?.provenance?.derivativeOfThirdParty === false, `${assetId} retains original provenance and a review record.`);
  check(`${assetId}-safe-contract`, asset?.constraints?.allowExternalNetwork === false && asset?.constraints?.containsUserData === false && asset?.constraints?.staticOnly === true, `${assetId} remains local, static environment art without user data.`);
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const variant = getCityAssetVariant(asset, quality);
    const relative = String(variant?.sourcePath || '').replace(/^\//, '');
    const sourceExists = Boolean(relative) && fs.existsSync(path.join(ROOT, relative));
    const publicExists = Boolean(relative) && fs.existsSync(path.join(ROOT, 'public', relative));
    const sourceHash = sourceExists ? hash(relative) : '';
    const publicHash = publicExists ? hash(path.join('public', relative)) : '';
    check(`${assetId}-${quality}-source`, sourceExists && sourceHash === variant?.sha256, `${assetId} ${quality} source GLB matches catalog SHA-256.`);
    check(`${assetId}-${quality}-public`, publicExists && publicHash === variant?.sha256, `${assetId} ${quality} public GLB matches catalog SHA-256.`);
    if (sourceExists) {
      const content = bytes(relative);
      const jsonLength = content.readUInt32LE(12);
      const json = JSON.parse(content.subarray(20, 20 + jsonLength).toString('utf8').trim());
      const stringified = JSON.stringify(json);
      check(`${assetId}-${quality}-glb`, content.readUInt32LE(0) === 0x46546c67 && content.readUInt32LE(4) === 2 && json?.asset?.extras?.texturelessPbr === true && !stringified.includes('http://') && !stringified.includes('https://') && !(json.images || []).length && !(json.textures || []).length, `${assetId} ${quality} is a deterministic textureless local GLB without external URI/image payloads.`);
    }
  }
}
const city = read('assets/js/city/eon-city-play-babylon.js');
const artRuntime = read('assets/js/city/eon-city-original-scene-art-runtime.js');
const motion = read('assets/js/city/eon-city-character-motion-director.js');
const companion = read('assets/js/city/eon-city-companion-director.js');
const rig = read('assets/js/city/eon-city-original-rig-runtime.js');
const station = read('assets/js/eon-city-play-station.js');
check('scene-runtime-integrated', city.includes('createEonCityOriginalSceneArtRuntime') && city.includes('originalSceneArtRuntime.start') && city.includes('originalSceneArtAnchors'), 'City initializes original Command Horizon art at authored anchors.');
check('motion-is-actual', city.includes('appliedStep = resolvedMovement.appliedStep') && city.includes('characterMotionDirector.update') && city.includes('operator.rotation.y = characterMotionSnapshot.heading'), 'Navigator state derives from actual collision-resolved movement and smoothed heading.');
check('companion-camera-safe', city.includes('companionDirector.update') && city.includes('cameraPosition: camera.position') && city.includes('setCompanionIntent') && !city.includes('root.position.x = operator.position.x + staging.followOffset.x'), 'EONBOT is director-driven, camera-aware, and no longer fixed to a sinusoidal follow transform.');
check('environment-runtime-local-only', artRuntime.includes("rootUrl.startsWith('/assets/city/')") && artRuntime.includes('ownerVisualApprovalPending: true') && artRuntime.includes('textureAuthoringComplete: false'), 'Environment loader accepts only local City assets and does not claim final texture approval.');
check('motion-contract-truthful', motion.includes('blocked: hasIntent && !moving') && companion.includes('autonomousAgent: false') && companion.includes('microphoneRequested: false'), 'Motion contracts keep blocked movement, autonomy, and microphone states truthful.');
check('voice-animates-without-claiming-ai-call', station.includes("signalCompanion('listen', 8_000)") && station.includes("signalCompanion('speak', 4_200)") && station.includes('not a live AI conversation') && station.includes('live assistant voice conversation remains unavailable'), 'Voice UI can visibly cue EONBOT but still does not claim an unverified live AI voice conversation.');
check('transient-emotes', rig.includes('transientAnimations') && rig.includes('playTransient') && rig.includes('emoteDurationMs'), 'Navigator and companion one-shot emotes survive the next render tick long enough to be observable.');

const failed = checks.filter((entry) => !entry.ok);
const report = {
  schema: 'eon.city.w603.command-horizon-art-quality-gate.v1',
  ok: !failed.length,
  checks,
  verifiedAt: new Date().toISOString(),
  truthfulState: {
    originalEnvironmentGlbsShipped: true,
    texturelessPbrCandidates: true,
    ktx2BasisTexturePackShipped: false,
    ownerVisualApprovalPending: true,
    realDeviceVisualProofPending: true,
    authenticatedProductionClosurePending: true
  },
  remoteNetwork: false,
  containsUserData: false
};
const output = path.join(ROOT, 'reports', 'w603-city-art-quality');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
