#!/usr/bin/env node
/** W457.1 static gate: City device/share evidence remains a local manual packet. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCityMobileShareProofPacket, getCityMobileShareProofTruth, validateCityMobileShareProofPacket } from '../assets/js/city/eon-city-mobile-share-proof.js';
import { W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT, validateW457ACityMobileShareProofContract } from '../config/w457a-city-mobile-share-proof-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW457ACityMobileShareProof() {
  const errors = [
    ...validateW457ACityMobileShareProofContract(),
    ...validateCityMobileShareProofPacket().errors
  ];
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    if (!value) errors.push(`${id}: ${detail}`);
  };
  const contract = W457A_CITY_MOBILE_SHARE_PROOF_CONTRACT;
  const packet = createCityMobileShareProofPacket();
  const truth = getCityMobileShareProofTruth();
  const source = read('assets/js/city/eon-city-mobile-share-proof.js');
  const station = read('assets/js/eon-city-play-station.js');
  const docs = read('EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md');

  check('required-files', contract.requiredFiles.every((relative) => fs.existsSync(path.join(root, relative))), 'W457.1 source, City station, existing local share surfaces and test file exist');
  check('manual-pending-packet', packet.status === 'manual-evidence-pending' && packet.sourceOnly === true, 'the export begins pending and never carries a device verdict');
  check('device-matrix-complete', packet.deviceCases.map((entry) => entry.id).join('|') === contract.deviceCaseIds.join('|'), 'Android, iOS and keyboard/controller recovery cases are explicit');
  check('share-matrix-complete', packet.sharePrivacyCases.map((entry) => entry.id).join('|') === contract.sharePrivacyCaseIds.join('|'), 'manual view, redaction, native-share cancel and destination review are explicit');
  check('cinematic-views-reused', packet.cinematicViews.length >= contract.minimumCinematicViews && packet.cinematicViews.every((view) => view.localOnly && view.opensRoute && view.capturesMedia && view.uploadsMedia && view.manualCaptureOnly), 'W457.1 uses existing bounded local City review views rather than inventing an exporter or capture system');
  check('station-export-is-explicit', /data-eon-play-validation-export-mobile-share-proof/.test(station) && /buildCityMobileShareProofExport/.test(station), 'City Validation Lab exposes a person-triggered packet export');
  check('no-probes-or-transport', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.(?:share|clipboard)|captureStream|getDisplayMedia|\.toDataURL\s*\(|localStorage|sessionStorage|document\.cookie/i.test(source), 'W457.1 does not inspect or transmit a device, media, clipboard or share result');
  check('truth-fail-closed', Object.entries(contract.truth).every(([key, expected]) => truth[key] === expected), 'source truth retains no automatic proof, post, tracking, device certification or release approval');
  check('plan-retains-real-device-boundary', /Verify portrait Companion, landscape Explore, rotation, touch, safe areas/i.test(docs) && /Inspect copied text and native share output for private data leakage/i.test(docs), 'launch plan retains real Android/iOS and share-output proof outside source certification');

  return Object.freeze({
    schema: 'eonapp.w457.1.city-mobile-share-proof-gate.v1',
    wave: 'W457.1',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    cinematicViewCount: packet.cinematicViews.length,
    errors: Object.freeze(errors),
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This source pass does not test Android, iOS, Safari, rotation, touch, safe areas, controller, fullscreen or thermal behavior.',
      'It does not inspect copied text, open native share, read a cancellation result, capture media, upload evidence, verify a post or certify privacy/release quality.',
      'Codex or a human tester must run the exported packet against real devices after deployment and attach independent evidence.'
    ])
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW457ACityMobileShareProof();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  const directory = path.join(root, 'artifacts', 'w457a-city-mobile-share-proof-gate');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`W457.1 City mobile/share proof source gate passed (${report.checkCount}/${report.checkCount}; ${report.cinematicViewCount} local review views).\n`);
}
