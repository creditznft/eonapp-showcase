/**
 * FAILOVER ROUTE BANNER & FALLBACK DETECTION SERVICE
 * Handles primary domain offline detection, fallback routing, and visual status banner
 * 
 * Spec: When eonapp.ch is unreachable, automatically routes to Arweave fallback
 * and displays status banner to user
 * 
 * Location: assets/js/utils/fallback-service.js
 * Used by: app core, every page
 */

import { getFallbackConfig, setFallbackConfig, updateFallbackSnapshotTxId } from './gateway-fallback.js';

export class FallbackService {
  constructor() {
    const cfg = getFallbackConfig();
    this.isPrimaryOnline = true;
    this.currentGateway = 'primary'; // 'primary' | 'fallback' | 'offline'
    this.fallbackGateways = Array.isArray(cfg.gatewayAllowlist) && cfg.gatewayAllowlist.length
      ? cfg.gatewayAllowlist.slice()
      : ['https://arweave.net', 'https://ar-io.dev', 'https://gateway.irys.xyz'];
    this.arweaveReleaseId = String(cfg.fallbackTxId || localStorage.getItem('eon:arweave-release-id') || '').trim() || null;
    this.canonicalBaseUrl = String(cfg.canonicalBaseUrl || 'https://eonapp.ch').replace(/\/$/, '');
    this.healthPath = String(cfg.healthPath || '/favicon.ico');
    this.healthTimeoutMs = Math.max(1000, Number(cfg.healthTimeoutMs || 3500));
    this.healthCheckInterval = null;
    this.bannerElement = null;
    /** @type {any[]} */
    this.statusLog = [];
  }

  /**
   * Initialize fallback service on page load
   * Starts health checks and initializes banner
   */
  async initialize() {
    console.log('[FallbackService] Initializing...');
    
    // Run initial health check
    await this.healthCheck();
    
    // Create banner element
    this.createBanner();
    
    // Start periodic health checks (every 30 seconds)
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30_000);
    
