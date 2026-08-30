/**
 * ORCHESTRATOR PERFORMANCE DASHBOARD
 * Real-time metrics display for provider health, request performance, user experience
 * 
 * Purpose:
 * - Display provider status and health metrics
 * - Show request performance trends
 * - Display agent policy audit log
 * - Show system health status
 * 
 * Location: assets/js/components/orchestrator-dashboard.js
 * Used by: Admin panels, developer tools
 * 
 * Phase 3.2: Performance dashboard implementation
 */

export class OrchestratorDashboard {
  constructor(/** @type {any} */ containerId = 'orchestrator-dashboard') {
    this.containerId = containerId;
    this.container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
    this.refreshIntervalMs = 5000; // Refresh every 5 seconds
    this.metricsHistory = [];
  }

  // ===== HTML RENDERING =====

  renderDashboard(/** @type {any} */ { agentOrch, providerOrch, logger }) {
    if (!this.container) return;

    const html = `
      <div class="orchestrator-dashboard" style="${this.getDashboardStyles()}">
        <div class="dashboard-header">
          <h2>🎼 EONAPP.CH Orchestrator Dashboard</h2>
          <div class="header-actions">
            <button onclick="location.reload()">🔄 Refresh</button>
            <button onclick="this.exportMetrics()">📊 Export</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- HEALTH STATUS OVERVIEW -->
          <div class="dashboard-card health-overview">
            ${this.renderHealthStatus(agentOrch, providerOrch, logger)}
          </div>

          <!-- PROVIDER STATUS -->
          <div class="dashboard-card provider-status">
            <h3>📡 Provider Status</h3>
            ${this.renderProviderStatus(providerOrch)}
          </div>

          <!-- REQUEST METRICS -->
          <div class="dashboard-card request-metrics">
            <h3>📈 Request Metrics (Last 1hr)</h3>
            ${this.renderRequestMetrics(logger)}
          </div>

          <!-- AGENT POLICY AUDIT LOG -->
          <div class="dashboard-card audit-log">
            <h3>🔐 Policy Audit Log</h3>
            ${this.renderAuditLog(logger)}
          </div>

          <!-- RATE LIMIT STATUS -->
          <div class="dashboard-card rate-limits">
            <h3>⏱️ Rate Limits (Current Hour)</h3>
            ${this.renderRateLimits(agentOrch)}
          </div>

          <!-- ERROR SUMMARY -->
          <div class="dashboard-card error-summary">
            <h3>❌ Errors (Last Hour)</h3>
            ${this.renderErrorSummary(logger)}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  escapeHtml(/** @type {any} */ value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  renderHealthStatus(/** @type {any} */ agentOrch, /** @type {any} */ providerOrch, /** @type {any} */ logger) {
    void agentOrch;
    void providerOrch;
    const metrics = logger ? logger.getMetrics(1000 * 60 * 60) : {};
    const successRate = parseFloat(metrics.successRate || '0');
    const avgLatency = parseInt(metrics.avgLatency || '0');
    
    let healthStatus = '🟢 HEALTHY';
    if (successRate < 95 || avgLatency > 2000) {
      healthStatus = '🟡 DEGRADED';
    }
    if (successRate < 80 || avgLatency > 5000) {
      healthStatus = '🔴 UNHEALTHY';
    }

    return `
      <div class="health-grid">
        <div class="health-item">
          <div class="health-label">Overall Status</div>
          <div class="health-value" style="font-size: 24px">${healthStatus}</div>
        </div>
          <div class="health-item">
            <div class="health-label">Success Rate (1hr)</div>
          <div class="health-value">${this.escapeHtml(metrics.successRate || 'N/A')}</div>
          </div>
          <div class="health-item">
            <div class="health-label">Avg Latency</div>
          <div class="health-value">${this.escapeHtml(metrics.avgLatency || 'N/A')}</div>
          </div>
          <div class="health-item">
            <div class="health-label">Total Requests</div>
          <div class="health-value">${this.escapeHtml(metrics.totalRequests || 0)}</div>
          </div>
        </div>
    `;
  }

  renderProviderStatus(/** @type {any} */ providerOrch) {
    if (!providerOrch) return '<p>Provider orchestrator not initialized</p>';

    const rankings = providerOrch.getProviderRankings();
    const active = providerOrch.activeProvider;

    const html = `
      <div class="provider-list">
        <div class="active-provider">
          <strong>Active:</strong> ${this.escapeHtml(active?.label || 'Unknown')} 
          <span class="provider-score">${(active?.score || 0).toFixed(3)}</span>
        </div>
        <table class="provider-table">
          <tr>
            <th>Provider</th>
            <th>Score</th>
            <th>Load</th>
            <th>Metrics</th>
          </tr>
          ${rankings.slice(0, 5).map((/** @type {any} */ p) => {
            const load = providerOrch.getCurrentLoad(p.id);
            return `
              <tr>
                <td>${this.escapeHtml(p.label)}</td>
                <td>${p.score.toFixed(3)}</td>
                <td>${load}/10</td>
                <td style="font-size: 12px">
                  ${p.metrics ? `Success: ${this.escapeHtml(p.metrics.successCount || 0)}` : 'N/A'}
                </td>
              </tr>
            `;
          }).join('')}
        </table>
      </div>
    `;

    return html;
  }

  renderRequestMetrics(/** @type {any} */ logger) {
    if (!logger) return '<p>Logger not initialized</p>';

    const metrics = logger.getMetrics(1000 * 60 * 60);
    const providerMetrics = metrics.providerMetrics || {};

    const html = `
      <div class="metrics-summary">
        <div class="metric-box">
          <span class="metric-label">Total Requests</span>
          <span class="metric-value">${metrics.totalRequests}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Success</span>
          <span class="metric-value" style="color: green">${metrics.successCount}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Failed</span>
          <span class="metric-value" style="color: red">${metrics.failureCount}</span>
        </div>
        <div class="metric-box">
          <span class="metric-label">Rejected</span>
          <span class="metric-value" style="color: orange">${metrics.rejectedCount}</span>
        </div>
      </div>
      <div class="provider-metrics">
        <h4>By Provider:</h4>
        <ul>
          ${Object.entries(providerMetrics).map((/** @type {any} */ [provider, m]) => `
            <li>${this.escapeHtml(provider)}: ${this.escapeHtml(m.count)} requests, ${this.escapeHtml(((m.successCount / m.count * 100) || 0).toFixed(0))}% success, ${this.escapeHtml(m.avgLatency?.toFixed(0) || 0)}ms avg</li>
          `).join('')}
        </ul>
      </div>
    `;

    return html;
  }

  renderAuditLog(/** @type {any} */ logger) {
    if (!logger) return '<p>Logger not initialized</p>';

    const logs = logger.getLogs(20, { level: 'INFO' });
    
    return `
      <div class="audit-table">
        <table>
          <tr>
            <th>Time</th>
            <th>Decision</th>
            <th>Outcome</th>
            <th>Provider</th>
            <th>Details</th>
          </tr>
          ${logs.map((/** @type {any} */ log) => `
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="font-size: 12px">${this.escapeHtml(new Date(log.timestamp).toLocaleTimeString())}</td>
              <td>${this.escapeHtml(log.decision)}</td>
              <td>${this.escapeHtml(log.outcome)}</td>
              <td>${this.escapeHtml(log.provider || '-')}</td>
              <td style="font-size: 12px">${this.escapeHtml(log.latency ? log.latency + 'ms' : '')}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  renderRateLimits(/** @type {any} */ agentOrch) {
    if (!agentOrch) return '<p>Agent orchestrator not initialized</p>';

    const limits = agentOrch.checkRateLimit('publish');
    const voiceLimits = agentOrch.checkRateLimit('voice');

    return `
      <div class="rate-limit-table">
        <table>
          <tr>
            <th>Action</th>
            <th>Used</th>
            <th>Limit</th>
            <th>Remaining</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Publish</td>
            <td>${limits.count}</td>
            <td>${limits.limit}</td>
            <td>${limits.remaining}</td>
            <td>${limits.allowed ? '✅ OK' : '🚫 Limited'}</td>
          </tr>
          <tr>
            <td>Voice</td>
            <td>${voiceLimits.count}</td>
            <td>${voiceLimits.limit}</td>
            <td>${voiceLimits.remaining}</td>
            <td>${voiceLimits.allowed ? '✅ OK' : '🚫 Limited'}</td>
          </tr>
        </table>
      </div>
    `;
  }

  renderErrorSummary(/** @type {any} */ logger) {
    if (!logger) return '<p>Logger not initialized</p>';

    const metrics = logger.getMetrics(1000 * 60 * 60);
    const errorsByCode = metrics.errorsByCode || {};

    if (Object.keys(errorsByCode).length === 0) {
      return '<p style="color: green">✅ No errors in the last hour</p>';
    }

    return `
      <div class="error-list">
        <ul>
          ${Object.entries(errorsByCode).map((/** @type {any} */ [code, count]) => `
            <li><strong>${code}</strong>: ${count} occurrences</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // ===== STYLES =====

  getDashboardStyles() {
    return `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    `;
  }

  getCardStyles() {
    return `
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
  }

  // ===== DATA EXPORT =====

  exportMetrics(/** @type {any} */ logger) {
    if (!logger) {
      alert('Logger not available');
      return;
    }

    logger.getMetrics(1000 * 60 * 60);
    const csv = logger.exportLogs('csv');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestrator-metrics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== AUTO-REFRESH =====

  startAutoRefresh(/** @type {any} */ { agentOrch, providerOrch, logger }) {
    this.refreshInterval = setInterval(() => {
      this.renderDashboard({ agentOrch, providerOrch, logger });
    }, this.refreshIntervalMs);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Helper: Create and mount dashboard
export function createOrchestratorDashboard(/** @type {any} */ { agentOrch, providerOrch, logger, containerId = 'orchestrator-dashboard', autoRefresh = true }) {
  const dashboard = new OrchestratorDashboard(containerId);
  dashboard.renderDashboard({ agentOrch, providerOrch, logger });
  
  if (autoRefresh) {
    dashboard.startAutoRefresh({ agentOrch, providerOrch, logger });
  }

  return dashboard;
}
