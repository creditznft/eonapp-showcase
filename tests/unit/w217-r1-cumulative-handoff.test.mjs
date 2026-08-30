import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyCumulativeHandoff, WAVE_REQUIREMENTS } from '../../scripts/w217-r1-cumulative-handoff-gate.mjs';

test('W217→R1 cumulative handover contains every approved wave and no generated source roots', () => {
  const result = verifyCumulativeHandoff();
  assert.equal(WAVE_REQUIREMENTS.length, 23);
  assert.equal(result.waveCount, 23);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.strictSourceSnapshot, false);
  assert.ok(result.waves.every((wave) => wave.ok));
});
