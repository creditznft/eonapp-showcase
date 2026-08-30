import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';
import { buildEonCityR10DeviceMatrix, validateEonCityR10DeviceMatrix } from '../assets/js/city/r10/eon-city-r10-device-matrix.js';
import { evaluateEonCityR11RuntimeGate } from '../assets/js/city/r11/eon-city-r11-runtime-gate.js';
import { buildEonExpanseR06WorldAtlas, deriveEonExpanseR06FirstMinuteGuide } from '../assets/js/city/r06/eon-expanse-r06-flagship-experience.js';
import { deriveEonCityR08Locomotion, isEonCityR08SprintKeyboardCode } from '../assets/js/city/r08/eon-city-r08-locomotion.js';
import { deriveEonCityR08MyFrontierEntry, deriveEonCityR08MyFrontierUnlockReceipt } from '../assets/js/city/r08/eon-city-r08-my-frontier-access.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = (value) => Object.freeze(value);
const runGit = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const errors = [];
const evidence = {};

const remoteProductionBaseline = 'c807b31c0d3d5a7be9d691756b296fadf82abe74';
const localReconstructionBaseline = '7e41b66';
const gitObjectExists = (ref) => {
  try { runGit('rev-parse', '--verify', `${ref}^{commit}`); return true; } catch { return false; }
};
const requestedBaseline = String(process.env.EONCITY_R11_BASELINE || '').trim();
const baseline = requestedBaseline && gitObjectExists(requestedBaseline)
  ? requestedBaseline
  : gitObjectExists(localReconstructionBaseline)
    ? localReconstructionBaseline
    : remoteProductionBaseline;
const head = runGit('rev-parse', 'HEAD');
const status = runGit('status', '--porcelain');
const localHistoryAvailable = gitObjectExists(localReconstructionBaseline);
const subjects = runGit('log', '--format=%s', `${baseline}..HEAD`).split(/\r?\n/).filter(Boolean);
const requiredSubjects = [
  'R00: freeze owner gameplay acceptance failure',
  'R01: converge Command Hub spatial ownership',
  'R02: add container-driven viewport composition',
  'R03: converge City blocking surface ownership',
  'R04: unify City interaction and label resolution',
  'R05: make Open Worlds flagship City navigation',
  'R06: make Signal Frontier readable and spatial',
  'R07: separate Storm certification from player progression',
  'R08: add intentional sprint and early My Frontier travel',
  'R09: retain release shell and decoded Open World assets',
  'R10: harden responsive City surfaces and portrait play'
];
let checkpointEvidenceMode = 'local-checkpoint-history';
let checkpointsPresent = requiredSubjects.every((subject) => subjects.includes(subject));
let r00Freeze = null;
if (localHistoryAvailable) {
  for (const subject of requiredSubjects) if (!subjects.includes(subject)) errors.push(`missing-checkpoint:${subject}`);
} else {
  checkpointEvidenceMode = 'remote-atomic-tree';
  try {
    r00Freeze = JSON.parse(read('config/eoncity-r00-owner-playthrough-failure.json'));
  } catch { errors.push('remote-atomic:r00-freeze-unreadable'); }
  const remoteFreezeValid = r00Freeze?.schema === 'eon.city.r00.owner-playthrough-failure-freeze.v1'
    && r00Freeze?.remoteAuthority === remoteProductionBaseline
    && r00Freeze?.humanAcceptance === 'no-go'
    && r00Freeze?.prMustRemainDraft === true
    && Array.isArray(r00Freeze?.waves)
    && ['R01','R02','R03','R04','R05','R06','R07','R08','R09','R10','R11'].every((wave) => r00Freeze.waves.includes(wave));
  if (!remoteFreezeValid) errors.push('remote-atomic:r00-freeze-invalid');
  checkpointsPresent = remoteFreezeValid;
}
try { runGit('merge-base', '--is-ancestor', baseline, 'HEAD'); } catch { errors.push('baseline-not-ancestor'); }

evidence.history = freeze({
  baseline,
  head,
  mode: checkpointEvidenceMode,
  checkpointCount: requiredSubjects.length,
  checkpointsPresent,
  localHistoryAvailable,
  remoteAtomicR00FreezeValid: checkpointEvidenceMode === 'remote-atomic-tree' ? checkpointsPresent : null
});

const spatial = validateEonCityW747SpatialFoundation();
if (!spatial.ok) errors.push(...spatial.errors.map((error) => `w747-source:${error}`));
evidence.spatialSource = spatial;

const device = validateEonCityR10DeviceMatrix(buildEonCityR10DeviceMatrix());
if (!device.ok) errors.push(...device.errors.map((error) => `r10-device:${error}`));
evidence.deviceMatrix = freeze({ ok: device.ok, viewportCount: device.viewportCount, errors: device.errors });

const cleanRuntimeGate = evaluateEonCityR11RuntimeGate({
  spatialReport: { ok: true },
  surfaceSnapshot: { openBlockingCount: 1 },
  viewportProfile: { id: 'mobile-portrait', mobile: true, labelBudget: 1 },
  firstPlayableFrame: true
});
const dirtyRuntimeGate = evaluateEonCityR11RuntimeGate({
  spatialReport: { ok: false },
  surfaceSnapshot: { openBlockingCount: 2 },
  viewportProfile: { id: 'mobile-portrait', mobile: true, labelBudget: 2 },
  firstPlayableFrame: true
});
if (!cleanRuntimeGate.ok) errors.push('r11-clean-runtime-simulation-failed');
if (dirtyRuntimeGate.ok || !dirtyRuntimeGate.failures.includes('spatial-diagnostics')) errors.push('r11-dirty-runtime-did-not-fail');
evidence.runtimeGateContract = freeze({ cleanSimulation: cleanRuntimeGate, dirtySimulation: dirtyRuntimeGate });

