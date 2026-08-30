/** W769E — explicit, idempotent My Frontier operational district upgrade ledger. */
import { validateEonExpanseW769DDistrictUpgradeAction } from './eon-expanse-w769d-my-frontier-district-upgrade.js';

export const EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA = 'eon.expanse.my-frontier-upgrade-ledger.w769e.v1';
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,319}$/i;

function sanitizeRecord(value = null) {
  const plotId = String(value?.plotId || '');
  const buildingId = String(value?.buildingId || '');
  const permitId = String(value?.permitId || '');
  const sourceReceiptId = String(value?.sourceReceiptId || '');
  const level = Number(value?.level || 0);
  const upgradedAt = Number(value?.upgradedAt || 0);
  if (![plotId, buildingId, permitId, sourceReceiptId].every((entry) => SAFE_ID.test(entry)) || level !== 2 || !Number.isFinite(upgradedAt) || upgradedAt <= 0) return null;
  return freeze({ plotId, buildingId, level: 2, permitId, sourceReceiptId, upgradedAt, privateContentStored: false });
}

function normalizeState(input = {}, verifyUpgradeRecord = null) {
  const records = [];
  const seenPlots = new Set();
  const seenPermits = new Set();
  for (const value of Array.isArray(input.records) ? input.records : []) {
    const record = sanitizeRecord(value);
    if (!record || seenPlots.has(record.plotId) || seenPermits.has(record.permitId)) continue;
    if (typeof verifyUpgradeRecord !== 'function' || verifyUpgradeRecord({ record })?.ok !== true) continue;
    seenPlots.add(record.plotId); seenPermits.add(record.permitId); records.push(record);
  }
  return freeze({
    schema: EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA,
    records: freeze(records),
    updatedAt: Math.max(0, Number(input.updatedAt || 0)),
    automaticUpgrade: false,
    awardsXp: false,
    privateContentStored: false,
    rawCoordinatesStored: false,
    paidShortcutAccepted: false,
    levelThreeAuthorityPending: true
  });
}

export function createEonExpanseW769EUpgradeLedger({ initial = {}, now = Date.now, onChange = null, verifyUpgradeView = null, verifyUpgradeRecord = null } = {}) {
  let state = normalizeState(initial, verifyUpgradeRecord);
  const commit = (records) => {
    state = normalizeState({ records, updatedAt: Number(now()) }, verifyUpgradeRecord);
    onChange?.(state);
    return state;
  };
  return freeze({
    getState() { return state; },
    confirmUpgrade({ upgradeView = null, explicitUserAction = false } = {}) {
      const base = validateEonExpanseW769DDistrictUpgradeAction(upgradeView, { explicitUserAction });
      if (!base.ok) return base;
      if (typeof verifyUpgradeView !== 'function') return freeze({ ok: false, reason: 'district-upgrade-authority-unavailable' });
      const current = verifyUpgradeView({ upgradeView });
      if (!current?.ok || current.action?.permitId !== base.action.permitId || current.action?.sourceReceiptId !== base.action.sourceReceiptId) return freeze({ ok: false, reason: current?.reason || 'district-upgrade-permit-stale' });
      const existing = state.records.find((entry) => entry.plotId === base.action.plotId);
      if (existing) return freeze({ ok: false, reason: 'district-operational-upgrade-already-complete', record: existing });
      if (state.records.some((entry) => entry.permitId === base.action.permitId)) return freeze({ ok: false, reason: 'district-upgrade-permit-already-consumed' });
      const record = sanitizeRecord({ plotId: base.action.plotId, buildingId: base.action.buildingId, level: 2, permitId: base.action.permitId, sourceReceiptId: base.action.sourceReceiptId, upgradedAt: Number(now()) });
      if (!record) return freeze({ ok: false, reason: 'district-upgrade-record-invalid' });
      const next = commit([...state.records, record]);
      const persisted = next.records.find((entry) => entry.permitId === record.permitId);
      if (!persisted) return freeze({ ok: false, reason: 'district-upgrade-record-verification-failed' });
      return freeze({ ok: true, status: 'operational-upgrade-complete', record: persisted, state: next, explicitUserAction: true, automaticUpgrade: false, awardsXp: false });
    },
    getSafeProjection(constructionProjection = {}) {
      const plots = (Array.isArray(constructionProjection?.plots) ? constructionProjection.plots : []).map((plot) => {
        const record = state.records.find((entry) => entry.plotId === plot.plotId) || null;
        const constructed = Boolean(plot.constructedBuildingId);
        return freeze({ plotId: String(plot.plotId || ''), buildingId: String(plot.constructedBuildingId || ''), constructionStatus: String(plot.status || ''), level: record ? 2 : constructed ? 1 : 0, upgradeStatus: record ? 'operational' : constructed ? 'foundation' : 'unavailable', upgradeReceiptId: record ? `upgraded:${record.permitId}` : '', privateContentStored: false });
      });
      return freeze({ schema: `${EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA}.projection.v1`, plots: freeze(plots), operationalCount: state.records.length, automaticUpgrade: false, awardsXp: false, privateContentStored: false, rawCoordinatesStored: false });
    }
  });
}

export function validateEonExpanseW769EUpgradeLedger(state = {}) {
  const records = Array.isArray(state.records) ? state.records : [];
  const errors = [];
  if (state.schema !== EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA) errors.push('schema-invalid');
  if (records.some((entry) => !sanitizeRecord(entry))) errors.push('upgrade-record-invalid');
  if (new Set(records.map((entry) => entry.plotId)).size !== records.length) errors.push('one-operational-upgrade-per-plot-required');
  if (new Set(records.map((entry) => entry.permitId)).size !== records.length) errors.push('unique-upgrade-permit-required');
  if (state.automaticUpgrade || state.awardsXp || state.privateContentStored || state.rawCoordinatesStored || state.paidShortcutAccepted) errors.push('upgrade-ledger-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), operationalCount: records.length });
}

export default freeze({ EON_EXPANSE_W769E_UPGRADE_LEDGER_SCHEMA, createEonExpanseW769EUpgradeLedger, validateEonExpanseW769EUpgradeLedger });
