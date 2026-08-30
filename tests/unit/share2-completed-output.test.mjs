import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonOutputShareHandoff, EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY, getEonOutputShareHandoffTruth, readEonOutputShareHandoff, writeEonOutputShareHandoff } from '../../assets/js/share/eon-output-share-handoff.js';
import { inspectShare2CompletedOutput } from '../../scripts/share2-completed-output-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values
  };
}

const input = Object.freeze({
  explicitUserAction: true,
  origin: 'creator-draft',
  title: 'Public-safe campaign direction',
  audience: 'Local creators',
  usefulOutcome: 'A repeatable launch direction another creator can adapt.',
  firstRemixStep: 'Rewrite the audience, hook and call to action for your own work.',
  remixKind: 'content-series'
});

test('Share-2 creates a short-lived handoff with no files, media, link or account payload', () => {
  const handoff = createEonOutputShareHandoff(input, { now: 10_000 });
  assert.equal(handoff.origin, 'creator-draft');
  assert.equal(handoff.expiresAt, 10_000 + 20 * 60 * 1000);
  assert.equal(handoff.boundary.sourceFiles, false);
  assert.equal(handoff.boundary.mediaBodies, false);
  assert.equal(handoff.boundary.publicLinkIncluded, false);
  assert.equal(handoff.boundary.directPublishing, false);
  assert.equal('files' in handoff, false);
  assert.equal('publicLink' in handoff, false);
});

test('Share-2 requires a visible action and rejects secret-shaped summaries', () => {
  assert.throws(() => createEonOutputShareHandoff({ ...input, explicitUserAction: false }), /visible user action/i);
  const secretFixture = `token: ${['sk', 'aaaaaaaaaaaaaaaaaaaa'].join('-')}`;
  assert.throws(() => createEonOutputShareHandoff({ ...input, usefulOutcome: secretFixture }), /secret/i);
});

test('Share-2 writes only browser-session context and expires stale handoffs', () => {
  const previous = globalThis.sessionStorage;
  const storage = memoryStorage();
  globalThis.sessionStorage = storage;
  try {
    const written = writeEonOutputShareHandoff(input, { now: 1_000 });
    assert.equal(written.ok, true);
    assert.ok(storage.values.get(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY));
    assert.equal(readEonOutputShareHandoff({ now: 1_001 })?.title, input.title);
    assert.equal(readEonOutputShareHandoff({ now: 1_000 + 20 * 60 * 1000 + 1 }), null);
    assert.equal(storage.values.has(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY), false);
  } finally { globalThis.sessionStorage = previous; }
});

test('Share-2 source contract and truth remain local-only', () => {
  const truth = getEonOutputShareHandoffTruth();
  assert.equal(truth.directPublishing, false);
  assert.equal(truth.socialConnection, false);
  assert.equal(truth.tracking, false);
  assert.equal(inspectShare2CompletedOutput().status, 'pass');
});
