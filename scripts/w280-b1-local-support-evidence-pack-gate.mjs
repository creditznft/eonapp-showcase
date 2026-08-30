#!/usr/bin/env node
/** W280-B1 — local, redacted, manual-only support evidence pack source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W280_B1_LOCAL_SUPPORT_EVIDENCE_PACK_CONTRACT as CONTRACT, validateW280B1LocalSupportEvidencePackContract } from '../config/w280-b1-local-support-evidence-pack-contract.mjs';
import { SUPPORT_TOPICS } from '../assets/js/utils/support-tools-footer-proof.js';
import { createSupportEvidencePack, isSupportEvidencePackReadyForManualShare } from '../assets/js/utils/support-evidence-pack.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function runW280B1LocalSupportEvidencePackGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  errors.push(...validateW280B1LocalSupportEvidencePackContract().errors);
  const supportHtml = read(root, 'help.html');
  const supportPage = read(root, 'assets/js/support-page.js');
  const utility = read(root, 'assets/js/utils/support-evidence-pack.js');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const fakeApiKey = ['sk', 'abcdefghijklmnopqrstuvwxyz123456'].join('-');
  const inspected = `${utility}\n${supportPage}`;

  assert(CONTRACT.requiredHtmlMarkers.every((marker) => supportHtml.includes(marker)), 'W280-B1 support page is missing a required local-evidence control.');
  assert(/support-evidence-pack\.js/.test(supportPage), 'W280-B1 support page must use the dedicated pure evidence-pack utility.');
  assert(/manualReviewRequired/.test(utility) && /confirmedByUser/.test(utility), 'W280-B1 must require an explicit manual review acknowledgement.');
  assert(/storedByEonapp:\s*false/.test(utility) && /transmittedByEonapp:\s*false/.test(utility), 'W280-B1 pack must state no storage and no transmission by EONAPP.');
  assert(/normalizeSupportRoute/.test(utility) && /split\(\/\[\?\#\]\//.test(utility), 'W280-B1 must strip query and fragment context from exported routes.');
  assert(/redactSupportEvidence/.test(utility) && /\[redacted/.test(utility), 'W280-B1 must locally redact common secret-like values.');
  assert(CONTRACT.forbiddenTransport.every((term) => !utility.includes(term)), 'W280-B1 utility must not include remote transport.');
  assert(CONTRACT.forbiddenPersistence.every((term) => !utility.includes(term)), 'W280-B1 utility must not include persistent browser storage.');
  assert(!/navigator\.userAgent[^\n]{0,300}report/i.test(utility), 'W280-B1 must not export raw user-agent text.');
  assert(!/support ticket|human response/i.test(utility.toLowerCase().replace(/not a ticket|not sent|not a support ticket/g, '')), 'W280-B1 utility must not promise a support operation.');
  assert(packageJson.scripts?.['qa:w280-b1-local-support-evidence-pack'], 'package.json is missing the W280-B1 QA script.');
  assert(/W280-B1/.test(plan) && /manual support evidence pack/i.test(plan), 'Canonical plan must record W280-B1 as a source-only manual support evidence pack.');

  const allowedTopicIds = SUPPORT_TOPICS.map((topic) => topic.id);
  const preview = createSupportEvidencePack({
    topicId: 'bug-security',
    allowedTopicIds,
    routePath: '/help?secret=do-not-export#fragment',
    deviceClass: 'desktop',
    browserClass: 'chromium',
    expected: 'No error.',
    actual: `api_key=${fakeApiKey} https://private.example/path`,
    reviewed: false,
    capturedAt: '2026-06-25T00:00:00.000Z'
  });
  assert(preview.status === 'preview-only' && !isSupportEvidencePackReadyForManualShare(preview), 'W280-B1 preview must remain blocked until user review is confirmed.');
  assert(preview.context.routePath === '/help', 'W280-B1 must drop query and fragment context.');
  assert(!JSON.stringify(preview).includes(fakeApiKey), 'W280-B1 must not retain secret-like input.');
  assert(!JSON.stringify(preview).includes('private.example'), 'W280-B1 must not retain raw URLs.');
  const reviewed = createSupportEvidencePack({ ...preview, allowedTopicIds, reviewed: true, capturedAt: '2026-06-25T00:00:00.000Z' });
  assert(isSupportEvidencePackReadyForManualShare(reviewed), 'W280-B1 must allow manual export only after explicit review acknowledgement.');

  const report = {
    schema: 'eonapp.w280-b1.local-support-evidence-pack-gate-report.v1',
    wave: CONTRACT.wave,
    ok: errors.length === 0,
    interpretation: 'PASS proves only a local review-first support pack with no built-in transport or persistence. It is not a staffed support channel, security disclosure process, accessibility result, device result, legal review, deployment, or launch approval.',
    errors
  };
  const artifactDir = path.join(root, 'artifacts', 'w280-b1-local-support-evidence-pack-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW280B1LocalSupportEvidencePackGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
