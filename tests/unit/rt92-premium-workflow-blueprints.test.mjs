import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_PREMIUM_WORKFLOW_BLUEPRINTS,
  getEonPremiumWorkflowBlueprint,
  validateEonPremiumWorkflowBlueprints
} from '../../assets/js/automation/eon-premium-workflow-blueprints.js';

test('premium business/client workflow plans reuse existing local templates', () => {
  const validation = validateEonPremiumWorkflowBlueprints();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const brief = getEonPremiumWorkflowBlueprint('business-intelligence-briefs');
  assert.ok(brief.templateIds.includes('local-business-brief'));
  assert.ok(brief.templateIds.includes('local-competitor-review'));
  const client = getEonPremiumWorkflowBlueprint('client-delivery-workflow');
  assert.deepEqual(client.templateIds, ['local-client-delivery']);
});

test('opportunity monitor remains reviewed-source design, not autonomous scraping', () => {
  const monitor = getEonPremiumWorkflowBlueprint('opportunity-monitor');
  assert.equal(monitor.recurringRuntimeRequired, true);
  assert.equal(monitor.readsExternalSource, false);
  assert.equal(monitor.schedulesWorkflow, false);
  assert.equal(monitor.externalEffect, false);
  assert.ok(monitor.reviewedSourceClasses.includes('user-approved-public-sources'));
});

test('all premium workflow blueprints are non-executing and create no second workflow store', () => {
  for (const item of EON_PREMIUM_WORKFLOW_BLUEPRINTS) {
    assert.equal(item.createsWorkflow, false);
    assert.equal(item.startsWorkflow, false);
    assert.equal(item.schedulesWorkflow, false);
    assert.equal(item.externalEffect, false);
  }
});
