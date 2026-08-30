import {
  EON_REWARD_PRIMARY_PROVIDER,
  EON_REWARD_PENDING_STATUSES,
  EON_REWARD_APPROVED_STATUSES,
  EON_REWARD_REVERSED_STATUSES,
  normalizeRewardSurface
} from '../../../config/rt98-reward-center-contract.mjs';

const freeze = (value) => Object.freeze(value);
const encoder = new TextEncoder();
const MYLEAD_DEFAULT_POSTBACK_IP = '159.65.61.13';

function clean(value = '', max = 512) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function bool(value = '') {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function splitCsv(value = '') {
  return [...new Set(String(value || '').split(',').map((entry) => clean(entry, 80)).filter(Boolean))];
}

function safeHttpsUrl(value = '') {
  try {
    const url = new URL(clean(value, 1600));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function timingSafeEqual(left = '', right = '') {
  const a = encoder.encode(String(left || ''));
  const b = encoder.encode(String(right || ''));
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

export function getMyLeadConfig(env = {}) {
  const offerwall = safeHttpsUrl(env.EON_REWARD_MYLEAD_OFFERWALL_URL || '');
  const postbackSecret = String(env.EON_REWARD_MYLEAD_POSTBACK_SECRET || '');
  const configuredIps = splitCsv(env.EON_REWARD_MYLEAD_POSTBACK_ALLOWED_IPS || '');
  const allowedIps = configuredIps.length ? configuredIps : [MYLEAD_DEFAULT_POSTBACK_IP];
  const enabled = bool(env.EON_REWARD_MYLEAD_ENABLED);
  const configured = Boolean(enabled && offerwall && postbackSecret.length >= 24 && allowedIps.length);
  return freeze({
    id: EON_REWARD_PRIMARY_PROVIDER,
    enabled,
    configured,
    offerwallUrl: offerwall?.toString() || '',
    postbackSecret,
    allowedIps: freeze(allowedIps),
    hostedMode: 'new-window',
    rewardAuthority: 'server-postback-only'
  });
}

export function buildMyLeadOfferwallUrl(config, { playerId = '', correlationId = '', surface = 'rewards' } = {}) {
  if (!config?.configured) throw new Error('mylead_not_configured');
  const player = clean(playerId, 160);
  const correlation = clean(correlationId, 160);
  if (!/^[A-Za-z0-9_-]{24,160}$/.test(player)) throw new Error('mylead_player_id_invalid');
  if (!/^[A-Za-z0-9_-]{24,160}$/.test(correlation)) throw new Error('mylead_correlation_invalid');
  const url = safeHttpsUrl(config.offerwallUrl);
  if (!url) throw new Error('mylead_offerwall_url_invalid');
  url.searchParams.set('player_id', player);
  url.searchParams.set('ml_sub1', correlation);
  url.searchParams.set('ml_sub2', normalizeRewardSurface(surface));
  url.searchParams.set('ml_sub3', 'eonapp-rt98');
  return url.toString();
}

export function readProviderRequestIp(request) {
  return clean(request?.headers?.get?.('cf-connecting-ip') || '', 80);
}

export function validateMyLeadPostbackSource(config, request) {
  if (!config?.configured) return freeze({ ok: false, status: 503, error: 'mylead_not_configured' });
  const ip = readProviderRequestIp(request);
  if (!ip || !config.allowedIps.includes(ip)) return freeze({ ok: false, status: 403, error: 'mylead_postback_source_not_allowlisted' });
  return freeze({ ok: true, ip });
}

export function validateMyLeadPostbackSecret(config, supplied = '') {
  if (!config?.configured || !timingSafeEqual(config.postbackSecret, supplied)) return freeze({ ok: false, status: 403, error: 'mylead_postback_secret_invalid' });
  return freeze({ ok: true });
}

function normalizedStatus(value = '') {
  return clean(value, 40).toLowerCase().replace(/_/g, '-');
}

export function classifyMyLeadStatus(value = '') {
  const status = normalizedStatus(value);
  if (EON_REWARD_PENDING_STATUSES.includes(status)) return freeze({ ok: true, providerStatus: status, state: 'pending' });
  if (EON_REWARD_APPROVED_STATUSES.includes(status)) return freeze({ ok: true, providerStatus: status, state: 'confirmed' });
  if (EON_REWARD_REVERSED_STATUSES.includes(status)) return freeze({ ok: true, providerStatus: status, state: 'reversed' });
  return freeze({ ok: false, status: 400, error: 'mylead_postback_status_invalid' });
}

export function parseMyLeadPostback(request) {
  let url;
  try { url = new URL(request.url); } catch { return freeze({ ok: false, status: 400, error: 'mylead_postback_url_invalid' }); }
  const provider = clean(url.searchParams.get('provider') || 'mylead', 40).toLowerCase();
  if (provider !== 'mylead') return freeze({ ok: false, status: 400, error: 'reward_provider_not_supported' });
  const transactionId = clean(url.searchParams.get('transaction_id'), 160);
  const playerId = clean(url.searchParams.get('player_id'), 160);
  const correlationId = clean(url.searchParams.get('ml_sub1'), 160);
  const surface = normalizeRewardSurface(url.searchParams.get('ml_sub2'));
  const secret = String(url.searchParams.get('secret') || '');
  const classified = classifyMyLeadStatus(url.searchParams.get('status'));
  if (!classified.ok) return classified;
  if (!transactionId || !/^[A-Za-z0-9._:-]{1,160}$/.test(transactionId)) return freeze({ ok: false, status: 400, error: 'mylead_transaction_id_invalid' });
  if (!/^[A-Za-z0-9_-]{24,160}$/.test(playerId)) return freeze({ ok: false, status: 400, error: 'mylead_player_id_invalid' });
  if (!/^[A-Za-z0-9_-]{24,160}$/.test(correlationId)) return freeze({ ok: false, status: 400, error: 'mylead_correlation_invalid' });

  const virtualRaw = clean(url.searchParams.get('virtual_amount'), 48);
  let virtualAmount = null;
  if (virtualRaw !== '') {
    const number = Number(virtualRaw);
    if (!Number.isSafeInteger(number) || number <= 0 || number > 100000) return freeze({ ok: false, status: 400, error: 'mylead_virtual_amount_invalid' });
    virtualAmount = number;
  }
  if (classified.state === 'confirmed' && virtualAmount === null) return freeze({ ok: false, status: 400, error: 'mylead_virtual_amount_required_for_approved_credit' });
  const payoutDecimal = clean(url.searchParams.get('payout_decimal'), 48);
  return freeze({
    ok: true,
    provider,
    transactionId,
    playerId,
    correlationId,
    surface,
    secret,
    providerStatus: classified.providerStatus,
    state: classified.state,
    virtualAmount,
    payoutDecimal
  });
}

export function publicMyLeadConfig(env = {}) {
  const config = getMyLeadConfig(env);
  return freeze({
    id: 'mylead',
    label: 'MyLead Sponsored Missions',
    available: config.configured,
    hostedMode: config.hostedMode,
    rewardAuthority: config.rewardAuthority,
    completionTruth: 'EONKEYS are credited only after a trusted MyLead server postback. Closing or returning from the OfferWall never credits a reward.'
  });
}

export default freeze({
  getMyLeadConfig,
  buildMyLeadOfferwallUrl,
  validateMyLeadPostbackSource,
  validateMyLeadPostbackSecret,
  classifyMyLeadStatus,
  parseMyLeadPostback,
  publicMyLeadConfig
});
