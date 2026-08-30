/**
 * W768X — truthful authored character request plan for My Frontier residents.
 *
 * The plan reuses maintained W649 animated character assets only after a
 * resident invitation has survived W768V receipt revalidation. It does not
 * load, render or hide the station signal by itself.
 */

import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { deriveEonExpanseW768TResidentStations } from './eon-expanse-w768t-my-frontier-resident-stations.js';

export const EON_EXPANSE_W768X_RESIDENT_ASSET_PLAN_SCHEMA = 'eon.expanse.my-frontier-resident-asset-plan.w768x.v1';
const freeze = Object.freeze;

export const EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES = freeze({
  pathfinder: freeze({ residentId: 'pathfinder', assetAlias: 'player-primary', fallbackAlias: 'player-fallback', targetHeight: 2.25, idleKind: 'idle', interactionKind: 'talk' }),
  navigator: freeze({ residentId: 'navigator', assetAlias: 'archive-guide', fallbackAlias: '', targetHeight: 2.18, idleKind: 'idle', interactionKind: 'talk' }),
  'maintenance-specialist': freeze({ residentId: 'maintenance-specialist', assetAlias: 'forge-worker', fallbackAlias: 'device-lab-specialist', targetHeight: 2.15, idleKind: 'idle', interactionKind: 'interact' }),
  'creator-trade-master': freeze({ residentId: 'creator-trade-master', assetAlias: 'trade-steward', fallbackAlias: 'creator-host', targetHeight: 2.2, idleKind: 'idle', interactionKind: 'talk' }),
  'vault-steward': freeze({ residentId: 'vault-steward', assetAlias: 'vault-steward', fallbackAlias: 'vault-steward-alt', targetHeight: 2.16, idleKind: 'idle', interactionKind: 'talk' }),
  'eon-architect': freeze({ residentId: 'eon-architect', assetAlias: 'architect', fallbackAlias: '', targetHeight: 2.22, idleKind: 'idle', interactionKind: 'talk' })
});

function assetVariant(asset, variant = 'primary') {
  const value = asset?.variants?.[variant] || null;
  const path = String(value?.path || '');
  if (!path.startsWith(`/assets/city/w649/${variant}/characters/`) || !/\.[a-f0-9]{12}\.glb$/i.test(path)) return null;
  return freeze({ path, bytes: Math.max(0, Number(value.bytes || 0)), sha256: String(value.sha256 || ''), integrity: String(value.integrity || '') });
}

function resolveAsset(alias = '') {
  const asset = getEonCityW649Character(alias);
  if (!asset || Number(asset.animations || 0) <= 0 || Number(asset.skins || 0) <= 0) return null;
  const primary = assetVariant(asset, 'primary');
  const fallback = assetVariant(asset, 'fallback');
  if (!primary || !fallback) return null;
  return freeze({ assetId: asset.id, animationCount: Number(asset.animations || 0), animationNames: freeze([...(asset.animationNames || [])]), primary, fallback });
}

export function deriveEonExpanseW768XResidentAssetPlan({ myFrontierState = null } = {}) {
  const stations = deriveEonExpanseW768TResidentStations({ myFrontierState: myFrontierState || {} });
  const requests = [];
  const pending = [];
  for (const station of stations.slots) {
    const policy = EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES[station.residentId] || null;
    const receipt = myFrontierState?.residentReceipts?.[station.slotId] || null;
    if (!station.invited || !receipt || receipt.residentId !== station.residentId) {
      pending.push(freeze({ slotId: station.slotId, residentId: station.residentId, status: station.invited ? 'verified-resident-receipt-required' : 'resident-not-invited' }));
      continue;
    }
    const primaryAsset = resolveAsset(policy?.assetAlias);
    const fallbackAsset = policy?.fallbackAlias ? resolveAsset(policy.fallbackAlias) : null;
    if (!policy || !primaryAsset) {
      pending.push(freeze({ slotId: station.slotId, residentId: station.residentId, status: 'authored-character-unavailable' }));
      continue;
    }
    requests.push(freeze({
      slotId: station.slotId,
      residentId: station.residentId,
      receiptId: String(receipt.id || ''),
      targetHeight: policy.targetHeight,
      worldPosition: station.worldPosition,
      heading: station.heading,
      routeRadius: station.routeRadius,
      idleKind: policy.idleKind,
      interactionKind: policy.interactionKind,
      primary: primaryAsset,
      alternate: fallbackAsset,
      stationSignalRemainsUntilValidated: true,
      automaticLoad: false,
      privateContentStored: false
    }));
  }
  return freeze({
    schema: EON_EXPANSE_W768X_RESIDENT_ASSET_PLAN_SCHEMA,
    unlocked: stations.unlocked,
    requests: freeze(requests),
    pending: freeze(pending),
    requestedCount: requests.length,
    pendingCount: pending.length,
    residentBodyCountBeforeValidation: 0,
    stationSignalRemainsUntilValidated: true,
    automaticLoad: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768XResidentAssetPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_EXPANSE_W768X_RESIDENT_ASSET_PLAN_SCHEMA) errors.push('schema-invalid');
  for (const request of plan.requests || []) {
    if (!request.slotId || !request.residentId || !request.receiptId || !Number.isFinite(request.targetHeight) || request.targetHeight <= 0) errors.push(`request-identity-invalid:${request.slotId || 'unknown'}`);
    if (!request.primary?.primary?.path?.startsWith('/assets/city/w649/primary/characters/') || !request.primary?.fallback?.path?.startsWith('/assets/city/w649/fallback/characters/')) errors.push(`primary-variants-invalid:${request.slotId || 'unknown'}`);
    if (request.primary?.animationCount <= 0 || request.primary?.animationNames?.length !== request.primary?.animationCount) errors.push(`animations-invalid:${request.slotId || 'unknown'}`);
    if (!request.stationSignalRemainsUntilValidated || request.automaticLoad || request.privateContentStored) errors.push(`product-boundary-invalid:${request.slotId || 'unknown'}`);
  }
  if (plan.residentBodyCountBeforeValidation !== 0 || !plan.stationSignalRemainsUntilValidated || plan.automaticLoad || plan.privateContentStored) errors.push('plan-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), requestedCount: Number(plan.requestedCount || 0), pendingCount: Number(plan.pendingCount || 0) });
}

export default freeze({
  EON_EXPANSE_W768X_RESIDENT_ASSET_PLAN_SCHEMA,
  EON_EXPANSE_W768X_RESIDENT_ASSET_POLICIES,
  deriveEonExpanseW768XResidentAssetPlan,
  validateEonExpanseW768XResidentAssetPlan
});
