import { W642_CONTINUE_SCHEMA, W642_PRODUCT_TRUTH_RETENTION_CONTRACT } from '../../../config/w642-product-truth-retention-contract.mjs';
import { buildEonDestinationHref } from '../contracts/navigation/eon-destination-registry.js';
import { listProjectRegistryRecords } from '../projects/eon-project-registry.js';
import { listEonSetupResumeCandidates } from '../activation/eon-activation-service.js';
import { listEonCoreOutcomes } from '../contracts/outcomes/eon-core-outcome-authority.js';

export const EON_CONTINUE_DISMISS_KEY = 'eon:continue:dismissed-until:w642:v1';
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const TYPE_PRIORITY = new Map(W642_PRODUCT_TRUTH_RETENTION_CONTRACT.candidatePriority.map((id, index) => [id, index]));
const freeze = (value) => Object.freeze(value);
const safeJson = (raw, fallback = null) => { try { return JSON.parse(String(raw || '')); } catch { return fallback; } };
const clean = (value, max = 80) => Array.from(String(value || ''), (char) => char.charCodeAt(0) < 32 ? ' ' : char).join('').replace(/\s+/g, ' ').trim().slice(0, max);
const time = (value) => { const parsed = Date.parse(String(value || '')); return Number.isFinite(parsed) ? parsed : 0; };
const safeId = (value) => clean(value, 120).replace(/[^A-Za-z0-9_-]/g, '');

function read(storage, key) { try { return storage?.getItem?.(key) || ''; } catch { return ''; } }
function candidate(type, label, detail, destinationId, query, updatedAt, id = '') {
  const updated = time(updatedAt);
  const href = buildEonDestinationHref(destinationId, query);
  if (!updated || !href) return null;
  return freeze({ schema: W642_CONTINUE_SCHEMA, type, label: clean(label, 72), detail: clean(detail, 120), destinationId, href, updatedAt: new Date(updated).toISOString(), id: safeId(id), localOnly: true });
}
function newest(rows = []) { return rows.filter(Boolean).sort((a, b) => time(b.updatedAt) - time(a.updatedAt))[0] || null; }
function projectCandidates(storage) {
  const registryRows = listProjectRegistryRecords({ storage })
    .filter((item) => item.lifecycleState === 'active')
    .map((item) => candidate(
      'project',
      item.title || 'Active project',
      `Resume this local ${clean(item.continueDestination || 'project', 40).replaceAll('-', ' ')} record.`,
      item.continueDestination || 'projects',
      { project: item.projectId },
      item.updatedAt || item.createdAt,
      item.projectId
    ))
    .filter(Boolean);
  if (registryRows.length) return registryRows;
  const state = safeJson(read(storage, 'eon:projects:v3'), {});
  return (Array.isArray(state?.projects) ? state.projects : [])
    .filter((item) => item?.status !== 'complete')
    .map((item) => candidate('project', item.title || 'Active project', 'Resume this local project.', 'projects', { project: item.id }, item.updatedAt || item.createdAt, item.id))
    .filter(Boolean);
}
function creatorJobCandidate(storage) {
  const raw = safeJson(read(storage, 'eon:creator-jobs:v1'), {});
  const jobs = Array.isArray(raw) ? raw : Array.isArray(raw?.jobs) ? raw.jobs : [];
  return newest(jobs.filter((item) => !['complete', 'failed', 'cancelled'].includes(String(item?.status || item?.state || ''))).map((item) => candidate('creator-job', item.label || item.title || 'Creator job', 'Continue the latest local Creator job.', 'create', {}, item.updatedAt || item.createdAt, item.id)));
}
const CREATOR_OUTCOME_CONTINUE = freeze({
  'creator-guide-artifact': freeze({ label: 'Creator guide', detail: 'Return to Create to review, share or build on your verified local guide.', destinationId: 'create' }),
  'creator-image-verified': freeze({ label: 'Verified image result', detail: 'Return to Local AI to review, share or remix your latest verified image result.', destinationId: 'local-ai' }),
  'creator-video-verified': freeze({ label: 'Verified video result', detail: 'Return to Local AI to review, share or remix your latest verified video result.', destinationId: 'local-ai' }),
  'creator-music-exported': freeze({ label: 'EON Music export', detail: 'Return to EON Music to listen, share, remix or add your export to private EON Radio.', destinationId: 'create' }),
  'creator-radio-station': freeze({ label: 'EON Radio', detail: 'Return to EON Music to continue your private station and authorized listening queue.', destinationId: 'create' }),
  'forge-source-applied': freeze({ label: 'Forge result', detail: 'Return to Forge to review or continue your latest verified local apply.', destinationId: 'forge' })
});
function creatorOutcomeCandidate(storage) {
  let rows = [];
  try { rows = listEonCoreOutcomes({ storage }); } catch { rows = []; }
  return newest((Array.isArray(rows) ? rows : []).map((outcome) => {
    const mapping = CREATOR_OUTCOME_CONTINUE[String(outcome?.kind || '')];
    if (!mapping || outcome?.verified !== true || outcome?.containsPrivateContent === true) return null;
    const verifiedAt = Number(outcome?.verifiedAt || 0);
    if (!Number.isFinite(verifiedAt) || verifiedAt <= 0) return null;
    return candidate('creator-outcome', mapping.label, mapping.detail, mapping.destinationId, {}, new Date(verifiedAt).toISOString(), `creator-${String(outcome?.metadataDigest || '').replace(/[^a-z0-9_-]/gi, '-')}`);
  }));
}
function cityMissionCandidate(storage) {
  const rows = safeJson(read(storage, 'eon:city:work-missions:v1'), []);
  return newest((Array.isArray(rows) ? rows : []).filter((item) => ['offered', 'opened'].includes(String(item?.state || ''))).map((item) => candidate('city-mission', item.missionLabel || 'City mission', 'Return to your unfinished City mission.', 'eoncity', { cityMission: item.id }, item.openedAt || item.createdAt, item.id)));
}
function cityResumeCandidate(storage) {
  const state = safeJson(read(storage, 'eon:city:world-state:resume:v1'), null);
  return state?.schema ? candidate('city-resume', 'EON City', 'Resume your last local City position.', 'eoncity', { resume: '1' }, state.updatedAt, state.lastDestinationId || 'city') : null;
}
function chatCandidate(storage) {
  const raw = safeJson(read(storage, 'eon:chat:threads:v1'), {});
  const threads = Array.isArray(raw) ? raw : Array.isArray(raw?.threads) ? raw.threads : [];
  return newest(threads.map((item) => candidate('chat', item.title || 'Recent chat', 'Continue this tab’s recent conversation.', 'home', { thread: safeId(item.id) }, item.updatedAt || item.createdAt, item.id)));
}
function creatorLibraryCandidate(storage) {
  const raw = safeJson(read(storage, 'eon:creator-library:v1'), {});
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
  return newest(rows.map((item) => candidate('creator-library', item.title || 'Creator item', 'Open your latest local Creator result.', 'library', { creator: item.id }, item.updatedAt || item.createdAt, item.id)));
}
function setupCandidate(storage) {
  const setup = listEonSetupResumeCandidates({ storage })[0] || null;
  if (!setup) return null;
  return candidate('setup', `Continue ${setup.setupId.replaceAll('-', ' ')} setup`, 'Resume the last explicit setup step. No sign-in or automatic action is required.', setup.destinationId, { handoff: `setup-${setup.setupId}` }, setup.updatedAt, setup.setupId);
}

