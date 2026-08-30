#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_ART_BIBLE, getEonCityArtBibleSummary, validateEonCityArtBible } from '../assets/js/city/eon-city-art-bible.js';
import { W624A_CITY_ART_BIBLE_CONTRACT, validateW624aCityArtBibleContract } from '../config/w624a-city-art-bible-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const checks = [];
const check = (id, ok, detail = '') => {
  checks.push({ id, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`);
};
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const contract = validateW624aCityArtBibleContract();
const bible = validateEonCityArtBible();
const summary = getEonCityArtBibleSummary();
const runtime = read('assets/js/city/eon-city-play-babylon.js');
const programme = read('program/EONAPP_W624A_CITY_ART_BIBLE_2026-07-11.md');
const scorecard = read('program/EONAPP_W624A_OWNER_VISUAL_APPROVAL_SCORECARD_2026-07-11.md');

check('contract-valid', contract.ok, contract.errors.join(', '));
check('art-bible-valid', bible.ok, bible.errors.join(', '));
check('required-files-exist', W624A_CITY_ART_BIBLE_CONTRACT.requiredFiles.every(exists), 'all W624A source, target, programme, gate and test files');
check('canonical-vision', /productive/i.test(EON_CITY_ART_BIBLE.vision) && /neo-noir/i.test(EON_CITY_ART_BIBLE.vision), EON_CITY_ART_BIBLE.vision);
check('six-pillars', summary.pillarCount === 6 && W624A_CITY_ART_BIBLE_CONTRACT.requiredPillars.every((id) => EON_CITY_ART_BIBLE.pillars.some((row) => row.id === id)), 'productive, authored, readable, warm, truthful, calm');
check('restrained-palette', EON_CITY_ART_BIBLE.palette.usage.neutralSurfaceMinimumPercent >= 72 && EON_CITY_ART_BIBLE.palette.usage.combinedAccentMaximumPercent <= 20 && EON_CITY_ART_BIBLE.palette.usage.simultaneousHeroAccentsMaximum <= 2, 'no neon-casino drift');
check('distinct-command-landmarks', summary.landmarkCount >= 6 && new Set(EON_CITY_ART_BIBLE.architecture.commandDistrictLandmarks.map((row) => row.silhouette)).size === summary.landmarkCount, 'unique silhouette language');
check('human-scale-contract', EON_CITY_ART_BIBLE.architecture.scale.playerHeightMeters === 1.76 && EON_CITY_ART_BIBLE.architecture.scale.standardDoorHeightMeters === 2.35, 'meter-based scale reference');
check('final-cast-defined', EON_CITY_ART_BIBLE.cast.player.id === 'wayfinder' && EON_CITY_ART_BIBLE.cast.eonbot.id === 'eonbot-orbit' && summary.npcCount >= 5, 'player, EONBOT and five productive NPCs');
check('productive-rpg-truth', EON_CITY_ART_BIBLE.productiveRpg.missionContract.mustPersist === true && EON_CITY_ART_BIBLE.productiveRpg.missionContract.fakeSuccessScreenAllowed === false && EON_CITY_ART_BIBLE.productiveRpg.progression.prohibited.includes('loot boxes'), 'real outcome required; fake economy rejected');
check('target-frames-valid', EON_CITY_ART_BIBLE.targetFrames.every((frame) => exists(frame.path.replace(/^\//, '')) && /<svg[\s>]/.test(read(frame.path.replace(/^\//, ''))) && /TARGET|target/i.test(read(frame.path.replace(/^\//, '')))), 'desktop, mobile and cast original SVG targets');
check('reject-list-strict', summary.rejectCount >= 14 && EON_CITY_ART_BIBLE.rejectList.some((item) => /generic neon boxes/i.test(item)) && EON_CITY_ART_BIBLE.rejectList.some((item) => /fake dashboards/i.test(item)), 'visual and product anti-patterns blocked');
check('scorecard-weights', summary.scoreWeight === 100 && EON_CITY_ART_BIBLE.scorecard.commandDistrictExpansionThreshold === 9 && EON_CITY_ART_BIBLE.scorecard.flagshipOwnerApprovalThreshold === 9.5, '9.0 vertical slice / 9.5 flagship');
check('runtime-authority-attached', /getEonCityArtBibleSummary/.test(runtime) && /artBible:\s*getEonCityArtBibleSummary\(\)/.test(runtime), 'Babylon scene metadata exposes canonical design target');
check('owner-approval-honest', summary.ownerVisualApproval === 'pending-target-frame-review' && /pending/i.test(scorecard) && /not.*flagship certification/i.test(scorecard), 'source complete but visual signoff pending');
check('programme-covers-budgets', /Visible triangles/.test(programme) && /Target frames/.test(programme) && /Reject list/.test(programme), 'art, cast, productive RPG, device budgets and acceptance');
check('no-final-art-overclaim', EON_CITY_ART_BIBLE.releaseBoundary.finalBinaryArt === false && EON_CITY_ART_BIBLE.releaseBoundary.finalCharacterRigs === false && EON_CITY_ART_BIBLE.releaseBoundary.finalDeviceCertification === false, 'W624A target only');

const report = {
  schema: 'eonapp.w624a-city-art-bible-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'passed',
  checks,
  summary,
  thresholds: EON_CITY_ART_BIBLE.scorecard,
  sourceComplete: failures.length === 0,
  ownerVisualApproval: 'pending-target-frame-review',
  runtimeScreenshotProof: false,
  finalVisualCertification: false,
  nextWave: 'W624B'
};
const reportDir = path.join(root, 'reports', 'w624a-city-art-bible');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`W624A gate failed (${failures.length}/${checks.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`W624A gate passed ${checks.length}/${checks.length}.`);
console.log(`Art bible: ${summary.pillarCount} pillars, ${summary.landmarkCount} Command landmarks, ${summary.npcCount} NPC roles, ${summary.targetFrameCount} targets.`);
console.log('Owner target-frame approval and fresh runtime/device proof remain pending; W624B may consolidate runtime without producing final assets.');
