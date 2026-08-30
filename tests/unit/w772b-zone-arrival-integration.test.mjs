import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W772B uses one bounded zone-arrival director and the existing overlay banner', () => {
  assert.match(runtime, /createEonExpanseW772AZoneArrivalDirector/);
  assert.match(runtime, /showExpanseZoneArrival/);
  assert.match(runtime, /expanseUiOverlay\?\.showArrival/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

test('W772B marks the initial Gateway banner and announces physical or Transit zone entry once', () => {
  assert.match(runtime, /markAnnounced\('gateway-overlook'\)/);
  assert.match(runtime, /showExpanseZoneArrival\(node\.id\)/);
  assert.match(runtime, /showExpanseZoneArrival\(expanseUpdate\.currentZone\)/);
});

test('W772B derives banner restoration from live campaign and companion truth', () => {
  assert.match(runtime, /getExpanseWorldProgress\(\)/);
  assert.match(runtime, /companionBonded: expanseCompanionState\?\.bonded === true/);
});

test('W772B resets only the session announcement ledger on Hub return', () => {
  assert.match(runtime, /expanseZoneArrival\.reset\('return-to-command-hub'\)/);
  assert.doesNotMatch(runtime, /localStorage.*zone-arrival/i);
});
