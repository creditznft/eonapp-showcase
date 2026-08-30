import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW405LiveUxCityRescue } from '../../scripts/w405-live-ux-city-rescue-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W423 keeps one canonical Babylon City and redirects cached legacy routes', () => {
  const sw = read('public/sw.js');
  const redirects = read('public/_redirects');
  assert.match(sw, /LEGACY_CITY_NAVIGATION_PATHS/);
  assert.match(sw, /Response\.redirect\(new URL\('\/eoncity'/);
  assert.match(redirects, /\/realm \/eoncity 301/);
  assert.match(redirects, /\/eoncity-3d \/eoncity 301/);
  assert.match(redirects, /\/eoncity\/lite \/eoncity 301/);
  assert.doesNotMatch(read('assets/js/eon-app-shell.js'), /href="\/eoncity\/tour/);
});

test('W423 uses an explicit compact guest sign-in card with no redundant guest action', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(shell, /data-eon-header-account-label>Sign in/);
  assert.match(shell, /data-eon-signin-dialog/);
  assert.match(shell, /Continue with Google/);
  assert.doesNotMatch(shell, /Continue as guest/);
  assert.match(shell, /Your chats, files, projects, Vault and City progress stay on this device unless you later choose a separate Sync action\./);
  assert.doesNotMatch(shell, /data-eon-header-account-ack|dataCustodyAck/);
});

test('W423 source gate passes and remains source-only', () => {
  const report = inspectW405LiveUxCityRescue({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /real device/i);
});
