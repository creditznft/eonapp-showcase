import assert from 'node:assert/strict';
import fs from 'node:fs';

import { validateEonCityRt91FlagshipWorldContract } from '../assets/js/city/rt91/eon-city-rt91-flagship-world-contract.js';
import { buildEonCityRt91ContentPerformanceBudget, validateEonCityRt91ContentPerformanceBudget } from '../assets/js/city/rt91/eon-city-rt91-content-performance-budget.js';
import { getEonCityRt91FoundationInventory, validateEonCityRt91FoundationInventory } from '../assets/js/city/rt91/eon-city-rt91-foundation-inventory.js';
import { validateEonCityRt91MissionGrammar } from '../assets/js/city/rt91/eon-city-rt91-mission-grammar.js';
import { validateEonCityRt91DynamicEventFamilies } from '../assets/js/city/rt91/eon-city-rt91-dynamic-event-director.js';
import { buildEonCityRt91TravelTransition, validateEonCityRt91TravelTransition } from '../assets/js/city/rt91/eon-city-rt91-travel-transition.js';
import { sanitizeEonCityRt91SaveEnvelope, validateEonCityRt91SaveEnvelope } from '../assets/js/city/rt91/eon-city-rt91-save-envelope.js';
import { createEonCityRt91InteractionRegistry, defineEonCityRt91Interaction, validateEonCityRt91InteractionRegistry } from '../assets/js/city/rt91/eon-city-rt91-interaction-registry.js';
import { buildEonCityRt91SignalFlagshipProjection, validateEonCityRt91SignalFlagshipProjection } from '../assets/js/city/rt91/signal/eon-city-rt91-signal-flagship.js';
import { validateEonCityRt91SignalZoneMastery } from '../assets/js/city/rt91/signal/eon-city-rt91-signal-zone-mastery.js';
import { buildEonCityRt91StormFlagshipProjection, validateEonCityRt91StormFlagshipProjection } from '../assets/js/city/rt91/storm/eon-city-rt91-storm-flagship.js';
import { validateEonCityRt91StormCampaign } from '../assets/js/city/rt91/storm/eon-city-rt91-storm-campaign.js';
import { buildEonCityRt91MyFrontierFlagshipProjection, validateEonCityRt91MyFrontierFlagshipProjection } from '../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-flagship.js';
import { validateEonCityRt91MyFrontierDistrictMissions } from '../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-missions.js';
import { buildEonCityRt91SurfaceSafety, validateEonCityRt91SurfaceSafety } from '../assets/js/city/rt91/eon-city-rt91-surface-safety.js';
import { resolveEonCityRt91UseIntent, validateEonCityRt91UseIntent } from '../assets/js/city/rt91/eon-city-rt91-use-action.js';
import { resolveEonCityRt91ObjectiveScreenPlacement, validateEonCityRt91CameraOcclusionContract } from '../assets/js/city/rt91/eon-city-rt91-camera-occlusion-contract.js';
import { buildEonCityRt91AccessibilityConvergence, validateEonCityRt91AccessibilityConvergence } from '../assets/js/city/rt91/eon-city-rt91-accessibility-convergence.js';
import { buildEonCityRt91MobileLayout, validateEonCityRt91MobileLayout } from '../assets/js/city/rt91/eon-city-rt91-mobile-layout.js';
import { buildEonCityRt91SoundscapeConvergence, validateEonCityRt91SoundscapeConvergence } from '../assets/js/city/rt91/eon-city-rt91-soundscape-convergence.js';
import { sanitizeEonCityRt91SessionSave, validateEonCityRt91SessionSave } from '../assets/js/city/rt91/eon-city-rt91-session-save.js';
import { createEonCityRt91RuntimeIntegration } from '../assets/js/city/rt91/eon-city-rt91-runtime-integration.js';
import { buildEonCityRt91AiGuidanceEnvelope, validateEonCityRt91AiGuidanceEnvelope } from '../assets/js/city/rt91/eon-city-rt91-ai-guidance-contract.js';
import { getEonCityRt91ContinuityTruth, validateEonCityRt91ContinuityTruth } from '../assets/js/city/rt91/eon-city-rt91-continuity-contract.js';

