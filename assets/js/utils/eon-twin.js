/**
 * EON Twin Service (Scoped v1)
 * Bounded autonomy only:
 * - allowed: moderation review, draft generation, research prep
 * - denied: financial actions, publishing actions, or unapproved execution
 * Safety stack (three layers):
 *   1. Allowlist verb parser — action must start with an explicit safe verb
 *   2. Forbidden pattern regex — blocks finance/publish keywords
 *   3. Constitution check — checks against user-defined hard_block rules
 */

import eonConstitutionService from './eon-constitution.js';

const TWIN_TASKS_KEY = 'eon:twin:tasks:v1';
const TWIN_LOGS_KEY = 'eon:twin:logs:v1';

const /** @type {any} */
ALLOWED_TASK_TYPES = new Set([
  'moderation_review',
  'draft_generation',
  'research_prep'
]);

const /** @type {any} */
FORBIDDEN_PATTERNS = [
  /(send|transfer|withdraw|swap|buy|sell|stake|bridge|payment|invoice|wallet|treasury)/i,
  /(publish|post|upload|broadcast|schedule post|go live|deploy public)/i
];

// Explicit allowlist of safe action verbs for Twin v1.
// Any proposed action MUST begin with one of these verbs.
const /** @type {any} */
ALLOWED_VERBS = new Set([
  'analyze', 'summarize', 'draft', 'review', 'classify',
  'translate', 'extract', 'research', 'compare', 'outline',
  'score', 'flag', 'suggest', 'proofread', 'annotate',
  'evaluate', 'describe', 'identify', 'list', 'explain',
  'generate', 'check', 'audit', 'reorganize', 'prioritize'
]);

/**
 * Parse the first verb from an action string and validate it against the allowlist.
 * Returns { allowed, verb, reason }.
 */
function parseAndValidateAction(/** @type {any} */ text) {
  const cleaned = String(text || '').trim().toLowerCase();
  if (!cleaned) return { allowed: false, verb: '', reason: 'Empty action.' };

  // Extract first word (the verb)
  const firstWord = cleaned.split(/\s+/)[0].replace(/[^a-z]/g, '');
  if (!firstWord) return { allowed: false, verb: '', reason: 'Could not extract action verb.' };

  if (!ALLOWED_VERBS.has(firstWord)) {
    return {
      allowed: false,
      verb: firstWord,
      reason: `Verb "${firstWord}" is not in the Twin v1 allowlist. Use: analyze, summarize, draft, review, classify, translate, extract, research, compare, outline, score, flag, suggest, proofread, annotate, evaluate, describe, identify, list, explain, generate, check, audit, reorganize, or prioritize.`
    };
  }
  return { allowed: true, verb: firstWord, reason: 'OK' };
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(fallback)
      ? (Array.isArray(parsed) ? parsed : fallback)
      : (parsed && typeof parsed === 'object' ? parsed : fallback);
  } catch {
    return fallback;
  }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function makeId(/** @type {any} */ prefix) {
  const rnd = crypto.getRandomValues(new Uint8Array(4)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'');
  return `${prefix}-${Date.now()}-${rnd}`;
}

function isForbiddenAction(/** @type {any} */ text) {
  return FORBIDDEN_PATTERNS.some((/** @type {any} */ rx) => rx.test(String(text || '')));
}

class EONTwinService {
  constructor() {
    this.tasks = loadJson(TWIN_TASKS_KEY, []);
    this.logs = loadJson(TWIN_LOGS_KEY, []);
  }

  _persist() {
    saveJson(TWIN_TASKS_KEY, this.tasks);
    saveJson(TWIN_LOGS_KEY, this.logs);
  }

  _log(/** @type {any} */ entry) {
    this.logs.push({ id: makeId('log'), ts: Date.now(), ...entry });
    if (this.logs.length > 300) this.logs = this.logs.slice(-300);
  }

  createTask(/** @type {any} */ { title, type, details, createdBy }) {
    if (!title || !String(title).trim()) {
      return { success: false, error: 'Task title is required.' };
    }
    if (!ALLOWED_TASK_TYPES.has(type)) {
      return { success: false, error: 'Unsupported task type for Twin v1.' };
    }

    const /** @type {any} */
task = {
      id: makeId('twin'),
      title: String(title).trim(),
      type,
      details: String(details || '').trim(),
      status: 'draft',
      createdBy: createdBy || 'operator',
      createdAt: Date.now(),
      approval: null,
      proposedAction: '',
      result: ''
    };

    this.tasks.push(task);
    this._log({ type: 'task_created', taskId: task.id, taskType: type, title: task.title });
    this._persist();
    return { success: true, task };
  }

