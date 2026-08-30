import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EON_CREATE_MODES, validateEonCreateCatalog } from '../assets/js/create/eon-create-catalog.js';
import { getCreateContinuityTruth, prepareCreateDestinationHandoff, resolveCreateModeAvailability } from '../assets/js/create/eon-create-continuity-authority.js';
import { consumeEonHandoff } from '../assets/js/contracts/navigation/eon-handoff-authority.js';
import { EON_FORGE_QUICK_BUILD } from '../assets/js/forge/eon-forge-quick-build.js';
import { listProjectRegistryRecords } from '../assets/js/projects/eon-project-registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I14_CREATE_FORGE_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const catalog = validateEonCreateCatalog();
if (!catalog.ok) errors.push(...catalog.errors);
const status = Object.fromEntries(EON_CREATE_MODES.map((mode) => [mode.id, mode.status]));
const expectedStatus = { image: 'Setup required', video: 'Setup required', music: 'Create now', website: 'Create now', project: 'Create now', automation: 'Plan only', guide: 'Plan only' };
if (JSON.stringify(status) !== JSON.stringify(expectedStatus)) errors.push('Create mode status projection differs from the I14 launch truth.');
if (resolveCreateModeAvailability('image').availability !== 'setup-required' || resolveCreateModeAvailability('website').availability !== 'create-now' || resolveCreateModeAvailability('automation').availability !== 'plan-only') errors.push('Create availability authority does not preserve Setup/Create/Plan distinctions.');

const sessionStorage = new MemoryStorage();
const now = Date.parse('2026-08-05T01:10:00.000+05:30');
const handoff = await prepareCreateDestinationHandoff('website', { explicitUserAction: true, sessionStorage, now, cryptoApi: globalThis.crypto, handoffId: 'handoff_a15_i14_gate' });
let consumed = null;
if (!handoff.ok) errors.push(`Website continuity handoff failed: ${handoff.reason}`);
else {
  if (handoff.handoff.receiver?.id !== 'forge' || handoff.handoff.payload?.reviewBeforeApply !== true || handoff.handoff.payload?.universalProjectRegistry !== true || handoff.handoff.payload?.externalExecutionAuthority !== false) errors.push('Website continuity handoff is not review-only or Project-aware.');
  if (/prompt|credential|api.?key|media.?body/i.test(JSON.stringify(handoff.handoff))) errors.push('Website continuity handoff contains a sensitive work-body field.');
  consumed = await consumeEonHandoff(handoff.handoff.handoffId, { receiverId: 'forge', sessionStorage, now: now + 1, cryptoApi: globalThis.crypto });
  if (!consumed.ok) errors.push(`Forge did not consume the handoff: ${consumed.reason}`);
  const duplicate = await consumeEonHandoff(handoff.handoff.handoffId, { receiverId: 'forge', sessionStorage, now: now + 2, cryptoApi: globalThis.crypto });
  if (duplicate.reason !== 'handoff-already-consumed') errors.push('Website continuity handoff can be consumed more than once.');
}

const previousLocalStorage = globalThis.localStorage;
const previousSessionStorage = globalThis.sessionStorage;
const projectStorage = new MemoryStorage();
let projectSimulation = null;
try {
  globalThis.localStorage = projectStorage;
  globalThis.sessionStorage = new MemoryStorage();
  const project = EON_FORGE_QUICK_BUILD.buildProject({ title: 'A15 I14 Gate Website', brief: 'Build a reviewable local website with one clear action.', type: 'website', style: 'graphite' });
  const checks = EON_FORGE_QUICK_BUILD.runProjectChecks(project.files);
  const saved = EON_FORGE_QUICK_BUILD.saveProject(project);
  const records = listProjectRegistryRecords({ storage: projectStorage });
  projectSimulation = { projectId: project.id, sourceCheckErrors: checks.errors.length, saved, registryRecords: records.length, continueDestination: records[0]?.continueDestination || '' };
  if (checks.errors.length || !saved || records.length !== 1 || records[0]?.continueDestination !== 'forge' || !records[0]?.sources?.some((source) => source.namespace === 'forge' && source.relation === 'owner')) errors.push('Website starter did not complete Forge source, save and Universal Project continuity.');
} finally {
  if (previousLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousLocalStorage;
  if (previousSessionStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = previousSessionStorage;
}

const hubSource = read('assets/js/create/eon-create-hub.js');
const forgeSource = read('assets/js/forge/eon-forge-quick-build.js');
const controllerSource = read('assets/js/forge/forge-ai-controller.js');
if (!/prepareCreateDestinationHandoff/.test(hubSource) || !/data-eon-create-availability/.test(hubSource) || /writeEonHandoff\s*\(/.test(hubSource)) errors.push('Create bypasses the I14 continuity authority.');
if (!/wait for your approval before applying anything/i.test(forgeSource) || !/data-eon-forge-ai-apply/.test(forgeSource) || !/AI output is reviewed before Apply/i.test(forgeSource)) errors.push('Forge no longer preserves review-before-Apply.');
if (!/No GitHub, hosting, backend, or deployment starts here/i.test(forgeSource) || /autoApply\s*:\s*true/.test(forgeSource)) errors.push('Forge overstates or automatically performs external delivery.');
if (!/runForgeAiRequest/.test(controllerSource) || !/proposal/.test(controllerSource)) errors.push('Forge AI controller no longer returns a reviewable proposal.');

const truth = getCreateContinuityTruth();
if (truth.websiteMode !== 'create-now' || truth.imageDefault !== 'setup-required' || truth.videoDefault !== 'setup-required' || truth.automationLaunchMode !== 'plan-only' || truth.hiddenGenerationFallback || truth.navigationStartsGeneration || truth.navigationStartsDeployment || truth.navigationStartsPublishing) errors.push('Create continuity truth is weaker than I14.');

const core = {
  schema: 'eonapp.a15.i14.create-forge-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I14',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  modeStatus: status,
  simulations: {
    websiteHandoff: handoff.ok ? { href: handoff.href, payloadDigest: handoff.handoff.payloadDigest, receiptId: consumed?.receipt?.receiptId || '' } : { error: handoff.reason },
    project: projectSimulation
  },
  sourceFiles: [
    'assets/js/create/eon-create-continuity-authority.js',
    'assets/js/create/eon-create-catalog.js',
    'assets/js/create/eon-create-hub.js',
    'assets/js/forge/eon-forge-quick-build.js',
    'assets/js/forge/forge-ai-controller.js',
    'assets/js/projects/eon-project-registry.js',
    'tests/unit/a15-i14-create-forge-continuity.test.mjs'
  ],
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I14] ${receipt.status.toUpperCase()}: website Create→Forge→Project continuity and truthful media gating verified.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I14] ${error}`);
  process.exitCode = 1;
}
