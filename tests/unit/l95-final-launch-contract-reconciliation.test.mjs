import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW768FMyFrontierPlanningView } from '../../assets/js/city/w768/eon-expanse-w768f-my-frontier-planning-view.js';
import { deriveEonExpanseW768HMyFrontierReadiness } from '../../assets/js/city/w768/eon-expanse-w768h-my-frontier-readiness.js';
import { deriveEonExpanseW779APostCampaignProgression } from '../../assets/js/city/w779/eon-expanse-w779a-post-campaign-progression.js';
import { deriveEonExpanseW780BFutureRegionProgramme } from '../../assets/js/city/w780/eon-expanse-w780b-future-region-programme.js';
import { getEonExpanseW802AOwnerPlaythroughCases } from '../../assets/js/city/w802/eon-expanse-w802a-owner-playthrough-matrix.js';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const accessSource = await readFile(new URL('../../assets/js/city/r08/eon-city-r08-my-frontier-access.js', import.meta.url), 'utf8');

test('L95 final reconciliation keeps starter world access separate from Beacon One progression', () => {
  const view = deriveEonExpanseW768FMyFrontierPlanningView({ starterAccessAvailable: true });
  assert.equal(view.stage, 'starter-ready');
  assert.equal(view.action.type, 'enter-my-frontier');
  assert.equal(view.earlyAccessAvailable, false);
  assert.doesNotMatch(view.detail, /Beacon One/);
  assert.match(accessSource, /Public starter access opens the existing authored My Frontier world/);
});

test('L95 mission board routes starter access into the real My Frontier entry path', () => {
  assert.match(runtime, /starterAccessAvailable: getOpenWorldAvailability\(\)\.myFrontier\.starterAccess === true/);
  assert.match(runtime, /earlyAccessAvailable: Boolean\(deriveEonCityR08MyFrontierUnlockReceipt\(expanseMissionRuntime\.getState\(\)\)\)/);
  assert.match(runtime, /validated\.action\.type === 'enter-my-frontier'/);
  assert.match(runtime, /runtime\.enterMyFrontier\(\{ explicitUserAction: true \}\)/);
  assert.match(overlay, /Open My Frontier/);
});

test('L95 readiness never tells a starter player to complete Signal Frontier for entry', () => {
  const view = deriveEonExpanseW768HMyFrontierReadiness({ myFrontierState: null });
  assert.equal(view.rows.every((row) => !/Complete Signal Frontier|unlock My Frontier first/i.test(row.detail)), true);
  assert.match(view.rows[0].detail, /Signal Frontier completion is not required for world entry/);
});


test('L95 post-campaign copy does not retroactively make Signal a My Frontier entry gate', () => {
  const projection = deriveEonExpanseW779APostCampaignProgression({ campaignBoard: { campaign: { complete: true } }, myFrontierState: { unlocked: false } });
  assert.match(projection.nextLabel, /starter planning/);
  assert.doesNotMatch(projection.nextLabel, /unlock My Frontier|campaign receipt/i);
});

test('L95 future-region programme does not advertise an activated Storm Sector as still unreleased', () => {
  const projection = deriveEonExpanseW780BFutureRegionProgramme({
    postCampaign: { visible: true, futureRegionReady: true, completedPillars: 5, totalPillars: 5 },
    releasedRegionIds: ['storm-sector']
  });
  assert.equal(projection.rows.some((row) => row.id === 'storm-sector'), false);
  assert.notEqual(projection.recommendedRegion?.id, 'storm-sector');
  assert.match(runtime, /releasedRegionIds: getOpenWorldAvailability\(\)\.stormSector\.available \? \['storm-sector'\] : \[\]/);
});

test('L95 owner playthrough proves My Frontier starter entry rather than a mandatory Signal unlock', () => {
  const entry = getEonExpanseW802AOwnerPlaythroughCases().find((row) => row.id === 'frontier-unlock-plan');
  assert.match(entry.label, /starter access/);
  assert.doesNotMatch(entry.label, /Unlock My Frontier/);
});
