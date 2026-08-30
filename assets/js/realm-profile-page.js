import { readIncomingRealmShare } from './utils/realm-share-runtime.js';
import { normalizeRealmHandle } from './utils/signed-share-link.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function textNode(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
  return node;
}

function getRequestedHandle() {
  try { return normalizeRealmHandle(new URL(window.location.href).searchParams.get('user') || ''); }
  catch { return ''; }
}

function shortened(value = '', head = 12, tail = 8) {
  const text = String(value || '');
  if (text.length <= head + tail + 1) return text;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

function renderMissing(handle = '') {
  textNode('realm-profile-title', 'Open a signed Realm link');
  textNode('realm-profile-copy', handle
    ? `The path /u/${handle} does not carry a Realm record by itself. Open the full eon3 link you received so this browser can verify its portable public identity locally.`
    : 'This page needs a complete signed eon3 Realm link. The public Realm identity is carried by the link, not looked up from Cloudflare.');
  textNode('realm-profile-notice', 'No Cloudflare D1, KV, Worker resolver, click record, referral reward, sale, or payment is used to open a signed Realm link.');
}

function renderRealm(record) {
  const realm = record.realm;
  textNode('realm-profile-title', realm.displayName || realm.handle);
  textNode('realm-profile-copy', 'This portable Realm identity was verified locally from a self-contained signed eon3 link. It can be opened without a Cloudflare short-link database or Realm lookup.');
  const identity = document.getElementById('realm-profile-identity');
  if (identity) {
    identity.hidden = false;
    identity.innerHTML = `
      <div><strong>@${escapeHtml(realm.handle)}</strong><span>Verified portable Realm profile · ${escapeHtml(realm.theme || 'dark-purple')} theme</span></div>
      <div class="sig">${escapeHtml(shortened(realm.id, 18, 10))}<br>share ${escapeHtml(shortened(record.shareId, 12, 8))}</div>`;
  }
  const facts = document.getElementById('realm-profile-facts');
  if (facts) {
    facts.hidden = false;
    facts.innerHTML = `
      <article><b>Link contract</b><span>eon3 · self-contained signed</span></article>
      <article><b>Resolver</b><span>None required</span></article>
      <article><b>Commercial state</b><span>No reward, sale, payout, or revenue share active</span></article>`;
  }
  textNode('realm-profile-notice', 'This public link verifies identity only. It does not provide access to private Realm data, payment instructions, a market listing, a reward, or a referral payout.');
  const city = document.getElementById('realm-profile-city');
  if (city) city.href = '/eoncity';
}

function boot() {
  const handle = getRequestedHandle();
  const record = readIncomingRealmShare(handle);
  if (!record) return renderMissing(handle);
  renderRealm(record);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
