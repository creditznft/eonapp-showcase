import { deriveEonExpanseW767ODynamicEventLifecycle, validateEonExpanseW767ODynamicEventReview } from './eon-expanse-w767o-dynamic-event-lifecycle.js';
const freeze = (value) => Object.freeze(value);
const unique = (values = []) => freeze([...new Set((values || []).filter(Boolean).map(String))]);
const countMap = (value = {}) => freeze(Object.fromEntries(Object.entries(value || {}).map(([key, count]) => [String(key), Math.max(0, Number(count || 0))])));

export const EON_EXPANSE_W766F_CONTENT_SCHEMA = 'eon.city.expanse.living-content.w766f.v4';
export const EON_EXPANSE_W766F_SIDE_MISSIONS = freeze([
  freeze({ id: 'signal-salvage', label: 'Signal Salvage', zoneId: 'beacon-fields', xp: 80, repeatable: true, objective: 'Recover three frontier signal fragments.' }),
  freeze({ id: 'lost-worker', label: 'Lost Worker', zoneId: 'transit-scar', xp: 110, repeatable: false, objective: 'Locate the missing worker and reactivate their route terminal.' }),
  freeze({ id: 'archive-sweep', label: 'Archive Sweep', zoneId: 'archive-ruins', xp: 90, repeatable: true, objective: 'Inspect two hidden Archive records.' }),
  freeze({ id: 'transit-calibration', label: 'Transit Calibration', zoneId: 'transit-scar', xp: 100, repeatable: true, objective: 'Complete a reviewed calibration journey.' }),
  freeze({ id: 'eonbot-curiosity-trail', label: 'EONBOT Curiosity Trail', zoneId: 'gateway-overlook', xp: 70, repeatable: true, objective: 'Follow three EONBOT discovery signals.' })
]);

export const EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS = freeze([
  freeze({ id: 'create-expedition', label: 'Create Expedition', workspaceId: 'create', xp: 60, reviewFirst: true, receiptRequired: true }),
  freeze({ id: 'local-ai-survey', label: 'Local AI Survey', workspaceId: 'local-ai', xp: 60, reviewFirst: true, receiptRequired: true }),
  freeze({ id: 'automation-relay', label: 'Automation Relay', workspaceId: 'automations', xp: 60, reviewFirst: true, receiptRequired: true }),
  freeze({ id: 'knowledge-recovery', label: 'Knowledge Recovery', workspaceId: 'library', xp: 60, reviewFirst: true, receiptRequired: true }),
  freeze({ id: 'status-review', label: 'Status Review', workspaceId: 'status', xp: 50, reviewFirst: true, receiptRequired: true })
]);

export const EON_EXPANSE_W766F_DISCOVERIES = freeze([
  freeze({ id: 'overlook-panorama', zoneId: 'gateway-overlook', label: 'Frontier Panorama', xp: 20 }),
  freeze({ id: 'beacon-echo', zoneId: 'beacon-fields', label: 'Beacon Echo', xp: 25 }),
  freeze({ id: 'archive-memory-wall', zoneId: 'archive-ruins', label: 'Memory Wall', xp: 25 }),
  freeze({ id: 'scar-rail-fracture', zoneId: 'transit-scar', label: 'Rail Fracture', xp: 25 }),
  freeze({ id: 'vault-horizon-window', zoneId: 'horizon-vault', label: 'Horizon Window', xp: 30 })
]);

export const EON_EXPANSE_W766F_EVENT_FAMILIES = freeze([
  freeze({ id: 'signal-storm', label: 'Signal Storm', zoneId: 'beacon-fields', durationMinutes: 8 }),
  freeze({ id: 'archive-pulse', label: 'Archive Pulse', zoneId: 'archive-ruins', durationMinutes: 6 }),
  freeze({ id: 'transit-interruption', label: 'Transit Interruption', zoneId: 'transit-scar', durationMinutes: 7 }),
  freeze({ id: 'rare-cosmetic-signal', label: 'Rare Cosmetic Signal', zoneId: 'horizon-vault', durationMinutes: 5 }),
  freeze({ id: 'lost-drone', label: 'Lost Drone', zoneId: 'gateway-overlook', durationMinutes: 10 })
]);

