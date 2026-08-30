import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusAppShellTruth,
  getEonNexusPageContext,
  projectEonNexusPageSnapshot
} from '../../assets/js/nexus/eon-nexus-app-shell.js';
import { getEonNexusPulseViewModel, getEonNexusPulseTruth } from '../../assets/js/nexus/eon-nexus-pulse.js';
import { getEonNexusLiveViewModel } from '../../assets/js/nexus/eon-nexus-live.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

function snapshot() {
  return {
    eonbot: { state: 'ready', statusLabel: 'Ready', canListen: false },
    task: { stageLabel: 'Request', state: 'ready', cancellable: false },
    route: { providerLabel: 'Guide mode', privateOnDevice: false, mode: 'guide' },
    approval: { pending: false, count: 0, reviewRoute: '/workspace' },
    results: { count: 0, label: 'No results', openRoute: '/workspace' },
    project: { selected: true, label: 'Active project', openRoute: '/projects' },
    conversation: { openRoute: '/' },
    connection: { state: 'available', label: 'Ready' },
    nodes: [
      { id: 'role:projects', kind: 'projects', label: 'Projects', status: 'selected', count: 1, providerKind: 'guide', updatedAt: '2026-07-19T00:00:00.000Z' },
      { id: 'role:forge', kind: 'forge', label: 'Forge', status: 'active', count: 1, providerKind: 'guide', updatedAt: '2026-07-19T00:01:00.000Z' },
      { id: 'role:local-ai', kind: 'local-ai', label: 'Local AI', status: 'available', count: 0, providerKind: 'local', updatedAt: '2026-07-19T00:02:00.000Z' }
    ],
    atlas: { selected: true, incompleteCount: 1 }
  };
}

test('W660H defines a custom Nexus context for every primary product shell', () => {
  for (const page of ['forge', 'projects', 'workspace', 'local-ai', 'library', 'automations', 'vault', 'settings', 'create', 'profile']) {
    const context = getEonNexusPageContext(page);
    assert.equal(context.id, page);
    assert.ok(context.label.length > 1);
    assert.ok(context.route.startsWith('/'));
    assert.ok(context.summary.length > 30);
  }
  assert.equal(EON_NEXUS_PAGE_CONTEXTS.forge.nodeKind, 'forge');
  assert.equal(EON_NEXUS_PAGE_CONTEXTS['local-ai'].nodeKind, 'local-ai');
  assert.equal(EON_NEXUS_PAGE_CONTEXTS.settings.nodeKind, 'settings');
});

test('W660H page projection focuses the relevant real adapter without exposing raw stores', () => {
  const projected = projectEonNexusPageSnapshot(snapshot(), getEonNexusPageContext('forge'));
  assert.equal(projected.surface.label, 'Forge');
  assert.equal(projected.surface.focusNodeId, 'role:forge');
  assert.equal(projected.nodes[0].id, 'role:forge');
  assert.match(projected.surface.statusLabel, /Active/);
  assert.match(projected.surface.summary, /request and planning/i);
  assert.equal(Object.hasOwn(projected.surface, 'rawStore'), false);
});

test('W660H Pulse and Live Nexus display page-specific identity and focused data', () => {
  const projected = projectEonNexusPageSnapshot(snapshot(), getEonNexusPageContext('forge'));
  const pulse = getEonNexusPulseViewModel(projected);
  const live = getEonNexusLiveViewModel(projected);
  assert.equal(pulse.title, 'Forge Nexus · Ready');
  assert.equal(pulse.kicker, 'EON NEXUS · Forge');
  assert.match(pulse.summary, /Current signal: Active/);
  assert.equal(live.title, 'Forge Nexus · Ready');
  assert.equal(live.kicker, 'EON NEXUS · Forge');
  assert.equal(live.selectedNode.id, 'role:forge');
});

test('W660H shell separates fixed account dock from scrollable navigation', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const css = read('assets/css/eon-app-shell.css');
  assert.match(shell, /eon-app-sidebar-scroll/);
  assert.match(shell, /eon-app-sidebar-footer/);
  assert.doesNotMatch(shell, /<div class="eon-app-sidebar-spacer"><\/div>/);
  assert.match(css, /\.eon-app-sidebar-scroll\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.eon-app-sidebar-footer\s*\{[\s\S]*flex:\s*0 0 auto/);
  assert.match(css, /\.eon-app-sidebar\s*\{[\s\S]*overflow:\s*hidden/);
});

test('W660H chat composer and Continue actions remain visible inside the viewport', () => {
  const chatFirst = read('assets/css/eon-chat-first.css');
  const home = read('assets/css/eonbot-home.css');
  const continuation = read('assets/css/eon-continue.css');
  assert.match(chatFirst, /data-eon-app-page='chat'[\s\S]*height:\s*100dvh/);
  assert.match(chatFirst, /\.chat-messages[\s\S]*overflow-y:\s*auto\s*!important/);
  assert.match(home, /\.eonbot-home-main[\s\S]*overflow:\s*hidden/);
  assert.match(home, /\.eonbot-home-composer[\s\S]*position:\s*absolute/);
  assert.match(continuation, /chat-page-main > \.eon-continue-card[\s\S]*position:\s*fixed/);
  assert.match(continuation, /\.eon-continue-actions a,[\s\S]*display:\s*inline-flex/);
});

test('W660H truth keeps gestures explicit and preserves one assistant/store', () => {
  const shellTruth = getEonNexusAppShellTruth();
  const pulseTruth = getEonNexusPulseTruth();
  assert.equal(shellTruth.pageSpecificOrbs, true);
  assert.equal(shellTruth.fullScreenGesture, true);
  assert.equal(shellTruth.secondConversationStore, false);
  assert.equal(shellTruth.secondProjectStore, false);
  assert.equal(pulseTruth.swipeOrDoubleClickFullScreen, true);
  assert.equal(pulseTruth.startsVoiceCapture, false);
  assert.equal(pulseTruth.startsAiWork, false);
});
