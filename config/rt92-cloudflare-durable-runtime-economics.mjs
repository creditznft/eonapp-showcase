/**
 * RT92 Cloudflare durable-runtime account cost model.
 *
 * Design-only. This models the current documented Workers Paid marginal
 * dimensions for Workflows + D1 from a dated evidence snapshot. It does not
 * create resources, change Wrangler, reserve a bill, or authorize premium
 * product activation. Hosted AI/provider inference is intentionally excluded.
 */
export const RT92_CLOUDFLARE_DURABLE_COST_SCHEMA = 'eonapp.rt92.cloudflare-durable-cost.v1';
const freeze = Object.freeze;
const DAY_MS = 86_400_000;

function n(value = 0) { const x = Number(value); return Number.isFinite(x) ? Math.max(0, x) : 0; }
function over(usage, included) { return Math.max(0, n(usage) - n(included)); }
function id(value = '') { const text = String(value || '').trim(); return /^[a-zA-Z0-9._:/-]{4,220}$/.test(text) ? text : ''; }

export function validateRt92CloudflareDurableCostEvidence(evidence = {}, { nowMs = Date.now(), maxAgeDays = 31 } = {}) {
  const observedAtMs = Number(evidence.observedAtMs);
  const clock = Number(nowMs);
  const ageMs = Number.isFinite(observedAtMs) && Number.isFinite(clock) ? clock - observedAtMs : Infinity;
  const notMateriallyFuture = Number.isFinite(ageMs) && ageMs >= -5 * 60_000;
  const fresh = Number.isFinite(ageMs) && Math.max(0, ageMs) <= Math.max(1, Number(maxAgeDays) || 31) * DAY_MS;
  const workflow = evidence.workflowsPaid || {};
  const d1 = evidence.d1Paid || {};
  const required = [
    ['workflowsPaid.includedRequestsPerMonth', workflow.includedRequestsPerMonth],
    ['workflowsPaid.requestOverageUsdPerMillion', workflow.requestOverageUsdPerMillion],
    ['workflowsPaid.includedCpuMsPerMonth', workflow.includedCpuMsPerMonth],
    ['workflowsPaid.cpuOverageUsdPerMillionMs', workflow.cpuOverageUsdPerMillionMs],
    ['workflowsPaid.includedStorageGbMonth', workflow.includedStorageGbMonth],
    ['workflowsPaid.storageOverageUsdPerGbMonth', workflow.storageOverageUsdPerGbMonth],
    ['workflowsPaid.includedStepsPerMonth', workflow.includedStepsPerMonth],
    ['workflowsPaid.stepOverageUsdPer100k', workflow.stepOverageUsdPer100k],
    ['d1Paid.includedRowsReadPerMonth', d1.includedRowsReadPerMonth],
    ['d1Paid.rowsReadOverageUsdPerMillion', d1.rowsReadOverageUsdPerMillion],
    ['d1Paid.includedRowsWrittenPerMonth', d1.includedRowsWrittenPerMonth],
    ['d1Paid.rowsWrittenOverageUsdPerMillion', d1.rowsWrittenOverageUsdPerMillion],
    ['d1Paid.includedStorageGbMonth', d1.includedStorageGbMonth],
    ['d1Paid.storageOverageUsdPerGbMonth', d1.storageOverageUsdPerGbMonth]
  ];
  const invalid = required.filter(([, value]) => !Number.isFinite(Number(value)) || Number(value) < 0).map(([key]) => key);
  const sourceHost = String(evidence.sourceHost || '').toLowerCase();
  const officialSource = sourceHost === 'developers.cloudflare.com';
  return freeze({
    ok: Boolean(id(evidence.evidenceId)) && Number.isFinite(observedAtMs) && notMateriallyFuture && fresh && officialSource && invalid.length === 0,
    evidenceId: id(evidence.evidenceId),
    observedAtMs: Number.isFinite(observedAtMs) ? observedAtMs : null,
    ageDays: Number.isFinite(ageMs) ? Math.max(0, ageMs) / DAY_MS : null,
    fresh,
    notMateriallyFuture,
    officialSource,
    invalidFields: freeze(invalid),
    workflowBillingEffectiveFrom: String(evidence.workflowBillingEffectiveFrom || ''),
    sourceHost,
    hostedAiIncluded: false
  });
}

