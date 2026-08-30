/** W793A — exact owner-authorized future-region activation state. */
import { getEonExpanseW780AFutureRegion } from '../w780/eon-expanse-w780a-future-region-catalog.js';
import { validateEonExpanseW789ARegionPackageCertificationState } from '../w789/eon-expanse-w789a-region-package-certification-state.js';
import { validateEonExpanseW790APerformanceEvidence } from '../w790/eon-expanse-w790a-performance-certification-evidence.js';
import { sanitizeEonExpanseW788AReleaseReview } from '../w788/eon-expanse-w788a-future-region-release-review.js';

const freeze = Object.freeze;
const identifier = (value = '') => /^[a-z0-9][a-z0-9:_.-]{0,159}$/i.test(String(value || '')) ? String(value) : '';
const digest = (value = '') => /^[a-f0-9]{64}$/i.test(String(value || '')) ? String(value).toLowerCase() : '';
const channel = (value = '') => ['preview', 'production'].includes(String(value)) ? String(value) : '';

export const EON_EXPANSE_W793A_ACTIVATION_SCHEMA = 'eon.expanse.future-region-activation.w793a.v1';
export const EON_EXPANSE_W793A_OWNER_AUTHORIZATION_SCHEMA = 'eon.expanse.future-region-owner-authorization.w793a.v1';

export function sanitizeEonExpanseW793AOwnerAuthorization(input = null) {
  if (!input || typeof input !== 'object') return null;
  const regionId = identifier(input.regionId);
  const region = getEonExpanseW780AFutureRegion(regionId);
  const packageDigest = digest(input.packageDigest);
  const buildDigest = digest(input.buildDigest);
  const deploymentChannel = channel(input.deploymentChannel);
  const authorizedAt = Math.max(0, Number(input.authorizedAt) || 0);
  const authorizationId = identifier(input.authorizationId);
  if (!region || !packageDigest || !buildDigest || !deploymentChannel || authorizedAt <= 0) return null;
  if (authorizationId !== `future-region-owner-authorization:${deploymentChannel}:${regionId}`) return null;
  if (input.authorized !== true || input.explicitOwnerAction !== true || input.automaticAuthorization === true || input.privateContentStored === true) return null;
  return freeze({
    schema: EON_EXPANSE_W793A_OWNER_AUTHORIZATION_SCHEMA,
    authorizationId,
    regionId,
    gatewayId: region.gatewayId,
    packageDigest,
    buildDigest,
    deploymentChannel,
    authorizedAt,
    authorized: true,
    explicitOwnerAction: true,
    automaticAuthorization: false,
    privateContentStored: false
  });
}

export function sanitizeEonExpanseW793AActivation(input = null) {
  if (!input || typeof input !== 'object') return null;
  const regionId = identifier(input.regionId);
  const region = getEonExpanseW780AFutureRegion(regionId);
  const packageDigest = digest(input.packageDigest);
  const buildDigest = digest(input.buildDigest);
  const deploymentChannel = channel(input.deploymentChannel);
  const activatedAt = Math.max(0, Number(input.activatedAt) || 0);
  const activationId = identifier(input.activationId);
  if (!region || !packageDigest || !buildDigest || !deploymentChannel || activatedAt <= 0) return null;
  if (activationId !== `future-region-activation:${deploymentChannel}:${regionId}`) return null;
  if (input.gatewayActivated !== true || input.regionRendered === true || input.explicitOwnerAction !== true || input.automaticActivation === true || input.privateContentStored === true) return null;
  return freeze({
    schema: EON_EXPANSE_W793A_ACTIVATION_SCHEMA,
    activationId,
    regionId,
    gatewayId: region.gatewayId,
    packageDigest,
    buildDigest,
    deploymentChannel,
    activatedAt,
    status: deploymentChannel === 'production' ? 'production-gateway-activated-region-not-rendered' : 'preview-gateway-activated-region-not-rendered',
    gatewayActivated: true,
    regionRendered: false,
    explicitOwnerAction: true,
    automaticActivation: false,
    privateContentStored: false
  });
}

