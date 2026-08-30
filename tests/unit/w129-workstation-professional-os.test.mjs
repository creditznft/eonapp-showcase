import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W129 Workstation declares professional OS layout contract', () => {
  const js = read('assets/js/eon-workstation-page.js');
  assert.match(js, /W129_PRO_WORKSTATION_CONTRACT/);
  for (const token of ['left-app-launcher', 'single-active-app-surface', 'right-eonbot-rail', 'bottom-command-dock']) {
    assert.match(js, new RegExp(token));
  }
  assert.match(js, /one-large-active-workspace-no-tiny-clipped-iframes/);
  assert.match(js, /version:\s*'4\.0\.0-w129'/);
});

test('W129 app surface has professional controls and room portal actions', () => {
  const js = read('assets/js/eon-workstation-page.js');
  for (const id of ['ew-app-fullscreen', 'ew-app-minimize', 'ew-app-pin', 'ew-app-room', 'ew-app-ask', 'ew-app-newtab']) {
    assert.match(js, new RegExp(`id="${id}"`));
  }
  assert.match(js, /function toggleStageFullscreen/);
  assert.match(js, /function pinActiveApp/);
  assert.match(js, /function enterActiveRoom/);
  assert.match(js, /W129_ROOM_ROUTES/);
  assert.match(js, /data-w129-active-surface="single-large"/);
});

test('W129 CSS enforces no tiny/clipped internal app frames', () => {
  const css = read('assets/css/eon-workstation.css');
  assert.match(css, /W129 Workstation professional OS rebuild/);
  assert.match(css, /\.ew-w129-app-launcher/);
  assert.match(css, /\.ew-w129-bottom-dock/);
  assert.match(css, /\.ew-w129-stage-fullscreen/);
  assert.match(css, /height:\s*calc\(100vh - 230px\)/);
  assert.match(css, /@media \(max-width: 860px\)/);
});
