import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
const compositions = fs.readFileSync(new URL('../../assets/js/city/w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

test('RT90 Return to Hub is synchronous, idempotent, and tears Storm presentation down', () => {
  const block = between(runtime, '    returnFromExpanse({ explicitUserAction = false } = {}) {', '    getExplorationPose()');
  assert.match(block, /reconcileMountedWorldAuthority\('return-to-command-hub'\)/);
  assert.match(block, /reason: 'already-in-command-hub'/);
  assert.match(block, /expanseUiOverlay\.resetWorldPresentation\?\.\(\{ reason: 'return-to-command-hub' \}\)/);
  assert.match(block, /if \(expanseActiveRegionId === 'storm-sector'\)/);
  assert.match(block, /expanseStormSectorTransit\.cancel\(\{ explicitUserAction: true, reason: 'return-to-command-hub' \}\)/);
  assert.match(block, /expanseStormSectorPresenter\?\.suspend\?\.\(\)/);
  const resetAt = block.indexOf("expanseUiOverlay.resetWorldPresentation?.({ reason: 'return-to-command-hub' })");
  const hubRootAt = block.indexOf('world.root.setEnabled(true)');
  const modeAt = block.indexOf("ui?.setWorldMode?.('COMMAND_HUB')");
  assert.ok(resetAt >= 0 && hubRootAt > resetAt && modeAt > resetAt, 'world-only overlay must be retired before Hub presentation is restored');
});

test('RT90 Hub to Storm prepares canonical review entry and keeps uncertified missions read-only', () => {
  const entry = between(runtime, '    enterStormSector({ explicitUserAction = false } = {}) {', '    reviewExpanseEntry(');
  assert.match(entry, /reconcileMountedWorldAuthority\('storm-sector-entry'\)/);
  const reviewAt = entry.indexOf('expanseWorldMode.review({ explicitUserAction: true })');
  const enterAt = entry.indexOf('runtime.enterExpanse({ explicitUserAction: true })');
  assert.ok(reviewAt >= 0 && enterAt > reviewAt, 'direct Storm must prepare the maintained Expanse review before canonical entry');
  assert.match(entry, /signalCampaignCompletionRequired: false/);
  assert.match(entry, /grantsXp: false/);

  const interaction = between(runtime, "        const reviewOnlyStorm = !expanseState.futureRegionActivation", "        const result = expanseStormSectorMissions.recordAction");
  assert.match(interaction, /'direct-review-read-only'/);
  assert.match(interaction, /mutatesMissionState: false/);
  assert.match(interaction, /persistsProgression: false/);
});

test('RT90 certified Storm authority outranks the temporary review projection', () => {
  const availability = between(runtime, '  function getOpenWorldAvailability() {', '  function showExpanseZoneArrival(');
  const certifiedAt = availability.indexOf('if (publicAvailability?.stormSector?.available === true) return publicAvailability');
  const reviewAt = availability.indexOf('projectEonCityL95OwnerReviewAvailability(publicAvailability, stormReviewActivation)');
  assert.ok(certifiedAt >= 0 && reviewAt > certifiedAt);
});

test('RT90 My Frontier holds optional assets through the first canonical rendered frame', () => {
  const mount = between(runtime, '  let myFrontierOptionalAssetsHeldForFirstFrame = false;', '  let myFrontierEntryAwaitingFirstFrame = false;');
  assert.match(mount, /pressure: 'critical'/);
  assert.match(mount, /reason: 'my-frontier-first-frame'/);
  assert.doesNotMatch(mount, /expanseMyFrontierRenderer\.apply\(getCurrentMyFrontierVisualPayload\(\)\)/);

  const firstFrame = between(runtime, "    if (myFrontierEntryAwaitingFirstFrame && expanseWorldMode.getState().mode === 'EXPANSE_ACTIVE'", '    movementRenderRecovery?.noteSceneRender');
  assert.match(firstFrame, /myFrontierEntryAwaitingFirstFrame = false/);
  assert.match(firstFrame, /setOptionalAssetAdmission\?\.\(pendingOptionalAssetAdmission\)/);

  const admission = between(runtime, '    setOptionalAssetAdmission(options = {}) {', '    applyWorkloadProtection(');
  assert.match(admission, /myFrontierOptionalAssetsHeldForFirstFrame/);
  assert.match(admission, /reason: 'my-frontier-first-frame-gate'/);
});

test('RT90 My Frontier removes per-frame composition validation and bounds optional composition loads', () => {
  const update = between(renderer, '    update(at = ceremonyClock(), playerPosition = null) {', '    reactResident(');
  assert.doesNotMatch(update, /applyCompositionValidation\(\)/);
  assert.match(renderer, /mountEonExpanseW770CBuildingCompositionPresenter\(\{ scene, plotNodes, assetAdmission \}\)/);
  assert.match(renderer, /buildingCompositionPresenter\?\.setOptionalAssetAdmission/);

  assert.match(compositions, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(compositions, /const maxConcurrentLoads = 1/);
  assert.match(compositions, /optionalConcurrencyLimit/);
  assert.match(compositions, /status: 'queued-authored-composition-part'/);
  assert.match(compositions, /setOptionalAssetAdmission\(options = \{\}\)/);
});

test('RT90 keeps Signal UI responsive while reducing heavy non-Signal synchronization work', () => {
  assert.match(runtime, /const expanseUiSyncIntervalMs = expanseActiveRegionId === 'signal-frontier' \? 100 : 220/);
});
