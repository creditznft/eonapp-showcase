/**
 * RT91 live adapter — mounts the additive flagship campaigns into the maintained
 * W731 runtime without taking Babylon, movement, legacy XP/unlock or world-entry authority.
 */
import { createEonCityRt91SessionPersistence, hydrateEonCityRt91CampaignInitialStates, sanitizeEonCityRt91SessionSave } from './eon-city-rt91-session-save.js';
import { createEonCityRt91SignalMasteryRuntime } from './signal/eon-city-rt91-signal-mastery-runtime.js';
import { createEonCityRt91StormCampaignRuntime } from './storm/eon-city-rt91-storm-campaign-runtime.js';
import { createEonCityRt91MyFrontierDistrictMissionRuntime } from './my-frontier/eon-city-rt91-my-frontier-district-mission-runtime.js';
import { buildEonCityRt91MissionBoard } from './eon-city-rt91-mission-board.js';
import { resolveEonCityRt91NextAction } from './eon-city-rt91-next-action.js';
import { buildEonCityRt91HudMapProjection } from './eon-city-rt91-hud-map-consolidation.js';
import { buildEonCityRt91SignalMasteryTargets } from './signal/eon-city-rt91-signal-mastery-targets.js';
import { buildEonCityRt91StormCampaignTargets } from './storm/eon-city-rt91-storm-campaign-targets.js';
import { buildEonCityRt91MyFrontierDistrictMissionTargets } from './my-frontier/eon-city-rt91-my-frontier-district-mission-targets.js';
import { createEonCityRt91LiveContractDirector } from './eon-city-rt91-live-contract-director.js';
import { createEonCityRt91RepeatableContractRuntime } from './eon-city-rt91-repeatable-contract-runtime.js';
import { appendEonCityRt91ActivityHistory } from './eon-city-rt91-anti-repetition.js';
import { buildEonCityRt91AiGuidanceEnvelope } from './eon-city-rt91-ai-guidance-contract.js';

