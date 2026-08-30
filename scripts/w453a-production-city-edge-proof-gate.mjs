#!/usr/bin/env node
/** W453.1 static source gate for the opt-in production City edge proof. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createW453AEdgeDryRun, W453A_EDGE_PROOF_CASES } from './w453a-production-city-edge-proof.mjs';
import { W453A_CITY_ALIAS_PATHS, W453A_CITY_EDGE_PROOF_SCHEMA, W453A_EDGE_PROOF_LIMITATIONS, validateW453ACityEdgeProofContract } from '../config/w453a-production-city-edge-proof-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const freeze = (value) => Object.freeze(value);

export function inspectW453AProductionCityEdgeSource() {
  const errors = [...validateW453ACityEdgeProofContract()];
  const source = read('scripts/w453a-production-city-edge-proof.mjs');
  const routeContract = read('config/w453a-production-city-edge-proof-contract.mjs');
  const dryRun = createW453AEdgeDryRun({ baseUrl: 'https://preview.eonapp.ch' });
  const ensure = (condition, message) => { if (!condition) errors.push(message); };

  ensure(/RETIRED_REDIRECTS/.test(routeContract) && /PRIMARY_APP_ROUTES/.test(routeContract), 'W453.1 must derive probes from the current route contract.');
  ensure(/confirmNetwork/.test(source) && /dry-run-no-network/.test(source), 'W453.1 must be no-network by default.');
  ensure(/redirect:\s*'manual'/.test(source), 'W453.1 must record redirect hops explicitly rather than silently following them.');
  ensure(/LEGACY_CITY_NAVIGATION_PATHS/.test(routeContract), 'W453.1 must inspect the delivered Service Worker City-interception source.');
  ensure(!/localStorage|sessionStorage|document\.cookie|navigator\.sendBeacon|XMLHttpRequest|WebSocket/i.test(source), 'W453.1 must not use browser storage, cookies, telemetry or persistent sockets.');
  ensure(!/Dodo/i.test(source) && !/["']\/(?:billing|checkout|payments?)(?:[/?"']|$)/i.test(source), 'W453.1 must not mix payment or billing route traffic into City proof.');
  ensure(dryRun.status === 'dry-run-no-network' && dryRun.caseCount === W453A_EDGE_PROOF_CASES.length, 'W453.1 dry run must enumerate all cases without a request.');
  ensure(W453A_CITY_ALIAS_PATHS.includes('/realm') && W453A_CITY_ALIAS_PATHS.includes('/eoncity.html'), 'W453.1 must retain the key legacy City probes.');
  ensure(W453A_EDGE_PROOF_LIMITATIONS.some((line) => /does not prove a browser/i.test(line)), 'W453.1 must explicitly retain browser/device proof requirements.');

  return freeze({
    schema: 'eonapp.w453.1.production-city-edge-proof-gate.v1',
    wave: 'W453.1',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    caseCount: W453A_EDGE_PROOF_CASES.length,
    cityAliasCount: W453A_CITY_ALIAS_PATHS.length,
    contractSchema: W453A_CITY_EDGE_PROOF_SCHEMA,
    errors: freeze(errors),
    limitations: freeze(['Static source verification only. A passed source gate is not a deployed-route, Service Worker adoption, browser, GPU, visual, thermal or mobile proof.'])
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW453AProductionCityEdgeSource();
  assert.equal(result.status, 'pass', result.errors.join('\n'));
  const dir = path.join(root, 'artifacts', 'w453a-production-city-edge-proof-gate');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`W453.1 production City edge-proof source gate passed (${result.caseCount} probes; ${result.cityAliasCount} City aliases).\n`);
}
