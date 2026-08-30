/**
 * W232 — My Realm return loop and private landmark editor.
 *
 * The Realm is a local City district and portable identity in this phase. No
 * public manifest, user store, payment path, commercial attribution, or payout
 * is created here.
 */
import { createRealmShareLink } from './utils/realm-share-runtime.js';
import { renderQrCanvas } from './utils/qr-code.js';
import { appendOperatorActivity } from './operator/operator-activity.js';
import { readPrivateMarketDrop } from './market/market-private-drop.js';
import { buildPublicRealmManifestProposal, getPublicRealmPublicationStatus } from './realm/public-realm-manifest.js';
import { getEonRealmRelicPublicSummary } from './realm-relic/eon-realm-relic-boundary.js';
import {
  EON_REALM_RELIC_PASSPORT_EVENTS,
  awardLocalRealmShareRelic,
  clearLocalRealmShareRelics,
  listLocalRealmShareRelics
} from './realm-relic/eon-realm-relic-passport.js';
import {
  MY_REALM_ENTRY_DISTRICTS,
  MY_REALM_LANDMARKS,
  MY_REALM_LAYOUTS,
  MY_REALM_SHORTCUTS,
  MY_REALM_THEMES,
  buildMyRealmCard,
  ensureMyRealmState,
  getMyRealmPublicIdentity,
  getMyRealmReturnSummary,
  reviewRealmPublicMetadata,
  updateMyRealmShowcase,
  updateMyRealmState
} from './realm/realm-state.js';
import { bindCityModeLinkTracking, enterCityMode } from './contracts/city/city-mode-transition.js';
import { recordEonCoreOutcome } from './contracts/outcomes/eon-core-outcome-authority.js';
import {
  REALM_ATMOSPHERES,
  REALM_COMPANION_SHELLS,
  REALM_PROJECT_DISPLAYS,
  createEncryptedRealmVisualBackup,
  readRealmVisualProfile,
  restoreEncryptedRealmVisualBackup,
  saveRealmVisualProfile
} from './realm/eon-realm-visual-profile.js';

const byId = (id) => document.getElementById(id);
const THEME_LABELS = Object.freeze(Object.fromEntries(MY_REALM_THEMES.map((theme) => [theme.id, theme.label])));
const LAYOUT_LABELS = Object.freeze(Object.fromEntries(MY_REALM_LAYOUTS.map((layout) => [layout.id, layout.label])));
const SHORTCUT_LABELS = Object.freeze(Object.fromEntries(MY_REALM_SHORTCUTS.map((entry) => [entry.id, entry.label])));
const COMPANION_LABELS = Object.freeze(Object.fromEntries(REALM_COMPANION_SHELLS.map((entry) => [entry.id, entry.label])));
const ATMOSPHERE_LABELS = Object.freeze(Object.fromEntries(REALM_ATMOSPHERES.map((entry) => [entry.id, entry.label])));
const PROJECT_DISPLAY_LABELS = Object.freeze(Object.fromEntries(REALM_PROJECT_DISPLAYS.map((entry) => [entry.id, entry.label])));
const REALM_RELIC_SUMMARY = getEonRealmRelicPublicSummary();
const DISTRICT_LABELS = Object.freeze({
  realm: 'My Realm Studio',
  command: 'Command Centre',
  workspace: 'AI Cockpit',
  market: 'Market Gallery',
  library: 'Library Archive',
  trade: 'Research Lab',
  vault: 'Vault Safehouse'
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function cleanText(value, max = 48) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output;
}

function setStatus(message, tone = 'info') {
  const node = byId('realm-studio-status');
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
}

function formatLocalReturnTime(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'No City return recorded yet';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
  } catch {
    return 'Returned locally';
  }
}

function paintReturnLoop(realm) {
  const node = byId('realm-studio-return-summary');
  if (!node) return;
  const summary = getMyRealmReturnSummary(realm);
  node.innerHTML = `<strong>${escapeHtml(summary.label)}</strong><span>${escapeHtml(summary.returnCount === 1 ? '1 private City return' : `${summary.returnCount} private City returns`)}</span><small>${escapeHtml(formatLocalReturnTime(summary.lastReturnedAt))} · local only · no verified visitor count, referral conversion, financial reward, or server event</small>`;
}

