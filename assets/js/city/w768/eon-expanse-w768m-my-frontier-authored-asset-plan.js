/**
 * W768M — authored-asset request plan for My Frontier.
 *
 * This pure projection decides what may be requested. It does not load assets,
 * mutate the scene or hide foundations/scaffolding. Only independently verified
 * construction presentation may request an authored anchor.
 */
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { getEonExpanseW768LAuthoredAssetEntry } from './eon-expanse-w768l-my-frontier-authored-asset-catalog.js';

export const EON_EXPANSE_W768M_AUTHORED_ASSET_PLAN_SCHEMA = 'eon.expanse.my-frontier-authored-asset-plan.w768m.v1';
const freeze = (value) => Object.freeze(value);

function normalizePresentationRows(presentation = {}) {
  return new Map((Array.isArray(presentation?.plots) ? presentation.plots : []).map((entry) => [String(entry?.plotId || ''), entry]));
}

export function deriveEonExpanseW768MAuthoredAssetPlan({ presentation = {} } = {}) {
  const rows = normalizePresentationRows(presentation);
  const plots = EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.map((plot) => {
    const current = rows.get(plot.id) || {};
    const buildingId = String(current.selectedBuildingId || '');
    const catalog = buildingId ? getEonExpanseW768LAuthoredAssetEntry(buildingId) : null;
    const verifiedConstruction = current.status === 'constructed-foundation'
      && current.foundationVisible === true
      && current.scaffoldingVisible === true
      && Boolean(buildingId);
    let status = 'not-requested';
    let reason = 'No verified constructed foundation requests an authored asset.';
    if (verifiedConstruction && catalog?.status === 'authored-anchor-ready') {
      status = 'load-authored-anchor';
      reason = 'Verified construction may request the approved same-origin authored anchor.';
    } else if (verifiedConstruction && catalog?.status === 'dedicated-authored-building-pending') {
      status = 'dedicated-art-pending';
      reason = catalog.reason;
    } else if (verifiedConstruction && !catalog) {
      status = 'catalog-entry-missing';
      reason = 'No approved authored-asset catalog entry exists for this building.';
    }
    return freeze({
      plotId: plot.id,
      district: plot.district,
      buildingId,
      status,
      reason,
      requestAsset: status === 'load-authored-anchor',
      sourceAuthority: status === 'load-authored-anchor' ? catalog.sourceAuthority : '',
      assetId: status === 'load-authored-anchor' ? catalog.assetId : '',
      targetHeight: status === 'load-authored-anchor' ? catalog.targetHeight : 0,
      variants: status === 'load-authored-anchor' ? catalog.variants : freeze({ primary: null, fallback: null }),
      foundationMustRemainVisible: true,
      scaffoldingMustRemainVisible: true,
      finishedBuildingVisible: false,
      automaticLoadFromPlanOnly: false,
      grantsXp: false,
      mutatesProgression: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W768M_AUTHORED_ASSET_PLAN_SCHEMA,
    plots: freeze(plots),
    requestedCount: plots.filter((entry) => entry.requestAsset).length,
    dedicatedArtPendingCount: plots.filter((entry) => entry.status === 'dedicated-art-pending').length,
    plannedHologramsCanRequestAssets: false,
    foundationHiddenByAnchor: false,
    scaffoldingHiddenByAnchor: false,
    finishedBuildingPrimitives: 0,
    automaticConstruction: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768MAuthoredAssetPlan(plan = {}) {
  const errors = [];
  const plots = Array.isArray(plan?.plots) ? plan.plots : [];
  if (plan?.schema !== EON_EXPANSE_W768M_AUTHORED_ASSET_PLAN_SCHEMA) errors.push('schema-invalid');
  if (plots.length !== 7 || new Set(plots.map((entry) => entry.plotId)).size !== 7) errors.push('seven-unique-plots-required');
  for (const entry of plots) {
    if (!['not-requested', 'load-authored-anchor', 'dedicated-art-pending', 'catalog-entry-missing'].includes(entry.status)) errors.push(`status-invalid:${entry.plotId}`);
    if (entry.requestAsset) {
      if (entry.status !== 'load-authored-anchor' || !entry.assetId || !entry.sourceAuthority || !Number.isFinite(entry.targetHeight) || entry.targetHeight <= 0) errors.push(`request-invalid:${entry.plotId}`);
      if (!entry.variants?.primary?.path || !entry.variants?.fallback?.path) errors.push(`variants-missing:${entry.plotId}`);
    }
    if (entry.foundationMustRemainVisible !== true || entry.scaffoldingMustRemainVisible !== true || entry.finishedBuildingVisible !== false) errors.push(`presentation-truth:${entry.plotId}`);
    if (entry.grantsXp !== false || entry.mutatesProgression !== false || entry.automaticLoadFromPlanOnly !== false) errors.push(`authority-boundary:${entry.plotId}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), count: plots.length });
}

export default freeze({ EON_EXPANSE_W768M_AUTHORED_ASSET_PLAN_SCHEMA, deriveEonExpanseW768MAuthoredAssetPlan, validateEonExpanseW768MAuthoredAssetPlan });
