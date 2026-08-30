/**
 * W362 / A-01 — canonical EONAPP automation action taxonomy.
 *
 * The taxonomy classifies the *effect* an automation could have. It does not
 * grant a connection, schedule, provider call, background runner, checkout,
 * publishing permission, or any external execution right. Current EONAPP
 * Automations remain local draft + simulation surfaces only.
 */

export const EON_ACTION_TAXONOMY_SCHEMA = 'eonapp.automation.action-taxonomy.v1';
export const EON_ACTION_TAXONOMY_VERSION = 1;

const ACTIONS = Object.freeze([
  Object.freeze({
    id: 'read',
    label: 'Read',
    shortLabel: 'Read information',
    risk: 'low',
    description: 'Inspect information from a service the user explicitly connected.',
    futureConnectionRequired: true,
    explicitApprovalRequired: false,
    policyRequired: false,
    currentRuntime: 'simulation-only',
    futureRule: 'A future connection must be scoped to the minimum readable data and remain revocable.'
  }),
  Object.freeze({
    id: 'draft',
    label: 'Draft',
    shortLabel: 'Prepare a draft',
    risk: 'low',
    description: 'Prepare text, a file, a plan, or a proposed change without sending it externally.',
    futureConnectionRequired: false,
    explicitApprovalRequired: false,
    policyRequired: false,
    currentRuntime: 'local-draft-or-simulation',
    futureRule: 'A draft is never treated as sent, published, filed, or completed.'
  }),
  Object.freeze({
    id: 'write',
    label: 'Write',
    shortLabel: 'Create or edit',
    risk: 'medium',
    description: 'Create or change a remote record, task, event, document, or message draft in a connected service.',
    futureConnectionRequired: true,
    explicitApprovalRequired: true,
    policyRequired: true,
    currentRuntime: 'simulation-only',
    futureRule: 'Show the destination, changed fields, account, and scope before the user confirms.'
  }),
  Object.freeze({
    id: 'publish',
    label: 'Publish',
    shortLabel: 'Send or publish',
    risk: 'high',
    description: 'Send an external message or make content visible to another person, audience, or platform.',
    futureConnectionRequired: true,
    explicitApprovalRequired: true,
    policyRequired: true,
    currentRuntime: 'simulation-only',
    futureRule: 'Require final destination confirmation immediately before a future publish operation.'
  }),
  Object.freeze({
    id: 'spend',
    label: 'Spend',
    shortLabel: 'Spend money',
    risk: 'critical',
    description: 'Create a financial commitment, paid order, paid campaign, purchase, charge, or transfer.',
    futureConnectionRequired: true,
    explicitApprovalRequired: true,
    policyRequired: true,
    currentRuntime: 'blocked',
    futureRule: 'Keep disabled until separate merchant, budget, refund, fraud, and legal approval gates are complete.'
  }),
  Object.freeze({
    id: 'delete',
    label: 'Delete',
    shortLabel: 'Remove data',
    risk: 'critical',
    description: 'Remove or destroy local or remote information, settings, files, or records.',
    futureConnectionRequired: true,
    explicitApprovalRequired: true,
    policyRequired: true,
    currentRuntime: 'blocked',
    futureRule: 'Require typed confirmation, reversible-trash preference where available, and an action receipt.'
  }),
  Object.freeze({
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Change access or settings',
    risk: 'critical',
    description: 'Change permissions, account configuration, security settings, billing settings, or another user’s access.',
    futureConnectionRequired: true,
    explicitApprovalRequired: true,
    policyRequired: true,
    currentRuntime: 'blocked',
    futureRule: 'Keep disabled by default and require a dedicated administrator policy plus a separate re-authentication flow.'
  })
]);

