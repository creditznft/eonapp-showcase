import { listSocialMissions } from './social-mission-engine.js';
import { summarizeSharePerformance } from '../utils/share-performance.js';
import { listSocialRewards } from '../utils/share-reward-policy.js';
import { getQueuedShareReceiptCount } from '../utils/decentralized-receipt-ledger.js';

function esc(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export function renderSharePerformanceDashboard(root, options = {}) {
  if (!root) return null;
  const missions = listSocialMissions();
  const performance = summarizeSharePerformance(options.filters || {});
  const rewards = listSocialRewards();
  const points = rewards.reduce((sum, row) => sum + Number(row.points || 0), 0);
  const rows = missions.slice(0, 12).map((mission) => {
    const stats = summarizeSharePerformance({ shareId: mission.payload?.shareId });
    return `<tr><td>${esc(mission.missionCode)}</td><td>${esc(mission.platform)}</td><td>${esc(mission.proofStatus || 'not_submitted')}</td><td>${stats.byEvent.link_open || 0}</td><td>${stats.estimatedUniqueVisitors}</td><td>${stats.byEvent.onboarding_complete || 0}</td><td>${stats.byEvent.proof_action_complete || 0}</td></tr>`;
  }).join('');
  root.innerHTML = `<section class="eon-share-dashboard"><div class="eon-share-dashboard-head"><div><span class="eon-social-kicker">Local-first performance</span><h3>${esc(options.heading || 'My share performance')}</h3></div><small>${getQueuedShareReceiptCount()} receipt(s) waiting for Nostr sync</small></div><div class="eon-share-kpis"><div><strong>${missions.length}</strong><span>active links</span></div><div><strong>${performance.byEvent.link_open || 0}</strong><span>opens</span></div><div><strong>${performance.estimatedUniqueVisitors}</strong><span>estimated unique</span></div><div><strong>${points}</strong><span>Social Points</span></div></div><div class="eon-share-table-wrap"><table><thead><tr><th>Mission</th><th>Source</th><th>Proof</th><th>Opens</th><th>Unique*</th><th>Onboarded</th><th>Proof actions</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Create your first signed link to start tracking.</td></tr>'}</tbody></table></div><p class="eon-social-honesty">*Unique visitors are privacy-safe, per-share estimates. High-value rewards still require proof actions or provider-confirmed conversions.</p></section>`;
  return { missions, performance, rewards };
}
