/**
 * W438 + W554 local City workspace for private project portals.
 *
 * A portal links a real local Project record to a deterministic City accent.
 * The 3D world never receives project summaries, artifact bodies, prompts,
 * provider output, files, credentials, or hidden IDs. Private work appears
 * only inside this foreground City console after a user opens it.
 */
import {
  EON_PROJECT_DISTRICT_MISSION_STATES,
  EON_PROJECT_DISTRICT_PALETTES,
  createEonProjectDistrictRegistry
} from './eon-city-project-district-manifest.js';
import {
  addProjectTask,
  createProject,
  loadProjects,
  updateProjectTask
} from '../utils/eon-workspace-store.js';

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

export function deriveEonCityMissionState(projectStatus = '') {
  const status = String(projectStatus || '').trim().toLowerCase();
  if (status === 'complete') return 'completed';
  if (status === 'paused') return 'paused';
  return 'focus';
}

/** Returns only the private-console metadata needed to choose a portal. */
export function listEonCityProjectPortalCandidates(projectState = {}) {
  const projects = Array.isArray(projectState?.projects) ? projectState.projects : [];
  return Object.freeze(projects.map((project) => {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    return Object.freeze({
      id: String(project?.id || ''),
      title: String(project?.title || 'Untitled project').slice(0, 180),
      status: String(project?.status || 'active'),
      taskCount: tasks.length,
      openTaskCount: tasks.filter((task) => String(task?.status || '') !== 'done').length,
      completedTaskCount: tasks.filter((task) => String(task?.status || '') === 'done').length,
      missionState: deriveEonCityMissionState(project?.status)
    });
  }).filter((project) => /^project_[a-z0-9:_-]{3,160}$/i.test(project.id)));
}

function selectedProject(candidates = [], selectedProjectId = '') {
  return candidates.find((project) => project.id === String(selectedProjectId || '')) || candidates[0] || null;
}

function currentProjectRecord(projectId = '') {
  const state = loadProjects();
  return (state.projects || []).find((project) => project.id === String(projectId || '')) || null;
}

function cards(snapshot = {}, pendingDelete = '') {
  const active = Array.isArray(snapshot.publicDistricts) ? snapshot.publicDistricts : [];
  const deleted = Array.isArray(snapshot.deletedDistricts) ? snapshot.deletedDistricts : [];
  if (!active.length && !deleted.length) return '<p class="eon-play-work-latest">No City portal exists yet. Link a real local Project only after reviewing a City-safe label. Project notes, files, prompts and credentials stay out of the world.</p>';
  const activeMarkup = active.map((district) => `<article class="eon-play-district-record"><div><p class="eon-play-kicker">Private local project portal</p><h3>${escapeHtml(district.displayLabel)}</h3><p>${escapeHtml(district.palette.label)} · ${escapeHtml(district.missionState)} · ${Number(district.cardCount || 0)} approved City task card${Number(district.cardCount || 0) === 1 ? '' : 's'}</p></div><div>${pendingDelete === district.districtId ? `<button type="button" data-eon-play-project-district-delete-confirm="${escapeHtml(district.districtId)}">Confirm remove</button>` : `<button type="button" data-eon-play-project-district-delete="${escapeHtml(district.districtId)}">Remove portal</button>`}</div></article>`).join('');
  const deletedMarkup = deleted.map((district) => `<article class="eon-play-district-record is-deleted"><div><p class="eon-play-kicker">Removed local portal</p><h3>${escapeHtml(district.displayLabel)}</h3><p>It is retained as a local tombstone until you explicitly restore it. Nothing was published or deleted remotely.</p></div><button type="button" data-eon-play-project-district-restore="${escapeHtml(district.districtId)}">Restore</button></article>`).join('');
  return `${activeMarkup}${deletedMarkup}`;
}

function projectPicker(candidates = [], selected = null) {
  if (!candidates.length) return '<p class="eon-play-work-latest">Create a local Project below, then link it to a private City portal.</p>';
  return `<label>Project<select name="projectId" data-eon-play-project-select>${candidates.map((project) => `<option value="${escapeHtml(project.id)}" ${selected?.id === project.id ? 'selected' : ''}>${escapeHtml(project.title)} · ${escapeHtml(project.status)} · ${project.openTaskCount} open task${project.openTaskCount === 1 ? '' : 's'}</option>`).join('')}</select></label>`;
}

