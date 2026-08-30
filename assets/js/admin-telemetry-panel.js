import { getAIArtifactTelemetryReport } from './utils/ai-artifact-analytics.js';
import { getMarketplaceReferralAnalyticsReport } from './utils/marketplace-referral-analytics.js';
import { getFallbackConfig, setFallbackConfig, updateFallbackSnapshotTxId, getFallbackReleaseRegistry, checkRouteHealth, getRouteHealth } from './utils/gateway-fallback.js';
import { fallbackService } from './utils/fallback-service.js';

function byCountDesc(/** @type {any} */ entries) {
  return entries.sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]);
}

function renderList(/** @type {any} */ target, /** @type {any} */ map) {
  if (!target) return;
  const entries = byCountDesc(Object.entries(map || {}));
  target.innerHTML = entries.length
    ? entries.map((/** @type {any} */ [key, count]) => `<li>${key}: ${count}</li>`).join('')
    : '<li>No data yet</li>';
}

function renderLatestRows(/** @type {any} */ target, /** @type {any} */ rows) {
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.slice(0, 30).map((/** @type {any} */ row) => `
      <tr>
        <td>${new Date(row.ts).toLocaleString()}</td>
        <td>${row.surface || 'unknown'}</td>
        <td>${row.artifactType || 'unknown'}</td>
        <td>${row.providerId || 'unknown'}</td>
        <td>${row.model || '-'}</td>
        <td>${Number(row.outputLength || 0)}</td>
      </tr>`).join('')
    : '<tr><td colspan="6">No telemetry events captured yet.</td></tr>';
}

