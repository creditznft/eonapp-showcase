import {
  appendAutomationAudit,
  loadAutomationState,
  resolveAutomationApproval,
  upsertWorkflow
} from './utils/automation-os-store.js';
import {
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS,
  WORKFLOW_TEMPLATE_FAMILIES,
  createWorkflowFromTemplate,
  inspectWorkflowReadiness,
  planWorkflowLocally,
  runWorkflowSimulation,
  savePlannedWorkflow
} from './utils/automation-workflow-engine.js';
import { getAutomationProvider } from './utils/automation-provider-registry.js';
import { linkProjectAutomation, loadProjects } from './utils/eon-workspace-store.js';
import { appendOperatorActivity } from './operator/operator-activity.js';
import { getCapabilityTruth } from './capabilities/capability-truth-registry.js';
import { bindCityModeLinkTracking, enterCityMode } from './contracts/city/city-mode-transition.js';
import { listEonActionClasses } from './automation/eon-action-taxonomy.js';
import { getEonAppDeckBlueprint, readEonAppDeckLaunchIntent } from './apps/eon-app-deck-catalog.js';
import { createBlueprintWorkroom } from './apps/eon-blueprint-workroom-handoff.js';
import { renderLockedFeatureSurface } from './referrals/eon-locked-feature-surface.js';
import { renderEonPremiumCapabilityPreview } from './capabilities/eon-premium-preview-surface.js';
import { recordEonCoreOutcome } from './contracts/outcomes/eon-core-outcome-authority.js';

const root = document.getElementById('eon-automations-root');
const state = { lastRun: null, busy: false, inspectWorkflowId: '', lastSimulation: null, appDeckBlueprint: null };
const INTEGRATION_SAMPLE_IDS = Object.freeze(['rss', 'csv-json', 'gmail', 'slack', 'webhook', 'browser-companion', 'local-runner', 'cloud-scheduler']);
const AUTOMATION_TRUTH = getCapabilityTruth('automation-local-review');

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function setChatPrefill(prompt = '') {
  try { localStorage.setItem('eon:chat:prefill:v1', String(prompt || '').trim()); } catch {}
}

function routeToChat(prompt = '') {
  setChatPrefill(prompt);
  window.location.assign('/?new=1');
}

function integrationTruth(provider, connection = null) {
  if (!provider) return { label: 'Unsupported', note: 'This integration is not in the reviewed EONAPP registry.' };
  if (connection?.status === 'verified') return { label: 'Available', note: 'A local connection record is verified. Actions still require workflow approval.' };
  if (provider.rail === 'webhook') return { label: 'Webhook only', note: 'Use a signed server-side webhook after explicit setup. Nothing is configured here.' };
  if (provider.rail === 'browser-companion' || provider.state === 'companion') return { label: 'Manual export', note: 'Use a reviewed handoff or export. EONAPP does not take over a browser session.' };
  if (/oauth/i.test(provider.auth || '')) return { label: 'OAuth required', note: 'Connect a least-privilege OAuth app before any provider action is available.' };
  if (provider.id === 'local-runner' || provider.id === 'cloud-scheduler' || provider.state === 'adapter-ready' || provider.state === 'bridge-ready') return { label: 'Preview', note: 'The workflow model is available, but no live connection or background runner is active.' };
  if (provider.auth === 'none' && provider.state === 'built-in') return { label: 'Available', note: 'This local/browser capability is available for simulation or manual export only.' };
  return { label: 'Unsupported', note: 'No supported connection is active for this provider.' };
}

function projectOptions(selected = '') {
  const projects = loadProjects().projects.filter((project) => project.status !== 'complete');
  return [`<option value="">No project yet</option>`, ...projects.map((project) => `<option value="${escapeHtml(project.id)}"${project.id === selected ? ' selected' : ''}>${escapeHtml(project.title)}</option>`)].join('');
}

