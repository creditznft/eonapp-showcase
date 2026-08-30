/** A15 C09 — source-level Signal Frontier flagship quality summit authority. */
import { getEonExpanseW802AOwnerPlaythroughCases } from '../w802/eon-expanse-w802a-owner-playthrough-matrix.js';

export const EON_CITY_C09_SIGNAL_FRONTIER_SUMMIT_SCHEMA = 'eon.city.signal-frontier-summit.a15.c09.v1';
const freeze = (value) => Object.freeze(value);

const SOURCE_EVIDENCE = freeze({
  'signal-companion-rescue': ['assets/js/city/w766/eon-expanse-w767a-companion-continuity.js', 'tests/unit/w767a-expanse-companion-continuity.test.mjs'],
  'signal-campaign-complete': ['assets/js/city/w766/eon-expanse-w766e-mission-runtime.js', 'tests/unit/w766h-physical-campaign-flow.test.mjs'],
  'signal-transit-return': ['assets/js/city/w766/eon-city-w766a-world-mode-controller.js', 'tests/unit/w766a-world-mode-controller.test.mjs'],
  'signal-label-gps-accessibility': ['assets/js/city/w766/eon-expanse-w767q-accessibility-profile.js', 'tests/unit/w767q-expanse-accessibility-profile.test.mjs'],
  'productive-create': ['assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js', 'tests/unit/a15-c05-core-outcome-progress-bridge.test.mjs'],
  'productive-local-ai': ['assets/js/city/w766/eon-expanse-w767x-verified-result-action.js', 'tests/unit/a15-c05-core-outcome-progress-bridge.test.mjs'],
  'productive-automation': ['assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js', 'tests/unit/a15-c05-core-outcome-progress-bridge.test.mjs'],
  'productive-library': ['assets/js/city/w766/eon-expanse-w767x-verified-result-action.js', 'tests/unit/a15-c05-core-outcome-progress-bridge.test.mjs'],
  'productive-daily-signal': ['assets/js/city/w766/eon-expanse-w767y-daily-signal.js', 'tests/unit/w767y-expanse-daily-signal.test.mjs'],
  'frontier-unlock-plan': ['assets/js/city/w768/eon-expanse-w768f-my-frontier-planning-view.js', 'tests/unit/w768f-my-frontier-planning-view.test.mjs'],
  'frontier-construct-terminal': ['assets/js/city/w768/eon-expanse-w768r-my-frontier-building-terminal.js', 'tests/unit/w768r-my-frontier-building-terminal.test.mjs'],
  'frontier-resident-loop': ['assets/js/city/w768/eon-expanse-w768v-my-frontier-resident-authority.js', 'tests/unit/w768v-my-frontier-resident-authority.test.mjs'],
  'frontier-theme-upgrade': ['assets/js/city/w769/eon-expanse-w769d-my-frontier-district-upgrade.js', 'tests/unit/w769d-my-frontier-district-upgrade.test.mjs'],
  'frontier-reload': ['assets/js/city/w770/eon-expanse-w770f-my-frontier-composition-recovery.js', 'tests/unit/w770f-my-frontier-composition-recovery.test.mjs'],
  'storm-gateway-entry': ['assets/js/city/w794/eon-expanse-w794a-storm-sector-journey.js', 'tests/unit/w794a-storm-sector-journey.test.mjs'],
  'storm-weather-restoration': ['assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js', 'tests/unit/w795a-storm-sector-mission-runtime.test.mjs'],
  'storm-relay-repair': ['assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js', 'tests/unit/w795a-storm-sector-mission-runtime.test.mjs'],
  'storm-rescue': ['assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js', 'tests/unit/w795a-storm-sector-mission-runtime.test.mjs'],
  'storm-patrols': ['assets/js/city/w796/eon-expanse-w796a-storm-sector-npc-plan.js', 'tests/unit/w796a-storm-sector-npc-plan.test.mjs'],
  'storm-transit': ['assets/js/city/w797/eon-expanse-w797a-storm-sector-transit.js', 'tests/unit/w797a-storm-sector-transit.test.mjs'],
  'storm-return-reload': ['assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js', 'tests/unit/w795c-storm-sector-mission-persistence.test.mjs'],
  'capture-signal': ['assets/js/city/w766/eon-expanse-w767s-capture-moment.js', 'tests/unit/w767s-expanse-capture-moment.test.mjs'],
  'capture-frontier': ['assets/js/city/w773/eon-expanse-w773c-my-frontier-capture-director.js', 'tests/unit/w773c-my-frontier-capture-director.test.mjs'],
  'capture-storm': ['assets/js/city/w800/eon-expanse-w800a-storm-sector-capture-director.js', 'tests/unit/w800a-storm-sector-capture-director.test.mjs'],
  'share-privacy-review': ['assets/js/contracts/city/eon-city-access-distribution-projection.js', 'tests/unit/a15-c07-city-access-distribution.test.mjs'],
  'living-side-mission': ['assets/js/city/w778/eon-expanse-w778a-side-mission-transformations.js', 'tests/unit/w778a-side-mission-transformations.test.mjs'],
  'living-dynamic-event': ['assets/js/city/w766/eon-expanse-w767o-dynamic-event-lifecycle.js', 'tests/unit/w767o-expanse-dynamic-event-lifecycle.test.mjs'],
  'living-repeatable': ['assets/js/city/w779/eon-expanse-w779a-post-campaign-progression.js', 'tests/unit/w779a-post-campaign-progression.test.mjs']
});

