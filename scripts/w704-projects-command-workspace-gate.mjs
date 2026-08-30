#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonProjectsW704CommandStrip, getEonProjectsW704CommandWorkspaceTruth, resolveEonProjectsW704CommandWorkspace } from '../assets/js/projects/w704/eon-projects-w704-command-workspace.js';
const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const page = read('projects.html');
const workspace = read('assets/js/projects/eon-projects-page.js');
const continueSurface = read('assets/js/retention/eon-continue-surface.js');
const wholeApp = read('assets/js/shell/eon-whole-app-ux.js');
const model = resolveEonProjectsW704CommandWorkspace({ projects: [{ id: 'p1', title: 'Launch', status: 'active', tasks: [], artifacts: [] }] });
const strip = buildEonProjectsW704CommandStrip(model);
const truth = getEonProjectsW704CommandWorkspaceTruth();
const checks = [
  ['single-page-owner', !page.includes('installW631ContinuityPanel') && /data-project-command-strip/.test(workspace)],
  ['generic-continue-suppressed', /pageType === 'projects'/.test(continueSurface)],
  ['global-project-strip-suppressed', /pageType !== 'projects'/.test(wholeApp)],
  ['useful-resume', strip.primaryAction.id === 'resume-project' && strip.secondaryActions.length >= 3],
  ['empty-first-step', buildEonProjectsW704CommandStrip(resolveEonProjectsW704CommandWorkspace()).primaryAction.id === 'create-project'],
  ['truth-boundaries', truth.oneResumeSurfaceOnProjects && !truth.createsProjectAutomatically && !truth.startsAiAutomatically && !truth.performsNavigation]
];
for (const [id, pass] of checks) console.log(`[W704] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W704] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
