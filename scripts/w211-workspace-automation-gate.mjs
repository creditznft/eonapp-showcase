#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const required = [
  'assets/js/utils/eon-workspace-store.js',
  'assets/js/eon-workspace-pages.js',
  'assets/js/projects/eon-projects-page.js',
  'assets/js/eon-automations-page.js',
  'assets/css/eon-workspace-records.css',
  'projects.html',
  'library.html',
  'workspace.html',
  'automations.html',
  'tests/unit/w211-workspace-automation.test.mjs'
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const failures = [];
if (missing.length) failures.push(`missing: ${missing.join(', ')}`);
const sources = {
  store: read('assets/js/utils/eon-workspace-store.js'),
  projects: read('projects.html'),
  library: read('library.html'),
  workspace: read('workspace.html'),
  automation: read('assets/js/eon-automations-page.js')
};
for (const [name, source, pattern] of [
  ['versioned Projects state', sources.store, /eon:projects:v3/],
  ['versioned Library state', sources.store, /eon:library:v3/],
  ['secret exclusion', sources.store, /SECRET_LIKE_RE/],
  ['project page records runtime', sources.projects, /projects\/eon-projects-page\.js/],
  ['library page records runtime', sources.library, /eon-workspace-pages\.js/],
  ['workspace counts runtime', sources.workspace, /eon-workspace-pages\.js/],
  ['local-only automation truth', sources.automation, /no external action was sent/i],
  ['project-linked workflows', sources.automation, /projectId/],
  ['pause controls', sources.automation, /workflow-paused/],
  ['integration truth', sources.automation, /OAuth required/]
]) if (!pattern.test(source)) failures.push(`${name} missing`);
if (/fetch\s*\(/.test(sources.automation)) failures.push('automation page must not call an external provider directly');
const result = {
  ok: failures.length === 0,
  failures,
  checked: 'W211 Projects, Library, Workspace, approval-first Automations',
  externalProofStillRequired: ['browser creation/reload proof', 'Playwright visual flow', 'Cloudflare Preview persistence proof', 'real provider connection remains disabled']
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
