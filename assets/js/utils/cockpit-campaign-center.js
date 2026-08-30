/**
 * cockpit-campaign-center.js
 * AI Cockpit v2 campaign/business launcher surface.
 */

import { renderApprovalSchedulerPanel, createApprovalSchedule, listApprovalSchedule } from './user-approved-social-scheduler.js';
import { buildPlatformShareTargets } from '../social/social-platform-adapters.js';
import { createRealmShareLink } from './realm-share-runtime.js';

const CAMPAIGN_KEY = 'eon:cockpit:campaign-center:v1';

export const COCKPIT_CAMPAIGN_MODULES = Object.freeze([
  { id: 'website', icon: '🌐', title: 'Website Generator', route: '/workspace', desc: 'Turn an idea into a local landing-page brief, sections, and CTA copy.' },
  { id: 'projects', icon: '🧭', title: 'Project Planner', route: '/projects', desc: 'Turn a goal into a focused, reviewable project plan.' },
  { id: 'invite', icon: '📣', title: 'Invite Campaign', route: '/profile', desc: 'Create signed invite links, review copy, and keep share drafts local.' },
  { id: 'social', icon: '🗓️', title: 'Approval Queue', route: '/workspace', desc: 'Prepare platform-specific drafts. You approve each composer opening.' },
  { id: 'research', icon: '🔎', title: 'Research Planner', route: '/workspace', desc: 'Plan research and outreach without account connection or secret automation.' },
  { id: 'backup', icon: '🔐', title: 'Workspace Capsule', route: '/capsule', desc: 'Create and store a local Capsule before changing devices.' }
]);

export function buildDefaultReferralCampaign(profile = {}) {
  const name = String(profile.displayName || profile.alias || profile.username || 'my Realm').slice(0, 64);
  return {
    id: `campaign-${Date.now().toString(36)}`,
    name: 'Share my EONAPP invite',
    url: '',
    ref: '',
    channels: ['WhatsApp', 'X', 'Facebook', 'Telegram', 'Email'],
    posts: [
      `I am building my AI workspace on EONAPP. Create a signed portable Realm link before posting this campaign.`,
      `EONAPP campaign draft for ${name}. This local draft has no public link, reward, revenue share, or posting action yet.`
    ],
    createdAt: new Date().toISOString(),
    status: 'local-draft-needs-signed-link',
    rewardsActive: false
  };
}

export async function buildSignedReferralCampaign(profile = {}, options = {}) {
  const handle = String(profile.slug || profile.username || profile.alias || 'my-realm').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') || 'my-realm';
  const share = await createRealmShareLink({ ...profile, username: handle, displayName: profile.displayName || profile.alias || handle }, {
    source: options.platform || 'social',
    origin: options.origin || window.location.origin,
    realmId: profile.publicRealmId || profile.realmPublicId,
    theme: profile.theme || 'dark-purple'
  });
  const title = 'Invite someone to EONAPP';
  const targets = buildPlatformShareTargets({
    link: share.link,
    missionCode: share.missionCode,
    title,
    message: 'Explore EONAPP through a signed local-first invite link. No rewards, payment, or account connection is active.'
  });
  return {
    id: `campaign-${share.payload.shareId}`,
    name: 'Signed EONAPP invite draft',
    url: share.link,
    ref: share.payload.rootReferralId,
    missionCode: share.missionCode,
    shareId: share.payload.shareId,
    channels: ['X', 'Telegram', 'WhatsApp', 'Reddit', 'LinkedIn', 'Facebook', 'Email'],
    posts: [
      `I am building with EONAPP ⚡\n\n${share.link}\n\nSigned local-first invite · ${share.missionCode}\n\n#EONApps #EONCity`,
      `Explore EONAPP through a signed local-first invite link:\n${share.link}\n\n${share.missionCode}`
    ],
    targets,
    createdAt: new Date().toISOString(),
    status: 'draft-local-signed',
    subscriptionUnlockAllowed: false,
    rewardsActive: false,
    revenueShareActive: false,
    publicNotice: share.publicNotice
  };
}

export function saveCockpitCampaign(campaign) {
  try {
    const rows = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '[]');
    const list = Array.isArray(rows) ? rows : [];
    list.unshift(campaign);
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(list.slice(0, 25)));
    return { ok: true, campaign };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

