/** W768D — explicit, idempotent My Frontier construction ledger. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { validateEonExpanseW768CConstructionPermit } from './eon-expanse-w768c-my-frontier-construction-permit.js';

export const EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA = 'eon.expanse.my-frontier-construction-ledger.w768d.v1';
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,319}$/i;
const contract = createEonExpanseW768AMyFrontierLayoutContract();

function sanitizeRecord(value = null) {
  if (!value || typeof value !== 'object') return null;
  const plotId = String(value.plotId || '');
  const buildingId = String(value.buildingId || '');
  const permitId = String(value.permitId || '');
  const sourceReceiptId = String(value.sourceReceiptId || '');
  const authority = String(value.authority || '');
  const constructedAt = Number(value.constructedAt || 0);
  const plot = contract.plots.find((entry) => entry.id === plotId);
  if (!plot || !plot.allowedBuildingIds.includes(buildingId) || !SAFE_ID.test(permitId) || !SAFE_ID.test(sourceReceiptId) || !['campaign', 'productive'].includes(authority) || !Number.isFinite(constructedAt) || constructedAt <= 0) return null;
  return freeze({ plotId, buildingId, permitId, sourceReceiptId, authority, constructedAt, privateContentStored: false, rawCoordinatesStored: false });
}

function normalizeState(input = {}, verifyConstructionRecord = null) {
  const records = [];
  const seenPlots = new Set();
  const seenPermits = new Set();
  for (const value of Array.isArray(input.records) ? input.records : []) {
    const record = sanitizeRecord(value);
    if (!record || seenPlots.has(record.plotId) || seenPermits.has(record.permitId)) continue;
    if (typeof verifyConstructionRecord !== 'function' || verifyConstructionRecord({ record })?.ok !== true) continue;
    seenPlots.add(record.plotId);
    seenPermits.add(record.permitId);
    records.push(record);
  }
  return freeze({
    schema: EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA,
    records: freeze(records),
    updatedAt: Math.max(0, Number(input.updatedAt || 0)),
    privateContentStored: false,
    rawCoordinatesStored: false,
    awardsXp: false,
    automaticConstruction: false,
    publicLandCreated: false,
    tradablePropertyCreated: false
  });
}

export function createEonExpanseW768DConstructionLedger({ initial = {}, now = Date.now, onChange = null, verifyConstructionPermit = null, verifyConstructionRecord = null } = {}) {
  let state = normalizeState(initial, verifyConstructionRecord);
  const commit = (records) => {
    state = normalizeState({ records, updatedAt: Number(now()) }, verifyConstructionRecord);
    onChange?.(state);
    return state;
  };
  return freeze({
    getState() { return state; },
    confirmConstruction({ permit = null, explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const base = validateEonExpanseW768CConstructionPermit(permit);
      if (!base.ok) return base;
      if (typeof verifyConstructionPermit !== 'function') return freeze({ ok: false, reason: 'construction-permit-authority-unavailable' });
      const current = verifyConstructionPermit({ permit });
      if (!current?.ok || current.permit?.permitId !== permit.permitId || current.permit?.sourceReceiptId !== permit.sourceReceiptId) return freeze({ ok: false, reason: current?.reason || 'construction-permit-stale' });
      const existing = state.records.find((entry) => entry.plotId === permit.plotId);
      if (existing?.buildingId === permit.buildingId) return freeze({ ok: false, reason: 'building-already-constructed', record: existing });
      if (existing) return freeze({ ok: false, reason: 'plot-already-constructed', record: existing });
      if (state.records.some((entry) => entry.permitId === permit.permitId)) return freeze({ ok: false, reason: 'construction-permit-already-consumed' });
      const record = sanitizeRecord({
        plotId: permit.plotId,
        buildingId: permit.buildingId,
        permitId: permit.permitId,
        sourceReceiptId: permit.sourceReceiptId,
        authority: permit.authority,
        constructedAt: Number(now())
      });
      if (!record) return freeze({ ok: false, reason: 'construction-record-invalid' });
      const next = commit([...state.records, record]);
      const persisted = next.records.find((entry) => entry.permitId === record.permitId);
      if (!persisted) return freeze({ ok: false, reason: 'construction-record-verification-failed' });
      return freeze({
        ok: true,
        status: 'constructed',
        record: persisted,
        constructionReceipt: freeze({
          id: `constructed:${persisted.permitId}`,
          status: 'completed',
          plotId: persisted.plotId,
          buildingId: persisted.buildingId,
          sourceReceiptId: persisted.sourceReceiptId,
          constructedAt: persisted.constructedAt,
          awardsXp: false,
          privateContentStored: false
        }),
        state: next,
        explicitUserAction: true,
        automaticConstruction: false,
        awardsXp: false
      });
    },
    getSafeProjection(myFrontierState = {}) {
      return freeze({
        schema: `${EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA}.projection.v1`,
        plots: freeze(contract.plots.map((plot) => {
          const record = state.records.find((entry) => entry.plotId === plot.id) || null;
          const plannedBuildingId = String(myFrontierState?.buildingChoices?.[plot.id] || '');
          return freeze({
            plotId: plot.id,
            district: plot.district,
            position: plot.position,
            entranceAnchor: plot.entranceAnchor,
            roadAnchor: plot.roadAnchor,
            plannedBuildingId,
            constructedBuildingId: record?.buildingId || '',
            status: record ? 'constructed' : plannedBuildingId ? 'planned' : 'empty',
            constructionReceiptId: record ? `constructed:${record.permitId}` : ''
          });
        })),
        constructedCount: state.records.length,
        awardsXp: false,
        privateContentStored: false,
        rawCoordinatesStored: false,
        automaticConstruction: false
      });
    }
  });
}

export function validateEonExpanseW768DConstructionLedger(state = {}) {
  const errors = [];
  const records = Array.isArray(state.records) ? state.records : [];
  if (state.schema !== EON_EXPANSE_W768D_CONSTRUCTION_LEDGER_SCHEMA) errors.push('schema-invalid');
  if (new Set(records.map((entry) => entry.plotId)).size !== records.length) errors.push('one-building-per-plot-required');
  if (new Set(records.map((entry) => entry.permitId)).size !== records.length) errors.push('unique-construction-permits-required');
  if (records.some((entry) => !sanitizeRecord(entry))) errors.push('construction-record-invalid');
  if (state.privateContentStored || state.rawCoordinatesStored || state.awardsXp || state.automaticConstruction || state.publicLandCreated || state.tradablePropertyCreated) errors.push('construction-ledger-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), constructedCount: records.length });
}
