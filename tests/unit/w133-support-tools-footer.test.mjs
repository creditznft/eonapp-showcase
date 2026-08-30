import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W133 utility defines support topics, tool workflows, and footer groups', async () => {
  const mod = await import(`../../assets/js/utils/support-tools-footer-proof.js?w133=${Date.now()}`);
  assert.equal(mod.W133_SUPPORT_TOOLS_FOOTER_SCHEMA, 'eonapp.w133.support-tools-footer.v1');
  assert.equal(mod.SUPPORT_TOPICS.length >= 6, true);
  assert.equal(mod.TOOL_WORKFLOWS.some((workflow) => workflow.action === 'support' && workflow.href === '/support.html'), true);
  assert.equal(mod.FOOTER_NAV_GROUPS.length >= 4, true);
  assert.equal(mod.buildSupportChatUrl('telegram-rewards'), '/chat.html?support=1&topic=telegram-rewards');
  assert.equal(mod.getToolRouteForAction('browser'), '/eon-browser.html');
  assert.match(mod.createSupportToolsFooterSummary().safeEvidenceRule, /Never request seed phrases/);
});

test('W133 support page exposes topic triage and public-proof-only safety copy', () => {
  const html = read('support.html');
  const js = read('assets/js/support-page.js');
  const css = read('assets/css/support.css');
  assert.match(html, /data-w133-support-center="support-tools-footer-cleanup"/);
  assert.match(html, /data-w133-support-proof="summary"/);
  assert.equal((html.match(/data-support-topic-card=/g) || []).length, 6);
  assert.match(html, /Never send secrets/);
  assert.match(html, /seed phrase/);
  assert.match(html, /private key/);
  assert.match(js, /SUPPORT_PREFILL_KEY/);
  assert.match(js, /buildSupportChatUrl/);
  assert.match(css, /support-topic-grid/);
});

test('W133 tools router has immediate fallbacks and support proof routes', () => {
  const html = read('tools.html');
  const deferred = read('assets/js/tools-page-deferred.js');
  const toolPage = read('assets/js/tool-page.js');
  assert.match(html, /data-w133-tools-router="support-tools-footer-cleanup"/);
  assert.match(html, /Tools & Support Router/);
  assert.equal((html.match(/data-fallback-href=/g) || []).length >= 4, true);
  assert.match(html, /data-w133-tools-support-strip="1"/);
  assert.match(deferred, /installImmediateToolFallbacks/);
  assert.match(deferred, /getToolRouteForAction/);
  assert.match(toolPage, /__EON_TOOLS_PAGE_ROUTER_READY__/);
});

test('W133 footer normalizer uses grouped product/help/community/legal links', () => {
  const siteShell = read('assets/js/utils/site-shell.js');
  const layout = read('assets/css/layout.css');
  const utility = read('assets/js/utils/support-tools-footer-proof.js');
  assert.match(siteShell, /FOOTER_NAV_GROUPS/);
  assert.match(siteShell, /footer-link-group/);
  assert.match(siteShell, /Footer product, help, community, and legal links/);
  assert.match(layout, /footer-link-group/);
  assert.match(layout, /footer-link-list/);
  assert.match(utility, /Telegram · @EonApps/);
  assert.match(utility, /X · @EonAppz/);
});

test('W133 quality gate stats report 100 score', () => {
  const statsPath = path.join(root, 'tmp', 'w133-support-tools-footer-stats.json');
  if (!fs.existsSync(statsPath)) {
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w133-support-tools-footer-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, 'eonapp.w133.support-tools-footer.v1');
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.supportTopicCount >= 6, true);
  assert.equal(stats.footerGroupCount >= 4, true);
});
