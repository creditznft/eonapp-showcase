import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createDefaultEonNexusState,
  getEonNexusStateContractTruth
} from '../assets/js/nexus/eon-nexus-state-contract.js';
import {
  buildEonNexusPrivacyProjectedState,
  getEonNexusPrivacyProjectionTruth
} from '../assets/js/nexus/eon-nexus-privacy-projection.js';
import { getEonNexusEventAdapterTruth } from '../assets/js/nexus/eon-nexus-event-adapter.js';
import { getEonNexusCapability, getEonNexusCapabilityTruth } from '../assets/js/nexus/eon-nexus-capability.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/nexus/eon-nexus-state-contract.js',
  'assets/js/nexus/eon-nexus-privacy-projection.js',
  'assets/js/nexus/eon-nexus-event-adapter.js',
  'assets/js/nexus/eon-nexus-capability.js',
  'tests/unit/w660-nexus-state-contract.test.mjs',
  'tests/unit/w660-nexus-privacy-projection.test.mjs',
  'tests/unit/w660-nexus-event-adapter.test.mjs',
  'docs/W660A1_EON_NEXUS_STATE_SOURCE_INVENTORY_2026-07-19.md'
]);

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function inspectW660A2EonNexusState() {
  const checks = [];
  for (const relative of required) {
    checks.push({ id: `required:${relative}`, pass: fs.existsSync(path.join(root, relative)) });
  }

  const nexusSources = required.filter((relative) => relative.startsWith('assets/js/nexus/')).map(read).join('\n');
  const actualBabylonDependency = /(?:\bfrom\s+['"][^'"]*babylon|\bimport\s*\([^)]*babylon|\bBABYLON\s*\.)/i;
  checks.push({ id: 'no-babylon-import', pass: !actualBabylonDependency.test(nexusSources) });
  checks.push({ id: 'no-glb-dependency', pass: !/['"][^'"]*\.glb(?:[?#][^'"]*)?['"]/i.test(nexusSources) });
  checks.push({ id: 'no-provider-key-reader', pass: !/\bgetApiKey\b/.test(nexusSources) });
  checks.push({ id: 'no-render-loop', pass: !/requestAnimationFrame|setInterval\s*\(/.test(nexusSources) });
  checks.push({ id: 'no-fake-percentage', pass: !/progressPercent|fakePercent|percentComplete/.test(nexusSources) });

  const contractTruth = getEonNexusStateContractTruth();
  const privacyTruth = getEonNexusPrivacyProjectionTruth();
  const adapterTruth = getEonNexusEventAdapterTruth();
  const capabilityTruth = getEonNexusCapabilityTruth();
  checks.push({ id: 'contract-does-not-own-runtime', pass: contractTruth.ownsConversation === false && contractTruth.ownsTaskRuntime === false && contractTruth.ownsApprovalExecution === false });
  checks.push({ id: 'privacy-redacts-raw-content', pass: privacyTruth.rawChatText === false && privacyTruth.rawProjectSummary === false && privacyTruth.providerCredential === false });
  checks.push({ id: 'adapter-has-no-effects', pass: adapterTruth.startsAiWork === false && adapterTruth.callsProvider === false && adapterTruth.runsAutomation === false && adapterTruth.controlsCity === false });
  checks.push({ id: 'capability-does-not-render', pass: capabilityTruth.createsRenderingContext === false && capabilityTruth.startsAnimation === false });

  const defaultState = createDefaultEonNexusState({ now: Date.parse('2026-07-19T12:00:00.000Z') });
  checks.push({ id: 'default-state-immutable', pass: Object.isFrozen(defaultState) && Object.isFrozen(defaultState.eonbot) });
  checks.push({ id: 'default-state-idle', pass: defaultState.eonbot.state === 'ready' && defaultState.nodes.length === 0 && defaultState.approval.pending === false });

  const projected = buildEonNexusPrivacyProjectedState({
    thread: { id: 'chat_gate', title: 'Private title', messages: [{ role: 'user', text: 'private-body' }] },
    activeProjectContext: { projectId: 'project_gate', projectTitle: 'Private project', route: '/projects' },
    project: { id: 'project_gate', title: 'Private project', summary: 'private-summary' },
    readiness: { ready: true, providerId: 'ollama', providerLabel: 'Ollama', runtimeType: 'local', apiKey: 'should-not-appear' },
    now: Date.parse('2026-07-19T12:00:00.000Z')
  });
  const serialized = JSON.stringify(projected);
  checks.push({ id: 'projected-labels-redacted', pass: projected.conversation.label === 'Private conversation' && projected.project.label === 'Active project' });
  checks.push({ id: 'projected-payload-excludes-private-input', pass: !/Private title|Private project|private-summary|private-body|should-not-appear/.test(serialized) });
  checks.push({ id: 'verified-local-route-shield', pass: projected.route.mode === 'local' && projected.route.privateOnDevice === true });

  const capability = getEonNexusCapability({ environment: {}, reducedMotion: true });
  checks.push({ id: 'static-fallback', pass: capability.recommendedMode === 'static' && capability.staticFallbackAvailable === true && capability.requiresBabylon === false });

  return Object.freeze({
    wave: 'W660A2',
    scope: 'eon-nexus-observable-state',
    ok: checks.every((entry) => entry.pass),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length,
    checks: Object.freeze(checks.map(Object.freeze)),
    claims: Object.freeze({
      pulseImplemented: false,
      liveNexusImplemented: false,
      atlasImplemented: false,
      cityHologramImplemented: false,
      externalExecution: false
    })
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = inspectW660A2EonNexusState();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}
