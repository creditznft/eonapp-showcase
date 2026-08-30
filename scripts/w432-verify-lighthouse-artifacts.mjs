#!/usr/bin/env node
/** W432 local artifact verifier. It fails closed for missing, Chrome-error, or incomplete evidence. */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessCityLighthouseReport, evaluateW432CertificationEvidence } from '../assets/js/city/eon-city-certification-evidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArguments(argv = []) {
  const valueFor = (flag, fallback = '') => {
    const index = argv.indexOf(flag);
    return index >= 0 ? String(argv[index + 1] || fallback) : fallback;
  };
  return Object.freeze({ profile: valueFor('--profile', 'desktop'), input: valueFor('--input', ''), output: valueFor('--output', '') });
}

export function readW432LighthouseArtifacts({ directory = '', profile = 'desktop' } = {}) {
  const resolvedDirectory = directory ? path.resolve(root, directory) : '';
  if (!resolvedDirectory || !existsSync(resolvedDirectory)) return Object.freeze({ directory: resolvedDirectory, profile, files: Object.freeze([]), reports: Object.freeze([]), parseErrors: Object.freeze(['artifact-directory-missing']) });
  const files = readdirSync(resolvedDirectory, { recursive: true })
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => path.join(resolvedDirectory, entry));
  const reports = [];
  const parseErrors = [];
  for (const file of files) {
    try {
      const report = JSON.parse(readFileSync(file, 'utf8'));
      if (report?.categories && (report?.finalUrl || report?.requestedUrl)) reports.push(Object.freeze({ file: path.relative(root, file), profile, report }));
    } catch {
      parseErrors.push(path.relative(root, file));
    }
  }
  return Object.freeze({ directory: resolvedDirectory, profile, files: Object.freeze(files.map((file) => path.relative(root, file))), reports: Object.freeze(reports), parseErrors: Object.freeze(parseErrors) });
}

export function verifyW432LighthouseArtifacts({ directory = '', profile = 'desktop', device = [] } = {}) {
  const loaded = readW432LighthouseArtifacts({ directory, profile });
  const reports = loaded.reports.map((entry) => ({ profile: entry.profile, report: entry.report }));
  const assessments = reports.map((entry) => assessCityLighthouseReport(entry.report, { profile: entry.profile }));
  const evidence = evaluateW432CertificationEvidence({ lighthouse: reports, device });
  const blocked = assessments.filter((entry) => !entry.usable).map((entry) => ({ route: entry.route || '', profile: entry.profile, checks: entry.checks }));
  const result = Object.freeze({
    schema: 'eon.city.certification.w432.artifact-verifier.v1',
    sourceOnly: true,
    profile,
    artifactDirectory: loaded.directory ? path.relative(root, loaded.directory) : '',
    artifactFileCount: loaded.files.length,
    reportCount: reports.length,
    parseErrors: loaded.parseErrors,
    assessments: Object.freeze(assessments),
    invalidOrBlockedReports: Object.freeze(blocked),
    evidence,
    certificationIssued: false,
    launchApproved: false,
    ok: evidence.missingLighthouseReports.length === 0 && blocked.length === 0 && evidence.passingLighthouseReportCount === evidence.expectedLighthouseReportCount && evidence.humanPassedDeviceCaseCount === evidence.expectedDeviceCaseCount,
    note: 'Even a complete artifact set remains subject to independent production and human device review; this verifier never issues certification or launch approval.'
  });
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArguments(process.argv.slice(2));
  const result = verifyW432LighthouseArtifacts({ directory: args.input, profile: args.profile });
  const output = args.output ? path.resolve(root, args.output) : path.join(root, 'CodexAuditPack', 'w432-city-certification', `W432_${args.profile.toUpperCase()}_ARTIFACT_CHECK.json`);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`W432 artifact check: ${result.reportCount} supplied reports, ${result.evidence.missingLighthouseReports.length} required reports still missing. Certification not issued.\n`);
  process.exitCode = result.ok ? 0 : 1;
}
