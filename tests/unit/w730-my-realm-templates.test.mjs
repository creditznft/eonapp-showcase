import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  MY_REALM_LAYOUTS,
  MY_REALM_SHORTCUTS,
  buildMyRealmCard,
  getMyRealmPublicIdentity,
  createMyRealmState,
  normalizeMyRealmState
} from '../../assets/js/realm/realm-state.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const memoryStorage = () => {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
};

test('W730 provides exactly three complete fixed layouts and safe shortcut choices', () => {
  assert.deepEqual(MY_REALM_LAYOUTS.map((entry) => entry.id), ['command-loft', 'creator-studio', 'archive-retreat']);
  assert.ok(MY_REALM_SHORTCUTS.some((entry) => entry.id === 'capture'));
  const state = createMyRealmState({ storage: memoryStorage(), input: { label: 'Creator Room', handle: 'creator-room', layout: 'creator-studio', shortcuts: ['create', 'projects', 'capture', 'share', 'local-ai'] } });
  assert.equal(state.layout, 'creator-studio');
  assert.deepEqual(state.shortcuts, ['create', 'projects', 'capture', 'share']);
});

test('W730 migrates legacy themes and creates an allowlisted read-only Realm Card', () => {
  const state = normalizeMyRealmState({ label: 'My Realm', handle: 'my-realm', theme: 'dark-purple', layout: 'command-loft', shortcuts: ['eonbot', 'projects'], featuredItem: { type: 'project', id: 'project-1', title: 'Launch plan' }, returnLoop: { returnCount: 99 } }, { storage: memoryStorage() });
  assert.equal(state.theme, 'graphite');
  const card = buildMyRealmCard(state);
  assert.equal(card.safeToShare, true);
  assert.equal(card.layout.id, 'command-loft');
  assert.equal(card.featuredItem.title, 'Launch plan');
  assert.equal('id' in card.featuredItem, false);
  const publicIdentity = getMyRealmPublicIdentity(state);
  assert.equal('id' in publicIdentity.featuredItem, false);
  assert.equal('returnLoop' in card, false);
  assert.equal('entryDistrict' in card, false);
  assert.match(card.note, /excludes private City state/);
});

test('W730 UI keeps primary settings simple and advanced historical controls collapsed', () => {
  const html = read('realm-studio.html');
  assert.match(html, /Command Loft/);
  assert.match(html, /Creator Studio/);
  assert.match(html, /Archive Retreat/);
  assert.match(html, /Pin up to four shortcuts/);
  assert.match(html, /Read-only Realm Card preview/);
  assert.match(html, /<summary>Advanced local Realm controls<\/summary>/);
});
