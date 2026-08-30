import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767PDynamicEventPresentation } from '../../assets/js/city/w766/eon-expanse-w767p-dynamic-event-presentation.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const event = (overrides = {}) => ({ id: 'signal-storm', label: 'Signal Storm', zoneId: 'beacon-fields', windowId: 'seed:7', startsAt: 1_000, endsAt: 481_000, ...overrides });

test('W767P exposes a bounded truthful event label, zone and countdown without reward pressure', () => {
  const view = deriveEonExpanseW767PDynamicEventPresentation(event(), { at: 181_000, playerZoneId: 'beacon-fields' });
  assert.equal(view.active, true);
  assert.equal(view.label, 'Signal Storm');
  assert.equal(view.zoneLabel, 'beacon fields');
  assert.equal(view.remainingMinutes, 5);
  assert.equal(view.playerInZone, true);
  assert.match(view.markerLabel, /Signal Storm/);
  assert.equal(view.blocksHubReturn, false);
  assert.equal(view.awardsXp, false);
  assert.equal(view.financialUrgency, false);
  assert.equal(view.createsUrgency, false);
  assert.equal(view.mutatesProgression, false);
  assert.equal(deriveEonExpanseW767PDynamicEventPresentation(event(), { at: 181_000, expanseActive: false }).active, false);
});

test('W767P reports ending soon without compulsion and clears exactly at expiry', () => {
  const ending = deriveEonExpanseW767PDynamicEventPresentation(event(), { at: 450_500 });
  const expired = deriveEonExpanseW767PDynamicEventPresentation(event(), { at: 481_000 });
  assert.equal(ending.active, true);
  assert.equal(ending.endingSoon, true);
  assert.match(ending.boardDetail, /Optional review only/);
  assert.equal(expired.active, false);
  assert.equal(expired.remainingMs, 0);
});

test('W767P strips private and malformed event fields from presentation output', () => {
  const view = deriveEonExpanseW767PDynamicEventPresentation(event({ label: '  Signal\u0000 Storm   ', privatePrompt: 'secret', requestedPath: '/private/event.glb' }), { at: 2_000 });
  const serialized = JSON.stringify(view);
  assert.equal(view.label, 'Signal Storm');
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('/private/'), false);
  assert.equal(view.storesPrivateContent, false);
});

test('W767P feeds the existing marker and mission board without a second Babylon authority', async () => {
  const anchors = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  const presentation = await read('../../assets/js/city/w766/eon-expanse-w766g-presentation-director.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(anchors, /deriveEonExpanseW767PDynamicEventPresentation/);
  assert.match(anchors, /markerLabel/);
  assert.match(presentation, /dynamicEvent/);
  assert.match(overlay, /Active frontier event/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
