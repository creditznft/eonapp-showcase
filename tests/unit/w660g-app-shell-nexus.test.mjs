import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_NEXUS_APP_SHELL_EXCLUDED_PAGES,
  getEonNexusAppShellTruth,
  shouldInstallEonNexusAppShell
} from '../../assets/js/nexus/eon-nexus-app-shell.js';

function documentFor(page, shell = true) {
  return { body: { dataset: { eonAppShell: shell ? '1' : '0', eonAppPage: page } } };
}

test('W759 keeps the current single shell, Quick Command and maintained Living Nexus without a retired installer', () => {
  const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
  const shell = read('assets/js/eon-app-shell.js');
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const city = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  assert.match(shell, /installEonWorkSurfaceHost/);
  assert.match(shell, /installEonQuickCommandSurface/);
  assert.doesNotMatch(shell, /eon-nexus-app-shell|scheduleEonNexusAppShell|eon-nexus-chat-pulse|installDeferredEonNexusPulse/);
  assert.match(registry, /id: 'nexus', label: 'Living Nexus'/);
  assert.match(city, /id: 'eonbot-nexus'[\s\S]*?kind: 'nexus'/);
});

test('W660G mounts the lightweight Nexus across application-shell product routes', () => {
  for (const page of ['forge', 'projects', 'workspace', 'local-ai', 'library', 'automations', 'vault', 'settings', 'create', 'profile']) {
    assert.equal(shouldInstallEonNexusAppShell({ page, document: documentFor(page) }), true, page);
  }
});

test('W660G prevents duplicate 2D Nexus surfaces on Chat and EONCITY', () => {
  assert.deepEqual(EON_NEXUS_APP_SHELL_EXCLUDED_PAGES, ['chat', 'eoncity']);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'chat', document: documentFor('chat') }), false);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'eoncity', document: documentFor('eoncity') }), false);
});

test('W660G stays outside non-application marketing and legal shells', () => {
  assert.equal(shouldInstallEonNexusAppShell({ page: 'billing', document: documentFor('billing', false) }), false);
  assert.equal(shouldInstallEonNexusAppShell({ page: 'privacy', document: documentFor('privacy', false) }), false);
});

test('W660G truth contract preserves one assistant and explicit user actions', () => {
  const truth = getEonNexusAppShellTruth();
  assert.equal(truth.applicationShellVisible, true);
  assert.equal(truth.samePrivacyProjectedAdapter, true);
  assert.equal(truth.chatUsesDedicatedBridge, true);
  assert.equal(truth.cityUsesBabylonHolograms, true);
  assert.equal(truth.secondConversationStore, false);
  assert.equal(truth.secondProjectStore, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.startsVoiceCapture, false);
  assert.equal(truth.autoNavigation, false);
  assert.equal(truth.autoApproval, false);
  assert.equal(truth.lazyLiveNexus, true);
});