function hash(value = '') {
  let result = 2166136261;
  for (const ch of String(value)) { result ^= ch.charCodeAt(0); result = Math.imul(result, 16777619); }
  return result >>> 0;
}

function normalizeFrontierSteps(input = []) {
  const seen = new Set();
  const steps = [];
  for (const step of Array.isArray(input) ? input.slice(0, 3) : []) {
    const id = String(step?.id || '').slice(0, 64);
    if (!/^[a-z0-9-]+$/i.test(id) || seen.has(id)) continue;
    seen.add(id);
    steps.push(freeze({
      id,
      label: String(step?.label || '').slice(0, 140),
      action: String(step?.action || 'interact').slice(0, 40)
    }));
  }
  return freeze(steps);
}

function normalizeActivityProgress(input = {}) {
  return freeze({
    cycleKey: String(input.cycleKey || ''),
    signalFragments: unique(input.signalFragments),
    archiveSweepRecords: unique(input.archiveSweepRecords),
    eonbotSignals: unique(input.eonbotSignals),
    lostWorkerLocated: input.lostWorkerLocated === true,
    routeTerminalActivated: input.routeTerminalActivated === true,
    transitJourneyReceipts: unique(input.transitJourneyReceipts)
  });
}

function nativeReceiptConsumed(processedReceipts = [], nativeReceiptId = '') {
  const receipt = String(nativeReceiptId || '');
  if (!receipt) return false;
  return (Array.isArray(processedReceipts) ? processedReceipts : []).some((entry) => {
    const value = String(entry || '');
    return value === receipt || value.endsWith(`:${receipt}`);
  });
}

function initialState(input = {}) {
  return freeze({
    schema: EON_EXPANSE_W766F_CONTENT_SCHEMA,
    xp: Number(input.xp || 0),
    completedSideMissions: unique(input.completedSideMissions),
    sideCompletionCounts: countMap(input.sideCompletionCounts),
    completedProductiveMissions: unique(input.completedProductiveMissions),
    discoveries: unique(input.discoveries),
    proceduralDiscoveries: unique(input.proceduralDiscoveries),
    completedFrontierContracts: unique(input.completedFrontierContracts),
    activeFrontierContract: input.activeFrontierContract && typeof input.activeFrontierContract === 'object' ? freeze({
      id: String(input.activeFrontierContract.id || ''),
      sectorId: String(input.activeFrontierContract.sectorId || ''),
      label: String(input.activeFrontierContract.label || '').slice(0, 120),
      objective: String(input.activeFrontierContract.objective || '').slice(0, 220),
      purpose: String(input.activeFrontierContract.purpose || '').slice(0, 120),
      family: String(input.activeFrontierContract.family || 'survey').slice(0, 40),
      steps: normalizeFrontierSteps(input.activeFrontierContract.steps),
      completedStepIds: unique(input.activeFrontierContract.completedStepIds).filter((id) => normalizeFrontierSteps(input.activeFrontierContract.steps).some((step) => step.id === id)),
      rarity: String(input.activeFrontierContract.rarity || 'common'),
      xp: Math.max(0, Number(input.activeFrontierContract.xp || 0)),
      landmarkId: String(input.activeFrontierContract.landmarkId || ''),
      cycleKey: String(input.activeFrontierContract.cycleKey || '')
    }) : null,
    processedReceipts: unique(input.processedReceipts),
    dailyCompletions: unique(input.dailyCompletions),
    activityProgress: normalizeActivityProgress(input.activityProgress),
    activeEvent: input.activeEvent || null,
    lastEventWindow: String(input.lastEventWindow || '')
  });
}