export function deriveEonExpanseW793AActivationAction({
  releaseReview = null,
  packageCertification = null,
  performanceEvidence = null,
  ownerAuthorization = null,
  currentActivation = null
} = {}) {
  const review = sanitizeEonExpanseW788AReleaseReview(releaseReview);
  const authorization = sanitizeEonExpanseW793AOwnerAuthorization(ownerAuthorization);
  const persisted = sanitizeEonExpanseW793AActivation(currentActivation);
  const packageValidation = validateEonExpanseW789ARegionPackageCertificationState(packageCertification, { expectedRegionId: review?.regionId || authorization?.regionId || '' });
  const performanceValidation = validateEonExpanseW790APerformanceEvidence(performanceEvidence, {
    expectedQuality: performanceEvidence?.quality || '',
    expectedBuildDigest: authorization?.buildDigest || ''
  });
  const exactMatch = Boolean(review && authorization && packageValidation.ok && performanceValidation.ok)
    && review.regionId === authorization.regionId
    && review.packageDigest === authorization.packageDigest
    && packageCertification?.packageDigest === authorization.packageDigest
    && performanceValidation.evidence?.buildDigest === authorization.buildDigest;
  const available = exactMatch && !persisted;
  const region = getEonExpanseW780AFutureRegion(authorization?.regionId || review?.regionId || '');
  const activationToken = available
    ? `${authorization.deploymentChannel}:${authorization.regionId}:${authorization.gatewayId}:${authorization.packageDigest}:${authorization.buildDigest}:${authorization.authorizedAt}`
    : '';
  return freeze({
    schema: `${EON_EXPANSE_W793A_ACTIVATION_SCHEMA}.action.v1`,
    visible: Boolean(review || authorization || persisted),
    available,
    status: persisted ? persisted.status : available ? 'explicit-owner-gateway-activation-available' : 'exact-release-evidence-and-owner-authorization-required',
    activation: persisted,
    action: available ? freeze({
      type: 'activate-future-region-gateway',
      regionId: region.id,
      gatewayId: region.gatewayId,
      packageDigest: authorization.packageDigest,
      buildDigest: authorization.buildDigest,
      deploymentChannel: authorization.deploymentChannel,
      authorizationId: authorization.authorizationId,
      activationToken,
      label: `Activate ${region.label} gateway on ${authorization.deploymentChannel}`
    }) : null,
    regionRendered: false,
    automaticActivation: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW793AActivationAction(view = null, {
  explicitOwnerAction = false,
  expectedRegionId = '',
  expectedGatewayId = '',
  expectedPackageDigest = '',
  expectedBuildDigest = '',
  expectedDeploymentChannel = '',
  expectedActivationToken = ''
} = {}) {
  if (!explicitOwnerAction) return freeze({ ok: false, reason: 'explicit-owner-action-required' });
  if (view?.available !== true || view?.action?.type !== 'activate-future-region-gateway') return freeze({ ok: false, reason: 'future-region-activation-unavailable' });
  const action = view.action;
  if (action.regionId !== expectedRegionId) return freeze({ ok: false, reason: 'region-stale' });
  if (action.gatewayId !== expectedGatewayId) return freeze({ ok: false, reason: 'gateway-stale' });
  if (action.packageDigest !== digest(expectedPackageDigest)) return freeze({ ok: false, reason: 'package-digest-stale' });
  if (action.buildDigest !== digest(expectedBuildDigest)) return freeze({ ok: false, reason: 'build-digest-stale' });
  if (action.deploymentChannel !== channel(expectedDeploymentChannel)) return freeze({ ok: false, reason: 'deployment-channel-stale' });
  if (action.activationToken !== expectedActivationToken) return freeze({ ok: false, reason: 'activation-token-stale' });
  return freeze({ ok: true, action });
}

export function confirmEonExpanseW793AActivation(action = null, { explicitOwnerAction = false, at = Date.now() } = {}) {
  if (!explicitOwnerAction) return freeze({ ok: false, reason: 'explicit-owner-action-required' });
  const region = getEonExpanseW780AFutureRegion(action?.regionId);
  if (!region || action?.type !== 'activate-future-region-gateway' || action?.gatewayId !== region.gatewayId || !digest(action?.packageDigest) || !digest(action?.buildDigest) || !channel(action?.deploymentChannel)) return freeze({ ok: false, reason: 'maintained-activation-action-required' });
  const state = sanitizeEonExpanseW793AActivation({
    activationId: `future-region-activation:${action.deploymentChannel}:${region.id}`,
    regionId: region.id,
    packageDigest: action.packageDigest,
    buildDigest: action.buildDigest,
    deploymentChannel: action.deploymentChannel,
    activatedAt: Math.max(1, Number(at) || Date.now()),
    gatewayActivated: true,
    regionRendered: false,
    explicitOwnerAction: true,
    automaticActivation: false,
    privateContentStored: false
  });
  return freeze({ ok: Boolean(state), state, gatewayActivated: Boolean(state), regionRendered: false, automaticActivation: false, grantsXp: false });
}

export default freeze({
  EON_EXPANSE_W793A_ACTIVATION_SCHEMA,
  EON_EXPANSE_W793A_OWNER_AUTHORIZATION_SCHEMA,
  sanitizeEonExpanseW793AOwnerAuthorization,
  sanitizeEonExpanseW793AActivation,
  deriveEonExpanseW793AActivationAction,
  validateEonExpanseW793AActivationAction,
  confirmEonExpanseW793AActivation
});
