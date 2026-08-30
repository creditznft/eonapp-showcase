/**
 * W693 — full local certification and long-session source simulation.
 *
 * This authority distinguishes deterministic local/source evidence from the
 * headed-browser and owner-device proof that cannot be claimed without a real
 * installed runtime and recordings. It never upgrades pending evidence into a
 * pass.
 */

import { buildEonCityW690CompleteCoreIdentityPlan, validateEonCityW690CompleteCoreIdentityPlan } from '../w690/eon-city-w690-complete-core-identity.js';
import { buildEonCityW691MyRealmPlan, validateEonCityW691RealmsMyRealmPlan } from '../w691/eon-city-w691-realms-my-realm-integration.js';
import { createEonCityW692FrameGovernor, resolveEonCityW692ExperienceProfile, validateEonCityW692ExperienceProfile } from '../w692/eon-city-w692-experience-quality.js';

export const EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA = 'eon.city.local-certification.w693.v1';
const freeze = (value) => Object.freeze(value);

const SAMPLE_TRANSFORMATIONS = freeze([
  freeze({ id: 'archive-vault-sealed', destination: 'my-realm', location: 'archive-sanctum', label: 'Archive sealed' }),
  freeze({ id: 'device-lab-signal-live', destination: 'core', location: 'device-lab', label: 'Device Lab verified' }),
  freeze({ id: 'core-command-awakened', destination: 'core', location: 'orientation-hall', label: 'Orientation complete' }),
  freeze({ id: 'project-route-restored', destination: 'core', location: 'project-district', label: 'Project continuity restored' }),
  freeze({ id: 'creator-atrium-gallery-ready', destination: 'core', location: 'creator-atrium', label: 'Creator gallery ready' }),
  freeze({ id: 'automation-rail-planned', destination: 'expanse', location: 'automation-railworks', label: 'Automation rail planned' })
]);

export const EON_CITY_W693_REQUIRED_OWNER_RECORDINGS = freeze([
  freeze({ id: 'desktop-entry', title: 'Authenticated desktop entry', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-core-walk', title: 'Core walking and district boundaries', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-capsule', title: 'Capsule ride and Skip ride', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-expanse', title: 'Expanse gateway, macro-region and return', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-nexus', title: 'Pulse to Morphic Field to Atlas', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-handoff', title: 'NEXUS object to City holographic object', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-realms', title: 'All six Realms and safe return', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-my-realm', title: 'Verified My Realm transformation', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-focus-explore', title: 'Focus and Explore parity', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'desktop-long-session', title: 'Long-session memory and performance', device: 'owner Windows 11 laptop', required: true }),
  freeze({ id: 'mobile-landscape', title: 'Mobile landscape controls and panels', device: 'real mobile browser', required: true }),
  freeze({ id: 'mobile-portrait', title: 'Portrait recovery layout', device: 'real mobile browser', required: true }),
  freeze({ id: 'keyboard-screenreader', title: 'Keyboard and screen-reader route', device: 'desktop browser', required: true }),
  freeze({ id: 'reduced-motion', title: 'Reduced-motion complete workflow', device: 'desktop or mobile browser', required: true }),
  freeze({ id: 'recovery-fallback', title: 'WebGL recovery and restart path', device: 'desktop browser', required: true })
]);

