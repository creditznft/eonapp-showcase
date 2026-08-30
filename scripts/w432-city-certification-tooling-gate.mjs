#!/usr/bin/env node
/** W432 static gate: canonical audit matrix and fail-closed artifact handling, not a Lighthouse certification. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateW432CertificationEvidence, getW432CertificationTruth } from '../assets/js/city/eon-city-certification-evidence.js';
import { W432_CITY_CERTIFICATION_CONTRACT, validateW432CityCertificationContract } from '../config/w432-city-certification-contract.mjs';
import { buildW432LighthouseMatrix } from './w432-prepare-lighthouse-matrix.mjs';
import { verifyW432LighthouseArtifacts } from './w432-verify-lighthouse-artifacts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW432CityCertificationTooling() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const desktopConfig = read('.lighthouserc.w432.desktop.cjs');
  const mobileConfig = read('.lighthouserc.w432.mobile.cjs');
  const preparer = read('scripts/w432-prepare-lighthouse-matrix.mjs');
  const verifier = read('scripts/w432-verify-lighthouse-artifacts.mjs');
  const truth = getW432CertificationTruth();
  const matrix = buildW432LighthouseMatrix();
  const emptyEvidence = evaluateW432CertificationEvidence();
  const emptyArtifacts = verifyW432LighthouseArtifacts({ directory: 'does-not-exist', profile: 'desktop' });

  check('required-files', ['config/w432-city-certification-contract.mjs', 'assets/js/city/eon-city-certification-evidence.js', 'scripts/w432-prepare-lighthouse-matrix.mjs', 'scripts/w432-verify-lighthouse-artifacts.mjs', '.lighthouserc.w432.desktop.cjs', '.lighthouserc.w432.mobile.cjs'].every((relative) => existsSync(path.join(root, relative))), 'W432 contract, evidence parser, matrix tools and both LHCI configs are present');
  check('contract-valid', validateW432CityCertificationContract().length === 0 && W432_CITY_CERTIFICATION_CONTRACT.route === '/eoncity' && W432_CITY_CERTIFICATION_CONTRACT.publicRenderer === 'Babylon WebGL', 'the certification plan covers the one canonical Babylon City route');
  check('canonical-route-matrix', matrix.expectedCaseCount === 18 && matrix.cases.every((entry) => entry.route !== '/eoncity/3d' && entry.route !== '/eoncity/tour' && entry.route !== '/eoncity/lite'), 'the Lighthouse matrix includes nine live routes across desktop/mobile and excludes retired City paths');
  check('device-matrix', matrix.deviceMatrix.length === 5 && matrix.deviceMatrix.some((entry) => entry.id === 'android-safe') && matrix.deviceMatrix.some((entry) => entry.id === 'ios-safe'), 'human City verification includes desktop, Android, iOS and weak-WebGL recovery cases');
  check('lighthouse-configs', /\/eoncity/.test(desktopConfig) && /\/eoncity/.test(mobileConfig) && !/eoncity\/3d|eoncity\/tour|eoncity\/lite/.test(`${desktopConfig}\n${mobileConfig}`), 'desktop and mobile configs use canonical routes only');
  check('fail-closed-empty-evidence', emptyEvidence.status === 'external-evidence-required' && emptyEvidence.expectedLighthouseReportCount === 18 && emptyEvidence.usableLighthouseReportCount === 0 && emptyEvidence.independentlyCertified === false, 'source without reports cannot be mistaken for a Lighthouse or device pass');
  check('fail-closed-empty-artifacts', emptyArtifacts.ok === false && emptyArtifacts.certificationIssued === false && emptyArtifacts.launchApproved === false, 'a missing artifact directory remains a failure, not an environment pass');
  check('chrome-error-rejection', truth.chromeErrorPagesRejected === true && /chrome-error/i.test(verifier), 'Chrome error pages are rejected as invalid evidence');
  check('no-auto-certification', truth.sourceOnly && !truth.automaticLighthouseRun && !truth.automaticDeviceRun && !truth.automaticProductionVerification && !truth.automaticCertification && !truth.automaticLaunchApproval && /certificationIssued: false/.test(preparer), 'the tooling writes a plan/check only and cannot issue certification or launch approval');
  return Object.freeze({ schema: 'eonapp.w432.city-certification-tooling-gate.v1', wave: 'W432', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No Lighthouse report, production browser navigation, manual screenshot set, or device test was run in this gate.', 'W432 certification remains externally pending until raw artifacts and human device evidence are independently reviewed.']) });
}

export function runW432CityCertificationToolingGate({ writeArtifact = true } = {}) {
  const result = inspectW432CityCertificationTooling();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w432-city-certification-tooling-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW432CityCertificationToolingGate();
  process.stdout.write(`W432 City certification tooling gate passed (${result.checkCount}/${result.checkCount}). No external certification was issued.\n`);
}
