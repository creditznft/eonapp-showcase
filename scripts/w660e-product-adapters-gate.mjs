#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_NEXUS_FORGE_STAGES,
  getEonNexusProductAdapterTruth,
  readEonNexusProductAdapterSnapshot
} from '../assets/js/nexus/eon-nexus-product-adapters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'assets/js/nexus/eon-nexus-product-adapters.js',
  'assets/js/nexus/eon-nexus-event-adapter.js',
  'tests/unit/w660e-product-adapters.test.mjs',
  'docs/W660E_PRODUCT_ADAPTERS_SOURCE_RECEIPT_2026-07-19.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const source = fs.readFileSync(path.join(root, required[0]), 'utf8');
const adapterSource = fs.readFileSync(path.join(root, required[1]), 'utf8');
const executable = `${source}\n${adapterSource}`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

add('eight-adapters', /adapterCount:\s*8/.test(source) && ['forge', 'projects', 'local-ai', 'library', 'automations', 'vault', 'settings', 'billing'].every((id) => source.includes(id)));
add('forge-seven-stages', EON_NEXUS_FORGE_STAGES.length === 7 && EON_NEXUS_FORGE_STAGES.join(',') === 'request,planner,files,generator,validation,preview,approval');
add('existing-store-readers', /readEonKernelForegroundSession/.test(source) && /loadProjects/.test(source) && /loadAutomationState/.test(source));
add('same-nexus-projection', /readEonNexusProductAdapterSnapshot/.test(adapterSource) && /productNodes:\s*productAdapters\?\.presence/.test(adapterSource));
add('automation-categories', /upcoming/.test(source) && /successful/.test(source) && /failed/.test(source) && /waiting/.test(source));
add('vault-restrained', /secureStateOnly:\s*true/.test(source) && /readsVaultContents:\s*false/.test(source));
add('settings-billing-restrained', /helpPulseOnly:\s*true/.test(source) && /serverAuthorityOnly:\s*true/.test(source));
add('no-effects', !/fetch\s*\(|getUserMedia|SpeechRecognition\s*\(|runAutomation|approveEonbotActionProposal/.test(executable));
add('no-new-storage', !/localStorage\.setItem|sessionStorage\.setItem|indexedDB/.test(executable));

const snapshot = readEonNexusProductAdapterSnapshot({
  now: Date.parse('2026-07-19T12:00:00.000Z'),
  kernelSession: { records: [{ taskId: 'task', state: 'review-needed', workflowState: 'validation' }] },
  activeProjectContext: {}, projectState: { projects: [] }, settings: {}, readiness: {}, libraryAssets: [],
  automationState: { schedules: [], audit: [], approvals: [] }, vaultSummary: {}, billingArchitecture: { hostedProvider: 'Dodo Payments', paidPlans: [] }
});
add('runtime-shape', snapshot.presence.length === 8 && snapshot.adapters.forge.detail.currentStage === 'validation');
const truth = getEonNexusProductAdapterTruth();
add('truth-boundaries', truth.readOnly && !truth.startsWork && !truth.duplicatesStores && !truth.rawSecrets);

const failed = checks.filter((entry) => !entry.pass);
const report = { wave: 'W660E', scope: 'focused-product-adapters', ok: failed.length === 0, passed: checks.length - failed.length, total: checks.length, checks, claims: { sourceImplemented: failed.length === 0, browserCertified: false, productionCertified: false } };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
