import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEonContinueCandidate, listEonContinueCandidates, dismissEonContinue, isEonContinueDismissed } from '../../assets/js/retention/eon-continue-resolver.js';
import { recordEonRetentionEvent } from '../../assets/js/retention/eon-retention-telemetry.js';
import { validateW642ProductTruthRetentionContract } from '../../config/w642-product-truth-retention-contract.mjs';
import { recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}
const now = Date.parse('2026-07-11T12:00:00.000Z');
const iso = (offset) => new Date(now + offset).toISOString();

test('W642 contract remains calm and local-only', () => assert.equal(validateW642ProductTruthRetentionContract().ok, true));

test('resolver returns one newest meaningful local candidate without auto-navigation', () => {
  const localStorage = new MemoryStorage({
    'eon:projects:v3': JSON.stringify({ projects: [{ id: 'p1', title: 'Launch plan', status: 'active', updatedAt: iso(-60_000) }] }),
    'eon:creator-jobs:v1': JSON.stringify({ jobs: [{ id: 'j1', title: 'Poster render', status: 'queued', updatedAt: iso(-120_000) }] })
  });
  const result = resolveEonContinueCandidate({ localStorage, sessionStorage: new MemoryStorage(), now });
  assert.equal(result.type, 'project');
  assert.equal(result.label, 'Launch plan');
  assert.equal(result.href, '/projects?project=p1');
  assert.equal(result.destinationId, 'projects');
  assert.equal(result.localOnly, true);
});

test('candidate list never includes completed projects or stale/future records', () => {
  const localStorage = new MemoryStorage({
    'eon:projects:v3': JSON.stringify({ projects: [
      { id: 'done', title: 'Done', status: 'complete', updatedAt: iso(-1_000) },
      { id: 'old', title: 'Old', status: 'active', updatedAt: '2025-01-01T00:00:00.000Z' },
      { id: 'future', title: 'Future', status: 'active', updatedAt: iso(10 * 60_000) }
    ] })
  });
  assert.deepEqual(listEonContinueCandidates({ localStorage, sessionStorage: new MemoryStorage(), now }), []);
});

test('dismissal is explicit and time bounded', () => {
  const storage = new MemoryStorage();
  dismissEonContinue(storage, now, 7);
  assert.equal(isEonContinueDismissed(storage, now + 6 * 24 * 60 * 60 * 1000), true);
  assert.equal(isEonContinueDismissed(storage, now + 8 * 24 * 60 * 60 * 1000), false);
});

test('retention telemetry stores no labels, ids, URLs or content', () => {
  const storage = new MemoryStorage();
  const result = recordEonRetentionEvent('opened', 'project<script>', { storage, now });
  assert.equal(result.ok, true);
  const raw = storage.getItem('eon:retention:events:w642:v1');
  assert.equal(raw.includes('Launch plan'), false);
  assert.equal(raw.includes('script'), true);
  const event = JSON.parse(raw)[0];
  assert.deepEqual(Object.keys(event).sort(), ['action','containsUserContent','day','remoteUpload','schema','type'].sort());
  assert.equal(event.containsUserContent, false);
  assert.equal(event.remoteUpload, false);
});


test('verified Creator outcomes become content-free Continue candidates without requiring uploaded media', () => {
  const localStorage = new MemoryStorage();
  const recorded = recordEonCoreOutcome({
    kind: 'creator-music-exported', route: '/create', source: 'eon-music-studio', receiptId: 'music:continue-proof', verified: true
  }, { storage: localStorage, environment: null, now: now - 30_000 });
  assert.equal(recorded.ok, true);
  const result = resolveEonContinueCandidate({ localStorage, sessionStorage: new MemoryStorage(), now });
  assert.equal(result.type, 'creator-outcome');
  assert.equal(result.label, 'EON Music export');
  assert.equal(result.href, '/create');
  assert.equal(result.localOnly, true);
  assert.doesNotMatch(JSON.stringify(result), /continue-proof|prompt|media|credential|apiKey/i);
});
