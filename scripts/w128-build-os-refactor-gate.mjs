import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const count = (text, pattern) => (text.match(pattern) || []).length;

const html = read('workbench.html');
const css = read('assets/css/workbench.css');
const js = read('assets/js/workbench-page.js');

const primaryLaneIds = ['ask', 'website', 'code', 'creator', 'automation', 'device'];
assert(/data-w128-build-os="primary"/.test(html), 'workbench missing W128 primary Build OS shell');
for (const lane of primaryLaneIds) {
  assert(new RegExp(`data-w128-build-lane="${lane}"`).test(html), `missing W128 primary lane: ${lane}`);
}
assert(count(html, /data-w128-build-lane=/g) === 6, 'Build OS must expose exactly six primary lanes');
assert(count(html, /data-w128-drawer="primary"/g) === 6, 'Build OS must expose six primary drawers');
assert(count(html, /data-w128-drawer="advanced"/g) >= 4, 'advanced systems must be in drawers');
assert(/id="legacy-mode-matrix"[^>]*hidden/.test(html), 'advanced legacy mode matrix must be hidden by default');
assert(/data-w128-toggle-legacy="1"/.test(html), 'legacy advanced matrix must have explicit reveal control');
assert(/Build OS · EONBOT · Creator Studio · Device Lab/.test(html), 'hero must be reframed as Build OS');
assert(!/Ask, Build, Agent, Hive, Trade, Creator Studio — all inside one cockpit/.test(html), 'old overloaded cockpit positioning still visible');
assert(/Code Showcase/.test(html) && /Device Lab/.test(html), 'Code Showcase and Device Lab must stay visible in Build OS');
assert(/W128 Vault-style Build OS refactor/.test(css), 'W128 CSS marker missing');
assert(/\.w128-vault-shell/.test(css), 'Vault-style shell CSS missing');
assert(/initW128BuildOsShell/.test(js), 'W128 Build OS runtime initializer missing');
assert(/W128_BUILD_LANE_COPY/.test(js), 'W128 lane copy registry missing');
assert(/eonW128BuildOs/.test(js), 'W128 runtime stats export missing');

const advancedLabels = ['Hive / Agent board', 'Compute / marketplace', 'Trust / rules', 'Voice / language / browser'];
for (const label of advancedLabels) assert(html.includes(label), `missing advanced drawer label: ${label}`);

const stats = {
  wave: 'W128_BUILD_OS_REFACTOR',
  generatedAt: new Date().toISOString(),
  score: failures.length ? 0 : 100,
  primaryLanes: primaryLaneIds.length,
  primaryDrawers: count(html, /data-w128-drawer="primary"/g),
  advancedDrawers: count(html, /data-w128-drawer="advanced"/g),
  legacyMatrixHiddenByDefault: /id="legacy-mode-matrix"[^>]*hidden/.test(html),
  vaultStyleCss: /\.w128-vault-shell/.test(css),
  runtimeInitializer: /initW128BuildOsShell/.test(js),
  remainingPhasesAfterW128: ['W129 Workstation professional OS', 'W130 EON City gameplay UX', 'W131 Market trust proof', 'W132 Telegram + Monetag production proof', 'W133 Support/Tools/footer cleanup', 'W134 Dependency security']
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W128_BUILD_OS_REFACTOR_STATS_2026-06-12.json'), JSON.stringify({ ...stats, failures }, null, 2));

if (failures.length) {
  console.error('W128 Build OS refactor gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`W128 Build OS gate passed: ${stats.primaryLanes} primary lanes, ${stats.primaryDrawers} primary drawers, ${stats.advancedDrawers} advanced drawers, score ${stats.score}.`);
