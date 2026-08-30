import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildLocalAiSetupGuide, findLocalAiSetupGoal, validateLocalAiSetupGuideContract } from '../../config/local-ai-setup-guide-contract.mjs';
import { canonicalUrl, getW477SeoDirectiveForFile, validateW477RouteSeoLegacyContract, W477_PRIMARY_PUBLIC_DESTINATIONS, W477_SEARCH_INDEX_ROUTES } from '../../config/w477-route-seo-legacy-contract.mjs';
import { inspectW477RouteSeoLegacy } from '../../scripts/w477-route-seo-legacy-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W477 keeps the public home and Research indexable while identity-gated City stays noindex', () => {
  assert.deepEqual(validateW477RouteSeoLegacyContract(), []);
  assert.deepEqual(W477_PRIMARY_PUBLIC_DESTINATIONS, ['/', '/insights']);
  assert.equal(canonicalUrl('/'), 'https://eonapp.ch/');
  assert.equal(canonicalUrl('/insights'), 'https://eonapp.ch/insights');
  assert.equal(getW477SeoDirectiveForFile('trade.html').robots, 'index, follow');
  assert.equal(getW477SeoDirectiveForFile('eoncity.html').robots, 'noindex, nofollow');
  assert.equal(getW477SeoDirectiveForFile('billing.html').robots, 'noindex, nofollow');
  assert.ok(W477_SEARCH_INDEX_ROUTES.some((entry) => entry.path === '/local-ai'));
});

test('W477 generated sitemap never emits legacy chat/trade redirects or disabled billing', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/eonapp\.ch\//);
  assert.doesNotMatch(sitemap, /https:\/\/eonapp\.ch\/eoncity/);
  assert.match(sitemap, /https:\/\/eonapp\.ch\/insights/);
  assert.doesNotMatch(sitemap, /https:\/\/eonapp\.ch\/chat(?:<|\/)/);
  assert.doesNotMatch(sitemap, /https:\/\/eonapp\.ch\/trade(?:<|\/)/);
  assert.doesNotMatch(sitemap, /https:\/\/eonapp\.ch\/billing(?:<|\/)/);
});

test('W477 route/SEO source gate stays pass while release evidence remains explicit', () => {
  const report = inspectW477RouteSeoLegacy();
  assert.equal(report.sourceStatus, 'pass', report.errors.join('\n'));
  assert.equal(report.releaseStatus, 'blocked-pending-reviewed-live-evidence');
  assert.ok(report.quarantineCandidates.length > 0);
  assert.ok(report.blockers.some((item) => /W476-B/i.test(item)));
});

test('EONBOT Local AI guide recommends only user-tapped official runtime paths', () => {
  assert.deepEqual(validateLocalAiSetupGuideContract(), []);
  assert.equal(findLocalAiSetupGoal('creator-planning').id, 'creator-planning');
  const desktop = buildLocalAiSetupGuide({ computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16, cpuCores: 8 }, { goalId: 'coding' });
  assert.equal(desktop.primaryRuntime?.id, 'lmstudio');
  assert.equal(desktop.suggestedProfileId, 'balanced-private-chat');
  assert.match(desktop.primaryRuntime.officialDownloadUrl, /^https:\/\//);
  assert.ok(desktop.facts.some((item) => /installation, model downloads and operating-system elevation remain visible user-approved actions/i.test(item)));
  assert.ok(desktop.facts.some((item) => /never silently switches.*cloud ai/i.test(item)));
  const mobile = buildLocalAiSetupGuide({ computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 8, cpuCores: 8 }, { goalId: 'private-chat' });
  assert.equal(mobile.primaryRuntime, null);
  assert.equal(mobile.suggestedProfileId, null);
  assert.equal(mobile.route, 'browser-local-lite-first');
  assert.equal(mobile.browserLite?.available, true);
});
