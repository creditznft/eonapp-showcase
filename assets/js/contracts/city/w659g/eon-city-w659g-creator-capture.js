/** A15 I15 — EONCITY adapter for the Core-owned Creator Capture authority. */
import {
  EON_CREATOR_CAPTURE_OPEN_EVENT,
  EON_CREATOR_CAPTURE_SCHEMA,
  createEonCreatorCaptureController,
  getEonCreatorCaptureCapability
} from '../../creator/eon-creator-capture.js';
import { dispatchEonCityW659gVerifiedAction } from './eon-city-w659g-progression-ledger.js';
import { dispatchEonWorkSurfaceOpen } from '../../../work-surface/eon-work-surface-registry.js';
import { projectEonCityDistribution } from '../eon-city-access-distribution-projection.js';

export const EON_CITY_W659G_CAPTURE_SCHEMA = 'eon.city.w659g.creator-capture.adapter.v2';
export const EON_CITY_W659G_CAPTURE_OPEN_EVENT = 'eon:city:open-creator-capture';
export { EON_CREATOR_CAPTURE_OPEN_EVENT, EON_CREATOR_CAPTURE_SCHEMA };

export function getEonCityW659gCaptureCapability(options = {}) {
  const capability = getEonCreatorCaptureCapability(options);
  return Object.freeze({ ...capability, cityDistribution: projectEonCityDistribution({ captureCapability: capability }) });
}

export function createEonCityW659gCaptureController(options = {}) {
  const environment = options.environment || globalThis;
  const caller = typeof options.onVerifiedCapture === 'function' ? options.onVerifiedCapture : () => {};
  return createEonCreatorCaptureController({
    ...options,
    environment,
    filenamePrefix: 'eoncity-gameplay',
    frameLabel: 'EONCITY · PRODUCTIVE PLAY',
    onVerifiedCapture(receipt) {
      caller(receipt);
      dispatchEonCityW659gVerifiedAction({
        type: 'city.capture.saved-local',
        receiptId: receipt.receiptId,
        verified: receipt.verified === true,
        verifiedAt: receipt.verifiedAt,
        source: 'creator-capture-core-adapter'
      }, environment);
    }
  });
}

export function bindEonCityW659gCreatorCapture(root, { onStatus = () => {} } = {}) {
  if (!root?.ownerDocument) return () => {};
  const environment = root.ownerDocument.defaultView || globalThis;
  const open = () => {
    onStatus?.('Opening Core Creator Capture for this City moment. Recording remains local and permission-based.');
    dispatchEonWorkSurfaceOpen({ id: 'creator-capture', source: 'eoncity', explicitUserAction: true, context: { type: 'city', referralLink: true } }, environment);
  };
  environment.addEventListener?.(EON_CITY_W659G_CAPTURE_OPEN_EVENT, open);
  root.dataset.eonCityW659gCapture = `${EON_CITY_W659G_CAPTURE_SCHEMA}.core-adapter`;
  return () => {
    environment.removeEventListener?.(EON_CITY_W659G_CAPTURE_OPEN_EVENT, open);
    delete root.dataset.eonCityW659gCapture;
  };
}
