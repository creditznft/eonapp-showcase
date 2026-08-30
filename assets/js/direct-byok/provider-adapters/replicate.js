/** W626C/W626D — Replicate predictions adapter for the owner companion. */
import { assertDirectProviderApiEndpoint, assertDirectProviderMediaEndpoint } from '../direct-job-contract.js';
import { getDirectProvider } from '../provider-registry.js';

const policy = getDirectProvider('replicate');
const freeze = Object.freeze;
const enc = encodeURIComponent;

function headers(credential) {
  if (!credential) throw new Error('Replicate credential unavailable in secure companion storage');
  return freeze({ Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' });
}
function checkApi(url) {
  const verdict = assertDirectProviderApiEndpoint(url, policy);
  if (!verdict.ok) throw new Error(`Replicate API endpoint rejected: ${verdict.reason}`);
  return url;
}
function checkMedia(url) {
  const verdict = assertDirectProviderMediaEndpoint(url, policy);
  if (!verdict.ok) throw new Error(`Replicate media endpoint rejected: ${verdict.reason}`);
  return url;
}
function modelParts(remoteId = '') {
  const parts = String(remoteId).split('/').filter(Boolean);
  if (parts.length !== 2 || parts.some((part) => !/^[a-z0-9][a-z0-9._-]{1,80}$/i.test(part))) throw new Error('Replicate reviewed model slug invalid');
  return parts;
}

export function buildReplicateCapabilityRequest(model, credential) {
  const [owner, name] = modelParts(model.remoteId);
  return freeze({ method: 'GET', url: checkApi(`https://api.replicate.com/v1/models/${enc(owner)}/${enc(name)}`), headers: headers(credential), redirect: 'manual' });
}
export function buildReplicateSubmitRequest(job, model, credential) {
  const [owner, name] = modelParts(model.remoteId);
  const requestHeaders = {
    ...headers(credential),
    // A browser/Companion crash must not leave an approved paid prediction
    // running forever. Replicate documents Cancel-After as a provider-side
    // deadline; two hours is deliberately generous for reviewed media jobs.
    'Cancel-After': '2h'
  };
  return freeze({ method: 'POST', url: checkApi(`https://api.replicate.com/v1/models/${enc(owner)}/${enc(name)}/predictions`), headers: freeze(requestHeaders), body: JSON.stringify({ input: job.input }), redirect: 'manual' });
}
export function buildReplicateStatusRequest(job, model, credential, predictionId, getUrl = '') {
  const url = checkApi(getUrl || `https://api.replicate.com/v1/predictions/${enc(predictionId)}`);
  return freeze({ method: 'GET', url, headers: headers(credential), redirect: 'manual' });
}
export function buildReplicateCancelRequest(job, model, credential, predictionId, cancelUrl = '') {
  const url = checkApi(cancelUrl || `https://api.replicate.com/v1/predictions/${enc(predictionId)}/cancel`);
  return freeze({ method: 'POST', url, headers: headers(credential), redirect: 'manual' });
}

export function parseReplicatePrediction(payload = {}) {
  const predictionId = String(payload.id || '').trim();
  const status = String(payload.status || '').toLowerCase();
  if (!predictionId) throw new Error('Replicate prediction id missing');
  if (payload.urls?.get) checkApi(payload.urls.get);
  if (payload.urls?.cancel) checkApi(payload.urls.cancel);
  const mapped = status === 'starting' ? 'queued' : status === 'processing' ? 'running' : status === 'succeeded' ? 'completed' : status === 'canceled' ? 'cancelled' : status === 'failed' ? 'failed' : 'running';
  return freeze({ requestId: predictionId, state: mapped, progress: mapped === 'completed' ? 100 : null, authoritativeProgress: mapped === 'completed', getUrl: payload.urls?.get || '', cancelUrl: payload.urls?.cancel || '', error: mapped === 'failed' ? String(payload.error || 'provider-failure') : '' });
}

function outputUrls(output) {
  if (typeof output === 'string') return [output];
  if (Array.isArray(output)) return output.flatMap(outputUrls);
  if (output && typeof output === 'object') return Object.values(output).flatMap(outputUrls);
  return [];
}
export function parseReplicateResult(payload = {}, mediaKind = 'image') {
  const urls = outputUrls(payload.output).filter((value) => /^https:\/\//.test(value));
  const outputs = urls.map((url) => {
    checkMedia(url);
    return freeze({ url, contentType: mediaKind === 'image' ? 'image/*' : 'video/*' });
  });
  if (!outputs.length) throw new Error('Replicate result did not contain an allowlisted media output');
  return freeze({ outputs: freeze(outputs), providerMetadata: freeze({ metricsAvailable: Boolean(payload.metrics), moderationFlagAvailable: false }) });
}

export function getReplicateAdapterTruth() {
  return freeze({ providerId: 'replicate', capabilityDiscovery: true, submit: true, status: true, cancel: true, result: true, redirectsAutomatic: false, automaticPaidRetry: false, providerSideCancelAfter: '2h', mediaCdnReceivesCredential: true, mediaCdnCredentialScope: 'reviewed-replicate.delivery-only-for-raw-http-output', credentialOwner: 'creator-companion-secure-store', realEndToEndProof: false });
}
