/**
 * W228 inactive feature-gate compatibility surface.
 * The historic unlock economy is retired. This module intentionally does not
 * mount promotion UI, block a user, calculate a balance, or create an
 * entitlement. It exists only so legacy callers fail safe during retirement.
 */
import { getFeatureAccessStatus } from './feature-unlock-panel.js';

export const FEATURE_GATE_SCHEMA = 'eon.feature-gate.w228.inactive.v1';
export const FEATURE_SURFACE_UNLOCKS = Object.freeze([]);

export function resolveFeatureUnlockForPath(_pathname = '/') { return null; }
export function mountContextualFeatureGate(_options = {}) { return null; }
export function annotateFeatureGateStatus(documentRef = document, featureId = 'available') {
  const status = getFeatureAccessStatus(featureId);
  const root = documentRef?.documentElement;
  if (root?.dataset) {
    root.dataset.eonFeatureAccess = status.access;
    root.dataset.eonFeatureId = status.featureId;
  }
  return status;
}
export function installFeatureGateClickHandlers(_documentRef = document) { return () => {}; }
export function getFeatureGateCoverage() {
  return Object.freeze({ schema: FEATURE_GATE_SCHEMA, routes: 0, featureIds: [], active: false });
}

export default {
  FEATURE_GATE_SCHEMA,
  FEATURE_SURFACE_UNLOCKS,
  resolveFeatureUnlockForPath,
  mountContextualFeatureGate,
  installFeatureGateClickHandlers,
  annotateFeatureGateStatus,
  getFeatureGateCoverage
};
