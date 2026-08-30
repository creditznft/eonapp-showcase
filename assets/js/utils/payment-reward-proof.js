export const EON_PAYMENT_REWARD_PROOF_SCHEMA = 'eonapp.session8.payment-reward-server-truth.v1';

const PAYMENT_STATUSES = new Set(['finished', 'confirmed', 'sending']);
const REWARD_OK_VALUES = new Set(['yes', 'valued', 'paid', 'true', '1']);

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char] || char));
}

function normalize(value = '') {
  return String(value || '').trim().toLowerCase();
}

function getParam(names = []) {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const value = params.get(name);
      if (value) return value;
    }
  } catch {}
  return '';
}

function safeProofId(value = '') {
  return String(value || '').trim().replace(/[^a-zA-Z0-9:_@.-]/g, '').slice(0, 180);
}

export function buildPaymentRewardProofState(input = {}) {
  const adStatus = input.adStatus || null;
  const paymentStatus = input.paymentStatus || null;
  const telegramSession = input.telegramSession || null;
  const adFound = Boolean(adStatus?.found);
  const adVerified = Boolean(adStatus?.entitlement || adStatus?.accountRewardVerified || adStatus?.verified || Number(adStatus?.monetizedCredits || 0) > 0);
  const lastRewardValue = normalize(adStatus?.lastEvent?.reward_event_type || adStatus?.reward_event_type || '');
  const valuedPostback = adVerified || REWARD_OK_VALUES.has(lastRewardValue);
  const paymentFound = Boolean(paymentStatus?.found);
  const providerPaymentStatus = normalize(paymentStatus?.payment_status || paymentStatus?.status || '');
  const paymentFinished = Boolean(paymentStatus?.verified && PAYMENT_STATUSES.has(providerPaymentStatus) && paymentStatus?.entitlement);
  const paymentCreditApplied = Boolean(paymentStatus?.credit_applied || paymentFinished);
  const sessionVerified = Boolean(telegramSession?.ok || telegramSession?.verified);
  const channelMember = Boolean(telegramSession?.channel?.isMember || telegramSession?.channelMember);
  const blockers = [];
  if (input.expectTelegram && !sessionVerified) blockers.push('Telegram session not server-verified yet.');
  if (input.expectTelegram && sessionVerified && !channelMember) blockers.push('Channel membership must pass before reward actions.');
  if (input.expectReward && !valuedPostback) blockers.push('Account-wide reward waits for provider postback status.');
  if (input.expectPayment && !paymentCreditApplied) blockers.push('Paid access waits for finished processor status or verified chain receipt.');
  return Object.freeze({
    schema: EON_PAYMENT_REWARD_PROOF_SCHEMA,
    ok: blockers.length === 0,
    adFound,
    adVerified,
    valuedPostback,
    paymentFound,
    paymentFinished,
    paymentCreditApplied,
    sessionVerified,
    channelMember,
    storagePolicy: 'server-truth-status-only-no-secret-or-raw-identity-display',
    privacy: {
      rawIpStored: false,
      countryStored: false,
      userAgentStored: false,
      telegramIdDisplayed: false,
      secretDisplayed: false,
      providerTokenDisplayed: false
    },
    blockers,
    adStatus,
    paymentStatus,
    telegramSession
  });
}

function renderRows(state) {
  const rows = [
    ['Telegram session', state.sessionVerified ? 'complete' : 'waiting', state.channelMember ? 'Mini App + channel verified' : 'Needs Telegram session and channel membership'],
    ['Reward postback', state.valuedPostback ? 'complete' : 'waiting', state.valuedPostback ? 'Provider valued postback accepted' : 'No account credit until provider status confirms value'],
    ['Payment status', state.paymentCreditApplied ? 'complete' : 'waiting', state.paymentCreditApplied ? 'Paid entitlement credited' : 'Paid access requires finished payment proof'],
    ['Privacy mode', 'complete', 'No raw IP, country, user-agent, Telegram ID, secrets, or provider tokens are displayed here']
  ];
  return rows.map(([label, status, detail]) => `<li class="is-${esc(status)}"><strong>${esc(label)}</strong><span>${esc(detail)}</span></li>`).join('');
}

export function renderPaymentRewardProofPanel(target, input = {}) {
  const root = typeof target === 'string' ? document.querySelector(target) : target;
  const state = buildPaymentRewardProofState(input);
  if (!root) return state;
  root.classList.add('eon-server-truth-proof');
  root.setAttribute('data-session8-payment-reward-proof', 'true');
  root.setAttribute('data-proof-schema', state.schema);
  root.innerHTML = `
    <div class="eon-server-truth-head">
      <span>Server-truth status</span>
      <h2>${esc(input.title || 'Rewards and payments unlock only after verified status')}</h2>
      <p>${esc(input.description || 'Local UI can show pending access, but account-wide rewards and paid plans require Cloudflare status checks and provider receipts.')}</p>
    </div>
    <ol class="eon-server-truth-rows">${renderRows(state)}</ol>
    <p class="eon-server-truth-note">${state.ok ? 'All requested server-truth checks are satisfied for this context.' : esc(state.blockers.join(' '))}</p>`;
  return state;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  return { httpOk: response.ok, ...body };
}

export async function hydratePaymentRewardProof(target, options = {}) {
  const ymid = safeProofId(options.ymid || getParam(['ymid', 'event_id', 'eventId']));
  const paymentId = safeProofId(options.paymentId || getParam(['payment_id', 'paymentId']));
  const orderId = safeProofId(options.orderId || getParam(['order_id', 'orderId']));
  const recurringPaymentId = safeProofId(options.recurringPaymentId || getParam(['recurring_payment_id', 'subscription_id', 'subscriptionId']));
  const initial = renderPaymentRewardProofPanel(target, options);
  const next = { ...options };
  try {
    if (ymid) next.adStatus = await fetchJson(`/api/ad-rewards/status?ymid=${encodeURIComponent(ymid)}`);
  } catch (error) {
    next.adStatus = { ok: false, found: false, error: String(error?.message || error || 'reward_status_unavailable') };
  }
  try {
    const params = new URLSearchParams();
    if (paymentId) params.set('payment_id', paymentId);
    if (orderId) params.set('order_id', orderId);
    if (recurringPaymentId) params.set('recurring_payment_id', recurringPaymentId);
    if (params.toString()) next.paymentStatus = await fetchJson(`/api/nowpayments/status?${params}`);
  } catch (error) {
    next.paymentStatus = { found: false, error: String(error?.message || error || 'payment_status_unavailable') };
  }
  const finalState = renderPaymentRewardProofPanel(target, next);
  window.EONPaymentRewardProof = Object.freeze({ getState: () => finalState, getInitialState: () => initial, schema: EON_PAYMENT_REWARD_PROOF_SCHEMA });
  return finalState;
}

export default { EON_PAYMENT_REWARD_PROOF_SCHEMA, buildPaymentRewardProofState, renderPaymentRewardProofPanel, hydratePaymentRewardProof };