function isValidGatewayUrl(/** @type {any} */ urlLike) {
  try {
    const parsed = new URL(String(urlLike || '').trim());
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function downloadJsonFile(/** @type {any} */ filename, /** @type {any} */ payload) {
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const /** @type {any} */
a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {}
}

function setFallbackOpsStatus(/** @type {any} */ message, /** @type {any} */ ok = true) {
  const /** @type {any} */
el = document.getElementById('admin-fallback-status');
  if (!el) return;
  el.textContent = String(message || '');
  el.style.color = ok ? '#86efac' : '#fca5a5';
}

function renderTelemetryPanel() {
  const report = getAIArtifactTelemetryReport();
  const /** @type {any} */
totalEl = document.getElementById('admin-telemetry-total');
  if (totalEl) totalEl.textContent = String(report.total || 0);
  renderList(document.getElementById('admin-telemetry-providers'), report.byProvider || {});
  renderList(document.getElementById('admin-telemetry-types'), report.byType || {});
  renderLatestRows(document.getElementById('admin-telemetry-latest'), Array.isArray(report.latest) ? report.latest : []);
}

function ensureOpsControls() {
  const /** @type {any} */
host = document.querySelector('main.wrap section.grid');
  if (!host || document.getElementById('admin-referral-ops-card')) return;

  const /** @type {any} */
card = document.createElement('article');
  card.className = 'card';
  card.id = 'admin-referral-ops-card';
  card.innerHTML = `
    <h2>Marketplace Referral + Route Ops</h2>
    <p class="hint">Listing-level referral conversion and fallback gateway operator controls.</p>
    <div class="buttons" style="margin-bottom:10px">
      <button id="admin-referral-refresh" class="btn-ghost">Refresh Referral Report</button>
    </div>
    <div class="telemetry-grid">
      <div class="telemetry-box"><h3>Total Referral Events</h3><div id="admin-referral-total">0</div></div>
      <div class="telemetry-box"><h3>Top Route Modes</h3><ul id="admin-referral-routes"></ul></div>
      <div class="telemetry-box"><h3>Top Referrers</h3><ul id="admin-referral-referrers"></ul></div>
    </div>
    <table class="telemetry-latest" aria-label="Top listing referral conversion rows">
      <thead><tr><th>Listing</th><th>Views</th><th>Purchases</th><th>Conv %</th><th>Revenue</th></tr></thead>
      <tbody id="admin-referral-listings"></tbody>
    </table>

    <h3 style="margin-top:16px">Fallback Route Operator Controls</h3>
    <div class="row">
      <div class="col-8">
        <label for="admin-fallback-gateways">Gateway allowlist (one URL per line)</label>
        <textarea id="admin-fallback-gateways" style="min-height:110px"></textarea>
        <label for="admin-fallback-heartbeats" style="margin-top:8px">Primary heartbeat paths (one per line)</label>
        <textarea id="admin-fallback-heartbeats" style="min-height:90px" placeholder="/healthz\n/robots.txt\n/favicon.ico"></textarea>
      </div>
      <div class="col-4">
        <label for="admin-fallback-txid">Active snapshot Tx ID</label>
        <input id="admin-fallback-txid" type="text" placeholder="Arweave tx id" />
        <label for="admin-fallback-timeout" style="margin-top:8px">Health timeout (ms)</label>
        <input id="admin-fallback-timeout" type="number" min="1000" step="100" />
        <label for="admin-fallback-note" style="margin-top:8px">Change note</label>
        <input id="admin-fallback-note" type="text" placeholder="optional note" />
      </div>
    </div>
    <div class="buttons">
      <button id="admin-fallback-save" class="btn-primary">Save Fallback Config</button>
      <button id="admin-fallback-reload" class="btn-ghost">Reload Current Config</button>
      <button id="admin-fallback-health-now" class="btn-ghost">Check Route Health Now</button>
      <button id="admin-fallback-run-drill" class="btn-ghost">Run Fallback Drill</button>
      <button id="admin-fallback-export-proof" class="btn-ghost">Export Route Proof JSON</button>
    </div>
    <p id="admin-fallback-status" class="hint" aria-live="polite"></p>
    <pre id="admin-fallback-registry"></pre>
  `;

  host.appendChild(card);
}

function renderSimpleList(/** @type {any} */ target, /** @type {any} */ entries, /** @type {any} */ formatter) {
  if (!target) return;
  target.innerHTML = entries.length
    ? entries.map((/** @type {any} */ entry) => `<li>${formatter(entry)}</li>`).join('')
    : '<li>No data yet</li>';
}

function renderReferralReport() {
  const report = getMarketplaceReferralAnalyticsReport();
  const /** @type {any} */
totalEl = document.getElementById('admin-referral-total');
  if (totalEl) totalEl.textContent = String(report.totalEvents || 0);

  const routeEntries = Object.entries(report.byRouteMode || {}).sort((/** @type {any} */ a, /** @type {any} */ b) => Number(b[1].purchases || 0) - Number(a[1].purchases || 0));
  renderSimpleList(document.getElementById('admin-referral-routes'), routeEntries.slice(0, 6), (/** @type {any} */ [mode, row]) => {
    const views = Number(row.views || 0);
    const purchases = Number(row.purchases || 0);
    const conv = Number(row.conversionRate || 0).toFixed(2);
    return `${mode}: ${purchases}/${views} (${conv}%)`;
  });

  const referrerEntries = Object.entries(report.byReferrer || {}).sort((/** @type {any} */ a, /** @type {any} */ b) => Number(b[1].revenueUsdt || 0) - Number(a[1].revenueUsdt || 0));
  renderSimpleList(document.getElementById('admin-referral-referrers'), referrerEntries.slice(0, 6), (/** @type {any} */ [id, row]) => {
    const idShort = id.length > 14 ? `${id.slice(0, 14)}...` : id;
    return `${idShort}: ${Number(row.purchases || 0)} buys · $${Number(row.revenueUsdt || 0).toFixed(2)}`;
  });

  const /** @type {any} */
listingBody = document.getElementById('admin-referral-listings');
  if (listingBody) {
    const topListings = Array.isArray(report.listings) ? report.listings.slice(0, 30) : [];
    listingBody.innerHTML = topListings.length
      ? topListings.map((/** @type {any} */ row) => `
        <tr>
          <td>${row.listingId}</td>
          <td>${Number(row.views || 0)}</td>
          <td>${Number(row.purchases || 0)}</td>
          <td>${Number(row.conversionRate || 0).toFixed(2)}%</td>
          <td>$${Number(row.revenueUsdt || 0).toFixed(2)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="5">No listing referral analytics yet.</td></tr>';
  }
}

function renderFallbackOps() {
  const config = getFallbackConfig();
  const gatewayInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('admin-fallback-gateways'));
  const heartbeatInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('admin-fallback-heartbeats'));
  const txInput = /** @type {HTMLInputElement|null} */ (document.getElementById('admin-fallback-txid'));
  const timeoutInput = /** @type {HTMLInputElement|null} */ (document.getElementById('admin-fallback-timeout'));
  const /** @type {any} */
registryOut = document.getElementById('admin-fallback-registry');

  if (gatewayInput) gatewayInput.value = (config.gatewayAllowlist || []).join('\n');
  if (heartbeatInput) heartbeatInput.value = (config.primaryHeartbeatPaths || []).join('\n');
  if (txInput) txInput.value = String(config.fallbackTxId || '');
  if (timeoutInput) timeoutInput.value = String(Number(config.healthTimeoutMs || 3500));

  if (registryOut) {
    const registry = getFallbackReleaseRegistry();
    registryOut.textContent = JSON.stringify({
      activeTxId: config.fallbackTxId || '',
      canonicalBaseUrl: config.canonicalBaseUrl,
      fallbackSnapshotBaseUrl: config.fallbackSnapshotBaseUrl,
      primaryHeartbeatPaths: config.primaryHeartbeatPaths || [],
      healthTimeoutMs: Number(config.healthTimeoutMs || 3500),
      history: registry.slice(0, 20)
    }, null, 2);
  }
}

function bindOpsActions() {
  document.getElementById('admin-referral-refresh')?.addEventListener('click', renderReferralReport);
  document.getElementById('admin-fallback-reload')?.addEventListener('click', renderFallbackOps);
  document.getElementById('admin-fallback-health-now')?.addEventListener('click', async () => {
    setFallbackOpsStatus('Running route health checks...', true);
    const health = await checkRouteHealth();
    setFallbackOpsStatus(`Health check done: ${health.primaryHealthy ? 'primary online' : 'fallback mode'}${health.healthyGateway ? ` via ${health.healthyGateway}` : ''}.`, true);
    renderFallbackOps();
  });
  document.getElementById('admin-fallback-run-drill')?.addEventListener('click', async () => {
    setFallbackOpsStatus('Running fallback drill...', true);
    const drill = await fallbackService.runFallbackDrill();
    const ok = String(drill?.result || '').toUpperCase() === 'DRILL_PASSED';
    setFallbackOpsStatus(ok ? 'Fallback drill passed. Export proof JSON for evidence pack.' : 'Fallback drill failed. Export report and inspect logs.', ok);
  });
  document.getElementById('admin-fallback-export-proof')?.addEventListener('click', async () => {
    const cfg = getFallbackConfig();
    const health = await getRouteHealth({ maxAgeMs: 30 * 1000 });
    const /** @type {any} */
payload = {
      exportedAt: new Date().toISOString(),
      fallbackConfig: cfg,
      routeHealth: health,
      releaseRegistry: getFallbackReleaseRegistry().slice(0, 50),
      serviceProof: fallbackService.exportProof()
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJsonFile(`fallback-proof-${stamp}.json`, payload);
    setFallbackOpsStatus('Exported fallback proof JSON.', true);
  });
  document.getElementById('admin-fallback-save')?.addEventListener('click', () => {
    const gatewayInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('admin-fallback-gateways'));
    const heartbeatInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('admin-fallback-heartbeats'));
    const txInput = /** @type {HTMLInputElement|null} */ (document.getElementById('admin-fallback-txid'));
    const timeoutInput = /** @type {HTMLInputElement|null} */ (document.getElementById('admin-fallback-timeout'));
    const noteInput = /** @type {HTMLInputElement|null} */ (document.getElementById('admin-fallback-note'));

    const gatewayAllowlist = String(gatewayInput?.value || '')
      .split(/\r?\n/)
      .map((/** @type {any} */ line) => line.trim())
      .filter(Boolean);

    const primaryHeartbeatPaths = String(heartbeatInput?.value || '')
      .split(/\r?\n/)
      .map((/** @type {any} */ line) => line.trim())
      .filter(Boolean)
      .map((/** @type {any} */ line) => line.startsWith('/') ? line : `/${line}`)
      .slice(0, 8);

    const timeoutMs = Math.max(1000, Number(timeoutInput?.value || 3500));

    const invalidGateways = gatewayAllowlist.filter((/** @type {any} */ line) => !isValidGatewayUrl(line));
    if (invalidGateways.length) {
      setFallbackOpsStatus(`Invalid gateway URL(s): ${invalidGateways.join(', ')}`, false);
      return;
    }

    const txId = String(txInput?.value || '').trim();
    const note = String(noteInput?.value || '').trim();

    if (!gatewayAllowlist.length) {
      setFallbackOpsStatus('Gateway allowlist is empty. Keeping existing gateways and applying snapshot update only.', false);
      setFallbackConfig({ primaryHeartbeatPaths, healthTimeoutMs: timeoutMs });
      if (txId) {
        updateFallbackSnapshotTxId(txId, {
          source: 'admin-console',
          note
        });
        renderFallbackOps();
      }
      return;
    }

    setFallbackConfig({ gatewayAllowlist, primaryHeartbeatPaths, healthTimeoutMs: timeoutMs });
    updateFallbackSnapshotTxId(txId, {
      source: 'admin-console',
      note
    });
    renderFallbackOps();
    setFallbackOpsStatus(`Saved fallback config (${gatewayAllowlist.length} gateways, ${primaryHeartbeatPaths.length || 0} heartbeat paths${txId ? ', snapshot updated' : ''}).`, true);
  });
}

if (window.__EON_ADMIN_GATED__ !== false) {
  document.getElementById('admin-telemetry-refresh')?.addEventListener('click', renderTelemetryPanel);
  renderTelemetryPanel();
  ensureOpsControls();
  renderReferralReport();
  renderFallbackOps();
  bindOpsActions();
}
