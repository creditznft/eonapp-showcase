import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getEonCommandSurfaceModel, getEonQuickCommands } from '../../assets/js/command/eon-command-registry.js';
import { EONAPP_W721_PRODUCT_RESET_CONTRACT } from '../../config/w721-product-reset-contract.mjs';

test('W724 provides four useful page-context primary commands', () => {
  for (const page of ['chat', 'create', 'projects', 'library', 'eoncity', 'forge', 'automations', 'local-ai', 'insights']) {
    const commands = getEonQuickCommands(page);
    assert.deepEqual(commands.map((entry) => entry.id), ['continue', 'new', 'ask-eonbot', 'share']);
    assert.equal(commands.length, 4);
    assert.ok(commands.every((entry) => entry.label && entry.description && entry.action));
  }
});

test('W724 is a full-screen 2D surface, not a half-width Nexus panel', () => {
  const css = fs.readFileSync(new URL('../../assets/css/eon-command-surface.css', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/command/eon-command-surface.js', import.meta.url), 'utf8');
  assert.match(css, /\.eon-command-surface\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/);
  assert.match(runtime, /aria-modal="true"/);
  assert.match(runtime, /Alt K/);
  assert.equal(EONAPP_W721_PRODUCT_RESET_CONTRACT.frontend.commandSurface, 'full-screen-2d');
});

test('W724 preserves the City Nexus concept while retiring frontend Nexus auto-mount', () => {
  const shell = fs.readFileSync(new URL('../../assets/js/eon-app-shell.js', import.meta.url), 'utf8');
  const build = fs.readFileSync(new URL('../../scripts/build-production.mjs', import.meta.url), 'utf8');
  const cityNexus = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const cityContract = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js', import.meta.url), 'utf8');
  assert.doesNotMatch(shell, /scheduleEonNexusAppShell/);
  assert.doesNotMatch(shell, /import\('\.\/nexus\/eon-nexus-app-shell\.js'\)/);
  assert.match(shell, /installEonQuickCommandSurface/);
  assert.match(build, /eonapp\.quick-command\.surface\.w724\.v1/);
  assert.match(build, /eon\.city\.runtime-owner\.w731\.v1/);
  assert.match(cityContract, /id: 'eonbot-nexus'[\s\S]*?kind: 'nexus'/);
  assert.match(cityNexus, /onOpenNexus:[\s\S]*?openSurfaceForStation\('eonbot-nexus', trigger, 'nexus'\)/);
});

test('W724 City context opens real 2D work routes', () => {
  const model = getEonCommandSurfaceModel('eoncity');
  assert.equal(model.page, 'eoncity');
  assert.deepEqual(model.jumps.map((entry) => entry.label), ['EONBOT Nexus', 'Create Forge', 'Project Atlas', 'Library Vault']);
  assert.ok(model.jumps.every((entry) => /^\//.test(entry.href)));
});


test('W724 rejects unsafe recent-item destinations and keeps valid local routes', () => {
  const model = getEonCommandSurfaceModel('chat', { recentItems: [
    { label: 'Script', href: 'javascript:alert(1)' },
    { label: 'Protocol relative', href: '//evil.example/path' },
    { label: 'Control', href: '/safe\u0000bad' },
    { label: 'Valid', href: '/projects?active=1' }
  ] });
  assert.deepEqual(model.recent.map((entry) => entry.href), ['/', '/', '/', '/projects?active=1']);
});

test('W724 protects City controls and high-contrast users', () => {
  const css = fs.readFileSync(new URL('../../assets/css/eon-command-surface.css', import.meta.url), 'utf8');
  assert.match(css, /body\[data-eon-app-page="eoncity"\] \.eon-command-orb/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline:\s*2px solid Highlight/);
});


test('W724 returns to City without reloading and contains share failures', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/command/eon-command-surface.js', import.meta.url), 'utf8');
  assert.match(runtime, /model\.page === 'eoncity'[\s\S]*Return to City/);
  assert.match(runtime, /eon:quick-command-error/);
  assert.match(runtime, /typeof environment\?\.Event === 'function'/);
  const shell = fs.readFileSync(new URL('../../assets/js/eon-app-shell.js', import.meta.url), 'utf8');
  assert.match(shell, /currentPage === 'chat' \? listChatThreads/);
});
