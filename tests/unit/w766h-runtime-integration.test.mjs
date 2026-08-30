import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const presenter = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-transit-presenter.js', import.meta.url), 'utf8');
const gateway = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
const activities = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js', import.meta.url), 'utf8');

test('runtime integrates one-scene objective marker and staged Transit journey', () => {
  assert.match(source, /mountEonExpanseW766HObjectiveMarker\(\{ scene \}\)/);
  assert.match(source, /createEonExpanseW766HTransitJourney/);
  assert.match(source, /mountEonExpanseW766HTransitPresenter\(\{ scene/);
  assert.match(source, /expanseTransitJourney\.update\(timeMs\)/);
  assert.match(source, /expanseTransitPresenter\.update\(transitJourneyState, seconds\)/);
  assert.match(source, /expanse-transit-active/);
  assert.match(source, /cancelActiveExpanseTransit\('return-to-command-hub'\)/);
  assert.match(source, /buildEonExpanseW766HGuidance/);
  assert.match(source, /getExpanseRouteCertification\(\)/);
  assert.doesNotMatch(source, /new Engine\([^)]*expanse/i);
  assert.doesNotMatch(source, /new Scene\([^)]*expanse/i);
  assert.doesNotMatch(presenter, /new Engine|new Scene|runRenderLoop/);
  assert.match(presenter, /certifiedCapsuleGlbPresent: false/);
  assert.match(presenter, /primitiveFallbackTruthful: true/);
});

test('physical side, discovery, productive and event anchors use one canonical scene', () => {
  assert.match(gateway, /mountEonExpanseW766FActivityAnchors/);
  assert.match(source, /recordWorldInteraction\(detail\.interactionAction/);
  assert.match(source, /recordDiscovery\(detail\.discoveryId/);
  assert.match(source, /productive-mission-review/);
  assert.match(source, /updateDynamicEvent\?\.\(activeExpanseEvent, seconds\)/);
  assert.match(activities, /signal-fragment-collected/);
  assert.match(activities, /lost-worker-terminal-activated/);
  assert.match(activities, /productive-mission-review/);
  assert.match(activities, /dynamic-event-reviewed/);
  assert.doesNotMatch(activities, /new Engine|new Scene|runRenderLoop/);
});

assert.match(source,/lastExpanseEventResolveAt >= 5000/);
assert.match(source,/lastExpanseUiSyncAt >= 100/);
