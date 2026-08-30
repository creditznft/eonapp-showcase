#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { W274_CITY_SCRIPTED_GUIDE_CONTRACT as CONTRACT } from '../config/w274-city-scripted-guide-contract.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const guide = read('assets/js/city/city-scripted-guide.js');
const station = read('assets/js/eon-city-play-station.js');
const css = read('assets/css/eon-city-play.css');
const plan = read('docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
const packageJson = JSON.parse(read('package.json'));
const bindStart = station.indexOf('function bindScriptedCityGuide');
const bindEnd = station.indexOf('function createPreviewEvidenceController', bindStart);
const bindGuide = bindStart >= 0 && bindEnd > bindStart ? station.slice(bindStart, bindEnd) : '';

const checks = {
  registryOnly: /import \{ getCityLandmark \} from '\.\/city-landmark-registry\.js';/.test(guide)
    && /const landmark = getCityLandmark\(landmarkId\)/.test(guide),
  schemaAndFiniteCard: guide.includes(`CITY_SCRIPTED_GUIDE_SCHEMA = '${CONTRACT.guideSchema}'`)
    && /kind: 'scripted-local-orientation'/.test(guide)
    && /return Object\.freeze\(/.test(guide),
  explicitBoundary: CONTRACT.requiredBoundaryMarkers.every((marker) => guide.includes(marker)),
  localNoStorageOrPrivateReads: !/localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.credentials|vault/i.test(guide.replace('Vault', '')),
  noRemoteTransport: CONTRACT.forbiddenRemotePatterns.every((pattern) => !`${guide}\n${bindGuide}`.includes(pattern)),
  noAutomaticAction: CONTRACT.forbiddenAutoActionPatterns.every((pattern) => !`${guide}\n${bindGuide}`.includes(pattern)),
  stationInformationalOnly: CONTRACT.requiredStationMarkers.every((marker) => station.includes(marker))
    && /getCityScriptedGuideCard\(nearby\?\.id\)/.test(bindGuide)
    && /panel\.hidden = false/.test(bindGuide)
    && /close\.focus\(/.test(bindGuide),
  accessiblePresentation: /eon-play-guide-panel/.test(css)
    && /eon-play-guide-card/.test(css)
    && /eon-play-guide-card button:focus-visible/.test(css)
    && /@media \(max-width:760px\)/.test(css),
  noGoPreserved: /EONAPP is \*\*NO-GO for public launch\*\*/.test(plan)
    && /W274 \| NPC social\/presence \| \*\*W274-A0 source baseline complete/.test(plan),
  packageScript: Boolean(packageJson.scripts?.['qa:w274-city-scripted-guide'])
};
const ok = Object.values(checks).every(Boolean);
const stats = {
  schema: 'eonapp.w274.city-scripted-guide-source-gate.v1',
  wave: CONTRACT.wave,
  scope: CONTRACT.scope,
  ok,
  score: ok ? 100 : 0,
  checks,
  claimFence: CONTRACT.claimFence,
  releaseDependency: 'W260 remains NO-GO; W274 is not a moderation, NPC, social or launch proof.'
};
const artifactDir = path.join(root, 'artifacts', 'w274-city-scripted-guide-source-gate');
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W274 City scripted guide source gate passed: finite local guide boundary, score ${stats.score}`);
