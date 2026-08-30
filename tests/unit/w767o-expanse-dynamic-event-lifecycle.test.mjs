import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  deriveEonExpanseW767ODynamicEventLifecycle,
  validateEonExpanseW767ODynamicEventReview
} from '../../assets/js/city/w766/eon-expanse-w767o-dynamic-event-lifecycle.js';
import { createEonExpanseW766FLivingContent } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767O event activity is bounded by the real startsAt and endsAt window', () => {
  const event = { id: 'signal-storm', windowId: '7:10', startsAt: 1_000, endsAt: 6_000 };
  const zeroEvent = { id: 'zero-signal', windowId: '0:0', startsAt: 0, endsAt: 500 };
  assert.equal(deriveEonExpanseW767ODynamicEventLifecycle(zeroEvent, { at: 0 }).active, true);
  assert.equal(deriveEonExpanseW767ODynamicEventLifecycle(event, { at: 999 }).status, 'upcoming');
  assert.equal(deriveEonExpanseW767ODynamicEventLifecycle(event, { at: 1_000 }).active, true);
  assert.equal(deriveEonExpanseW767ODynamicEventLifecycle(event, { at: 5_999 }).remainingMs, 1);
  assert.equal(deriveEonExpanseW767ODynamicEventLifecycle(event, { at: 6_000 }).status, 'expired');
});

test('W767O living-content resolver clears an event after its duration instead of stretching it across the 30-minute selection window', () => {
  const runtime = createEonExpanseW766FLivingContent({ worldSeed: 9, now: () => 0 });
  const startsAt = 30 * 60_000;
  const active = runtime.resolveEvent({ at: startsAt, windowMinutes: 30 });
  assert.ok(active);
  assert.equal(active.startsAt, startsAt);
  const expired = runtime.resolveEvent({ at: active.endsAt + 1, windowMinutes: 30 });
  assert.equal(expired, null);
  assert.equal(runtime.getState().activeEvent, null);
});

test('W767O review requires a current matching event and never awards XP or blocks Hub return', () => {
  const event = { id: 'archive-pulse', windowId: '3:4', startsAt: 100, endsAt: 500 };
  assert.equal(validateEonExpanseW767ODynamicEventReview({ event, at: 200 }).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767ODynamicEventReview({ event, expectedWindowId: '3:old', explicitUserAction: true, at: 200 }).reason, 'dynamic-event-window-changed');
  assert.equal(validateEonExpanseW767ODynamicEventReview({ event, explicitUserAction: true, at: 500 }).reason, 'dynamic-event-expired');
  const accepted = validateEonExpanseW767ODynamicEventReview({ event, expectedEventId: 'archive-pulse', expectedWindowId: '3:4', explicitUserAction: true, at: 200 });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.grantsXp, false);
  assert.equal(accepted.mutatesProgression, false);
  assert.equal(accepted.blocksHubReturn, false);
});

test('W767O runtime uses epoch time and validates marker interaction against the living-content authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const activities = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  const living = await read('../../assets/js/city/w766/eon-expanse-w766f-living-content.js');
  assert.match(runtime, /resolveEvent\(\{ at: Date\.now\(\) \}\)/);
  assert.match(runtime, /reviewDynamicEvent/);
  assert.match(runtime, /w767o-dynamic-event-reviewed/);
  assert.match(activities, /deriveEonExpanseW767ODynamicEventLifecycle/);
  assert.match(activities, /dynamic-event-expired/);
  assert.match(living, /validateEonExpanseW767ODynamicEventReview/);
});
