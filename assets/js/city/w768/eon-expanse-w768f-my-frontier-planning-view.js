/** W768F — privacy-safe My Frontier mission-board planning view. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from './eon-expanse-w768b-my-frontier-state.js';

export const EON_EXPANSE_W768F_PLANNING_VIEW_SCHEMA = 'eon.expanse.my-frontier-planning-view.w768f.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();

export function deriveEonExpanseW768FMyFrontierPlanningView({ campaignReceipt = null, myFrontierState = null, constructionProjection = null, availability = [], earlyAccessAvailable = false, starterAccessAvailable = false } = {}) {
  const campaignComplete = Boolean(campaignReceipt?.id && campaignReceipt?.campaignId === 'signal-restoration' && Number(campaignReceipt?.completedAt || 0) > 0);
  const unlocked = myFrontierState?.schema === EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA && myFrontierState.unlocked === true;
  const earlyAccess = earlyAccessAvailable === true || myFrontierState?.unlockAuthority === 'beacon-one-restoration';
  const starterAccess = starterAccessAvailable === true || myFrontierState?.unlockAuthority === 'starter-access';
  const accessReady = campaignComplete || earlyAccess || starterAccess || unlocked;
  const constructedByPlot = new Map((constructionProjection?.plots || []).map((entry) => [entry.plotId, entry]));
  const availabilityByPlot = new Map((Array.isArray(availability) ? availability : []).map((entry) => [entry.plotId, entry]));
  const rows = freeze(contract.plots.map((plot) => {
    const plannedBuildingId = String(myFrontierState?.buildingChoices?.[plot.id] || '');
    const construction = constructedByPlot.get(plot.id) || null;
    const permit = availabilityByPlot.get(plot.id) || null;
    const status = construction?.status === 'constructed' ? 'constructed' : plannedBuildingId ? (permit?.authority === 'pending' ? 'receipt-pending' : 'planned') : 'choice-required';
    return freeze({
      plotId: plot.id,
      district: plot.district,
      label: plot.label,
      plannedBuildingId,
      constructedBuildingId: String(construction?.constructedBuildingId || ''),
      allowedBuildingIds: plot.allowedBuildingIds,
      status,
      authority: String(permit?.authority || ''),
      unavailableReason: String(permit?.unavailableReason || ''),
      privateContentStored: false
    });
  }));
  const constructedCount = rows.filter((entry) => entry.status === 'constructed').length;
  const plannedCount = rows.filter((entry) => entry.status === 'planned' || entry.status === 'receipt-pending').length;
  const choiceRequiredCount = rows.filter((entry) => entry.status === 'choice-required').length;
  const pendingAuthorityCount = rows.filter((entry) => entry.status === 'receipt-pending').length;
  const stage = !accessReady ? 'access-unavailable' : !unlocked && starterAccess ? 'starter-ready' : !unlocked ? 'unlock-ready' : constructedCount >= contract.plots.length ? 'established' : 'planning';
  const detail = stage === 'access-unavailable'
    ? 'My Frontier starter access is temporarily unavailable. Signal Frontier completion is never an entry prerequisite.'
    : stage === 'starter-ready'
      ? 'My Frontier is available now. Enter the Build world to activate starter planning; travel grants no XP, campaign receipt or construction permit.'
      : stage === 'unlock-ready'
        ? (campaignComplete ? 'Signal Frontier is verified. Activate the fixed, collision-safe My Frontier planning grid explicitly.' : 'Beacon One is restored. Activate My Frontier planning now; advanced construction remains separately receipt-protected.')
      : stage === 'established'
        ? 'Every authored district plot has a verified constructed building.'
        : `${constructedCount} constructed · ${plannedCount} planned · ${choiceRequiredCount} district choice${choiceRequiredCount === 1 ? '' : 's'} remaining${pendingAuthorityCount ? ` · ${pendingAuthorityCount} future receipt ${pendingAuthorityCount === 1 ? 'bridge' : 'bridges'} pending` : ''}.`;
  return freeze({
    schema: EON_EXPANSE_W768F_PLANNING_VIEW_SCHEMA,
    visible: accessReady,
    stage,
    title: stage === 'starter-ready' ? 'My Frontier available now' : stage === 'unlock-ready' ? 'My Frontier progression verified' : stage === 'access-unavailable' ? 'My Frontier temporarily unavailable' : 'My Frontier planning grid',
    detail,
    campaignComplete,
    earlyAccessAvailable: earlyAccess,
    starterAccessAvailable: starterAccess,
    accessReady,
    unlockAuthority: String(myFrontierState?.unlockAuthority || ''),
    unlocked,
    constructedCount,
    plannedCount,
    choiceRequiredCount,
    pendingAuthorityCount,
    totalPlotCount: contract.plots.length,
    rows,
    action: stage === 'starter-ready'
      ? freeze({ type: 'enter-my-frontier', label: 'Enter My Frontier', explicitUserActionRequired: true, grantsXp: false, grantsConstructionPermit: false })
      : stage === 'unlock-ready'
        ? freeze({ type: 'unlock-my-frontier', label: 'Activate My Frontier planning', explicitUserActionRequired: true })
        : null,
    automaticUnlock: false,
    automaticConstruction: false,
    privateContentStored: false,
    rawCoordinatesAccepted: false
  });
}

export function validateEonExpanseW768FPlanningAction(view = null, { explicitUserAction = false, expectedStage = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (expectedStage && view?.stage !== expectedStage) return freeze({ ok: false, reason: 'my-frontier-stage-changed' });
  const validStarterEntry = view?.action?.type === 'enter-my-frontier' && view?.stage === 'starter-ready';
  const validProgressionActivation = view?.action?.type === 'unlock-my-frontier' && view?.stage === 'unlock-ready';
  if (!validStarterEntry && !validProgressionActivation) return freeze({ ok: false, reason: 'my-frontier-action-unavailable' });
  return freeze({ ok: true, action: view.action, automaticUnlock: false, automaticConstruction: false, grantsXp: false });
}
