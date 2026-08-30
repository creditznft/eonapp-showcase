import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyW228CeoRedTeam } from '../../scripts/w228-ceo-red-team.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W228 CEO red-team gate rejects legacy token/ad deploy prerequisites and keeps canonical sharing approval-first', () => {
  const result = verifyW228CeoRedTeam(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('W228 isolates unsafe legacy campaign and social publisher pages from production build inputs', () => {
  const vite = fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf8');
  const contract = fs.readFileSync(path.join(root, 'config/route-contract.mjs'), 'utf8');
  assert.match(vite, /EXPLICIT_HTML_ENTRY_FILES/);
  assert.match(vite, /buildInputs\(\)/);
  assert.match(vite, /RETIRED_ENTRY_DIRECTORIES/);
  assert.match(vite, /isRetiredEntryDirectory|RETIRED_ENTRY_DIRECTORIES\.has\(entry\)/);
  assert.match(contract, /\/creator-studio\.html/);
  assert.match(contract, /\/campaign-admin\.html/);
  assert.match(contract, /\/eon-browser\.html/);
  assert.match(contract, /\/blog\/\*/);
  assert.match(contract, /\/telegram\/\*/);
});

test('W228 keeps approval scheduling as a local review queue rather than auto-posting or account connection', () => {
  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  const scheduler = fs.readFileSync(path.join(root, 'assets/js/utils/user-approved-social-scheduler.js'), 'utf8');
  assert.match(workspace, /createApprovalSchedule/);
  assert.match(workspace, /data-workspace-campaign-schedule/);
  assert.match(scheduler, /User approval required before opening composer\. No automatic posting\./);
  const scheduleStart = workspace.indexOf("data-workspace-campaign-schedule");
  const scheduleEnd = workspace.indexOf("data-workspace-campaign-clear", scheduleStart);
  const scheduleSegment = workspace.slice(scheduleStart, scheduleEnd > scheduleStart ? scheduleEnd : undefined);
  assert.doesNotMatch(scheduleSegment, /fetch\s*\(|XMLHttpRequest|webhook|access[_-]?token/i);
  assert.doesNotMatch(scheduler, /fetch\s*\(|XMLHttpRequest|webhook|access[_-]?token/i);
});

test('W228 removes commercial Cloudflare handlers and keeps canonical referral links browser-local only', () => {
  const forbidden = ['functions/api/rewards', 'functions/api/nowpayments', 'functions/api/evm', 'functions/api/referrals', 'functions/api/ad-rewards', 'functions/api/social', 'functions/api/telegram'];
  for (const relative of forbidden) assert.equal(fs.existsSync(path.join(root, relative)), false, relative);
  const referral = fs.readFileSync(path.join(root, 'assets/js/utils/referral-par.js'), 'utf8');
  assert.doesNotMatch(referral, /captureReferralCloud|\/api\/referrals/);
});
