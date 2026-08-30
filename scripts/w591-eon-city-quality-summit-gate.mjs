#!/usr/bin/env node
/** W591 source gate — Command Horizon Quality Summit and access seal. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const checks = [];
const check = (id, condition, message) => checks.push({ id, ok: Boolean(condition), message });

const station = read('assets/js/eon-city-play-station.js');
const summit = read('assets/js/city/eon-city-quality-summit.js');
const styles = read('assets/css/eon-city-play.css');
const canonical = read('eoncity.html');
const legacyPlay = read('eoncity-play.html');
const redirects = read('public/_redirects');

check('canonical-access-station', canonical.includes('/assets/js/city/eon-city-access-station.js') && !canonical.includes('/assets/js/eon-city-play-station.js'), 'Canonical City must load through the access station, not the heavy renderer.');
check('legacy-carrier-marked', legacyPlay.includes('data-eon-city-legacy-play-document'), 'The compatibility play document must identify itself as a legacy carrier.');
check('legacy-carrier-blocked-before-renderer', station.includes('data-eon-city-legacy-play-document') && station.includes('globalThis.location.replace') && station.includes('blockedLegacyDocument: true'), 'Legacy play documents must be blocked or redirected before Babylon import.');
check('legacy-redirects', ['/eoncity/play /eoncity 301', '/eoncity-play /eoncity 301', '/eoncity-play.html /eoncity 301'].every((line) => redirects.includes(line)), 'All immersive compatibility routes must redirect to canonical City.');
check('summit-module-imported', station.includes("./city/eon-city-quality-summit.js") && station.includes('bindEonCityQualitySummit'), 'City station must bind the W591 quality layer.');
check('direct-hud-compressed', station.includes('data-eon-play-open-start-here>Start here') && station.includes('data-eon-play-open-eonbot>EONBOT') && station.includes('data-eon-play-open-command-deck>Command Deck') && station.includes('data-eon-play-open-controls>Menu') && !station.includes('data-eon-play-open-universe>Universe</button><button type="button" data-eon-play-open-controls>Menu'), 'Direct HUD must retain four clear primary actions instead of equal-weight feature buttons.');
check('arrival-compass', station.includes('data-eon-play-arrival-compass') && station.includes('data-eon-play-compass-guide') && summit.includes("landmarkId: 'command-centre'"), 'Direct City needs a local Command Deck arrival compass.');
check('overlay-singleton', summit.includes('modalStackingAllowed: false') && summit.includes("[role=\"dialog\"]") && summit.includes('panel.hidden = true'), 'Visible City dialog panels must be coordinated locally, including first-run and resume overlays.');
check('source-boundary', summit.includes('does not fetch, authenticate, route, open') && summit.includes('automaticProductionApproval: false'), 'Quality layer must preserve City privacy and release boundaries.');
check('polish-css', styles.includes('.eon-play-arrival-compass') && styles.includes('.eon-city-overlay-open .eon-play-arrival-compass'), 'Quality summit presentation styles are missing.');

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({ schema: 'eon.city.quality-summit.gate.w591.v1', ok: failed.length === 0, checks }, null, 2));
if (failed.length) process.exitCode = 1;
