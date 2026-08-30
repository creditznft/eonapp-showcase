import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectCityCoreBoundary, inspectCoreCityBoundary } from '../../scripts/lib/a15-source-authority.mjs';
import {
  EONBOT_JOB_FABRIC_SCHEMA,
  EONBOT_JOB_FABRIC_STORAGE_KEY,
  readEonbotJobFabricProjection
} from '../../assets/js/contracts/workflow/eonbot-job-fabric-projection.js';
import {
  createEonNexusCityProjectionAdapter,
  EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT,
  EON_NEXUS_CITY_PROJECTION_SCHEMA,
  readEonNexusCityContinuityProjection
} from '../../assets/js/contracts/nexus/eon-nexus-city-projection.js';
import { EON_PROJECTS_STORAGE_KEY as CONTRACT_PROJECTS_KEY } from '../../assets/js/contracts/projects/eon-project-store-contract.js';
import { EON_PROJECTS_STORAGE_KEY as IMPLEMENTATION_PROJECTS_KEY } from '../../assets/js/utils/eon-workspace-store.js';
import { EON_WORK_SURFACE_OPEN_EVENT as CONTRACT_OPEN_EVENT } from '../../assets/js/contracts/work-surface/eon-work-surface-registry.js';
import { EON_WORK_SURFACE_OPEN_EVENT as COMPAT_OPEN_EVENT } from '../../assets/js/work-surface/eon-work-surface-registry.js';
import { EON_SHARE_W753_RECEIPT_STORAGE_KEY as CONTRACT_SHARE_KEY } from '../../assets/js/contracts/share/eon-share-w753-reviewed-handoff-receipt.js';
import { EON_SHARE_W753_RECEIPT_STORAGE_KEY as COMPAT_SHARE_KEY } from '../../assets/js/share/eon-share-w753-reviewed-handoff-receipt.js';

function storageWith(value) {
  return { getItem(key) { return key === EONBOT_JOB_FABRIC_STORAGE_KEY ? JSON.stringify(value) : null; } };
}

test('A15 C02 leaves only versioned contracts across both static product boundaries', () => {
  const core = inspectCoreCityBoundary();
  const city = inspectCityCoreBoundary();
  assert.equal(core.coupledRouteCount, 0);
  assert.equal(core.distinctCityModuleCount, 0);
  assert.equal(city.nonCityImplementationModuleCount, 0);
  assert.equal(city.allowedContractModuleCount > 0, true);
  assert.deepEqual(city.unresolved, []);
});

test('job-fabric projection exposes bounded receipt fields and no private payload', () => {
  const projection = readEonbotJobFabricProjection({ storage: storageWith({
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    updatedAt: '2026-08-04T12:00:00.000Z',
    jobs: [{ jobId: 'eonjob_12345678', state: 'completed', surfaceId: 'forge', taskClass: 'website', safeLabel: 'Reviewed site', route: '/forge', capabilityMode: 'local', capabilityAvailable: true, receiptHash: 'sha256:abc', prompt: 'secret prompt', output: 'secret output' }],
    events: [{ eventId: 'eonjobevt_12345678', jobId: 'eonjob_12345678', type: 'completed', at: '2026-08-04T12:00:00.000Z', raw: 'private' }]
  }) });
  assert.equal(projection.jobs.length, 1);
  assert.equal(projection.jobs[0].jobId, 'eonjob_12345678');
  assert.equal('prompt' in projection.jobs[0], false);
  assert.equal('output' in projection.jobs[0], false);
  assert.equal('raw' in projection.events[0], false);
  assert.equal(projection.executionAuthority, false);
});

test('Nexus City projection uses an event response instead of importing Core implementation', () => {
  const environment = new EventTarget();
  environment.CustomEvent = class CustomEvent extends Event { constructor(type, options = {}) { super(type); this.detail = options.detail; } };
  environment.addEventListener(EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT, (event) => event.detail.respond({
    schema: EON_NEXUS_CITY_PROJECTION_SCHEMA,
    source: { schema: 'source', state: 'ready' },
    continuity: { schema: 'continuity', project: { selected: false } }
  }));
  const adapter = createEonNexusCityProjectionAdapter({ environment });
  const started = adapter.start();
  assert.equal(started.ok, true);
  assert.equal(adapter.getSnapshot().state, 'ready');
  assert.equal(readEonNexusCityContinuityProjection().schema, 'continuity');
  adapter.dispose();
});

test('compatibility facades resolve to the same contract constants', () => {
  assert.equal(CONTRACT_PROJECTS_KEY, IMPLEMENTATION_PROJECTS_KEY);
  assert.equal(CONTRACT_OPEN_EVENT, COMPAT_OPEN_EVENT);
  assert.equal(CONTRACT_SHARE_KEY, COMPAT_SHARE_KEY);
});
