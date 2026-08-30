/**
 * W768B — privacy-safe My Frontier unlock and choice state.
 *
 * The state controller accepts only verified campaign/resident authorities and
 * approved ids from W768A. It never accepts user-authored coordinates or stores
 * private project payloads.
 */

import {
  EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA,
  createEonExpanseW768AMyFrontierLayoutContract,
  validateEonExpanseW768AMyFrontierLayoutContract
} from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W769B_DEFAULT_THEME_ID, isEonExpanseW769BThemeId } from '../w769/eon-expanse-w769b-my-frontier-theme.js';

export const EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA = 'eon.expanse.my-frontier-state.w768b.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,159}$/i;
const contract = createEonExpanseW768AMyFrontierLayoutContract();
const contractValidation = validateEonExpanseW768AMyFrontierLayoutContract(contract);
if (!contractValidation.ok) throw new Error(`W768A layout contract invalid: ${contractValidation.errors.join(', ')}`);

function unique(values = [], limit = 64) {
  return freeze([...new Set((Array.isArray(values) ? values : []).map((entry) => String(entry || '')).filter((entry) => SAFE_ID.test(entry)))].slice(0, limit));
}

function safeCampaignReceipt(input = null) {
  if (!input || typeof input !== 'object') return null;
  const id = String(input.id || '');
  const campaignId = String(input.campaignId || '');
  const completedAt = Number(input.completedAt || 0);
  const totalXp = Math.max(0, Number(input.totalXp || 0));
  const cosmeticId = String(input.cosmeticId || '');
  if (!SAFE_ID.test(id) || campaignId !== 'signal-restoration' || !Number.isFinite(completedAt) || completedAt <= 0 || (cosmeticId && !SAFE_ID.test(cosmeticId))) return null;
  return freeze({ id, campaignId, completedAt, totalXp, cosmeticId, privateContentStored: false });
}

function verifyPersistedUnlock(input, verifyCampaignReceipt) {
  const receipt = safeCampaignReceipt(input);
  if (!receipt || typeof verifyCampaignReceipt !== 'function') return null;
  const verified = verifyCampaignReceipt({ campaignReceipt: receipt });
  if (!verified?.ok) return null;
  const authoritative = safeCampaignReceipt(verified.receipt);
  if (!authoritative || authoritative.id !== receipt.id || authoritative.campaignId !== receipt.campaignId || authoritative.completedAt !== receipt.completedAt) return null;
  return authoritative;
}

function safeEarlyUnlockReceipt(input = null) {
  if (!input || typeof input !== 'object') return null;
  const schema = String(input.schema || '');
  const id = String(input.id || '');
  const milestone = String(input.milestone || '');
  const sourceMissionId = String(input.sourceMissionId || '');
  const sourceObjectiveId = String(input.sourceObjectiveId || '');
  if (schema !== 'eon.city.my-frontier-access.r08.v1' || id !== 'milestone:beacon-one-repaired' || milestone !== 'beacon-one-repaired' || sourceMissionId !== 'first-light' || sourceObjectiveId !== 'repair-beacon-one') return null;
  return freeze({ schema, id, milestone, sourceMissionId, sourceObjectiveId, verifiedMissionState: true, grantsXp: false, campaignComplete: false, grantsConstructionPermit: false, privateContentStored: false });
}

function safeStarterAccessReceipt(input = null) {
  if (!input || typeof input !== 'object') return null;
  const schema = String(input.schema || '');
  const id = String(input.id || '');
  const milestone = String(input.milestone || '');
  const sourceMissionId = String(input.sourceMissionId || '');
  const sourceObjectiveId = String(input.sourceObjectiveId || '');
  if (schema !== 'eon.city.my-frontier-access.r08.v1'
    || id !== 'access:my-frontier-starter'
    || milestone !== 'starter-access'
    || sourceMissionId !== 'none'
    || sourceObjectiveId !== 'none'
    || input.starterAccess !== true) return null;
  return freeze({
    schema,
    id,
    milestone,
    sourceMissionId,
    sourceObjectiveId,
    verifiedMissionState: false,
    starterAccess: true,
    grantsXp: false,
    campaignComplete: false,
    grantsConstructionPermit: false,
    privateContentStored: false
  });
}