export function buildEonCityW693LongSessionSimulation({ cycles = 720 } = {}) {
  const totalCycles = Math.max(60, Math.min(5000, Number(cycles) || 720));
  const signatures = new Set();
  const coreCounts = [];
  const realmCounts = [];
  const governor = createEonCityW692FrameGovernor({ initialQuality: 'cinematic', now: (() => { let t = 0; return () => ++t; })() });
  let maximumConnectionCount = 0;
  let maximumPopulationCount = 0;
  let maximumTransformationCount = 0;
  for (let index = 0; index < totalCycles; index += 1) {
    const quality = index % 3 === 0 ? 'lite' : index % 3 === 1 ? 'balanced' : 'cinematic';
    const mode = index % 2 === 0 ? 'focus' : 'explore';
    const reducedEffects = index % 5 === 0;
    const core = buildEonCityW690CompleteCoreIdentityPlan({ quality, mode, reducedEffects });
    const coreValidation = validateEonCityW690CompleteCoreIdentityPlan(core);
    if (!coreValidation.ok) return freeze({ ok: false, reason: `core-invalid:${coreValidation.errors.join(',')}`, cycle: index });
    const transformations = SAMPLE_TRANSFORMATIONS.slice(0, index % (SAMPLE_TRANSFORMATIONS.length + 1));
    const myRealm = buildEonCityW691MyRealmPlan({ transformations, mode, quality });
    const realmValidation = validateEonCityW691RealmsMyRealmPlan(myRealm);
    if (!realmValidation.ok) return freeze({ ok: false, reason: `my-realm-invalid:${realmValidation.errors.join(',')}`, cycle: index });
    const profile = resolveEonCityW692ExperienceProfile({ mode, quality, reducedMotion: reducedEffects, touch: index % 7 === 0, viewportWidth: index % 7 === 0 ? 390 : 1366, viewportHeight: index % 7 === 0 ? 844 : 768, deviceMemory: index % 7 === 0 ? 4 : 8, hardwareConcurrency: index % 7 === 0 ? 4 : 8 });
    if (!validateEonCityW692ExperienceProfile(profile).ok) return freeze({ ok: false, reason: 'experience-profile-invalid', cycle: index });
    governor.recordFrame(index % 90 > 70 ? 34 : 16 + (index % 5));
    coreCounts.push(freeze({ districts: core.districts.length, connections: core.streetConnections.length, stations: core.transitLoop.stations.length, population: core.populationCount }));
    realmCounts.push(freeze({ zones: myRealm.zones.length, transformations: myRealm.transformations.length }));
    maximumConnectionCount = Math.max(maximumConnectionCount, core.streetConnections.length);
    maximumPopulationCount = Math.max(maximumPopulationCount, core.populationCount);
    maximumTransformationCount = Math.max(maximumTransformationCount, myRealm.transformations.length);
    signatures.add(`${quality}:${mode}:${reducedEffects}:${core.districts.length}:${core.streetConnections.length}:${core.populationCount}:${myRealm.zones.length}:${myRealm.transformations.length}`);
  }
  const coreCardinalityStable = coreCounts.every((entry) => entry.districts === 9 && entry.stations === 9 && entry.connections === maximumConnectionCount);
  const realmCardinalityStable = realmCounts.every((entry) => entry.zones === 6 && entry.transformations <= SAMPLE_TRANSFORMATIONS.length);
  const governorSnapshot = governor.getSnapshot();
  return freeze({
    schema: `${EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA}.long-session.v1`,
    ok: coreCardinalityStable && realmCardinalityStable,
    cycles: totalCycles,
    uniqueStateSignatures: signatures.size,
    coreCardinalityStable,
    realmCardinalityStable,
    maximumConnectionCount,
    maximumPopulationCount,
    maximumTransformationCount,
    governorRecommendationCount: governorSnapshot.recommendations.length,
    automaticQualityUpgrade: governorSnapshot.automaticQualityUpgrade,
    automaticRouteChange: governorSnapshot.automaticRouteChange,
    automaticExecution: governorSnapshot.automaticExecution,
    heapMeasurementClaimed: false,
    browserFrameRateClaimed: false,
    ownerDeviceClaimed: false
  });
}

export function buildEonCityW693CertificationBoard({ ownerEvidence = {} } = {}) {
  const simulation = buildEonCityW693LongSessionSimulation();
  const recordings = freeze(EON_CITY_W693_REQUIRED_OWNER_RECORDINGS.map((entry) => freeze({ ...entry, status: ownerEvidence?.[entry.id] === true ? 'passed' : 'pending' })));
  const ownerPassed = recordings.every((entry) => entry.status === 'passed');
  return freeze({
    schema: EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA,
    localSourceSimulation: simulation.ok ? 'passed' : 'failed',
    ownerBrowserCertification: ownerPassed ? 'passed' : 'pending',
    recordingCount: recordings.length,
    recordingPassedCount: recordings.filter((entry) => entry.status === 'passed').length,
    recordings,
    localCandidateAllowed: simulation.ok,
    productionReleaseAllowed: simulation.ok && ownerPassed,
    visualScoreClaimAllowed: ownerPassed,
    ninePointFiveClaimAllowed: ownerPassed,
    githubUploadPerformed: false,
    deploymentPerformed: false,
    browserEvidenceInvented: false
  });
}

export function validateEonCityW693CertificationBoard(board = {}) {
  const errors = [];
  if (board.schema !== EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA) errors.push('schema-invalid');
  if (board.localSourceSimulation !== 'passed' || !board.localCandidateAllowed) errors.push('local-simulation-invalid');
  if (!Array.isArray(board.recordings) || board.recordings.length !== 15) errors.push('owner-recording-matrix-invalid');
  if (board.ownerBrowserCertification !== 'passed' && (board.productionReleaseAllowed || board.visualScoreClaimAllowed || board.ninePointFiveClaimAllowed)) errors.push('evidence-overclaim');
  if (board.githubUploadPerformed || board.deploymentPerformed || board.browserEvidenceInvented) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), ownerBrowserCertification: board.ownerBrowserCertification });
}

export function getEonCityW693Truth() {
  return freeze({
    schema: EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA,
    sourceSimulationIsNotBrowserProof: true,
    ownerMatrixRequired: true,
    visualScoreRequiresOwnerEvidence: true,
    localCandidateCanRemainPendingBrowserProof: true,
    browserEvidenceInvented: false,
    productionReleaseAutomatic: false
  });
}

export default freeze({
  EON_CITY_W693_LOCAL_CERTIFICATION_SCHEMA,
  EON_CITY_W693_REQUIRED_OWNER_RECORDINGS,
  buildEonCityW693LongSessionSimulation,
  buildEonCityW693CertificationBoard,
  validateEonCityW693CertificationBoard,
  getEonCityW693Truth
});
