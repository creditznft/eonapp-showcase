#!/usr/bin/env node
/** W432 local matrix preparer. It writes audit instructions only; it does not run Lighthouse or issue a pass. */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W432_CITY_CERTIFICATION_CONTRACT, W432_CITY_CERTIFICATION_SCHEMA, W432_LIGHTHOUSE_ROUTE_MATRIX, validateW432CityCertificationContract } from '../config/w432-city-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'CodexAuditPack', 'w432-city-certification');

export function buildW432LighthouseMatrix() {
  const validationErrors = validateW432CityCertificationContract();
  if (validationErrors.length) throw new Error(`W432 certification contract is invalid: ${validationErrors.join(' | ')}`);
  const profiles = ['desktop', 'mobile'];
  const cases = profiles.flatMap((profile) => W432_LIGHTHOUSE_ROUTE_MATRIX
    .filter((entry) => entry.requiredProfiles.includes(profile))
    .map((entry) => Object.freeze({ id: `${profile}:${entry.id}`, profile, route: entry.route, purpose: entry.purpose, budget: W432_CITY_CERTIFICATION_CONTRACT.budgets[profile], rawHtmlRequired: true, rawJsonRequired: true })));
  return Object.freeze({
    schema: W432_CITY_CERTIFICATION_SCHEMA,
    generatedAt: new Date().toISOString(),
    canonicalRoute: '/eoncity',
    sourceOnly: true,
    certificationIssued: false,
    launchApproved: false,
    expectedCaseCount: cases.length,
    cases: Object.freeze(cases),
    deviceMatrix: W432_CITY_CERTIFICATION_CONTRACT.deviceMatrix,
    evidenceRules: W432_CITY_CERTIFICATION_CONTRACT.evidenceRules,
    note: 'This file plans required evidence. It is not a Lighthouse result, device result, production result, or certification.'
  });
}

export function writeW432LighthouseMatrix({ directory = outputDirectory } = {}) {
  const matrix = buildW432LighthouseMatrix();
  mkdirSync(directory, { recursive: true });
  const jsonPath = path.join(directory, 'W432_LIGHTHOUSE_MATRIX.json');
  const markdownPath = path.join(directory, 'W432_EVIDENCE_CHECKLIST.md');
  writeFileSync(jsonPath, `${JSON.stringify(matrix, null, 2)}\n`);
  const lines = [
    '# W432 City certification evidence checklist',
    '',
    'This is a source-prepared checklist only. Do not mark a pass without raw Lighthouse HTML/JSON, browser version, deployed commit, date/time, and human device evidence.',
    '',
    '## Lighthouse cases',
    ...matrix.cases.map((entry) => `- [ ] ${entry.id} — ${entry.route} — ${entry.purpose}`),
    '',
    '## Human City device cases',
    ...matrix.deviceMatrix.map((entry) => `- [ ] ${entry.id} — ${entry.quality} — ${entry.evidence}`),
    '',
    'Chrome error pages, missing navigation traces, redirects to retired City paths, or missing raw artifacts are invalid evidence.'
  ];
  writeFileSync(markdownPath, `${lines.join('\n')}\n`);
  return Object.freeze({ matrix, jsonPath, markdownPath });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = writeW432LighthouseMatrix();
  process.stdout.write(`Prepared W432 Lighthouse matrix (${result.matrix.expectedCaseCount} planned reports). No Lighthouse run or certification was performed.\n`);
}
