#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getEonNexusAppShellTruth,
  shouldInstallEonNexusAppShell
} from '../assets/js/nexus/eon-nexus-app-shell.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = [
  'assets/js/nexus/eon-nexus-app-shell.js',
  'assets/js/nexus/eon-nexus-event-adapter.js',
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/js/nexus/eon-nexus-live.js',
  'assets/css/eon-nexus-pulse.css',
  'assets/js/eon-app-shell.js',
  'tests/unit/w660g-app-shell-nexus.test.mjs',
  'docs/W660G_APP_SHELL_NEXUS_COMPLETION_RECEIPT_2026-07-19.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const installer = read(required[0]);
const shell = read('assets/js/eon-app-shell.js');
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
const workSurfaceHost = read('assets/js/work-surface/eon-work-surface-host.js');
const commandSurface = read('assets/js/command/eon-command-surface.js');
const workSurfaceRegistry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
const cityContract = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
const executable = installer.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// Release policy W759: later W736A/W745+ single-shell and single-Nexus
// authorities supersede only the retired W660G eon-nexus-app-shell installer
// requirement. The remaining W660G checks stay in force.
add('w736a-current-single-shell-authority',
  /installEonWorkSurfaceHost/.test(shell)
    && /installEonQuickCommandSurface/.test(shell)
    && !/eon-nexus-app-shell|scheduleEonNexusAppShell|eon-nexus-chat-pulse|installDeferredEonNexusPulse/.test(shell)
    && /id: 'nexus', label: 'Living Nexus'/.test(workSurfaceRegistry)
    && /id: 'eonbot-nexus'[\s\S]*?kind: 'nexus'/.test(cityContract)
    && /existing\?\.EONWorkSurfaceController/.test(workSurfaceHost)
    && /command-surface-already-mounted/.test(commandSurface)
    && /dispose\(\)/.test(workSurfaceHost)
    && /dispose\(\)/.test(commandSurface)
);
add('application-routes-covered', ['forge', 'projects', 'workspace', 'local-ai', 'library', 'automations', 'vault', 'settings'].every((page) => shouldInstallEonNexusAppShell({ page, document: { body: { dataset: { eonAppShell: '1', eonAppPage: page } } } })));
add('chat-city-deduplicated', !shouldInstallEonNexusAppShell({ page: 'chat', document: { body: { dataset: { eonAppShell: '1', eonAppPage: 'chat' } } } }) && !shouldInstallEonNexusAppShell({ page: 'eoncity', document: { body: { dataset: { eonAppShell: '1', eonAppPage: 'eoncity' } } } }));
add('same-adapter', /createEonNexusEventAdapter/.test(installer) && /adapter\.start\(\)/.test(installer));
add('pulse-and-live', /mountEonNexusPulse/.test(installer) && /import\('(?:\.\/|\/assets\/js\/nexus\/)eon-nexus-live\.js'\)/.test(installer));
add('speak-action-requires-handler', /speakAction\.hidden = !\(model\.canSpeak && typeof onSpeak === 'function'\)/.test(pulse));
add('no-auto-effects', !/getUserMedia|SpeechRecognition\s*\(|fetch\s*\(|\.click\s*\(|location\.(?:assign|replace)|approve/.test(executable));
add('no-second-store', !/createEonNexusStore|localStorage\.setItem|sessionStorage\.setItem|indexedDB/.test(executable));
const truth = getEonNexusAppShellTruth();
add('truth-boundaries', truth.applicationShellVisible && truth.samePrivacyProjectedAdapter && !truth.startsAiWork && !truth.startsVoiceCapture && !truth.autoNavigation && !truth.autoApproval);

const failed = checks.filter((entry) => !entry.pass);
const report = {
  wave: 'W660G',
  scope: 'application-shell-nexus-continuity',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  claims: { sourceImplemented: failed.length === 0, headedBrowserCertified: false, operaPreviewCertified: false, productionCertified: false }
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
