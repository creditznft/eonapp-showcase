#!/usr/bin/env node
/** W456.1 static source gate for original readable procedural guides. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonNoirGuideArchetypes, getEonNoirGuidePlan, getEonNoirNpcKitSummary, validateEonNoirNpcKit } from '../assets/js/city/eon-city-noir-npc-kit.js';
import { validateW456ANoirGuideCastContract } from '../config/w456a-noir-readable-guide-cast-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW456ANoirReadableGuideCast() {
  const errors = [...validateEonNoirNpcKit().errors, ...validateW456ANoirGuideCastContract(getEonNoirNpcKitSummary())];
  const kit = read('assets/js/city/eon-city-noir-npc-kit.js');
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const ensure = (condition, message) => { if (!condition) errors.push(message); };
  const roles = getEonNoirGuideArchetypes();
  const readable = roles.map((role) => getEonNoirGuidePlan({ roleId: role.roleId, quality: 'balanced' }));
  const silhouette = roles.map((role) => getEonNoirGuidePlan({ roleId: role.roleId, quality: 'lite' }));

  ensure(roles.length === 5, 'W456.1 needs the five non-EONBOT named guide roles.');
  ensure(readable.every((entry) => entry?.readableFace && entry.detail === 'readable'), 'Balanced guide plans require readable face cues.');
  ensure(silhouette.every((entry) => entry?.readableFace === false && entry.detail === 'silhouette'), 'Lite guide plans must reduce detail intentionally.');
  ensure(readable.map((entry) => entry.castName).join('|') === 'Builder|Curator|Guardian|Device Technician|Support Navigator', 'Guide cast must retain the named EON Noir roles.');
  ensure(/createEonNoirGuideNpc/.test(city) && /getEonNoirNpcKitSummary/.test(city), 'Babylon City must render and report the new guide kit.');
  ensure(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|document\.cookie/i.test(kit), 'Guide kit must remain local-only and network/storage-free.');
  ensure(!/\bfetch\s*\(|\bSceneLoader\b|\bImportMeshAsync\b|\bAppendAsync\b|\bLoadAssetContainerAsync\b|\.(?:glb|gltf|ktx2)(?:['\"])|https?:\/\//i.test(kit), 'Guide kit must not load remote or binary art assets.');
  ensure(!/(?:task|work|action)\s*(?:completed|approved)|\b(?:paid|subscription|reward|payout)\b/i.test(kit), 'Guide kit must not fabricate product, payment or reward status.');

  return Object.freeze({
    schema: 'eonapp.w456.1.noir-readable-guide-cast-gate.v1',
    wave: 'W456.1',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    guideCount: roles.length,
    readableGuideCount: readable.filter((entry) => entry.readableFace).length,
    qualityProfiles: Object.freeze(['silhouette', 'balanced', 'cinematic']),
    errors: Object.freeze(errors),
    limitations: Object.freeze(['This source pass does not ship final rigged/animated GLB characters, device visual proof, human art approval, voice/proximity evidence or final NPC certification.'])
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW456ANoirReadableGuideCast();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  const directory = path.join(root, 'artifacts', 'w456a-noir-readable-guide-cast-gate');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`W456.1 readable guide cast source gate passed (${report.readableGuideCount}/${report.guideCount} readable balanced guides).\n`);
}
