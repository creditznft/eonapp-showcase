/** A15 C06 — value-free manifest for durable EONCITY/Expanse state. */
export const EON_CITY_DATA_SURVIVAL_MANIFEST_SCHEMA = 'eon.city-data-survival-manifest.a15.c06.v1';
export const EON_CITY_DATA_RESTORE_CONFIRMATION = 'RESTORE EONCITY DATA';
export const EON_CITY_DATA_DELETE_CONFIRMATION = 'DELETE EONCITY DATA';

const freeze = (value) => Object.freeze(value);
const row = (key, schema, domain, purpose) => freeze({
  key, schema, domain, purpose,
  protectionClass: 'workspace-capsule',
  backup: 'digest-verified-city-state-bundle-inside-encrypted-workspace-capsule',
  restore: 'inspect-confirm-atomic-apply-rollback',
  migration: 'versioned-canonical-sanitizer',
  deletion: 'explicit-owned-key-delete-verified',
  privateContentAllowed: false
});

export const EON_CITY_DATA_SURVIVAL_RECORDS = freeze([
  row('eon:city:expanse:w766a:state:v1', 'eon.city.expanse.foundation.w766a.v1', 'open-world', 'Signal Frontier, My Frontier and exact Storm Sector progress in one canonical Expanse state.'),
  row('eon:city:progression:w659g:v1', 'eon.city.w659g.progression.v1', 'progression', 'Local XP, deterministic cosmetic reveals and duplicate-protected receipt ledger.'),
  row('eon:city:world-state:v1', 'eon.city.world-state.w221.v2', 'legacy-city-world', 'Legacy City first-circuit progress, unlocked districts, bounded visits, avatar/navigation continuity and safe inventory references.'),
  row('eon:city:project-districts:v1', 'eon.city.project-district-manifest.w438.v1', 'project-districts', 'Private bounded project-district manifests and explicitly approved City-safe mission-card state.'),
  row('eon:city:missions:w737:v2', 'eon.city.missions.w737.v2', 'command-hub', 'Review/open/return mission state without completion claims.'),
  row('eon:city:productive-rpg:w624g:v1', 'eon.city.productive-rpg-loop.w624g.v1', 'productive-missions', 'Bounded native outcome projections used by the legacy City mission presentation.'),
  row('eon:city:productive-stations:w751:v1', 'eon.city.productive-stations.w751.v1', 'productive-stations', 'Reviewed/opened/returned station activity only.'),
  row('eon:city:progress-receipts:a15:v1', 'eon.city-progress-receipt.a15.v1', 'core-outcome-bridge', 'Redacted verified-ready progress receipts; no XP or private payload.'),
  row('eon:city:world-state:resume:v1', 'eon.city.resume-travel.w559.v1', 'city-resume', 'Bounded local player/camera pose and public landmark continuity.'),
  row('eon:city:cosmetics:v1', 'eon.city.vault-reveals.w564.v1', 'appearance', 'Deterministic local-only cosmetic selection and reviewed ids.'),
  row('eon:city:living-frontier-session:rt91:v1', 'eon.city.living-frontier-session.rt91.v1', 'flagship-session', 'RT91 Signal mastery, Storm campaign, My Frontier district missions and bounded repeatable-contract continuity.'),
  row('eon:city:genuine-agent-theatre:w624i:v1', 'eon.city.genuine-agent-theatre.w624i.v1', 'agent-theatre', 'Bounded genuine Agent Theatre lifecycle receipts only; no prompts, outputs, files, credentials or provider payloads.'),
  row('eon:eonbot:job-fabric:v1', 'eonapp.eonbot-job-fabric.w435.v1', 'agent-theatre-job-fabric', 'Bounded EONBOT job lifecycle metadata used by Agent Theatre; no raw prompt/output or execution payload.'),
  row('eon:city:living-nexus:w660p:v1', 'eon.city.living-nexus-hybrid.w660p.v1', 'living-nexus', 'Living Nexus atlas discoveries, realm visits and bounded return continuity.'),
  row('eon:city:living-nexus:encounters:w660s:v1', 'eon.city.living-nexus-encounters.w660s.v1', 'living-nexus-encounters', 'Bounded pending/resolved Living Nexus encounter history backed by opaque reviewed receipt ids.'),
  row('eon:city:command-district:v1', 'eon.city.command-district.w366.v1', 'command-district', 'Local Command District journey stage and bounded landmark/event counts.')
]);

const byKey = new Map(EON_CITY_DATA_SURVIVAL_RECORDS.map((entry) => [entry.key, entry]));
export function getEonCityDataSurvivalRecord(key = '') { return byKey.get(String(key || '')) || null; }
export function listEonCityDataSurvivalRecords() { return EON_CITY_DATA_SURVIVAL_RECORDS; }
export function getEonCityDataSurvivalManifestTruth() {
  return freeze({
    schema: EON_CITY_DATA_SURVIVAL_MANIFEST_SCHEMA,
    recordCount: EON_CITY_DATA_SURVIVAL_RECORDS.length,
    signalFrontierCovered: true,
    myFrontierCovered: true,
    stormSectorCovered: true,
    privateProjectContentAllowed: false,
    rawMediaIncluded: false,
    credentialsIncluded: false,
    encryptedWorkspaceCapsuleRequired: true,
    atomicRestoreRequired: true,
    verifiedDeletionRequired: true
  });
}
