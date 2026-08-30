/** W419 — original vector art delivery for the local Babylon fallback. */
export const W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT = Object.freeze({
  id: 'W419',
  title: 'Original local vector art pack and Babylon composition integration',
  requiredFiles: Object.freeze([
    'assets/city/art/README.md',
    'assets/js/city/eon-city-vector-art-kit.js',
    'assets/js/city/eon-city-vector-art-runtime.js',
    'assets/js/city/eon-city-play-babylon.js',
    'scripts/sync-public-assets.mjs',
    'config/w419-city-original-vector-art-contract.mjs',
    'scripts/w419-city-original-vector-art-gate.mjs',
    'tests/unit/w419-city-original-vector-art.test.mjs',
    'docs/W419_CITY_ORIGINAL_VECTOR_ART_2026-06-28.md',
    'NEXT_CHAT/W419_FINAL_ART_HANDOVER/00_START_HERE_CODEX_W419.md',
    'NEXT_CHAT/W419_FINAL_ART_HANDOVER/01_W419_ART_INVENTORY.md',
    'NEXT_CHAT/W419_FINAL_ART_HANDOVER/04_MANUAL_ART_AND_DEVICE_PROOF_W419.md',
    'NEXT_CHAT/W419_FINAL_ART_HANDOVER/05_VALIDATION_RECEIPT_W419.md'
  ]),
  requiredArtIds: Object.freeze([
    'wet-street', 'brushed-graphite', 'glass-grid', 'carbon-weave', 'neon-circuit', 'skyline-depth',
    'eon-monogram', 'arrival-emblem', 'command-emblem', 'creator-emblem', 'forge-emblem', 'signal-emblem',
    'automation-emblem', 'archive-emblem', 'eonbot-halo', 'wayfinding-cyan', 'wayfinding-violet', 'wayfinding-mint'
  ]),
  requiredRuntimeUses: Object.freeze([
    'wet-street', 'brushed-graphite', 'glass-grid', 'carbon-weave', 'neon-circuit', 'skyline-depth',
    'arrival-emblem', 'command-emblem', 'creator-emblem', 'forge-emblem', 'signal-emblem', 'automation-emblem', 'archive-emblem', 'eonbot-halo'
  ]),
  artBoundary: Object.freeze({
    originalVectorArt: true,
    sameOriginOnly: true,
    remoteNetwork: false,
    userData: false,
    finalBinaryArt: false,
    finalVisualCertification: false
  }),
  nonClaims: Object.freeze([
    'final licensed GLB/KTX2 City art is shipped',
    'institutional-grade final visual certification is complete',
    'device performance is proven by a source-only texture integration',
    'remote art content is loaded'
  ])
});

export function validateW419CityOriginalVectorArtContract(contract = W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W419') errors.push('W419 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 13) errors.push('W419 must enumerate art, runtime, gate, test and docs files.');
  if (!Array.isArray(contract?.requiredArtIds) || contract.requiredArtIds.length !== 18) errors.push('W419 requires the complete 18-piece art pack.');
  if (!Array.isArray(contract?.requiredRuntimeUses) || contract.requiredRuntimeUses.length < 14) errors.push('W419 requires material, backdrop and district composition usage.');
  if (contract?.artBoundary?.originalVectorArt !== true || contract?.artBoundary?.sameOriginOnly !== true || contract?.artBoundary?.remoteNetwork !== false || contract?.artBoundary?.userData !== false || contract?.artBoundary?.finalBinaryArt !== false || contract?.artBoundary?.finalVisualCertification !== false) errors.push('W419 art boundary is invalid.');
  if (!Array.isArray(contract?.nonClaims) || contract.nonClaims.length < 4) errors.push('W419 must preserve final-art evidence limits.');
  return Object.freeze(errors);
}
