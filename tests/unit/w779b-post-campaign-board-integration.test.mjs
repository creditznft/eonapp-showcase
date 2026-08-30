import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W779B derives post-campaign progress from canonical campaign, world, My Frontier and living-content state', () => {
  assert.match(runtime, /deriveEonExpanseW779APostCampaignProgression/);
  assert.match(runtime, /campaignBoard, zoneRestorationBoard/);
  assert.match(runtime, /myFrontierState: expanseMyFrontier\.getState\(\)/);
  assert.match(runtime, /productiveTransformationStatus, sideTransformationStatus/);
  assert.match(runtime, /livingContentState: expanseLivingContent\.getState\(\)/);
  assert.match(runtime, /postCampaign,/);
});

test('W779B reuses the existing frontier card when no active reviewed contract exists', () => {
  assert.match(overlay, /const postCampaign = lastBoard\.postCampaign \|\| null/);
  assert.match(overlay, /frontierCard\.hidden = stormActive \|\| \(!frontier && postCampaign\?\.visible !== true\)/);
  assert.match(overlay, /Post-campaign frontier/);
  assert.match(overlay, /maintained pillars active/);
  assert.match(overlay, /Future region status/);
});

test('W779B does not add an automatic future-region action or a new runtime owner', () => {
  assert.doesNotMatch(overlay, /onUnlockFutureRegion/);
  assert.doesNotMatch(runtime, /postCampaign[^\n]*createRegion/);
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
});