export function listCockpitCampaigns() {
  try {
    const rows = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('eon:realm:profile:v2') || localStorage.getItem('eon:profile') || '{}');
    return profile && typeof profile === 'object' ? profile : {};
  } catch {
    return {};
  }
}

export function initCockpitCampaignCenter(root = document) {
  const host = root.querySelector?.('#eon-newtab-page .eon-newtab-inner') || root.querySelector?.('.browser-workspace-compat') || root.body;
  if (!host || root.querySelector?.('#eon-cockpit-campaign-center')) return { ok: false, reason: 'missing-or-mounted' };

  const section = root.createElement('section');
  section.id = 'eon-cockpit-campaign-center';
  section.className = 'eon-cockpit-campaign-center';
  section.setAttribute('aria-label', 'AI Cockpit campaign center');
  section.innerHTML = `
    <div class="eon-campaign-head">
      <div>
        <strong>AI Cockpit campaign studio</strong>
        <span>Create signed invite drafts and approval-first share plans. EONAPP never connects or posts to a social account automatically.</span>
      </div>
      <div class="eon-campaign-actions">
        <button class="btn btn-primary btn-sm" id="eon-campaign-generate" type="button">Generate invite campaign</button>
        <button class="btn btn-outline btn-sm" id="eon-campaign-schedule" type="button">Create approval schedule</button>
      </div>
    </div>
    <div class="eon-campaign-grid">
      ${COCKPIT_CAMPAIGN_MODULES.map((item) => `
        <a class="eon-campaign-card" href="${esc(item.route)}" data-app-url="${esc(item.route)}">
          <span class="eon-campaign-icon">${esc(item.icon)}</span>
          <strong>${esc(item.title)}</strong>
          <small>${esc(item.desc)}</small>
        </a>`).join('')}
    </div>
    <div class="eon-campaign-output" id="eon-campaign-output" role="status" aria-live="polite"></div>
    <div class="eon-campaign-scheduler-host" id="eon-campaign-scheduler-host"></div>`;

  host.appendChild(section);
  let activeCampaign = listCockpitCampaigns()[0] || null;
  const schedulerHost = section.querySelector('#eon-campaign-scheduler-host');

  const showCampaign = async (campaign) => {
    activeCampaign = campaign;
    const saved = saveCockpitCampaign(campaign);
    const out = section.querySelector('#eon-campaign-output');
    if (out) {
      out.innerHTML = saved.ok
        ? `<strong>Campaign draft saved.</strong><br><span>${esc(campaign.posts[0])}</span><br><small>Policy: drafts are local, scheduled posts always require your approval, and EONAPP never posts or opens a social account on your behalf.</small>`
        : `<strong>Could not save campaign.</strong> ${esc(saved.error || '')}`;
    }
    if (schedulerHost) renderApprovalSchedulerPanel(schedulerHost, campaign);
    try { await navigator.clipboard?.writeText(campaign.posts[0]); } catch {}
  };

  section.querySelector('#eon-campaign-generate')?.addEventListener('click', async () => {
    const profile = readProfile();
    const campaign = await buildSignedReferralCampaign({
      slug: profile.username || profile.alias || 'my-realm',
      id: profile.id || profile.uid || ''
    }, { platform: 'x', destination: '/realm-studio' });
    await showCampaign(campaign);
  });

  section.querySelector('#eon-campaign-schedule')?.addEventListener('click', () => {
    const profile = readProfile();
    const campaign = activeCampaign || buildDefaultReferralCampaign({
      slug: profile.username || profile.alias || 'my-realm'
    });
    activeCampaign = campaign;
    createApprovalSchedule(campaign, {});
    if (schedulerHost) renderApprovalSchedulerPanel(schedulerHost, campaign);
    const out = section.querySelector('#eon-campaign-output');
    if (out) out.innerHTML = `<strong>Approval schedule ready.</strong><br><span>${esc(String(listApprovalSchedule().length))} local review items are waiting for your approval. No post will be published automatically.</span>`;
  });

  if (schedulerHost) renderApprovalSchedulerPanel(schedulerHost, activeCampaign || buildDefaultReferralCampaign(readProfile()));
  return { ok: true, modules: COCKPIT_CAMPAIGN_MODULES.length, scheduledItems: listApprovalSchedule().length };
}
