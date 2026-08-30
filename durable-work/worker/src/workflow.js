import { WorkflowEntrypoint } from 'cloudflare:workers';
import { normalizeEonDurableWorkflowAdmission } from './eon-durable-workflow-contract.js';

/**
 * Testing-only Cloudflare Workflows pilot.
 *
 * This verifies a prepared proposal + active server capacity lease durably, then
 * stops at the executor-certification boundary. No prompt, provider token,
 * external effect, hosted model call, billing mutation, or entitlement grant is
 * present in this class.
 */
export class EonDurableWorkWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const input = normalizeEonDurableWorkflowAdmission(event?.payload || {});
    if (!input.ok) throw new Error(`eon-durable-workflow:${input.reason}`);

    const admission = await step.do('verify-redacted-server-admission', async () => {
      const now = Date.now();
      const row = await this.env.EON_WORK_DB.prepare(`
        SELECT p.proposal_id,p.account_ref,p.capability_id,p.workload_class,p.requested_units,p.expires_at AS proposal_expires_at,
               l.lease_id,l.status AS lease_status,l.units_reserved,l.expires_at AS lease_expires_at
          FROM eon_durable_work_proposals p
          JOIN eon_work_capacity_leases l ON l.proposal_id=p.proposal_id AND l.account_ref=p.account_ref
         WHERE p.account_ref=? AND p.proposal_id=? AND l.lease_id=?
           AND p.status='prepared' AND p.workload_class='platform-hosted'
           AND p.expires_at>? AND l.status='active' AND l.expires_at>?
         LIMIT 1`)
        .bind(input.accountRef, input.proposalId, input.leaseId, now, now).first();
      if (!row) throw new Error('eon-durable-workflow:active-admission-not-found');
      return {
        proposalId: row.proposal_id,
        leaseId: row.lease_id,
        capabilityId: row.capability_id,
        requestedUnits: Number(row.requested_units || 0),
        unitsReserved: Number(row.units_reserved || 0),
        rawPromptLoaded: false,
        credentialLoaded: false
      };
    });

    return step.do('stop-before-provider-execution', async () => ({
      schema: 'eonapp.durable-workflow-pilot-result.rt92.v1',
      status: 'blocked-executor-not-certified',
      proposalId: admission.proposalId,
      leaseId: admission.leaseId,
      capabilityId: admission.capabilityId,
      executionStarted: false,
      providerRequestCreated: false,
      externalEffectCreated: false,
      billingMutationCreated: false,
      entitlementGrantCreated: false
    }));
  }
}
