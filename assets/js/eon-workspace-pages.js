import {
  addProjectArtifact,
  addProjectTask,
  archiveLibraryItem,
  buildLibraryItemExport,
  buildProjectHandoffExport,
  createLibraryItem,
  createProject,
  deleteLibraryItem,
  deleteProject,
  deleteProjectArtifact,
  deleteProjectTask,
  getWorkspaceSnapshot,
  getLibraryCapacityCounts,
  getProjectCapacityCounts,
  loadLibrary,
  loadProjects,
  getProjectHandoffFilename,
  recordLibraryUse,
  restoreLibraryItem,
  updateLibraryItem,
  updateProject,
  updateProjectTask
} from './utils/eon-workspace-store.js';
import { PROJECT_HANDOFF_MAX_BYTES, parseProjectHandoffText } from './utils/project-handoff-preflight.js';
import { loadAutomationState } from './utils/automation-os-store.js';
import { readEonbotJobFabricState } from './chat/eonbot-job-fabric.js';
import { projectEonWorkQueue } from './workspace/eon-work-queue-projection.js';
import { clearShareCampaignIntent, openEonShareSheet, readShareCampaignIntent } from './utils/eon-share-sheet.js';
import { createApprovalSchedule, listApprovalSchedule } from './utils/user-approved-social-scheduler.js';
import { completeCityBeginnerMission, dismissCityBeginnerMission, readCityBeginnerMissionFromSearch, returnCityBeginnerMission } from './contracts/city/city-work-mission.js';
import { getCapabilityTruth } from './capabilities/capability-truth-registry.js';
import { dismissEonbotLocalActionCard, listPendingEonbotLocalReviewCards, markEonbotLocalActionCardReviewed } from './chat/eonbot-action-cards.js';
import { listEonKernelForegroundReviewItems } from './ai-kernel/eon-ai-kernel-review-inbox.js';
import { applyEonOutcomeKitPreview, bindCreatorSuite2Workspace, renderCreatorSuite2Workspace } from './creator-suite-2/creator-suite-2-workspace.js';
import { bindCreatorEngineWorkspace, renderCreatorEngineWorkspace } from './creator/creator-engine-workspace.js';
import { bindCreatorAssetProvenanceWorkspace, renderCreatorAssetProvenanceWorkspace } from './creator/asset-provenance-workspace.js';
import { bindCreatorMediaLifecycleWorkspace, renderCreatorMediaLifecycleWorkspace } from './creator/media-lifecycle-workspace.js';
import { bindEonSharePackWorkspace, renderEonSharePackWorkspace } from './share/eon-share-pack-workspace.js';
import { bindEonRemixCardWorkspace, renderEonRemixCardWorkspace } from './share/eon-remix-card-workspace.js';
import { bindEonCollectionWorkspace, renderEonCollectionWorkspace } from './collection/eon-collection-workspace.js';
import { bindEonActionGatewayWorkspace, renderEonActionGatewayWorkspace } from './action-gateway/eon-action-gateway-workspace.js';
import { bindEonSocialConnectorsWorkspace, renderEonSocialConnectorsWorkspace } from './connectors/eon-social-connectors-workspace.js';
import { bindForgeRemoteDeployWorkspace, renderForgeRemoteDeployWorkspace } from './forge/forge-remote-deploy-workspace.js';
import { clearEonTemporaryLocalWork, inspectEonLocalPrivacy } from './local-first/eon-local-privacy-diagnostics.js';
import { clearLegacyPlaintextChatThreads } from './utils/chat-threads.js';
import { buildEonDeviceEvidenceExport, clearEonDeviceEvidenceRecords, loadEonDeviceEvidenceRecords, saveEonDeviceEvidenceRecords } from './local-first/eon-device-evidence-records.js';
import { EON_REQUIRED_DEVICE_EVIDENCE_CASES } from './local-first/eon-device-evidence-matrix.js';
import { bindCityModeLinkTracking, enterCityMode } from './contracts/city/city-mode-transition.js';
import { renderLockedFeatureSurface } from './referrals/eon-locked-feature-surface.js';
import { renderEonPremiumCapabilityPreview } from './capabilities/eon-premium-preview-surface.js';
import { recordEonCoreOutcome } from './contracts/outcomes/eon-core-outcome-authority.js';
import { buildEonProjectsW704CommandStrip, resolveEonProjectsW704CommandWorkspace } from './projects/w704/eon-projects-w704-command-workspace.js';
import { listLibraryIndexRecords } from './storage/eon-library-index.js';
import { getEonCapacityPolicy, inspectOriginStorageCapacity } from './storage/eon-capacity-authority.js';

