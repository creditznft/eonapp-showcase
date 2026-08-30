#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityLivingNexusRealmCatalog, buildEonCityLivingNexusRealmPlan, validateEonCityLivingNexusRealmPlan } from '../assets/js/city/eon-city-living-nexus-realms.js';
import { buildEonCityW691MyRealmPlan, validateEonCityW691RealmsMyRealmPlan } from '../assets/js/city/w691/eon-city-w691-realms-my-realm-integration.js';
import { resolveEonCityW692ExperienceProfile, validateEonCityW692ExperienceProfile } from '../assets/js/city/w692/eon-city-w692-experience-quality.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

export function inspectW691W692FinalProductIntegration() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'assets/js/city/w691/eon-city-w691-realms-my-realm-integration.js',
    'assets/js/city/w692/eon-city-w692-experience-quality.js',
    'tests/unit/w691-realms-my-realm-integration.test.mjs',
    'tests/unit/w692-experience-quality.test.mjs'
  ];
  add('required-files', required.every(exists), 'W691/W692 source and maintained tests exist');
  const catalog = getEonCityLivingNexusRealmCatalog();
  add('approved-realm-labels', JSON.stringify(catalog.map((entry) => entry.label)) === JSON.stringify(['Archive Noir','Living Bio-City','Golden Sovereign Realm','Oceanic Light','Path of Time','EONBOT Temple']), 'approved six Realm product identities are visible');
  add('stable-realm-ids', JSON.stringify(catalog.map((entry) => entry.id)) === JSON.stringify(['archive-noir','living-bio-city','golden-sovereign','forge-depths','orbital-white-city','nexus-ruins']), 'stable local visit/discovery ids remain compatible');
  add('realm-plans-valid', catalog.every((entry) => validateEonCityLivingNexusRealmPlan(buildEonCityLivingNexusRealmPlan(entry.id, { storage: null })).ok), 'all six projected Realm plans validate');
  const transformations = catalog.map((entry, index) => ({ id: `${entry.productIdentityId}-verified-${index}`, destination: index % 2 ? 'core' : 'my-realm', location: entry.reflectionZoneId, label: `${entry.label} verified reflection` }));
  const myRealm = buildEonCityW691MyRealmPlan({ transformations });
  add('my-realm-valid', validateEonCityW691RealmsMyRealmPlan(myRealm).ok && myRealm.zones.length === 6, 'My Realm has six bounded productivity/reflection zones');
  const focus = resolveEonCityW692ExperienceProfile({ mode: 'focus', quality: 'cinematic' });
  const mobile = resolveEonCityW692ExperienceProfile({ mode: 'explore', quality: 'cinematic', touch: true, viewportWidth: 390, viewportHeight: 844, deviceMemory: 4, hardwareConcurrency: 4, reducedMotion: true });
  add('experience-profiles-valid', validateEonCityW692ExperienceProfile(focus).ok && validateEonCityW692ExperienceProfile(mobile).ok, 'Focus, Explore, mobile and reduced-motion profiles validate');
  add('mode-parity', focus.focusModeKeepsFastTravel && mobile.exploreModeKeepsDirectActions && !focus.essentialFeatureRequiresExploration, 'essential work remains available in both modes');
  const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  add('runtime-integration', /buildEonCityW691MyRealmPlan/.test(runtime) && /resolveEonCityW692ExperienceProfile/.test(runtime) && /oneCanonicalScene/.test(runtime), 'one-scene Living Nexus runtime consumes W691/W692');
  const css = read('assets/css/eon-city-play.css');
  add('accessibility-css', /min-block-size:\s*48px/.test(css) && /focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && /orientation:\s*portrait/.test(css), 'touch, focus, reduced-motion and portrait CSS are present');
  return Object.freeze({ schema: 'eon.city.w691-w692.gate.2026-07-25.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW691W692FinalProductIntegration();
for (const check of report.checks) console.log(`[W691-W692] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W691-W692] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
