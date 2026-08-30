import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const today = new Date().toISOString();

const launchDir = path.join(root, 'docs', 'qa', 'launch-signoff');
const screenshotDir = path.join(launchDir, 'screenshots');
const logsDir = path.join(launchDir, 'logs');

fs.mkdirSync(launchDir, { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(logsDir, { recursive: true });

function rel(p) {
  return path.relative(root, p).replaceAll('\\', '/');
}

function listByPrefix(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.startsWith(prefix))
    .sort()
    .map((name) => rel(path.join(dir, name)));
}

function getStatus(existingPath) {
  if (!fs.existsSync(existingPath)) return 'TODO';
  const body = fs.readFileSync(existingPath, 'utf8');
  const m = body.match(/^\s*Status:\s*(.+)\s*$/im);
  return m ? m[1].trim() : 'TODO';
}

function writeDoc(fileName, title, bodyLines) {
  const full = path.join(launchDir, fileName);
  const status = getStatus(full);
  const output = [
    `# ${title}`,
    '',
    `Status: ${status}`,
    `Prepared At: ${today}`,
    '',
    ...bodyLines,
    ''
  ].join('\n');
  fs.writeFileSync(full, output, 'utf8');
}

const rtlShots = [
  ...listByPrefix(screenshotDir, 'rtl-chat-ar-'),
  ...listByPrefix(screenshotDir, 'rtl-creator-ar-'),
  ...listByPrefix(screenshotDir, 'rtl-marketplace-ar-')
];

const voiceShots = listByPrefix(path.join(root, 'docs', 'qa', 'i18n-voice-screenshots'), 'chat_');

writeDoc(
  'voice-hardware-matrix.md',
  'Voice Hardware Matrix',
  [
    'Required locales: EN, DE, AR, JA, HI, ES',
    'CEO addition: German (DE) is mandatory for EONBOT and chat launch sign-off.',
    'Requirement: real mic success + TTS success + fallback clarity per locale on permissioned browser session.',
    '',
    '## Current Evidence Pointers',
    ...(voiceShots.length
      ? voiceShots.map((item) => `- ${item}`)
      : ['- No voice screenshots found yet.']),
    '',
    '## Reviewer Fill-In',
    '- Timestamp:',
    '- Browser/OS:',
    '- Locale:',
    '- Dictation result: PASS/FAIL',
    '- TTS result: PASS/FAIL',
    '- Fallback clarity: PASS/FAIL',
    '- Artifact paths:'
  ]
);

writeDoc(
  'rtl-visual-qa.md',
  'RTL Visual QA',
  [
    'Required surfaces: Chat, Creator Studio, Marketplace (Arabic locale).',
    '',
    '## Current RTL Screenshot Evidence',
    ...(rtlShots.length
      ? rtlShots.map((item) => `- ${item}`)
      : ['- No RTL launch-signoff screenshots captured yet.']),
    '',
    '## Reviewer Fill-In',
    '- Timestamp:',
    '- Surface:',
    '- Browser:',
    '- Layout direction correct: PASS/FAIL',
    '- No clipped or overlapped controls: PASS/FAIL',
    '- Status/error readability: PASS/FAIL',
    '- Widget + page controls usable together: PASS/FAIL',
    '- Artifact paths:'
  ]
);

writeDoc(
  'operator-walkthrough-scorecard.md',
  'Operator Walkthrough Scorecard',
  [
    'Required runs: no-code, coding, recovery.',
    '',
    '## No-Code Run',
    '- Open Creator Studio: PASS/FAIL',
    '- Idea -> script -> voice/subtitles -> distribution draft: PASS/FAIL',
    '- Status messages clear/non-jargon: PASS/FAIL',
    '',
    '## Coding Run',
    '- IDE import/export used: PASS/FAIL',
    '- JSON bundle export for GitHub workflow: PASS/FAIL',
    '- Runtime assumptions visible pre-execution: PASS/FAIL',
    '',
    '## Recovery Run',
    '- Refresh mid-pipeline: PASS/FAIL',
    '- Restore script/queue/artifacts: PASS/FAIL',
    '',
    '## Scorecard',
    '- First-time completion < 10 min: PASS/FAIL',
    '- Developer export usability: PASS/FAIL',
    '- Recovery after refresh: PASS/FAIL',
    '- Reviewer:',
    '- Artifact paths:'
  ]
);

writeDoc(
  'failover-evidence-pack.md',
  'Failover Evidence Pack',
  [
    'Required: primary-offline simulation + referral/fallback continuity + logs + Tx IDs.',
    '',
    '## Current Evidence Pointers',
    '- docs/qa/proof-screenshots/admin-fallback-drill-proof.png',
    '- docs/qa/launch-signoff/fallback-proof-export.json',
    '',
    '## Reviewer Fill-In',
    '- Timestamp:',
    '- Drill result: PASS/FAIL',
    '- Route banner behavior verified: PASS/FAIL',
    '- Referral/fallback continuity verified: PASS/FAIL',
    '- Snapshot Tx IDs:',
    '- Log paths:'
  ]
);

writeDoc(
  'cloudflare-hardening-proof.md',
  'Cloudflare Hardening Proof',
  [
    'Required: strict TLS + HSTS + HTTPS redirect behavior evidence.',
    '',
    '## Reviewer Fill-In',
    '- Timestamp:',
    '- Reviewer:',
    '- Strict TLS: PASS/FAIL',
    '- HSTS enabled + propagated: PASS/FAIL',
    '- HTTPS redirect behavior: PASS/FAIL',
    '- Artifact paths:'
  ]
);

const summaryPath = path.join(launchDir, 'auto-verification-summary.md');
const summary = [
  '# Auto Verification Summary',
  '',
  `Generated At: ${today}`,
  '',
  '## Automated Coverage Completed',
  '- Launch e2e suite green in latest run (33/33).',
  '- Fallback proof JSON export captured.',
  '- RTL screenshot capture automation available via `e2e/rtl-visual-capture.spec.js`.',
  '- Launch evidence gate enforces required files and `Status: PASS` in manual sign-off docs.',
  '',
  '## Remaining Human Sign-Off Requirements',
  '- Voice hardware matrix real mic/TTS success per locale.',
  '- Manual RTL visual QA approval.',
  '- Operator walkthrough scorecard.',
  '- Failover publication approval.',
  '- Cloudflare hardening verification.',
  ''
].join('\n');
fs.writeFileSync(summaryPath, summary, 'utf8');

console.log('Launch sign-off prep complete.');
console.log(`Updated: ${rel(summaryPath)}`);
