import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_WORK_SURFACE_ADAPTER_LOADERS,
  hasEonWorkSurfaceAdapterLoader,
  loadEonWorkSurfaceAdapter
} from '../../assets/js/work-surface/eon-work-surface-host.js';
import { listEonWorkSurfaceDefinitions } from '../../assets/js/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W736A makes Quick Command the sole persistent frontend command launcher', () => {
  const chatDeferred = read('assets/js/chat-page-deferred.js');
  const compatibility = read('assets/js/nexus/eon-nexus-page-bootstrap.js');
  const cityContract = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  assert.doesNotMatch(chatDeferred, /eon-nexus-chat-pulse|installEonNexusChatPulse|installDeferredEonNexusPulse/);
  assert.match(chatDeferred, /Quick Command is the sole persistent frontend launcher/);
  assert.doesNotMatch(compatibility, /installEonNexusAppShell|eon-nexus-app-shell/);
  assert.match(compatibility, /retired-by-w724-quick-command/);
  assert.match(cityContract, /eonbot-nexus/);
});

test('W736A removes retired frontend Nexus query navigation from Projects', () => {
  const projects = read('assets/js/projects/w704/eon-projects-w704-command-workspace.js');
  assert.doesNotMatch(projects, /\/?\?nexus=atlas/);
  assert.match(projects, /Open Project Atlas/);
  assert.match(projects, /\/projects\?view=atlas/);
});

test('W736A provides one literal Vite loader for every registered work-surface adapter', async () => {
  const definitions = listEonWorkSurfaceDefinitions();
  const registered = [...new Set(definitions.map((definition) => definition.adapter))].sort();
  const loaders = Object.keys(EON_WORK_SURFACE_ADAPTER_LOADERS).sort();
  assert.deepEqual(loaders, registered);
  for (const path of registered) {
    assert.equal(hasEonWorkSurfaceAdapterLoader(path), true, path);
    const module = await loadEonWorkSurfaceAdapter(path);
    assert.equal(typeof (module.mountEonWorkSurface || module.default), 'function', path);
  }
  const unknown = '/assets/js/work-surface/adapters/unknown.js';
  assert.equal(hasEonWorkSurfaceAdapterLoader(unknown), false);
  await assert.rejects(() => loadEonWorkSurfaceAdapter(unknown), /work-surface-adapter-not-registered/);
});

test('W736A production sync and build require the shared work-surface stylesheet', () => {
  const sync = read('scripts/sync-public-assets.mjs');
  const build = read('scripts/build-production.mjs');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  assert.match(sync, /assets\/css\/eon-work-surface\.css/);
  assert.match(build, /eon-work-surface\.css/);
  assert.match(build, /selector:\s*'\.eon-work-surface'/);
  assert.match(host, /release=w752-2026-07-29/);
  assert.doesNotMatch(host, /await import\(invocation\.definition\.adapter\)/);
});
