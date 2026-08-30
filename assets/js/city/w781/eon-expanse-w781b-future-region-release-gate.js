/** W781B — truthful release gate combining maintained progress, programme review and presentation audit. */
const freeze = Object.freeze;
export const EON_EXPANSE_W781B_FUTURE_REGION_RELEASE_GATE_SCHEMA = 'eon.expanse.future-region-release-gate.w781b.v1';

export function deriveEonExpanseW781BFutureRegionReleaseGate({
  programme = null,
  artAudit = null,
  authoredRegionPackageCertification = null
} = {}) {
  const visible = programme?.visible === true;
  const foundationReady = programme?.reviewAvailable === true;
  const proxyArtReady = artAudit?.releaseReady === true;
  const packageReady = authoredRegionPackageCertification?.ok === true
    && authoredRegionPackageCertification?.regionId === programme?.recommendedRegion?.id;
  const releaseReady = foundationReady && proxyArtReady && packageReady;
  const status = !visible ? 'signal-frontier-campaign-required'
    : !foundationReady ? 'maintained-frontier-pillars-required'
      : !proxyArtReady ? 'development-proxy-replacement-required'
        : !packageReady ? 'authored-region-package-certification-required'
          : 'future-region-release-ready';
  return freeze({
    schema: EON_EXPANSE_W781B_FUTURE_REGION_RELEASE_GATE_SCHEMA,
    visible,
    recommendedRegionId: programme?.recommendedRegion?.id || '',
    foundationReady,
    proxyArtReady,
    packageReady,
    releaseReady,
    status,
    blockingProxyCount: Math.max(0, Number(artAudit?.blockingProxyCount || 0)),
    blockers: freeze([...(artAudit?.blockers || [])]),
    gatewayActivated: false,
    automaticUnlock: false,
    createsRegion: false,
    rendersRegion: false,
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W781B_FUTURE_REGION_RELEASE_GATE_SCHEMA, deriveEonExpanseW781BFutureRegionReleaseGate });
