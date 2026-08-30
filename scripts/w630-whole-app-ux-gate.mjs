#!/usr/bin/env node
import fs from 'node:fs';
import { validateW630WholeAppUxContract, EON_W630_COMMANDS, EON_W630_ROUTE_CONTEXT_ALLOWLIST } from '../assets/js/shell/eon-whole-app-ux.js';

const config = JSON.parse(fs.readFileSync(new URL('../config/w630-whole-app-ux-contract.json', import.meta.url), 'utf8'));
const shell = fs.readFileSync(new URL('../assets/js/eon-app-shell.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/eon-app-shell.css', import.meta.url), 'utf8');
const report = validateW630WholeAppUxContract();
const checks = [
  ['contract-valid', report.ok],
  ['ten-requirements', config.requirements.length === 10],
  ['command-registry', EON_W630_COMMANDS.length >= 9],
  ['project-routes', ['/projects', '/workspace', '/forge', '/eoncity', '/vault'].every((path) => EON_W630_ROUTE_CONTEXT_ALLOWLIST.includes(path))],
  ['shell-installs-w630', /installW630WholeAppUx\(\)/.test(shell)],
  ['command-shortcut-ui', /eon-w630-command-dialog/.test(css)],
  ['context-strip-ui', /eon-w630-project-strip/.test(css)],
  ['real-evidence-pending', config.realEvidencePending.length >= 6]
];
for (const [id, pass] of checks) console.log(`[W630] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W630] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
