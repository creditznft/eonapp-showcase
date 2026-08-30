import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolveEonCityW719KeyboardCode } from '../../assets/js/city/w719/eon-city-w719-input-authority.js';
import { buildEonCityRt91SurfaceSafety, validateEonCityRt91SurfaceSafety } from '../../assets/js/city/rt91/eon-city-rt91-surface-safety.js';
import { resolveEonCityRt91UseIntent, validateEonCityRt91UseIntent } from '../../assets/js/city/rt91/eon-city-rt91-use-action.js';
import { resolveEonCityRt91ObjectiveScreenPlacement, validateEonCityRt91CameraOcclusionContract } from '../../assets/js/city/rt91/eon-city-rt91-camera-occlusion-contract.js';
import { buildEonCityRt91AccessibilityConvergence, validateEonCityRt91AccessibilityConvergence } from '../../assets/js/city/rt91/eon-city-rt91-accessibility-convergence.js';
import { buildEonCityRt91MobileLayout, validateEonCityRt91MobileLayout } from '../../assets/js/city/rt91/eon-city-rt91-mobile-layout.js';
import { buildEonCityRt91SoundscapeConvergence, validateEonCityRt91SoundscapeConvergence } from '../../assets/js/city/rt91/eon-city-rt91-soundscape-convergence.js';
import {
  EON_CITY_RT91_SESSION_SAVE_SCHEMA,
  sanitizeEonCityRt91SessionSave,
  migrateEonCityRt91SessionSave,
  hydrateEonCityRt91CampaignInitialStates,
  validateEonCityRt91SessionSave,
  createEonCityRt91SessionPersistence
} from '../../assets/js/city/rt91/eon-city-rt91-session-save.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

test('RT91 canonical Use action accepts KeyboardEvent.code KeyE even when key is layout-dependent', () => {
  assert.equal(resolveEonCityW719KeyboardCode({ code: 'KeyE', key: 'Dead' }), 'KeyE');
  assert.equal(resolveEonCityW719KeyboardCode({ code: '', key: 'e' }), 'KeyE');
  for (const event of [{ code: 'KeyE', key: 'Dead' }, { code: '', key: 'E' }]) {
    const intent = resolveEonCityRt91UseIntent({ source: 'keyboard', event });
    assert.equal(validateEonCityRt91UseIntent(intent).ok, true);
    assert.equal(intent.accepted, true);
    assert.equal(intent.semanticAction, 'interact');
  }
});

