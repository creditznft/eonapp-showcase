#!/usr/bin/env node
import fs from 'node:fs';
import { validateW631ProjectOperatingContract, EON_W631_AUTOMATION_STATES, EON_W631_FORGE_STATES } from '../assets/js/workspace/eon-project-operating-system.js';

const config = JSON.parse(fs.readFileSync(new URL('../config/w631-project-workspace-forge-automation-contract.json', import.meta.url), 'utf8'));
const projectsPage = fs.readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const projectsController = fs.readFileSync(new URL('../assets/js/projects/eon-projects-page.js', import.meta.url), 'utf8');
const operatingPages = ['workspace.html', 'forge.html', 'automations.html'].map((name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
const report = validateW631ProjectOperatingContract();
const checks = [
  ['contract-valid', report.ok],
  ['forge-states', EON_W631_FORGE_STATES.join(',') === config.forge.states.join(',')],
  ['automation-states', EON_W631_AUTOMATION_STATES.join(',') === config.automations.states.join(',')],
  ['project-versions-outcomes', config.project.versions && config.project.outcomes && config.project.continueAction],
  ['permissioned-deploy', config.forge.deploymentRequiresPermissionedConnector && config.forge.deploymentRequiresProviderReceipt],
  ['no-fake-remote', config.forge.fakeRemoteExecution === false],
  ['scheduled-prepared-only', config.automations.scheduledMeansPreparedOnly],
  ['operating-pages-load-authority-projects-own-dedicated-workspace', operatingPages.every((source) => source.includes('/assets/js/workspace/eon-project-operating-system.js'))
    && !projectsPage.includes('installW631ContinuityPanel')
    && !projectsPage.includes('/assets/js/eon-workspace-pages.js')
    && projectsPage.includes('/assets/js/projects/eon-projects-page.js')
    && projectsController.includes("from './w704/eon-projects-w704-command-workspace.js'")
    && projectsController.includes('resolveEonProjectsW704CommandWorkspace')]
];
for (const [id, pass] of checks) console.log(`[W631] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W631] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
