import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeEonDurableWorkflowAdmission,
  getEonDurableWorkflowPilotTruth
} from '../../durable-work/worker/src/eon-durable-workflow-contract.js';

const root = new URL('../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('workflow admission accepts only opaque server authority references', () => {
  const good = normalizeEonDurableWorkflowAdmission({ accountRef: 'acct:1', proposalId: 'workproposal:1', leaseId: 'worklease:1' });
  assert.equal(good.ok, true);
  assert.equal(normalizeEonDurableWorkflowAdmission({ ...good, prompt: 'nope' }).ok, false);
  assert.equal(normalizeEonDurableWorkflowAdmission({ accountRef: 'acct:1', proposalId: 'workproposal:1' }).ok, false);
});

test('workflow pilot truth stops before provider execution and commerce', () => {
  const truth = getEonDurableWorkflowPilotTruth();
  assert.equal(truth.pilotOnly, true);
  assert.equal(truth.productionEnabled, false);
  assert.equal(truth.providerExecutionImplemented, false);
  assert.equal(truth.externalEffectsImplemented, false);
  assert.equal(truth.createsDodoProduct, false);
  assert.equal(truth.grantsEntitlement, false);
});

test('Cloudflare workflow class verifies proposal + capacity lease then stops at executor boundary', () => {
  const source = read('durable-work/worker/src/workflow.js');
  assert.match(source, /WorkflowEntrypoint/);
  assert.match(source, /eon_durable_work_proposals/);
  assert.match(source, /eon_work_capacity_leases/);
  assert.match(source, /blocked-executor-not-certified/);
  assert.match(source, /executionStarted:\s*false/);
  assert.doesNotMatch(source, /api\.openai|api\.groq|generativelanguage|vexrail/i);
});

test('private worker service has closed public fetch and testing-only Workflow creation', () => {
  const source = read('durable-work/worker/src/index.js');
  assert.match(source, /status:\s*404/);
  assert.match(source, /EON_DURABLE_WORK_ROLLOUT/);
  assert.match(source, /!==\s*'testing'/);
  assert.match(source, /EON_DURABLE_WORKFLOW\.create/);
});

test('pilot Wrangler file is a non-deployable template and current Pages Wrangler remains untouched', () => {
  const pilot = read('durable-work/worker/wrangler.pilot.template.jsonc');
  const pages = read('wrangler.jsonc');
  assert.match(pilot, /REPLACE_WITH_APPROVED_EON_WORK_DB_ID/);
  assert.match(pilot, /"workflows"/);
  assert.match(pilot, /"EON_DURABLE_WORKFLOW"/);
  assert.match(pilot, /"EON_WORK_DB"/);
  assert.match(pilot, /"EON_DURABLE_WORK_ROLLOUT":\s*"disabled"/);
  assert.equal(pages.includes('EON_DURABLE_WORKFLOW'), false);
  assert.equal(pages.includes('EON_WORK_DB'), false);
});
