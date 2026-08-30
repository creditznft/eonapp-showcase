import { getWorkflowTemplate } from '../utils/automation-workflow-engine.js';
import { getEonPremiumCapability } from '../capabilities/eon-premium-capability-registry.js';

/**
 * RT92 premium workflow blueprints.
 *
 * These records deliberately reuse existing local workflow templates. They are
 * not scheduled workflows and do not create automation records. Recurrence,
 * monitoring and unattended work remain blocked until a certified durable
 * runtime exists.
 */
export const EON_PREMIUM_WORKFLOW_BLUEPRINT_SCHEMA = 'eonapp.premium-workflow-blueprints.rt92.v1';
const freeze = Object.freeze;

function blueprint(record) {
  return freeze({
    recurringRuntimeRequired: true,
    createsWorkflow: false,
    startsWorkflow: false,
    schedulesWorkflow: false,
    readsExternalSource: false,
    externalEffect: false,
    ...record,
    templateIds: freeze([...(record.templateIds || [])]),
    reviewedSourceClasses: freeze([...(record.reviewedSourceClasses || [])])
  });
}

export const EON_PREMIUM_WORKFLOW_BLUEPRINTS = freeze([
  blueprint({
    id: 'business-intelligence-briefs',
    label: 'Recurring Business Intelligence Brief',
    canonicalRoute: '/automations',
    templateIds: ['local-business-brief', 'local-competitor-review'],
    reviewedSourceClasses: ['user-supplied-business-context', 'lawful-public-observations'],
    outputBoundary: 'reviewable-local-brief',
    note: 'One-shot local briefs already exist. Premium value is reviewed recurrence, orchestration and capacity—not a duplicate Business dashboard.'
  }),
  blueprint({
    id: 'opportunity-monitor',
    label: 'Opportunity Monitor',
    canonicalRoute: '/automations',
    templateIds: ['local-research-decision', 'local-competitor-review', 'local-business-brief'],
    reviewedSourceClasses: ['user-approved-public-sources', 'user-supplied-observations'],
    outputBoundary: 'reviewable-opportunity-observation',
    note: 'No autonomous source collection is released. A future connector/source policy must be separately approved.'
  }),
  blueprint({
    id: 'recurring-professional-workflows',
    label: 'Recurring Professional Workflows',
    canonicalRoute: '/automations',
    templateIds: ['local-project-rescue', 'local-meeting-decision', 'local-documentation-handoff'],
    reviewedSourceClasses: ['user-owned-project-context'],
    outputBoundary: 'reviewable-local-workflow-result'
  }),
  blueprint({
    id: 'client-delivery-workflow',
    label: 'Client Delivery Workflow',
    capabilityId: 'client-workspaces',
    canonicalRoute: '/automations',
    templateIds: ['local-client-delivery'],
    reviewedSourceClasses: ['project-scoped-client-context'],
    outputBoundary: 'reviewable-local-client-delivery',
    note: 'Existing client-delivery drafting is reused; no message, invoice or client action is sent automatically.'
  }),
  blueprint({
    id: 'campaign-review-workflow',
    label: 'Campaign Review Workflow',
    capabilityId: 'business-intelligence-briefs',
    canonicalRoute: '/automations',
    templateIds: ['local-campaign-review'],
    reviewedSourceClasses: ['user-supplied-campaign-observations'],
    outputBoundary: 'reviewable-local-campaign-brief'
  })
]);

export function getEonPremiumWorkflowBlueprint(id = '') {
  const key = String(id || '').trim();
  return EON_PREMIUM_WORKFLOW_BLUEPRINTS.find((item) => item.id === key) || null;
}

export function validateEonPremiumWorkflowBlueprints() {
  const errors = [];
  const ids = new Set();
  for (const item of EON_PREMIUM_WORKFLOW_BLUEPRINTS) {
    if (!item.id || ids.has(item.id)) errors.push(`Duplicate or missing blueprint id: ${item.id || '(blank)'}.`);
    ids.add(item.id);
    const capabilityId = item.capabilityId || item.id;
    const capability = getEonPremiumCapability(capabilityId);
    if (!capability) errors.push(`${item.id} must map to an existing premium capability.`);
    if (!item.templateIds.length) errors.push(`${item.id} must reuse at least one existing workflow template.`);
    for (const templateId of item.templateIds) if (!getWorkflowTemplate(templateId)) errors.push(`${item.id} references missing workflow template ${templateId}.`);
    if (item.createsWorkflow || item.startsWorkflow || item.schedulesWorkflow || item.readsExternalSource || item.externalEffect) errors.push(`${item.id} blueprint must remain non-executing.`);
    if (item.recurringRuntimeRequired !== true) errors.push(`${item.id} recurrence must remain tied to the future durable runtime.`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_WORKFLOW_BLUEPRINT_SCHEMA, blueprintCount: EON_PREMIUM_WORKFLOW_BLUEPRINTS.length });
}

export default freeze({
  EON_PREMIUM_WORKFLOW_BLUEPRINT_SCHEMA,
  EON_PREMIUM_WORKFLOW_BLUEPRINTS,
  getEonPremiumWorkflowBlueprint,
  validateEonPremiumWorkflowBlueprints
});
