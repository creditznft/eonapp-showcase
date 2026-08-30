import { getCampaignOrchestrator } from './utils/campaign-orchestrator.js';
import { escapeHtml } from './utils/escape.js';

try {
  await window.__EON_REQUIRE_ADMIN_READY__?.();
} catch {
  throw new Error('admin_auth_required');
}

const campaign = getCampaignOrchestrator();
const $ = (id) => document.getElementById(id);

function safeText(value) {
  return escapeHtml(String(value ?? ''));
}

function switchTab(target) {
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
  target.classList.add('active');
  const tabName = target.dataset.tab;
  if (tabName) $(tabName)?.classList.add('active');
}

function renderCampaigns() {
  const campaigns = campaign.getCampaigns();
  const html = campaigns.map((c) => `
    <div class="card">
      <div class="campaign-header">
        <div class="campaign-name">${safeText(c.name)}</div>
        <span class="status-badge ${c.active ? 'status-active' : 'status-inactive'}">
          ${c.active ? 'Active' : 'Ended'}
        </span>
      </div>
      <p class="campaign-card-desc">${safeText(c.description)}</p>
      <div class="campaign-details">
        <div class="detail-item">
          <div class="detail-label">Audience</div>
          <div class="detail-value">${safeText(c.targetAudience)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Progress</div>
          <div class="detail-value">${Object.keys(c.progress || {}).length} users</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Ends</div>
          <div class="detail-value">${safeText(new Date(c.endDate).toLocaleDateString())}</div>
        </div>
      </div>
      ${c.triggers ? `
        <div class="trigger-list">
          <strong class="campaign-card-label">Triggers:</strong>
          ${c.triggers.map((t) => `<div class="list-item"><span class="badge">${safeText(t)}</span></div>`).join('')}
        </div>` : ''}
      ${c.rewards ? `
        <div class="reward-list">
          <strong class="campaign-card-label">Rewards:</strong>
          ${c.rewards.map((r) => `<div class="list-item"><span>${safeText(r.name)}</span><span class="badge">${safeText(r.value)}</span></div>`).join('')}
        </div>` : ''}
      <div class="controls">
        <button data-campaign-action="toggle" data-campaign-id="${safeText(c.id)}" class="${c.active ? 'btn-action danger' : 'btn-action success'}">
          ${c.active ? 'Pause' : 'Resume'}
        </button>
        <button data-campaign-action="reset" data-campaign-id="${safeText(c.id)}" class="btn-action">Reset</button>
      </div>
    </div>
  `).join('');
  $('campaignsList').innerHTML = html;
}

function renderLeaderboard() {
  const lb = campaign.getLeaderboard(20);
  const html = `
    <div>
      ${lb.map((entry, idx) => `
        <div class="leaderboard-entry">
          <span class="leaderboard-rank">#${idx + 1}</span>
          <span>${safeText(entry.userId)}</span>
          <span class="leaderboard-score">${Number(entry.score || 0).toFixed(2)} pts</span>
        </div>
      `).join('')}
    </div>`;
  $('leaderboardList').innerHTML = html;
}

function createCampaign(event) {
  event.preventDefault();
  const name = $('campaignName').value;
  const desc = $('campaignDesc').value;
  const audience = $('campaignAudience').value;
  const duration = parseInt($('campaignDuration').value, 10);
  const rewardType = $('rewardType').value;
  const rewardValue = $('rewardValue').value;

  const newCampaign = {
    id: `campaign_${Date.now()}`,
    name,
    description: desc,
    startDate: Date.now(),
    endDate: Date.now() + duration * 24 * 60 * 60 * 1000,
    active: true,
    targetAudience: audience,
    triggers: ['user_action'],
    rewards: [{ type: rewardType, name, value: rewardValue }],
    progress: {},
    referralTiers: [],
    leaderboard: [],
    streaks: {}
  };

  campaign.campaigns[newCampaign.id] = newCampaign;
  campaign.saveState();
  alert('Campaign created!');
  renderCampaigns();
  const form = /** @type {HTMLFormElement | null} */ ($('newCampaignForm'));
  form?.reset();
}

function handleCampaignAction(event) {
  const btn = event.target?.closest?.('[data-campaign-action]');
  if (!btn) return;
  const id = btn.dataset.campaignId;
  const action = btn.dataset.campaignAction;
  if (!id || !campaign.campaigns[id]) return;

  if (action === 'toggle') {
    campaign.campaigns[id].active = !campaign.campaigns[id].active;
    campaign.saveState();
    renderCampaigns();
    return;
  }

  if (action === 'reset' && window.confirm('Reset this campaign? This will clear all user progress.')) {
    campaign.campaigns[id].progress = {};
    campaign.saveState();
    renderCampaigns();
  }
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', (event) => switchTab(event.currentTarget));
});

$('newCampaignForm')?.addEventListener('submit', createCampaign);
$('campaignsList')?.addEventListener('click', handleCampaignAction);

renderCampaigns();
renderLeaderboard();
setInterval(() => {
  renderCampaigns();
  renderLeaderboard();
}, 10000);