const page = String(document.body?.dataset?.eonAppPage || document.body?.dataset?.pageType || '').toLowerCase();
const ui = { projectFormOpen: false, projectWorkspaceInitialized: false, libraryFormOpen: false, selectedProjectId: '', editingProjectId: '', editingLibraryId: '', libraryFilter: '' };
const WORKSPACE_TRUTH = getCapabilityTruth('workspace');
const REVIEW_INBOX_TRUTH = getCapabilityTruth('chat-action-cards');

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function formatDate(value = '') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved locally';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function routeToChat(prompt = '') {
  const text = String(prompt || '').trim();
  try { if (text) localStorage.setItem('eon:chat:prefill:v1', text); } catch {}
  const anchor = document.createElement('a');
  anchor.href = `/chat${text ? `?q=${encodeURIComponent(text)}` : ''}`;
  anchor.hidden = true;
  anchor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadProjectHandoff(projectId = '') {
  const payload = buildProjectHandoffExport(projectId);
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([body], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getProjectHandoffFilename(projectId);
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}


function downloadLibraryItem(itemId = '') {
  const payload = buildLibraryItemExport(itemId);
  const body = `${JSON.stringify(payload, null, 2)}
`;
  const blob = new Blob([body], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eonapp-library-${String(itemId || 'item').replace(/[^a-z0-9._-]+/gi, '-')}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderProjectHandoffReview() {
  return `<section class="eon-project-handoff-review" aria-labelledby="eon-project-handoff-review-title"><h2 id="eon-project-handoff-review-title">Review a local handoff</h2><p>Choose a project-handoff JSON file to inspect its ordinary-work summary locally. This review never imports, merges, saves, restores, overwrites, publishes, delivers, or proves ownership of anything.</p><label class="eon-profile-field">Choose local handoff JSON<input type="file" accept="application/json,.json" data-project-handoff-file /></label><div class="eon-record-actions"><button type="button" class="eon-record-button" data-project-handoff-review>Review handoff</button><a class="eon-record-button" href="/capsule">Use encrypted backup for recovery</a></div><p class="eon-profile-status" role="status" aria-live="polite" data-project-handoff-status></p><div data-project-handoff-summary></div></section>`;
}

function renderProjectHandoffReviewResult(result = {}) {
  if (!result?.ok || !result.summary) return '';
  const summary = result.summary;
  return `<dl class="eon-project-handoff-summary"><div><dt>Project</dt><dd>${escapeHtml(summary.title)}</dd></div><div><dt>Local record</dt><dd>${escapeHtml(summary.id)}</dd></div><div><dt>Tasks</dt><dd>${Number(summary.taskCount || 0)}</dd></div><div><dt>Artefacts</dt><dd>${Number(summary.artifactCount || 0)}</dd></div><div><dt>Recovery boundary</dt><dd>Review only · encrypted backup: ${escapeHtml(summary.recoveryRoute || '/capsule')}</dd></div></dl>`;
}

async function reviewProjectHandoffFile(root) {
  const file = root.querySelector('[data-project-handoff-file]')?.files?.[0];
  const status = root.querySelector('[data-project-handoff-status]');
  const summary = root.querySelector('[data-project-handoff-summary]');
  const show = (message = '', detail = '') => {
    if (status) status.textContent = String(message || '');
    if (summary) summary.innerHTML = detail;
  };
  if (!file) {
    show('Choose a local project handoff JSON file first. Nothing was imported.');
    return;
  }
  if (Number(file.size || 0) > PROJECT_HANDOFF_MAX_BYTES) {
    show('That file is too large for the local review-only handoff inspector. Nothing was imported.');
    return;
  }
  try {
    show('Reviewing the selected local file…');
    const result = parseProjectHandoffText(await file.text());
    show(result.message, renderProjectHandoffReviewResult(result));
  } catch {
    show('That file could not be reviewed. Nothing was imported.');
  }
}

function statusLabel(status = '') {
  return String(status || 'active').replace(/-/g, ' ');
}

function renderProjectForm(error = '') {
  return `<form class="eon-record-form" data-project-form ${ui.projectFormOpen ? '' : 'hidden'}>
    <div class="eon-record-form-head"><div><h2>Create a local project</h2><p>One clear outcome, normal tasks, and ordinary work artefacts. This is not a cloud account or a Vault.</p></div><button class="eon-record-button" type="button" data-project-cancel>Close</button></div>
    <label>Project title<input name="title" maxlength="180" required placeholder="Launch the new creator workflow" /></label>
    <label>Outcome summary<textarea name="summary" maxlength="4000" placeholder="What does complete look like? Keep credentials and security-sensitive information in Vault."></textarea></label>
    <label>Initial status<select name="status"><option value="active">Active</option><option value="paused">Paused</option><option value="complete">Complete</option></select></label>
    <p class="eon-record-form-note">Project and Library entries reject secret-looking values such as API keys, access tokens, seed phrases, and passwords.</p>
    <p class="eon-record-form-error" data-project-form-error>${escapeHtml(error)}</p>
    <div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Create project</button><button class="eon-record-button" type="button" data-project-chat>Plan with EONBOT first</button></div>
  </form>`;
}

function renderProjectEdit(project) {
  return `<form class="eon-record-form" data-project-edit-form="${escapeHtml(project.id)}">
    <div class="eon-record-form-head"><div><h2>Edit project</h2><p>Update the local summary or status. No changes leave this browser.</p></div><button class="eon-record-button" type="button" data-project-edit-cancel>Close</button></div>
    <label>Project title<input name="title" maxlength="180" required value="${escapeHtml(project.title)}" /></label>
    <label>Outcome summary<textarea name="summary" maxlength="4000">${escapeHtml(project.summary)}</textarea></label>
    <label>Status<select name="status">${['active','paused','complete'].map((status) => `<option value="${status}"${project.status === status ? ' selected' : ''}>${statusLabel(status)}</option>`).join('')}</select></label>
    <p class="eon-record-form-error" data-project-edit-error></p>
    <div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Save changes</button><button class="eon-record-button is-danger" type="button" data-project-delete="${escapeHtml(project.id)}">Delete project</button></div>
  </form>`;
}

function renderTask(project, task) {
  return `<li class="eon-project-task"><div class="eon-project-task-copy"><strong>${escapeHtml(task.title)}</strong>${task.note ? `<span>${escapeHtml(task.note)}</span>` : ''}</div><div class="eon-project-task-controls"><button type="button" data-task-cycle="${escapeHtml(task.id)}" data-project-id="${escapeHtml(project.id)}">${escapeHtml(statusLabel(task.status))}</button><button type="button" data-task-delete="${escapeHtml(task.id)}" data-project-id="${escapeHtml(project.id)}">Remove</button></div></li>`;
}

function renderArtifact(project, artifact) {
  return `<li class="eon-project-artifact"><div class="eon-project-artifact-copy"><strong>${escapeHtml(artifact.title)}</strong><span>${escapeHtml(artifact.type)} · ${artifact.content ? escapeHtml(artifact.content) : 'No stored text'}</span></div><div class="eon-project-artifact-controls"><button type="button" data-artifact-delete="${escapeHtml(artifact.id)}" data-project-id="${escapeHtml(project.id)}">Remove</button></div></li>`;
}

function renderProjectDetail(project) {
  const workflows = loadAutomationState().workflows.filter((workflow) => workflow.projectId === project.id);
  return `<div class="eon-project-detail">
    <section><h3>Tasks</h3><form class="eon-project-composer" data-task-form="${escapeHtml(project.id)}"><input name="title" maxlength="180" required placeholder="Add a normal task" /><button type="submit">Add task</button></form><ul class="eon-project-task-list">${project.tasks.length ? project.tasks.map((task) => renderTask(project, task)).join('') : '<li class="eon-hub-empty">No tasks yet.</li>'}</ul></section>
    <section><h3>Work artefacts</h3><form class="eon-record-form" data-artifact-form="${escapeHtml(project.id)}"><label>Type<select name="type"><option value="note">Note</option><option value="output">Output</option><option value="brief">Brief</option><option value="link">Link reference</option></select></label><label>Title<input name="title" maxlength="180" required placeholder="Research notes" /></label><label>Text or link reference<textarea name="content" maxlength="12000" placeholder="Save a normal note, output summary, or public link. Do not paste API keys, passwords, tokens, or wallet recovery material."></textarea></label><p class="eon-record-form-error" data-artifact-error></p><div class="eon-record-form-actions"><button class="eon-record-button" type="submit">Attach artefact</button></div></form><ul class="eon-project-artifact-list">${project.artifacts.length ? project.artifacts.map((artifact) => renderArtifact(project, artifact)).join('') : '<li class="eon-hub-empty">No artefacts attached yet.</li>'}</ul></section>
    <section><h3>Local handoff</h3><p>Export a readable JSON record of this project’s ordinary tasks and artefacts. It is not a cloud sync, restore file, ownership certificate, publication, delivery, payment, token, or completion claim. Use Vault’s encrypted full-profile backup for recovery.</p><div class="eon-record-actions"><button class="eon-record-button" type="button" data-project-export="${escapeHtml(project.id)}">Export local project handoff</button><a class="eon-record-button" href="/capsule">Open encrypted backup</a></div></section>
    <section><h3>Linked automations</h3><p>${workflows.length ? `${workflows.length} local workflow${workflows.length === 1 ? '' : 's'} linked. Use Automations to simulate, inspect, approve prepared steps, pause, or resume.` : 'No automation is linked. Select this project while creating a local automation draft.'}</p>${workflows.length ? `<div class="eon-record-actions"><a class="eon-record-button" href="/automations">Open Automations</a></div>` : ''}</section>
  </div>`;
}

function renderProjectCard(project) {
  const selected = ui.selectedProjectId === project.id;
  const editing = ui.editingProjectId === project.id;
  const completed = project.tasks.filter((task) => task.status === 'done').length;
  return `<article class="eon-record-card"><div class="eon-record-card-head"><div><span class="eon-record-status is-${escapeHtml(project.status)}">${escapeHtml(statusLabel(project.status))}</span><h2>${escapeHtml(project.title)}</h2><p class="eon-record-summary">${project.summary ? escapeHtml(project.summary) : 'No outcome summary saved yet.'}</p></div><button class="eon-record-button" type="button" data-project-inspect="${escapeHtml(project.id)}">${selected ? 'Hide details' : 'Open'}</button></div>
    <div class="eon-record-meta"><span>${project.tasks.length} task${project.tasks.length === 1 ? '' : 's'}</span><span>${completed} complete</span><span>${project.artifacts.length} artefact${project.artifacts.length === 1 ? '' : 's'}</span><span>${project.automationIds.length} automation link${project.automationIds.length === 1 ? '' : 's'}</span><span>Updated ${escapeHtml(formatDate(project.updatedAt))}</span></div>
    <div class="eon-record-actions"><button class="eon-record-button" type="button" data-project-edit="${escapeHtml(project.id)}">Edit</button><button class="eon-record-button" type="button" data-project-lifecycle="${project.status === 'complete' ? 'active' : 'complete'}" data-project-id="${escapeHtml(project.id)}">${project.status === 'complete' ? 'Restore active' : 'Complete / archive'}</button><button class="eon-record-button" type="button" data-project-export="${escapeHtml(project.id)}">Export handoff</button><button class="eon-record-button" type="button" data-project-chat="${escapeHtml(project.title)}">Ask EONBOT</button></div>
    ${editing ? renderProjectEdit(project) : ''}${selected ? renderProjectDetail(project) : ''}
  </article>`;
}

function renderProjectCommandStrip(model) {
  const strip = buildEonProjectsW704CommandStrip(model);
  const secondary = strip.secondaryActions.map((action) => `<a class="eon-record-button" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`).join('');
  const primary = strip.state === 'ready'
    ? `<button class="eon-hub-primary" type="button" data-project-command-resume="${escapeHtml(strip.primaryAction.projectId)}">${escapeHtml(strip.primaryAction.label)}</button>`
    : `<button class="eon-hub-primary" type="button" data-project-command-create>${escapeHtml(strip.primaryAction.label)}</button>`;
  return `<section class="eon-project-command-strip" aria-label="Project command centre" data-project-command-strip data-state="${escapeHtml(strip.state)}"><div><span>${escapeHtml(strip.eyebrow)}</span><strong>${escapeHtml(strip.title)}</strong><small>${escapeHtml(strip.detail)}</small></div><nav aria-label="Project workspace actions">${primary}${secondary}</nav></section>`;
}

function renderProjects() {
  const root = document.getElementById('eon-projects-root');
  if (!root) return;
  const state = loadProjects();
  const workspace = resolveEonProjectsW704CommandWorkspace({ projects: state.projects, selectedProjectId: ui.selectedProjectId });
  if (!ui.projectWorkspaceInitialized) {
    let createRequested = false;
    try { createRequested = new URLSearchParams(globalThis.location?.search || '').get('new') === '1'; } catch {}
    ui.projectFormOpen = createRequested || ui.projectFormOpen;
    ui.selectedProjectId = createRequested ? '' : workspace.activeProjectId;
    ui.projectWorkspaceInitialized = true;
  }
  const commandStrip = renderProjectCommandStrip(resolveEonProjectsW704CommandWorkspace({ projects: state.projects, selectedProjectId: ui.selectedProjectId }));
  const cityMission = renderCityBeginnerMission();
  root.innerHTML = `<section class="eon-records-shell">${cityMission}${commandStrip}<div class="eon-records-grid"><section class="eon-records-panel eon-project-workspace-panel"><div class="eon-records-panel-head"><div><h2>Project workspace</h2><p>Open one project here to manage its outcome, tasks, ordinary outputs and reviewed next actions. ${getProjectCapacityCounts().activeCount}/${getEonCapacityPolicy('ordinary-projects')?.limit || 160} active · ${getProjectCapacityCounts().archivedCount} complete/archived · ${getProjectCapacityCounts().totalCount} total; reaching the active limit never removes older work.</p></div><button class="eon-record-button" type="button" data-project-toggle-form>${ui.projectFormOpen ? 'Close form' : 'New project'}</button></div>${renderProjectForm()}<div class="eon-record-list">${state.projects.length ? state.projects.map(renderProjectCard).join('') : '<p class="eon-hub-empty">No projects yet. Start with one outcome, then add the tasks and normal work artefacts that matter.</p>'}</div></section><aside class="eon-records-panel eon-project-utility-panel"><h2>Workspace utilities</h2><p>Library keeps reusable content. Vault holds security-sensitive material. Automations remain review-first and Projects do not claim cross-device sync.</p><div class="eon-record-actions"><a class="eon-record-button" href="/library">Library</a><a class="eon-record-button" href="/automations">Automations</a><a class="eon-record-button" href="/vault">Backup</a></div>${renderLockedFeatureSurface('projects', { compact: true })}${renderEonPremiumCapabilityPreview('projects', { compact: true })}${renderProjectHandoffReview()}</aside></div></section>`;
  bindProjects(root);
  bindCityBeginnerMission(root);
}

function bindProjects(root) {
  const createProjectButton = document.querySelector('[data-project-create]');
  if (createProjectButton) createProjectButton.onclick = () => { ui.projectFormOpen = true; renderProjects(); root.querySelector('input[name="title"]')?.focus(); };
  root.querySelector('[data-project-toggle-form]')?.addEventListener('click', () => { ui.projectFormOpen = !ui.projectFormOpen; renderProjects(); });
  root.querySelector('[data-project-command-create]')?.addEventListener('click', () => { ui.projectFormOpen = true; renderProjects(); root.querySelector('input[name="title"]')?.focus(); });
  root.querySelector('[data-project-command-resume]')?.addEventListener('click', (event) => { ui.selectedProjectId = event.currentTarget.dataset.projectCommandResume || ''; ui.editingProjectId = ''; renderProjects(); });
  root.querySelector('[data-project-cancel]')?.addEventListener('click', () => { ui.projectFormOpen = false; renderProjects(); });
  root.querySelector('[data-project-chat]')?.addEventListener('click', () => routeToChat('Help me break my goal into a simple project plan with an outcome, a few tasks, and a safe next step.'));
  root.querySelector('[data-project-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const project = createProject({ title: form.elements.title.value, summary: form.elements.summary.value, status: form.elements.status.value });
      recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: `project-shell:${Date.now()}`, verified: true });
      ui.projectFormOpen = false;
      ui.selectedProjectId = project.id;
      renderProjects();
    } catch (error) {
      const host = root.querySelector('[data-project-form-error]');
      if (host) host.textContent = String(error?.message || error);
    }
  });
  root.querySelectorAll('[data-project-inspect]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.projectInspect; const opening = ui.selectedProjectId !== id; ui.selectedProjectId = opening ? id : ''; ui.editingProjectId = ''; if (opening) recordEonCoreOutcome({ kind: 'project-resume', route: '/projects', source: 'projects-local', receiptId: `project-resume:${Date.now()}`, verified: true }); renderProjects(); }));
  root.querySelectorAll('[data-project-edit]').forEach((button) => button.addEventListener('click', () => { ui.editingProjectId = button.dataset.projectEdit; ui.selectedProjectId = ''; renderProjects(); }));
  root.querySelectorAll('[data-project-edit-cancel]').forEach((button) => button.addEventListener('click', () => { ui.editingProjectId = ''; renderProjects(); }));
  root.querySelectorAll('[data-project-edit-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      updateProject(form.dataset.projectEditForm, { title: form.elements.title.value, summary: form.elements.summary.value, status: form.elements.status.value });
      ui.editingProjectId = ''; renderProjects();
    } catch (error) {
      const host = form.querySelector('[data-project-edit-error]');
      if (host) host.textContent = String(error?.message || error);
    }
  }));
  root.querySelectorAll('[data-project-delete]').forEach((button) => button.addEventListener('click', () => { if (!window.confirm('Delete this local project and its saved tasks and artefacts?')) return; deleteProject(button.dataset.projectDelete); ui.selectedProjectId = ''; ui.editingProjectId = ''; renderProjects(); }));
  root.querySelectorAll('[data-project-lifecycle]').forEach((button) => button.addEventListener('click', () => { try { updateProject(button.dataset.projectId, { status: button.dataset.projectLifecycle }); renderProjects(); } catch (error) { window.alert(String(error?.message || error)); } }));
  root.querySelectorAll('[data-project-chat]').forEach((button) => button.addEventListener('click', () => routeToChat(`Help me move this project forward: ${button.dataset.projectChat}. Start with the highest-value next task.`)));
  root.querySelectorAll('[data-project-export]').forEach((button) => button.addEventListener('click', () => {
    try { downloadProjectHandoff(button.dataset.projectExport); } catch (error) { window.alert(String(error?.message || 'The local project handoff could not be prepared.')); }
  }));
  root.querySelector('[data-project-handoff-review]')?.addEventListener('click', () => { void reviewProjectHandoffFile(root); });
  root.querySelectorAll('[data-task-form]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); try { addProjectTask(form.dataset.taskForm, { title: form.elements.title.value }); renderProjects(); } catch (error) { window.alert(String(error?.message || error)); } }));
  root.querySelectorAll('[data-task-cycle]').forEach((button) => button.addEventListener('click', () => { const state = loadProjects(); const project = state.projects.find((item) => item.id === button.dataset.projectId); const task = project?.tasks.find((item) => item.id === button.dataset.taskCycle); if (!task) return; const next = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo'; updateProjectTask(project.id, task.id, { status: next }); renderProjects(); }));
  root.querySelectorAll('[data-task-delete]').forEach((button) => button.addEventListener('click', () => { deleteProjectTask(button.dataset.projectId, button.dataset.taskDelete); renderProjects(); }));
  root.querySelectorAll('[data-artifact-form]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); try { addProjectArtifact(form.dataset.artifactForm, { type: form.elements.type.value, title: form.elements.title.value, content: form.elements.content.value }); renderProjects(); } catch (error) { const host = form.querySelector('[data-artifact-error]'); if (host) host.textContent = String(error?.message || error); } }));
  root.querySelectorAll('[data-artifact-delete]').forEach((button) => button.addEventListener('click', () => { deleteProjectArtifact(button.dataset.projectId, button.dataset.artifactDelete); renderProjects(); }));
}

function renderLibraryForm(item = null, error = '') {
  const editing = Boolean(item);
  return `<form class="eon-record-form" data-library-form${editing ? `="${escapeHtml(item.id)}"` : ''} ${ui.libraryFormOpen || editing ? '' : 'hidden'}>
    <div class="eon-record-form-head"><div><h2>${editing ? 'Edit local Library item' : 'Save a local Library item'}</h2><p>Save reusable normal work only. This browser profile is not a Vault or cross-device sync.</p></div><button class="eon-record-button" type="button" data-library-cancel>Close</button></div>
    <label>Type<select name="type">${['note','template','prompt','output'].map((type) => `<option value="${type}"${item?.type === type ? ' selected' : ''}>${type}</option>`).join('')}</select></label>
    <label>Title<input name="title" maxlength="180" required value="${escapeHtml(item?.title || '')}" placeholder="Reusable launch brief" /></label>
    <label>Content<textarea name="content" maxlength="12000" placeholder="Save a useful note, prompt, template, or output. Do not paste API keys, passwords, access tokens, or recovery material.">${escapeHtml(item?.content || '')}</textarea></label>
    <label>Tags (comma separated)<input name="tags" maxlength="600" value="${escapeHtml((item?.tags || []).join(', '))}" placeholder="creator, launch" /></label>
    <p class="eon-record-form-note">Secret-looking input is rejected. Use Vault for security-sensitive records.</p><p class="eon-record-form-error" data-library-form-error>${escapeHtml(error)}</p>
    <div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">${editing ? 'Save changes' : 'Save item'}</button>${editing ? `<button class="eon-record-button is-danger" type="button" data-library-delete="${escapeHtml(item.id)}">Delete</button>` : ''}</div>
  </form>`;
}

function renderLibraryItem(item) {
  const editing = ui.editingLibraryId === item.id;
  const archived = item.lifecycleState === 'archived';
  return `<article class="eon-record-card${archived ? ' is-archived' : ''}"><div class="eon-record-card-head"><div><span class="eon-library-item-type">${escapeHtml(item.type)} · ${archived ? 'Archived' : 'Active'}</span><h2>${escapeHtml(item.title)}</h2><p>Used ${Number(item.useCount || 0)} time${Number(item.useCount || 0) === 1 ? '' : 's'} · saved ${escapeHtml(formatDate(item.updatedAt))}</p></div><button class="eon-record-button" type="button" data-library-use="${escapeHtml(item.id)}"${archived ? ' disabled' : ''}>Use in chat</button></div><pre class="eon-library-content">${escapeHtml(item.content || 'No saved content.')}</pre>${item.tags.length ? `<div class="eon-library-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<div class="eon-record-actions"><button class="eon-record-button" type="button" data-library-edit="${escapeHtml(item.id)}">Edit</button><button class="eon-record-button" type="button" data-library-lifecycle="${archived ? 'active' : 'archived'}" data-library-id="${escapeHtml(item.id)}">${archived ? 'Restore' : 'Archive'}</button><button class="eon-record-button" type="button" data-library-export="${escapeHtml(item.id)}">Export</button><button class="eon-record-button is-danger" type="button" data-library-delete="${escapeHtml(item.id)}">Delete</button></div>${editing ? renderLibraryForm(item) : ''}</article>`;
}

function renderLibrary() {
  const root = document.getElementById('eon-library-root');
  if (!root) return;
  const state = loadLibrary();
  const query = ui.libraryFilter.trim().toLowerCase();
  const items = state.items.filter((item) => !query || [item.title, item.type, item.tags.join(' '), item.content].join(' ').toLowerCase().includes(query));
  const unifiedRecords = listLibraryIndexRecords();
  const libraryCounts = getLibraryCapacityCounts();
  const libraryLimit = getEonCapacityPolicy('ordinary-library')?.limit || 500;
  root.innerHTML = `<section class="eon-records-shell"><div class="eon-records-grid"><section class="eon-records-panel"><div class="eon-records-panel-head"><div><h2>Reusable local work</h2><p>Use saved prompts, templates, notes, and outputs in Chat. Files are not uploaded from this page and sensitive material belongs in Vault.</p></div><button class="eon-record-button" type="button" data-library-toggle-form>${ui.libraryFormOpen ? 'Close form' : 'Save item'}</button></div>${renderLibraryForm()}<div class="eon-library-toolbar"><input class="eon-library-filter" data-library-filter value="${escapeHtml(ui.libraryFilter)}" placeholder="Filter local notes, templates, prompts, outputs" /><span class="eon-hub-empty">${items.length} shown · ${libraryCounts.activeCount}/${libraryLimit} active · ${libraryCounts.archivedCount} archived · ${libraryCounts.totalCount} total · ${unifiedRecords.length} indexed</span></div><div class="eon-record-list">${items.length ? items.map(renderLibraryItem).join('') : '<p class="eon-hub-empty">No matching Library items. Save a normal note, reusable prompt, template, or generated output.</p>'}</div></section><aside class="eon-records-panel"><h2>Unified local Library</h2><p>The index also tracks Project artifacts and Creator assets without copying their content bodies. Capacity blocks new writes and never evicts older work.</p><p class="eon-hub-empty" data-library-storage-capacity>Checking this browser’s storage safety reserve…</p><div class="eon-record-actions"><a class="eon-record-button" href="/projects">Open Projects</a><button class="eon-record-button" type="button" data-library-chat>Ask EONBOT</button></div><details class="eon-workspace-advanced"><summary>Data and recovery</summary><p>Library stores ordinary reusable work in this browser. Provider credentials and sensitive material belong in Vault; encrypted recovery uses Capsule.</p><div class="eon-record-actions"><a class="eon-record-button" href="/vault">Open Vault</a><a class="eon-record-button" href="/capsule">Open Capsule</a></div></details></aside></div></section>`;
  bindLibrary(root);
  void inspectOriginStorageCapacity().then((capacity) => {
    const host = root.querySelector('[data-library-storage-capacity]');
    if (!host) return;
    if (!capacity.available) host.textContent = 'Browser quota reporting is unavailable. Durable writes still fail closed on storage errors.';
    else {host.textContent = capacity.writeAuthorized
      ? `Storage reserve available: ${Math.round(capacity.remainingBytes / 1048576)} MB remains; ${Math.round(capacity.reserveBytes / 1048576)} MB is reserved.`
      : `Storage reserve is low. New durable writes should pause; ${Math.round(capacity.remainingBytes / 1048576)} MB remains.`;}
  });
}

function bindLibrary(root) {
  const createLibraryButton = document.querySelector('[data-library-create]');
  if (createLibraryButton) createLibraryButton.onclick = () => { ui.libraryFormOpen = true; renderLibrary(); root.querySelector('input[name="title"]')?.focus(); };
  root.querySelector('[data-library-toggle-form]')?.addEventListener('click', () => { ui.libraryFormOpen = !ui.libraryFormOpen; ui.editingLibraryId = ''; renderLibrary(); });
  root.querySelectorAll('[data-library-cancel]').forEach((button) => button.addEventListener('click', () => { ui.libraryFormOpen = false; ui.editingLibraryId = ''; renderLibrary(); }));
  root.querySelector('[data-library-chat]')?.addEventListener('click', () => routeToChat('Help me turn my current work into a reusable template or prompt. Keep it clear and do not include credentials.'));
  root.querySelectorAll('[data-library-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const payload = { type: form.elements.type.value, title: form.elements.title.value, content: form.elements.content.value, tags: form.elements.tags.value };
      if (form.dataset.libraryForm) updateLibraryItem(form.dataset.libraryForm, payload); else createLibraryItem(payload);
      ui.libraryFormOpen = false; ui.editingLibraryId = ''; renderLibrary();
    } catch (error) {
      const host = form.querySelector('[data-library-form-error]'); if (host) host.textContent = String(error?.message || error);
    }
  }));
  root.querySelectorAll('[data-library-edit]').forEach((button) => button.addEventListener('click', () => { ui.editingLibraryId = button.dataset.libraryEdit; ui.libraryFormOpen = false; renderLibrary(); }));
  root.querySelectorAll('[data-library-delete]').forEach((button) => button.addEventListener('click', () => { if (!window.confirm('Delete this local Library item?')) return; deleteLibraryItem(button.dataset.libraryDelete); ui.editingLibraryId = ''; renderLibrary(); }));
  root.querySelectorAll('[data-library-lifecycle]').forEach((button) => button.addEventListener('click', () => {
    try {
      if (button.dataset.libraryLifecycle === 'archived') archiveLibraryItem(button.dataset.libraryId);
      else restoreLibraryItem(button.dataset.libraryId);
      renderLibrary();
    } catch (error) { window.alert(String(error?.message || error)); }
  }));
  root.querySelectorAll('[data-library-export]').forEach((button) => button.addEventListener('click', () => {
    try { downloadLibraryItem(button.dataset.libraryExport); }
    catch (error) { window.alert(String(error?.message || error)); }
  }));
  root.querySelectorAll('[data-library-use]').forEach((button) => button.addEventListener('click', () => { try { const item = recordLibraryUse(button.dataset.libraryUse); recordEonCoreOutcome({ kind: 'library-item-reused', route: '/library', source: 'library-local-use', receiptId: `library-item-reused:${item.id}:${Date.now()}`, verified: true }); routeToChat(`Use this saved ${item.type} as context. Keep the original wording unless I ask to revise it:\n\n${item.content}`); } catch (error) { window.alert(String(error?.message || error)); } }));
  root.querySelector('[data-library-filter]')?.addEventListener('input', (event) => {
    const input = event.currentTarget;
    const cursor = input.selectionStart ?? input.value.length;
    ui.libraryFilter = input.value;
    renderLibrary();
    const replacement = document.querySelector('[data-library-filter]');
    if (replacement) {
      replacement.focus();
      replacement.setSelectionRange(cursor, cursor);
    }
  });
}

function renderWorkspaceCampaignBrief() {
  const intent = readShareCampaignIntent();
  if (!intent?.draft?.url) return '';
  const draft = intent.draft;
  return `<section class="eon-workspace-campaign eon-hub-card eon-hub-card-full" aria-labelledby="eon-workspace-campaign-title"><div><p class="eon-hub-kicker">Local campaign brief</p><h2 id="eon-workspace-campaign-title">${escapeHtml(draft.label || 'Share draft')}</h2><p>This is a reusable local draft from Invite &amp; Share Center. It does not publish anything, connect a social account, track clicks, or activate a reward, payout, affiliate, or commission.</p></div><div class="eon-workspace-campaign-copy"><label>Signed public link<input type="text" value="${escapeHtml(draft.url)}" readonly data-workspace-campaign-url /></label><label>Draft message<textarea readonly data-workspace-campaign-message>${escapeHtml(draft.message || '')}</textarea></label></div><div class="eon-workspace-campaign-actions"><button type="button" class="eon-hub-primary" data-workspace-campaign-chat>Refine in EONBOT</button><button type="button" data-workspace-campaign-copy>Copy link</button><button type="button" data-workspace-campaign-schedule>Create review schedule</button><button type="button" data-workspace-campaign-clear>Clear local brief</button></div></section>`;
}

function missionOutcomeCopy(receipt) {
  const outcome = String(receipt?.outcome || '');
  if (outcome === 'project-created') return 'Your local Project was created only after your explicit choice.';
  if (outcome === 'workspace-brief-created') return 'Your local Project brief was created only after your explicit choice.';
  return 'The local mission recorded its truthful outcome. Nothing was uploaded, published, sent to EONBOT, or converted into a reward.';
}

function activeCityBeginnerMissionForPage() {
  const result = readCityBeginnerMissionFromSearch(globalThis.location?.search || '');
  if (!result.ok || !result.receipt || result.receipt.state === 'dismissed') return null;
  const expectedRoute = page === 'projects' ? '/projects' : page === 'workspace' ? '/workspace' : '';
  if (!expectedRoute || result.receipt.destination !== expectedRoute) return null;
  return result.receipt;
}

function renderCityBeginnerMission() {
  const receipt = activeCityBeginnerMissionForPage();
  if (!receipt) return '';
  const returnHref = `${receipt.returnRoute}?cityMission=${encodeURIComponent(receipt.id)}`;
  const isProjectMission = receipt.missionId === 'first-project';
  const heading = isProjectMission ? 'City mission · create one real Project' : 'City mission · create one useful brief';
  const titleLabel = isProjectMission ? 'What do you want to make or improve?' : 'What do you want to build or improve?';
  const titlePlaceholder = isProjectMission ? 'A simple website for my business' : 'A clear first version with a short plan and next steps';
  const summaryLabel = isProjectMission ? 'What would make this Project useful?' : 'What would a useful first outcome look like?';
  const summaryPlaceholder = isProjectMission ? 'A real outcome, a few normal tasks, and a next step.' : 'A clear first version with a short plan and next steps.';
  if (receipt.state === 'completed') {
    return `<section class="eon-city-work-mission eon-hub-card eon-hub-card-full" data-city-work-mission-id="${escapeHtml(receipt.id)}" aria-labelledby="eon-city-work-mission-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">City mission · local outcome recorded</p><h2 id="eon-city-work-mission-title">${escapeHtml(receipt.missionLabel)}</h2><p>${escapeHtml(missionOutcomeCopy(receipt))}</p></div><span class="eon-record-status is-complete">Outcome recorded</span></div><div class="eon-record-actions"><a class="eon-hub-primary" href="/projects">Open Projects</a><a class="eon-record-button" href="${escapeHtml(returnHref)}" data-city-work-mission-return="${escapeHtml(receipt.id)}">Return to City Play</a></div></section>`;
  }
  return `<section class="eon-city-work-mission eon-hub-card eon-hub-card-full" data-city-work-mission-id="${escapeHtml(receipt.id)}" aria-labelledby="eon-city-work-mission-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">${escapeHtml(heading)}</p><h2 id="eon-city-work-mission-title">${escapeHtml(receipt.missionLabel)}</h2><p>${escapeHtml(receipt.purpose)} This receipt contains no outcome text; you decide what to save next.</p></div><span class="eon-record-status is-active">Ready</span></div><div class="eon-city-work-mission-form"><label>${escapeHtml(titleLabel)}<input name="cityMissionTitle" maxlength="180" required placeholder="${escapeHtml(titlePlaceholder)}" data-city-work-mission-title /></label><label>${escapeHtml(summaryLabel)}<textarea name="cityMissionSummary" maxlength="4000" placeholder="${escapeHtml(summaryPlaceholder)}" data-city-work-mission-summary></textarea></label><p class="eon-record-form-note">This creates one ordinary local Project only after you choose Save. Keep credentials and sensitive values in Vault.</p><p class="eon-record-form-error" data-city-work-mission-error></p><div class="eon-record-actions"><button type="button" class="eon-hub-primary" data-city-work-mission-create="${escapeHtml(receipt.id)}">Save local ${isProjectMission ? 'Project' : 'project brief'}</button><button type="button" class="eon-record-button" data-city-work-mission-chat="${escapeHtml(receipt.id)}">Ask EONBOT first</button><a class="eon-record-button" href="${escapeHtml(returnHref)}" data-city-work-mission-return="${escapeHtml(receipt.id)}">Return to City Play</a><button type="button" class="eon-record-button" data-city-work-mission-dismiss="${escapeHtml(receipt.id)}">Dismiss mission</button></div></div></section>`;
}

function bindCityBeginnerMission(root) {
  const card = root.querySelector('[data-city-work-mission-id]');
  if (!card) return;
  const setError = (message = '') => {
    const host = card.querySelector('[data-city-work-mission-error]');
    if (host) host.textContent = String(message || '');
  };
  card.querySelector('[data-city-work-mission-create]')?.addEventListener('click', (event) => {
    const receiptId = event.currentTarget.dataset.cityWorkMissionCreate;
    const receipt = activeCityBeginnerMissionForPage();
    const title = card.querySelector('[data-city-work-mission-title]')?.value || '';
    const summary = card.querySelector('[data-city-work-mission-summary]')?.value || '';
    try {
      if (!receipt || receipt.id !== receiptId) throw new Error('This local mission receipt is no longer available. Return to City Play and prepare a fresh route.');
      if (!String(title).trim()) throw new Error('Name one outcome before saving a local Project.');
      createProject({ title, summary, status: 'active' });
      const outcome = receipt.missionId === 'first-project' ? 'project-created' : 'workspace-brief-created';
      const completed = completeCityBeginnerMission(receiptId, outcome);
      if (!completed.ok) throw new Error('The local mission receipt expired before the Project could be marked. Your saved Project remains local.');
      renderCurrentPage();
    } catch (error) {
      setError(String(error?.message || error));
    }
  });
  card.querySelector('[data-city-work-mission-chat]')?.addEventListener('click', () => {
    routeToChat('Help me define one clear project outcome and a few safe first tasks. Ask one question at a time. Do not request credentials or sensitive information.');
  });
  card.querySelector('[data-city-work-mission-dismiss]')?.addEventListener('click', (event) => {
    dismissCityBeginnerMission(event.currentTarget.dataset.cityWorkMissionDismiss);
    try { globalThis.history?.replaceState?.({}, '', page === 'projects' ? '/projects' : '/workspace'); } catch {}
    renderCurrentPage();
  });
  card.querySelectorAll('[data-city-work-mission-return]').forEach((link) => link.addEventListener('click', (event) => {
    const returned = returnCityBeginnerMission(event.currentTarget.dataset.cityWorkMissionReturn);
    if (!returned.ok) {
      event.preventDefault();
      setError('This local mission receipt is no longer available. You can still return through City Lite.');
    }
  }));
}


function renderManualSubmissionDesk() {
  return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-manual-submission-desk-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Manual Submission Desk</p><h2 id="eon-manual-submission-desk-title">Take reviewed local work to the service you choose</h2><p>Prepare and export the local draft here; then open the destination yourself, review its terms and audience controls, and submit there. EONAPP does not sign in, transmit, upload, schedule, publish, sell, or record a completion claim from this desk.</p></div><span class="eon-record-status">User action</span></div><ol class="eon-record-list"><li class="eon-record-card"><div><p class="eon-record-type">1 · Prepare</p><h3>Create a local brief</h3><p>Use Creator Suite 2 for the deliverables, rights checklist, and export file.</p></div></li><li class="eon-record-card"><div><p class="eon-record-type">2 · Review</p><h3>Check rights, accuracy, audience and destination rules</h3><p>No local card is an approval to make an external effect.</p></div></li><li class="eon-record-card"><div><p class="eon-record-type">3 · Submit manually</p><h3>Use the official service yourself</h3><p>The external service, account, scope and final confirmation remain under your control.</p></div></li></ol><div class="eon-record-actions"><button class="eon-record-button" type="button" data-workspace-creator>Prepare an export</button><a class="eon-record-button" href="/automations">Review local workflows</a></div></section>`;
}

function renderLocalPrivacyControls() {
  const privacy = inspectEonLocalPrivacy();
  const temporaryCount = Object.values(privacy.temporary).filter(Boolean).length;
  const legacy = privacy.legacyPlaintextChat?.present === true;
  return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-local-privacy-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Device privacy controls</p><h2 id="eon-local-privacy-title">Your temporary local work is visible to you</h2><p>New Chat threads, model lists and foreground review state are kept for this browser session only. This panel shows categories, not the content itself. Encrypted portable backups and provider keys are separate and are not changed here.</p></div><span class="eon-record-status">Local only</span></div><div class="eon-record-list"><article class="eon-record-card"><div><p class="eon-record-type">Temporary local state</p><h3>${temporaryCount} category${temporaryCount === 1 ? '' : 'ies'} currently present</h3><p>Closing the browser clears session-only work. You can remove it now with one explicit device action.</p></div></article><article class="eon-record-card"><div><p class="eon-record-type">Legacy plaintext Chat cache</p><h3>${legacy ? 'Older cache detected' : 'No older cache detected'}</h3><p>${legacy ? 'An older release left a plaintext Chat cache in this browser profile. Removing it never reads, migrates, or uploads its content.' : 'Current releases do not create a durable plaintext Chat history cache.'}</p></div></article></div><div class="eon-record-actions"><button class="eon-record-button" type="button" data-workspace-clear-temporary>Clear temporary local work</button>${legacy ? '<button class="eon-record-button" type="button" data-workspace-clear-legacy-chat>Remove old plaintext Chat cache</button>' : ''}</div></section>`;
}

function downloadLocalJson(filename = 'eonapp-local-export.json', body = '{}') {
  const blob = new Blob([String(body || '{}')], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function deviceProofRecordsFromForm(form) {
  if (!form) return loadEonDeviceEvidenceRecords().records;
  return Array.from(form.querySelectorAll('[data-device-proof-case]')).map((row) => ({
    id: row.dataset.deviceProofCase || '',
    status: row.querySelector('[data-device-proof-status]')?.value || 'not-run',
    note: row.querySelector('[data-device-proof-note]')?.value || ''
  }));
}

function renderLocalDeviceProofKit() {
  const snapshot = loadEonDeviceEvidenceRecords();
  const matrix = snapshot.matrix;
  const options = ['not-run', 'passed', 'failed', 'blocked'];
  const records = new Map(snapshot.records.map((item) => [item.id, item]));
  return `<section id="eon-device-proof-kit" class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-device-proof-kit-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Device Proof Kit</p><h2 id="eon-device-proof-kit-title">Prepare real-device/PWA evidence without sending it anywhere</h2><p>This is a user-owned local checklist, not a device probe. Run each case yourself, record only a short non-sensitive note, and export it only when you choose. It cannot certify Production by itself, collect telemetry, upload screenshots, read Chat/Vault content, or mark a case passed automatically.</p></div><span class="eon-record-status">${matrix.status === 'complete' ? 'Checklist complete' : 'Evidence pending'}</span></div><div class="eon-record-list"><article class="eon-record-card"><div><p class="eon-record-type">Evidence boundary</p><h3>${matrix.passedCaseCount} of ${matrix.requiredCaseCount} required cases marked passed by you</h3><p>A complete local checklist is operator evidence only. Production acceptance still requires real-device/browser review and the protected deployment evidence; this card does not block Billing, ads, rewards, or other live services.</p></div></article></div><form class="eon-record-form" data-device-proof-kit-form><div class="eon-record-form-head"><div><h3>Required local checks</h3><p>Do not paste API keys, account names, device identifiers, screenshots, prompts, outputs, or provider payloads.</p></div></div>${EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => { const record = records.get(item.id) || { status: 'not-run', note: '' }; return `<fieldset class="eon-record-card" data-device-proof-case="${escapeHtml(item.id)}"><legend>${escapeHtml(item.label)}</legend><label>Status<select data-device-proof-status>${options.map((status) => `<option value="${status}"${record.status === status ? ' selected' : ''}>${escapeHtml(status.replace(/-/g, ' '))}</option>`).join('')}</select></label><label>Short local note (optional)<textarea data-device-proof-note maxlength="180" placeholder="What you manually checked; no sensitive data.">${escapeHtml(record.note)}</textarea></label></fieldset>`; }).join('')}<p class="eon-profile-status" role="status" aria-live="polite" data-device-proof-status-message></p><div class="eon-record-actions"><button class="eon-record-button" type="submit">Save local checklist</button><button class="eon-record-button" type="button" data-device-proof-export>Export evidence handoff</button><button class="eon-record-button is-danger" type="button" data-device-proof-clear>Clear local checklist</button></div></form></section>`;
}

function bindLocalDeviceProofKit(root) {
  const form = root.querySelector('[data-device-proof-kit-form]');
  if (!form) return;
  const status = form.querySelector('[data-device-proof-status-message]');
  const show = (message = '') => { if (status) status.textContent = String(message || ''); };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = saveEonDeviceEvidenceRecords(deviceProofRecordsFromForm(form), { confirmedByUser: true });
    show(result.ok ? 'Saved locally. No evidence was sent or verified by EONAPP.' : `Could not save locally: ${result.reason || 'unknown error'}.`);
  });
  form.querySelector('[data-device-proof-export]')?.addEventListener('click', () => {
    const records = deviceProofRecordsFromForm(form);
    downloadLocalJson('eonapp-device-pwa-evidence-handoff.json', buildEonDeviceEvidenceExport(records));
    show('Export created on this device. It is an operator handoff checklist, not independent device verification or a release result.');
  });
  form.querySelector('[data-device-proof-clear]')?.addEventListener('click', () => {
    if (!globalThis.confirm?.('Clear this local device-proof checklist? This does not affect encrypted backups, provider keys, Chat, or Workspace records.')) return;
    const result = clearEonDeviceEvidenceRecords({ confirmedByUser: true });
    if (result.ok) renderWorkspace();
    else show(`Could not clear locally: ${result.reason || 'unknown error'}.`);
  });
}


function renderKernelForegroundReviewInbox() {
  const items = listEonKernelForegroundReviewItems();
  if (!items.length) return '';
  return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-kernel-review-inbox-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">EON AI Kernel · foreground review</p><h2 id="eon-kernel-review-inbox-title">${items.length} local task${items.length === 1 ? '' : 's'} ready for review</h2><p>This session-only summary contains task states and hashes, not prompts, outputs, keys, model names, accounts, or executable approvals. Close the browser and the task pauses.</p></div><span class="eon-record-status is-active">Review needed</span></div><div class="eon-record-list">${items.map((item) => `<article class="eon-record-card"><div><p class="eon-record-type">${escapeHtml(item.source.replace(/-/g, ' '))}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><p class="eon-record-meta">${item.expiresAt ? `Review reference expires ${escapeHtml(formatDate(item.expiresAt))}` : 'No external effect is attached'}</p></div><div class="eon-record-actions"><a class="eon-record-button" href="${escapeHtml(item.route)}">Stay in Workspace</a></div></article>`).join('')}</div></section>`;
}

function renderLocalReviewInbox() {
  const cards = listPendingEonbotLocalReviewCards();
  const note = REVIEW_INBOX_TRUTH?.truthfulUserFacingNote || 'Local review state only. No action packet is executable in this release.';
  if (!cards.length) {
    return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-local-review-inbox-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Local Review Inbox</p><h2 id="eon-local-review-inbox-title">Nothing awaiting review</h2><p>${escapeHtml(note)}</p></div><span class="eon-record-status">Local only</span></div></section>`;
  }
  return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="eon-local-review-inbox-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Local Review Inbox</p><h2 id="eon-local-review-inbox-title">${cards.length} item${cards.length === 1 ? '' : 's'} awaiting your review</h2><p>${escapeHtml(note)}</p></div><span class="eon-record-status is-active">Review needed</span></div><div class="eon-record-list">${cards.map((card) => `<article class="eon-record-card" data-eon-local-review-card="${escapeHtml(card.id)}"><div><p class="eon-record-type">${escapeHtml(card.kind.replace(/-/g, ' '))}</p><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.summary)}</p><p class="eon-record-meta">${card.packetPreview ? 'Action Packet preview only · not server-issued or executable' : card.requiresConnection ? 'Connection is not active' : 'Local review only'}</p></div><div class="eon-record-actions"><a class="eon-record-button" href="${escapeHtml(card.route)}">Open canonical surface</a><button type="button" class="eon-record-button" data-eon-local-review-complete="${escapeHtml(card.id)}">Mark reviewed</button><button type="button" class="eon-record-button" data-eon-local-review-dismiss="${escapeHtml(card.id)}">Dismiss</button></div></article>`).join('')}</div></section>`;
}

