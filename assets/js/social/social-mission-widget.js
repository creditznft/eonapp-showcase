import { createSocialMission, submitPublicProof } from './social-mission-engine.js';
import { recordSharePerformance } from '../utils/share-performance.js';

function esc(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function readProfile() { try { return JSON.parse(localStorage.getItem('eon:realm:profile:v2') || localStorage.getItem('eon:profile') || '{}'); } catch { return {}; } }

export async function renderSocialMissionWidget(root, options = {}) {
  if (!root) return null;
  const profile = options.profile || readProfile();
  const platform = options.platform || 'x';
  root.innerHTML = `<section class="eon-social-mission" data-social-mission-widget="1">
    <div class="eon-social-mission-head"><div><span class="eon-social-kicker">Signed public share</span><h3>${esc(options.heading || 'Share EONAPP safely')}</h3><p>${esc(options.description || 'Create a fresh cryptographically unique self-contained link. It verifies locally, uses no central short-link registry, and no active reward or payout is attached to sharing.')}</p></div><span class="eon-social-trust">No OAuth · No scraping · No reward campaign</span></div>
    <div class="eon-social-controls">
      <label>Platform<select data-social-platform><option value="x">X</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option><option value="reddit">Reddit</option><option value="linkedin">LinkedIn</option><option value="facebook">Facebook</option><option value="email">Email</option><option value="generic">Other</option></select></label>
      <button class="btn btn-primary" type="button" data-social-create>Create signed link</button>
    </div>
    <div class="eon-social-output" data-social-output aria-live="polite"></div>
  </section>`;
  const output = root.querySelector('[data-social-output]');
  const select = root.querySelector('[data-social-platform]');
  select.value = platform;

  root.querySelector('[data-social-create]')?.addEventListener('click', async () => {
    const selected = select.value;
    output.innerHTML = '<p>Creating signed mission…</p>';
    const mission = await createSocialMission({
      platform: selected,
      source: selected,
      issuerId: profile.id || profile.uid || profile.alias || 'local-user',
      rootReferralId: profile.id || profile.uid || profile.alias || 'local-user',
      destination: options.destination || location.pathname,
      linkKind: options.linkKind || ((profile.username || profile.slug) ? 'realm' : 'referral'),
      realm: options.realm || ((profile.username || profile.slug) ? {
        id: profile.publicRealmId || profile.realmPublicId || '',
        handle: profile.username || profile.slug,
        displayName: profile.displayName || profile.alias || profile.username || profile.slug,
        theme: profile.theme || 'dark-purple'
      } : null),
      realmId: profile.publicRealmId || profile.realmPublicId || '',
      realmHandle: profile.username || profile.slug || '',
      realmLabel: profile.displayName || profile.alias || profile.username || profile.slug || '',
      realmTheme: profile.theme || 'dark-purple',
      missionType: options.missionType || ((profile.username || profile.slug) ? 'share_realm' : 'public_share'),
      title: options.title || ((profile.username || profile.slug) ? 'Explore my EON Realm' : 'Explore EON Apps'),
      message: options.message || 'I am exploring EON Apps and EON City. Open this self-contained signed link.'
    });
    const missionData = /** @type {any} */ (mission);
    const target = missionData.targets?.[selected] || mission.link;
    output.innerHTML = `<div class="eon-social-link-card">
      <div><strong>${esc(mission.missionCode)}</strong><small>Cryptographically bound to this exact link</small></div>
      <input value="${esc(mission.link)}" readonly data-social-link>
      <div class="eon-social-actions"><button class="btn btn-outline btn-sm" type="button" data-social-copy>Copy link</button><a class="btn btn-primary btn-sm" href="${esc(target)}" target="_blank" rel="noopener noreferrer" data-social-open>Share on ${esc(selected === 'x' ? 'X' : selected)}</a><button class="btn btn-outline btn-sm" type="button" data-social-native>System share</button></div>
      ${selected === 'x' || selected === 'reddit' || selected === 'linkedin' || selected === 'facebook' || selected === 'generic' ? `<div class="eon-social-proof"><label>Paste your public post URL<input type="url" placeholder="https://..." data-social-proof-url></label><button class="btn btn-outline btn-sm" type="button" data-social-verify>Verify public proof</button><p data-social-proof-result></p></div>` : ''}
      <p class="eon-social-honesty">Each new share receives a fresh cryptographic id. Opening or posting the link does not create points, money, access, a payout, or a central link record. A verified referral-tree relationship may be queued only after a genuine qualifying action.</p>
    </div>`;
    output.querySelector('[data-social-copy]')?.addEventListener('click', async (event) => {
      await navigator.clipboard?.writeText(mission.link);
      event.currentTarget.textContent = 'Copied';
      void recordSharePerformance('share_attempt', { shareId: missionData.payload?.shareId, rootReferralId: missionData.payload?.rootReferralId, missionCode: mission.missionCode, proof: { platform: selected, method: 'copy' } });
    });
    output.querySelector('[data-social-open]')?.addEventListener('click', () => {
      void recordSharePerformance('share_attempt', { shareId: missionData.payload?.shareId, rootReferralId: missionData.payload?.rootReferralId, missionCode: mission.missionCode, proof: { platform: selected, method: 'intent' } });
    });
    output.querySelector('[data-social-native]')?.addEventListener('click', async () => {
      if (navigator.share) await navigator.share({ title: mission.title, text: `Mission: ${mission.missionCode}`, url: mission.link });
      else await navigator.clipboard?.writeText(mission.link);
      void recordSharePerformance('share_attempt', { shareId: missionData.payload?.shareId, rootReferralId: missionData.payload?.rootReferralId, missionCode: mission.missionCode, proof: { platform: selected, method: navigator.share ? 'native' : 'copy-fallback' } });
    });
    output.querySelector('[data-social-verify]')?.addEventListener('click', async () => {
      const proofUrl = output.querySelector('[data-social-proof-url]')?.value || '';
      const resultNode = output.querySelector('[data-social-proof-result]');
      resultNode.textContent = 'Checking public proof…';
      const result = await submitPublicProof({ mission: missionData, proofUrl, beneficiaryId: profile.id || profile.uid || profile.alias || profile.username || '' });
      resultNode.textContent = result.status === 'accepted' ? '✅ Public proof verified locally. No reward campaign is active.' : result.status?.startsWith('pending') ? `⏳ Proof pending: ${result.reason}` : `⚠️ Proof not accepted: ${result.reason}`;
    });
  });
  return { root, platform };
}
