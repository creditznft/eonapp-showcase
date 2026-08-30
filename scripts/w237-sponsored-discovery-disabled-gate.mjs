#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { SPONSORED_DISCOVERY_ACTIVE, SPONSORED_DISCOVERY_MODE, SPONSORED_DISCOVERY_PROTECTED_SURFACES, canRenderSponsoredDiscovery } from '../config/sponsored-discovery-policy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const providerUrlPattern = /https?:\/\/[^'\"\s]*(?:omg10\.com|monetag|infolinks|viglink|skimlinks|adwixio|chatads)/i;
const imports = auditActiveSurfaceImports({ root: ROOT });
const activeProviderHits = imports.reachableModules.filter((relative) => providerUrlPattern.test(fs.readFileSync(path.join(ROOT, relative), 'utf8')));
const activeAdModules = imports.reachableModules.filter((relative) => relative.startsWith('assets/js/ads/'));

assert(SPONSORED_DISCOVERY_ACTIVE === false && SPONSORED_DISCOVERY_MODE === 'disabled', 'Automatic Sponsored Discovery injection must remain disabled; the RT97 explicit tool is governed separately.');
assert(imports.ok, 'Active surface import fence must pass before sponsored discovery review.');
assert(activeProviderHits.length === 0, `Active modules contain a provider destination URL: ${activeProviderHits.join(', ')}`);
assert(activeAdModules.length === 0, `Active modules import the archived ads family: ${activeAdModules.join(', ')}`);
for (const route of SPONSORED_DISCOVERY_PROTECTED_SURFACES) {
  const decision = canRenderSponsoredDiscovery(route);
  assert(decision.ok === false && decision.reason === 'sponsored-discovery-disabled', `Protected surface must reject sponsored discovery: ${route}`);
}
const report = { schema: 'eonapp.w237.sponsored-discovery-disabled-gate.v1', ok: errors.length === 0, checkedAt: new Date().toISOString(), activeProviderHits, activeAdModules, protectedSurfaceCount: SPONSORED_DISCOVERY_PROTECTED_SURFACES.length, errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W237_SPONSORED_DISCOVERY_DISABLED_GATE_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[W237] ${report.ok ? 'PASS' : 'FAIL'}: automatic Sponsored Discovery injection remains disabled across ${report.protectedSurfaceCount} protected surfaces; RT97 explicit /local-ai discovery is separate.`);
if (!report.ok) errors.forEach((error) => console.error(`[W237] ${error}`));
process.exitCode = report.ok ? 0 : 1;