  requestExecution(/** @type {any} */ taskId, /** @type {any} */ actionText) {
    let task = this.tasks.find((/** @type {any} */ t) => t.id === taskId);
    if (!task) {
      task = {
        id: String(taskId || makeId('twin')),
        title: 'Ad-hoc Twin request',
        type: 'research_prep',
        details: '',
        status: 'draft',
        createdBy: 'operator',
        createdAt: Date.now(),
        approval: null,
        proposedAction: '',
        result: ''
      };
      this.tasks.push(task);
    }

    const text = String(actionText || '').trim();
    if (!text) return { success: false, error: 'Execution action is required.' };

    // Layer 1: allowlist verb check
    const verbCheck = parseAndValidateAction(text);
    if (!verbCheck.allowed) {
      task.status = 'blocked';
      task.proposedAction = text;
      this._log({
        type: 'execution_blocked',
        taskId: task.id,
        reason: 'verb_not_allowed',
        verb: verbCheck.verb,
        action: text
      });
      this._persist();
      return { success: false, blocked: true, approved: false, reason: verbCheck.reason, error: verbCheck.reason };
    }

    // Layer 2: forbidden pattern check
    if (isForbiddenAction(text)) {
      task.status = 'blocked';
      task.proposedAction = text;
      this._log({
        type: 'execution_blocked',
        taskId: task.id,
        reason: 'forbidden_action',
        action: text
      });
      this._persist();
      return {
        success: false,
        blocked: true,
        approved: false,
        reason: 'Blocked by policy: financial and publishing actions are forbidden in Twin v1.',
        error: 'Blocked by policy: financial and publishing actions are forbidden in Twin v1.'
      };
    }

    // Layer 3: Constitution check
    const constitutionResult = eonConstitutionService.checkAction(text, null);
    if (!constitutionResult.allowed) {
      task.status = 'blocked';
      task.proposedAction = text;
      const violation = constitutionResult.violations[0];
      this._log({
        type: 'execution_blocked',
        taskId: task.id,
        reason: 'constitution_violation',
        ruleId: violation?.id,
        action: text
      });
      this._persist();
      return {
        success: false,
        blocked: true,
        approved: false,
        reason: `Blocked by Constitution: ${violation?.text || 'Rule violation'}`,
        error: `Blocked by Constitution: ${violation?.text || 'Rule violation'}`
      };
    }

    task.status = 'awaiting_approval';
    task.proposedAction = text;
    this._log({ type: 'approval_requested', taskId: task.id, action: text });
    this._persist();
    return { success: true, approved: false, reason: 'Pending explicit approval.', task };
  }

  approveExecution(/** @type {any} */ taskId, /** @type {any} */ { approver, note }) {
    const task = this.tasks.find((/** @type {any} */ t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (task.status !== 'awaiting_approval') {
      return { success: false, error: 'Task is not waiting for approval.' };
    }

    task.approval = {
      approver: approver || 'CEO',
      note: String(note || '').trim(),
      approvedAt: Date.now()
    };
    task.status = 'approved';
    this._log({ type: 'approved', taskId: task.id, approver: task.approval.approver });
    this._persist();
    return { success: true, task };
  }

  executeApproved(/** @type {any} */ taskId, /** @type {any} */ outputText) {
    const task = this.tasks.find((/** @type {any} */ t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (task.status !== 'approved' || !task.approval) {
      return { success: false, error: 'Explicit approval is required before execution.' };
    }
    if (isForbiddenAction(task.proposedAction)) {
      task.status = 'blocked';
      this._log({ type: 'execution_blocked', taskId: task.id, reason: 'forbidden_action_recheck' });
      this._persist();
      return { success: false, blocked: true, error: 'Execution blocked by policy.' };
    }

    task.status = 'completed';
    task.result = String(outputText || 'Executed safely within Twin v1 scope.').trim();
    task.completedAt = Date.now();

    this._log({ type: 'executed', taskId: task.id, taskType: task.type });
    this._persist();
    return { success: true, task };
  }

  getTasks(/** @type {any} */ limit = 50) {
    return this.tasks.slice(-limit).reverse();
  }

  getLogs(/** @type {any} */ limit = 50) {
    return this.logs.slice(-limit).reverse();
  }

  getPolicySummary() {
    return {
      allowedTaskTypes: Array.from(ALLOWED_TASK_TYPES),
      allowedVerbs: Array.from(ALLOWED_VERBS),
      forbiddenDomains: ['financial_actions', 'publishing_actions'],
      requiresApproval: true
    };
  }

  getStats() {
    const /** @type {any} */
stats = { draft: 0, awaiting_approval: 0, approved: 0, completed: 0, blocked: 0 };
    this.tasks.forEach((/** @type {any} */ t) => {
      if ((/** @type {any} */ (stats))[t.status] !== undefined) (/** @type {any} */ (stats))[t.status] += 1;
    });
    return {
      ...stats,
      total: this.tasks.length,
      logs: this.logs.length
    };
  }
}

const eonTwinService = new EONTwinService();
export default eonTwinService;