export function estimateRt92CloudflareDurableMonthlyOverage({ usage = {}, evidence = {}, nowMs = Date.now() } = {}) {
  const validation = validateRt92CloudflareDurableCostEvidence(evidence, { nowMs });
  if (!validation.ok) return freeze({ ok: false, reason: 'current-official-cloudflare-cost-evidence-required', validation, totalOverageUsd: null });
  const wf = evidence.workflowsPaid;
  const d1 = evidence.d1Paid;
  const workflowRequestsOver = over(usage.workflowRequests, wf.includedRequestsPerMonth);
  const workflowCpuMsOver = over(usage.workflowCpuMs, wf.includedCpuMsPerMonth);
  const workflowStorageOver = over(usage.workflowStorageGbMonth, wf.includedStorageGbMonth);
  const workflowStepsOver = over(usage.workflowSteps, wf.includedStepsPerMonth);
  const d1ReadsOver = over(usage.d1RowsRead, d1.includedRowsReadPerMonth);
  const d1WritesOver = over(usage.d1RowsWritten, d1.includedRowsWrittenPerMonth);
  const d1StorageOver = over(usage.d1StorageGbMonth, d1.includedStorageGbMonth);

  const components = freeze({
    workflowRequestsUsd: workflowRequestsOver / 1_000_000 * n(wf.requestOverageUsdPerMillion),
    workflowCpuUsd: workflowCpuMsOver / 1_000_000 * n(wf.cpuOverageUsdPerMillionMs),
    workflowStorageUsd: workflowStorageOver * n(wf.storageOverageUsdPerGbMonth),
    workflowStepsUsd: workflowStepsOver / 100_000 * n(wf.stepOverageUsdPer100k),
    d1ReadsUsd: d1ReadsOver / 1_000_000 * n(d1.rowsReadOverageUsdPerMillion),
    d1WritesUsd: d1WritesOver / 1_000_000 * n(d1.rowsWrittenOverageUsdPerMillion),
    d1StorageUsd: d1StorageOver * n(d1.storageOverageUsdPerGbMonth)
  });
  const totalOverageUsd = Object.values(components).reduce((sum, value) => sum + value, 0);
  return freeze({
    ok: true,
    schema: RT92_CLOUDFLARE_DURABLE_COST_SCHEMA,
    status: 'design-only-account-level-estimate',
    validation,
    usage: freeze({
      workflowRequests: n(usage.workflowRequests), workflowCpuMs: n(usage.workflowCpuMs), workflowStorageGbMonth: n(usage.workflowStorageGbMonth), workflowSteps: n(usage.workflowSteps),
      d1RowsRead: n(usage.d1RowsRead), d1RowsWritten: n(usage.d1RowsWritten), d1StorageGbMonth: n(usage.d1StorageGbMonth)
    }),
    components,
    totalOverageUsd,
    hostedAiCostUsd: null,
    hostedAiEvidenceRequiredSeparately: true,
    accountWideIncludedAllowancesMatter: true,
    premiumProductActivationAuthorized: false
  });
}

export function estimateRt92WorkflowMarginalRunBeyondIncluded({ steps = 1, cpuMs = 0, persistedStateGbMonth = 0, evidence = {}, nowMs = Date.now() } = {}) {
  const validation = validateRt92CloudflareDurableCostEvidence(evidence, { nowMs });
  if (!validation.ok) return freeze({ ok: false, reason: 'current-official-cloudflare-cost-evidence-required', validation, marginalUsd: null });
  const wf = evidence.workflowsPaid;
  const marginalUsd = (1 / 1_000_000 * n(wf.requestOverageUsdPerMillion))
    + (n(cpuMs) / 1_000_000 * n(wf.cpuOverageUsdPerMillionMs))
    + (n(steps) / 100_000 * n(wf.stepOverageUsdPer100k))
    + (n(persistedStateGbMonth) * n(wf.storageOverageUsdPerGbMonth));
  return freeze({
    ok: true,
    schema: RT92_CLOUDFLARE_DURABLE_COST_SCHEMA,
    marginalUsd,
    assumptions: freeze({ requests: 1, steps: n(steps), cpuMs: n(cpuMs), persistedStateGbMonth: n(persistedStateGbMonth), assumesIncludedAllowancesAlreadyExhausted: true }),
    hostedAiCostUsd: null,
    premiumProductActivationAuthorized: false
  });
}

export function getRt92CloudflareDurableEconomicsTruth() {
  return freeze({
    schema: RT92_CLOUDFLARE_DURABLE_COST_SCHEMA,
    designOnly: true,
    usesDatedExternalEvidence: true,
    pricesAreNotEmbeddedInEngine: true,
    hostedAiExcluded: true,
    accountLevelAllowancesAppliedBeforeOverage: true,
    createsCloudflareResource: false,
    editsWrangler: false,
    createsDodoProduct: false,
    grantsEntitlement: false
  });
}
