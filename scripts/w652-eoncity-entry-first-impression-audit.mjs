#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getEonCityEntryExperience, validateEonCityEntryExperience } from '../assets/js/city/eon-city-entry-experience.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const criteria = [];
const check = (id, weight, condition, evidence) => criteria.push(Object.freeze({ id, weight, passed: Boolean(condition), evidence }));

export function inspectW652EntryFirstImpression() {
  criteria.length = 0;
  const experience = getEonCityEntryExperience();
  const validation = validateEonCityEntryExperience(experience);
  const access = read('assets/js/city/eon-city-access-station.js');
  const entry = read('assets/js/city/eon-city-entry-experience.js');
  const html = read('eoncity.html');
  const css = read('assets/css/eon-city-play.css');

  check('product-promise', 12, experience.promise.title === 'Your work becomes a place.', experience.promise.title);
  check('value-detail', 8, /private 3D workspace/.test(experience.promise.detail) && /EONBOT/.test(experience.promise.detail), experience.promise.detail);
  check('four-value-pillars', 12, validation.ok && experience.highlights.length === 4, experience.highlights.map((item) => item.id));
  check('command-room-first', 6, experience.highlights[0]?.id === 'command-room', experience.highlights[0]?.label);
  check('productivity-entertainment-balance', 8, experience.highlights.some((item) => item.id === 'explore') && experience.highlights.some((item) => item.id === 'living-districts'), 'work + explore');
  check('authenticated-only-boundary', 12, experience.promise.authenticatedOnly === true && experience.promise.public3dPreview === false, 'authenticated-only');
  const authorizedBootBlock = access.indexOf("if (view.kind === 'boot')");
  const corePreloader = access.indexOf('const preloadCore = () =>', authorizedBootBlock);
  const automaticEntry = access.indexOf('const automaticEntry = enter()', corePreloader);
  const coreImportCount = (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
  const guestImportBoundary = authorizedBootBlock >= 0
    && corePreloader > authorizedBootBlock
    && automaticEntry > corePreloader
    && coreImportCount === 1
    && !access.includes('eon-city-runtime-owner.js');
  check('zero-heavy-guest-import', 12, experience.importsHeavyRuntime === false && guestImportBoundary, 'automatic Babylon preparation exists only inside the authorized boot block; signed-out entry imports no core or legacy City owner');
  check('identity-cta', 6, /Continue with Google/.test(access) && /Back to EONBOT/.test(access), 'Google CTA + recovery route');
  check('identity-cta-route-lock', 4, /normalizeEonCityLoginRoute/.test(access) && /candidate === EON_CITY_GOOGLE_LOGIN_ROUTE/.test(access), 'payload cannot replace reviewed same-origin auth route');
  check('trust-strip', 8, experience.trustPoints.length === 3 && experience.trustPoints.some((item) => item.id === 'review-first'), experience.trustPoints.map((item) => item.id));
  check('private-data-boundary', 6, experience.readsPrivateWork === false && experience.startsProvider === false && experience.startsAudio === false, 'no private work/provider/audio');
  check('static-entry-document', 4, /eon-city-access-station\.js/.test(html) && !/babylon|w649\/.*\.glb/i.test(html), 'lightweight access station only');
  check('responsive-access-art', 4, /eon-city-access-world/.test(css) && /eon-city-access-awaits/.test(css) && /@media/.test(css), 'CSS-only responsive entry art');
  check('no-technical-user-labels', 2, !/AUTHENTICATED ENTRY|W649|W650|W651/.test(`${experience.promise.kicker} ${experience.promise.title} ${experience.promise.detail}`), 'product language');

  const earned = criteria.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const possible = criteria.reduce((sum, item) => sum + item.weight, 0);
  const localScore = Math.round((earned / possible) * 1000) / 10;
  const failures = criteria.filter((item) => !item.passed).map((item) => item.id);
  const report = Object.freeze({
    schema: 'eonapp.w652.entry-first-impression-audit.v1',
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    localCriteriaScore: localScore,
    executivePrevisualScore: failures.length ? Math.min(94, localScore) : 96,
    visualScoreReserved: 4,
    decision: 'Lead with the product promise, keep the guest route static, and make Command Room the first named benefit.',
    criteria: Object.freeze([...criteria]),
    failures: Object.freeze(failures)
  });
  return report;
}

const report = inspectW652EntryFirstImpression();
const output = path.join(root, 'reports', 'w652', 'W652_ENTRY_FIRST_IMPRESSION_AUDIT_2026-07-14.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, report: path.relative(root, output), localCriteriaScore: report.localCriteriaScore, executivePrevisualScore: report.executivePrevisualScore }, null, 2));
