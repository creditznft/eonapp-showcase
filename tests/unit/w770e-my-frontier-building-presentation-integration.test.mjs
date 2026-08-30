import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W770E derives art truth from the canonical renderer and adds it to the existing Mission Board', () => {
  assert.match(runtime, /deriveEonExpanseW770EBuildingPresentationView/);
  assert.match(runtime, /rendererSummary: expanseMyFrontierRenderer\?\.getSummary\?\.\(\) \|\| \{\}/);
  assert.match(runtime, /myFrontierPresentation/);
});

test('W770E overlay shows presentation status and detail on existing authored plot rows', () => {
  assert.match(overlay, /presentationByPlot/);
  assert.match(overlay, /presentationItem\?\.status \|\| readinessItem\?\.status/);
  assert.match(overlay, /row\.title=presentationItem\?\.detail/);
});

test('W770E does not add construction, retry, payment, XP or public-sharing controls', () => {
  const combined = `${runtime}\n${overlay}`;
  assert.doesNotMatch(combined, /data-eon-expanse-building-art-retry|purchase-building-art|awardXp\([^)]*myFrontierPresentation|publish-building/);
});