function taskConsole(project = null) {
  if (!project) return '';
  const tasks = Array.isArray(project.tasks) ? project.tasks.slice(0, 12) : [];
  const taskRows = tasks.length
    ? tasks.map((task) => `<article class="eon-play-project-portal-task ${String(task.status) === 'done' ? 'is-done' : ''}"><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(String(task.status || 'todo').replaceAll('-', ' '))}</small></div><button type="button" data-eon-play-project-task-toggle="${escapeHtml(task.id)}" data-eon-play-project-id="${escapeHtml(project.id)}">${String(task.status) === 'done' ? 'Reopen' : 'Mark done'}</button></article>`).join('')
    : '<p class="eon-play-work-latest">No task yet. Add one in this private console; it does not become City décor.</p>';
  return `<section class="eon-play-project-portal-workspace" data-eon-play-project-portal-workspace><p class="eon-play-kicker">Project portal · private work console</p><h3>${escapeHtml(project.title)}</h3><p>Tasks stay in this local foreground console. They never become 3D signage unless you later review a specific City-safe task card.</p><div class="eon-play-project-portal-list">${taskRows}</div><form data-eon-play-project-task-form><input name="taskTitle" maxlength="180" required placeholder="Add a real project task" autocomplete="off" /><input name="projectId" type="hidden" value="${escapeHtml(project.id)}" /><button type="submit">Add task</button></form></section>`;
}

/** W558 mission-card editor. The user writes a separate City-safe label; raw task titles never leave this foreground console. */
function missionCardConsole(selected = null, missionCardState = null, pendingMissionCardDelete = '') {
  if (!selected) return '';
  if (!missionCardState) return `<section class="eon-play-project-portal-workspace"><p class="eon-play-kicker">W558 · City-safe mission cards</p><h3>Mission cards unlock after a portal exists</h3><p>Create a reviewed private City portal for this Project first. Raw tasks, summaries, files, prompts and credentials will remain in this foreground console.</p></section>`;
  const currentCards = Array.isArray(missionCardState.approvedTaskCards) ? missionCardState.approvedTaskCards : [];
  const cards = currentCards.length
    ? `<div class="eon-play-project-portal-list">${currentCards.map((card) => `<article class="eon-play-project-portal-task"><div><strong>${escapeHtml(card.label)}</strong><small>City-safe · ${escapeHtml(String(card.state || 'needs-review').replaceAll('-', ' '))}</small></div>${pendingMissionCardDelete === card.id ? `<button type="button" data-eon-play-project-mission-card-remove-confirm="${escapeHtml(card.id)}" data-eon-play-project-mission-district="${escapeHtml(missionCardState.districtId)}">Confirm remove</button>` : `<button type="button" data-eon-play-project-mission-card-remove="${escapeHtml(card.id)}" data-eon-play-project-mission-district="${escapeHtml(missionCardState.districtId)}">Remove card</button>`}</article>`).join('')}</div>`
    : '<p class="eon-play-work-latest">No City-safe mission card yet. Add only a rewritten, reviewed public label—not a raw task, prompt, file name or private detail.</p>';
  const stateOptions = EON_PROJECT_DISTRICT_MISSION_STATES.map((state) => `<option value="${escapeHtml(state)}" ${missionCardState.missionState === state ? 'selected' : ''}>${escapeHtml(state.replaceAll('-', ' '))}</option>`).join('');
  return `<section class="eon-play-project-portal-workspace" data-eon-play-project-mission-card-workspace><p class="eon-play-kicker">W558 · City-safe mission cards</p><h3>${escapeHtml(missionCardState.displayLabel)} · ${currentCards.length}/6 cards</h3><p>Write a separate short label for the City. It will be the only task-like text that may appear near this portal in 3D.</p><form data-eon-play-project-mission-card-form><input name="projectId" type="hidden" value="${escapeHtml(selected.id)}" /><input name="districtId" type="hidden" value="${escapeHtml(missionCardState.districtId)}" /><label>City-safe mission label<input name="missionLabel" maxlength="80" required placeholder="Example: Review launch checklist" autocomplete="off" /></label><label>City state<select name="missionState">${stateOptions}</select></label><label class="eon-play-project-district-approval"><input name="citySafeMissionApproved" type="checkbox" required /> I rewrote and reviewed this label. It contains no raw task, secret, prompt, private file or sensitive work.</label><button type="submit" ${currentCards.length >= 6 ? 'disabled' : ''}>Add City-safe mission card</button></form>${cards}</section>`;
}