function workflowProjectTitle(workflow) {
  if (!workflow?.projectId) return 'No project linked';
  const project = loadProjects().projects.find((item) => item.id === workflow.projectId);
  return project ? project.title : 'Project unavailable';
}

function renderWorkflow(workflow) {
  const readiness = inspectWorkflowReadiness(workflow);
  const status = String(workflow.status || 'draft');
  const paused = status === 'paused';
  const inInspection = state.inspectWorkflowId === workflow.id;
  return `<article class="eon-automation-flow" data-automation-flow="${escapeHtml(workflow.id)}">
    <div class="eon-automation-flow-head"><div><p class="eon-automation-eyebrow">${escapeHtml(workflow.family || 'custom')} · ${escapeHtml(status.replace(/-/g, ' '))}</p><h3>${escapeHtml(workflow.name)}</h3></div><span class="eon-automation-state is-${escapeHtml(status)}">${escapeHtml(paused ? 'Paused' : (readiness.readyForSimulation ? 'Ready to simulate' : 'Needs setup'))}</span></div>
    <p>${escapeHtml(workflow.description || 'No description yet.')}</p>
    <div class="eon-automation-flow-meta"><span>${Number(workflow.steps?.length || 0)} steps</span><span>${Number(workflow.runCount || 0)} simulations</span><span>${escapeHtml(workflowProjectTitle(workflow))}</span><span>Local only</span></div>
    <div class="eon-automation-flow-actions">
      <button type="button" class="eon-hub-primary" data-simulate-flow="${escapeHtml(workflow.id)}" ${state.busy || paused ? 'disabled' : ''}>Simulate</button>
      <button type="button" class="eon-automation-ghost" data-toggle-inspect="${escapeHtml(workflow.id)}">${inInspection ? 'Hide inspection' : 'Inspect plan'}</button>
      <button type="button" class="eon-automation-ghost" data-toggle-pause="${escapeHtml(workflow.id)}">${paused ? 'Resume draft' : 'Pause'}</button>
      <button type="button" class="eon-automation-ghost" data-open-flow-chat="${escapeHtml(workflow.name)}">Refine with EONBOT</button>
    </div>
    ${readiness.missingProviders?.length ? `<p class="eon-automation-note">${escapeHtml(readiness.missingProviders.slice(0, 2).map((item) => `Retired or unavailable provider: ${item.reason}`).join(' · '))}</p>` : '<p class="eon-automation-note">Simulation is local. Approving a prepared step records your decision; it does not send, publish, change an account, or run an external provider action.</p>'}
    ${inInspection ? renderInspection(workflow) : ''}
  </article>`;
}

function renderInspection(workflow) {
  const latest = state.lastSimulation?.workflowId === workflow.id ? state.lastSimulation : null;
  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
  return `<section class="eon-automation-inspection" aria-label="Inspect ${escapeHtml(workflow.name)}"><h4>Review before any connection</h4><ol>${steps.map((step) => {
    const provider = getAutomationProvider(step.providerId);
    const truth = integrationTruth(provider);
    return `<li><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(provider?.name || 'Retired or unavailable provider')} · ${escapeHtml(truth.label)} · approval: ${escapeHtml(step.approval)}</span></li>`;
  }).join('')}</ol>${latest ? `<div class="eon-automation-simulation-result"><strong>Latest simulation</strong><span>${escapeHtml(latest.summary)}</span></div>` : '<p>Run a local simulation to see prepared approvals. No provider call is made.</p>'}</section>`;
}

function renderApproval(approval) {
  return `<li class="eon-automation-approval"><div><strong>${escapeHtml(approval.title)}</strong><span>${escapeHtml(approval.summary || 'Review before any external action.')}</span></div><div class="eon-automation-approval-actions"><button type="button" data-approval="${escapeHtml(approval.id)}" data-resolution="approved">Approve prepared step</button><button type="button" data-approval="${escapeHtml(approval.id)}" data-resolution="rejected">Reject</button></div></li>`;
}

