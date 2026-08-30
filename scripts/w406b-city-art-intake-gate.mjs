#!/usr/bin/env node
/** W406B/W611 static source gate: City art intake, provenance and local candidate truth. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_ASSET_CATALOG, getCityAssetById, isCityAssetLoadable } from '../assets/js/city/eon-city-asset-catalog.js';
import {
  EON_CITY_ART_INTAKE,
  EON_CITY_ART_PIPELINE_POLICY,
  EON_CITY_CANONICAL_PUBLIC_ENGINE,
  getCityArtIntakeFirstFramePlan,
  getCityArtIntakeSummary,
  validateCityArtIntake
} from '../assets/js/city/eon-city-art-intake.js';
import { W406B_CITY_ART_INTAKE_CONTRACT, validateW406BCityArtIntakeContract } from '../config/w406b-city-art-intake-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW406BCityArtIntake({ writeArtifact = true } = {}) {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const intake = validateCityArtIntake();
  const summary = getCityArtIntakeSummary({ quality: 'balanced' });
  const firstFrame = getCityArtIntakeFirstFramePlan({ quality: 'balanced' });
  const city = read('assets/js/city/eon-city-play-babylon.js');
  const catalog = read('assets/js/city/eon-city-asset-catalog.js');
  const assetReadme = read('assets/city/README.md');
  const docs = read('docs/W406B_CITY_ART_INTAKE_AND_PIPELINE_2026-06-28.md');
  const candidates = EON_CITY_ART_INTAKE.filter((entry) => entry.intake.loadable);
  const planned = EON_CITY_ART_INTAKE.filter((entry) => !entry.intake.loadable);

  check('contract-valid', validateW406BCityArtIntakeContract().length === 0, 'W406B contract has no internal mismatch');
  check('canonical-babylon-route', EON_CITY_ART_PIPELINE_POLICY.publicEngine === EON_CITY_CANONICAL_PUBLIC_ENGINE && EON_CITY_ART_PIPELINE_POLICY.publicRoute === '/eoncity' && EON_CITY_ART_PIPELINE_POLICY.noSecondPublicCity === true, 'Babylon /eoncity remains the one public City');
  check('intake-valid', intake.ok, `W406B art intake failed validation: ${intake.errors.join(' | ')}`);
  check('candidate-and-planned-split', candidates.length === 5 && planned.length === 3 && candidates.every((entry) => {
    const asset = getCityAssetById(entry.assetId);
    return asset?.status === 'shipped' && isCityAssetLoadable(asset) && entry.intake.status === 'engineering-candidate' && entry.intake.ownerVisualApproval === 'pending';
  }) && planned.every((entry) => {
    const asset = getCityAssetById(entry.assetId);
    return asset?.status === 'planned' && entry.intake.status === 'planned' && entry.intake.loadable === false;
  }), 'W406B maps first-frame candidates to same-origin catalog assets and leaves future districts planned');
  check('first-frame-kit', firstFrame.entries.length === 5 && firstFrame.entries.map((entry) => entry.assetId).join(',') === 'command-horizon-arrival-gate,command-horizon-command-deck,command-horizon-wayfinding,eonbot-companion,operator-hero', 'first frame has Arrival Gate, Command Deck, wayfinding, EONBOT and Navigator');
  check('bounded-texture-lod-policy', EON_CITY_ART_INTAKE.every((entry) => entry.lod.levels.join(',') === 'lod0,lod1,lod2' && entry.texture.maxDimension <= 2048) && candidates.every((entry) => /KTX2\/Basis Universal pending final package/.test(entry.texture.releaseFormat)), 'every intake entry has bounded LODs and candidates declare KTX2/Basis final packaging pending');
  check('fallback-policy', EON_CITY_ART_INTAKE.every((entry) => entry.fallback.mode === 'procedural-source-controlled' && entry.fallback.localOnly === true && entry.fallback.remoteNetwork === false && entry.fallback.userData === false), 'every intake entry keeps a local procedural/mobile fallback');
  check('local-candidates-not-release-approved', summary.shippedBinaryCount >= 8 && summary.loadableCount === 5 && summary.releaseReady === false && summary.visualCertificationCaptured === false && summary.ownerVisualApprovalCaptured === false && summary.remoteNetwork === false && EON_CITY_ART_PIPELINE_POLICY.remoteNetwork === false, 'local candidate assets are present but final visual-release approval remains blocked');
  check('catalog-keeps-future-districts-explicit', ['creator-atrium-exterior', 'forge-bay-exterior', 'signal-tower-exterior'].every((assetId) => CITY_ASSET_CATALOG.some((entry) => entry.id === assetId && entry.status === 'planned')), 'catalog preserves future district work as planned rather than pretending it is shipped');
  check('no-remote-literal-in-intake', !/https?:\/\//i.test(read('assets/js/city/eon-city-art-intake.js')), 'intake module contains no remote network literal');
  check('babylon-runtime-exposes-intake', /getCityArtIntakeSummary/.test(city) && /artIntake: getCityArtIntakeSummary/.test(city) && /scene\.metadata = \{[\s\S]{0,380}artIntake/.test(city), 'Babylon runtime exposes the local art-intake summary');
  check('candidate-runtime-is-present', /createEonCityOriginalSceneArtRuntime/.test(city) && /originalSceneArtRuntime/.test(city), 'Babylon runtime contains the current local candidate-art seam');
  check('asset-folder-boundary', /W604|local GLB|engineering candidate/i.test(assetReadme) && /not.*final/i.test(assetReadme), 'asset folder records local candidate art and final-approval boundary');
  check('documentation-boundary', /W611 current-state note/i.test(docs) && /final visual-release/i.test(docs) && /KTX2\/Basis/i.test(docs) && /Babylon/i.test(docs), 'documentation records the local candidate update and remaining proof requirements');
  check('catalog-source-no-network', !/https?:\/\//i.test(catalog), 'W365 catalog remains free of remote asset URLs');
  check('contract-source-only', W406B_CITY_ART_INTAKE_CONTRACT.releaseRules.sourceOnly === true && W406B_CITY_ART_INTAKE_CONTRACT.releaseRules.prohibitRemoteNetwork === true, 'contract locks source-only, local provenance boundaries');

  const report = Object.freeze({
    schema: 'eonapp.w406b.city-art-intake-gate.v2',
    wave: W406B_CITY_ART_INTAKE_CONTRACT,
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    intake: summary,
    limitations: Object.freeze([
      'This gate proves local catalog and source-contract integrity; it does not certify final visual quality, licence clearance, KTX2/Basis packaging, device performance or owner approval.',
      'W602–W604 GLBs are engineering candidates with safe procedural fallbacks, not a final art-release certificate.',
      'Real browser/device visual evidence and the W599 authenticated City closeout remain separate gates.'
    ])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w406b-city-art-intake-gate');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW406BCityArtIntake();
  process.stdout.write(`W406B City art intake gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