function renderContent(snapshot = {}, { pendingDelete = '', pendingMissionCardDelete = '', selectedProjectId = '', missionCardState = null } = {}) {
  const projectState = loadProjects();
  const candidates = listEonCityProjectPortalCandidates(projectState);
  const selected = selectedProject(candidates, selectedProjectId);
  const selectedRecord = selected ? currentProjectRecord(selected.id) : null;
  const paletteOptions = EON_PROJECT_DISTRICT_PALETTES.map((palette) => `<option value="${escapeHtml(palette.id)}">${escapeHtml(palette.label)} · ${escapeHtml(palette.atmosphere)}</option>`).join('');
  const stateOptions = EON_PROJECT_DISTRICT_MISSION_STATES.map((state) => `<option value="${escapeHtml(state)}" ${selected?.missionState === state ? 'selected' : ''}>${escapeHtml(state.replaceAll('-', ' '))}</option>`).join('');
  const defaultLabel = selected ? selected.title : 'Private project portal';
  return `<div class="eon-play-command-deck-card"><p class="eon-play-kicker">EON City · Project Portals</p><h2 id="eon-play-project-district-title">Work on real Projects inside EON Universe</h2><p>Choose one local Project, create a private portal, then use its task console without leaving City. Only the City-safe label, palette and coarse mission state may render in 3D. Notes, files, prompts, provider output, Vault data and hidden IDs stay out of the world.</p><section class="eon-play-project-portal-workspace"><h3>Start or select a Project</h3><form data-eon-play-project-create><label>New project title<input name="projectTitle" maxlength="180" required placeholder="Example: Launch my portfolio" autocomplete="off" /></label><label>Private summary <textarea name="projectSummary" maxlength="4000" placeholder="Optional project context — kept in this browser, never placed in the City scene."></textarea></label><button type="submit">Create local Project</button></form></section><form data-eon-play-project-district-form>${projectPicker(candidates, selected)}<label>City-safe portal label<input name="displayLabel" maxlength="80" value="${escapeHtml(defaultLabel)}" required /></label><label>Palette<select name="paletteId">${paletteOptions}</select></label><label>Mission state<select name="missionState">${stateOptions}</select></label><label class="eon-play-project-district-approval"><input name="citySafeApproved" type="checkbox" required /> I reviewed this label for City display. It contains no secret, prompt, private file or sensitive work.</label><button type="submit" class="eon-play-primary" ${selected ? '' : 'disabled'}>Create private City portal</button></form><p data-eon-play-project-district-status class="eon-play-work-latest" role="status" aria-live="polite">Local only. A City portal does not create a public route, share a project, connect an account or start background work.</p>${taskConsole(selectedRecord)}${missionCardConsole(selected, missionCardState, pendingMissionCardDelete)}<div data-eon-play-project-district-list class="eon-play-project-district-list">${cards(snapshot, pendingDelete)}</div><p class="eon-play-command-deck-note">Removing a portal retains a local tombstone for explicit restore. It never deletes the underlying Project. Vault, billing, OAuth, provider keys and social publishing remain secure native surfaces.</p><button type="button" data-eon-play-close-project-districts>Return to City</button></div>`;
}

export function renderEonProjectDistrictWorkspace(snapshot = {}, options = {}) {
  return `<section class="eon-play-command-deck-panel eon-play-project-district-panel" data-eon-play-project-district-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-project-district-title">${renderContent(snapshot, options)}</section>`;
}