function renderIntegration(provider, automation) {
  const connection = automation.connections?.[provider.id] || null;
  const truth = integrationTruth(provider, connection);
  return `<li class="eon-automation-integration"><div><strong>${escapeHtml(provider.name)}</strong><span>${escapeHtml(truth.note)}</span></div><b class="is-${escapeHtml(truth.label.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(truth.label)}</b></li>`;
}

function renderActionTaxonomy() {
  return `<section class="eon-automation-action-taxonomy" aria-labelledby="eon-automation-action-taxonomy-title"><div><p class="eon-automation-eyebrow">W362 · action taxonomy</p><h2 id="eon-automation-action-taxonomy-title">Name the effect before the workflow.</h2><p>Every future connection must classify an action as read, draft, write, publish, spend, delete or admin. In this release, all workflow execution remains local planning and simulation only.</p></div><div class="eon-automation-action-taxonomy-grid">${listEonActionClasses().map((action) => `<article><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.risk)} risk · ${escapeHtml(action.currentRuntime.replace(/-/g, ' '))}</span></article>`).join('')}</div></section>`;
}

function appDeckBlueprint() {
  const id = String(new URLSearchParams(window.location.search).get('blueprint') || state.appDeckBlueprint?.id || '').trim();
  return getEonAppDeckBlueprint(id) || state.appDeckBlueprint || null;
}

function createBlueprintWorkflow(blueprint, goal = '') {
  const templateId = String(blueprint?.workflowTemplateId || '');
  if (templateId && OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.includes(templateId)) {
    return createWorkflowFromTemplate(templateId, {
      name: blueprint.label,
      description: String(goal || blueprint.automationGoal || blueprint.summary || '').trim(),
      planner: 'official-blueprint-pack'
    });
  }
  return planWorkflowLocally(goal);
}

