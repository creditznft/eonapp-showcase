/** W768C — verified My Frontier construction permits. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from './eon-expanse-w768b-my-frontier-state.js';
import { validateEonExpanseW767WProductiveReceipt } from '../w766/eon-expanse-w767w-productive-receipt-bridge.js';

export const EON_EXPANSE_W768C_CONSTRUCTION_PERMIT_SCHEMA = 'eon.expanse.my-frontier-construction-permit.w768c.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();
const campaign = (buildingId) => freeze({ buildingId, authority: 'campaign' });
const productive = (buildingId, missionId) => freeze({ buildingId, authority: 'productive', missionId });
const pending = (buildingId, unavailableReason) => freeze({ buildingId, authority: 'pending', unavailableReason });

export const EON_EXPANSE_W768C_CONSTRUCTION_POLICIES = freeze({
  'command-core': campaign('command-core'),
  'creator-workshop': productive('creator-workshop', 'create-expedition'),
  'media-foundry': pending('media-foundry', 'native-creator-capture-receipt-pending'),
  'design-pavilion': productive('design-pavilion', 'create-expedition'),
  'project-atlas': pending('project-atlas', 'native-project-milestone-receipt-pending'),
  'archive-vault': productive('archive-vault', 'knowledge-recovery'),
  'research-observatory': productive('research-observatory', 'knowledge-recovery'),
  'local-ai-observatory': productive('local-ai-observatory', 'local-ai-survey'),
  'automation-relay': productive('automation-relay', 'automation-relay'),
  'agent-theatre': pending('agent-theatre', 'native-agent-result-receipt-pending'),
  'broadcast-tower': pending('broadcast-tower', 'native-share-package-receipt-pending'),
  'creator-capture-studio': pending('creator-capture-studio', 'native-creator-capture-receipt-pending'),
  'community-beacon': pending('community-beacon', 'native-collaboration-receipt-pending'),
  'regional-transit-station': campaign('regional-transit-station'),
  'expedition-hangar': campaign('expedition-hangar'),
  'gateway-terminal': campaign('gateway-terminal'),
  'eonbot-temple': campaign('eonbot-temple'),
  'reflection-garden': campaign('reflection-garden'),
  'vault-reveal-gallery': campaign('vault-reveal-gallery')
});

function safeCampaignReceipt(value) {
  const completedAt = Number(value?.completedAt || 0);
  if (!value?.id || value?.campaignId !== 'signal-restoration' || !Number.isFinite(completedAt) || completedAt <= 0) return null;
  return freeze({ id: String(value.id), campaignId: 'signal-restoration', completedAt, totalXp: Math.max(0, Number(value.totalXp || 0)), cosmeticId: String(value.cosmeticId || ''), privateContentStored: false });
}

export function deriveEonExpanseW768CConstructionPermit({ myFrontierState, plotId = '', buildingId = '', campaignReceipt = null, workspaceReceipt = null, nativePlan = null, verifyCampaignReceipt = null } = {}) {
  if (myFrontierState?.schema !== EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA || myFrontierState.unlocked !== true) return freeze({ ok: false, reason: 'my-frontier-unlocked-state-required' });
  const plot = contract.plots.find((entry) => entry.id === String(plotId));
  if (!plot) return freeze({ ok: false, reason: 'plot-not-found' });
  if (!plot.allowedBuildingIds.includes(String(buildingId))) return freeze({ ok: false, reason: 'building-not-allowed-for-plot' });
  if (String(myFrontierState.buildingChoices?.[plot.id] || '') !== String(buildingId)) return freeze({ ok: false, reason: 'planned-building-selection-required' });
  const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[buildingId];
  if (!policy) return freeze({ ok: false, reason: 'construction-policy-not-found' });
  if (policy.authority === 'pending') return freeze({ ok: false, reason: policy.unavailableReason, authority: 'pending', plotId: plot.id, buildingId, reviewFirst: true });

  let receipt;
  let authoritySchema;
  let sourceMissionId;
  if (policy.authority === 'campaign') {
    if (typeof verifyCampaignReceipt !== 'function') return freeze({ ok: false, reason: 'campaign-receipt-authority-unavailable' });
    const candidate = safeCampaignReceipt(campaignReceipt);
    const verified = candidate ? verifyCampaignReceipt({ campaignReceipt: candidate }) : null;
    receipt = safeCampaignReceipt(verified?.receipt);
    if (!verified?.ok || !candidate || !receipt || candidate.id !== receipt.id || candidate.completedAt !== receipt.completedAt) return freeze({ ok: false, reason: verified?.reason || 'campaign-receipt-mismatch' });
    authoritySchema = 'eon.expanse.signal-restoration.campaign-receipt';
    sourceMissionId = 'the-first-reveal';
  } else {
    const verified = validateEonExpanseW767WProductiveReceipt({ missionId: policy.missionId, workspaceReceipt, nativePlan });
    if (!verified.ok) return freeze({ ...verified, authority: 'productive', plotId: plot.id, buildingId });
    receipt = verified.receipt;
    authoritySchema = receipt.authoritySchema;
    sourceMissionId = policy.missionId;
  }
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W768C_CONSTRUCTION_PERMIT_SCHEMA,
    permitId: `my-frontier-construction:${plot.id}:${buildingId}:${receipt.id}`,
    plotId: plot.id,
    district: plot.district,
    buildingId,
    authority: policy.authority,
    authoritySchema,
    sourceMissionId,
    sourceReceiptId: receipt.id,
    verifiedAt: Number(receipt.verifiedAt || receipt.completedAt || 0),
    position: plot.position,
    heading: plot.heading,
    entranceAnchor: plot.entranceAnchor,
    roadAnchor: plot.roadAnchor,
    interactionAnchor: plot.interactionAnchor,
    collisionEnvelope: plot.collisionEnvelope,
    reviewFirst: true,
    explicitConfirmationRequired: true,
    automaticConstruction: false,
    privateContentStored: false,
    rawCoordinatesAccepted: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

export function validateEonExpanseW768CConstructionPermit(permit, expected = {}) {
  if (!permit?.ok || permit.schema !== EON_EXPANSE_W768C_CONSTRUCTION_PERMIT_SCHEMA) return freeze({ ok: false, reason: permit?.reason || 'construction-permit-required' });
  if (expected.plotId && expected.plotId !== permit.plotId) return freeze({ ok: false, reason: 'construction-plot-selection-changed' });
  if (expected.buildingId && expected.buildingId !== permit.buildingId) return freeze({ ok: false, reason: 'construction-building-selection-changed' });
  if (expected.sourceReceiptId && expected.sourceReceiptId !== permit.sourceReceiptId) return freeze({ ok: false, reason: 'construction-receipt-selection-changed' });
  if (!permit.permitId || !permit.sourceReceiptId || !permit.reviewFirst || !permit.explicitConfirmationRequired || permit.automaticConstruction || permit.privateContentStored || permit.rawCoordinatesAccepted || permit.publicLandCreated || permit.tradablePropertyCreated) return freeze({ ok: false, reason: 'construction-permit-boundary-invalid' });
  return freeze({ ok: true, permit, mutatesNativeAuthority: false, awardsXp: false });
}

export function listEonExpanseW768CConstructionAvailability(myFrontierState = {}) {
  if (myFrontierState?.schema !== EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA || !myFrontierState.unlocked) return freeze([]);
  return freeze(contract.plots.map((plot) => {
    const buildingId = String(myFrontierState.buildingChoices?.[plot.id] || '');
    const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[buildingId];
    return freeze({ plotId: plot.id, district: plot.district, buildingId, authority: policy?.authority || 'unselected', sourceMissionId: policy?.missionId || (policy?.authority === 'campaign' ? 'the-first-reveal' : ''), unavailableReason: policy?.unavailableReason || '', reviewFirst: true, automaticConstruction: false });
  }));
}
