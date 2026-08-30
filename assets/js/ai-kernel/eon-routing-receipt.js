/** W315 — safe routing receipt and runtime disclosure. */

export const EON_ROUTING_RECEIPT_SCHEMA = 'eonapp.routing-receipt.v1';


function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.getRandomValues) throw new Error('Web Crypto is unavailable in this browser.');
  return api;
}

function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable in this browser.');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function cleanIso(value = '', fallback = Date.now()) {
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function receiptId({ cryptoApi = null } = {}) {
  const bytes = cryptoFor(cryptoApi).getRandomValues(new Uint8Array(18));
  return `eonroute_${toBase64Url(bytes)}`;
}

export function createEonRoutingReceipt({ taskId, resolution, now = Date.now(), cryptoApi = null } = {}) {
  const route = resolution?.route;
  if (resolution?.ok !== true || !route || !/^eontask_[a-z0-9_-]{12,120}$/i.test(String(taskId || ''))) throw new Error('A successful local route resolution is required for a routing receipt.');
  const privacy = route.privacyRoute === 'device-local' ? 'This run stays on this device.' : 'This run sends data directly to the provider you selected; EONAPP does not relay it.';
  return Object.freeze({
    schema: EON_ROUTING_RECEIPT_SCHEMA,
    version: 1,
    receiptId: receiptId({ cryptoApi }),
    taskId: String(taskId),
    providerId: String(route.providerId),
    modelId: String(route.modelId),
    adapterId: String(route.adapterId),
    adapterVersion: String(route.adapterVersion),
    profile: String(route.profile),
    privacyRoute: String(route.privacyRoute),
    policyMode: String(resolution.policy?.mode || 'exact-pin'),
    fallback: 'none',
    providerChangeDisclosed: resolution.providerChangeDisclosed === true,
    dataDestination: privacy,
    rawPromptStored: false,
    providerKeyStored: false,
    createdAt: cleanIso('', now),
    networkRequestCreated: false
  });
}

export function getEonRoutingReceiptTruth() {
  return Object.freeze({
    schema: EON_ROUTING_RECEIPT_SCHEMA,
    providerAndModelVisible: true,
    dataDestinationVisible: true,
    fallbackVisible: true,
    rawPromptStored: false,
    providerKeyStored: false,
    directNetwork: false,
    cityPayloadAllowed: false
  });
}
