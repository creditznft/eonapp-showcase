import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');
const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
}
const html = read('code-maker.html');
const js = read('assets/js/code-maker-page.js');
const css = read('assets/css/code-maker.css');
const pkg = JSON.parse(read('package.json'));

check('Code Maker branded as EON Code OS', /EON Code OS/.test(html) && /EON Code OS/.test(css + js));
check('Readiness board exists', /id="cm-code-os-board"/.test(html) && /cm-provider-status/.test(html) && /cm-local-runtime-status/.test(html));
check('Voice prompt button exists', /id="cm-btn-voice"/.test(html) && /startVoicePrompt/.test(js));
check('Secrets guard exists', /id="cm-btn-secrets"/.test(html) && /scanForSecrets/.test(js) && /OpenAI-style API key/.test(js));
check('GitHub handoff exists', /id="cm-btn-github-handoff"/.test(html) && /createGitHubHandoff/.test(js) && /Codex tasks/.test(js));
check('Local model discovery wired', /detectLocalProviders/.test(js) && /Ollama, LM Studio, and Jan/.test(html));
check('Provider readiness wired', /getAIReadiness/.test(js) && /loadAISettings/.test(js));
check('Media hooks exist', /data-codeos-template="image"/.test(html) && /data-codeos-template="video"/.test(html) && /data-codeos-template="voice"/.test(html));
check('Diagnostics exposed', /window\.EONCodeOS/.test(js) && /getState/.test(js));
check('Safe AI prompt instruction present', /Never include API keys/.test(js));
check('Responsive CSS exists', /@media \(max-width: 680px\)/.test(css) && /cm-codeos-drawer/.test(css));
check('Package script registered', pkg.scripts?.['gpt55:code-os-gate'] === 'node scripts/gpt55-code-os-gate.mjs');

const failed = checks.filter((item) => !item.ok);
const report = {
  ok: failed.length === 0,
  checkedAt: new Date().toISOString(),
  scope: 'Session 5 EON Code OS gate',
  checks,
  failed
};
const outDir = join(root, 'reports/session5');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'code-os-gate.json'), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, 'code-os-gate.md'), `# Session 5 EON Code OS Gate\n\nStatus: ${report.ok ? 'PASS' : 'FAIL'}\n\n${checks.map((item) => `- ${item.ok ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`).join('\n')}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