function bindLocalReviewInbox(root) {
  root.querySelectorAll('[data-eon-local-review-complete]').forEach((button) => button.addEventListener('click', () => {
    markEonbotLocalActionCardReviewed(button.dataset.eonLocalReviewComplete || '');
    renderWorkspace();
  }));
  root.querySelectorAll('[data-eon-local-review-dismiss]').forEach((button) => button.addEventListener('click', () => {
    dismissEonbotLocalActionCard(button.dataset.eonLocalReviewDismiss || '');
    renderWorkspace();
  }));
}

function applyWorkspaceOutcomeKitFromLocation(root) {
  const kitId = new URLSearchParams(window.location.search).get('kit');
  if (!kitId) return;
  const applied = applyEonOutcomeKitPreview(root, kitId);
  if (!applied.ok) return;
  try {
    const clean = window.location.pathname + (window.location.hash || '');
    window.history.replaceState({}, '', clean);
  } catch {}
}
function workQueueLabel(bucket = '') {
  const labels = {
    WORKING: 'Working',
    WAITING_FOR_YOU: 'Waiting for you',
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    FAILED_NEEDS_ATTENTION: 'Needs attention'
  };
  return labels[bucket] || bucket;
}

function renderEonWorkQueue(queue = {}) {
  const buckets = queue?.buckets || {};
  const metrics = ['WORKING', 'WAITING_FOR_YOU', 'SCHEDULED', 'COMPLETED', 'FAILED_NEEDS_ATTENTION']
    .map((bucket) => `<div class="eon-workspace-metric"><strong>${Number(buckets?.[bucket]?.count || 0)}</strong><span>${escapeHtml(workQueueLabel(bucket))}</span></div>`)
    .join('');
  const activeBuckets = ['WORKING', 'WAITING_FOR_YOU', 'SCHEDULED', 'FAILED_NEEDS_ATTENTION']
    .filter((bucket) => Number(buckets?.[bucket]?.count || 0) > 0);
  const detail = activeBuckets.length
    ? activeBuckets.map((bucket) => {
      const items = (buckets?.[bucket]?.items || []).slice(0, 4);
      return `<section class="eon-work-queue-group"><h3>${escapeHtml(workQueueLabel(bucket))}</h3><div class="eon-work-queue-items">${items.map((entry) => `<article class="eon-work-queue-item"><div><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.detail || entry.executionTruth)}</span></div>${entry.route ? `<a href="${escapeHtml(entry.route)}">Open</a>` : ''}</article>`).join('')}</div></section>`;
    }).join('')
    : '<p class="eon-record-form-note">No active local EONBOT jobs, prepared approvals, enabled schedules, or failures need attention right now.</p>';
  return `<section class="eon-workspace-overview eon-work-queue" aria-labelledby="eon-work-queue-title"><div class="eon-work-queue-head"><div><h2 id="eon-work-queue-title">EONBOT Work Queue</h2><p>One read-only view of EONBOT jobs and Automation OS state. This does not create a second task database.</p></div><a class="eon-record-button" href="/automations">Open Automations</a></div><div class="eon-workspace-metrics">${metrics}</div><details class="eon-work-queue-detail"><summary>Review active work</summary>${detail}</details><div class="eon-workspace-truth"><span><b>Truth boundary:</b> ${escapeHtml(queue?.truthNote || 'Saved schedule records are not proof of durable background execution.')}</span><span><b>Universal:</b> basic Work Queue visibility is part of core EONAPP; premium value will come from automation and scale, not hiding the queue.</span></div></section>`;
}

