/**
 * RT91 Phase G — EONCITY continuity classification.
 *
 * Critical player progress/history must be both update-safe and included in the
 * digest-verified City recovery bundle. Preferences must survive normal app
 * updates but are not allowed to block a gameplay restore. Diagnostics/caches
 * are explicitly rebuildable and must never be mistaken for progression.
 */
import { W145_PROTECTED_STORAGE_GROUPS } from '../../utils/update-safe-user-data.js';
import { EON_CITY_DATA_SURVIVAL_RECORDS } from '../../contracts/city/eon-city-data-survival-manifest.js';

export const EON_CITY_RT91_CONTINUITY_SCHEMA = 'eon.city.continuity.rt91.v1';
const freeze = Object.freeze;

export const EON_CITY_RT91_CRITICAL_RECOVERY_KEYS = freeze([
  'eon:city:expanse:w766a:state:v1',
  'eon:city:progression:w659g:v1',
  'eon:city:world-state:v1',
  'eon:city:project-districts:v1',
  'eon:city:missions:w737:v2',
  'eon:city:productive-rpg:w624g:v1',
  'eon:city:productive-stations:w751:v1',
  'eon:city:progress-receipts:a15:v1',
  'eon:city:world-state:resume:v1',
  'eon:city:cosmetics:v1',
  'eon:city:living-frontier-session:rt91:v1',
  'eon:city:genuine-agent-theatre:w624i:v1',
  'eon:eonbot:job-fabric:v1',
  'eon:city:living-nexus:w660p:v1',
  'eon:city:living-nexus:encounters:w660s:v1',
  'eon:city:command-district:v1'
]);

export const EON_CITY_RT91_UPDATE_SAFE_PREFERENCE_KEYS = freeze([
  'eon:city:3d:preferences:v1',
  'eon:city:accessibility-device:w624k:v1',
  'eon:city:sensory-preferences:v1',
  'eon:city:quality-preference:v1',
  'eon:city:first-run:w479:v1',
  'eon:city:adaptive-soundscape:v1',
  'eon:city:command-hub:resume:w731:v1'
]);

export const EON_CITY_RT91_REBUILDABLE_KEYS = freeze([
  'eon:city:boot-diagnostics:v1',
  'eon:city:boot-trace:w659h:v1',
  'eon:city:boot-trace:w737:v1',
  'eon:city:performance-lab:v1',
  'eon:city:validation-lab:v1',
  'eon:city:preview-evidence:w259:v1'
]);

export const EON_CITY_RT91_EPHEMERAL_SESSION_KEYS = freeze([
  'eon:city:signal-expedition:v1',
  'eon:city:w756:onboarding-seen:v1',
  'eon:city:work-returns:a15:v1'
]);

export function getEonCityRt91ContinuityTruth() {
  const updateSafeKeys = new Set(W145_PROTECTED_STORAGE_GROUPS.flatMap((group) => group.keys));
  const recoveryKeys = new Set(EON_CITY_DATA_SURVIVAL_RECORDS.map((row) => row.key));
  return freeze({
    schema: EON_CITY_RT91_CONTINUITY_SCHEMA,
    criticalRecoveryKeys: EON_CITY_RT91_CRITICAL_RECOVERY_KEYS,
    updateSafePreferenceKeys: EON_CITY_RT91_UPDATE_SAFE_PREFERENCE_KEYS,
    rebuildableKeys: EON_CITY_RT91_REBUILDABLE_KEYS,
    ephemeralSessionKeys: EON_CITY_RT91_EPHEMERAL_SESSION_KEYS,
    criticalRecoveryCount: EON_CITY_RT91_CRITICAL_RECOVERY_KEYS.length,
    allCriticalUpdateSafe: EON_CITY_RT91_CRITICAL_RECOVERY_KEYS.every((key) => updateSafeKeys.has(key)),
    allCriticalRecoverable: EON_CITY_RT91_CRITICAL_RECOVERY_KEYS.every((key) => recoveryKeys.has(key)),
    allPreferencesUpdateSafe: EON_CITY_RT91_UPDATE_SAFE_PREFERENCE_KEYS.every((key) => updateSafeKeys.has(key)),
    rebuildableDataExcludedFromRecovery: EON_CITY_RT91_REBUILDABLE_KEYS.every((key) => !recoveryKeys.has(key)),
    appUpdateClearsProgress: false,
    serviceWorkerCacheIsProgressAuthority: false,
    assetCacheIsProgressAuthority: false,
    recoveryRequiresExplicitUserAction: true,
    recoveryBundleContainsPrivateContent: false,
    cloudSyncClaimed: false
  });
}

export function validateEonCityRt91ContinuityTruth(value = getEonCityRt91ContinuityTruth()) {
  const errors = [];
  if (value?.schema !== EON_CITY_RT91_CONTINUITY_SCHEMA) errors.push('schema');
  if (value?.criticalRecoveryCount !== 16) errors.push('critical-recovery-count');
  for (const field of ['allCriticalUpdateSafe', 'allCriticalRecoverable', 'allPreferencesUpdateSafe', 'rebuildableDataExcludedFromRecovery']) {
    if (value?.[field] !== true) errors.push(field);
  }
  if (value?.appUpdateClearsProgress !== false || value?.serviceWorkerCacheIsProgressAuthority !== false || value?.assetCacheIsProgressAuthority !== false) errors.push('update-boundary');
  if (value?.recoveryRequiresExplicitUserAction !== true || value?.recoveryBundleContainsPrivateContent !== false || value?.cloudSyncClaimed !== false) errors.push('recovery-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({
  EON_CITY_RT91_CONTINUITY_SCHEMA,
  EON_CITY_RT91_CRITICAL_RECOVERY_KEYS,
  EON_CITY_RT91_UPDATE_SAFE_PREFERENCE_KEYS,
  EON_CITY_RT91_REBUILDABLE_KEYS,
  EON_CITY_RT91_EPHEMERAL_SESSION_KEYS,
  getEonCityRt91ContinuityTruth,
  validateEonCityRt91ContinuityTruth
});
