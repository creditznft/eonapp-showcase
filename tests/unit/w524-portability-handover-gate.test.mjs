import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  inspectW524PortabilityHandover,
  W524_BASE_COMMIT,
  W524_CURRENT_ENTRYPOINT,
  W524_ENTRYPOINT,
  W524_HISTORY_MARKER
} from '../../scripts/w524-portability-handover-gate.mjs';
import { renderCloudflareRedirects } from '../../config/route-contract.mjs';

function createFixtureRoot({
  gitattributes = ['_redirects text eol=lf', 'public/_redirects text eol=lf'],
  redirects = renderCloudflareRedirects(),
  currentEntrypoint = [
    '# Current',
    '',
    'This is the single top-level coding and verification entrypoint for the current EONAPP source.',
    `W524 portability provenance begins at ${W524_BASE_COMMIT}.`
  ].join('\n'),
  historicalEntrypoint = [
    '# Historical W524',
    '',
    '> **Historical only.**',
    `Use \`${W524_CURRENT_ENTRYPOINT}\` for current instructions.`,
    `Original base: ${W524_BASE_COMMIT}.`
  ].join('\n'),
  rootReadme = `Read \`${W524_CURRENT_ENTRYPOINT}\` first.`,
  extraFiles = {}
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'w524-portability-'));
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  fs.writeFileSync(path.join(root, '.gitattributes'), `${gitattributes.join('\n')}\n`);
  fs.writeFileSync(path.join(root, '_redirects'), redirects);
  fs.writeFileSync(path.join(root, 'public', '_redirects'), redirects);
  fs.writeFileSync(path.join(root, W524_CURRENT_ENTRYPOINT), currentEntrypoint);
  fs.writeFileSync(path.join(root, W524_ENTRYPOINT), historicalEntrypoint);
  fs.writeFileSync(path.join(root, 'README.md'), rootReadme);
  for (const [relative, content] of Object.entries(extraFiles)) {
    fs.mkdirSync(path.join(root, path.dirname(relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), content);
  }
  return root;
}

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W524 portability handover gate keeps one current entrypoint, historical provenance and LF redirect mirrors', () => {
  const report = inspectW524PortabilityHandover();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.currentEntrypoint, W524_CURRENT_ENTRYPOINT);
  assert.equal(report.historicalEntrypoint, W524_ENTRYPOINT);
  assert.deepEqual(report.checkedRedirectMirrors, ['_redirects', 'public/_redirects']);
});

test('W524 portability handover gate rejects CRLF redirect mirrors', () => {
  const root = createFixtureRoot({
    redirects: renderCloudflareRedirects().replace(/\n/g, '\r\n'),
    extraFiles: {
      'START_HERE_OLD.md': `This file is ${W524_HISTORY_MARKER}.\nUse \`${W524_ENTRYPOINT}\`.`
    }
  });
  const report = inspectW524PortabilityHandover({ root });
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes('redirect-mirror-crlf:_redirects'));
  assert.ok(report.issues.includes('redirect-mirror-crlf:public/_redirects'));
});

test('W524 portability handover gate rejects out-of-sync redirect mirrors and missing gitattributes rules', () => {
  const root = createFixtureRoot({
    gitattributes: ['_redirects text eol=lf'],
    redirects: `${renderCloudflareRedirects()}# drift\n`,
    extraFiles: {
      'START_HERE_OLD.md': `This file is ${W524_HISTORY_MARKER}.\nUse \`${W524_ENTRYPOINT}\`.`
    }
  });
  const report = inspectW524PortabilityHandover({ root });
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes('missing-gitattributes-rule:public/_redirects text eol=lf'));
  assert.ok(report.issues.includes('redirect-mirror-out-of-sync:_redirects'));
  assert.ok(report.issues.includes('redirect-mirror-out-of-sync:public/_redirects'));
});

test('W524 portability handover gate rejects unretired old and unexpected new root entrypoints', () => {
  const root = createFixtureRoot({
    extraFiles: {
      'START_HERE_OLD.md': 'Current-looking old start file',
      'NEXT_CHAT_SURPRISE.md': 'Another current-looking start file'
    }
  });
  const report = inspectW524PortabilityHandover({ root });
  assert.equal(report.ok, false);
  assert.ok(report.issues.includes('retired-entrypoint-missing-redirect:START_HERE_OLD.md'));
  assert.ok(report.issues.includes('retired-entrypoint-missing-retirement-marker:START_HERE_OLD.md'));
  assert.ok(report.issues.includes('retired-entrypoint-missing-redirect:NEXT_CHAT_SURPRISE.md'));
  assert.ok(report.issues.includes('retired-entrypoint-missing-retirement-marker:NEXT_CHAT_SURPRISE.md'));
});
