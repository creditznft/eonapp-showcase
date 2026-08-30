/**
 * W288-A0 — local review-only inspector for ordinary-work project handoffs.
 * It deliberately never writes Projects, calls a network service, or treats a
 * handoff as a restore, publication, delivery, or ownership proof.
 */
import { EON_PROJECT_HANDOFF_SCHEMA, containsSecretLikeValue } from './eon-workspace-store.js';

export const PROJECT_HANDOFF_PREFLIGHT_SCHEMA = 'eon.project-handoff-preflight.v1';
export const PROJECT_HANDOFF_MAX_BYTES = 512_000;

const PROJECT_KEYS = new Set(['id', 'title', 'summary', 'status', 'tasks', 'artifacts', 'createdAt', 'updatedAt']);
const TASK_KEYS = new Set(['id', 'title', 'status', 'note', 'createdAt', 'updatedAt']);
const ARTIFACT_KEYS = new Set(['id', 'type', 'title', 'content', 'createdAt', 'updatedAt']);
const ALLOWED_SCOPE = 'local-ordinary-work-export';

function safeText(value = '', max = 12_000) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, max);
}

function hasOnlyKeys(value = {}, keys = new Set()) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => keys.has(key));
}

function hasSecretLikeText(value = {}) {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some((item) => typeof item === 'string' && containsSecretLikeValue(item));
}

function fail(code, message) {
  return Object.freeze({
    schema: PROJECT_HANDOFF_PREFLIGHT_SCHEMA,
    ok: false,
    code,
    message,
    reviewOnly: true,
    directImportAvailable: false,
    summary: null
  });
}

function countRows(rows, max) {
  return Array.isArray(rows) && rows.length <= max ? rows : null;
}

export function inspectProjectHandoffCandidate(candidate = {}) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return fail('HANDOFF_NOT_OBJECT', 'This file does not contain a project handoff object.');
  if (candidate.schema !== EON_PROJECT_HANDOFF_SCHEMA) return fail('HANDOFF_SCHEMA_UNSUPPORTED', 'This file is not a supported local EONAPP project handoff.');
  if (candidate.scope !== ALLOWED_SCOPE) return fail('HANDOFF_SCOPE_UNSUPPORTED', 'Only ordinary-work project handoffs can be reviewed here.');
  if (candidate.recovery?.directImportAvailable !== false) return fail('DIRECT_IMPORT_REJECTED', 'This handoff cannot be imported, restored, merged, or used to overwrite local Projects.');
  if (candidate.project?.automationIds || candidate.automation || candidate.vault || candidate.wallet || candidate.payment || candidate.identity) {
    return fail('SENSITIVE_OR_AUTOMATION_STATE_REJECTED', 'This handoff includes a blocked automation, value, identity, or sensitive-state field.');
  }
  const project = candidate.project;
  if (!hasOnlyKeys(project, PROJECT_KEYS)) return fail('PROJECT_FIELDS_REJECTED', 'This handoff includes unrecognized project fields and was not reviewed.');
  const tasks = countRows(project.tasks, 160);
  const artifacts = countRows(project.artifacts, 120);
  if (!tasks || !artifacts) return fail('HANDOFF_SIZE_REJECTED', 'This handoff exceeds the ordinary-work project limits.');
  if (!tasks.every((task) => hasOnlyKeys(task, TASK_KEYS)) || !artifacts.every((artifact) => hasOnlyKeys(artifact, ARTIFACT_KEYS))) {
    return fail('ITEM_FIELDS_REJECTED', 'This handoff includes unrecognized task or artefact fields and was not reviewed.');
  }
  if (hasSecretLikeText(project) || tasks.some(hasSecretLikeText) || artifacts.some(hasSecretLikeText)) {
    return fail('SECRET_LIKE_CONTENT_REJECTED', 'This handoff appears to contain a credential or recovery secret. Review it outside Projects and keep sensitive material in Vault.');
  }
  const title = safeText(project.title, 180);
  const projectId = safeText(project.id, 140);
  if (!title || !projectId) return fail('PROJECT_IDENTITY_MISSING', 'This handoff is missing a project title or local record identifier.');
  return Object.freeze({
    schema: PROJECT_HANDOFF_PREFLIGHT_SCHEMA,
    ok: true,
    code: 'REVIEW_ONLY_VALID',
    message: 'Local handoff reviewed. Nothing was imported, merged, saved, published, delivered, or overwritten.',
    reviewOnly: true,
    directImportAvailable: false,
    summary: Object.freeze({
      id: projectId,
      title,
      status: safeText(project.status, 40) || 'active',
      taskCount: tasks.length,
      artifactCount: artifacts.length,
      generatedAt: safeText(candidate.generatedAt, 80) || null,
      recoveryRoute: safeText(candidate.recovery?.fullProfileBackupRoute, 120) || '/capsule'
    })
  });
}

export function parseProjectHandoffText(text = '') {
  const source = String(text || '');
  if (!source.trim()) return fail('HANDOFF_EMPTY', 'Choose a local JSON handoff file first.');
  if (source.length > PROJECT_HANDOFF_MAX_BYTES) return fail('HANDOFF_FILE_TOO_LARGE', 'That file is too large for the local review-only handoff inspector.');
  try {
    return inspectProjectHandoffCandidate(JSON.parse(source));
  } catch {
    return fail('HANDOFF_JSON_INVALID', 'That file is not valid JSON. Nothing was imported.');
  }
}

export default Object.freeze({
  PROJECT_HANDOFF_PREFLIGHT_SCHEMA,
  PROJECT_HANDOFF_MAX_BYTES,
  inspectProjectHandoffCandidate,
  parseProjectHandoffText
});
