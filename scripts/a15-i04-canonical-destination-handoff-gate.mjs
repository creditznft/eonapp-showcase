#!/usr/bin/env node
import { createHash, webcrypto } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { A15_REPOSITORY_ROOT, inspectCityCoreBoundary, inspectCoreCityBoundary } from './lib/a15-source-authority.mjs';
import {
  EON_DESTINATIONS,
  buildEonDestinationHref,
  validateEonDestinationRegistry
} from '../assets/js/contracts/navigation/eon-destination-registry.js';
import {
  consumeEonHandoff,
  inspectEonHandoffStore,
  prepareEonHandoff,
  writeEonHandoff
} from '../assets/js/contracts/navigation/eon-handoff-authority.js';

const ROOT = A15_REPOSITORY_ROOT;
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const memoryStorage = () => {
  const map = new Map();
  return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
};

const validation = validateEonDestinationRegistry();
const storage = memoryStorage();
const handoffInput = {
  senderId: 'create', receiverId: 'projects', kind: 'create-mode', referenceId: 'project', safeLabel: 'Start a project',
  payload: { modeId: 'project', rail: 'local-runtime' }, handoffId: 'handoff_a15_i04_gate'
};
const explicitFailure = await prepareEonHandoff(handoffInput, { cryptoApi: webcrypto, now: 1_000 });
const written = await writeEonHandoff(handoffInput, { explicitUserAction: true, cryptoApi: webcrypto, sessionStorage: storage, now: 1_000 });
const mismatch = await consumeEonHandoff(handoffInput.handoffId, { receiverId: 'forge', cryptoApi: webcrypto, sessionStorage: storage, now: 2_000 });
const consumed = await consumeEonHandoff(handoffInput.handoffId, { receiverId: 'projects', cryptoApi: webcrypto, sessionStorage: storage, now: 2_000 });
const duplicate = await consumeEonHandoff(handoffInput.handoffId, { receiverId: 'projects', cryptoApi: webcrypto, sessionStorage: storage, now: 3_000 });
const staleStorage = memoryStorage();
await writeEonHandoff({ ...handoffInput, handoffId: 'handoff_a15_i04_stale', ttlMs: 60_000 }, { explicitUserAction: true, cryptoApi: webcrypto, sessionStorage: staleStorage, now: 1_000 });
const stale = await consumeEonHandoff('handoff_a15_i04_stale', { receiverId: 'projects', cryptoApi: webcrypto, sessionStorage: staleStorage, now: 61_001 });

