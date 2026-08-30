import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W766A is integrated into the maintained single Babylon runtime', () => {
  assert.match(source, /mountEonExpanseW766AGatewayOverlook\(\{ scene/);
  assert.doesNotMatch(source, /new Engine\([^)]*expanse/i);
  assert.doesNotMatch(source, /new Scene\([^)]*expanse/i);
  assert.match(source, /world\.root\.setEnabled\(false\)/);
  assert.match(source, /world\.root\.setEnabled\(true\)/);
});

test('Expanse gate requires review before a separate explicit Enter action', () => {
  assert.match(source, /const reviewExpanseGate =/);
  assert.match(source, /expanseWorldMode\.review\(\{ explicitUserAction: true \}\)/);
  assert.match(source, /state: 'EXPANSE_ENTRY_REVIEW'/);
  assert.match(source, /onEnterExpanse: \(options = \{\}\) => runtime\?\.enterExpanse\?\.\(options\)/);
  assert.match(source, /beginEntry\(\{ snapshot, explicitUserAction \}\)/);
  assert.match(source, /cancelExpanseEntry\(\{ explicitUserAction = false \} = \{\}\) \{ return expanseWorldMode\.cancelReview/);
});

test('Return restores player and camera from the captured snapshot', () => {
  assert.match(source, /expanseWorldMode\.requestReturn/);
  assert.match(source, /snapshot\.player\.position/);
  assert.match(source, /camera\.setTarget\(new Vector3\(snapshot\.camera\.target\.x/);
  assert.match(source, /completeHubRestore\(\{ snapshotRestored: true \}\)/);
});