const EXTERNAL_CASES = freeze(new Set([
  'chrome-desktop', 'edge-desktop', 'mobile-landscape',
  'performance-lite', 'performance-balanced', 'performance-cinematic', 'transition-soak'
]));

export function buildEonCityC09SignalFrontierSummit() {
  const cases = freeze(getEonExpanseW802AOwnerPlaythroughCases().map((entry) => {
    const source = SOURCE_EVIDENCE[entry.id] || null;
    return freeze({
      ...entry,
      sourceCovered: Boolean(source),
      sourceModule: source?.[0] || '',
      sourceTest: source?.[1] || '',
      externalEvidenceRequired: EXTERNAL_CASES.has(entry.id),
      passed: false
    });
  }));
  return freeze({
    schema: EON_CITY_C09_SIGNAL_FRONTIER_SUMMIT_SCHEMA,
    cases,
    requiredCaseCount: cases.length,
    productSourceCaseCount: cases.filter((entry) => entry.sourceCovered).length,
    externalEvidenceCaseCount: cases.filter((entry) => entry.externalEvidenceRequired).length,
    sourceProgrammeComplete: cases.every((entry) => entry.sourceCovered || entry.externalEvidenceRequired),
    renderedOwnerEvidenceComplete: false,
    automaticCertification: false,
    automaticDeployment: false,
    privateContentStored: false
  });
}

export function validateEonCityC09SignalFrontierSummit(summit = buildEonCityC09SignalFrontierSummit()) {
  const errors = [];
  const ids = summit.cases.map((entry) => entry.id);
  if (summit.requiredCaseCount !== 35) errors.push(`owner-case-count:${summit.requiredCaseCount}`);
  if (new Set(ids).size !== ids.length) errors.push('duplicate-owner-case');
  if (summit.productSourceCaseCount !== 28) errors.push(`source-case-count:${summit.productSourceCaseCount}`);
  if (summit.externalEvidenceCaseCount !== 7) errors.push(`external-case-count:${summit.externalEvidenceCaseCount}`);
  if (!summit.sourceProgrammeComplete) errors.push('source-programme-incomplete');
  if (summit.renderedOwnerEvidenceComplete || summit.automaticCertification || summit.automaticDeployment) errors.push('external-proof-fabricated');
  for (const entry of summit.cases) {
    if (!entry.sourceCovered && !entry.externalEvidenceRequired) errors.push(`unowned-case:${entry.id}`);
    if (entry.sourceCovered && (!entry.sourceModule || !entry.sourceTest)) errors.push(`source-evidence-missing:${entry.id}`);
    if (entry.passed) errors.push(`source-case-prepassed:${entry.id}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), summit });
}

export function getEonCityC09SignalFrontierTruth() {
  const result = validateEonCityC09SignalFrontierSummit();
  return freeze({
    schema: EON_CITY_C09_SIGNAL_FRONTIER_SUMMIT_SCHEMA,
    sourceValid: result.ok,
    ownerCaseCount: result.summit.requiredCaseCount,
    productSourceCaseCount: result.summit.productSourceCaseCount,
    externalEvidenceCaseCount: result.summit.externalEvidenceCaseCount,
    flagshipSourceProgrammeComplete: result.summit.sourceProgrammeComplete,
    renderedOwnerEvidenceComplete: false,
    productionReady: false,
    privateContentStored: false
  });
}

export default freeze({ buildEonCityC09SignalFrontierSummit, validateEonCityC09SignalFrontierSummit, getEonCityC09SignalFrontierTruth });