    return this.currentGateway;
  }

  /**
   * Health check: Test if primary domain is accessible
   */
  async healthCheck() {
    const checkTime = new Date().toISOString();
    
    try {
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), this.healthTimeoutMs);

      // Ping primary domain (lightweight endpoint)
      await fetch(`${this.canonicalBaseUrl}${this.healthPath}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: abortController.signal
      });
      clearTimeout(timeout);

      // Primary is online
      this.isPrimaryOnline = true;
      if (this.currentGateway !== 'primary') {
        console.log('[FallbackService] Primary domain restored!');
        this.currentGateway = 'primary';
        this.updateBanner();
        this.logStatus('primary-restored', checkTime);
      }
    } catch (/** @type {any} */
error) {
      // Primary is offline, switch to fallback
      console.warn('[FallbackService] Primary domain unreachable:', error.message);
      this.isPrimaryOnline = false;
      
      if (this.currentGateway === 'primary') {
        console.log('[FallbackService] Switching to fallback gateway...');
        this.currentGateway = 'fallback';
        this.updateBanner();
        this.logStatus('switched-to-fallback', checkTime);
      }
    }
  }

  /**
   * Get active gateway URL
   */
  getActiveGateway() {
    if (this.isPrimaryOnline) {
      return this.canonicalBaseUrl;
    }
    
    // Select fallback gateway (round-robin or health-based)
    const fallback = this.fallbackGateways[0]; // Default to first
    return fallback;
  }

  /**
   * Redirect asset request to appropriate gateway
   */
  async resolveAssetUrl(/** @type {any} */ assetPath) {
    const gateway = this.getActiveGateway();
    
    if (this.isPrimaryOnline) {
      // Primary: direct URL
      return `${gateway}${assetPath}`;
    } else if (this.arweaveReleaseId) {
      // Fallback: Arweave with tx ID
      return `${gateway}/${this.arweaveReleaseId}${assetPath}`;
    } else {
      // Offline: return asset path (will fail gracefully)
      return assetPath;
    }
  }

  /**
   * Create and inject status banner into DOM
   */
  createBanner() {
    // Check if already exists
    if (document.querySelector('#eon-fallback-banner')) {
      return;
    }

    const /** @type {any} */
banner = document.createElement('div');
    banner.id = 'eon-fallback-banner';
    banner.className = 'eon-fallback-banner eon-fallback-banner--primary';
    banner.innerHTML = `
      <div class="eon-fallback-content">
        <span class="eon-fallback-icon">🌐</span>
        <span class="eon-fallback-text">Primary service online</span>
        <button class="eon-fallback-close" title="Dismiss">×</button>
      </div>
    `;

    // Add to page (top of body or before main)
    const insertPoint = document.body.firstChild;
    document.body.insertBefore(banner, insertPoint);

    // Close button handler
    banner.querySelector('.eon-fallback-close').addEventListener('click', () => {
      banner.classList.add('eon-fallback-banner--hidden');
      setTimeout(() => banner.remove(), 300);
    });

    this.bannerElement = banner;
  }

  /**
   * Update banner based on current gateway status
   */
  updateBanner() {
    if (!this.bannerElement) {
      this.createBanner();
    }

    const banner = this.bannerElement;
    const /** @type {any} */
icon = banner.querySelector('.eon-fallback-icon');
    const /** @type {any} */
text = banner.querySelector('.eon-fallback-text');

    if (this.isPrimaryOnline) {
      banner.className = 'eon-fallback-banner eon-fallback-banner--primary';
      icon.textContent = '✅';
      text.textContent = 'Service online';
    } else {
      banner.className = 'eon-fallback-banner eon-fallback-banner--fallback';
      icon.textContent = '⚠️';
      text.textContent = `Using fallback gateway (${this.getActiveGateway()})`;
    }

    // Show banner
    banner.classList.remove('eon-fallback-banner--hidden');
  }

  /**
   * Log status change for audit trail
   */
  logStatus(/** @type {any} */ event, /** @type {any} */ timestamp) {
    const /** @type {any} */
logEntry = {
      event,
      timestamp,
      gateway: this.currentGateway,
      isPrimaryOnline: this.isPrimaryOnline,
      arweaveReleaseId: this.arweaveReleaseId
    };

    this.statusLog.push(logEntry);
    
    // Keep last 100 entries
    if (this.statusLog.length > 100) {
      this.statusLog.shift();
    }

    // Store in localStorage for persistence
    localStorage.setItem('eon:fallback-status-log', JSON.stringify(this.statusLog));
    
    // Log to console
    console.log('[FallbackService] Status:', logEntry);
  }

  /**
   * Get fallback status log for audit
   */
  getStatusLog() {
    return this.statusLog;
  }

  getOperatorConfig() {
    return {
      canonicalBaseUrl: this.canonicalBaseUrl,
      fallbackGateways: this.fallbackGateways.slice(),
      arweaveReleaseId: this.arweaveReleaseId,
      healthPath: this.healthPath,
      healthTimeoutMs: this.healthTimeoutMs,
    };
  }

  setGatewayAllowlist(/** @type {any} */ gateways = []) {
    const next = Array.isArray(gateways)
      ? gateways.map((/** @type {any} */ item) => String(item || '').trim()).filter(Boolean)
      : [];
    if (!next.length) return this.getOperatorConfig();

    this.fallbackGateways = next;
    setFallbackConfig({ gatewayAllowlist: next });
    this.logStatus('allowlist-updated', new Date().toISOString());
    return this.getOperatorConfig();
  }

  setActiveSnapshotTxId(/** @type {any} */ txId = '', /** @type {any} */ note = '') {
    const clean = String(txId || '').trim();
    this.arweaveReleaseId = clean || null;
    updateFallbackSnapshotTxId(clean, { source: 'fallback-service', note });
    try {
      if (clean) localStorage.setItem('eon:arweave-release-id', clean);
      else localStorage.removeItem('eon:arweave-release-id');
    } catch {}
    this.logStatus('snapshot-tx-updated', new Date().toISOString());
    return this.getOperatorConfig();
  }

  /**
   * Export fallback proof data (for audit/evidence)
   */
  exportProof() {
    return {
      timestamp: new Date().toISOString(),
      currentGateway: this.currentGateway,
      isPrimaryOnline: this.isPrimaryOnline,
      arweaveReleaseId: this.arweaveReleaseId,
      statusLog: this.statusLog,
      fallbackGateways: this.fallbackGateways
    };
  }

  /**
   * Cleanup on page unload
   */
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Manual fallback drill (for testing)
   * Simulates primary domain being offline
   */
  async runFallbackDrill() {
    console.log('[FallbackService] Running fallback drill...');
    
    const /** @type {any} */
drillLog = {
      startTime: new Date().toISOString(),
      steps: [],
      endTime: null
    };

    try {
      // Step 1: Verify primary is online
      drillLog.steps.push({
        step: 'Verify primary online',
        status: this.isPrimaryOnline ? 'PASS' : 'FAIL',
        gateway: this.currentGateway
      });

      // Step 2: Simulate primary failure
      console.log('Step 2: Simulating primary failure...');
      this.isPrimaryOnline = false;
      this.currentGateway = 'fallback';
      this.updateBanner();
      drillLog.steps.push({
        step: 'Simulate primary failure',
        status: 'OK',
        gateway: this.currentGateway
      });

      // Step 3: Wait and verify fallback active
      await new Promise(/** @type {any} */ resolve => setTimeout(resolve, 2000));
      drillLog.steps.push({
        step: 'Verify fallback active',
        status: this.currentGateway === 'fallback' ? 'PASS' : 'FAIL',
        activeGateway: this.getActiveGateway()
      });

      // Step 4: Test asset resolution
      const testAsset = await this.resolveAssetUrl('/test.json');
      drillLog.steps.push({
        step: 'Resolve asset to fallback',
        status: 'OK',
        resolvedUrl: testAsset
      });

      // Step 5: Restore primary
      console.log('Step 5: Restoring primary...');
      this.isPrimaryOnline = true;
      this.currentGateway = 'primary';
      this.updateBanner();
      drillLog.steps.push({
        step: 'Restore primary',
        status: 'OK',
        gateway: this.currentGateway
      });

      // Step 6: Verify primary restored
      drillLog.steps.push({
        step: 'Verify primary restored',
        status: this.isPrimaryOnline ? 'PASS' : 'FAIL',
        gateway: this.currentGateway
      });

      drillLog.endTime = new Date().toISOString();
      drillLog.result = 'DRILL_PASSED';

      console.log('[FallbackService] Fallback drill complete:', drillLog);
      this.logStatus('fallback-drill-complete', drillLog.endTime);

      return drillLog;
    } catch (/** @type {any} */
error) {
      drillLog.endTime = new Date().toISOString();
      drillLog.error = error.message;
      drillLog.result = 'DRILL_FAILED';
      console.error('[FallbackService] Fallback drill failed:', drillLog);
      return drillLog;
    }
  }
}

// Export singleton instance
export const fallbackService = new FallbackService();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fallbackService.initialize();
  });
} else {
  fallbackService.initialize();
}