const sources = {
  create: read('assets/js/create/eon-create-hub.js'),
  projects: read('assets/js/projects/eon-projects-page.js'),
  creator: read('assets/js/create/creator-project-integration.js'),
  forge: read('assets/js/forge/eon-forge-quick-build.js'),
  support: read('assets/js/support-page.js'),
  home: read('assets/js/eonbot-home.js'),
  continueResolver: read('assets/js/retention/eon-continue-resolver.js'),
  continueSurface: read('assets/js/retention/eon-continue-surface.js'),
  atlas: read('assets/js/nexus/w705/eon-nexus-w705-atlas-entry.js'),
  catalogue: read('assets/js/create/eon-create-catalog.js')
};
const coreBoundary = inspectCoreCityBoundary();
const cityBoundary = inspectCityCoreBoundary();
const errors = [
  ...(!validation.ok ? validation.errors : []),
  // A15's current registry includes the explicit EONCITY destination in
  // addition to the original Core destinations. Keep the count check as a
  // release-source guard without rejecting that maintained route authority.
  ...(EON_DESTINATIONS.length !== 18 ? [`Expected 18 canonical destinations, observed ${EON_DESTINATIONS.length}.`] : []),
  ...(buildEonDestinationHref('projects', { project: 'p1', external: 'drop' }) !== '/projects?project=p1' ? ['Destination query allowlist failed.'] : []),
  ...(explicitFailure.reason !== 'explicit-user-action-required' ? ['Handoff preparation did not require explicit user action.'] : []),
  ...(!written.ok || written.href !== '/projects?handoff=handoff_a15_i04_gate' ? ['Create to Projects handoff was not written canonically.'] : []),
  ...(mismatch.reason !== 'handoff-receiver-mismatch' ? ['Receiver mismatch was not rejected.'] : []),
  ...(!consumed.ok || consumed.receipt?.outcomeVerified !== false || consumed.receipt?.externalExecutionAuthority !== false ? ['Consumed handoff receipt overclaimed outcome or execution.'] : []),
  ...(duplicate.reason !== 'handoff-already-consumed' ? ['Duplicate handoff consumption was not rejected.'] : []),
  ...(stale.reason !== 'handoff-expired' ? ['Stale handoff was not rejected.'] : []),
  ...(!/prepareCreateDestinationHandoff/.test(sources.create) || !/findEonDestinationByRoute/.test(sources.create) ? ['Create does not prepare canonical route handoffs through the maintained continuity authority.'] : []),
  ...(!/receiverId: 'projects'/.test(sources.projects) ? ['Projects does not consume canonical handoffs.'] : []),
  ...(!/kind: 'creator-asset-reference'/.test(sources.creator) || !/rawPromptIncluded: false/.test(sources.creator) || !/mediaBodyIncluded: false/.test(sources.creator) ? ['Creator handoff is missing redacted-reference boundaries.'] : []),
  ...(!/receiverId: 'forge'/.test(sources.forge) || !/Nothing was applied automatically/.test(sources.forge) ? ['Forge does not consume Creator references review-first.'] : []),
  ...(!/kind: 'support-prefill'/.test(sources.support) || /eon:support:prefill:v1/.test(sources.support) ? ['Support still uses a non-canonical prefill authority.'] : []),
  ...(!/receiverId: 'home'/.test(sources.home) || !/supportPromptFromHandoff/.test(sources.home) ? ['EONBOT home does not consume support handoffs.'] : []),
  ...(!/buildEonDestinationHref/.test(sources.continueResolver) || !/eonContinueDestination/.test(sources.continueSurface) ? ['Continue is not destination-registry derived.'] : []),
  ...(!/buildEonDestinationHref/.test(sources.atlas) || !/buildEonDestinationHref/.test(sources.catalogue) ? ['Atlas or Create catalogue still owns fixed routes independently.'] : []),
  ...(coreBoundary.coupledRouteCount ? ['I04 regressed Core-to-City isolation.'] : []),
  ...(cityBoundary.nonCityImplementationModuleCount ? ['I04 regressed City-to-Core isolation.'] : [])
];
const sourceDigests = Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, digest(value)]));
const receiptCore = {
  schema: 'eonapp.a15.i04.canonical-destination-handoff-receipt.v1',
  wave: 'I04',
  status: errors.length ? 'fail' : 'pass',
  destinationAuthority: { schema: 'eonapp.destination-registry.a15.v1', destinationCount: EON_DESTINATIONS.length, ids: EON_DESTINATIONS.map((row) => row.id) },
  handoffAuthority: {
    schema: 'eonapp.handoff.a15.v1', explicitUserActionRequired: true, expiring: true, singleConsume: true,
    receiverBound: true, digestVerified: true, sessionOnly: true, noSilentEviction: true, outcomeVerifiedByHandoff: false,
    activeAfterConsumption: inspectEonHandoffStore({ sessionStorage: storage }).activeCount
  },
  integratedJourneys: {
    createToProjects: written.ok && consumed.ok,
    creatorToForge: /kind: 'creator-asset-reference'/.test(sources.creator) && /receiverId: 'forge'/.test(sources.forge),
    supportToEonbot: /kind: 'support-prefill'/.test(sources.support) && /supportPromptFromHandoff/.test(sources.home),
    atlasCentralized: /buildEonDestinationHref/.test(sources.atlas),
    continueCentralized: /buildEonDestinationHref/.test(sources.continueResolver)
  },
  boundaries: { coreCoupledRouteCount: coreBoundary.coupledRouteCount, cityCoreImplementationModuleCount: cityBoundary.nonCityImplementationModuleCount },
  sourceDigests,
  errors
};
const receipt = { ...receiptCore, digest: digest(JSON.stringify(receiptCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I04_CANONICAL_DESTINATION_HANDOFF_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I04] ${receipt.status.toUpperCase()}: ${receipt.destinationAuthority.destinationCount} destinations; Create→Projects=${receipt.integratedJourneys.createToProjects}; Creator→Forge=${receipt.integratedJourneys.creatorToForge}.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I04] ${error}`);
  process.exitCode = 1;
}