const atlas = buildEonExpanseR06WorldAtlas();
const firstMinute = deriveEonExpanseR06FirstMinuteGuide();
if (atlas.nodes.length !== 5 || atlas.routes.length !== 4 || atlas.spatialMap !== true) errors.push('r06-atlas-contract');
if (!/Restore the first Signal/i.test(firstMinute.title)) errors.push('r06-first-minute-contract');
evidence.signalFrontier = freeze({ atlasNodes: atlas.nodes.length, atlasRoutes: atlas.routes.length, firstMinuteTitle: firstMinute.title });

const travel = deriveEonCityR08Locomotion({ moving: true, sprintRequested: false, expanseActive: true });
const sprint = deriveEonCityR08Locomotion({ moving: true, sprintRequested: true, expanseActive: true });
if (travel.diagonalSpeedBoost !== false || sprint.speed <= travel.speed || !isEonCityR08SprintKeyboardCode('ShiftLeft')) errors.push('r08-locomotion-contract');
const ledger = { missions: { 'first-light': { completedObjectives: ['repair-beacon-one'] } } };
const unlock = deriveEonCityR08MyFrontierUnlockReceipt(ledger);
const entry = deriveEonCityR08MyFrontierEntry({ unlocked: Boolean(unlock) });
if (!unlock || unlock.grantsXp || unlock.grantsConstructionPermit || !entry.directWorldEntry) errors.push('r08-my-frontier-contract');
evidence.locomotionAndFrontier = freeze({ travelSpeed: travel.speed, sprintSpeed: sprint.speed, myFrontierUnlocked: Boolean(unlock), grantsXp: unlock?.grantsXp ?? null, grantsConstructionPermit: unlock?.grantsConstructionPermit ?? null });

const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const serviceWorker = read('service-worker/eonapp-service-worker.js');
const r07 = read('assets/js/city/r07/eon-city-r07-open-world-availability.js');
const r03 = read('assets/js/city/r03/eon-city-r03-surface-manager.js');
const r04 = read('assets/js/city/r04/eon-city-r04-interaction-resolver.js');
const r09 = read('assets/js/city/r09/eon-city-r09-cache-retention.js');
const station = read('assets/js/eon-city-play-station.js');
const gateway = read('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');

const sourceAssertions = [
  ['hud-explore', runtime.includes("makeLauncher('Explore'")],
  ['hud-menu', runtime.includes("makeLauncher('Menu'")],
  ['spatial-blocking-log', runtime.includes('[W747_SPATIAL_DIAGNOSTICS_BLOCKING]')],
  ['owner-runtime-gate', runtime.includes('publishEonCityR11RuntimeGate')],
  ['surface-authority', r03.includes('maximumBlockingSurfaces') || r03.includes('openBlockingCount')],
  ['interaction-parent-resolution', /parent|ancestor|semantic/i.test(r04)],
  ['storm-no-signal-prerequisite', r07.includes('requiresSignalCampaignCompletion: false') && r07.includes('directEntryAllowed: Boolean(activation)')],
  ['release-shell-cache', serviceWorker.includes('eonapp-city-shell-')],
  ['manifest-retention', r09.includes('protected') && /manifest/i.test(r09)],
  ['portrait-canonical-babylon', station.includes('R10: every eligible direct entry starts the one canonical Babylon City.') && station.includes("entryMode: 'direct'")],
  ['expanse-suspend-retain', /suspend|retained|retain/i.test(gateway)]
];
for (const [id, ok] of sourceAssertions) if (!ok) errors.push(`source-assertion:${id}`);
evidence.sourceAssertions = freeze(Object.fromEntries(sourceAssertions));

// A dirty worktree is allowed while this script itself is being developed, but
// final packaging must call the gate after committing R11. Record it explicitly.
evidence.workingTree = freeze({ clean: status.length === 0, porcelain: status ? status.split(/\r?\n/) : [] });

const receipt = freeze({
  schema: 'eonapp.eoncity.owner-candidate-source-gate.r11.v1',
  generatedAt: new Date().toISOString(),
  authority: freeze({
    remoteProductionBaseline,
    localReconstructionBaseline: gitObjectExists(localReconstructionBaseline) ? runGit('rev-parse', localReconstructionBaseline) : null,
    historyBaseline: runGit('rev-parse', baseline),
    localHead: head,
    branch: runGit('branch', '--show-current')
  }),
  localSourceReady: errors.length === 0,
  browserOwnerReady: false,
  ownerGameplayAccepted: false,
  productionAuthorized: false,
  scoreClaimed: false,
  errors: freeze(errors),
  evidence: freeze(evidence),
  requiredExternalGates: freeze([
    'dependency-backed Node 22 install/build/lint/predeploy',
    'headed-browser loaded-scene W747 report ok:true',
    'headed-browser R11 owner runtime gate pass',
    'cross-browser 11-viewport responsive/touch proof',
    'second-entry zero immutable-world-binary network transfer proof',
    'Hub↔Signal/Storm decoded-world resume proof',
    'owner gameplay video acceptance',
    'zero P0/P1; every category >=9.0; overall >=9.5'
  ])
});

const writeArg = process.argv.find((arg) => arg.startsWith('--write-receipt='));
if (writeArg) {
  const target = path.resolve(root, writeArg.slice('--write-receipt='.length));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(receipt, null, 2)}\n`);
}
console.log(JSON.stringify(receipt, null, 2));
if (!receipt.localSourceReady) process.exitCode = 1;
