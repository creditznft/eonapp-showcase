import {
  addProjectArtifact,
  addProjectTask,
  buildProjectHandoffExport,
  createProject,
  deleteProject,
  deleteProjectArtifact,
  deleteProjectTask,
  getProjectCapacityCounts,
  getProjectHandoffFilename,
  loadProjects,
  updateProject,
  updateProjectTask
} from '../utils/eon-workspace-store.js';
import { PROJECT_HANDOFF_MAX_BYTES, parseProjectHandoffText } from '../utils/project-handoff-preflight.js';
import { consumeEonHandoffFromLocation, removeEonHandoffQuery } from '../contracts/navigation/eon-handoff-authority.js';
import { loadAutomationState } from '../utils/automation-os-store.js';
import {
  completeCityBeginnerMission,
  dismissCityBeginnerMission,
  readCityBeginnerMissionFromSearch,
  returnCityBeginnerMission
} from '../contracts/city/city-work-mission.js';
import { bindCityModeLinkTracking, enterCityMode } from '../contracts/city/city-mode-transition.js';
import { renderLockedFeatureSurface } from '../referrals/eon-locked-feature-surface.js';
import { renderEonPremiumCapabilityPreview } from '../capabilities/eon-premium-preview-surface.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import {
  buildEonProjectsW704CommandStrip,
  resolveEonProjectsW704CommandWorkspace
} from './w704/eon-projects-w704-command-workspace.js';
import { getEonCapacityPolicy } from '../storage/eon-capacity-authority.js';

const page = 'projects';
const ui = {
  projectFormOpen: false,
  projectWorkspaceInitialized: false,
  selectedProjectId: '',
  editingProjectId: '',
  incomingHandoff: null
};

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

function renderProjectHandoffReview() {
  return `<details class="eon-project-handoff-review"><summary>Review or export a local project handoff</summary><section aria-labelledby="eon-project-handoff-review-title"><h2 id="eon-project-handoff-review-title">Review a local handoff</h2><p>Choose a project-handoff JSON file to inspect its ordinary-work summary locally. This review never imports, merges, saves, restores, overwrites, publishes, delivers, or proves ownership of anything.</p><label class="eon-profile-field">Choose local handoff JSON<input type="file" accept="application/json,.json" data-project-handoff-file /></label><div class="eon-record-actions"><button type="button" class="eon-record-button" data-project-handoff-review>Review handoff</button><a class="eon-record-button" href="/capsule">Use encrypted backup for recovery</a></div><p class="eon-profile-status" role="status" aria-live="polite" data-project-handoff-status></p><div data-project-handoff-summary></div></section></details>`;
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

function renderIncomingHandoff() {
  const incoming = ui.incomingHandoff;
  if (!incoming?.ok || !incoming.handoff) return '';
  const handoff = incoming.handoff;
  return `<section class="eon-project-command-strip" data-project-incoming-handoff="${escapeHtml(handoff.kind)}" aria-label="Incoming project reference"><div><span>Continue from ${escapeHtml(handoff.sender?.id || 'EONAPP')}</span><strong>${escapeHtml(handoff.reference?.label || 'Project handoff')}</strong><small>The reference was verified and consumed once. No project was created, changed, published or sent automatically.</small></div><nav><button class="eon-hub-primary" type="button" data-project-command-create>Review new project</button></nav></section>`;
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
  root.innerHTML = `<section class="eon-records-shell">${cityMission}${renderIncomingHandoff()}${commandStrip}<div class="eon-records-grid"><section class="eon-records-panel eon-project-workspace-panel"><div class="eon-records-panel-head"><div><h2>Project workspace</h2><p>Open one project here to manage its outcome, tasks, ordinary outputs and reviewed next actions. ${getProjectCapacityCounts().activeCount}/${getEonCapacityPolicy('ordinary-projects')?.limit || 160} active · ${getProjectCapacityCounts().archivedCount} complete/archived · ${getProjectCapacityCounts().totalCount} total; reaching the active limit never removes older work.</p></div><button class="eon-record-button" type="button" data-project-toggle-form>${ui.projectFormOpen ? 'Close form' : 'New project'}</button></div>${renderProjectForm()}<div class="eon-record-list">${state.projects.length ? state.projects.map(renderProjectCard).join('') : '<p class="eon-hub-empty">No projects yet. Start with one outcome, then add the tasks and normal work artefacts that matter.</p>'}</div></section><aside class="eon-records-panel eon-project-utility-panel"><h2>Workspace utilities</h2><p>Library keeps reusable content. Vault holds security-sensitive material. Automations remain review-first and Projects do not claim cross-device sync.</p><div class="eon-record-actions"><a class="eon-record-button" href="/library">Library</a><a class="eon-record-button" href="/automations">Automations</a><a class="eon-record-button" href="/vault">Backup</a></div>${renderLockedFeatureSurface('projects', { compact: true })}${renderEonPremiumCapabilityPreview('projects', { compact: true })}${renderProjectHandoffReview()}</aside></div></section>`;
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

function renderCurrentPage() {
  renderProjects();
}

document.addEventListener('eon:workspace-state-changed', renderCurrentPage);
document.addEventListener('eon:automation-state-changed', renderCurrentPage);

async function initProjectsSurface() {
  const incoming = await consumeEonHandoffFromLocation({ receiverId: 'projects' });
  if (incoming.ok) {
    ui.incomingHandoff = incoming;
    ui.projectFormOpen = incoming.handoff?.payload?.modeId === 'project';
    removeEonHandoffQuery();
  } else if (!['handoff-query-missing', 'handoff-not-found'].includes(incoming.reason)) {
    removeEonHandoffQuery();
  }
  enterCityMode('projects', { entry: 'projects' });
  bindCityModeLinkTracking(document, 'projects', { entry: 'projects' });
  renderProjects();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void initProjectsSurface(); }, { once: true });
} else {
  void initProjectsSurface();
}
