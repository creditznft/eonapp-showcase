import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreatorIntent, normalizeCreatorUiMode } from '../../assets/js/create/creator-mode-contract.js';

test('W627B beginner mode supplies conservative image defaults', () => {
  const result = buildCreatorIntent({ mediaKind: 'image', rail: 'local-runtime', uiMode: 'beginner', goal: 'A product image' }, { explicitUserAction: true });
  assert.equal(result.intent.uiMode, 'beginner');
  assert.equal(result.intent.advanced.aspectRatio, '1:1');
  assert.equal(result.intent.advanced.qualityProfile, 'safe-default');
  assert.equal(result.intent.advanced.seed, null);
});

test('W627B advanced mode preserves bounded explicit controls', () => {
  const result = buildCreatorIntent({ mediaKind: 'video', rail: 'direct-user-owned-byok', uiMode: 'advanced', goal: 'A four second camera move', aspectRatio: '9:16', durationSeconds: 99, seed: 42, qualityProfile: 'quality' }, { explicitUserAction: true });
  assert.equal(result.intent.uiMode, 'advanced');
  assert.equal(result.intent.advanced.durationSeconds, 30);
  assert.equal(result.intent.advanced.seed, 42);
  assert.equal(normalizeCreatorUiMode('unexpected'), 'beginner');
});
