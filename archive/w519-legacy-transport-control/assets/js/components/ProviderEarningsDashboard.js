import { buildDistributedInferenceTruth } from '../utils/distributed-inference-policy.js';
const _DistributedInferenceHelpers = /** @type {any} */ (window.DistributedInferenceHelpers);
const _DistributedInferenceService = /** @type {any} */ (window.DistributedInferenceService);
/**
 * ProviderEarningsDashboard.js
 * 
 * Earnings tracking UI component for inference providers
 * Shows:
 * - Total CU earned
 * - Total USD earned
 * - Jobs served
 * - Reputation score
 * - Per-node breakdown
 */

class ProviderEarningsDashboard {
  constructor(/** @type {any} */ containerId = 'provider-earnings-dashboard') {
    this.containerId = containerId;
    this.service = /** @type {any} */ (window.getDistributedInferenceService)();
    this.userId = null;

    this._initDOM();
    this._loadStats();

    // Auto-refresh every 30 seconds
    setInterval(() => this._loadStats(), 30000);
  }

  _initDOM() {
    const /** @type {any} */
container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="earnings-dashboard" style="
        padding: 16px;
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border-radius: 12px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">💰 Provider Earnings</h2>
          <button id="refresh-earnings-btn" style="
            padding: 6px 12px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
          " onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">
            🔄 Refresh
          </button>
        </div>

        <div id="earnings-summary" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        ">
          <!-- Summary cards will be inserted here -->
        </div>

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">📊 Your Nodes</h3>
          <div id="nodes-list" style="display: grid; gap: 12px;">
            <!-- Nodes will be listed here -->
          </div>
        </div>

        <div id="inference-policy-note" style="margin-top:12px;font-size:12px;color:#9CA3AF;"></div>

        <div id="no-nodes" style="
          text-align: center;
          padding: 24px;
          color: #6B7280;
          display: none;
        ">
          ℹ️ No nodes registered yet.<br/>
          <span style="font-size: 12px;">Start a local runtime or announce a node to begin earning.</span>
        </div>
      </div>
    `;

    const refreshBtn = document.getElementById('refresh-earnings-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this._loadStats());
    }
    const policyEl = document.getElementById('inference-policy-note');
    if (policyEl) {
      const policy = buildDistributedInferenceTruth();
      policyEl.textContent = `Policy: ${policy.productCopy} ${policy.marketplaceDecision}`;
    }
  }

  async _loadStats() {
    try {
      // Get current user
      this.userId = await this.service._getCurrentUserId();
      const stats = this.service.getProviderStats(this.userId);

      this._renderSummary(stats);
      this._renderNodes(stats.nodes);
    } catch (/** @type {any} */
err) {
      console.error('Failed to load earnings stats:', err);
    }
  }

  _renderSummary(/** @type {any} */ stats) {
    const /** @type {any} */
summaryEl = document.getElementById('earnings-summary');
    if (!summaryEl) return;

    const /** @type {any} */
noNodesEl = document.getElementById('no-nodes');
    if (stats.nodeCount === 0) {
      if (noNodesEl) noNodesEl.style.display = 'block';
      summaryEl.innerHTML = '';
      return;
    }

    if (noNodesEl) noNodesEl.style.display = 'none';

    const /** @type {any} */
cards = [
      {
        label: 'Total CU Earned',
        value: _DistributedInferenceHelpers.formatCU(stats.totalCUEarned),
        icon: '⚡',
        color: '#FCD34D',
      },
      {
        label: 'Total Earnings',
        value: _DistributedInferenceHelpers.formatUSD(stats.totalEarningsUSD),
        icon: '💵',
        color: '#34D399',
      },
      {
        label: 'Jobs Served',
        value: stats.totalJobsServed.toLocaleString(),
        icon: '📦',
        color: '#60A5FA',
      },
      {
        label: 'Avg Reputation',
        value: _DistributedInferenceHelpers.formatReputation(stats.avgReputation),
        icon: '⭐',
        color: '#A78BFA',
      },
    ];

    summaryEl.innerHTML = cards.map((/** @type {any} */ card) => `
      <div style="
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      ">
        <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 4px;">${card.icon} ${card.label}</div>
        <div style="
          font-size: 16px;
          font-weight: 600;
          color: ${card.color};
        ">
          ${card.value}
        </div>
      </div>
    `).join('');
  }

  _renderNodes(/** @type {any} */ nodes) {
    const /** @type {any} */
listEl = document.getElementById('nodes-list');
    if (!listEl) return;

    if (!nodes || !nodes.length) {
      listEl.innerHTML = '<div style="color: #6B7280; font-size: 13px;">No nodes found</div>';
      return;
    }

    listEl.innerHTML = nodes.map((/** @type {any} */ node) => this._createNodeCard(node)).join('');
  }

  _createNodeCard(/** @type {any} */ node) {
    const tierCfg = _DistributedInferenceService.TIER_CONFIGS.find((/** @type {any} */ t) => t.tier === node.tier);
    const tierColor = _DistributedInferenceHelpers.getTierColor(node.tier);

    return `
      <div style="
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="font-weight: 500; font-size: 13px;">
            ${node.displayName}
          </div>
          <div style="
            font-size: 11px;
            padding: 2px 6px;
            background: rgba(${this._hexToRgb(tierColor)}, 0.2);
            border-radius: 4px;
            color: ${tierColor};
          ">
            ${tierCfg ? tierCfg.name : 'Unknown'}
          </div>
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          font-size: 12px;
          margin-bottom: 8px;
          color: #D1D5DB;
        ">
          <div>
            <div style="color: #9CA3AF; font-size: 11px;">CU Earned</div>
            <div style="font-weight: 600; color: #FCD34D;">
              ${_DistributedInferenceHelpers.formatCU(node.computeUnitsEarned)}
            </div>
          </div>
          <div>
            <div style="color: #9CA3AF; font-size: 11px;">Jobs</div>
            <div style="font-weight: 600; color: #60A5FA;">
              ${node.requestsServed}
            </div>
          </div>
          <div>
            <div style="color: #9CA3AF; font-size: 11px;">Latency</div>
            <div style="font-weight: 600; color: #34D399;">
              ${_DistributedInferenceHelpers.formatLatency(node.avgLatencyMs)}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 4px; align-items: center;">
          <div style="flex: 1; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px;">
            <div style="
              height: 100%;
              background: linear-gradient(90deg, #EC4899, #F472B6);
              border-radius: 2px;
              width: ${node.reputation}%;
            "></div>
          </div>
          <div style="font-size: 11px; color: #9CA3AF;">
            Rep ${Math.round(node.reputation)}%
          </div>
        </div>

        <div style="
          margin-top: 8px;
          font-size: 11px;
          color: #6B7280;
          display: flex;
          gap: 12px;
        ">
          <span>Status: ${node.online ? '🟢 Online' : '🔴 Offline'}</span>
          <span>Stake: ${node.stakeEON.toLocaleString()} EON</span>
        </div>
      </div>
    `;
  }

  _hexToRgb(/** @type {any} */ hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '100, 100, 100';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('provider-earnings-dashboard')) {
    window.providerEarningsDashboard = new ProviderEarningsDashboard('provider-earnings-dashboard');
  }
});

window.ProviderEarningsDashboard = ProviderEarningsDashboard;
