#!/usr/bin/env node
/** W570 source gate — local NPC archetypes, spacing, readable faces and bounded motion. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_AMBIENT_NPC_ARCHETYPES,
  getEonCityAmbientNpcCrowdPlan,
  getEonCityNpcArchetypeTruth,
  validateEonCityAmbientNpcCrowdPlan
} from '../assets/js/city/eon-city-npc-archetypes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-npc-archetypes.js',
  'assets/js/city/eon-city-noir-npc-kit.js',
  'assets/js/city/eon-city-play-babylon.js',
  'tests/unit/w570-city-npc-archetypes.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);

export function inspectW570CityNpcArchetypes({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const source = read('assets/js/city/eon-city-npc-archetypes.js');
  const noirKit = read('assets/js/city/eon-city-noir-npc-kit.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const runner = read('scripts/run-current-unit-suite.mjs');
  const plans = ['lite', 'balanced', 'cinematic'].map((quality) => getEonCityAmbientNpcCrowdPlan({ quality }));
  const validation = plans.map((plan) => validateEonCityAmbientNpcCrowdPlan(plan));
  const truth = getEonCityNpcArchetypeTruth({ quality: 'balanced' });
  check('required-files-exist', required.every((relative) => existsSync(path.join(root, relative))), 'archetype contract, existing readable guide kit, scene integration, tests and suite registration exist');
  check('human-robot-alien-register', EON_CITY_AMBIENT_NPC_ARCHETYPES.map((entry) => entry.species).join(',') === 'human,robot,alien', 'three original ambient archetypes are explicit');
  check('quality-plans-validate', validation.every((entry) => entry.ok === true), 'Lite, balanced and cinematic crowd plans are valid');
  check('lite-has-no-ambient-crowd', plans[0].ambientCount === 0 && plans[0].readableFaces === false && plans[0].motionEnabled === false, 'Lite stays a real device fallback');
  check('rich-profiles-keep-spacing', plans.slice(1).every((plan) => plan.measuredMinSpacing >= plan.minSpacing && plan.readableFaces === true), 'balanced/cinematic crowd spacing keeps faces readable');
  check('truth-is-local-only', truth.originalProcedural === true && truth.binaryAssets === false && truth.remoteAssets === false && truth.remoteTelemetry === false && truth.userData === false, 'NPCs remain original local visuals with no data or telemetry');
  check('truth-rejects-interaction-and-autonomy', truth.interactive === false && truth.autonomous === false && truth.chatOrVoice === false && truth.socialMultiplayer === false, 'ambient NPCs do not chat, listen, route, act or imply multiplayer');
  check('existing-guides-retain-readable-face-construction', /eye-\$\{side\}/.test(noirKit) && /mouth-cue/.test(noirKit) && /readableFace/.test(noirKit), 'existing guide kit continues to provide readable procedural faces');
  check('scene-uses-ambient-plan', /getEonCityAmbientNpcCrowdPlan/.test(scene) && /addAmbientNpcCrowd/.test(scene) && /npcCrowdPlan/.test(scene), 'Babylon scene uses the source-controlled ambient crowd plan');
  check('motion-respects-pause-and-reduced-effects', /playPaused/.test(scene) && /playReducedEffects/.test(scene), 'ambient loop can halt under pause/reduced-effects protection');
  check('eonbot-remains-separate', /addEonbot/.test(scene) && /eonbotCompanion/.test(scene) && /kind: 'ambient-city-npc'/.test(scene), 'ambient roster is not presented as EONBOT');
  check('no-loader-network-or-storage-api', !/(?:SceneLoader|ImportMesh|AppendAsync|AssetsManager|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|Notification\.requestPermission|PushManager)/.test(source), 'archetype source has no loader, network, storage or permission side effect');
  check('no-commercial-or-private-surface', !/(?:subscription|checkout|purchase|payment|wallet|reward|loot|rarity|nft|accountId|projectId|prompt|vault|token|email)/i.test(source), 'archetype source has no commercial or private-work field');
  check('current-suite-registers-test', /w570-city-npc-archetypes\.test\.mjs/.test(runner), 'W570 test is in current certification suite');
  const failed = checks.filter((entry) => !entry.pass);
  const report = Object.freeze({
    schema: 'eonapp.w570.city-npc-archetypes-gate.v1',
    wave: 'W570',
    status: failed.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    failures: Object.freeze(failed.map((entry) => entry.id)),
    limitations: Object.freeze([
      'No GLB, facial capture, voice, network NPC, multiplayer service or final character-asset claim is added in W570.',
      'No browser screenshot, physical-device readability acceptance or animation performance benchmark is claimed.',
      'Ambient NPCs remain decorative local visual guides and do not represent real people, user activity, work status or autonomous agents.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'tmp');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'w570-city-npc-archetypes-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW570CityNpcArchetypes();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}
