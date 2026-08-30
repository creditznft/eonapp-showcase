#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getEonNexusAppShellTruth,
  getEonNexusPageContext,
  projectEonNexusPageSnapshot
} from '../assets/js/nexus/eon-nexus-app-shell.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = [
  'assets/js/eon-app-shell.js',
  'assets/css/eon-app-shell.css',
  'assets/css/eon-chat-first.css',
  'assets/css/eonbot-home.css',
  'assets/css/eon-continue.css',
  'assets/js/nexus/eon-nexus-app-shell.js',
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/js/nexus/eon-nexus-live.js',
  'assets/css/eon-nexus-pulse.css',
  'tests/unit/w660h-chat-shell-page-nexus.test.mjs',
  'docs/W660H_CHATGPT_SHELL_PAGE_NEXUS_COMPLETION_RECEIPT_2026-07-19.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const shell = read('assets/js/eon-app-shell.js');
const shellCss = read('assets/css/eon-app-shell.css');
const chatCss = read('assets/css/eon-chat-first.css');
const homeCss = read('assets/css/eonbot-home.css');
const continueCss = read('assets/css/eon-continue.css');
const nexus = read('assets/js/nexus/eon-nexus-app-shell.js');
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');

add('rail-has-scroll-body-and-fixed-footer', /eon-app-sidebar-scroll/.test(shell) && /eon-app-sidebar-footer/.test(shell) && /\.eon-app-sidebar-scroll\s*\{[\s\S]*overflow-y:\s*auto/.test(shellCss));
add('account-menu-scroll-bounded', /\.eon-app-profile-menu\s*\{[\s\S]*max-height:[\s\S]*100dvh/.test(shellCss) && /overflow:\s*auto/.test(shellCss));
add('chat-viewport-locked', /data-eon-app-page='chat'[\s\S]*height:\s*100dvh/.test(chatCss) && /\.chat-messages[\s\S]*overflow-y:\s*auto\s*!important/.test(chatCss));
add('home-composer-anchored', /\.eonbot-home-main[\s\S]*overflow:\s*hidden/.test(homeCss) && /\.eonbot-home-composer[\s\S]*position:\s*absolute/.test(homeCss));
add('continue-overlay-actions', /chat-page-main > \.eon-continue-card[\s\S]*position:\s*fixed/.test(continueCss) && /\.eon-continue-actions a,[\s\S]*display:\s*inline-flex/.test(continueCss));
add('page-context-registry', /EON_NEXUS_PAGE_CONTEXTS/.test(nexus) && ['forge','projects','local-ai','library','automations','vault','settings'].every((page) => getEonNexusPageContext(page).id === page));
const projected = projectEonNexusPageSnapshot({ nodes: [{ id: 'role:forge', kind: 'forge', status: 'active', count: 1 }] }, getEonNexusPageContext('forge'));
add('focused-real-adapter', projected.surface.focusNodeId === 'role:forge' && projected.nodes[0]?.id === 'role:forge');
add('full-screen-gesture', /onExpandFull/.test(pulse) && /pointerup/.test(pulse) && /dblclick/.test(pulse));
const truth = getEonNexusAppShellTruth();
add('truth-boundaries', truth.pageSpecificOrbs && truth.fullScreenGesture && !truth.secondConversationStore && !truth.secondProjectStore && !truth.startsAiWork && !truth.startsVoiceCapture);
const failed = checks.filter((entry) => !entry.pass);
const report = {
  wave: 'W660H',
  scope: 'chatgpt-shell-and-page-specific-nexus',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  claims: { sourceImplemented: failed.length === 0, headedBrowserCertified: false, operaPreviewCertified: false, productionCertified: false }
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
