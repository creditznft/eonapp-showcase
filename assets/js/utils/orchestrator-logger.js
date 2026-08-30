/**
 * ORCHESTRATOR LOGGER
 * Structured JSON logging for all orchestrator decisions
 * 
 * Purpose:
 * - Centralized logging for agent-orchestrator, provider-orchestrator, request-orchestrator-bridge
 * - JSON-structured audit trail for all decisions
 * - Performance metrics tracking
 * - Analytics export capability
 * 
 * Location: assets/js/utils/orchestrator-logger.js
 * Used by: All orchestrator classes
 * 
 * Phase 3.1: Structured logging system implementation
 */

const LOGS_KEY = 'eon:orchestrator:logs:v1';

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

export class OrchestratorLogger {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.logs = this.loadLogs();
  }

  loadLogs() {
    try {
      const stored = JSON.parse(localStorage.getItem(LOGS_KEY) || '{}');
      return stored.logs || [];
    } catch {
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem(
        LOGS_KEY,
        JSON.stringify({ logs: this.logs.slice(-this.maxEntries) })
      );
    } catch {}
  }

  log(/** @type {any} */ {
    level = LogLevel.INFO,
    component = 'orchestrator',
    requestId = '',
    decision = '',
    provider = '',
    latency = 0,
    outcome = 'unknown',
    status = '',
    errorCode = '',
    errorMessage = '',
    metadata = {}
  }) {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      epochMs: Date.now(),
      level,
      component,
      requestId,
      decision,
      provider,
      latency,
      outcome, // success, rejected, failed, retrying, degraded
      status, // pending, executing, completed, blocked, rate_limited
      errorCode,
      errorMessage: errorMessage ? String(errorMessage).slice(0, 300) : '',
      ...metadata
    };

    this.logs.push(entry);
    this.saveLogs();

    // Also log to console for visibility
    this.consoleLog(entry);

    return entry;
  }

  generateId() {
    return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  consoleLog(/** @type {any} */ entry) {
    const icon = /** @type {Record<string, string>} */ ({
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌'
    })[entry.level] || '•';

    const msg = `${icon} [${entry.level}] ${entry.component}: ${entry.decision} → ${entry.outcome}`;
    const details = {
      requestId: entry.requestId,
      provider: entry.provider,
      latency: entry.latency ? `${entry.latency}ms` : undefined,
      status: entry.status,
      errorCode: entry.errorCode,
      ...entry.metadata
    };

    if (entry.level === LogLevel.ERROR) {
      console.error(msg, details);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(msg, details);
    } else if (entry.level === LogLevel.DEBUG) {
      console.debug(msg, details);
    } else {
      console.log(msg, details);
    }
  }

  // Convenience methods
  debug(/** @type {any} */ ctx) { return this.log({ ...ctx, level: LogLevel.DEBUG }); }
  info(/** @type {any} */ ctx) { return this.log({ ...ctx, level: LogLevel.INFO }); }
  warn(/** @type {any} */ ctx) { return this.log({ ...ctx, level: LogLevel.WARN }); }
  error(/** @type {any} */ ctx) { return this.log({ ...ctx, level: LogLevel.ERROR }); }

  // Logging for specific events
  logPolicyDecision(/** @type {any} */ { requestId, action, allowed, blocked, reason, rateLimit = null }) {
    return this.info({
      component: 'agent-orchestrator',
      requestId,
      decision: 'policy_evaluation',
      outcome: allowed ? 'allowed' : (blocked ? 'blocked' : 'pending_approval'),
      status: blocked ? 'blocked' : (allowed ? 'ready' : 'awaiting_approval'),
      errorCode: blocked ? 'POLICY_BLOCKED' : '',
      errorMessage: reason,
      metadata: {
        action,
        rateLimit: rateLimit ? `${rateLimit.count}/${rateLimit.limit}` : undefined
      }
    });
  }

  logProviderSelection(/** @type {any} */ { requestId, taskType, selectedProvider, ranking, latency }) {
    return this.info({
      component: 'provider-orchestrator',
      requestId,
      decision: 'provider_selection',
      provider: selectedProvider.id,
      outcome: 'selected',
      latency,
      metadata: {
        taskType,
        score: selectedProvider.score,
        ranking: ranking.slice(0, 3).map((/** @type {any} */ p) => `${p.id}(${p.score.toFixed(2)})`)
      }
    });
  }

  logRequestExecution(/** @type {any} */ { requestId, provider, startTimeMs, endTimeMs, success, errorCode = '', errorMessage = '' }) {
    const latency = endTimeMs - startTimeMs;
    return this[success ? 'info' : 'error']({
      component: 'request-orchestrator-bridge',
      requestId,
      decision: 'request_execution',
      provider,
      latency,
      outcome: success ? 'success' : 'failed',
      errorCode,
      errorMessage
    });
  }

  logRetry(/** @type {any} */ { requestId, step, retryCount, maxRetries, delayMs, reason }) {
    return this.warn({
      component: 'agent-orchestrator',
      requestId,
      decision: 'retry_scheduled',
      outcome: 'retrying',
      status: 'retrying',
      latency: delayMs,
      errorMessage: reason,
      metadata: {
        step,
        retryCount,
        maxRetries,
        nextRetryInMs: delayMs
      }
    });
  }

  logRateLimit(/** @type {any} */ { requestId, action, count, limit, resetAtMs }) {
    return this.warn({
      component: 'agent-orchestrator',
      requestId,
      decision: 'rate_limit_check',
      outcome: 'rejected',
      status: 'rate_limited',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorMessage: `Rate limit exceeded for action '${action}': ${count}/${limit}`,
      metadata: {
        action,
        count,
        limit,
        resetAtMs,
        resetInMs: Math.max(0, resetAtMs - Date.now())
      }
    });
  }

  logProviderFailover(/** @type {any} */ { requestId, fromProvider, toProvider, reason, latency }) {
    return this.warn({
      component: 'provider-orchestrator',
      requestId,
      decision: 'provider_failover',
      provider: toProvider,
      outcome: 'failover',
      latency,
      errorMessage: reason,
      metadata: {
        fromProvider,
        toProvider
      }
    });
  }

  logAdminOverride(/** @type {any} */ { requestId, jobId, approver, reason }) {
    return this.info({
      component: 'agent-orchestrator',
      requestId,
      decision: 'admin_override',
      outcome: 'override_applied',
      metadata: {
        jobId,
        approver,
        reason
      }
    });
  }

  // Query methods
  getLogs(/** @type {any} */ limit = 100, /** @type {any} */ filters = {}) {
    let results = this.logs.slice(-limit);

    if (filters.level) {
      results = results.filter((/** @type {any} */ log) => log.level === filters.level);
    }
    if (filters.component) {
      results = results.filter((/** @type {any} */ log) => log.component === filters.component);
    }
    if (filters.outcome) {
      results = results.filter((/** @type {any} */ log) => log.outcome === filters.outcome);
    }
    if (filters.requestId) {
      results = results.filter((/** @type {any} */ log) => log.requestId === filters.requestId);
    }

    return results.reverse(); // Most recent first
  }

  getLogsByComponent(/** @type {any} */ component, /** @type {any} */ limit = 50) {
    return this.getLogs(limit, { component });
  }

  getErrors(/** @type {any} */ limit = 50) {
    return this.getLogs(limit, { level: LogLevel.ERROR });
  }

  getWarnings(/** @type {any} */ limit = 50) {
    return this.getLogs(limit, { level: LogLevel.WARN });
  }

  // Analytics
  getMetrics(/** @type {any} */ windowMs = 1000 * 60 * 60) {
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = this.logs.filter((/** @type {any} */ log) => log.epochMs >= cutoff);

    const totalRequests = recent.length;
    const successCount = recent.filter((/** @type {any} */ log) => log.outcome === 'success').length;
    const failureCount = recent.filter((/** @type {any} */ log) => log.outcome === 'failed').length;
    const rejectedCount = recent.filter((/** @type {any} */ log) => log.outcome === 'rejected').length;
    const avgLatency = recent.length > 0
      ? recent.filter((/** @type {any} */ log) => log.latency > 0).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b.latency, 0) / recent.length
      : 0;

    /** @type {Record<string, number>} */
    const errorsByCode = {};
    recent.forEach((/** @type {any} */ log) => {
      if (log.errorCode) {
        errorsByCode[log.errorCode] = (errorsByCode[log.errorCode] || 0) + 1;
      }
    });

    /** @type {Record<string, { count: number, successCount: number, avgLatency: number, latencies: number[] }>} */
    const providerMetrics = {};
    recent.forEach((/** @type {any} */ log) => {
      if (log.provider) {
        if (!providerMetrics[log.provider]) {
          providerMetrics[log.provider] = { count: 0, successCount: 0, avgLatency: 0, latencies: [] };
        }
        providerMetrics[log.provider].count += 1;
        if (log.outcome === 'success') {
          providerMetrics[log.provider].successCount += 1;
        }
        if (log.latency > 0) {
          providerMetrics[log.provider].latencies.push(log.latency);
        }
      }
    });

    // Calculate provider averages
    Object.keys(providerMetrics).forEach((provider) => {
      const m = /** @type {any} */ (providerMetrics[provider]);
      if (m.latencies.length > 0) {
        m.avgLatency = m.latencies.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0) / m.latencies.length;
      }
      delete m.latencies; // Remove raw array
    });

    return {
      windowMs,
      timePeriod: `${(windowMs / 1000 / 60).toFixed(1)} minutes`,
      totalRequests,
      successCount,
      successRate: totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(2) + '%' : 'N/A',
      failureCount,
      failureRate: totalRequests > 0 ? ((failureCount / totalRequests) * 100).toFixed(2) + '%' : 'N/A',
      rejectedCount,
      rejectionRate: totalRequests > 0 ? ((rejectedCount / totalRequests) * 100).toFixed(2) + '%' : 'N/A',
      avgLatency: avgLatency.toFixed(0) + 'ms',
      errorsByCode,
      providerMetrics
    };
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  exportLogs(/** @type {any} */ format = 'json') {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'component', 'decision', 'outcome', 'provider', 'latency', 'errorCode'];
      const rows = this.logs.map((/** @type {any} */ log) =>
        headers.map((/** @type {any} */ h) => {
          const val = log[h];
          // CSV escape
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }).join(',')
      );
      return headers.join(',') + '\n' + rows.join('\n');
    }

    // Default: JSON
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
/** @type {OrchestratorLogger | null} */
let _logger = null;

export function getOrchestratorLogger() {
  if (!_logger) {
    _logger = new OrchestratorLogger(1000);
  }
  return _logger;
}
