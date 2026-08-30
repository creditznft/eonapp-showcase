import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const js = read('assets/js/eon-workstation-page.js');
const css = read('assets/css/eon-workstation.css');
const html = read('eon-browser.html');

assert(/W129_PRO_WORKSTATION_CONTRACT/.test(js), 'missing W129 professional workstation contract');
assert(/left-app-launcher/.test(js), 'contract missing left app launcher');
assert(/single-active-app-surface/.test(js), 'contract missing single active surface');
assert(/right-eonbot-rail/.test(js), 'contract missing right EONBOT rail');
assert(/bottom-command-dock/.test(js), 'contract missing bottom command dock');
assert(/framePolicy:\s*'one-large-active-workspace-no-tiny-clipped-iframes'/.test(js), 'missing no tiny/clipped frame policy');
assert(/function renderW129AppLauncher/.test(js), 'missing W129 app launcher renderer');
assert(/data-w129-app-launcher="left"/.test(js), 'missing left app launcher marker');
assert(/function renderW129BottomDock/.test(js), 'missing W129 bottom dock renderer');
assert(/data-w129-bottom-dock="persistent"/.test(js), 'missing persistent bottom dock marker');
assert(/function toggleStageFullscreen/.test(js), 'missing fullscreen toggle');
assert(/function pinActiveApp/.test(js), 'missing pin active app action');
assert(/function enterActiveRoom/.test(js), 'missing enter active room action');
assert(/data-w129-active-surface="single-large"/.test(js), 'app frame missing single large active surface marker');
assert(/id="ew-app-fullscreen"/.test(js), 'app toolbar missing fullscreen control');
assert(/id="ew-app-pin"/.test(js), 'app toolbar missing pin control');
assert(/id="ew-app-room"/.test(js), 'app toolbar missing enter room control');
assert(/document\.body\.dataset\.w129WorkstationOs\s*=\s*'professional'/.test(js), 'boot does not mark professional W129 mode');
assert(/version:\s*'4\.0\.0-w129'/.test(js), 'window export version not updated for W129');
assert(/w129Contract:\s*W129_PRO_WORKSTATION_CONTRACT/.test(js), 'window export missing W129 contract');

assert(/W129 Workstation professional OS rebuild/.test(css), 'missing W129 CSS marker');
assert(/\.ew-w129-app-launcher/.test(css), 'missing W129 launcher CSS');
assert(/\.ew-w129-bottom-dock/.test(css), 'missing W129 bottom dock CSS');
assert(/\.ew-w129-active-app-surface \.ew-app-frame-wrap\[data-w129-active-surface="single-large"\]/.test(css), 'missing active app surface sizing CSS');
assert(/\.ew-w129-stage-fullscreen/.test(css), 'missing fullscreen stage CSS');
assert(/body\.eon-workstation-v4\[data-w129-workstation-os="professional"\] \.browser-body/.test(css), 'missing v4 professional body layout CSS');
assert(/@media \(max-width: 860px\)/.test(css), 'missing mobile workstation docking policy');

assert(/id="ew-workstation-stage"/.test(html), 'eon-browser page missing workstation stage');
assert(/browser-ai-sidebar/.test(html), 'eon-browser page missing right EONBOT rail host');
assert(/assets\/js\/eon-workstation-page\.js/.test(html), 'eon-browser page missing workstation controller');

const stats = {
  wave: 'W129_WORKSTATION_PROFESSIONAL_OS',
  generatedAt: new Date().toISOString(),
  score: failures.length ? 0 : 100,
  layout: ['left-app-launcher', 'single-active-app-surface', 'right-eonbot-rail', 'bottom-command-dock'],
  controls: ['fullscreen', 'minimize', 'pin', 'enter-room', 'ask-eonbot', 'open-full-page'],
  remainingPhasesAfterW129: ['W130 EON City gameplay UX', 'W131 Market trust proof', 'W132 Telegram + Monetag production proof', 'W133 Support/Tools/footer cleanup', 'W134 Dependency security'],
  failures
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W129_WORKSTATION_PROFESSIONAL_OS_STATS_2026-06-12.json'), JSON.stringify(stats, null, 2));

if (failures.length) {
  console.error('W129 Workstation Professional OS gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`W129 Workstation Professional OS gate passed: ${stats.layout.length} layout zones, ${stats.controls.length} controls, score ${stats.score}.`);
