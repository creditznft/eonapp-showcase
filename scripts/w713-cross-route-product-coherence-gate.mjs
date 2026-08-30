#!/usr/bin/env node
import fs from 'node:fs';
import {
  buildEonAppW713CrossRouteCoherencePlan,
  getEonAppW713CrossRouteCoherenceTruth,
  normalizeEonAppW713ProviderReadiness,
  prepareEonAppW713CreatorAttachment,
  validateEonAppW713CrossRouteCoherencePlan
} from '../assets/js/runtime/w713/eonapp-w713-cross-route-product-coherence.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const plan = buildEonAppW713CrossRouteCoherencePlan({
  state: { project: { id: 'project:1', label: 'EONAPP', selected: true }, conversation: { id: 'chat:1' }, selectedWorkObject: { id: 'task:1' } },
  providerStatus: { runtimeId: 'ollama', modelId: 'qwen', configured: true, verified: true },
  creatorOutput: { assetId: 'asset:1', title: 'Launch visual', sha256: 'abc' }
});
const projectProposal = prepareEonAppW713CreatorAttachment({ output: { assetId: 'asset:1', sha256: 'abc' }, target: 'project', projectId: 'project:1', explicitUserAction: true, confirmed: true });
const libraryProposal = prepareEonAppW713CreatorAttachment({ output: { assetId: 'asset:1', sha256: 'abc' }, target: 'library', explicitUserAction: true, confirmed: true });
const truth = getEonAppW713CrossRouteCoherenceTruth();
const creatorSource = read('assets/js/create/creator-project-integration.js');
const localAiSource = read('assets/js/local-ai/local-runtime-status.js');
const automationSource = read('assets/js/eon-automations-page.js');
const vaultSource = read('assets/js/vault/eon-vault-page.js');
const projectsSource = read('assets/js/projects/w704/eon-projects-w704-command-workspace.js');
const checks = [
  ['twelve-product-routes', plan.routeCount === 12 && validateEonAppW713CrossRouteCoherencePlan(plan).ok],
  ['one-project-one-eonbot', plan.routeViews.every((view) => view.project.id === 'project:1' && view.eonbotIdentity === 'eonbot:primary')],
  ['clear-custody-boundaries', plan.routes.find((route) => route.id === 'projects')?.custody === 'ordinary-work' && plan.routes.find((route) => route.id === 'library')?.custody === 'reusable-content' && plan.routes.find((route) => route.id === 'vault')?.custody === 'sensitive-material'],
  ['explicit-creator-attachments', projectProposal.ok && libraryProposal.ok && !projectProposal.publishes && !libraryProposal.writesStorage && /prepareEonAppW713CreatorAttachment/.test(creatorSource) && /target === 'library'/.test(creatorSource)],
  ['provider-four-state-truth', normalizeEonAppW713ProviderReadiness({ runtimeId: 'ollama' }).state === 'saved' && normalizeEonAppW713ProviderReadiness({ runtimeId: 'ollama', verified: true }).state === 'verified' && /projectLocalRuntimeStatusForW713/.test(localAiSource)],
  ['existing-route-truth-preserved', /Creates a local draft only/.test(automationSource) && /only place for provider keys/.test(vaultSource) && /ownsSingleResumeSurface: true/.test(projectsSource)],
  ['truth-boundaries', truth.oneCanonicalForegroundState && truth.oneSelectedProject && truth.oneEonbotIdentity && truth.creatorAttachmentRequiresConfirmation && !truth.writesStorage && !truth.startsProvider && !truth.navigatesAutomatically && !truth.publishesAutomatically && !truth.copiesSecretMaterial]
];
for (const [id, pass] of checks) console.log(`[W713] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W713] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
