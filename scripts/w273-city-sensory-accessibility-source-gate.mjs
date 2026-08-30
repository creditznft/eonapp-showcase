#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { W273_CITY_SENSORY_ACCESSIBILITY_CONTRACT as CONTRACT } from '../config/w273-city-sensory-accessibility-contract.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const preferences = read('assets/js/city/city-sensory-preferences.js');
const station = read('assets/js/eon-city-play-station.js');
const css = read('assets/css/eon-city-play.css');
const page = read('eoncity-play.html');
const plan = read('docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
const packageJson = JSON.parse(read('package.json'));
const source = `${preferences}\n${station}`;

const checks = {
  explicitDefaultOff: /CITY_SENSORY_DEFAULTS = Object\.freeze\(\{ sound: false, haptics: false \}\)/.test(preferences),
  localPreferenceBoundary: preferences.includes(CONTRACT.preferenceKey)
    && /local, default-off/.test(preferences)
    && /remote transport|telemetry/.test(preferences),
  explicitActionFeedbackOnly: /Calls optional procedural feedback only from an explicit local action/.test(preferences)
    && /acknowledgeSensoryAction\('confirm'\)/.test(station)
    && /acknowledgeSensoryAction\('pause'\)/.test(station)
    && /acknowledgeSensoryAction\('resume'\)/.test(station),
  visualAlternativeAndControls: CONTRACT.requiredStationMarkers.every((marker) => station.includes(marker)),
  noMediaAutoplayOrMicrophone: !/<audio\b|autoplay|mediaDevices|getUserMedia/i.test(`${page}\n${station}\n${preferences}`),
  noRemoteTransport: CONTRACT.forbiddenRemotePatterns.every((pattern) => !source.includes(pattern)),
  accessibleControls: /eon-play-sensory/.test(css)
    && /focus-visible/.test(css)
    && /prefers-reduced-motion:reduce/.test(css),
  noGoPreserved: /EONAPP is \*\*NO-GO for public launch\*\*/.test(plan),
  packageScript: Boolean(packageJson.scripts?.['qa:w273-city-sensory-accessibility'])
};
const ok = Object.values(checks).every(Boolean);
const stats = {
  schema: 'eonapp.w273.city-sensory-accessibility-source-gate.v1',
  wave: CONTRACT.wave,
  scope: CONTRACT.scope,
  ok,
  score: ok ? 100 : 0,
  checks,
  claimFence: CONTRACT.claimFence,
  releaseDependency: 'W260 remains NO-GO'
};
const artifactDir = path.join(root, 'artifacts', 'w273-city-sensory-accessibility-source-gate');
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W273 City sensory accessibility source gate passed: default-off optional cues, score ${stats.score}`);