export function listEonContinueCandidates({ localStorage = globalThis.localStorage, sessionStorage = globalThis.sessionStorage, now = Date.now() } = {}) {
  const rows = [...projectCandidates(localStorage), creatorJobCandidate(localStorage), creatorOutcomeCandidate(localStorage), setupCandidate(localStorage), cityMissionCandidate(localStorage), cityResumeCandidate(localStorage), chatCandidate(sessionStorage), creatorLibraryCandidate(localStorage)]
    .filter((row) => row && now - time(row.updatedAt) <= MAX_AGE_MS && time(row.updatedAt) <= now + 5 * 60 * 1000);
  return freeze(rows.sort((a, b) => {
    const recent = time(b.updatedAt) - time(a.updatedAt);
    return Math.abs(recent) > 24 * 60 * 60 * 1000 ? recent : (TYPE_PRIORITY.get(a.type) ?? 99) - (TYPE_PRIORITY.get(b.type) ?? 99) || recent;
  }));
}
export function resolveEonContinueCandidate(options = {}) { return listEonContinueCandidates(options)[0] || null; }
export function isEonContinueDismissed(storage = globalThis.localStorage, now = Date.now()) { return Number(read(storage, EON_CONTINUE_DISMISS_KEY) || 0) > now; }
export function dismissEonContinue(storage = globalThis.localStorage, now = Date.now(), days = W642_PRODUCT_TRUTH_RETENTION_CONTRACT.returnLoop.dismissalDays) {
  const until = now + Math.max(1, Math.min(30, Number(days) || 7)) * 24 * 60 * 60 * 1000;
  try { storage?.setItem?.(EON_CONTINUE_DISMISS_KEY, String(until)); } catch {}
  return until;
}