function render() {
  if (!root) return;
  const automation = loadAutomationState();
  const workflows = automation.workflows.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).slice(0, 8);
  const approvals = automation.approvals.filter((item) => item.status === 'pending').slice(-6).reverse();
  const templates = WORKFLOW_TEMPLATE_FAMILIES.filter((template) => template.localOnly === true).slice(0, 10);
  const integrations = INTEGRATION_SAMPLE_IDS.map((id) => getAutomationProvider(id)).filter(Boolean);
  const selectedBlueprint = appDeckBlueprint();
  const blueprintGoal = selectedBlueprint?.automationGoal || '';
  const blueprintBanner = selectedBlueprint ? `<section class="eon-automation-blueprint-handoff" aria-label="Selected App Deck Blueprint"><div><p class="eon-automation-eyebrow">App Deck Blueprint selected</p><h2>${escapeHtml(selectedBlueprint.label)}</h2><p>${escapeHtml(selectedBlueprint.summary)} You may prepare a local Project, Library template and reviewable workflow only after an explicit tap. Nothing is sent or connected.</p><div class="eon-automation-create-actions"><button type="button" class="eon-hub-primary" data-create-blueprint-workroom ${state.busy ? 'disabled' : ''}>Prepare local workroom</button><span>Creates local records only; review every draft before any manual action.</span></div></div><a class="eon-automation-ghost-link" href="/apps">Back to App Deck</a></section>` : '';

  root.innerHTML = `<section class="eon-automations-shell" aria-labelledby="eon-automations-title">
    <header class="eon-hub-top eon-automations-top"><div><p class="eon-hub-kicker">Approval-first automation</p><h1 class="eon-hub-title" id="eon-automations-title">Automations</h1><p class="eon-hub-subtitle">${escapeHtml(AUTOMATION_TRUTH?.truthfulUserFacingNote || 'Create a local work plan, test it safely, inspect every step, and pause it at any time. No provider, message, publishing, account, or external action is sent from this page.')}</p></div><button type="button" class="eon-hub-primary" data-automation-chat>Ask EONBOT</button></header>

    ${blueprintBanner}
    ${renderActionTaxonomy()}
    ${renderLockedFeatureSurface('automations')}${renderEonPremiumCapabilityPreview('automations')}

    <section class="eon-automation-create" aria-label="Create an automation">
      <div class="eon-automation-create-head"><div><label for="eon-automation-goal">What should EONAPP automate?</label><span>Creates a local draft only.</span></div><label class="eon-automation-project-picker" for="eon-automation-project">Project <select id="eon-automation-project">${projectOptions()}</select></label></div>
      <textarea id="eon-automation-goal" rows="3" placeholder="Every Monday, summarize my saved project notes and prepare a draft for review.">${escapeHtml(blueprintGoal)}</textarea>
      <div class="eon-automation-create-actions"><button type="button" class="eon-hub-primary" data-plan-goal ${state.busy ? 'disabled' : ''}>Create safe plan</button><span>Simulation cannot trigger a real provider or a background job.</span></div>
    </section>

    <section class="eon-automation-template-row" aria-label="Official local workflow templates">
      ${templates.map((template) => `<button type="button" class="eon-automation-template" data-template="${escapeHtml(template.id)}"><strong>${escapeHtml(template.label || template.name || template.id)}</strong><span>${escapeHtml(template.description || 'Build a safe starter workflow.')}</span></button>`).join('')}
    </section>

    <section class="eon-automation-grid">
      <article class="eon-automation-panel eon-automation-panel-wide"><div class="eon-automation-panel-head"><div><h2>Your workflows</h2><p>Draft, simulate, inspect, approve prepared steps, and pause. Provider setup stays explicit and separate.</p></div><a href="/projects" class="eon-automation-ghost-link">Open Projects</a></div><div class="eon-automation-flow-list">${workflows.length ? workflows.map(renderWorkflow).join('') : '<p class="eon-hub-empty">No workflows yet. Describe a repeat task above and EONBOT will create a reviewable local draft.</p>'}</div></article>
      <aside class="eon-automation-panel"><div class="eon-automation-panel-head"><div><h2>Approvals</h2><p>Approval records a decision only; no external side effect follows here.</p></div></div><ul class="eon-automation-approval-list">${approvals.length ? approvals.map(renderApproval).join('') : '<li class="eon-hub-empty">No prepared steps need your review.</li>'}</ul></aside>
    </section>

    <section class="eon-automation-panel"><div class="eon-automation-panel-head"><div><h2>Integration truth</h2><p>Provider names describe setup paths, not active connections.</p></div></div><ul class="eon-automation-integration-list">${integrations.map((provider) => renderIntegration(provider, automation)).join('')}</ul></section>

    <section class="eon-automation-status" aria-live="polite"><strong>${state.busy ? 'Working on your local plan…' : 'Automation status'}</strong><span>${escapeHtml(state.lastRun || 'Simulations and approvals remain local until a future, separately verified provider connection exists.')}</span></section>
  </section>`;
  bind();
}

function projectIdFromUi() {
  return String(root?.querySelector('#eon-automation-project')?.value || '').trim();
}

function saveAndLinkWorkflow(workflow, projectId) {
  const saved = savePlannedWorkflow({ ...workflow, projectId });
  if (projectId) {
    try { linkProjectAutomation(projectId, saved.id); } catch {}
  }
  return saved;
}