/** Binds explicit local Project, portal, task, remove and restore actions. */
export function bindEonProjectDistrictWorkspace(root, runtime, { onStatus = () => {}, workroomOverlay = null } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-project-district-panel]');
  const openButtons = Array.from(root?.querySelectorAll?.('[data-eon-play-open-project-districts]') || []);
  if (!panel || !openButtons.length) return () => {};
  const registry = createEonProjectDistrictRegistry();
  let lastOpen = openButtons[0] || null;
  let pendingDelete = '';
  let pendingMissionCardDelete = '';
  let selectedProjectId = '';
  const refresh = (message = '') => {
    const snapshot = registry.getSnapshot();
    const candidates = listEonCityProjectPortalCandidates(loadProjects());
    const selected = selectedProject(candidates, selectedProjectId);
    selectedProjectId = selected?.id || '';
    const missionCardState = selected ? registry.getLocalMissionCardState(selected.id) : null;
    panel.innerHTML = renderContent(snapshot, { pendingDelete, pendingMissionCardDelete, selectedProjectId, missionCardState });
    if (message) panel.querySelector('[data-eon-play-project-district-status]')?.replaceChildren(message);
    runtime?.setProjectDistrictRenderPlans?.(snapshot.renderPlans || []);
    return snapshot;
  };
  const show = (trigger = null) => {
    if (trigger?.matches?.('[data-eon-play-open-project-districts]')) lastOpen = trigger;
    const overlayResult = workroomOverlay?.open?.({ id: 'project-console', explicitUserAction: true });
    if (overlayResult && overlayResult.ok !== true) {
      onStatus('Project Console could not open safely. City was not changed.');
      return;
    }
    refresh();
    panel.hidden = false;
    panel.querySelector('[data-eon-play-close-project-districts]')?.focus({ preventScroll: true });
    onStatus('Project Console is open locally. City is paused until you return.');
  };
  const hide = () => {
    pendingDelete = '';
    pendingMissionCardDelete = '';
    panel.hidden = true;
    const overlayResult = workroomOverlay?.close?.({ explicitUserAction: true, reason: 'project-console-close' });
    lastOpen?.focus?.({ preventScroll: true });
    if (overlayResult?.ok !== false) onStatus('Returned to City. Your City location and camera were restored locally.');
  };
  const onOpen = (event) => show(event.currentTarget);
  openButtons.forEach((open) => open.addEventListener('click', onOpen));
  panel.addEventListener('click', (event) => {
    if (event.target === panel) return hide();
    if (event.target.closest?.('[data-eon-play-close-project-districts]')) return hide();
    const remove = event.target.closest?.('[data-eon-play-project-district-delete]');
    const confirm = event.target.closest?.('[data-eon-play-project-district-delete-confirm]');
    const restore = event.target.closest?.('[data-eon-play-project-district-restore]');
    const toggle = event.target.closest?.('[data-eon-play-project-task-toggle]');
    const removeMissionCard = event.target.closest?.('[data-eon-play-project-mission-card-remove]');
    const confirmMissionCard = event.target.closest?.('[data-eon-play-project-mission-card-remove-confirm]');
    if (remove) {
      pendingDelete = String(remove.dataset.eonPlayProjectDistrictDelete || '');
      refresh('Review removal, then choose Confirm remove. The portal remains local and the underlying Project is untouched.');
    }
    if (confirm) {
      const id = String(confirm.dataset.eonPlayProjectDistrictDeleteConfirm || '');
      const result = registry.delete(id, { explicitUserAction: true, confirmed: true });
      pendingDelete = '';
      refresh(result.ok ? 'Private City portal removed locally. The underlying Project is still available.' : 'The local portal could not be removed. Nothing changed.');
      onStatus(result.ok ? 'Private City portal removed locally. No project, route, content or remote deletion was created.' : 'Private City portal removal was not completed.');
    }
    if (restore) {
      const id = String(restore.dataset.eonPlayProjectDistrictRestore || '');
      const result = registry.restore(id, { explicitUserAction: true, confirmed: true });
      refresh(result.ok ? 'Private City portal restored locally. It remains City-safe only.' : 'The local portal could not be restored. Nothing changed.');
      onStatus(result.ok ? 'Private City portal restored locally. No remote restore was requested.' : 'Private City portal restore was not completed.');
    }
    if (removeMissionCard) {
      pendingMissionCardDelete = String(removeMissionCard.dataset.eonPlayProjectMissionCardRemove || '');
      refresh('Review the City-safe mission-card removal, then choose Confirm remove. The underlying Project task remains unchanged.');
    }
    if (confirmMissionCard) {
      const cardId = String(confirmMissionCard.dataset.eonPlayProjectMissionCardRemoveConfirm || '');
      const districtId = String(confirmMissionCard.dataset.eonPlayProjectMissionDistrict || '');
      const result = registry.removeApprovedMissionCard(districtId, cardId, { explicitUserAction: true, confirmed: true });
      pendingMissionCardDelete = '';
      refresh(result.ok ? 'City-safe mission card removed. The underlying Project and task remain unchanged.' : 'Mission-card removal was not completed. Nothing changed.');
      onStatus(result.ok ? 'City-safe mission card removed locally. No project content, route or remote action changed.' : 'City-safe mission-card removal was not completed.');
    }
    if (toggle) {
      const projectId = String(toggle.dataset.eonPlayProjectId || '');
      const taskId = String(toggle.dataset.eonPlayProjectTaskToggle || '');
      const project = currentProjectRecord(projectId);
      const task = project?.tasks?.find((entry) => entry.id === taskId);
      if (!task) return;
      try {
        updateProjectTask(projectId, taskId, { status: task.status === 'done' ? 'todo' : 'done' });
        selectedProjectId = projectId;
        refresh(task.status === 'done' ? 'Task reopened locally.' : 'Task marked done locally. This does not create a reward or City entitlement.');
        onStatus(task.status === 'done' ? 'Project task reopened locally.' : 'Project task completed locally.');
      } catch {
        refresh('The Project task could not be updated. Nothing was shared.');
      }
    }
  });
  panel.addEventListener('change', (event) => {
    const select = event.target.closest?.('[data-eon-play-project-select]');
    if (!select) return;
    selectedProjectId = String(select.value || '');
    refresh('Project selected locally. Review the portal label before creating its 3D accent.');
  });
  panel.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.matches?.('[data-eon-play-project-create]')) {
      event.preventDefault();
      try {
        const created = createProject({ title: String(form.elements.projectTitle?.value || ''), summary: String(form.elements.projectSummary?.value || ''), status: 'active' });
        selectedProjectId = created.id;
        refresh('Local Project created. You can now add real tasks and create a reviewed private City portal.');
        onStatus('Local Project created inside the City console. No remote project or account record was created.');
      } catch (error) {
        refresh(`Project could not be created: ${String(error?.message || 'invalid local input')}`);
      }
      return;
    }
    if (form.matches?.('[data-eon-play-project-district-form]')) {
      event.preventDefault();
      const projectId = String(form.elements.projectId?.value || '');
      const project = currentProjectRecord(projectId);
      const citySafeApproved = Boolean(form.elements.citySafeApproved?.checked);
      if (!project) {
        refresh('Select a local Project before creating a City portal.');
        return;
      }
      const result = registry.create({
        projectReference: project.id,
        displayLabel: String(form.elements.displayLabel?.value || ''),
        paletteId: String(form.elements.paletteId?.value || ''),
        missionState: String(form.elements.missionState?.value || deriveEonCityMissionState(project.status)),
        approvedTaskCards: []
      }, { explicitUserAction: true, explicitCitySafeLabelApproval: citySafeApproved });
      selectedProjectId = project.id;
      refresh(result.ok ? (result.deduped ? 'This Project already has a local City portal. No duplicate was created.' : 'Private City portal created from this local Project.') : result.error === 'city-safe-label-approval-required' ? 'Review the City-safe portal label before creating a portal.' : 'The private City portal could not be created. Nothing was shared or published.');
      if (result.ok) onStatus('Real local Project linked to a deterministic City portal. Its private content stays in the foreground console.');
      return;
    }
    if (form.matches?.('[data-eon-play-project-mission-card-form]')) {
      event.preventDefault();
      const projectId = String(form.elements.projectId?.value || '');
      const districtId = String(form.elements.districtId?.value || '');
      const approved = Boolean(form.elements.citySafeMissionApproved?.checked);
      const localState = registry.getLocalMissionCardState(projectId);
      if (!localState || localState.districtId !== districtId) {
        refresh('Create or select this Project’s private City portal before adding a City-safe mission card.');
        return;
      }
      const result = registry.addApprovedMissionCard(districtId, {
        label: String(form.elements.missionLabel?.value || ''),
        state: String(form.elements.missionState?.value || localState.missionState || 'needs-review')
      }, { explicitUserAction: true, explicitCitySafeCardApproval: approved });
      refresh(result.ok ? (result.deduped ? 'That City-safe mission card already exists. No duplicate was created.' : 'City-safe mission card added to this private portal.') : result.error === 'city-safe-card-approval-required' ? 'Review the separate City-safe mission label before adding it.' : result.error === 'city-mission-card-limit-reached' ? 'This portal already has six City-safe mission cards. Remove one only if it is no longer useful.' : 'Mission card could not be added. No raw task text entered the City scene.');
      onStatus(result.ok ? 'City-safe mission card updated locally. Only its reviewed label and coarse state may appear in 3D.' : 'City-safe mission card was not added.');
      return;
    }
    if (form.matches?.('[data-eon-play-project-task-form]')) {
      event.preventDefault();
      const projectId = String(form.elements.projectId?.value || '');
      try {
        addProjectTask(projectId, { title: String(form.elements.taskTitle?.value || ''), status: 'todo' });
        selectedProjectId = projectId;
        refresh('Task added to this local Project. It is not shown in the City scene.');
        onStatus('Project task added locally. No background run or reward was created.');
      } catch (error) {
        refresh(`Task could not be added: ${String(error?.message || 'invalid local input')}`);
      }
    }
  });
  const onWorkspaceChange = () => { if (!panel.hidden) refresh('Project state updated locally.'); };
  document.addEventListener('eon:workspace-state-changed', onWorkspaceChange);
  return () => {
    if (!panel.hidden) {
      panel.hidden = true;
      try { workroomOverlay?.close?.({ explicitUserAction: true, reason: 'project-console-unbind' }); } catch {}
    }
    openButtons.forEach((open) => open.removeEventListener('click', onOpen));
    document.removeEventListener('eon:workspace-state-changed', onWorkspaceChange);
  };
}