function verifyPersistedEarlyUnlock(input, verifyMilestoneReceipt) {
  const receipt = safeEarlyUnlockReceipt(input);
  if (!receipt || typeof verifyMilestoneReceipt !== 'function') return null;
  const verified = verifyMilestoneReceipt({ milestoneReceipt: receipt });
  if (!verified?.ok) return null;
  const authoritative = safeEarlyUnlockReceipt(verified.receipt);
  if (!authoritative || authoritative.id !== receipt.id || authoritative.milestone !== receipt.milestone || authoritative.sourceObjectiveId !== receipt.sourceObjectiveId) return null;
  return authoritative;
}

function normalizeBuildingChoices(input = {}, unlocked = false) {
  if (!unlocked) return freeze({});
  const choices = { 'plot-central-command': 'command-core' };
  for (const plot of contract.plots) {
    if (plot.requiredBuildingId) continue;
    const buildingId = String(input?.[plot.id] || '');
    if (plot.allowedBuildingIds.includes(buildingId)) choices[plot.id] = buildingId;
  }
  return freeze(choices);
}

function normalizeResidents(input = {}, residentReceiptInput = {}, unlocked = false, verifyResidentReceipt = null) {
  const residents = {};
  const residentReceipts = {};
  if (!unlocked || typeof verifyResidentReceipt !== 'function') return freeze({ residents: freeze(residents), residentReceipts: freeze(residentReceipts) });
  for (const slot of contract.residentSlots) {
    if (String(input?.[slot.id] || '') !== slot.residentId) continue;
    const candidate = safeResidentReceipt(residentReceiptInput?.[slot.id]);
    if (!candidate || candidate.residentId !== slot.residentId) continue;
    const verified = verifyResidentReceipt({ slotId: slot.id, residentId: slot.residentId, residentReceipt: candidate });
    const authoritative = safeResidentReceipt(verified?.receipt);
    if (!verified?.ok || !authoritative
      || authoritative.id !== candidate.id
      || authoritative.residentId !== candidate.residentId
      || authoritative.completedAt !== candidate.completedAt) continue;
    residents[slot.id] = slot.residentId;
    residentReceipts[slot.id] = authoritative;
  }
  return freeze({ residents: freeze(residents), residentReceipts: freeze(residentReceipts) });
}

