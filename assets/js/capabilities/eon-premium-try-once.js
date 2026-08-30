/**
 * RT92 premium TRY ONCE handoff model.
 *
 * Reuses existing universal/local workflows where a safe one-shot experience
 * already exists. It does not grant the recurring premium capability and does
 * not create a workflow automatically; the user is sent to the canonical
 * existing surface to review/start it explicitly.
 */
import { getEonPremiumCapability } from './eon-premium-capability-registry.js';

export const EON_PREMIUM_TRY_ONCE_SCHEMA = 'eonapp.premium-try-once.rt92.v1';
const freeze = (value) => Object.freeze(value);

const HANDOFFS = freeze({
  'business-intelligence-briefs': freeze({ route: '/automations', existingFoundation: 'local-business-brief', label: 'Prepare one local Business Brief' }),
  'professional-project-orchestration': freeze({ route: '/projects', existingFoundation: 'projects', label: 'Review one project with the existing Project tools' }),
  'local-ai-autopilot': freeze({ route: '/local-ai', existingFoundation: 'local-model-lifecycle+routing-policy', label: 'Review the best local route for this device' }),
  'project-ai-profiles': freeze({ route: '/local-ai', existingFoundation: 'project-scoped-ai-memory+routing-policy', label: 'Review project AI preferences' }),
  'multi-model-orchestration': freeze({ route: '/local-ai', existingFoundation: 'provider-orchestration+routing-policy', label: 'Review an approved routing envelope' }),
  'forge-repository-intelligence': freeze({ route: '/forge', existingFoundation: 'forge-github-review-lane', label: 'Review repository readiness in Forge' }),
  'client-workspaces': freeze({ route: '/projects', existingFoundation: 'projects+project-context', label: 'Preview client grouping on existing Projects' })
});

export function buildEonPremiumTryOnceHandoff(capabilityId = '') {
  const capability = getEonPremiumCapability(capabilityId);
  const handoff = HANDOFFS[capabilityId] || null;
  if (!capability || capability.tryOnceEligible !== true || !handoff) {
    return freeze({ ok: false, schema: EON_PREMIUM_TRY_ONCE_SCHEMA, capabilityId: String(capabilityId || ''), reason: 'try-once-not-available', entitlementGranted: false, recurringCapabilityGranted: false, executionStarted: false });
  }
  return freeze({
    ok: true,
    schema: EON_PREMIUM_TRY_ONCE_SCHEMA,
    capabilityId: capability.id,
    label: handoff.label,
    route: handoff.route,
    existingFoundation: handoff.existingFoundation,
    mode: 'explicit-review-handoff',
    entitlementGranted: false,
    recurringCapabilityGranted: false,
    checkoutStarted: false,
    executionStarted: false,
    networkRequestCreated: false,
    note: 'TRY ONCE reuses an existing safe one-shot/local foundation. It does not unlock recurring automation, concurrency, hosted capacity or the future paid tier.'
  });
}

export function validateEonPremiumTryOnce() {
  const errors = [];
  for (const [id] of Object.entries(HANDOFFS)) {
    const result = buildEonPremiumTryOnceHandoff(id);
    if (!result.ok) errors.push(`${id} is marked TRY ONCE but has no safe canonical handoff.`);
    if (result.entitlementGranted || result.recurringCapabilityGranted || result.checkoutStarted || result.executionStarted || result.networkRequestCreated) errors.push(`${id} TRY ONCE must remain a non-granting explicit handoff.`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_TRY_ONCE_SCHEMA, handoffCount: Object.keys(HANDOFFS).length });
}

export default freeze({ EON_PREMIUM_TRY_ONCE_SCHEMA, buildEonPremiumTryOnceHandoff, validateEonPremiumTryOnce });