export const EON_CITY_RT91_RUNTIME_INTEGRATION_SCHEMA = 'eon.city.runtime-integration.rt91.v1';
const freeze = Object.freeze;
const WORLDS = new Set(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']);
const WORLD_LABELS = freeze({ 'command-hub': 'Command Hub', 'signal-frontier': 'Signal Frontier', 'storm-sector': 'Storm Sector', 'my-frontier': 'My Frontier' });
const TARGETS = freeze({
  'signal-frontier': buildEonCityRt91SignalMasteryTargets().targets,
  'storm-sector': buildEonCityRt91StormCampaignTargets().targets,
  'my-frontier': buildEonCityRt91MyFrontierDistrictMissionTargets().targets
});

function distance2d(a = {}, b = {}) { return Math.hypot(Number(a?.x || 0) - Number(b?.x || 0), Number(a?.z || 0) - Number(b?.z || 0)); }
function safeWorldId(value = '') { return WORLDS.has(String(value || '')) ? String(value) : 'command-hub'; }
function categoryFor(row = {}) {
  if (row.kind === 'zone-mastery') return 'Signal Mastery';
  if (row.kind === 'storm-living-campaign') return 'Storm Campaign';
  if (row.kind === 'district-story') return 'District Story';
  if (row.kind === 'repeatable-contract') return 'Frontier Contract';
  return 'Flagship';
}

export function createEonCityRt91RuntimeIntegration({
  storage = null,
  now = () => Date.now(),
  getSignalState = () => null,
  getStormFoundationState = () => null,
  getMyFrontierState = () => null,
  getGeneratedContracts = () => [],
  getProductiveMissions = () => [],
  getWorldSeed = () => 'eoncity-living-frontier',
  verifyProductiveReceipt = null,
  onChange = null
} = {}) {
  const persistence = createEonCityRt91SessionPersistence({ storage, now });
  const loaded = persistence.load();
  let session = sanitizeEonCityRt91SessionSave(loaded?.session || {});
  let currentWorldId = safeWorldId(session.livingFrontier.currentWorldId);
  const hydrated = hydrateEonCityRt91CampaignInitialStates(session);
  let signalRuntime = null;
  let stormRuntime = null;
  let frontierRuntime = null;
  let repeatableRuntime = null;
  const contractDirector = createEonCityRt91LiveContractDirector({
    worldSeed: String(getWorldSeed?.() || session.livingFrontier.worldSeed || 'eoncity-living-frontier'),
    now,
    getHistory: () => session.livingFrontier.contractHistory || []
  });
  const issuedObjectiveReceipts = new Map();
  let receiptSequence = 0;

  const verifyObjectiveReceipt = ({ mission, objective, receipt }) => {
    const id = String(receipt?.id || '');
    const issued = issuedObjectiveReceipts.get(id);
    if (!id || !issued) return freeze({ ok: false, reason: 'rt91-objective-receipt-not-issued' });
    if (issued.worldId !== mission.worldId || issued.missionId !== mission.id || issued.objectiveId !== objective.id) return freeze({ ok: false, reason: 'rt91-objective-receipt-mismatch' });
    issuedObjectiveReceipts.delete(id);
    return freeze({ ok: true, receipt: freeze({ id, kind: issued.kind, worldId: issued.worldId, missionId: issued.missionId, objectiveId: issued.objectiveId, issuedAt: issued.issuedAt }), privateContentStored: false });
  };

  const persist = (reason = 'state-change') => {
    session = sanitizeEonCityRt91SessionSave({
      ...session,
      livingFrontier: { ...session.livingFrontier, worldSeed: String(getWorldSeed?.() || session.livingFrontier.worldSeed || 'eoncity-living-frontier'), currentWorldId, updatedAt: now() },
      campaigns: {
        signalMastery: signalRuntime?.getState?.() || hydrated.signalMastery,
        stormCampaign: stormRuntime?.getState?.() || hydrated.stormCampaign,
        myFrontierDistricts: frontierRuntime?.getState?.() || hydrated.myFrontierDistricts
      },
      repeatableContract: repeatableRuntime?.getActiveContract?.() || null,
      updatedAt: now()
    });
    const stored = persistence.save(session);
    onChange?.(freeze({ reason, session, stored: stored.ok === true, currentWorldId }));
    return stored;
  };

  signalRuntime = createEonCityRt91SignalMasteryRuntime({ initial: hydrated.signalMastery, getSignalState, verifyObjectiveReceipt, onChange: () => persist('signal-mastery-change') });
  stormRuntime = createEonCityRt91StormCampaignRuntime({ initial: hydrated.stormCampaign, getFoundationState: getStormFoundationState, verifyObjectiveReceipt, onChange: () => persist('storm-campaign-change') });
  frontierRuntime = createEonCityRt91MyFrontierDistrictMissionRuntime({ initial: hydrated.myFrontierDistricts, getMyFrontierState, verifyObjectiveReceipt, onChange: () => persist('my-frontier-district-change') });
  repeatableRuntime = createEonCityRt91RepeatableContractRuntime({
    initialActiveContract: session.repeatableContract,
    now,
    getOffers: () => contractDirector.getOffers(),
    verifyObjectiveReceipt,
    onChange: () => persist('repeatable-contract-change')
  });

  const getMissionInputs = () => freeze({
    signalState: getSignalState?.() || null,
    signalMasteryState: signalRuntime.getState(),
    stormState: getStormFoundationState?.() || null,
    stormCampaignState: stormRuntime.getState(),
    myFrontierState: getMyFrontierState?.() || null,
    myFrontierDistrictMissionState: frontierRuntime.getState()
  });
  const getLiveContractOffers = () => repeatableRuntime.getView().offers;
  const getMissionBoard = () => {
    const combinedContracts = [...getLiveContractOffers(), ...(getGeneratedContracts?.() || [])];
    const seen = new Set();
    const generatedContracts = combinedContracts.filter((entry) => { const id = String(entry?.template?.id || ''); if (!id || seen.has(id)) return false; seen.add(id); return true; });
    return buildEonCityRt91MissionBoard({ ...getMissionInputs(), generatedContracts, productiveMissions: getProductiveMissions?.() || [] });
  };
  const getGlobalActiveMission = () => {
    const authored = [
      ['signal-frontier', signalRuntime.getView().activeMission],
      ['storm-sector', stormRuntime.getView().activeMission],
      ['my-frontier', frontierRuntime.getView().activeMission]
    ].find(([, row]) => row);
    if (authored) return freeze({ worldId: authored[0], missionId: authored[1].id, kind: 'authored', row: authored[1] });
    const repeatable = repeatableRuntime.getActiveContract();
    return repeatable ? freeze({ worldId: repeatable.worldId, missionId: repeatable.id, kind: 'repeatable-contract', row: repeatable }) : null;
  };
  const runtimeForMission = (missionId = '') => {
    const id = String(missionId || '');
    for (const [worldId, runtime] of [['signal-frontier', signalRuntime], ['storm-sector', stormRuntime], ['my-frontier', frontierRuntime]]) {
      const row = runtime.getView().missions.find((entry) => entry.id === id);
      if (row) return freeze({ worldId, runtime, row });
    }
    return null;
  };
  const activeRowForWorld = (worldId = currentWorldId) => {
    const targetWorld = safeWorldId(worldId);
    const runtime = targetWorld === 'signal-frontier' ? signalRuntime : targetWorld === 'storm-sector' ? stormRuntime : targetWorld === 'my-frontier' ? frontierRuntime : null;
    return runtime?.getView?.().activeMission || null;
  };
  const getActiveTarget = (worldId = currentWorldId) => {
    const targetWorld = safeWorldId(worldId);
    const active = activeRowForWorld(targetWorld);
    const objective = active?.activeObjective;
    const target = active && objective ? (TARGETS[targetWorld] || []).find((entry) => entry.missionId === active.id && entry.objectiveId === objective.id) || null : null;
    if (target) return freeze({ ...target, worldId: targetWorld, missionLabel: active.label, objectiveLabel: objective.label || target.label, targetId: `rt91:${active.id}:${objective.id}`, primaryObjective: true });
    const repeatableTarget = repeatableRuntime?.getActiveTarget?.() || null;
    return repeatableTarget?.worldId === targetWorld ? freeze({ ...repeatableTarget, primaryObjective: true }) : null;
  };

  const setCurrentWorld = (worldId = 'command-hub', { persistState = true, reason = 'world-change' } = {}) => {
    currentWorldId = safeWorldId(worldId);
    if (persistState) persist(reason);
    return freeze({ ok: true, currentWorldId, label: WORLD_LABELS[currentWorldId], writesLegacyAuthority: false });
  };
  const startMission = (missionId = '', { explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const id = String(missionId || '');
    const alreadyActive = getGlobalActiveMission();
    if (alreadyActive && alreadyActive.missionId !== id) return freeze({ ok: false, reason: 'rt91-another-mission-active', activeMissionId: alreadyActive.missionId, activeWorldId: alreadyActive.worldId });
    if (alreadyActive?.missionId === id) return freeze({ ok: true, reason: 'mission-already-active', worldId: alreadyActive.worldId, missionId: id, startsWorldAutomatically: false });
    const resolved = runtimeForMission(id);
    if (resolved) {
      const result = resolved.runtime.startMission(id, { explicitUserAction: true });
      return freeze({ ...result, worldId: resolved.worldId, missionId: id, currentWorldId, startsWorldAutomatically: false });
    }
    const repeatableOffer = getLiveContractOffers().find((offer) => offer?.template?.id === id);
    if (repeatableOffer) {
      const result = repeatableRuntime.startContract(id, { explicitUserAction: true });
      return freeze({ ...result, worldId: repeatableOffer.worldId, missionId: id, currentWorldId, startsWorldAutomatically: false, repeatableContract: true });
    }
    return freeze({ ok: false, reason: 'rt91-mission-not-found' });
  };
  const completeActiveObjective = ({ worldId = currentWorldId, playerPosition = null, explicitUserAction = false, expectedTargetId = '', productiveReceipt = null } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const targetWorld = safeWorldId(worldId);
    if (targetWorld !== currentWorldId) return freeze({ ok: false, reason: 'rt91-world-not-current', currentWorldId, targetWorld });
    const target = getActiveTarget(targetWorld);
    if (!target) return freeze({ ok: false, reason: 'rt91-active-objective-unavailable' });
    if (expectedTargetId && String(expectedTargetId) !== target.targetId) return freeze({ ok: false, reason: 'rt91-objective-target-changed', expectedTargetId: String(expectedTargetId), currentTargetId: target.targetId });
    const distance = distance2d(playerPosition || {}, target.position);
    if (!Number.isFinite(distance) || distance > Number(target.interactionRange || 3)) return freeze({ ok: false, reason: 'rt91-objective-not-in-range', targetId: target.targetId, distance, interactionRange: target.interactionRange });
    if (target.requiredProductiveReceiptKind) {
      if (typeof verifyProductiveReceipt !== 'function') return freeze({ ok: false, reason: 'productive-receipt-authority-unavailable', requiredKind: target.requiredProductiveReceiptKind });
      const verified = verifyProductiveReceipt({ target, receipt: productiveReceipt, requiredKind: target.requiredProductiveReceiptKind });
      if (!verified?.ok || String(verified?.receipt?.kind || '') !== String(target.requiredProductiveReceiptKind)) {
        return freeze({
          ok: false,
          reason: verified?.reason || 'productive-receipt-kind-mismatch',
          requiredKind: target.requiredProductiveReceiptKind,
          nextAction: String(verified?.nextAction || '')
        });
      }
    }
    const receiptId = `rt91:${targetWorld}:${target.missionId}:${target.objectiveId}:${Math.max(0, Math.floor(now()))}:${++receiptSequence}`;
    issuedObjectiveReceipts.set(receiptId, freeze({ id: receiptId, kind: target.requiredProductiveReceiptKind || 'rt91-physical-objective', worldId: targetWorld, missionId: target.missionId, objectiveId: target.objectiveId, issuedAt: now() }));
    let result;
    if (target.repeatableContract === true) {
      result = repeatableRuntime.completeObjective(target.objectiveId, { explicitUserAction: true, receipt: freeze({ id: receiptId }) });
      if (result.ok && result.contractComplete && result.completedContract) {
        const completed = result.completedContract;
        const lastPlacement = completed.placements?.[completed.placements.length - 1] || {};
        const objectiveSignature = completed.objectives?.map((row) => row.verb).join('-') || '';
        session = sanitizeEonCityRt91SessionSave({
          ...session,
          livingFrontier: {
            ...session.livingFrontier,
            completedContractIds: [...(session.livingFrontier.completedContractIds || []), completed.id],
            contractHistory: appendEonCityRt91ActivityHistory(session.livingFrontier.contractHistory || [], { familyId: completed.familyId, regionId: lastPlacement.regionId, zoneId: lastPlacement.zoneId, objectiveSignature }),
            updatedAt: now()
          },
          repeatableContract: null,
          updatedAt: now()
        });
        contractDirector.invalidate();
        persist('repeatable-contract-completed');
      }
    } else {
      const runtime = targetWorld === 'signal-frontier' ? signalRuntime : targetWorld === 'storm-sector' ? stormRuntime : frontierRuntime;
      result = runtime.completeObjective(target.missionId, target.objectiveId, { explicitUserAction: true, receipt: freeze({ id: receiptId }) });
    }
    if (!result.ok) issuedObjectiveReceipts.delete(receiptId);
    return freeze({ ...result, worldId: targetWorld, targetId: target.targetId, distance, privateContentStored: false, awardsXp: false });
  };
  const getNextAction = (worldId = currentWorldId) => resolveEonCityRt91NextAction({ board: getMissionBoard(), currentWorldId: safeWorldId(worldId) });
  const getHudProjection = (worldId = currentWorldId) => {
    const targetWorld = safeWorldId(worldId);
    const target = getActiveTarget(targetWorld);
    return buildEonCityRt91HudMapProjection({ currentWorldId: targetWorld, missionInputs: getMissionInputs(), generatedContracts: getLiveContractOffers(), productiveMissions: getProductiveMissions?.() || [], activeObjectivePosition: target?.position || null });
  };
  const getLegacyCompatibleMissionView = (legacyView = {}) => {
    const board = getMissionBoard();
    const candidateRows = [...board.sections.story, ...board.sections.contracts].filter((row) => ['active', 'available'].includes(String(row.status || '')));
    const activeFlagshipRow = candidateRows.find((row) => row.status === 'active') || null;
    const visibleRows = activeFlagshipRow ? [activeFlagshipRow] : candidateRows;
    const flagshipRows = visibleRows.map((row) => freeze({
      id: row.id,
      category: categoryFor(row),
      title: row.label,
      summary: row.activeObjective?.label || `${WORLD_LABELS[row.worldId] || row.worldId} ${row.kind === 'repeatable-contract' ? 'repeatable contract' : 'flagship mission'}`,
      state: row.status === 'active' ? 'in-progress' : 'available',
      actionLabel: row.status === 'active' ? `Continue in ${WORLD_LABELS[row.worldId]}` : `${row.kind === 'repeatable-contract' ? 'Start contract' : 'Start'} in ${WORLD_LABELS[row.worldId]}`,
      stationId: '',
      rt91WorldId: row.worldId,
      rt91Kind: row.kind,
      rt91Status: row.status,
      rt91: true,
      claimable: false,
      claimed: false,
      xpReward: 0
    }));
    return freeze({ ...legacyView, missions: freeze([...(Array.isArray(legacyView?.missions) ? legacyView.missions : []), ...flagshipRows]), rt91AvailableCount: flagshipRows.length, rt91Board: board, rt91NextAction: getNextAction(currentWorldId).action });
  };
  const getEonbotContext = (worldId = currentWorldId) => {
    const targetWorld = safeWorldId(worldId);
    const target = getActiveTarget(targetWorld);
    const next = getNextAction(targetWorld).action;
    return buildEonCityRt91AiGuidanceEnvelope({
      worldRegionId: targetWorld,
      worldLabel: WORLD_LABELS[targetWorld],
      objectiveId: target?.objectiveId || '',
      missionId: target?.missionId || '',
      nextAction: target?.objectiveLabel || next.label
    });
  };
  const getSummary = () => freeze({ schema: EON_CITY_RT91_RUNTIME_INTEGRATION_SCHEMA, currentWorldId, board: getMissionBoard(), nextAction: getNextAction(currentWorldId).action, activeTarget: getActiveTarget(currentWorldId), repeatable: repeatableRuntime.getView(), session, sessionRestored: loaded?.found === true, ownsBabylonEngine: false, ownsScene: false, ownsRenderLoop: false, ownsXpAuthority: false, ownsUnlockAuthority: false, networkRequestCreated: false });

  return freeze({
    schema: EON_CITY_RT91_RUNTIME_INTEGRATION_SCHEMA,
    getMissionBoard,
    getLegacyCompatibleMissionView,
    getNextAction,
    getHudProjection,
    getEonbotContext,
    getActiveTarget,
    getSummary,
    getSession: () => session,
    setCurrentWorld,
    startMission,
    completeActiveObjective,
    clearSession: (options = {}) => persistence.clear(options),
    ownsBabylonEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    ownsXpAuthority: false,
    ownsUnlockAuthority: false,
    networkRequestCreated: false
  });
}

export default freeze({ EON_CITY_RT91_RUNTIME_INTEGRATION_SCHEMA, createEonCityRt91RuntimeIntegration });
