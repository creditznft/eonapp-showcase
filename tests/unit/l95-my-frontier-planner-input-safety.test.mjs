import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 an open Expanse/My Frontier board blocks keyboard, touch, and simulated movement', () => {
  assert.match(runtime, /if \(expanseUiOverlay\.isBoardOpen\?\.\(\) === true\) return 'expanse-board-open';/);
  assert.match(runtime, /const blockedReason = getMovementBlockReason\(\);[\s\S]*const canMove = input\.active && !blockedReason/);
  assert.match(runtime, /if \(!input\.active \|\| getMovementBlockReason\(\)\)/);
});

test('L95 board-open keyboard events cannot dispatch world interactions underneath the modal', () => {
  assert.match(runtime, /if \(expanseUiOverlay\.isBoardOpen\?\.\(\) === true\) \{\s*lastRawKeyboardEvent = freeze\(\{ \.\.\.rawEvent\(\), accepted: false, reason: 'expanse-board-open' \}\);\s*return;\s*\}\s*if \(keyboardCode === 'KeyE' && event\.repeat !== true/);
});

test('L95 planner remains trivially dismissible by visible Close, Escape, and M', () => {
  assert.match(overlay, /data-eon-expanse-ui':'close'/);
  assert.match(overlay, /if \(event\.key === 'Escape'\) \{ event\.preventDefault\?\.\(\); closeBoard\(\); return; \}/);
  assert.match(runtime, /const closing = expanseUiOverlay\.isBoardOpen\?\.\(\) === true;[\s\S]*closing \? expanseUiOverlay\.closeBoard\(\)/);
});