export const EON_ACTION_CLASS_IDS = Object.freeze(ACTIONS.map((item) => item.id));
const BY_ID = new Map(ACTIONS.map((item) => [item.id, item]));
const LEGACY_APPROVAL_MAP = Object.freeze({
  read: 'read',
  draft: 'draft',
  submit: 'write',
  sensitive: 'admin',
  publish: 'publish',
  spend: 'spend',
  delete: 'delete',
  admin: 'admin',
  write: 'write'
});

function cloneAction(action) {
  if (!action) return null;
  return Object.freeze({ ...action });
}

export function getEonActionClass(id = '') {
  return cloneAction(BY_ID.get(String(id || '').trim().toLowerCase()) || null);
}

export function listEonActionClasses() {
  return Object.freeze(ACTIONS.map(cloneAction));
}

/**
 * Normalises legacy workflow approval labels into this stable taxonomy.
 * Unknown labels intentionally become `draft`, never an executable high-risk class.
 */
export function normalizeEonActionClass(value = '') {
  const key = String(value || '').trim().toLowerCase();
  return LEGACY_APPROVAL_MAP[key] || (BY_ID.has(key) ? key : 'draft');
}

export function getEonActionPolicy(id = '') {
  const action = getEonActionClass(normalizeEonActionClass(id));
  if (!action) return Object.freeze({ known: false, id: 'draft', currentRuntime: 'simulation-only' });
  return Object.freeze({
    known: true,
    id: action.id,
    label: action.label,
    risk: action.risk,
    currentRuntime: action.currentRuntime,
    futureConnectionRequired: action.futureConnectionRequired,
    explicitApprovalRequired: action.explicitApprovalRequired,
    policyRequired: action.policyRequired,
    externalExecutionActive: false,
    note: action.futureRule
  });
}

export function getEonActionTaxonomyTruth() {
  return Object.freeze({
    schema: EON_ACTION_TAXONOMY_SCHEMA,
    version: EON_ACTION_TAXONOMY_VERSION,
    actionClasses: [...EON_ACTION_CLASS_IDS],
    currentRuntime: 'local draft and simulation only',
    externalExecutionActive: false,
    neverClaims: Object.freeze([
      'connected provider access',
      'background execution',
      'automatic publishing',
      'spending authority',
      'deletion authority',
      'administrator authority'
    ])
  });
}

export function validateEonActionTaxonomy() {
  const errors = [];
  const expected = ['read', 'draft', 'write', 'publish', 'spend', 'delete', 'admin'];
  if (JSON.stringify(EON_ACTION_CLASS_IDS) !== JSON.stringify(expected)) errors.push('Action taxonomy must keep the locked seven-class order.');
  for (const action of ACTIONS) {
    if (!action.label || !action.description || !action.futureRule) errors.push(`Action ${action.id} needs complete user-facing truth.`);
    if (!['low', 'medium', 'high', 'critical'].includes(action.risk)) errors.push(`Action ${action.id} has an invalid risk level.`);
    if (!['simulation-only', 'local-draft-or-simulation', 'blocked'].includes(action.currentRuntime)) errors.push(`Action ${action.id} has an invalid current runtime.`);
  }
  for (const highRisk of ['write', 'publish', 'spend', 'delete', 'admin']) {
    const action = BY_ID.get(highRisk);
    if (!action?.explicitApprovalRequired || !action?.policyRequired) errors.push(`${highRisk} must require a future policy and explicit approval.`);
  }
  for (const blocked of ['spend', 'delete', 'admin']) {
    if (BY_ID.get(blocked)?.currentRuntime !== 'blocked') errors.push(`${blocked} must remain blocked in W362.`);
  }
  return Object.freeze(errors);
}

export default Object.freeze({
  EON_ACTION_TAXONOMY_SCHEMA,
  EON_ACTION_TAXONOMY_VERSION,
  EON_ACTION_CLASS_IDS,
  getEonActionClass,
  listEonActionClasses,
  normalizeEonActionClass,
  getEonActionPolicy,
  getEonActionTaxonomyTruth,
  validateEonActionTaxonomy
});
