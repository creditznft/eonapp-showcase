#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W717_CERTIFICATION_LANES,
  W717_THREAT_MODEL,
  getW717SecurityCertificationTruth,
  validateW717SecurityCertificationContract
} from '../config/w717-security-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const headers = read('public/_headers');
const auth = read('functions/_shared/eon-auth.js');
const packageJson = json('package.json');
const lock = json('package-lock.json');
const unitManifest = json('config/w624d-current-unit-test-manifest.json');
const archive = json('config/w701-non-certifying-archive-manifest.json');
const truth = getW717SecurityCertificationTruth();
const contract = validateW717SecurityCertificationContract();
const requiredDocs = [
  'docs/ARCHITECTURE.md',
  'docs/institutional/W717_CURRENT_ARCHITECTURE_AND_CERTIFICATION_RUNBOOK_2026-07-25.md',
  'docs/institutional/W717_INCIDENT_RESPONSE_RUNBOOK_2026-07-25.md'
];
const currentWaveGates = Array.from({ length: 17 }, (_, index) => `W${701 + index}`);
const sourceScript = String(packageJson.scripts?.['verify:institutional-source'] || '');
const securityScript = String(packageJson.scripts?.['verify:institutional-security'] || '');

const checks = [
  ['contract-valid', contract.ok && W717_THREAT_MODEL.length === 5 && W717_CERTIFICATION_LANES.length === 7],
  ['security-headers', /X-Content-Type-Options: nosniff/.test(headers) && /Referrer-Policy: strict-origin/.test(headers) && /Strict-Transport-Security:/.test(headers) && /Permissions-Policy:/.test(headers) && /Content-Security-Policy:/.test(headers) && /object-src 'none'/.test(headers) && /frame-ancestors/.test(headers)],
  ['session-cookie-boundary', /'Secure'/.test(auth) && /'HttpOnly'/.test(auth) && /SameSite=/.test(auth) && /maxAge:\s*0/.test(auth)],
  ['lockfile-and-secret-scan', lock.lockfileVersion >= 3 && /scripts\/secret-scan\.mjs --mode=workspace/.test(packageJson.scripts?.['security:secret-scan'] || '')],
  ['current-unit-authority', unitManifest.certifying === true && Number(String(unitManifest.wave || '').replace(/^W/, '')) >= 717 && unitManifest.testFileCount === unitManifest.testFiles.length && unitManifest.excludedEvidenceDiagnosticCount === unitManifest.excludedEvidenceDiagnostics.length],
  ['historical-archive-explicit', archive.certifying === false && archive.entries.length >= 1 && archive.entries.every((row) => row.reason && row.archivedPath)],
  ['seven-clear-lanes', W717_CERTIFICATION_LANES.map((row) => row.id).join(',') === 'source-authority,current-unit,integration,build-smoke,browser-device,security,release'],
  ['source-command-current', currentWaveGates.every((wave) => sourceScript.includes(`qa:w${wave.slice(1)}`)) && sourceScript.includes('qa:w717-security-certification-simplification')],
  ['security-command-current', securityScript.includes('security:secret-scan') && securityScript.includes('qa:w530-security-oauth') && securityScript.includes('qa:w636-security-privacy-abuse') && securityScript.includes('qa:w714-identity-commercial-truth') && securityScript.includes('qa:w717-security-certification-simplification')],
  ['architecture-and-incident-docs', requiredDocs.every((relative) => fs.existsSync(path.join(root, relative)))],
  ['truth-fence', truth.sourceSecurityReviewed && !truth.productionSecurityCertified && !truth.dependencyAuditCompleted && !truth.penetrationTestCompleted && !truth.physicalBrowserEvidenceCompleted && !truth.performsNetworkRequest && !truth.mutatesProduction]
];
for (const [id, pass] of checks) console.log(`[W717] ${pass ? 'PASS' : 'FAIL'} ${id}`);
console.log(`[W717] INFO ${W717_THREAT_MODEL.length} threat domains; ${W717_CERTIFICATION_LANES.length} certification lanes; ${unitManifest.testFileCount} maintained tests`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W717] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
