import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../assets/js/utils/challenges.js');

function makeModule(overrides = {}) {
  const storage = { ...(overrides.storage || {}) };
  const lsProxy = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    get length() { return Object.keys(storage).length; },
    key: (i) => Object.keys(storage)[i] ?? null
  };

  const ctx = createContext({
    localStorage: lsProxy,
    Date,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Math,
    Set
  });

  const src = readFileSync(SRC, 'utf8')
    .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  const exportedNames = [...readFileSync(SRC, 'utf8').matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const suffix = exportedNames.map((n) => `exports.${n} = ${n};`).join('\n');
  const wrapped = `const exports = {};\n${src}\n${suffix}\nexports`;
  return { exports: runInContext(wrapped, ctx), store: storage };
}

describe('challenges — getChallengeToastMessages', () => {
  it('returns empty array for null input', () => {
    const { exports } = makeModule();
    const msgs = exports.getChallengeToastMessages(null);
    assert.equal(msgs.length, 0);
  });

  it('returns empty array for rateLimited update', () => {
    const { exports } = makeModule();
    const msgs = exports.getChallengeToastMessages({ rateLimited: true, newlyCompleted: [], dayCompleted: false });
    assert.equal(msgs.length, 0);
  });

  it('returns empty array when no newly completed and no day complete', () => {
    const { exports } = makeModule();
    const msgs = exports.getChallengeToastMessages({ rateLimited: false, newlyCompleted: [], dayCompleted: false });
    assert.equal(msgs.length, 0);
  });

  it('returns single challenge message with XP for one completion', () => {
    const { exports } = makeModule();
    const update = {
      rateLimited: false,
      newlyCompleted: [{ icon: '⚡', name: 'Tool Sprint', reward: { xp: 30 } }],
      dayCompleted: false,
      meta: {}
    };
    const msgs = exports.getChallengeToastMessages(update);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('Tool Sprint'));
    assert.ok(msgs[0].includes('+30 XP'));
  });

  it('returns bulk message for multiple completions', () => {
    const { exports } = makeModule();
    const update = {
      rateLimited: false,
      newlyCompleted: [
        { icon: '⚡', name: 'Tool Sprint', reward: { xp: 20 } },
        { icon: '📣', name: 'Share Spark', reward: { xp: 25 } }
      ],
      dayCompleted: false,
      meta: {}
    };
    const msgs = exports.getChallengeToastMessages(update);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('2 challenges complete'));
    assert.ok(msgs[0].includes('+45 XP'));
  });

  it('appends streak message on dayCompleted', () => {
    const { exports } = makeModule();
    const update = {
      rateLimited: false,
      newlyCompleted: [{ icon: '⚡', name: 'Tool Sprint', reward: { xp: 20 } }],
      dayCompleted: true,
      meta: { currentStreak: 3 }
    };
    const msgs = exports.getChallengeToastMessages(update);
    assert.equal(msgs.length, 2);
    assert.ok(msgs[1].includes('3 days in a row'));
  });

  it('streak message uses singular "day" when streak is 1', () => {
    const { exports } = makeModule();
    const update = {
      rateLimited: false,
      newlyCompleted: [],
      dayCompleted: true,
      meta: { currentStreak: 1 }
    };
    const msgs = exports.getChallengeToastMessages(update);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1 day in a row'));
  });

  it('no XP suffix when xp is 0', () => {
    const { exports } = makeModule();
    const update = {
      rateLimited: false,
      newlyCompleted: [{ icon: '🧷', name: 'Vault Keeper', reward: { xp: 0 } }],
      dayCompleted: false,
      meta: {}
    };
    const msgs = exports.getChallengeToastMessages(update);
    assert.equal(msgs.length, 1);
    assert.ok(!msgs[0].includes('XP'));
  });
});

describe('challenges — getChallengeSnapshot', () => {
  it('returns state and meta for new user', () => {
    const { exports } = makeModule();
    const snapshot = exports.getChallengeSnapshot('user123');
    assert.ok(snapshot.state, 'state should exist');
    assert.ok(snapshot.meta, 'meta should exist');
    assert.equal(snapshot.state.userId, 'user123');
    assert.ok(Array.isArray(snapshot.state.challenges));
  });

  it('daily state has exactly 3 challenges', () => {
    const { exports } = makeModule();
    const { state } = exports.getChallengeSnapshot('user-abc');
    assert.equal(state.challenges.length, 3);
  });

  it('challenges start with current=0 and completed=false', () => {
    const { exports } = makeModule();
    const { state } = exports.getChallengeSnapshot('user-def');
    for (const ch of state.challenges) {
      assert.equal(ch.current, 0);
      assert.equal(ch.completed, false);
    }
  });

  it('default meta starts with zero streak and totalXp', () => {
    const { exports } = makeModule();
    const { meta } = exports.getChallengeSnapshot('user-ghi');
    assert.equal(meta.currentStreak, 0);
    assert.equal(meta.totalXp, 0);
    assert.equal(meta.totalCompleted, 0);
  });

  it('same userId returns same challenges on re-call (deterministic)', () => {
    const { exports } = makeModule();
    const snap1 = exports.getChallengeSnapshot('consistent-user');
    const snap2 = exports.getChallengeSnapshot('consistent-user');
    const ids1 = snap1.state.challenges.map((c) => c.templateId);
    const ids2 = snap2.state.challenges.map((c) => c.templateId);
    assert.equal(ids1.length, ids2.length);
    for (let i = 0; i < ids1.length; i++) {
      assert.equal(ids1[i], ids2[i]);
    }
  });
});

describe('challenges — recordChallengeEvent', () => {
  it('records toolRun event and increments challenge progress', () => {
    const { exports } = makeModule();
    // Ensure we get a challenge of type toolRun
    const snap = exports.getChallengeSnapshot('evt-user');
    const hasToolRun = snap.state.challenges.some((c) => c.eventType === 'toolRun');
    if (!hasToolRun) {
      // No toolRun challenge today for this seed — skip gracefully
      return;
    }
    const result = exports.recordChallengeEvent('evt-user', 'toolRun', 1);
    assert.equal(result.rateLimited, false);
    const ch = result.state.challenges.find((c) => c.eventType === 'toolRun');
    assert.ok(ch);
    assert.equal(ch.current, 1);
  });

  it('returns rateLimited for invalid event type', () => {
    const { exports } = makeModule();
    exports.getChallengeSnapshot('rate-user');
    const result = exports.recordChallengeEvent('rate-user', 'invalidEvent', 1);
    assert.equal(result.rateLimited, true);
    assert.equal(result.reason, 'invalid-event');
  });
});