function normalizeState(input = {}, verifyCampaignReceipt = null, verifyResidentReceipt = null, verifyMilestoneReceipt = null) {
  const unlockReceipt = verifyPersistedUnlock(input.unlockReceipt, verifyCampaignReceipt);
  const earlyUnlockReceipt = unlockReceipt ? null : verifyPersistedEarlyUnlock(input.earlyUnlockReceipt, verifyMilestoneReceipt);
  const starterAccessReceipt = unlockReceipt || earlyUnlockReceipt ? null : safeStarterAccessReceipt(input.starterAccessReceipt);
  const unlocked = Boolean(unlockReceipt || earlyUnlockReceipt || starterAccessReceipt);
  const normalizedResidents = normalizeResidents(input.residents, input.residentReceipts, unlocked, verifyResidentReceipt);
  return freeze({
    schema: EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA,
    layoutSchema: EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA,
    unlocked,
    unlockReceipt,
    earlyUnlockReceipt,
    starterAccessReceipt,
    unlockAuthority: unlockReceipt ? 'campaign' : earlyUnlockReceipt ? 'beacon-one-restoration' : starterAccessReceipt ? 'starter-access' : '',
    buildingChoices: normalizeBuildingChoices(input.buildingChoices, unlocked),
    themeId: unlocked && isEonExpanseW769BThemeId(input.themeId) ? String(input.themeId) : unlocked ? EON_EXPANSE_W769B_DEFAULT_THEME_ID : '',
    residents: normalizedResidents.residents,
    residentReceipts: normalizedResidents.residentReceipts,
    processedReceipts: unique(input.processedReceipts),
    updatedAt: Math.max(0, Number(input.updatedAt || 0)),
    privateContentStored: false,
    rawCoordinatesStored: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

function safeResidentReceipt(input = null) {
  if (!input || typeof input !== 'object') return null;
  const id = String(input.id || '');
  const residentId = String(input.residentId || '');
  const completedAt = Number(input.completedAt || 0);
  if (!SAFE_ID.test(id) || !SAFE_ID.test(residentId) || !Number.isFinite(completedAt) || completedAt <= 0) return null;
  return freeze({ id, residentId, completedAt, privateContentStored: false });
}

export function createEonExpanseW768BMyFrontierState({ initial = {}, now = Date.now, onChange = null, verifyCampaignReceipt = null, verifyResidentReceipt = null, verifyMilestoneReceipt = null } = {}) {
  let state = normalizeState(initial, verifyCampaignReceipt, verifyResidentReceipt, verifyMilestoneReceipt);
  const commit = (patch = {}) => {
    state = normalizeState({ ...state, ...patch, updatedAt: Number(now()) }, verifyCampaignReceipt, verifyResidentReceipt, verifyMilestoneReceipt);
    onChange?.(state);
    return state;
  };

  return freeze({
    getState() { return state; },
    getLayoutContract() { return contract; },
    unlockMyFrontierEarly({ milestoneReceipt = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (state.unlocked) return freeze({ ok: false, reason: 'my-frontier-already-unlocked', state });
      if (typeof verifyMilestoneReceipt !== 'function') return freeze({ ok: false, reason: 'milestone-receipt-authority-unavailable' });
      const candidate = safeEarlyUnlockReceipt(milestoneReceipt);
      if (!candidate) return freeze({ ok: false, reason: 'beacon-one-restoration-receipt-required' });
      const verified = verifyMilestoneReceipt({ milestoneReceipt: candidate });
      const receipt = safeEarlyUnlockReceipt(verified?.receipt);
      if (!verified?.ok || !receipt || receipt.id !== candidate.id || receipt.sourceObjectiveId !== candidate.sourceObjectiveId) return freeze({ ok: false, reason: verified?.reason || 'milestone-receipt-mismatch' });
      const unlockLedgerId = `my-frontier-unlock:${receipt.id}`;
      if (state.processedReceipts.includes(unlockLedgerId)) return freeze({ ok: false, reason: 'unlock-receipt-already-processed' });
      commit({
        earlyUnlockReceipt: receipt,
        buildingChoices: { 'plot-central-command': 'command-core' },
        themeId: EON_EXPANSE_W769B_DEFAULT_THEME_ID,
        processedReceipts: [...state.processedReceipts, unlockLedgerId]
      });
      return freeze({ ok: true, status: 'unlocked-early', receipt, state, automaticConstruction: false, grantsCampaignCompletion: false, grantsXp: false, explicitUserAction: true });
    },
    unlockMyFrontierStarter({ starterAccessReceipt = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (state.unlocked) return freeze({ ok: false, reason: 'my-frontier-already-unlocked', state });
      const receipt = safeStarterAccessReceipt(starterAccessReceipt);
      if (!receipt) return freeze({ ok: false, reason: 'starter-access-receipt-required' });
      const unlockLedgerId = `my-frontier-unlock:${receipt.id}`;
      const receiptAlreadyProcessed = state.processedReceipts.includes(unlockLedgerId);
      // RT92 forensic repair: a prior valid starter-access write can survive while
      // an older/partial persisted state is missing the canonical receipt field.
      // The processed ledger is evidence that the bounded starter grant already
      // happened, so reconcile the canonical non-progression authority in place
      // instead of deleting history, rejecting entry, or appending a duplicate.
      commit({
        starterAccessReceipt: receipt,
        buildingChoices: { ...state.buildingChoices, 'plot-central-command': 'command-core' },
        themeId: state.themeId || EON_EXPANSE_W769B_DEFAULT_THEME_ID,
        processedReceipts: receiptAlreadyProcessed ? state.processedReceipts : [...state.processedReceipts, unlockLedgerId]
      });
      return freeze({
        ok: true,
        status: receiptAlreadyProcessed ? 'starter-access-reconciled' : 'starter-access-enabled',
        receipt,
        state,
        automaticConstruction: false,
        grantsCampaignCompletion: false,
        grantsXp: false,
        grantsConstructionPermit: false,
        explicitUserAction: true
      });
    },
    unlockMyFrontier({ campaignReceipt = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (state.unlocked) return freeze({ ok: false, reason: 'my-frontier-already-unlocked', state });
      if (typeof verifyCampaignReceipt !== 'function') return freeze({ ok: false, reason: 'campaign-receipt-authority-unavailable' });
      const candidate = safeCampaignReceipt(campaignReceipt);
      if (!candidate) return freeze({ ok: false, reason: 'valid-campaign-receipt-required' });
      const verified = verifyCampaignReceipt({ campaignReceipt: candidate });
      const receipt = safeCampaignReceipt(verified?.receipt);
      if (!verified?.ok || !receipt || receipt.id !== candidate.id || receipt.completedAt !== candidate.completedAt) return freeze({ ok: false, reason: verified?.reason || 'campaign-receipt-mismatch' });
      const unlockLedgerId = `my-frontier-unlock:${receipt.id}`;
      if (state.processedReceipts.includes(unlockLedgerId)) return freeze({ ok: false, reason: 'unlock-receipt-already-processed' });
      commit({
        unlockReceipt: receipt,
        buildingChoices: { 'plot-central-command': 'command-core' },
        themeId: EON_EXPANSE_W769B_DEFAULT_THEME_ID,
        processedReceipts: [...state.processedReceipts, unlockLedgerId]
      });
      return freeze({ ok: true, status: 'unlocked', receipt, state, automaticConstruction: false, explicitUserAction: true });
    },
    selectBuilding({ plotId = '', buildingId = '', explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.unlocked) return freeze({ ok: false, reason: 'my-frontier-locked' });
      const plot = contract.plots.find((entry) => entry.id === String(plotId || ''));
      if (!plot) return freeze({ ok: false, reason: 'plot-not-found' });
      if (plot.requiredBuildingId) return freeze({ ok: false, reason: 'required-building-fixed' });
      const choice = String(buildingId || '');
      if (!plot.allowedBuildingIds.includes(choice)) return freeze({ ok: false, reason: 'building-not-allowed-for-plot' });
      if (state.buildingChoices[plot.id] === choice) return freeze({ ok: false, reason: 'building-already-selected' });
      commit({ buildingChoices: { ...state.buildingChoices, [plot.id]: choice } });
      return freeze({ ok: true, status: 'planned', plotId: plot.id, buildingId: choice, state, automaticConstruction: false });
    },
    inviteResident({ slotId = '', residentId = '', residentReceipt = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.unlocked) return freeze({ ok: false, reason: 'my-frontier-locked' });
      const slot = contract.residentSlots.find((entry) => entry.id === String(slotId || ''));
      if (!slot) return freeze({ ok: false, reason: 'resident-slot-not-found' });
      if (slot.residentId !== String(residentId || '')) return freeze({ ok: false, reason: 'resident-not-allowed-for-slot' });
      if (state.residents[slot.id] === slot.residentId) return freeze({ ok: false, reason: 'resident-already-invited' });
      if (typeof verifyResidentReceipt !== 'function') return freeze({ ok: false, reason: 'resident-receipt-authority-unavailable' });
      const candidate = safeResidentReceipt(residentReceipt);
      if (!candidate || candidate.residentId !== slot.residentId) return freeze({ ok: false, reason: 'valid-resident-receipt-required' });
      const verified = verifyResidentReceipt({ slotId: slot.id, residentId: slot.residentId, residentReceipt: candidate });
      const receipt = safeResidentReceipt(verified?.receipt);
      if (!verified?.ok || !receipt
        || receipt.id !== candidate.id
        || receipt.residentId !== candidate.residentId
        || receipt.completedAt !== candidate.completedAt) return freeze({ ok: false, reason: verified?.reason || 'resident-receipt-mismatch' });
      const ledgerId = `my-frontier-resident:${slot.residentId}:${receipt.id}`;
      if (state.processedReceipts.includes(ledgerId)) return freeze({ ok: false, reason: 'resident-receipt-already-processed' });
      commit({ residents: { ...state.residents, [slot.id]: slot.residentId }, residentReceipts: { ...state.residentReceipts, [slot.id]: receipt }, processedReceipts: [...state.processedReceipts, ledgerId] });
      return freeze({ ok: true, status: 'resident-invited', slotId: slot.id, residentId: slot.residentId, receipt, state });
    },
    selectTheme({ themeId = '', explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.unlocked) return freeze({ ok: false, reason: 'my-frontier-locked' });
      const choice = String(themeId || '');
      if (!isEonExpanseW769BThemeId(choice)) return freeze({ ok: false, reason: 'theme-not-approved' });
      if (state.themeId === choice) return freeze({ ok: false, reason: 'theme-already-selected' });
      commit({ themeId: choice });
      return freeze({ ok: true, status: 'theme-selected', themeId: choice, state, automaticSelection: false, rawColorsAccepted: false });
    },
    releaseResident({ slotId = '', residentId = '', residentReceiptId = '', explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.unlocked) return freeze({ ok: false, reason: 'my-frontier-locked' });
      const slot = contract.residentSlots.find((entry) => entry.id === String(slotId || ''));
      if (!slot) return freeze({ ok: false, reason: 'resident-slot-not-found' });
      if (state.residents[slot.id] !== slot.residentId || slot.residentId !== String(residentId || '')) return freeze({ ok: false, reason: 'resident-not-invited' });
      const receipt = safeResidentReceipt(state.residentReceipts?.[slot.id]);
      if (!receipt || receipt.id !== String(residentReceiptId || '')) return freeze({ ok: false, reason: 'resident-release-receipt-mismatch' });
      const residents = { ...state.residents }; delete residents[slot.id];
      const residentReceipts = { ...state.residentReceipts }; delete residentReceipts[slot.id];
      const ledgerId = `my-frontier-resident:${slot.residentId}:${receipt.id}`;
      commit({ residents, residentReceipts, processedReceipts: state.processedReceipts.filter((entry) => entry !== ledgerId) });
      return freeze({ ok: true, status: 'resident-released', slotId: slot.id, residentId: slot.residentId, receiptId: receipt.id, state, automaticRelease: false, awardsXp: false });
    },
    getSafeProjection() {
      return freeze({
        schema: `${EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA}.projection.v1`,
        unlocked: state.unlocked,
        unlockReceiptId: state.unlockReceipt?.id || state.earlyUnlockReceipt?.id || state.starterAccessReceipt?.id || '',
        unlockAuthority: state.unlockAuthority || '',
        earlyUnlock: state.unlockAuthority === 'beacon-one-restoration',
        starterAccess: state.unlockAuthority === 'starter-access',
        themeId: state.themeId || '',
        plots: freeze(contract.plots.map((plot) => freeze({
          id: plot.id,
          district: plot.district,
          label: plot.label,
          position: plot.position,
          entranceAnchor: plot.entranceAnchor,
          roadAnchor: plot.roadAnchor,
          allowedBuildingIds: plot.allowedBuildingIds,
          selectedBuildingId: state.buildingChoices[plot.id] || '',
          requiredBuildingId: plot.requiredBuildingId
        }))),
        residents: freeze(contract.residentSlots.map((slot) => freeze({ id: slot.id, residentId: slot.residentId, invited: state.residents[slot.id] === slot.residentId, residentReceiptId: state.residentReceipts?.[slot.id]?.id || '', position: slot.position }))),
        privateContentStored: false,
        rawCoordinatesStored: false,
        publicLandCreated: false,
        tradablePropertyCreated: false,
        automaticConstruction: false
      });
    }
  });
}

export function validateEonExpanseW768BMyFrontierState(state = {}) {
  const errors = [];
  if (state.schema !== EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA) errors.push('schema-invalid');
  if (state.layoutSchema !== EON_EXPANSE_W768A_MY_FRONTIER_LAYOUT_SCHEMA) errors.push('layout-schema-invalid');
  if (state.unlocked !== Boolean(state.unlockReceipt || state.earlyUnlockReceipt || state.starterAccessReceipt)) errors.push('unlock-receipt-state-mismatch');
  if (state.unlockReceipt && safeCampaignReceipt(state.unlockReceipt)?.campaignId !== 'signal-restoration') errors.push('unlock-receipt-invalid');
  if (state.earlyUnlockReceipt && !safeEarlyUnlockReceipt(state.earlyUnlockReceipt)) errors.push('early-unlock-receipt-invalid');
  if (state.starterAccessReceipt && !safeStarterAccessReceipt(state.starterAccessReceipt)) errors.push('starter-access-receipt-invalid');
  if ([state.unlockReceipt, state.earlyUnlockReceipt, state.starterAccessReceipt].filter(Boolean).length > 1) errors.push('multiple-unlock-authorities');
  if (state.unlocked && !['campaign', 'beacon-one-restoration', 'starter-access'].includes(state.unlockAuthority)) errors.push('unlock-authority-invalid');
  if (!state.unlocked && (state.themeId || Object.keys(state.buildingChoices || {}).length || Object.keys(state.residents || {}).length || Object.keys(state.residentReceipts || {}).length)) errors.push('locked-state-content-invalid');
  if (state.unlocked && !isEonExpanseW769BThemeId(state.themeId)) errors.push('theme-invalid');
  for (const [plotId, buildingId] of Object.entries(state.buildingChoices || {})) {
    const plot = contract.plots.find((entry) => entry.id === plotId);
    if (!plot || !plot.allowedBuildingIds.includes(buildingId)) errors.push(`building-choice-invalid:${plotId}:${buildingId}`);
  }
  for (const [slotId, residentId] of Object.entries(state.residents || {})) {
    const slot = contract.residentSlots.find((entry) => entry.id === slotId);
    const receipt = safeResidentReceipt(state.residentReceipts?.[slotId]);
    if (!slot || slot.residentId !== residentId) errors.push(`resident-choice-invalid:${slotId}:${residentId}`);
    if (!receipt || receipt.residentId !== residentId) errors.push(`resident-receipt-invalid:${slotId}:${residentId}`);
  }
  for (const slotId of Object.keys(state.residentReceipts || {})) if (!state.residents?.[slotId]) errors.push(`orphan-resident-receipt:${slotId}`);
  if (state.privateContentStored || state.rawCoordinatesStored || state.publicLandCreated || state.tradablePropertyCreated) errors.push('product-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), unlocked: Boolean(state.unlocked), buildingChoiceCount: Object.keys(state.buildingChoices || {}).length, residentCount: Object.keys(state.residents || {}).length });
}

export default freeze({
  EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA,
  createEonExpanseW768BMyFrontierState,
  validateEonExpanseW768BMyFrontierState
});
