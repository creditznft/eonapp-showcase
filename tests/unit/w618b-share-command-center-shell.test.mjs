import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_COMPACT_PRIMARY_NAVIGATION,
  EONAPP_PRODUCT_HIERARCHY,
  renderEonShellNavigationMarkup,
  resolveEonShellPage
} from '../../assets/js/shell/eon-shell-navigation.js';
import { inspectW618bShareCommandCenterShellGate } from '../../scripts/w618b-share-command-center-shell-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W618B keeps legacy product hierarchy stable while adding compact launch navigation', () => {
  assert.deepEqual(EONAPP_PRODUCT_HIERARCHY.map((item) => item.id), ['chat', 'projects', 'library', 'forge', 'eoncity']);
  assert.deepEqual(EONAPP_COMPACT_PRIMARY_NAVIGATION.map((item) => item.id), ['chat', 'projects', 'studio', 'apps', 'eoncity']);
  assert.equal(resolveEonShellPage({ pathname: '/market' }), 'studio');
  assert.equal(resolveEonShellPage({ pathname: '/local-ai' }), 'apps');
  assert.equal(resolveEonShellPage({ pathname: '/vault' }), 'apps');
  assert.match(renderEonShellNavigationMarkup('apps'), /data-eon-shell-action="apps"[^>]*aria-current="page"/);
});

test('W618B installs a global top-right share command center without duplicating City or Chat share controls', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(shell, /installGlobalShareCommandCenter/);
  assert.match(shell, /data-eon-global-share/);
  assert.match(shell, /openEonShareSheet\(\{ type: getShareTypeForPage\(currentPage\) \}\)/);
  assert.match(shell, /currentPage === 'chat' \|\| currentPage === 'eoncity'/);
  assert.match(shell, /renderGlobalIdentityAction\(currentShellIdentity\)/);
});

test('W618B Share Center carries rewards honestly and keeps the AI cost boundary intact', () => {
  const share = read('assets/js/utils/eon-share-sheet.js');
  assert.match(share, /getEonReferralRewardMatrix/);
  assert.match(share, /Share the app\. Earn EON Keys later\./);
  assert.match(share, /Raw clicks do not grant rewards/);
  assert.match(share, /EON Keys never create cash, wallet, crypto, NFT, resale, payout, commission, or platform-paid AI credits/);
  assert.match(share, /EON_AI_COST_BOUNDARY\.statement/);
});

test('W618B compact shell CSS gives EON City and work pages more room', () => {
  const css = read('assets/css/eon-app-shell.css');
  assert.match(css, /--eon-app-rail-width: 14\.35rem/);
  assert.match(css, /\.eon-app-global-actions/);
  assert.match(css, /:not\(\[data-eon-shell-page="chat"\]\) \.eon-app-chat-history-wrap/);
  assert.match(css, /\.eon-share-rewards/);
});

test('W618B standalone gate passes', () => {
  const report = inspectW618bShareCommandCenterShellGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 18);
});