function realmForShare(realm) {
  return {
    publicRealmId: realm.id,
    username: realm.handle,
    displayName: realm.label,
    theme: realm.theme
  };
}

function privateMarketItems() {
  return Array.isArray(readPrivateMarketDrop()?.items) ? readPrivateMarketDrop().items : [];
}

function selectedShowcaseRefs() {
  return [...document.querySelectorAll('[data-realm-showcase-ref]:checked')].map((input) => String(input.value || ''));
}

function paintRelicPassport() {
  const host = byId('realm-studio-relic-passport');
  const count = byId('realm-studio-relic-count');
  if (!host) return;
  const relics = listLocalRealmShareRelics();
  if (count) count.textContent = `${relics.length} local Relic${relics.length === 1 ? '' : 's'}`;
  if (!relics.length) {
    host.innerHTML = '<p class="realm-studio-empty">No Share Relics are saved on this device yet. Use System share for a Signal Relic, or open a verified Realm link to receive a Welcome Relic. These are free local cosmetics, not money, premium access, referrals, NFTs, or proof that someone joined.</p>';
    return;
  }
  host.innerHTML = `<div class="realm-studio-relic-grid">${relics.slice().reverse().map((relic) => `<article class="realm-studio-relic-card"><span class="realm-studio-relic-symbol" aria-hidden="true">${relic.visualClass === 'welcome' ? '✦' : '◈'}</span><div><strong>${escapeHtml(relic.label)}</strong><small>${escapeHtml(relic.realm.label)} · ${escapeHtml(relic.triggerLabel)}</small><p>${escapeHtml(relic.verificationLabel)}</p></div></article>`).join('')}</div>`;
}

function readVisualProfile(realm) {
  return readRealmVisualProfile({ realmId: realm?.id || '' }).profile;
}

function readVisualForm() {
  return {
    companion: String(byId('realm-studio-visual-companion')?.value || 'eonbot-orbit'),
    atmosphere: String(byId('realm-studio-visual-atmosphere')?.value || 'clear-night'),
    projectDisplay: String(byId('realm-studio-visual-display')?.value || 'command')
  };
}

function applyVisualPreview(profile) {
  const preview = byId('realm-studio-preview');
  if (!preview || !profile) return;
  preview.dataset.realmCompanion = profile.companion;
  preview.dataset.realmAtmosphere = profile.atmosphere;
  preview.dataset.realmProjectDisplay = profile.projectDisplay;
}

function paintVisualProfile(realm) {
  const profile = readVisualProfile(realm);
  const companion = byId('realm-studio-visual-companion');
  const atmosphere = byId('realm-studio-visual-atmosphere');
  const display = byId('realm-studio-visual-display');
  const status = byId('realm-studio-visual-status');
  if (companion) companion.value = profile.companion;
  if (atmosphere) atmosphere.value = profile.atmosphere;
  if (display) display.value = profile.projectDisplay;
  applyVisualPreview(profile);
  if (status) status.textContent = `${COMPANION_LABELS[profile.companion] || 'Companion'} · ${ATMOSPHERE_LABELS[profile.atmosphere] || 'Atmosphere'} · ${PROJECT_DISPLAY_LABELS[profile.projectDisplay] || 'Display'} · local only.`;
  return profile;
}

function saveVisualProfileFromForm({ announce = true } = {}) {
  if (!currentRealm?.id) throw new Error('Save a local Realm before choosing a visual profile.');
  const input = readVisualForm();
  const result = saveRealmVisualProfile({
    realmId: currentRealm.id,
    theme: currentRealm.theme,
    landmark: currentRealm.landmark,
    companion: input.companion,
    atmosphere: input.atmosphere,
    projectDisplay: input.projectDisplay
  }, { realmId: currentRealm.id });
  if (!result.ok) throw new Error('The local visual profile could not be saved in this browser.');
  applyVisualPreview(result.profile);
  paintVisualProfile(currentRealm);
  if (announce) {
    appendOperatorActivity({ source: 'realm', status: 'complete', title: 'My Realm visual profile saved locally', detail: 'A companion shell, atmosphere and display preference were saved only on this device. No public Realm, cloud sync, marketplace, payment, or data backup was created.', route: '/realm-studio' });
    setStatus('Realm visual profile saved locally. Export an encrypted visual-only backup for work you do not want to lose.', 'success');
  }
  return result.profile;
}

