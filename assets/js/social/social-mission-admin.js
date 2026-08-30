const CAMPAIGN_KEY = 'eon:social-campaigns:v1';

function read() { try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '[]'); } catch { return []; } }
function write(rows) { try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(rows)); } catch {} }

export function createSocialCampaign(input = {}) {
  const now = Date.now();
  const campaign = {
    schema: 'eon.social-campaign.v1',
    campaignId: String(input.campaignId || `campaign-${now.toString(36)}`),
    title: String(input.title || 'Share EON Apps'),
    destinations: Array.isArray(input.destinations) ? input.destinations : ['/'],
    platforms: Array.isArray(input.platforms) ? input.platforms : ['x', 'telegram', 'reddit', 'generic'],
    missionTypes: Array.isArray(input.missionTypes) ? input.missionTypes : ['original_post', 'quote_post', 'public_share'],
    basePoints: Math.max(0, Math.min(50, Number(input.basePoints || 15))),
    performanceTiers: Array.isArray(input.performanceTiers) ? input.performanceTiers : [{ uniqueVisits: 5, points: 5 }, { uniqueVisits: 20, points: 15 }, { onboardingComplete: 3, points: 25 }],
    startsAt: Number(input.startsAt || now),
    endsAt: Number(input.endsAt || now + 7 * 86400000),
    dailyCap: Math.max(1, Math.min(10, Number(input.dailyCap || 3))),
    policy: 'social-points-and-pool-entries-only',
    createdAt: now
  };
  const rows = read(); rows.unshift(campaign); write(rows.slice(0, 100)); return campaign;
}

export function listSocialCampaigns() { return read(); }

export function renderSocialMissionAdmin(root) {
  if (!root) return null;
  const campaigns = listSocialCampaigns();
  root.innerHTML = `<section class="eon-social-admin"><h3>Viral campaign policy</h3><p>Campaigns create signed links for X, Telegram, Reddit and all other channels. Rewards are capped Social/Pool Points; social proof alone cannot unlock paid subscription.</p><button class="btn btn-primary" type="button" data-create-launch>Create EON City launch campaign</button><div data-campaign-list>${campaigns.map((row) => `<article><strong>${row.title}</strong><small>${row.campaignId} · ${row.platforms.join(', ')} · ${row.basePoints} base points</small></article>`).join('') || '<p>No signed social campaigns yet.</p>'}</div></section>`;
  root.querySelector('[data-create-launch]')?.addEventListener('click', () => { createSocialCampaign({ campaignId: 'eon-city-launch', title: 'Share EON City', destinations: ['/realm.html'], platforms: ['x', 'telegram', 'reddit', 'generic'] }); renderSocialMissionAdmin(root); });
  return campaigns;
}