function bind() {
  root?.querySelector('[data-automation-chat]')?.addEventListener('click', () => routeToChat('Help me automate a repetitive task safely. Ask one question at a time, create a local simulation, and show which steps need explicit approval.'));
  root?.querySelector('[data-create-blueprint-workroom]')?.addEventListener('click', () => {
    if (state.busy) return;
    const blueprint = appDeckBlueprint();
    state.busy = true;
    render();
    try {
      const receipt = createBlueprintWorkroom({ blueprint });
      recordEonCoreOutcome({ kind: 'automation-proposal', route: '/automations', source: 'automations-local', receiptId: `automation-proposal:${Date.now()}`, verified: true });
      appendOperatorActivity({ source: 'workspace', status: 'ready', title: 'Blueprint local workroom prepared', detail: blueprint?.label || 'Official Blueprint', route: '/projects', metadata: { blueprintId: receipt.blueprintId, projectId: receipt.projectId, workflowId: receipt.workflowId } });
      state.lastRun = `${blueprint.label} created a local Project, Library template and approval-first workflow. No provider, publishing or external action was used.`;
    } catch (error) {
      state.lastRun = `Could not prepare the local workroom: ${String(error?.message || error)}`;
    } finally {
      state.busy = false;
      render();
    }
  });
  root?.querySelector('[data-plan-goal]')?.addEventListener('click', () => {
    const input = root.querySelector('#eon-automation-goal');
    const goal = String(input?.value || '').trim();
    if (goal.length < 8) {
      state.lastRun = 'Describe one repeat task in a little more detail so EONBOT can prepare a safe plan.';
      render();
      return;
    }
    state.busy = true;
    render();
    try {
      const blueprint = appDeckBlueprint();
      const workflow = saveAndLinkWorkflow(createBlueprintWorkflow(blueprint, goal), projectIdFromUi());
      recordEonCoreOutcome({ kind: 'automation-proposal', route: '/automations', source: 'automations-local', receiptId: `automation-proposal:${Date.now()}`, verified: true });
      appendAutomationAudit({ type: 'workflow-draft-created', workflowId: workflow.id, status: 'draft', message: blueprint ? 'Official Blueprint workflow drafted from the approval-first Automations surface.' : 'Workflow drafted from the approval-first Automations surface.' });
      appendOperatorActivity({ source: 'automation', status: 'waiting', title: 'Automation draft created', detail: workflow.name, route: '/automations', metadata: { workflowId: workflow.id, stepCount: workflow.steps.length, projectId: workflow.projectId || null } });
      state.lastRun = `${workflow.name} is a local draft${blueprint ? ' from the selected official Blueprint' : ''}. Simulate and inspect it before you consider any connection.`;
    } catch (error) {
      state.lastRun = `Could not create a safe plan: ${String(error?.message || error)}`;
    } finally {
      state.busy = false;
      render();
    }
  });
  root?.querySelectorAll('[data-template]').forEach((button) => button.addEventListener('click', () => {
    const workflow = saveAndLinkWorkflow(createWorkflowFromTemplate(button.dataset.template || 'content-production'), projectIdFromUi());
    recordEonCoreOutcome({ kind: 'automation-proposal', route: '/automations', source: 'automations-local', receiptId: `automation-proposal:${Date.now()}`, verified: true });
    appendAutomationAudit({ type: 'workflow-template-created', workflowId: workflow.id, status: 'draft', message: 'Official local workflow template created from approval-first Automations.' });
    appendOperatorActivity({ source: 'automation', status: 'waiting', title: 'Automation template ready for review', detail: workflow.name, route: '/automations', metadata: { workflowId: workflow.id, projectId: workflow.projectId || null } });
    state.lastRun = `${workflow.name} was added as a local draft. Review it, then run a simulation.`;
    render();
  }));
  root?.querySelectorAll('[data-simulate-flow]').forEach((button) => button.addEventListener('click', async () => {
    if (state.busy) return;
    state.busy = true;
    render();
    try {
      const result = await runWorkflowSimulation(button.dataset.simulateFlow || '');
      const workflow = loadAutomationState().workflows.find((item) => item.id === button.dataset.simulateFlow);
      const approvalCount = Array.isArray(result?.results) ? result.results.filter((item) => item.status === 'approval-required').length : 0;
      const simulated = Array.isArray(result?.results) ? result.results.filter((item) => item.status === 'simulated').length : 0;
      state.lastSimulation = { workflowId: workflow?.id || '', summary: `${simulated} local step(s) simulated; ${approvalCount} prepared approval(s). No external action was sent.` };
      appendOperatorActivity({ source: 'automation', status: approvalCount ? 'waiting' : 'complete', title: 'Automation simulation completed', detail: workflow?.name || 'Workflow simulation', route: '/automations', metadata: { approvals: approvalCount, simulated } });
      state.lastRun = state.lastSimulation.summary;
    } catch (error) {
      appendOperatorActivity({ source: 'automation', status: 'failed', title: 'Automation simulation needs attention', detail: String(error?.message || error), route: '/automations' });
      state.lastRun = `Simulation could not run: ${String(error?.message || error)}`;
    } finally {
      state.busy = false;
      render();
    }
  }));
  root?.querySelectorAll('[data-toggle-inspect]').forEach((button) => button.addEventListener('click', () => {
    state.inspectWorkflowId = state.inspectWorkflowId === button.dataset.toggleInspect ? '' : String(button.dataset.toggleInspect || '');
    render();
  }));
  root?.querySelectorAll('[data-toggle-pause]').forEach((button) => button.addEventListener('click', () => {
    const id = String(button.dataset.togglePause || '');
    const workflow = loadAutomationState().workflows.find((item) => item.id === id);
    if (!workflow) return;
    const status = workflow.status === 'paused' ? 'draft' : 'paused';
    upsertWorkflow({ ...workflow, status });
    appendAutomationAudit({ type: status === 'paused' ? 'workflow-paused' : 'workflow-resumed', workflowId: id, status, message: `${workflow.name} ${status === 'paused' ? 'paused' : 'resumed as a local draft'}.` });
    appendOperatorActivity({ source: 'automation', status: status === 'paused' ? 'info' : 'ready', title: `Automation ${status === 'paused' ? 'paused' : 'resumed'}`, detail: workflow.name, route: '/automations', metadata: { workflowId: id } });
    state.lastRun = status === 'paused' ? 'Workflow paused. It cannot be simulated until you resume it.' : 'Workflow resumed as a local draft. It still has no provider connection.';
    render();
  }));
  root?.querySelectorAll('[data-open-flow-chat]').forEach((button) => button.addEventListener('click', () => routeToChat(`Help me refine my automation workflow: ${button.dataset.openFlowChat}. Keep it local, approval-first, and explain the provider setup truth.`)));
  root?.querySelectorAll('[data-approval]').forEach((button) => button.addEventListener('click', () => {
    const approval = resolveAutomationApproval(button.dataset.approval || '', button.dataset.resolution || 'rejected', 'Resolved from approval-first Automations. No provider action was sent.', { explicitUserAction: true });
    if (approval) {
      appendAutomationAudit({ type: 'approval-resolved', workflowId: approval.workflowId, runId: approval.runId, status: approval.status, message: `${approval.title} ${approval.status}; no external action followed in this local flow.` });
      appendOperatorActivity({ source: 'automation', status: approval.status === 'approved' ? 'ready' : 'info', title: `Prepared step ${approval.status}`, detail: approval.title, route: '/automations', metadata: { workflowId: approval.workflowId } });
      state.lastRun = approval.status === 'approved' ? 'Prepared step approved. This records the review only; no provider request was made.' : 'Prepared step rejected. No provider request was made.';
      render();
    }
  }));
}

function initAutomationSurface() {
  const appDeckIntent = readEonAppDeckLaunchIntent();
  if (appDeckIntent?.category === 'blueprints') state.appDeckBlueprint = getEonAppDeckBlueprint(appDeckIntent.itemId);
  enterCityMode('automations', { entry: 'automations' });
  bindCityModeLinkTracking(root || document, 'automations', { entry: 'automations' });
  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAutomationSurface, { once: true });
else initAutomationSurface();
