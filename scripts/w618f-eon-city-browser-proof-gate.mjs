#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const REQUIRED_SCRIPT = 'qa:w618f-eon-city-browser-proof:browser';
const E2E_SPEC = 'tests/e2e/w618f-eon-city-command-room-browser-proof.spec.ts';

export function inspectW618fEonCityBrowserProofGate() {
  const errors = [];
  const pkg = JSON.parse(read('package.json'));
  const spec = exists(E2E_SPEC) ? read(E2E_SPEC) : '';
  const station = read('assets/js/eon-city-play-station.js');
  const room = read('assets/js/city/eon-city-command-room.js');
  if (!pkg.scripts?.[REQUIRED_SCRIPT]) errors.push(`package.json missing ${REQUIRED_SCRIPT}.`);
  if (!pkg.scripts?.['qa:w618f-eon-city-browser-proof']) errors.push('package.json missing W618F source gate script.');
  if (!pkg.scripts?.[REQUIRED_SCRIPT]?.includes(E2E_SPEC)) errors.push('W618F browser script must run the focused Playwright spec.');
  if (!spec) errors.push('W618F Playwright spec is missing.');
  for (const fragment of ['data-eon-command-room-panel','data-eon-command-room-action','data-eon-command-room-screen','data-eon-command-room-explore','data-eon-command-room-confirm','data-eon-command-room-review','data-eon-play-travel-panel','data-eon-share-popover','data-eon-command-room-agent','data-eon-command-room-signal','data-eon-play-open-controls','data-eon-play-command-room-strip','page.keyboard.press','page.mouse.move','page.mouse.click','serviceWorker','w618f-command-room-desktop-default.png','w618f-mobile-portrait.png','w618f-mobile-landscape.png','writeProof','consoleMessages','requestFailures','pageErrors']) {
    if (!spec.includes(fragment)) errors.push(`W618F spec missing required proof fragment: ${fragment}`);
  }
  for (const shortcut of ['C','P','N','F','B','I','A','W','L','V','R','Escape']) if (!spec.includes(`'${shortcut}'`) && !spec.includes(`"${shortcut}"`)) errors.push(`W618F spec missing shortcut proof for ${shortcut}.`);
  for (const id of ['eonbot','projects','create','forge','library','research','automations','workspace','local-ai','vault','realm-studio']) if (!spec.includes(`'${id}'`) && !spec.includes(`"${id}"`)) errors.push(`W618F spec missing Command Room screen proof for ${id}.`);
  if (!station.includes('if (directEntry && !cityFirstRunVisible) show();')) errors.push('City station no longer opens Command Room by default for direct /eoncity.');
  if (!station.includes('data-eon-play-open-command-room')) errors.push('City station missing Command Room open buttons.');
  if (!station.includes('data-eon-command-room-confirm-route')) errors.push('Command Room second-click route confirmation is missing.');
  if (!station.includes("event.key.toLowerCase() === 'r'")) errors.push('Command Room R shortcut is not wired.');
  if (!station.includes("event.key === 'Escape'")) errors.push('Command Room Escape shortcut is not wired.');
  if (!station.includes("root.querySelector('[data-eon-play-share-city]')?.click()")) errors.push('City share popover trigger is not wired.');
  if (!room.includes('fakeAgentActivity: false')) errors.push('Command Room safety contract missing fake agent activity guard.');
  if (!room.includes('opensCheckout: false')) errors.push('Command Room safety contract missing checkout guard.');
  if (!room.includes('grantsReward: false')) errors.push('Command Room safety contract missing reward guard.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w618f.eon-city-browser-proof-gate.v2', checks: 32 });
}
const report = inspectW618fEonCityBrowserProofGate();
if (!report.ok) { console.error(`[W618F] EON City browser proof gate failed:\n- ${report.errors.join('\n- ')}`); process.exit(1); }
console.log(`[W618F] EON City browser proof gate passed (${report.checks}/32).`);
