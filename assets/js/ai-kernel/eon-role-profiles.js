/**
 * W317 — bounded role profiles for the local-first EON AI Kernel.
 *
 * Roles are policy labels, not independent autonomous processes. They may
 * classify foreground work and prepare a review/export handoff, but they never
 * receive credentials, publish, schedule, spend, deploy, approve themselves,
 * or create a network request.
 */

export const EON_KERNEL_ROLE_SCHEMA = 'eonapp.kernel-role-profile.v1';

const ROLE_PROFILES = Object.freeze({
  coordinator: Object.freeze({ role: 'coordinator', cityRole: 'coordinator', cityAction: 'chat', allowedTaskClasses: Object.freeze(['chat', 'plan', 'workflow']), safeLabel: 'Planning your local work' }),
  researcher: Object.freeze({ role: 'researcher', cityRole: 'researcher', cityAction: 'research', allowedTaskClasses: Object.freeze(['research', 'content']), safeLabel: 'Researching a local draft' }),
  writer: Object.freeze({ role: 'writer', cityRole: 'researcher', cityAction: 'script', allowedTaskClasses: Object.freeze(['content', 'campaign', 'script']), safeLabel: 'Drafting local content' }),
  builder: Object.freeze({ role: 'builder', cityRole: 'builder', cityAction: 'build', allowedTaskClasses: Object.freeze(['build', 'code', 'project']), safeLabel: 'Preparing a build draft' }),
  'media-runner': Object.freeze({ role: 'media-runner', cityRole: 'builder', cityAction: 'video', allowedTaskClasses: Object.freeze(['image', 'video', 'audio', 'media']), safeLabel: 'Preparing media work' }),
  reviewer: Object.freeze({ role: 'reviewer', cityRole: 'reviewer', cityAction: 'plan', allowedTaskClasses: Object.freeze(['review', 'handoff']), safeLabel: 'Waiting for your review' })
});

const BLOCKED_EFFECTS = Object.freeze(['publish', 'send', 'schedule', 'deploy', 'connect-account', 'oauth', 'spend', 'transfer-value', 'wallet', 'token', 'referral-payout', 'background-run']);

function clean(value = '', max = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function getEonKernelRoleProfile(role = '') {
  return ROLE_PROFILES[String(role || '').trim()] || ROLE_PROFILES.coordinator;
}

/**
 * Reads intent only to derive a small safe class. It returns no source text and
 * never persists the input it inspected.
 */
export function classifyEonKernelIntent(input = '') {
  const source = String(input || '').toLowerCase();
  if (/(wallet|token|reward|referral|payout|earnings|swap|crypto|nft sale)/.test(source)) {
    return Object.freeze({ role: 'reviewer', taskClass: 'review', safeLabel: 'Blocked value-system request', blocked: true, reason: 'value-system-disabled' });
  }
  if (/(publish|post to|upload|schedule|send|oauth|connect (?:my )?(?:youtube|instagram|tiktok|linkedin|x|facebook))/.test(source)) {
    return Object.freeze({ role: 'reviewer', taskClass: 'review', safeLabel: 'Preparing a manual submission review', blocked: false, reason: 'manual-review-required' });
  }
  if (/(image|video|music|audio|voice|subtitle|storyboard|media)/.test(source)) {
    return Object.freeze({ role: 'media-runner', taskClass: 'media', safeLabel: 'Preparing media work', blocked: false, reason: 'foreground-media-plan' });
  }
  if (/(research|source|citation|compare|market study|audit)/.test(source)) {
    return Object.freeze({ role: 'researcher', taskClass: 'research', safeLabel: 'Researching a local draft', blocked: false, reason: 'foreground-research-plan' });
  }
  if (/(caption|campaign|script|copy|article|content|write)/.test(source)) {
    return Object.freeze({ role: 'writer', taskClass: 'content', safeLabel: 'Drafting local content', blocked: false, reason: 'foreground-content-plan' });
  }
  if (/(website|app|code|build|project|bug|design system)/.test(source)) {
    return Object.freeze({ role: 'builder', taskClass: 'build', safeLabel: 'Preparing a build draft', blocked: false, reason: 'foreground-build-plan' });
  }
  return Object.freeze({ role: 'coordinator', taskClass: 'chat', safeLabel: 'Planning your local work', blocked: false, reason: 'foreground-chat-plan' });
}

export function roleCanRequestExternalEffect(role = '', effect = '') {
  const profile = getEonKernelRoleProfile(role);
  const normalizedEffect = clean(effect, 64).toLowerCase();
  return Object.freeze({
    allowed: false,
    role: profile.role,
    effect: normalizedEffect,
    reason: BLOCKED_EFFECTS.includes(normalizedEffect) ? 'external-effect-disabled' : 'role-profiles-never-execute'
  });
}

export function getEonKernelRoleTruth() {
  return Object.freeze({
    schema: EON_KERNEL_ROLE_SCHEMA,
    roles: Object.freeze(Object.keys(ROLE_PROFILES)),
    autonomousAgents: false,
    selfApproval: false,
    externalEffects: false,
    credentialAccess: false,
    rawPromptStored: false,
    directNetwork: false
  });
}
