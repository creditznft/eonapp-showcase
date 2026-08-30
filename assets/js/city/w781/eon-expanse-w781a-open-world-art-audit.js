/** W781A — release audit for the deterministic open-world renderer's presentation truth. */
const freeze = Object.freeze;
export const EON_EXPANSE_W781A_OPEN_WORLD_ART_AUDIT_SCHEMA = 'eon.expanse.open-world-art-audit.w781a.v1';

const count = (value) => Math.max(0, Number(value) || 0);

export function auditEonExpanseW781AOpenWorldArt(summary = {}) {
  const developmentBuildingProxyCount = count(summary.developmentBuildingProxyCount);
  const ambientDevelopmentProxyCount = count(summary.ambientDevelopmentProxyCount);
  const visibleDevelopmentProxyCount = count(summary.visibleDevelopmentProxyCount);
  const interactionPrimitiveCount = count(summary.interactionPrimitiveCount);
  const distantSilhouetteCount = count(summary.distantSilhouetteCount);
  const blockingProxyCount = developmentBuildingProxyCount + ambientDevelopmentProxyCount;
  const releasePresentationSafe = visibleDevelopmentProxyCount === 0 && summary.releasePresentationHidesDevelopmentProxies === true;
  const releaseReady = blockingProxyCount === 0 && summary.futureRegionReleaseArtReady === true;
  const blockers = freeze([
    ...(developmentBuildingProxyCount > 0 ? [freeze({ id: 'interactive-building-proxies', count: developmentBuildingProxyCount, requiredAction: 'Replace interactive sector buildings with validated authored modules.' })] : []),
    ...(ambientDevelopmentProxyCount > 0 ? [freeze({ id: 'ambient-character-proxies', count: ambientDevelopmentProxyCount, requiredAction: 'Replace ambient bodies with validated authored animated characters or approved non-character symbols.' })] : [])
  ]);
  return freeze({
    schema: EON_EXPANSE_W781A_OPEN_WORLD_ART_AUDIT_SCHEMA,
    releaseReady,
    certificationStatus: releaseReady ? 'authored-presentation-certified' : 'development-proxy-replacement-required',
    blockingProxyCount,
    visibleDevelopmentProxyCount,
    releasePresentationSafe,
    developmentBuildingProxyCount,
    ambientDevelopmentProxyCount,
    allowedPrimitiveCount: interactionPrimitiveCount + distantSilhouetteCount,
    interactionPrimitiveCount,
    distantSilhouetteCount,
    rawPrimitiveHeroCount: count(summary.rawPrimitiveHeroCount),
    blockers,
    preservesInteractionTargets: true,
    preservesDistantSilhouettes: true,
    automaticCertification: false,
    mutatesRenderer: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W781A_OPEN_WORLD_ART_AUDIT_SCHEMA, auditEonExpanseW781AOpenWorldArt });
