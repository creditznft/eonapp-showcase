import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const source = await readFile(sourcePath, 'utf8');

test('W794D mounts one dormant Storm Sector presenter and one transient journey controller', () => {
  assert.match(source, /createEonExpanseW794AStormSectorJourney/);
  assert.match(source, /mountEonExpanseW792CStormSectorPresenter/);
  assert.match(source, /const expanseStormSectorJourney = createEonExpanseW794AStormSectorJourney/);
  assert.match(source, /expanseStormSectorPresenter = mountEonExpanseW792CStormSectorPresenter\(\{ scene, reducedMotion, assetAdmission: pendingOptionalAssetAdmission \}\)/);
});

test('W794D revalidates authored gateway identity before explicit entry', () => {
  assert.match(source, /action === 'enter-storm-sector'/);
  assert.match(source, /storm-sector-gateway-identity-stale/);
  assert.match(source, /startEnter\(\{ explicitUserAction: detail\.explicitUserAction === true, expectedActivationId/);
  assert.match(source, /automaticTravel: false/);
  assert.match(source, /grantsXp: false/);
});

test('W794D transitions by disabling Signal Frontier and activating Storm Sector in the same scene', () => {
  assert.match(source, /expanseGateway\?\.deactivate\?\.\(\)/);
  assert.match(source, /expanseActiveRegionId = 'storm-sector'/);
  assert.match(source, /expanseStormSectorPresenter\?\.apply/);
  assert.match(source, /playerAnchor\.position\.set\(transition\.position\.x/);
  assert.match(source, /expanseStormSectorJourney\.consumeTransition\(\)/);
  assert.equal((source.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((source.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((source.match(/runRenderLoop\s*\(/g) || []).length, 1);
});

test('W794D keeps owner activation and runtime presentation synchronized', () => {
  assert.match(source, /expanseStormSectorJourney\.syncActivation\(expanseState\.futureRegionActivation\)/);
  assert.match(source, /expanseGateway\?\.applyFutureRegionActivation/);
  assert.match(source, /getExpanseStormSectorJourney/);
  assert.match(source, /getExpanseStormSectorPresentation/);
  assert.match(source, /expanseStormSectorPresenter\?\.dispose/);
});

test('RT92 Storm entry uses the runtime monotonic clock and confirms only after a rendered Storm frame', () => {
  assert.match(source, /createEonExpanseW794AStormSectorJourney\(\{ durationMs: 2800, now \}\)/);
  assert.match(source, /status: 'transitioning'/);
  assert.match(source, /stormEntryAwaitingFirstFrame = true/);
  assert.match(source, /status: 'first-playable'/);
  assert.match(source, /confirmedRegionId: 'storm-sector'/);
  assert.match(source, /firstPlayableFrame: true/);
  assert.match(source, /directOpenWorldEntry: false, transitionStarted: started\.ok === true/);
  assert.match(source, /getStormSectorEntryConfirmation/);
});