const flagship = validateEonCityRt91FlagshipWorldContract();
assert.equal(flagship.ok, true, flagship.errors.join(', '));
const inventory = validateEonCityRt91FoundationInventory(getEonCityRt91FoundationInventory());
assert.equal(inventory.ok, true, inventory.errors.join(', '));
const grammar = validateEonCityRt91MissionGrammar();
assert.equal(grammar.ok, true, grammar.errors.join(', '));
const events = validateEonCityRt91DynamicEventFamilies();
assert.equal(events.ok, true, events.errors.join(', '));
for (const quality of ['lite', 'balanced', 'cinematic']) {
  for (const worldId of ['signal-frontier', 'storm-sector', 'my-frontier']) {
    const plan = buildEonCityRt91ContentPerformanceBudget({ quality, worldId });
    const result = validateEonCityRt91ContentPerformanceBudget(plan);
    assert.equal(result.ok, true, `${quality}/${worldId}: ${result.errors.join(', ')}`);
  }
}
for (const [fromWorldId, toWorldId] of [['command-hub', 'signal-frontier'], ['signal-frontier', 'storm-sector'], ['storm-sector', 'my-frontier'], ['my-frontier', 'command-hub']]) {
  const travel = buildEonCityRt91TravelTransition({ fromWorldId, toWorldId });
  const result = validateEonCityRt91TravelTransition(travel);
  assert.equal(result.ok, true, `${fromWorldId}->${toWorldId}: ${result.errors.join(', ')}`);
}
const save = sanitizeEonCityRt91SaveEnvelope({ currentWorldId: 'command-hub' });
assert.equal(validateEonCityRt91SaveEnvelope(save).ok, true);
const registry = createEonCityRt91InteractionRegistry([
  defineEonCityRt91Interaction({ id: 'gate-proof-interaction', worldId: 'command-hub', label: 'Gate proof', action: 'review-gate-proof', prompt: 'Review gate proof', range: 2.5, authority: 'rt91-source-gate' })
]);
assert.equal(validateEonCityRt91InteractionRegistry(registry).ok, true);

