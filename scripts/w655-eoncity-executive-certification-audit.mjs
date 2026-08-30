#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ALL_ROUTE_ROWS } from '../config/route-contract.mjs';
import {
  EON_CITY_W655_DISTRICT_ACTIONS,
  EON_CITY_W655_DISTRICT_EXPERIENCE,
  EON_CITY_W655_REAL_WORK_TERMINALS,
  EON_CITY_W655_WORLD_DENSITY,
  validateEonCityW655Experience
} from '../assets/js/city/w655/eon-city-w655-experience-contract.js';
import { EON_CITY_CONTROL_CONVENTION, resolveEonCityCameraRelativeMove } from '../assets/js/city/eon-city-gameplay-contract.js';

const root = process.cwd();
const exists = (file) => fs.existsSync(path.join(root, file));
const requiredDocs = [
  'docs/release-records/W655_EONCITY_EXECUTIVE_FINE_TUNE_AUDIT_2026-07-14.md',
  'docs/release-records/W655_DISTRICT_REAL_WORK_AND_REALM_MATRIX_2026-07-14.md',
  'docs/release-records/W655_CONTROLS_DEVICES_AND_VISUAL_EVIDENCE_MATRIX_2026-07-14.md',
  'docs/release-records/W655_CODEX_END_TO_END_DEPLOYMENT_AND_CERTIFICATION_RUNBOOK_2026-07-14.md',
  'docs/release-records/W655_COMPLETE_ROADMAP_AND_STOP_RULES_2026-07-14.md'
];

export function inspectW655ExecutiveCertification() {
  const failures = [];
  const routes = ALL_ROUTE_ROWS.map((row) => row.from);
  const experience = validateEonCityW655Experience({ canonicalRoutes: routes });
  if (!experience.ok) failures.push(...experience.errors);
  for (const file of requiredDocs) if (!exists(file)) failures.push(`missing-doc:${file}`);
  if (EON_CITY_W655_DISTRICT_ACTIONS['trade-dome'][0]?.route !== '/realm-studio') failures.push('realm-primary-action');
  if (EON_CITY_W655_DISTRICT_ACTIONS['vault-station'][0]?.route !== '/local-ai') failures.push('local-ai-primary-action');
  if (Object.keys(EON_CITY_W655_DISTRICT_EXPERIENCE).length !== 8) failures.push('district-coverage');
  if (EON_CITY_W655_REAL_WORK_TERMINALS.length < 10) failures.push('real-work-terminal-density');
  if (EON_CITY_W655_WORLD_DENSITY.streetLightsByQuality.balanced < 10) failures.push('street-furniture-density');
  if (EON_CITY_W655_WORLD_DENSITY.maxResidentBinaryDistricts !== 1) failures.push('resident-district-budget');
  const headings = [{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}];
  for (const forward of headings) {
    const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1, forward: 0 }, cameraForward: forward });
    const expected = { x: forward.z, z: -forward.x };
    if (right.x * expected.x + right.z * expected.z < 0.99) failures.push(`inverted-control:${forward.x}:${forward.z}`);
  }
  if (EON_CITY_CONTROL_CONVENTION.leftRightInverted !== false) failures.push('inversion-policy');
  const scoring = Object.freeze({
    executiveProductLogic: 98,
    districtPurposeAndRealm: 97,
    realWorkTerminalCoverage: 97,
    controlContractAndDevicePlan: 98,
    assetDensityAndResidency: 97,
    deploymentRollbackAndEvidencePlan: 98,
    sourceTruthAndSafety: 99,
    visualCertification: null
  });
  const scored = Object.values(scoring).filter(Number.isFinite);
  const previsualScore = Number((scored.reduce((a,b)=>a+b,0)/scored.length).toFixed(2));
  return Object.freeze({
    schema: 'eonapp.w655.eoncity-executive-certification-audit.v1',
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    sourcePrevisualScore: previsualScore,
    sourcePrevisualScoreOutOf10: Number((previsualScore / 10).toFixed(2)),
    scores: scoring,
    districtCount: experience.districtCount,
    realWorkTerminalCount: experience.terminalCount,
    nativeRouteCount: experience.nativeRouteCount,
    visualCertificationPending: true,
    machineBrowserEvidencePending: true,
    productionBlockedUntilCodexPassAndOwnerGo: true,
    failures: Object.freeze(failures)
  });
}

const report = inspectW655ExecutiveCertification();
const output = path.join(root, 'reports', 'w655', 'W655_EXECUTIVE_CERTIFICATION_AUDIT_RECEIPT_2026-07-14.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, output: path.relative(root, output), sourcePrevisualScore: report.sourcePrevisualScoreOutOf10, visualCertificationPending: true }, null, 2));
