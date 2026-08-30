/**
 * DATED EVIDENCE SNAPSHOT — re-verify before commercial activation.
 * Official Cloudflare docs observed 2026-08-17:
 * - https://developers.cloudflare.com/workflows/reference/pricing/
 * - https://developers.cloudflare.com/d1/platform/pricing/
 *
 * This is evidence, not a permanent price constant. Generic economics must
 * fail closed once this evidence is stale.
 */
export const RT92_CLOUDFLARE_DURABLE_COST_EVIDENCE_2026_08_17 = Object.freeze({
  evidenceId: 'cloudflare:workflows-d1:workers-paid:2026-08-17',
  observedAtMs: Date.UTC(2026, 7, 17, 4, 45, 0),
  sourceHost: 'developers.cloudflare.com',
  workflowBillingEffectiveFrom: '2026-08-10',
  workflowsPaid: Object.freeze({
    includedRequestsPerMonth: 10_000_000,
    requestOverageUsdPerMillion: 0.30,
    includedCpuMsPerMonth: 30_000_000,
    cpuOverageUsdPerMillionMs: 0.02,
    includedStorageGbMonth: 1,
    storageOverageUsdPerGbMonth: 0.20,
    includedStepsPerMonth: 500_000,
    stepOverageUsdPer100k: 0.80
  }),
  d1Paid: Object.freeze({
    includedRowsReadPerMonth: 25_000_000_000,
    rowsReadOverageUsdPerMillion: 0.001,
    includedRowsWrittenPerMonth: 50_000_000,
    rowsWrittenOverageUsdPerMillion: 1.00,
    includedStorageGbMonth: 5,
    storageOverageUsdPerGbMonth: 0.75
  })
});
