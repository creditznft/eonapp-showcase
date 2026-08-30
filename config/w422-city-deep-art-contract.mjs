/** W422 — deepen the original vector City art system without a false final-3D claim. */
export const W422_CITY_DEEP_ART_CONTRACT = Object.freeze({
  id: 'W422',
  title: 'Deep original City art system, authored placements and inspectable chapter design',
  requiredFiles: Object.freeze([
    'tools/generate-w422-deep-city-art.py',
    'assets/city/art/README.md',
    'assets/js/city/eon-city-vector-art-kit.js',
    'assets/js/city/eon-city-deep-art-direction.js',
    'assets/js/city/eon-city-vector-art-runtime.js',
    'assets/js/city/eon-city-art-review.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'assets/css/eon-city-play.css',
    'config/w422-city-deep-art-contract.mjs',
    'scripts/w422-city-deep-art-gate.mjs',
    'tests/unit/w422-city-deep-art.test.mjs',
    'docs/W422_CITY_DEEP_ORIGINAL_ART_2026-06-28.md',
    'NEXT_CHAT/W422_FINAL_CITY_ART_POLISH/00_START_HERE_CODEX_W422.md',
    'NEXT_CHAT/W422_FINAL_CITY_ART_POLISH/01_ART_INVENTORY_AND_PLACEMENT_MAP.md',
    'NEXT_CHAT/W422_FINAL_CITY_ART_POLISH/02_CODEX_DEPLOY_PROOF_AND_RETURN_HANDOVER.md',
    'NEXT_CHAT/W422_FINAL_CITY_ART_POLISH/03_MANUAL_VISUAL_ACCEPTANCE_AND_REMAINING_WORK.md',
    'NEXT_CHAT/W422_FINAL_CITY_ART_POLISH/04_VALIDATION_RECEIPT_W422.md'
  ]),
  catalog: Object.freeze({ total: 58, foundation: 18, extension: 40, categories: Object.freeze({ material: 12, backdrop: 8, decal: 30, prop: 8 }) }),
  requiredChapterIds: Object.freeze(['arrival-command', 'creator-forge', 'signal-automation', 'archive-gardens', 'signal-expeditions']),
  requiredPlacementCount: 33,
  requiredShotIds: Object.freeze(['arrival-gate', 'command-deck', 'creator-atrium', 'forge-bay', 'signal-tower', 'archive-gardens', 'automation-observatory', 'relay-courtyard', 'expedition-threshold', 'skyline-overlook']),
  boundaries: Object.freeze({ localOnly: true, remoteNetwork: false, userData: false, finalBinaryArt: false, screenshotCapture: false, mediaUpload: false, finalVisualCertification: false, finalInstitutionalArtClaim: false }),
  nonClaims: Object.freeze([
    'final GLB/KTX2 art has shipped',
    'institutional-grade final visual certification is complete',
    'source-only art proves desktop or device performance',
    'art review captures or uploads proof media',
    'the City has remote art, telemetry or user-data surfaces'
  ])
});

export function validateW422CityDeepArtContract(contract = W422_CITY_DEEP_ART_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W422') errors.push('W422 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 17) errors.push('W422 must enumerate generator, art source, runtime, UI, gate, test and handover documents.');
  const catalog = contract?.catalog || {};
  if (catalog.total !== 58 || catalog.foundation !== 18 || catalog.extension !== 40) errors.push('W422 catalog dimensions are invalid.');
  if (JSON.stringify(catalog.categories) !== JSON.stringify({ material: 12, backdrop: 8, decal: 30, prop: 8 })) errors.push('W422 category distribution is invalid.');
  if (!Array.isArray(contract?.requiredChapterIds) || contract.requiredChapterIds.length !== 5) errors.push('W422 requires five authored City art chapters.');
  if (contract?.requiredPlacementCount !== 33) errors.push('W422 requires thirty-three authored City art placements.');
  if (!Array.isArray(contract?.requiredShotIds) || contract.requiredShotIds.length !== 10) errors.push('W422 requires ten bounded local art-review views.');
  const b = contract?.boundaries || {};
  if (b.localOnly !== true || b.remoteNetwork !== false || b.userData !== false || b.finalBinaryArt !== false || b.screenshotCapture !== false || b.mediaUpload !== false || b.finalVisualCertification !== false || b.finalInstitutionalArtClaim !== false) errors.push('W422 source-art boundaries are invalid.');
  if (!Array.isArray(contract?.nonClaims) || contract.nonClaims.length < 5) errors.push('W422 must preserve final-art proof limits.');
  return Object.freeze(errors);
}
