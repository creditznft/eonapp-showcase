import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('Creator Studio exposes five simple first-run actions before advanced tools', () => {
  const html = read('creator-studio.html');
  assert.match(html, /Creator launchpad/);
  for (const label of [
    'Start with idea',
    'Make video package',
    'Make image / thumbnail',
    'Make voice / podcast',
    'Review / schedule',
    'Advanced creator tools'
  ]) {
    assert.ok(html.includes(label), `missing ${label}`);
  }
});

test('Workbench starts with six clear launchpad actions and keeps advanced groups collapsed', () => {
  const html = read('workbench.html');
  assert.match(html, /Workbench launchpad/);
  for (const label of ['Ask', 'Build', 'Launch', 'Trade research', 'Creator', 'Vault']) {
    assert.ok(html.includes(`<strong>${label}</strong>`), `missing ${label}`);
  }
  assert.match(html, /<details class="wb-mode-group">\s*<summary><span><span class="wb-mode-group-label-icon">💼<\/span> Professional \/ advanced<\/span><\/summary>/);
  assert.match(html, /<details class="wb-mode-group">\s*<summary><span><span class="wb-mode-group-label-icon">🏠<\/span> Device \+ system lab<\/span><\/summary>/);
});

test('Device Lab is safe and discoverable', () => {
  const html = read('workbench.html');
  const js = read('assets/js/workbench-page.js');
  const css = read('assets/css/workbench.css');
  assert.match(html, /Device Lab \/ IoT Control/);
  assert.match(html, /explicit confirmation/i);
  assert.match(js, /wb-iot-add-demo/);
  assert.match(js, /window\.confirm/);
  assert.match(css, /wb-device-safety-strip/);
});

test('Workbench no longer contains duplicate mission run button ids', () => {
  const html = read('workbench.html');
  const matches = html.match(/id="wb-mission-run"/g) || [];
  assert.equal(matches.length, 1);
});