export function createEonExpanseW766FLivingContent({ initial = {}, worldSeed = 1, now = Date.now, onChange = null, onAwardXp = null, verifyWorkspaceReceipt = null, getDailySignalRecommendation = null } = {}) {
  let state = initialState(initial);
  const commit = (next) => { state = initialState(next); onChange?.(state); return state; };
  const award = (receiptId, xp, patch = {}, sourceId = 'living-content') => {
    const receipt = String(receiptId || '');
    const amount = Number(xp || 0);
    if (!receipt) return freeze({ ok: false, reason: 'receipt-required' });
    if (state.processedReceipts.includes(receipt)) return freeze({ ok: false, reason: 'duplicate-receipt' });
    const canonical = onAwardXp?.({ sourceId, amount, receiptId: receipt });
    if (canonical && canonical.ok === false) return freeze({ ...canonical, receiptId: receipt });
    commit({ ...state, ...patch, xp: state.xp + amount, processedReceipts: [...state.processedReceipts, receipt] });
    return freeze({ ok: true, awardedXp: amount, totalXp: Number(canonical?.totalXp ?? state.xp), level: Number(canonical?.level || 0), receiptId: receipt, canonicalLedger: Boolean(onAwardXp) });
  };


  const interactFrontierContract = (contract = {}, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const id = String(contract?.id || '');
    const sectorId = String(contract?.sectorId || '');
    if (!/^frontier:sector:-?\d+:-?\d+:[a-z0-9-]+$/i.test(id) || !/^sector:-?\d+:-?\d+$/.test(sectorId)) return freeze({ ok: false, reason: 'frontier-contract-invalid' });
    if (contract?.reviewFirst !== true || contract?.automaticCompletion === true) return freeze({ ok: false, reason: 'frontier-contract-boundary-invalid' });
    if (state.completedFrontierContracts.includes(id)) return freeze({ ok: false, reason: 'frontier-contract-already-completed' });
    const sanitized = freeze({
      id,
      sectorId,
      label: String(contract.label || 'Frontier Contract').slice(0, 120),
      objective: String(contract.objective || '').slice(0, 220),
      purpose: String(contract.purpose || '').slice(0, 120),
      family: String(contract.family || 'survey').slice(0, 40),
      steps: normalizeFrontierSteps(contract.steps),
      completedStepIds: freeze([]),
      rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(String(contract.rarity)) ? String(contract.rarity) : 'common',
      xp: Math.max(20, Math.min(150, Number(contract.xp || 35))),
      landmarkId: String(contract.landmarkId || '').slice(0, 140),
      cycleKey: String(contract.cycleKey || '').slice(0, 32)
    });
    if (sanitized.steps.length !== 3) return freeze({ ok: false, reason: 'frontier-contract-steps-invalid' });
    if (state.activeFrontierContract?.id !== id) {
      commit({ ...state, activeFrontierContract: sanitized });
      return freeze({ ok: true, status: 'reviewed', contract: sanitized, nextStep: sanitized.steps[0], explicitUserAction: true, automaticCompletion: false });
    }
    const active = state.activeFrontierContract;
    const nextStep = active.steps[active.completedStepIds.length] || null;
    return freeze({ ok: true, status: 'in-progress', contract: active, nextStep, explicitUserAction: true, automaticCompletion: false });
  };

  const progressFrontierContract = (contract = {}, stepId = '', { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const id = String(contract?.id || '');
    if (state.completedFrontierContracts.includes(id)) return freeze({ ok: false, reason: 'frontier-contract-already-completed' });
    if (!state.activeFrontierContract || state.activeFrontierContract.id !== id) return freeze({ ok: false, reason: 'frontier-contract-review-required' });
    const active = state.activeFrontierContract;
    const steps = active.steps || freeze([]);
    const requestedId = String(stepId || '');
    const stepIndex = steps.findIndex((step) => step.id === requestedId);
    if (stepIndex < 0) return freeze({ ok: false, reason: 'frontier-contract-step-invalid' });
    if (active.completedStepIds.includes(requestedId)) return freeze({ ok: false, reason: 'frontier-contract-step-already-completed' });
    if (stepIndex !== active.completedStepIds.length) return freeze({ ok: false, reason: 'frontier-contract-step-out-of-order', nextStep: steps[active.completedStepIds.length] || null });
    const completedStepIds = freeze([...active.completedStepIds, requestedId]);
    if (completedStepIds.length < steps.length) {
      const updated = freeze({ ...active, completedStepIds });
      commit({ ...state, activeFrontierContract: updated });
      return freeze({ ok: true, status: 'progressed', contract: updated, completedStep: steps[stepIndex], nextStep: steps[completedStepIds.length] || null });
    }
    const result = award(`frontier-contract:${id}`, active.xp, {
      activeFrontierContract: null,
      completedFrontierContracts: [...state.completedFrontierContracts, id]
    }, `frontier-contract:${active.sectorId}`);
    return freeze({ ...result, status: result.ok ? 'completed' : 'rejected', contract: active, completedStep: steps[stepIndex] });
  };

  const recordProceduralDiscovery = (discovery = {}, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const id = String(discovery?.id || '');
    if (!/^w682-discovery-[a-z0-9-]+$/i.test(id)) return freeze({ ok: false, reason: 'procedural-discovery-invalid' });
    if (discovery?.reviewFirst !== true || discovery?.automaticOpen === true || discovery?.privateByDefault !== true) return freeze({ ok: false, reason: 'procedural-discovery-boundary-invalid' });
    if (state.proceduralDiscoveries.includes(id)) return freeze({ ok: false, reason: 'procedural-discovery-already-recorded' });
    const rarity = String(discovery.rarity || 'common');
    const xp = rarity === 'rare' ? 30 : rarity === 'uncommon' ? 22 : 15;
    const result = award(`procedural-discovery:${id}`, xp, { proceduralDiscoveries: [...state.proceduralDiscoveries, id] }, `procedural-discovery:${String(discovery.kind || 'signal')}`);
    return freeze({ ...result, discovery: freeze({ id, kind: String(discovery.kind || ''), label: String(discovery.label || '').slice(0, 120), rarity }) });
  };

  const completeSideMission = (missionId, { explicitUserAction = false, receiptId: _receiptId = '', completionProof = null } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const mission = EON_EXPANSE_W766F_SIDE_MISSIONS.find((item) => item.id === missionId);
    if (!mission) return freeze({ ok: false, reason: 'mission-not-found' });
    if (!mission.repeatable && state.completedSideMissions.includes(missionId)) return freeze({ ok: false, reason: 'mission-already-completed' });
    const validProof = missionId === 'signal-salvage' ? Number(completionProof?.fragmentCount || 0) >= 3
      : missionId === 'lost-worker' ? completionProof?.workerLocated === true && completionProof?.routeTerminalActivated === true
        : missionId === 'archive-sweep' ? Number(completionProof?.inspectedRecordCount || 0) >= 2
          : missionId === 'transit-calibration' ? completionProof?.journeyReceipt?.status === 'completed'
            : missionId === 'eonbot-curiosity-trail' ? Number(completionProof?.signalCount || 0) >= 3
              : false;
    if (!validProof) return freeze({ ok: false, reason: 'valid-completion-proof-required' });
    const cycle = String(completionProof?.cycleKey || new Date(now()).toISOString().slice(0, 10));
    const resolvedReceipt = mission.repeatable ? `side:${missionId}:${cycle}` : `side:${missionId}:first`;
    const nextCounts = { ...state.sideCompletionCounts, [missionId]: Number(state.sideCompletionCounts[missionId] || 0) + 1 };
    const result = award(resolvedReceipt, mission.xp, {
      completedSideMissions: [...state.completedSideMissions, missionId],
      sideCompletionCounts: nextCounts
    }, `side:${missionId}`);
    return freeze({ ...result, mission, completionCount: Number(result.ok ? nextCounts[missionId] : state.sideCompletionCounts[missionId] || 0), cycleKey: cycle });
  };

  const resetRepeatableProgressForCycle = (cycleKey) => {
    const progress = state.activityProgress;
    if (progress.cycleKey === cycleKey) return progress;
    return normalizeActivityProgress({
      cycleKey,
      lostWorkerLocated: progress.lostWorkerLocated,
      routeTerminalActivated: progress.routeTerminalActivated
    });
  };

  const recordWorldInteraction = (action = '', detail = {}, { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const cycleKey = String(detail.cycleKey || new Date(now()).toISOString().slice(0, 10));
    let progress = resetRepeatableProgressForCycle(cycleKey);
    const itemId = String(detail.itemId || detail.id || '');
    let missionId = '';
    let duplicate = false;
    if (action === 'signal-fragment-collected') {
      missionId = 'signal-salvage';
      duplicate = progress.signalFragments.includes(itemId);
      if (!duplicate) progress = normalizeActivityProgress({ ...progress, signalFragments: [...progress.signalFragments, itemId] });
    } else if (action === 'archive-sweep-record-inspected') {
      missionId = 'archive-sweep';
      duplicate = progress.archiveSweepRecords.includes(itemId);
      if (!duplicate) progress = normalizeActivityProgress({ ...progress, archiveSweepRecords: [...progress.archiveSweepRecords, itemId] });
    } else if (action === 'eonbot-signal-followed') {
      missionId = 'eonbot-curiosity-trail';
      duplicate = progress.eonbotSignals.includes(itemId);
      if (!duplicate) progress = normalizeActivityProgress({ ...progress, eonbotSignals: [...progress.eonbotSignals, itemId] });
    } else if (action === 'lost-worker-located') {
      missionId = 'lost-worker'; duplicate = progress.lostWorkerLocated;
      progress = normalizeActivityProgress({ ...progress, lostWorkerLocated: true });
    } else if (action === 'lost-worker-terminal-activated') {
      missionId = 'lost-worker'; duplicate = progress.routeTerminalActivated;
      progress = normalizeActivityProgress({ ...progress, routeTerminalActivated: true });
    } else if (action === 'transit-calibration-completed') {
      missionId = 'transit-calibration';
      const journeyReceiptId = String(detail.journeyReceipt?.id || itemId);
      if (!journeyReceiptId || detail.journeyReceipt?.status !== 'completed') return freeze({ ok: false, reason: 'valid-journey-receipt-required' });
      duplicate = progress.transitJourneyReceipts.includes(journeyReceiptId);
      if (!duplicate) progress = normalizeActivityProgress({ ...progress, transitJourneyReceipts: [...progress.transitJourneyReceipts, journeyReceiptId] });
    } else {
      return freeze({ ok: false, reason: 'world-interaction-not-supported' });
    }
    if (duplicate) return freeze({ ok: false, reason: 'interaction-already-recorded', missionId, activityProgress: progress });
    commit({ ...state, activityProgress: progress });
    const proof = missionId === 'signal-salvage' ? { fragmentCount: progress.signalFragments.length, cycleKey }
      : missionId === 'archive-sweep' ? { inspectedRecordCount: progress.archiveSweepRecords.length, cycleKey }
        : missionId === 'eonbot-curiosity-trail' ? { signalCount: progress.eonbotSignals.length, cycleKey }
          : missionId === 'lost-worker' ? { workerLocated: progress.lostWorkerLocated, routeTerminalActivated: progress.routeTerminalActivated, cycleKey: 'persistent' }
            : { journeyReceipt: detail.journeyReceipt, cycleKey };
    const thresholdReached = missionId === 'signal-salvage' ? proof.fragmentCount >= 3
      : missionId === 'archive-sweep' ? proof.inspectedRecordCount >= 2
        : missionId === 'eonbot-curiosity-trail' ? proof.signalCount >= 3
          : missionId === 'lost-worker' ? proof.workerLocated && proof.routeTerminalActivated
            : missionId === 'transit-calibration';
    const completion = thresholdReached ? completeSideMission(missionId, { explicitUserAction: true, completionProof: proof }) : null;
    return freeze({ ok: true, missionId, thresholdReached, completion, activityProgress: state.activityProgress });
  };

  return freeze({
    getState() { return state; },
    listSideMissions() { return EON_EXPANSE_W766F_SIDE_MISSIONS; },
    listProductiveMissions() { return EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS; },
    completeSideMission,
    recordWorldInteraction,
    interactFrontierContract,
    progressFrontierContract,
    recordProceduralDiscovery,
    completeProductiveMission(missionId, { explicitUserAction = false, workspaceReceipt = null } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const mission = EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS.find((item) => item.id === missionId);
      if (!mission) return freeze({ ok: false, reason: 'mission-not-found' });
      if (state.completedProductiveMissions.includes(missionId)) return freeze({ ok: false, reason: 'mission-already-completed' });
      if (typeof verifyWorkspaceReceipt !== 'function') return freeze({ ok: false, reason: 'productive-receipt-authority-unavailable' });
      const verified = verifyWorkspaceReceipt({ missionId, mission, workspaceReceipt });
      if (!verified?.ok || !verified?.receipt?.id) return freeze({ ok: false, reason: verified?.reason || 'valid-workspace-receipt-required' });
      const receipt = verified.receipt;
      if (nativeReceiptConsumed(state.processedReceipts, receipt.id)) return freeze({ ok: false, reason: 'native-outcome-receipt-already-consumed' });
      const result = award(`productive:${missionId}:${receipt.id}`, mission.xp, { completedProductiveMissions: [...state.completedProductiveMissions, missionId] }, `productive:${missionId}`);
      return freeze({ ...result, mission, workspaceReceipt: freeze({ id: receipt.id, workspaceId: receipt.workspaceId, authoritySchema: receipt.authoritySchema, nativeMissionId: receipt.nativeMissionId, kind: receipt.kind, verifiedAt: receipt.verifiedAt, privateContentStored: false }) });
    },
    recordDiscovery(discoveryId, { receiptId = '' } = {}) {
      const discovery = EON_EXPANSE_W766F_DISCOVERIES.find((item) => item.id === discoveryId);
      if (!discovery) return freeze({ ok: false, reason: 'discovery-not-found' });
      if (state.discoveries.includes(discoveryId)) return freeze({ ok: false, reason: 'discovery-already-recorded' });
      const result = award(receiptId || `discovery:${discoveryId}`, discovery.xp, { discoveries: [...state.discoveries, discoveryId] }, `discovery:${discoveryId}`);
      return freeze({ ...result, discovery });
    },
    resolveEvent({ at = now(), windowMinutes = 30 } = {}) {
      const suppliedAt = Number(at);
      const timestamp = Number.isFinite(suppliedAt) ? suppliedAt : Number(now());
      const resolvedWindowMinutes = Math.max(1, Number(windowMinutes));
      const window = Math.floor(timestamp / (resolvedWindowMinutes * 60000));
      const windowId = `${worldSeed}:${window}`;
      const selected = EON_EXPANSE_W766F_EVENT_FAMILIES[hash(windowId) % EON_EXPANSE_W766F_EVENT_FAMILIES.length];
      const candidate = freeze({ ...selected, windowId, startsAt: window * resolvedWindowMinutes * 60000, endsAt: window * resolvedWindowMinutes * 60000 + selected.durationMinutes * 60000, irreversibleFailure: false, blocksHubReturn: false, financialUrgency: false });
      const lifecycle = deriveEonExpanseW767ODynamicEventLifecycle(candidate, { at: timestamp });
      const event = lifecycle.active ? candidate : null;
      const activeWindowChanged = String(state.activeEvent?.windowId || '') !== String(event?.windowId || '');
      if (state.lastEventWindow !== windowId || activeWindowChanged || Boolean(state.activeEvent) !== Boolean(event)) commit({ ...state, activeEvent: event, lastEventWindow: windowId });
      return event;
    },
    reviewDynamicEvent({ eventId = '', windowId = '' } = {}, { explicitUserAction = false, at = now() } = {}) {
      const reviewed = validateEonExpanseW767ODynamicEventReview({ event: state.activeEvent, expectedEventId: eventId, expectedWindowId: windowId, explicitUserAction, at });
      if (!reviewed.ok && reviewed.reason === 'dynamic-event-expired' && state.activeEvent) commit({ ...state, activeEvent: null });
      return reviewed.ok ? freeze({ ...reviewed, event: state.activeEvent }) : reviewed;
    },
    completeDailySignal({ dayKey = '', missionId = '', workspaceReceipt = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (typeof getDailySignalRecommendation !== 'function') return freeze({ ok: false, reason: 'daily-signal-authority-unavailable' });
      const recommendation = getDailySignalRecommendation({ at: now(), state });
      if (!recommendation?.ok) return freeze({ ok: false, reason: recommendation?.reason || 'daily-signal-recommendation-unavailable' });
      const key = String(dayKey || recommendation.dayKey || '');
      if (key !== recommendation.dayKey) return freeze({ ok: false, reason: 'daily-signal-day-changed' });
      if (missionId && String(missionId) !== recommendation.missionId) return freeze({ ok: false, reason: 'daily-signal-selection-changed' });
      if (state.dailyCompletions.includes(key)) return freeze({ ok: false, reason: 'daily-already-completed' });
      const nativeReceiptId = String(workspaceReceipt?.id || recommendation.receipt?.id || '');
      if (nativeReceiptConsumed(state.processedReceipts, nativeReceiptId)) return freeze({ ok: false, reason: 'native-outcome-receipt-already-consumed' });
      if (!recommendation.readyToClaim || !recommendation.receipt?.id || !workspaceReceipt?.id) return freeze({ ok: false, reason: 'fresh-native-daily-signal-receipt-required' });
      if (typeof verifyWorkspaceReceipt !== 'function') return freeze({ ok: false, reason: 'productive-receipt-authority-unavailable' });
      const verified = verifyWorkspaceReceipt({ missionId: recommendation.missionId, workspaceReceipt });
      if (!verified?.ok || verified.receipt?.id !== recommendation.receipt.id) return freeze({ ok: false, reason: verified?.reason || 'daily-signal-receipt-mismatch' });
      const result = award(`daily-signal:${verified.receipt.id}`, 40, { dailyCompletions: [...state.dailyCompletions, key] }, 'daily-signal');
      return freeze({ ...result, dayKey: key, missionId: recommendation.missionId, workspaceId: recommendation.workspaceId, workspaceReceipt: freeze({ id: verified.receipt.id, authoritySchema: verified.receipt.authoritySchema, nativeMissionId: verified.receipt.nativeMissionId, kind: verified.receipt.kind, verifiedAt: verified.receipt.verifiedAt, privateContentStored: false }) });
    },
    getSummary() {
      return freeze({
        schema: `${EON_EXPANSE_W766F_CONTENT_SCHEMA}.summary.v4`,
        contentXpMirror: state.xp,
        sideCompleted: state.completedSideMissions.length,
        sideCompletionCounts: state.sideCompletionCounts,
        productiveCompleted: state.completedProductiveMissions.length,
        discoveries: state.discoveries.length,
        discoveryTotal: EON_EXPANSE_W766F_DISCOVERIES.length,
        proceduralDiscoveryCount: state.proceduralDiscoveries.length,
        activeFrontierContract: state.activeFrontierContract,
        completedFrontierContractCount: state.completedFrontierContracts.length,
        activityProgress: state.activityProgress,
        activeEvent: state.activeEvent,
        postCampaignActivities: freeze(['Daily Signal', 'Signal Salvage', 'Archive Sweep', 'Transit Calibration', 'Frontier Contracts', 'Procedural Discoveries'])
      });
    }
  });
}
