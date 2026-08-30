#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  AUTOMATION_PROVIDERS,
  getAutomationProvider,
  getAutomationProviderStats,
  validateAutomationProviderRegistry
} from '../assets/js/utils/automation-provider-registry.js';
import { WORKFLOW_TEMPLATE_FAMILIES } from '../assets/js/utils/automation-workflow-engine.js';

const root = process.cwd();
const outputDir = path.join(root, 'CodexAuditPack', 'W103_AUTOMATION_OS');
fs.mkdirSync(outputDir, { recursive: true });

const checks = [];
function check(id, condition, detail = '') {
  const ok = Boolean(condition);
  checks.push({ id, ok, detail });
  if (!ok) console.error(`FAIL ${id}: ${detail}`);
  else console.log(`PASS ${id}: ${detail}`);
}
function text(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }

const registryResult = validateAutomationProviderRegistry();
const stats = getAutomationProviderStats();
check('registry-valid', registryResult.ok, `${registryResult.providerCount} providers`);
check('provider-breadth', stats.total >= 175, `${stats.total} providers across ${stats.categories} categories`);
check('ai-provider-breadth', (stats.byCategory.ai || 0) >= 30, `${stats.byCategory.ai || 0} AI providers`);
check('automation-bridges', (stats.byCategory.automation || 0) >= 10, `${stats.byCategory.automation || 0} automation bridges`);
for (const id of ['openai','anthropic','google-gemini','xai','qwen-cloud','azure-openai','aws-bedrock','google-vertex-ai','gmail','microsoft-graph','slack','hubspot','salesforce','shopify','stripe','github','zapier','make','n8n','pipedream','power-automate','browser-companion','local-runner','cloud-scheduler']) {
  check(`provider-${id}`, Boolean(getAutomationProvider(id)), id);
}

for (const file of [
  'automation-studio.html',
  'assets/css/automation-studio.css',
  'assets/js/automation-studio-page.js',
  'assets/js/utils/automation-provider-registry.js',
  'assets/js/utils/automation-os-store.js',
  'assets/js/utils/automation-workflow-engine.js',
  'tests/unit/w103-automation-os.test.mjs',
  'scripts/w103-update-safe-persistence-proof.mjs'
]) check(`file-${file}`, exists(file), file);

const page = text('automation-studio.html');
const pageJs = text('assets/js/automation-studio-page.js');
const store = text('assets/js/utils/automation-os-store.js');
const engine = text('assets/js/utils/automation-workflow-engine.js');
const workstation = text('assets/js/eon-workstation-page.js');
const vault = text('assets/js/utils/vault.js');
const redirects = text('_redirects');
const sitemap = text('sitemap.xml');

check('route-in-workstation', workstation.includes('/automation-studio.html') && workstation.includes('Automation OS'), 'Workstation app and command aliases');
check('workstation-password-vault', workstation.includes("id: 'passwords'") && workstation.includes('eon-pwdmgr-btn') && workstation.includes('Open password vault'), 'encrypted password vault exposed from the flagship Workstation shell');
check('valid-vault-api-route', !pageJs.includes('/vault-api.html') && !workstation.includes('/vault-api.html') && pageJs.includes('/vault-api-keys.html') && workstation.includes('/vault-api-keys.html'), 'W103 links use the real Vault API Keys route');
check('route-rewrite', redirects.includes('/automate /automation-studio.html 200') && redirects.includes('/automation /automation-studio.html 200'), 'clean route aliases');
check('route-sitemap', sitemap.includes('/automation-studio.html'), 'sitemap entry');
check('approval-levels', /read[\s\S]*draft[\s\S]*submit[\s\S]*sensitive/.test(engine), 'four approval levels');
check('simulation-default', engine.includes("mode: 'simulate'") && pageJs.includes('Run safe simulation'), 'external side effects disabled in default runner');
check('agent-planner', engine.includes('planWorkflowWithAgent') && engine.includes('local-agent-fallback'), 'configured AI + local safe fallback');
check('content-pipeline', engine.includes('Content Production Studio') && engine.includes('storyboard') && engine.includes('captions'), 'creator production pipeline');
check('business-template-count', WORKFLOW_TEMPLATE_FAMILIES.length >= 10, `${WORKFLOW_TEMPLATE_FAMILIES.length} workflow families`);
check('durable-key', store.includes("eon:automation-os:v3") && store.includes('AUTOMATION_OS_LEGACY_KEYS'), 'stable versioned storage and migration');
check('vault-captures-local-storage', vault.includes('for (let i = 0; i < localStorage.length; i += 1)') && vault.includes('storage[key] = localStorage.getItem(key)'), 'Automation OS, API vault, and password vault included in encrypted Vault snapshot');
check('persistence-proof-command', text('package.json').includes('qa:w103-update-persistence') && text('scripts/w103-update-safe-persistence-proof.mjs').includes('W103_UPDATE_SAFE_PERSISTENCE_PROOF.json'), 'dedicated destructive export/clear/restore proof is available');
check('secret-strip-policy', store.includes('SECRET_FIELD_RE') && store.includes('vault://automation/'), 'secret fields stripped and only Vault references stored');
check('logout-update-claim-grounded', store.includes('survivesAssetUpdate: true') && store.includes('survivesNormalLogoutLogin: true'), 'normal deploy/logout persistence report');
check('no-unrestricted-live-copy', !/unrestricted autonomous|guaranteed profit|bypass captcha/i.test(page + pageJs), 'public W103 copy avoids unsafe autonomy claims');
check('browser-background-honesty', pageJs.includes('A browser tab cannot promise background work after it closes'), 'runner truth disclosed');
check('provider-truth-copy', pageJs.includes('integration blueprints') && pageJs.includes('not claims that every account is already connected'), 'catalog does not claim live connection');
check('mobile-css', /@media \(max-width: 720px\)/.test(text('assets/css/automation-studio.css')) && /grid-template-columns: 1fr/.test(text('assets/css/automation-studio.css')), 'mobile containment rules');
check('language-picker', page.includes('release-language-picker.js'), '11-language runtime retained');

const failures = checks.filter((item) => !item.ok);
const report = {
  schema: 'eon.w103.automation-os-gate.v1',
  generatedAt: new Date().toISOString(),
  ok: failures.length === 0,
  score: `${checks.length - failures.length}/${checks.length}`,
  providerStats: stats,
  templateCount: WORKFLOW_TEMPLATE_FAMILIES.length,
  checks,
  failures
};
fs.writeFileSync(path.join(outputDir, 'W103_AUTOMATION_OS_STATIC_GATE.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ok: report.ok, score: report.score, providers: AUTOMATION_PROVIDERS.length, templates: WORKFLOW_TEMPLATE_FAMILIES.length }, null, 2));
process.exit(failures.length ? 1 : 0);
