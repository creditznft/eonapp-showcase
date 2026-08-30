#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W476_API_NEGATIVE_TEST_MATRIX,
  W476_API_SURFACE_CONTRACT,
  serializeW476ApiSurfaceContract,
  validateW476ApiSurfaceContract
} from '../config/w476-api-surface-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDirectory = path.join(root, 'EVIDENCE', 'W476_A6');
const expectedSources = Object.freeze([
  'functions/api/account/delete-request.js',
  'functions/api/actions/execute.js',
  'functions/api/actions/prepare.js',
  'functions/api/actions/status.js',
  'functions/api/auth/google/callback.js',
  'functions/api/auth/google/start.js',
  'functions/api/auth/logout.js',
  'functions/api/auth/session.js',
  'functions/api/connectors/status.js',
  'functions/api/deployments/status.js',
  'functions/api/offline/capability.js',
  'functions/csp-report.js'
]);

const handlerName = (method) => `onRequest${method[0]}${method.slice(1).toLowerCase()}`;
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

export function inspectW476ApiSurfaceContract() {
  const issues = [...validateW476ApiSurfaceContract()];
  const surfaces = W476_API_SURFACE_CONTRACT.surfaces;
  const sources = surfaces.map((surface) => surface.source).sort();
  if (sources.join('\n') !== [...expectedSources].sort().join('\n')) issues.push('source-inventory-drift');

  for (const entry of surfaces) {
    const absolute = path.join(root, entry.source);
    if (!existsSync(absolute)) { issues.push(`missing-source:${entry.source}`); continue; }
    const source = read(entry.source);
    for (const method of entry.methods) {
      if (!new RegExp(`export\\s+async\\s+function\\s+${handlerName(method)}\\s*\\(`).test(source)) issues.push(`handler-missing:${entry.route}:${method}`);
    }
    if (entry.state === 'hard-disabled' && !/enabled:\s*false|not-configured/.test(source)) issues.push(`disabled-state-not-evident:${entry.route}`);
    if (entry.route === '/csp-report') {
      if (!/application\/reports\+json/.test(source)) issues.push('csp-reporting-api-content-type-missing');
      if (!/invalid_csp_document_origin/.test(source)) issues.push('csp-report-origin-validation-missing');
      if (!/MAX_REPORT_BYTES/.test(source)) issues.push('csp-report-size-bound-missing');
    }
  }

  const rootHeaders = read('_headers');
  const publicHeaders = read('public/_headers');
  if (rootHeaders !== publicHeaders) issues.push('headers-out-of-sync');
  for (const header of ['Reporting-Endpoints: csp-endpoint="/csp-report"', 'Report-To:', 'report-to csp-endpoint', 'report-uri /csp-report']) {
    if (!rootHeaders.includes(header)) issues.push(`csp-header-missing:${header}`);
  }

  return Object.freeze({
    schema: 'eonapp.w476.api-surface-gate.v1',
    wave: 'W476-A6',
    ok: issues.length === 0,
    sourceOnly: true,
    productionApproved: false,
    functionCount: surfaces.length,
    negativeCaseCount: W476_API_NEGATIVE_TEST_MATRIX.length,
    sources: Object.freeze(sources),
    issues: Object.freeze(issues)
  });
}

export function writeW476ApiSurfaceArtifacts() {
  const result = inspectW476ApiSurfaceContract();
  if (!result.ok) throw new Error(`W476-A6 API surface contract failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}`);
  mkdirSync(targetDirectory, { recursive: true });
  const contract = `${serializeW476ApiSurfaceContract()}\n`;
  const matrix = `${JSON.stringify({ schema: 'eonapp.w476.api-negative-test-matrix.v1', wave: 'W476-A6', cases: W476_API_NEGATIVE_TEST_MATRIX }, null, 2)}\n`;
  const gate = `${JSON.stringify(result, null, 2)}\n`;
  writeFileSync(path.join(targetDirectory, 'API_SURFACE_CONTRACT.json'), contract);
  writeFileSync(path.join(targetDirectory, 'API_NEGATIVE_TEST_MATRIX.json'), matrix);
  writeFileSync(path.join(targetDirectory, 'API_SURFACE_GATE.json'), gate);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = writeW476ApiSurfaceArtifacts();
  process.stdout.write(`W476-A6 API surface contract passed (${result.functionCount} Functions; ${result.negativeCaseCount} negative cases). Source proof only.\n`);
}