function renderWorkspace() {
  const root = document.getElementById('eon-workspace-root');
  if (!root) return;
  const automation = loadAutomationState();
  const snapshot = getWorkspaceSnapshot({ automationState: automation });
  const workQueue = projectEonWorkQueue({ jobState: readEonbotJobFabricState(), automationState: automation });
  const campaignBrief = renderWorkspaceCampaignBrief();
  const cityMission = renderCityBeginnerMission();
  const kernelReviewInbox = renderKernelForegroundReviewInbox();
  const reviewInbox = renderLocalReviewInbox();
  const creatorEngine = renderCreatorEngineWorkspace();
  const assetProvenance = renderCreatorAssetProvenanceWorkspace();
  const mediaLifecycle = renderCreatorMediaLifecycleWorkspace();
  const sharePack = renderEonSharePackWorkspace();
  const remixCards = renderEonRemixCardWorkspace();
  const collectionVault = renderEonCollectionWorkspace();
  const actionGateway = renderEonActionGatewayWorkspace();
  const socialConnectors = renderEonSocialConnectorsWorkspace();
  const forgeDeployPrep = renderForgeRemoteDeployWorkspace();
  const creatorSuite = renderCreatorSuite2Workspace();
  const advancedWorkspace = `${campaignBrief}${kernelReviewInbox}${reviewInbox}${creatorEngine}${assetProvenance}${mediaLifecycle}${sharePack}${remixCards}${collectionVault}${actionGateway}${socialConnectors}${forgeDeployPrep}${creatorSuite}${renderManualSubmissionDesk()}${renderLocalDeviceProofKit()}${renderLocalPrivacyControls()}`;
  root.innerHTML = `<section class="eon-records-shell">${cityMission}<section class="eon-workspace-overview"><div><h2>Current local work</h2><p>${escapeHtml(WORKSPACE_TRUTH?.truthfulUserFacingNote || 'These counts are from this browser profile. They are not a team dashboard or cloud-sync claim.')}</p></div><div class="eon-workspace-metrics"><div class="eon-workspace-metric"><strong>${snapshot.activeProjects}</strong><span>active projects</span></div><div class="eon-workspace-metric"><strong>${snapshot.openTasks}</strong><span>open tasks</span></div><div class="eon-workspace-metric"><strong>${snapshot.libraryItems}</strong><span>Library items</span></div><div class="eon-workspace-metric"><strong>${snapshot.workflows}</strong><span>local workflows</span></div><div class="eon-workspace-metric"><strong>${snapshot.pendingApprovals}</strong><span>prepared approvals</span></div></div><div class="eon-workspace-truth"><span><b>Local only:</b> saved work stays in this browser until you choose an encrypted portable backup.</span><span><b>Approval-first:</b> no external automation effect is sent from a local simulation.</span></div></section>${renderEonWorkQueue(workQueue)}<section class="eon-hub-card eon-hub-card-full" aria-label="Workspace actions"><h2>What do you want to do?</h2><div class="eon-workspace-actions"><button type="button" class="eon-workspace-action" data-workspace-chat="Help me build a website or app. Ask one question at a time and open the right EON tool."><strong>⌘ Build</strong><span>Websites, apps, code, and technical plans.</span></button><button type="button" class="eon-workspace-action" data-workspace-creator><strong>◇ Create</strong><span>Prepare local briefs, prompt decks, storyboards, audio direction, and exports.</span></button><a href="/automations" class="eon-workspace-action"><strong>↻ Automate</strong><span>Draft, simulate, inspect, approve prepared steps, pause, and resume local workflows.</span></a><button type="button" class="eon-workspace-action" data-workspace-share><strong>↗ Share</strong><span>Open Invite &amp; Share Center for signed EONAPP, EON City, AI Cockpit, or safe Realm identity links. Campaign drafts stay local; no auto-posting or payout is created merely by sharing. Referral milestones remain server-ledger controlled, and clicks alone never mint EONKEYS.</span></button><a href="/local-ai#eonbot-local-ai-setup" class="eon-workspace-action"><strong>◉ Local AI</strong><span>Make Local AI ready with Local Lite or a verified desktop runtime; Connected providers remain a separate explicit choice.</span></a></div><div class="eon-workspace-direct" aria-label="Direct workspace destinations"><a href="/projects">Open Projects</a><a href="/library">Open Library</a><a href="/automations">Open Automations</a><a href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a></div></section><details class="eon-workspace-advanced eon-hub-card eon-hub-card-full"><summary>Advanced workspace tools</summary><p>Open detailed review, connector, proof, lifecycle and deployment-preparation tools only when needed.</p>${renderLockedFeatureSurface('workspace')}${renderEonPremiumCapabilityPreview('workspace')}${advancedWorkspace}</details></section>`;
  root.querySelectorAll('[data-workspace-chat]').forEach((button) => button.addEventListener('click', () => routeToChat(button.dataset.workspaceChat || '')));
  root.querySelectorAll('[data-workspace-creator]').forEach((button) => button.addEventListener('click', () => root.querySelector('[data-creator-suite-form]')?.querySelector('select')?.focus()));
  bindCityBeginnerMission(root);
  bindLocalReviewInbox(root);
  bindCreatorSuite2Workspace(root);
  bindCreatorEngineWorkspace(root, { onOpenChat: routeToChat });
  bindCreatorAssetProvenanceWorkspace(root);
  bindCreatorMediaLifecycleWorkspace(root);
  bindEonSharePackWorkspace(root);
  bindEonRemixCardWorkspace(root);
  bindEonCollectionWorkspace(root);
  bindEonActionGatewayWorkspace(root);
  bindEonSocialConnectorsWorkspace(root);
  bindForgeRemoteDeployWorkspace(root);
  applyWorkspaceOutcomeKitFromLocation(root);
  bindLocalDeviceProofKit(root);
  root.querySelector('[data-workspace-clear-temporary]')?.addEventListener('click', () => {
    if (globalThis.confirm?.('Clear temporary local Chat, model-list, and foreground-review state from this browser session? Encrypted Vault backups and provider keys stay unchanged.')) {
      clearEonTemporaryLocalWork({ confirmedByUser: true });
      renderWorkspace();
    }
  });
  root.querySelector('[data-workspace-clear-legacy-chat]')?.addEventListener('click', () => {
    if (globalThis.confirm?.('Remove the older plaintext Chat cache from this browser profile? This cannot be undone.')) {
      clearLegacyPlaintextChatThreads();
      renderWorkspace();
    }
  });
  root.querySelector('[data-workspace-share]')?.addEventListener('click', () => { void openEonShareSheet({ type: 'workspace' }); });
  root.querySelector('[data-workspace-campaign-chat]')?.addEventListener('click', () => {
    const intent = readShareCampaignIntent();
    if (!intent?.draft) return;
    routeToChat(`Help me improve this EONAPP invite campaign draft. Keep it truthful: no earnings, payouts, commissions, public store, click rewards, or auto-posting. Referral milestones, if earned, remain server-ledger controlled. Link: ${intent.draft.url}\nDraft: ${intent.draft.message}`);
  });
  root.querySelector('[data-workspace-campaign-copy]')?.addEventListener('click', async () => {
    const url = readShareCampaignIntent()?.draft?.url || '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      root.querySelector('[data-workspace-campaign-copy]').textContent = 'Copied';
    } catch {
      root.querySelector('[data-workspace-campaign-copy]').textContent = 'Copy unavailable';
    }
  });
  root.querySelector('[data-workspace-campaign-schedule]')?.addEventListener('click', () => {
    const intent = readShareCampaignIntent();
    if (!intent?.draft?.url) return;
    const result = createApprovalSchedule({
      id: `share-${intent.draft.id || 'local'}`,
      url: intent.draft.url,
      posts: [intent.draft.message || 'Explore EONAPP through my signed local-first invite link.']
    }, { channels: ['whatsapp', 'x', 'telegram', 'linkedin', 'email'] });
    const button = root.querySelector('[data-workspace-campaign-schedule]');
    if (button) button.textContent = result.ok ? `Review queue ready (${listApprovalSchedule().length})` : 'Schedule unavailable';
  });
  root.querySelector('[data-workspace-campaign-clear]')?.addEventListener('click', () => {
    clearShareCampaignIntent();
    renderWorkspace();
  });
}

function renderCurrentPage() {
  if (page === 'projects') renderProjects();
  if (page === 'library') renderLibrary();
  if (page === 'workspace') renderWorkspace();
}

document.addEventListener('eon:workspace-state-changed', () => renderCurrentPage());
document.addEventListener('eon:automation-state-changed', () => { if (page === 'workspace' || page === 'projects') renderCurrentPage(); });

function initWorkspaceSurface() {
  const cityMode = ['workspace', 'projects', 'library'].includes(page) ? page : 'workspace';
  enterCityMode(cityMode, { entry: cityMode });
  bindCityModeLinkTracking(document, cityMode, { entry: cityMode });
  renderCurrentPage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWorkspaceSurface, { once: true });
else initWorkspaceSurface();