test('W731 maintained runtime routes E through canonical code and suppresses held-key repeat', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /if \(keyboardCode === 'KeyE' && event\.repeat !== true\) \{/);
  assert.doesNotMatch(source, /if \(event\.key === 'e' \|\| event\.key === 'E'\) \{/);
  assert.match(source, /interactNearestExpanseAction\(\{ explicitUserAction: true, source: 'keyboard-e' \}\)/);
  assert.match(source, /activateResolvedHubInteraction\(nearest, \{ source: 'keyboard-e'/);
});

test('RT91 Use action rejects repeats, editable targets, locks and non-owning modal input', () => {
  const cases = [
    resolveEonCityRt91UseIntent({ event: { code: 'KeyE', repeat: true } }),
    resolveEonCityRt91UseIntent({ event: { code: 'KeyE', target: { tagName: 'INPUT' } } }),
    resolveEonCityRt91UseIntent({ event: { code: 'KeyE' }, inputLocked: true }),
    resolveEonCityRt91UseIntent({ event: { code: 'KeyE' }, modalOpen: true, modalOwnsAction: false })
  ];
  assert.deepEqual(cases.map((row) => row.accepted), [false, false, false, false]);
  assert.deepEqual(cases.map((row) => row.reason), ['repeat-suppressed', 'editable-target', 'input-locked', 'modal-owns-input']);
});

test('RT91 touch/controller converge on the same explicit interact semantic', () => {
  for (const source of ['touch', 'controller']) {
    const intent = resolveEonCityRt91UseIntent({ source, action: 'interact' });
    assert.equal(intent.accepted, true);
    assert.equal(intent.semanticAction, 'interact');
    assert.equal(intent.explicitUserAction, true);
  }
});

test('RT91 surface safety preserves one modal/focus owner and non-colliding HUD on desktop and short landscape', () => {
  for (const input of [{ width: 1280, height: 720, coarsePointer: false }, { width: 844, height: 390, coarsePointer: true }]) {
    const plan = buildEonCityRt91SurfaceSafety(input);
    const result = validateEonCityRt91SurfaceSafety(plan);
    assert.equal(result.ok, true, result.errors.join(', '));
    assert.equal(plan.modalPolicy.oneVisibleModal, true);
    assert.equal(plan.hudPolicy.multipleBottomRightFloatOwnersAllowed, false);
    assert.equal(plan.hudPolicy.primaryActionOcclusionAllowed, false);
  }
});

test('RT91 objective label placement avoids the player-safe screen region', () => {
  const plan = resolveEonCityRt91ObjectiveScreenPlacement({
    width: 1280,
    height: 720,
    desiredRect: { left: 520, right: 800, top: 300, bottom: 370 },
    playerRect: { left: 500, right: 780, top: 260, bottom: 650 }
  });
  const result = validateEonCityRt91CameraOcclusionContract(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.avoidsPlayer, true);
  assert.equal(plan.actualBabylonVisualProofRequired, true);
});

test('RT91 accessibility convergence preserves keyboard/touch/controller parity and no automatic device actions', () => {
  const plan = buildEonCityRt91AccessibilityConvergence({ width: 844, height: 390, coarsePointer: true, preferences: { reducedMotion: true, reducedSensory: true, highContrast: true } });
  const result = validateEonCityRt91AccessibilityConvergence(plan);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(plan.keyboardUse, 'KeyE');
  assert.equal(plan.touchUse, 'interact');
  assert.equal(plan.controllerUse, 'interact');
  assert.ok(plan.minimumTouchTargetPx >= 48);
  assert.equal(plan.noAutomaticAudio && plan.noAutomaticFullscreen && plan.noAutomaticOrientationLock && plan.noAutomaticNavigation, true);
});

test('RT91 mobile layouts keep three peer world cards and 48px controls without auto fullscreen/orientation', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1024, height: 768 }]) {
    const plan = buildEonCityRt91MobileLayout({ ...viewport, coarsePointer: true });
    const result = validateEonCityRt91MobileLayout(plan);
    assert.equal(result.ok, true, `${viewport.width}x${viewport.height}:${result.errors.join(',')}`);
    assert.equal(plan.openWorldCardPeerCount, 3);
    assert.ok(plan.minimumTouchTargetPx >= 48);
  }
});

test('RT91 soundscape allows only one audible world and suspends all hidden-world layers', () => {
  for (const worldId of ['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']) {
    const plan = buildEonCityRt91SoundscapeConvergence({ currentWorldId: worldId, preferences: { muted: false, captions: true }, zoneId: 'proof-zone', missionId: 'proof-mission' });
    const result = validateEonCityRt91SoundscapeConvergence(plan);
    assert.equal(result.ok, true, `${worldId}:${result.errors.join(',')}`);
    assert.equal(plan.hiddenWorldsSuspended, true);
    assert.equal(plan.ownsAudioContext || plan.ownsTimer || plan.networkRequestCreated, false);
  }
});

