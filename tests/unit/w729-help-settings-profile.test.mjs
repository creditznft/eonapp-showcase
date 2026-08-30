import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W729 Help exposes current City capture and plan guidance in the normal shell', () => {
  const help = read('help.html');
  assert.match(help, /data-eon-app-shell="1"/);
  assert.match(help, /Creator Capture/);
  assert.match(help, /Plans &amp; access/);
  assert.match(help, /dispatchEonWorkSurfaceOpen/);
  assert.match(help, /Report a problem safely/);
});

test('W729 keeps appearance, plans and My Realm within settings/profile structure', () => {
  const command = read('assets/js/command/eon-command-registry.js');
  const shell = read('assets/js/shell/eon-shell-navigation.js');
  assert.match(command, /Graphite, Obsidian, or Ember/);
  assert.match(command, /Billing & plan/);
  assert.match(command, /My Realm/);
  assert.doesNotMatch(shell, /Realm Studio<\/span>/);
});
