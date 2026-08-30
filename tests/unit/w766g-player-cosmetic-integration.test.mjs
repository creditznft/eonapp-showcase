import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/js/city/w731/eon-city-w731-command-hub-runtime.js', 'utf8');

test('Signal Vanguard selection drives one persistent canonical-player cosmetic', () => {
  assert.match(runtime, /w766g-signal-vanguard-player-cosmetic/);
  assert.match(runtime, /signalVanguardCosmeticRoot\.parent = playerAnchor/);
  assert.match(runtime, /selectedCosmetic === 'signal-vanguard-glow'/);
  assert.match(runtime, /getExpanseCosmeticSummary\(\)/);
  assert.match(runtime, /tradeable: false/);
  assert.match(runtime, /financialValue: false/);
  assert.doesNotMatch(runtime, /new Engine\([^)]*signal-vanguard|new Scene\([^)]*signal-vanguard/i);
});
