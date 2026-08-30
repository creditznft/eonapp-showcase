import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW400CGoogleIdentityEntry } from '../../scripts/w400c-google-identity-entry-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W423 opens an explicit guest-to-Google card without asking a guest to continue as guest', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const profile = read('profile.html');
  assert.match(shell, /data-eon-header-account/);
  assert.match(shell, /data-eon-signin-dialog/);
  assert.match(shell, /Continue with Google/);
  assert.match(shell, /Your chats, files, projects, Vault and City progress stay on this device unless you later choose a separate Sync action\./);
  assert.doesNotMatch(shell, /Continue as guest/);
  assert.doesNotMatch(shell, /data-eon-signin-guest/);
  assert.doesNotMatch(shell, /data-eon-header-account-ack|dataCustodyAck/);
  assert.doesNotMatch(profile, /eon-profile-google-data-ack/);
});

test('W400C source gate passes', () => {
  const report = inspectW400CGoogleIdentityEntry({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /real Google test-user login/i);
});
