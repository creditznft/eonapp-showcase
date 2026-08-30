import { WorkerEntrypoint } from 'cloudflare:workers';
export { EonDurableWorkWorkflow } from './workflow.js';
import { normalizeEonDurableWorkflowAdmission } from './eon-durable-workflow-contract.js';

/**
 * Private service-binding entrypoint for the future Pages -> Workflows pilot.
 * Public fetch is deliberately closed. The service method remains testing-only.
 */
export default class EonDurableWorkService extends WorkerEntrypoint {
  async fetch() { return new Response(null, { status: 404 }); }

  async createPreparedInstance(payload) {
    if (String(this.env.EON_DURABLE_WORK_ROLLOUT || '').toLowerCase() !== 'testing') {
      return { ok: false, reason: 'durable-work-pilot-disabled', workflowCreated: false };
    }
    const input = normalizeEonDurableWorkflowAdmission(payload);
    if (!input.ok) return { ...input, workflowCreated: false };
    const instance = await this.env.EON_DURABLE_WORKFLOW.create({
      id: input.proposalId,
      params: input
    });
    return {
      ok: true,
      workflowCreated: true,
      instanceId: instance.id,
      proposalId: input.proposalId,
      executionStartedByService: false,
      providerRequestCreatedByService: false
    };
  }
}
