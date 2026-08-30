import fs from 'node:fs';
import path from 'node:path';
import { FOOTER_NAV_GROUPS, SUPPORT_TOPICS, TOOL_WORKFLOWS, W133_SUPPORT_TOOLS_FOOTER_SCHEMA, createSupportToolsFooterSummary, flattenFooterLinks } from '../assets/js/utils/support-tools-footer-proof.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const supportHtml = read('support.html');
const toolsHtml = read('tools.html');
const supportJs = read('assets/js/support-page.js');
const proofJs = read('assets/js/utils/support-tools-footer-proof.js');
const siteShellJs = read('assets/js/utils/site-shell.js');
const toolsDeferredJs = read('assets/js/tools-page-deferred.js');
const toolPageJs = read('assets/js/tool-page.js');
const layoutCss = read('assets/css/layout.css');
const toolsCss = read('assets/css/tools.css');
const supportCss = read('assets/css/support.css');
const packageJson = JSON.parse(read('package.json'));

const supportTopicIds = SUPPORT_TOPICS.map((topic) => topic.id);
const workflowActions = TOOL_WORKFLOWS.map((workflow) => workflow.action);
const footerLinks = flattenFooterLinks(FOOTER_NAV_GROUPS);
const fallbackHrefCount = (toolsHtml.match(/data-fallback-href=/g) || []).length;
const supportCardCount = (supportHtml.match(/data-support-topic-card=/g) || []).length;

const checks = {
  schema: W133_SUPPORT_TOOLS_FOOTER_SCHEMA === 'eonapp.w133.support-tools-footer.v1' && proofJs.includes('safeEvidenceRule'),
  supportTopics: SUPPORT_TOPICS.length >= 6 && supportTopicIds.every((id) => supportHtml.includes(`data-support-topic-card="${id}"`)),
  supportNoSecrets: /Never send secrets/.test(supportHtml) && /seed phrase/.test(supportHtml) && /private key/.test(supportHtml) && /full API key/.test(supportHtml),
  supportScript: /support-page\.js/.test(supportHtml) && /buildSupportChatUrl/.test(supportJs) && /data-w133-support-proof/.test(supportHtml),
  toolsRouter: /data-w133-tools-router/.test(toolsHtml) && /Tools & Support Router/.test(toolsHtml),
  toolsFallbacks: fallbackHrefCount >= 4 && /installImmediateToolFallbacks/.test(toolsDeferredJs) && /__EON_TOOLS_PAGE_ROUTER_READY__/.test(toolPageJs),
  toolWorkflows: workflowActions.includes('workbench') && workflowActions.includes('creator') && workflowActions.includes('browser') && workflowActions.includes('support'),
  supportStrip: /data-w133-tools-support-strip/.test(toolsHtml) && /Support Center/.test(toolsHtml) && /Telegram Rewards/.test(toolsHtml),
  footerGroups: FOOTER_NAV_GROUPS.length >= 4 && footerLinks.some((link) => link.href === '/support.html') && footerLinks.some((link) => link.href === '/tools.html') && footerLinks.some((link) => link.href.includes('t.me/EonApps')),
  siteShellFooter: /FOOTER_NAV_GROUPS/.test(siteShellJs) && /footer-link-group/.test(siteShellJs) && /Footer product, help, community, and legal links/.test(siteShellJs),
  footerCss: /footer-link-group/.test(layoutCss) && /footer-link-list/.test(layoutCss),
  supportCss: /support-topic-grid/.test(supportCss) && /support-proof-grid/.test(supportCss),
  toolsCss: /tools-launch-card--link/.test(toolsCss),
  npmScripts: Boolean(packageJson.scripts?.['qa:w133-support-tools-footer']) && Boolean(packageJson.scripts?.['qa:w121-w133-visual-overhaul'])
};
const summary = createSupportToolsFooterSummary();
const score = Object.values(checks).every(Boolean) && supportCardCount >= 6 && fallbackHrefCount >= 4 ? 100 : 0;
const stats = {
  schema: W133_SUPPORT_TOOLS_FOOTER_SCHEMA,
  ok: score === 100,
  score,
  checks,
  supportCardCount,
  fallbackHrefCount,
  ...summary,
  productionBoundary: [
    'Source gate proves visible support/tool/footer routes and no-dead-button fallbacks.',
    'Live proof still needs Cloudflare deploy and browser/mobile route checks on eonapp.ch.'
  ]
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w133-support-tools-footer-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!stats.ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W133 support/tools/footer cleanup gate passed: score ${score}`);