function downloadRealmVisualBackup(backup) {
  const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eon-realm-visual-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function exportVisualBackup() {
  const profile = saveVisualProfileFromForm({ announce: false });
  const passphrase = window.prompt('Create a passphrase for this encrypted visual-only backup. EONAPP does not store it. Use at least 12 characters.');
  if (passphrase === null || !String(passphrase)) {
    setStatus('Encrypted visual backup was not created. The passphrase is never stored by EONAPP.');
    return;
  }
  const backup = await createEncryptedRealmVisualBackup(profile, passphrase);
  downloadRealmVisualBackup(backup);
  appendOperatorActivity({ source: 'realm', status: 'complete', title: 'Encrypted Realm visual backup exported', detail: 'The user downloaded a passphrase-protected visual-only Realm backup. Nothing was uploaded and no passphrase was stored.', route: '/realm-studio' });
  setStatus('Encrypted visual-only backup downloaded. Keep the file and passphrase yourself; Google Login does not back this up.', 'success');
}

async function importVisualBackup(file) {
  if (!file) return;
  if (Number(file.size || 0) > 128000) throw new Error('Choose a small Realm visual backup file.');
  const source = JSON.parse(await file.text());
  const passphrase = window.prompt('Enter the passphrase for this encrypted Realm visual backup. EONAPP does not know or store it.');
  if (passphrase === null || !String(passphrase)) {
    setStatus('Realm visual backup import was cancelled.');
    return;
  }
  const restored = await restoreEncryptedRealmVisualBackup(source, passphrase);
  if (!currentRealm?.id || restored.profile.realmId !== currentRealm.id) throw new Error('This visual backup belongs to a different local Realm identity. It was not applied.');
  const saved = saveRealmVisualProfile(restored.profile, { realmId: currentRealm.id });
  if (!saved.ok) throw new Error('The restored visual profile could not be saved in this browser.');
  paintVisualProfile(currentRealm);
  setStatus('Encrypted visual profile restored locally. No cloud copy, public listing, or account data was changed.', 'success');
}

function selectedRealmShortcuts() {
  return [...document.querySelectorAll('[data-realm-shortcut]:checked')].map((input) => String(input.value || '')).slice(0, 4);
}

function readFeaturedItem() {
  const type = String(byId('realm-studio-featured-type')?.value || '');
  const title = cleanText(byId('realm-studio-featured-title')?.value, 80);
  const id = cleanText(byId('realm-studio-featured-id')?.value, 96);
  return type && title && id ? { type, title, id } : null;
}

function paintRealmCard(realm) {
  const host = byId('realm-share-card');
  if (!host) return;
  const card = buildMyRealmCard(realm);
  const shortcuts = card.shortcuts.map((entry) => `<span>${escapeHtml(entry.label)}</span>`).join('');
  host.innerHTML = `<p class="realm-studio-kicker">Read-only Realm Card</p><h3>${escapeHtml(card.label || 'Review needed')}</h3><p>${escapeHtml(card.layout.label)} · ${escapeHtml(card.theme)}</p><div class="realm-share-card-shortcuts">${shortcuts}</div>${card.featuredItem ? `<p><strong>Featured:</strong> ${escapeHtml(card.featuredItem.title)}</p>` : '<p>No featured item selected.</p>'}<small>${escapeHtml(card.note)}</small>`;
  host.dataset.realmCardReady = card.safeToShare ? 'true' : 'false';
}

function paintPreview(realm) {
  const preview = byId('realm-studio-preview');
  const id = byId('realm-studio-id');
  const cityStatus = byId('realm-studio-city-status');
  const showcase = privateMarketItems().filter((item) => realm.showcaseRefs.includes(item.id));
  const visual = readVisualProfile(realm);
  if (preview) {
    preview.innerHTML = `<p class="realm-studio-kicker">${escapeHtml(THEME_LABELS[realm.theme] || 'Realm')}</p>
      <h3>${escapeHtml(realm.label)}</h3>
      <p>@${escapeHtml(realm.handle)} · local City district</p>
      <p class="realm-studio-preview-note">Layout: ${escapeHtml(LAYOUT_LABELS[realm.layout] || 'Command Loft')} · Arrival: ${escapeHtml(DISTRICT_LABELS[realm.entryDistrict] || 'My Realm Studio')} · ${realm.shortcuts.length} pinned shortcut${realm.shortcuts.length === 1 ? '' : 's'} · ${showcase.length} private Relic reference${showcase.length === 1 ? '' : 's'}</p>
      <p class="realm-studio-visual-note">${escapeHtml(COMPANION_LABELS[visual.companion] || 'Companion')} · ${escapeHtml(ATMOSPHERE_LABELS[visual.atmosphere] || 'Atmosphere')} · ${escapeHtml(PROJECT_DISPLAY_LABELS[visual.projectDisplay] || 'Display')} · local presentation only</p>
      <code>${escapeHtml(realm.id)}</code>`;
    applyVisualPreview(visual);
  }
  if (id) id.textContent = realm.id;
  if (cityStatus) cityStatus.textContent = `Linked · ${DISTRICT_LABELS[realm.entryDistrict] || 'My Realm Studio'}`;
  paintReturnLoop(realm);
  paintRealmCard(realm);
}

function paintShowcase(realm) {
  const host = byId('realm-studio-showcase');
  if (!host) {
    return;
  }
  const items = privateMarketItems();
  if (!items.length) {
    host.innerHTML = '<p class="realm-studio-empty">No local Market preview is available yet. Create an original private preview in Market, then return here to select it for your local moodboard.</p><a class="eon-operator-secondary" href="/market">Open Market</a>';
    return;
  }
  host.innerHTML = `<div class="realm-studio-showcase-grid">${items.slice(0, 12).map((item) => {
    const checked = realm.showcaseRefs.includes(item.id);
    const image = /^data:image\//i.test(String(item.imageUri || '')) ? `<img src="${escapeHtml(item.imageUri)}" alt="" />` : '<span class="realm-studio-showcase-art" aria-hidden="true">◇</span>';
    return `<label class="realm-studio-showcase-item ${checked ? 'is-selected' : ''}">
      <input type="checkbox" data-realm-showcase-ref value="${escapeHtml(item.id)}" ${checked ? 'checked' : ''} />
      ${image}<span><strong>${escapeHtml(cleanText(item.title, 72))}</strong><small>Local Relic preview · not published or transferable</small></span>
    </label>`;
  }).join('')}</div><p class="realm-studio-showcase-note">Select up to four. These are local Relic references only and never become a listing, collectible sale, transferable asset, or public asset through a signed Realm link. ${escapeHtml(REALM_RELIC_SUMMARY.realm.note)}</p>`;
}

function paintSafety(realm) {
  const review = reviewRealmPublicMetadata({ label: realm.label, handle: realm.handle });
  const proposal = buildPublicRealmManifestProposal(realm);
  const publication = getPublicRealmPublicationStatus(realm);
  const copy = byId('realm-studio-safety-copy');
  const host = byId('realm-studio-safety');
  const publicationStatus = byId('realm-studio-publication-status');
  if (copy) {
    copy.textContent = review.ok
      ? 'Your label and handle are suitable for a portable identity link. A signed link still does not create a public profile database, official Market placement, affiliate status, payment path, or payout.'
      : 'This Realm needs a metadata review before you create a signed identity link.';
  }
  if (publicationStatus) {
    publicationStatus.textContent = `${publication.message} Future publication would require a verified server account, server handle checks, terms, a report/takedown path, and a versioned public-data allowlist. No request is sent from this browser.`;
  }
  if (host) {
    host.innerHTML = review.ok
      ? `<strong class="is-safe">Metadata review passed</strong><p>Public publishing remains off. The future design-only manifest excludes private City state, local showcase references, Vault data, credentials, payments, attribution, and payouts. Anyone can report a future public Realm for impersonation or abuse through <a href="${escapeHtml(proposal.validation.reportPath)}">Support</a>.</p>`
      : `<strong class="is-review">Metadata needs review</strong><ul>${review.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul><p><a href="${escapeHtml(review.reportPath)}">Report / takedown support</a> will remain available before any future public publishing.</p>`;
  }
  return review;
}

function fillForm(realm) {
  const label = byId('realm-studio-label');
  const handle = byId('realm-studio-handle');
  const theme = byId('realm-studio-theme');
  const layout = byId('realm-studio-layout');
  const landmark = byId('realm-studio-landmark');
  const entry = byId('realm-studio-entry');
  if (label) label.value = realm.label;
  if (handle) handle.value = realm.handle;
  if (theme) theme.value = realm.theme;
  if (layout) layout.value = realm.layout || 'command-loft';
  document.querySelectorAll('[data-realm-shortcut]').forEach((input) => { input.checked = Array.isArray(realm.shortcuts) && realm.shortcuts.includes(String(input.value || '')); });
  const featured = realm.featuredItem || null;
  if (byId('realm-studio-featured-type')) byId('realm-studio-featured-type').value = featured?.type || '';
  if (byId('realm-studio-featured-title')) byId('realm-studio-featured-title').value = featured?.title || '';
  if (byId('realm-studio-featured-id')) byId('realm-studio-featured-id').value = featured?.id || '';
  if (landmark) landmark.value = realm.landmark || 'observatory';
  if (entry) entry.value = realm.entryDistrict;
  paintPreview(realm);
  paintShowcase(realm);
  paintSafety(realm);
  paintVisualProfile(realm);
  paintRelicPassport();
}

function readForm() {
  return {
    label: cleanText(byId('realm-studio-label')?.value, 48),
    handle: String(byId('realm-studio-handle')?.value || ''),
    theme: String(byId('realm-studio-theme')?.value || 'graphite'),
    layout: MY_REALM_LAYOUTS.some((layout) => layout.id === String(byId('realm-studio-layout')?.value || ''))
      ? String(byId('realm-studio-layout')?.value)
      : 'command-loft',
    shortcuts: selectedRealmShortcuts(),
    featuredItem: readFeaturedItem(),
    landmark: MY_REALM_LANDMARKS.some((landmark) => landmark.id === String(byId('realm-studio-landmark')?.value || ''))
      ? String(byId('realm-studio-landmark')?.value)
      : 'observatory',
    entryDistrict: MY_REALM_ENTRY_DISTRICTS.includes(String(byId('realm-studio-entry')?.value || ''))
      ? String(byId('realm-studio-entry')?.value)
      : 'realm',
    showcaseRefs: selectedShowcaseRefs()
  };
}

function socialText(realm, link) {
  return `Explore ${realm.label} in EONAPP through a self-contained signed Realm identity link. It verifies locally and may create a free local Welcome Relic for the visitor. It does not publish a shop, payment request, referral conversion, payout, premium access, wallet asset, NFT, or financial reward.\n${link}`;
}

let currentRealm = null;
let currentShare = null;

function saveFromForm({ announce = true, recordOutcome = false } = {}) {
  const input = readForm();
  const review = reviewRealmPublicMetadata(input);
  if (!review.ok) throw new Error(review.issues.join(' '));
  currentRealm = updateMyRealmState((previous) => ({
    ...previous,
    label: review.label,
    handle: review.handle,
    theme: input.theme,
    layout: input.layout,
    shortcuts: input.shortcuts,
    featuredItem: input.featuredItem,
    landmark: input.landmark,
    entryDistrict: input.entryDistrict,
    showcaseRefs: input.showcaseRefs
  })).state;
  fillForm(currentRealm);
  if (recordOutcome) {
    recordEonCoreOutcome({ kind: 'realm-layout-saved', route: '/realm-studio', source: 'realm-studio-local-save', receiptId: `realm-layout-saved:${Date.now()}`, verified: true });
  }
  if (announce) {
    appendOperatorActivity({ source: 'realm', status: 'complete', title: 'My Realm saved locally', detail: `${currentRealm.label} uses the ${LAYOUT_LABELS[currentRealm.layout] || 'Command Loft'} layout with ${currentRealm.shortcuts.map((id) => SHORTCUT_LABELS[id] || id).join(', ')}. No public marketplace or earnings surface was created.`, route: '/realm-studio' });
    setStatus('My Realm layout, shortcuts and safe Realm Card were saved locally. Sharing remains explicit and read-only.', 'success');
  }
  return currentRealm;
}

async function issueShare() {
  const realm = saveFromForm({ announce: false });
  setStatus('Creating a fresh signed Realm identity link locally…');
  const share = await createRealmShareLink(realmForShare(realm), { source: 'realm-studio', origin: location.origin });
  currentShare = share;
  const input = byId('realm-studio-url');
  if (input) input.value = share.link;
  const copy = byId('realm-studio-copy');
  const native = byId('realm-studio-native');
  if (copy) copy.disabled = false;
  if (native) native.disabled = false;
  const mission = byId('realm-studio-mission');
  if (mission) mission.textContent = `Verified portable identity share · ${share.missionCode}`;
  await renderQrCanvas(byId('realm-studio-qr'), share.link);
  appendOperatorActivity({ source: 'realm', status: 'ready', title: 'Signed Realm identity link created', detail: `${realm.label} received a fresh portable eon3 identity link. No central link registry, reward, payout, or public store was used. A local cosmetic Relic, when explicitly created by this device, is not a referral conversion, payment reward, premium entitlement, or financial value.`, route: '/realm-studio' });
  setStatus('Fresh signed Realm identity link created. It contains public identity metadata only; your City and showcase stay local.', 'success');
}

function bind() {
  byId('realm-studio-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    try { saveFromForm({ recordOutcome: true }); }
    catch (error) { setStatus(`Realm metadata needs review: ${String(error?.message || error)}`, 'error'); paintSafety({ ...currentRealm, ...readForm() }); }
  });
  byId('realm-studio-reset')?.addEventListener('click', () => {
    currentRealm = ensureMyRealmState().state;
    fillForm(currentRealm);
    setStatus('Draft reset to the saved local Realm on this device.');
  });
  byId('realm-studio-issue')?.addEventListener('click', () => issueShare().catch((error) => setStatus(`Could not create the signed link: ${String(error?.message || error)}.`, 'error')));
  byId('realm-studio-copy')?.addEventListener('click', async (event) => {
    if (!currentShare?.link) return;
    try {
      await navigator.clipboard.writeText(currentShare.link);
      event.currentTarget.textContent = 'Copied';
      setStatus('Signed Realm identity link copied.');
    } catch {
      setStatus('The signed link is ready in the field above. Copy it manually if clipboard access is blocked.', 'error');
    }
  });
  byId('realm-studio-native')?.addEventListener('click', async () => {
    if (!currentShare?.link) return;
    const payload = { title: `${currentRealm.label} · EONAPP Realm`, text: socialText(currentRealm, currentShare.link), url: currentShare.link };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        const relic = awardLocalRealmShareRelic({ eventType: EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE, realm: currentRealm });
        paintRelicPassport();
        setStatus(relic.created ? 'System share completed. A free local Signal Relic was added to this device; it is cosmetic only and does not verify delivery or a referral.' : 'System share completed. This device already has its Signal Relic for this Realm; delivery and referrals are never tracked.', 'success');
      } else {
        await navigator.clipboard.writeText(currentShare.link);
        setStatus('System share is unavailable; the signed Realm link was copied instead.');
      }
    } catch {
      setStatus('Sharing was cancelled or unavailable. The signed link remains in the field above.');
    }
  });
  byId('realm-studio-visual-save')?.addEventListener('click', () => {
    try { saveVisualProfileFromForm(); }
    catch (error) { setStatus(`Realm visual profile needs attention: ${String(error?.message || error)}`, 'error'); }
  });
  byId('realm-studio-visual-export')?.addEventListener('click', () => {
    exportVisualBackup().catch((error) => setStatus(`Could not export the Realm visual backup: ${String(error?.message || error)}`, 'error'));
  });
  byId('realm-studio-visual-import')?.addEventListener('click', () => byId('realm-studio-visual-file')?.click());
  byId('realm-studio-visual-file')?.addEventListener('change', (event) => {
    const file = event.target?.files?.[0];
    importVisualBackup(file).catch((error) => setStatus(`Could not restore the Realm visual backup: ${String(error?.message || error)}`, 'error')).finally(() => { event.target.value = ''; });
  });
  for (const id of ['realm-studio-return-city', 'realm-studio-return-city-inline']) {
    byId(id)?.addEventListener('click', () => {
      // The City records the actual page entry once per document. This click only
      // communicates intent and does not create a referral conversion or commercial reward.
      setStatus('Opening your private Realm route in 2D EON City…');
    });
  }
  byId('realm-studio-showcase')?.addEventListener('change', (event) => {
    const input = event.target;
    if (!input?.matches?.('[data-realm-showcase-ref]')) return;
    const refs = selectedShowcaseRefs();
    if (refs.length > 4) {
      input.checked = false;
      setStatus('Choose up to four local previews for your Realm moodboard.', 'error');
      return;
    }
    currentRealm = updateMyRealmShowcase(refs).state;
    paintPreview(currentRealm);
    paintShowcase(currentRealm);
    setStatus('Local showcase selection saved. It is not published by a signed identity link.', 'success');
  });
  byId('realm-studio-relic-clear')?.addEventListener('click', () => {
    if (!window.confirm('Remove all local Share Relics from this browser profile? This cannot affect any other device because nothing was uploaded.')) return;
    const result = clearLocalRealmShareRelics({ confirmedByUser: true });
    paintRelicPassport();
    setStatus(result.ok ? `Removed ${result.removed} local Share Relic${result.removed === 1 ? '' : 's'} from this device.` : 'Local Share Relics were not removed.', result.ok ? 'success' : 'error');
  });
  document.querySelectorAll('[data-realm-shortcut]').forEach((input) => input.addEventListener('change', () => {
    const selected = selectedRealmShortcuts();
    if (document.querySelectorAll('[data-realm-shortcut]:checked').length > 4) {
      input.checked = false;
      setStatus('Choose up to four shortcuts for My Realm.', 'error');
      return;
    }
    paintRealmCard({ ...currentRealm, ...readForm(), shortcuts: selected });
  }));
  ['realm-studio-layout', 'realm-studio-theme', 'realm-studio-featured-type', 'realm-studio-featured-title', 'realm-studio-featured-id'].forEach((id) => byId(id)?.addEventListener('input', () => paintRealmCard({ ...currentRealm, ...readForm() })));
  ['realm-studio-label', 'realm-studio-handle'].forEach((id) => byId(id)?.addEventListener('input', () => { const draft = { ...currentRealm, ...readForm() }; paintSafety(draft); paintRealmCard(draft); }));
}

function init() {
  enterCityMode('realm-studio', { entry: 'realm-studio' });
  bindCityModeLinkTracking(document, 'realm-studio', { entry: 'realm-studio' });
  const loaded = ensureMyRealmState();
  currentRealm = loaded.state;
  fillForm(currentRealm);
  const publicIdentity = getMyRealmPublicIdentity(currentRealm);
  if (loaded.migrated) {
    setStatus('Your earlier local Realm identity was copied into the new City-linked Realm state. The original record remains unchanged.', 'success');
  } else {
    setStatus(`Local Realm loaded. ${publicIdentity.note}`, 'info');
  }
  bind();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
