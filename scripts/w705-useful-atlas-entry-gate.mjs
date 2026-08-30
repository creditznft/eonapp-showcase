#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonNexusW705AtlasEntryModel, getEonNexusW705AtlasEntryTruth } from '../assets/js/nexus/w705/eon-nexus-w705-atlas-entry.js';
const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const live = read('assets/js/nexus/eon-nexus-live.js');
const atlas = read('assets/js/nexus/eon-nexus-project-atlas.js');
const shell = read('assets/js/nexus/eon-nexus-app-shell.js');
const model = buildEonNexusW705AtlasEntryModel({ route: { href: '/create' } });
const truth = getEonNexusW705AtlasEntryTruth();
const checks = [
  ['four-first-steps', model.actions.length === 4 && model.actions.every((action) => action.href.startsWith('/'))],
  ['atlas-always-opens', /receipt\.action === 'request-atlas'[\s\S]*setTab\('atlas'/.test(live) && /atlasCommand\.addEventListener\('click',[\s\S]*setTab\('atlas'/.test(live)],
  ['empty-entry-rendered', /buildEonNexusW705AtlasEntryModel/.test(atlas) && /atlasEntryAction/.test(atlas)],
  ['direct-entry-supported', /get\('nexus'\) === 'atlas'/.test(shell) && /openAtlas\?\.\(\)/.test(shell)],
  ['truth-boundaries', truth.atlasOpensWithoutProject && truth.projectDataRemainsEmpty && !truth.automaticNavigation && !truth.automaticProjectCreation && !truth.startsAiWork]
];
for (const [id, pass] of checks) console.log(`[W705] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W705] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