const signalFlagship = buildEonCityRt91SignalFlagshipProjection({ quality: 'balanced', worldSeed: 91 });
const signalFlagshipValidation = validateEonCityRt91SignalFlagshipProjection(signalFlagship);
assert.equal(signalFlagshipValidation.ok, true, signalFlagshipValidation.errors.join(', '));
const signalMastery = validateEonCityRt91SignalZoneMastery();
assert.equal(signalMastery.ok, true, signalMastery.errors.join(', '));
const stormFlagship = buildEonCityRt91StormFlagshipProjection({ quality: 'balanced', worldSeed: 91, at: 100000 });
const stormFlagshipValidation = validateEonCityRt91StormFlagshipProjection(stormFlagship);
assert.equal(stormFlagshipValidation.ok, true, stormFlagshipValidation.errors.join(', '));
const stormCampaign = validateEonCityRt91StormCampaign();
assert.equal(stormCampaign.ok, true, stormCampaign.errors.join(', '));
const myFrontierFlagship = buildEonCityRt91MyFrontierFlagshipProjection({ quality: 'balanced', worldSeed: 'rt91-gate', cycleKey: 'gate', myFrontierState: { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop' } }, focusDistrict: 'creator' });
const myFrontierFlagshipValidation = validateEonCityRt91MyFrontierFlagshipProjection(myFrontierFlagship);
assert.equal(myFrontierFlagshipValidation.ok, true, myFrontierFlagshipValidation.errors.join(', '));
const myFrontierDistrictMissions = validateEonCityRt91MyFrontierDistrictMissions();
assert.equal(myFrontierDistrictMissions.ok, true, myFrontierDistrictMissions.errors.join(', '));

const phaseFSurfaces = buildEonCityRt91SurfaceSafety({ width: 844, height: 390, coarsePointer: true, modalOpen: true });
assert.equal(validateEonCityRt91SurfaceSafety(phaseFSurfaces).ok, true);
const phaseFUse = resolveEonCityRt91UseIntent({ source: 'keyboard', event: { code: 'KeyE', key: 'Dead' } });
assert.equal(validateEonCityRt91UseIntent(phaseFUse).ok, true);
assert.equal(phaseFUse.accepted, true);
const phaseFCamera = resolveEonCityRt91ObjectiveScreenPlacement({ width: 844, height: 390, desiredRect: { left: 320, right: 570, top: 150, bottom: 210 }, playerRect: { left: 300, right: 550, top: 120, bottom: 360 } });
assert.equal(validateEonCityRt91CameraOcclusionContract(phaseFCamera).ok, true);
const phaseFA11y = buildEonCityRt91AccessibilityConvergence({ width: 844, height: 390, coarsePointer: true, preferences: { reducedMotion: true } });
assert.equal(validateEonCityRt91AccessibilityConvergence(phaseFA11y).ok, true);
const phaseFMobile = buildEonCityRt91MobileLayout({ width: 844, height: 390, coarsePointer: true });
assert.equal(validateEonCityRt91MobileLayout(phaseFMobile).ok, true);
const phaseFAudio = buildEonCityRt91SoundscapeConvergence({ currentWorldId: 'storm-sector', preferences: { muted: false, captions: true } });
assert.equal(validateEonCityRt91SoundscapeConvergence(phaseFAudio).ok, true);
const phaseFSession = sanitizeEonCityRt91SessionSave({ livingFrontier: { currentWorldId: 'command-hub' } });
assert.equal(validateEonCityRt91SessionSave(phaseFSession).ok, true);
const phaseGContinuity = getEonCityRt91ContinuityTruth();
assert.equal(validateEonCityRt91ContinuityTruth(phaseGContinuity).ok, true);
const phaseGAiGuidance = buildEonCityRt91AiGuidanceEnvelope({ worldRegionId: 'my-frontier', missionId: 'district:systems:verify-local-ai', objectiveId: 'review-local-ai', nextAction: 'Complete the Local AI self-test.' });
assert.equal(validateEonCityRt91AiGuidanceEnvelope(phaseGAiGuidance).ok, true);
assert.equal(Object.hasOwn(phaseGAiGuidance, 'target'), false);
assert.equal(Object.hasOwn(phaseGAiGuidance, 'position'), false);

const liveStorageMap = new Map();
const liveIntegration = createEonCityRt91RuntimeIntegration({
  storage: { getItem: (key) => liveStorageMap.get(key) || null, setItem: (key, value) => liveStorageMap.set(key, String(value)), removeItem: (key) => liveStorageMap.delete(key) },
  getSignalState: () => ({ completedMissions: ['companion-in-the-static', 'beyond-the-gate', 'first-light', 'echoes-in-the-archive', 'the-broken-line', 'horizon-reconnected', 'the-first-reveal'] }),
  getStormFoundationState: () => null,
  getMyFrontierState: () => ({ unlocked: true, buildingChoices: {} })
});
const liveSummary = liveIntegration.getSummary();
assert.equal(liveSummary.ownsBabylonEngine || liveSummary.ownsScene || liveSummary.ownsRenderLoop || liveSummary.ownsXpAuthority || liveSummary.ownsUnlockAuthority || liveSummary.networkRequestCreated, false);
const w731Source = fs.readFileSync(new URL('../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const aiRuntimeSource = fs.readFileSync(new URL('../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
assert.equal((w731Source.match(/createEonCityRt91RuntimeIntegration\s*\(/g) || []).length, 1);
assert.match(w731Source, /playerPosition:\s*playerAnchor\.position/);
assert.equal((w731Source.match(/engine\.runRenderLoop\s*\(/g) || []).length, 1);
assert.match(aiRuntimeSource, /isLocalProvider\(provider\)[\s\S]{0,500}beginEonLocalAgentTheatreJob/);
assert.match(aiRuntimeSource, /userInitiated:\s*runtimeSettings\.requestContext\?\.userInitiated\s*===\s*true/);

console.log(JSON.stringify({
  ok: true,
  schema: 'eon.city.flagship-source-gate.rt91.v2',
  flagshipWorlds: flagship.worldCount,
  contentLayers: flagship.contentLayerCount,
  existingFoundation: {
    signalZones: inventory.inventory.signalFrontier.zoneCount,
    signalCampaignMissions: inventory.inventory.signalFrontier.campaignMissionCount,
    stormMissionFamilies: inventory.inventory.stormSector.missionFamilyCount,
    myFrontierDistrictPlots: inventory.inventory.myFrontier.districtPlotCount,
    deterministicCombinationSpace: inventory.inventory.shared.worldGrammarCombinationSpace
  },
  missionFamilies: grammar.familyCount,
  dynamicEventFamilies: events.eventFamilyCount,
  saveSchema: save.schema,
  signalFlagship: { zoneMasteryMissions: signalMastery.missionCount, contractCells: signalFlagshipValidation.contractCellCount, firstFrameAssetDelta: signalFlagship.firstFrameAssetDelta },
  stormFlagship: { campaignMissions: stormCampaign.missionCount, campaignObjectives: stormCampaign.objectiveCount, contractCells: stormFlagshipValidation.contractCellCount, firstFrameAssetDelta: stormFlagship.firstFrameAssetDelta },
  myFrontierFlagship: { districtMissions: myFrontierDistrictMissions.missionCount, districtObjectives: myFrontierDistrictMissions.objectiveCount, contractCells: myFrontierFlagshipValidation.contractCellCount, firstFrameAssetDelta: myFrontierFlagship.firstFrameAssetDelta },
  phaseFPolish: { canonicalUse: phaseFUse.keyboardCode, shortLandscape: phaseFMobile.shortLandscape, oneVisibleModal: phaseFSurfaces.modalPolicy.oneVisibleModal, objectiveAvoidsPlayer: phaseFCamera.avoidsPlayer, sessionSchema: phaseFSession.schema },
  liveRuntimeIntegration: { mountedInW731: true, singleRenderLoop: true, callerCannotSupplyPlayerPosition: true, ownsBabylonAuthority: false, sessionRestoredLocally: liveSummary.sessionRestored },
  phaseGContinuity: { criticalRecoveryKeys: phaseGContinuity.criticalRecoveryCount, updateSafe: phaseGContinuity.allCriticalUpdateSafe, recoverable: phaseGContinuity.allCriticalRecoverable, agentTheatreLocalAiBridge: true },
  deviceCertified: false,
  realGpuProofRequired: true
}, null, 2));