test('RT91 session save sanitizes all three new campaign snapshots without storing receipt payloads or legacy authority', () => {
  const session = sanitizeEonCityRt91SessionSave({
    livingFrontier: { currentWorldId: 'storm-sector', worldSeed: 'owner-proof' },
    campaigns: {
      signalMastery: { processedReceiptIds: ['sig-receipt-1', '<private payload>'], completedMissionIds: ['not-a-real-mission'] },
      stormCampaign: { processedReceiptIds: ['storm-receipt-1'], completedMissionIds: ['not-a-real-mission'] },
      myFrontierDistricts: { processedReceiptIds: ['frontier-receipt-1'], completedMissionIds: ['not-a-real-mission'] }
    }
  });
  const result = validateEonCityRt91SessionSave(session);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(session.schema, EON_CITY_RT91_SESSION_SAVE_SCHEMA);
  assert.equal(session.livingFrontier.currentWorldId, 'storm-sector');
  assert.equal(session.campaigns.signalMastery.processedReceiptIds.includes('<private payload>'), false);
  assert.deepEqual(session.campaigns.signalMastery.completedMissionIds, []);
  assert.equal(session.privateContentStored || session.rawPromptStored || session.rawFileContentStored || session.credentialsStored || session.receiptPayloadStored, false);
  assert.equal(session.writesLegacySignalCampaign || session.writesStormFoundation || session.writesMyFrontierConstruction || session.ownsXpAuthority || session.ownsUnlockAuthority, false);
});

test('RT91 session save migrates the existing v1 Living Frontier envelope without mutating its schema', () => {
  const migrated = migrateEonCityRt91SessionSave({ schema: 'eon.city.living-frontier-save.rt91.v1', version: 1, currentWorldId: 'my-frontier', worldSeed: 'old-v1', completedContractIds: ['contract:one'] });
  assert.equal(validateEonCityRt91SessionSave(migrated).ok, true);
  assert.equal(migrated.livingFrontier.schema, 'eon.city.living-frontier-save.rt91.v1');
  assert.equal(migrated.livingFrontier.currentWorldId, 'my-frontier');
  const hydrated = hydrateEonCityRt91CampaignInitialStates(migrated);
  assert.equal(hydrated.signalMastery.activeMissionId, '');
  assert.equal(hydrated.stormCampaign.activeMissionId, '');
  assert.equal(hydrated.myFrontierDistricts.activeMissionId, '');
});

test('RT91 local session persistence round-trips sanitized data and requires explicit action to clear', () => {
  const storage = memoryStorage();
  const persistence = createEonCityRt91SessionPersistence({ storage, now: () => 123456 });
  assert.equal(persistence.load().found, false);
  const saved = persistence.save({ livingFrontier: { currentWorldId: 'signal-frontier' }, campaigns: { signalMastery: { processedReceiptIds: ['receipt:one'] } } });
  assert.equal(saved.ok, true);
  assert.equal(saved.session.updatedAt, 123456);
  const loaded = persistence.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.found, true);
  assert.equal(loaded.session.livingFrontier.currentWorldId, 'signal-frontier');
  assert.deepEqual(loaded.session.campaigns.signalMastery.processedReceiptIds, ['receipt:one']);
  assert.equal(persistence.clear().ok, false);
  assert.equal(persistence.clear({ explicitUserAction: true }).ok, true);
  assert.equal(persistence.load().found, false);
});

test('RT91 Phase-F additive modules own no Babylon engine/scene/render loop, fetch or legacy progression writer', () => {
  const names = [
    '../../assets/js/city/rt91/eon-city-rt91-surface-safety.js',
    '../../assets/js/city/rt91/eon-city-rt91-use-action.js',
    '../../assets/js/city/rt91/eon-city-rt91-camera-occlusion-contract.js',
    '../../assets/js/city/rt91/eon-city-rt91-accessibility-convergence.js',
    '../../assets/js/city/rt91/eon-city-rt91-mobile-layout.js',
    '../../assets/js/city/rt91/eon-city-rt91-soundscape-convergence.js',
    '../../assets/js/city/rt91/eon-city-rt91-session-save.js'
  ];
  for (const name of names) {
    const source = fs.readFileSync(new URL(name, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/, name);
    assert.doesNotMatch(source, /runRenderLoop\s*\(/, name);
    assert.doesNotMatch(source, /\bfetch\s*\(/, name);
  }
});
