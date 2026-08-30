/**
 * W314 — deterministic adapter-contract lab.
 *
 * The lab does not know how to call a provider. A test adapter is injected by
 * the caller after a person chose a provider check. A provider stays
 * unsupported until stream, error and structured-result fixtures pass.
 */

export const EON_ADAPTER_CONTRACT_LAB_SCHEMA = 'eonapp.adapter-contract-lab.v1';

function cleanResult(value = {}) {
  const result = value && typeof value === 'object' ? value : {};
  const streamEvents = Array.isArray(result.streamEvents) ? result.streamEvents : [];
  const structured = result.structured && typeof result.structured === 'object' ? result.structured : null;
  const error = result.error && typeof result.error === 'object' ? result.error : null;
  return Object.freeze({
    streamEvents: Object.freeze(streamEvents.map((event) => String(event || '').slice(0, 80)).filter(Boolean).slice(0, 16)),
    structured,
    error: error ? Object.freeze({ code: String(error.code || '').slice(0, 64), retryable: error.retryable === true }) : null,
    providerPayloadStored: false
  });
}

export async function runAdapterContractLab(adapter, { userInitiated = false } = {}) {
  if (userInitiated !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required', supported: false, networkRequestCreated: false });
  if (!adapter || typeof adapter.runContractFixture !== 'function') return Object.freeze({ ok: false, reason: 'adapter-fixture-is-required', supported: false, networkRequestCreated: false });
  let result;
  try { result = cleanResult(await adapter.runContractFixture({ purpose: 'non-production-contract-check', userInitiated: true })); }
  catch { return Object.freeze({ ok: false, reason: 'adapter-fixture-threw', supported: false, networkRequestCreated: false }); }
  const streamPass = result.streamEvents.includes('start') && result.streamEvents.includes('delta') && result.streamEvents.includes('complete');
  const structuredPass = Boolean(result.structured && typeof result.structured.schema === 'string' && result.structured.valid === true);
  const errorPass = Boolean(result.error && /^[a-z0-9_-]{2,64}$/i.test(result.error.code) && typeof result.error.retryable === 'boolean');
  return Object.freeze({
    schema: EON_ADAPTER_CONTRACT_LAB_SCHEMA,
    ok: streamPass && structuredPass && errorPass,
    supported: streamPass && structuredPass && errorPass,
    reason: streamPass && structuredPass && errorPass ? null : 'adapter-contract-incomplete',
    streamPass,
    structuredPass,
    errorPass,
    result,
    networkRequestCreated: false,
    providerPayloadStored: false
  });
}

export function getAdapterContractLabTruth() {
  return Object.freeze({
    schema: EON_ADAPTER_CONTRACT_LAB_SCHEMA,
    userActionRequired: true,
    adapterCannotBeSupportedWithoutTests: true,
    directNetwork: false,
    providerPayloadStored: false,
    hiddenProbe: false
  });
}
