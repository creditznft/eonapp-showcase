/**
 * KPI Metrics Engine
 * 
 * Real-time computation of retention, conversion, engagement, and growth metrics.
 * Powers the KPI dashboard and admin oversight.
 * 
 * Metrics Domains:
 * - User Retention (DAU, WAU, MAU, churn)
 * - Conversion Funnels (signup → first action → recurring)
 * - Task/Mission Completion (velocity, success rate)
 * - Creator Output (publish rate, reach, monetization)
 * - Trading Activity (paper/live execution, accuracy)
 * - Viral Growth (share, referral, acquisition)
 */

class KPIMetricsEngine {
  constructor() {
    this.storageKey = 'kpi-metrics-v5';
    this.metricsKey = `${this.storageKey}:data`;
    this.eventsKey = `${this.storageKey}:events`;
    this.cohortKey = `${this.storageKey}:cohorts`;
    this.refreshIntervalMs = 60000; // 1 minute refresh
    this.metrics = /** @type {any} */ ({});
    this.events = /** @type {any[]} */ ([]);
    this.cohorts = /** @type {Record<string, any>} */ ({});
    this.init();
  }

  init() {
    this.loadMetrics();
    this.computeAllMetrics();
    this.startAutoRefresh();
  }

  loadMetrics() {
    try {
      this.metrics = JSON.parse(localStorage.getItem(this.metricsKey) || '{}') || this.getDefaultMetrics();
      this.events = JSON.parse(localStorage.getItem(this.eventsKey) || '[]') || [];
      this.cohorts = JSON.parse(localStorage.getItem(this.cohortKey) || '{}') || {};
    } catch (/** @type {any} */
e) {
      console.warn('[KPI] Failed to load metrics from storage:', e);
      this.metrics = this.getDefaultMetrics();
      this.events = [];
      this.cohorts = {};
    }
  }

  saveMetrics() {
    try {
      localStorage.setItem(this.metricsKey, JSON.stringify(this.metrics));
      localStorage.setItem(this.eventsKey, JSON.stringify(this.events));
      localStorage.setItem(this.cohortKey, JSON.stringify(this.cohorts));
    } catch (/** @type {any} */
e) {
      console.warn('[KPI] Failed to save metrics:', e);
    }
  }

  getDefaultMetrics() {
    const now = Date.now();
    return {
      lastUpdate: now,
      day: {
        dau: 0,
        activeUsers: [],
        sessions: 0,
        avgSessionDuration: 0,
      },
      week: {
        wau: 0,
        newUsers: 0,
        churnedUsers: 0,
      },
      month: {
        mau: 0,
        totalUsers: 0,
        retentionRate: 0,
      },
      conversion: {
        signupToFirstAction: 0,
        firstActionToRecurring: 0,
        recurringToMonetized: 0,
        overall: 0,
      },
      missions: {
        completedToday: 0,
        completedThisWeek: 0,
        avgCompletionTime: 0,
        successRate: 0,
      },
      creator: {
        publishes24h: 0,
        publishesWeek: 0,
        avgReach: 0,
        monetizedPosts: 0,
      },
      trading: {
        paperTradesActive: 0,
        liveTradesActive: 0,
        paperTradeAccuracy: 0,
        profitFactor: 0,
      },
      growth: {
        shareCount: 0,
        referralSignups: 0,
        referralValue: 0,
        viralCoefficient: 0,
      },
      health: {
        errorRate: 0,
        aiProviderFallbacks: 0,
        userSatisfaction: 0,
      },
    };
  }

  // ============ Retention Metrics ============

  recordUserSession(/** @type {any} */ userId, /** @type {any} */ durationMs) {
    const now = Date.now();

    // Track DAU
    if (!this.metrics.day.activeUsers.includes(userId)) {
      this.metrics.day.activeUsers.push(userId);
    }

    // Track session
    this.metrics.day.sessions++;
    if (this.metrics.day.avgSessionDuration === 0) {
      this.metrics.day.avgSessionDuration = durationMs;
    } else {
      this.metrics.day.avgSessionDuration =
        (this.metrics.day.avgSessionDuration + durationMs) / 2;
    }

    // Track user lifetime
    if (!this.cohorts[userId]) {
      this.cohorts[userId] = {
        firstSeen: now,
        lastSeen: now,
        sessionCount: 1,
        totalDurationMs: durationMs,
        status: 'active', // active, churned, resurrected
      };
    } else {
      this.cohorts[userId].lastSeen = now;
      this.cohorts[userId].sessionCount++;
      this.cohorts[userId].totalDurationMs += durationMs;
    }

    this.recordEvent({
      type: 'session',
      userId,
      durationMs,
      timestamp: now,
    });
  }

  computeRetentionMetrics() {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // DAU: users active in last 24h
    this.metrics.day.dau = this.metrics.day.activeUsers.length;

    // WAU: unique users in last 7 days
    const activeLastWeek = /** @type {Set<any>} */ (new Set());
    Object.entries(this.cohorts).forEach((/** @type {any} */ [userId, cohort]) => {
      if (cohort.lastSeen > weekAgo && cohort.status === 'active') {
        activeLastWeek.add(userId);
      }
    });
    this.metrics.week.wau = activeLastWeek.size;

    // MAU: unique users in last 30 days
    const activeLastMonth = /** @type {Set<any>} */ (new Set());
    Object.entries(this.cohorts).forEach((/** @type {any} */ [userId, cohort]) => {
      if (cohort.lastSeen > monthAgo && cohort.status === 'active') {
        activeLastMonth.add(userId);
      }
    });
    this.metrics.month.mau = activeLastMonth.size;

    // Total users
    this.metrics.month.totalUsers = Object.keys(this.cohorts).length;

    // Retention rate: users from 30 days ago still active
    const usersMonth1 = Object.entries(this.cohorts).filter(
      (/** @type {any} */ [_, cohort]) => cohort.firstSeen <= monthAgo
    ).length;
    const retainedUsers = Object.entries(this.cohorts).filter(
      (/** @type {any} */ [_, cohort]) => cohort.firstSeen <= monthAgo && cohort.lastSeen > now - 48 * 60 * 60 * 1000
    ).length;
    this.metrics.month.retentionRate =
      usersMonth1 > 0 ? Math.round((retainedUsers / usersMonth1) * 100) : 0;

    // Churn
    const churned = Object.entries(this.cohorts).filter(
      (/** @type {any} */ [_, cohort]) => cohort.lastSeen < now - 14 * 24 * 60 * 60 * 1000 && cohort.status === 'active'
    ).length;
    Object.entries(this.cohorts).forEach((/** @type {any} */ [userId, cohort]) => {
      if (cohort.lastSeen < now - 14 * 24 * 60 * 60 * 1000 && cohort.status === 'active') {
        this.cohorts[userId].status = 'churned';
      }
    });
    this.metrics.week.churnedUsers = churned;

    // New users this week
    const newThisWeek = Object.entries(this.cohorts).filter(
      (/** @type {any} */ [_, cohort]) => cohort.firstSeen > weekAgo
    ).length;
    this.metrics.week.newUsers = newThisWeek;
  }

  // ============ Conversion Metrics ============

  recordUserAction(/** @type {any} */ userId, /** @type {any} */ actionType, /** @type {any} */ metadata = {}) {
    this.recordEvent({
      type: 'action',
      userId,
      actionType,
      metadata,
      timestamp: Date.now(),
    });
  }

  computeConversionMetrics() {
    // Signup to first action: users who signed up and took any action
    const allEvents = this.events;
    const signupUsers = /** @type {Set<any>} */ (new Set());
    const firstActionUsers = /** @type {Set<any>} */ (new Set());

    allEvents.forEach((/** @type {any} */ event) => {
      if (event.type === 'action' && event.actionType === 'signup') {
        signupUsers.add(event.userId);
      }
      if (
        event.type === 'action' &&
        ['publish', 'task_complete', 'trade_open', 'chat'].includes(event.actionType)
      ) {
        firstActionUsers.add(event.userId);
      }
    });

    this.metrics.conversion.signupToFirstAction =
      signupUsers.size > 0
        ? Math.round(((firstActionUsers.size / signupUsers.size) * 100))
        : 0;

    // First action to recurring: users with 2+ sessions/actions
    const recurringUsers = Object.entries(this.cohorts).filter(
      (/** @type {any} */ [_, cohort]) => cohort.sessionCount >= 2
    ).length;
    this.metrics.conversion.firstActionToRecurring =
      firstActionUsers.size > 0
        ? Math.round((recurringUsers / firstActionUsers.size) * 100)
        : 0;

    // Recurring to monetized (traded, published, bought premium)
    const monetizedUsers = allEvents
      .filter(
        (/** @type {any} */ e) =>
          e.type === 'action' &&
          ['buy_premium', 'trade_live', 'nft_mint', 'creator_monetize'].includes(
            e.actionType
          )
      )
      .map((/** @type {any} */ e) => e.userId);
    const uniqueMonetized = /** @type {Set<any>} */ (new Set(monetizedUsers));
    this.metrics.conversion.recurringToMonetized =
      recurringUsers > 0
        ? Math.round((uniqueMonetized.size / recurringUsers) * 100)
        : 0;

    // Overall: signup → monetized
    this.metrics.conversion.overall =
      signupUsers.size > 0
        ? Math.round((uniqueMonetized.size / signupUsers.size) * 100)
        : 0;
  }

  // ============ Mission/Task Metrics ============

  recordMissionComplete(/** @type {any} */ userId, /** @type {any} */ missionId, /** @type {any} */ durationMs, /** @type {any} */ success = true) {
    this.recordEvent({
      type: 'mission',
      userId,
      missionId,
      durationMs,
      success,
      timestamp: Date.now(),
    });
  }

  computeMissionMetrics() {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const missionEvents = this.events.filter((/** @type {any} */ e) => e.type === 'mission');

    // Completed today
    const completedToday = missionEvents.filter((/** @type {any} */ e) => e.timestamp > dayAgo).length;
    this.metrics.missions.completedToday = completedToday;

    // Completed this week
    const completedWeek = missionEvents.filter((/** @type {any} */ e) => e.timestamp > weekAgo).length;
    this.metrics.missions.completedThisWeek = completedWeek;

    // Average completion time
    const totalDuration = missionEvents.reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + (e.durationMs || 0), 0);
    this.metrics.missions.avgCompletionTime =
      missionEvents.length > 0 ? Math.round(totalDuration / missionEvents.length / 1000) : 0;

    // Success rate
    const successful = missionEvents.filter((/** @type {any} */ e) => e.success).length;
    this.metrics.missions.successRate =
      missionEvents.length > 0 ? Math.round((successful / missionEvents.length) * 100) : 0;
  }

  // ============ Creator Metrics ============

  recordCreatorPublish(/** @type {any} */ userId, /** @type {any} */ postId, /** @type {any} */ reach = 0, /** @type {any} */ monetized = false) {
    this.recordEvent({
      type: 'creator_publish',
      userId,
      postId,
      reach,
      monetized,
      timestamp: Date.now(),
    });
  }

  computeCreatorMetrics() {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const creatorEvents = this.events.filter((/** @type {any} */ e) => e.type === 'creator_publish');

    // Publishes
    const publishes24h = creatorEvents.filter((/** @type {any} */ e) => e.timestamp > dayAgo).length;
    this.metrics.creator.publishes24h = publishes24h;

    const publishesWeek = creatorEvents.filter((/** @type {any} */ e) => e.timestamp > weekAgo).length;
    this.metrics.creator.publishesWeek = publishesWeek;

    // Average reach
    const totalReach = creatorEvents.reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + (e.reach || 0), 0);
    this.metrics.creator.avgReach =
      creatorEvents.length > 0 ? Math.round(totalReach / creatorEvents.length) : 0;

    // Monetized posts
    const monetized = creatorEvents.filter((/** @type {any} */ e) => e.monetized).length;
    this.metrics.creator.monetizedPosts = monetized;
  }

  // ============ Trading Metrics ============

  recordTradingEvent(/** @type {any} */ userId, /** @type {any} */ tradeId, /** @type {any} */ type, /** @type {any} */ pnl = 0, /** @type {any} */ accuracy = 0) {
    this.recordEvent({
      type: 'trading',
      userId,
      tradeId,
      tradeType: type, // 'paper' | 'live'
      pnl,
      accuracy,
      timestamp: Date.now(),
    });
  }

  computeTradingMetrics() {
    const tradingEvents = this.events.filter((/** @type {any} */ e) => e.type === 'trading');

    // Active paper/live trades
    const paperTradesActive = tradingEvents.filter(
      (/** @type {any} */ e) => e.tradeType === 'paper' && !e.closed
    ).length;
    this.metrics.trading.paperTradesActive = paperTradesActive;

    const liveTradesActive = tradingEvents.filter(
      (/** @type {any} */ e) => e.tradeType === 'live' && !e.closed
    ).length;
    this.metrics.trading.liveTradesActive = liveTradesActive;

    // Accuracy (% of profitable trades)
    const closedTrades = tradingEvents.filter((/** @type {any} */ e) => e.closed);
    const profitable = closedTrades.filter((/** @type {any} */ e) => e.pnl > 0).length;
    this.metrics.trading.paperTradeAccuracy =
      closedTrades.length > 0 ? Math.round((profitable / closedTrades.length) * 100) : 0;

    // Profit factor
    const gains = closedTrades.filter((/** @type {any} */ e) => e.pnl > 0).reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + e.pnl, 0);
    const losses = Math.abs(
      closedTrades.filter((/** @type {any} */ e) => e.pnl < 0).reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + e.pnl, 0)
    );
    this.metrics.trading.profitFactor = losses > 0 ? (gains / losses).toFixed(2) : 0;
  }

  // ============ Growth/Viral Metrics ============

  recordShare(/** @type {any} */ userId, /** @type {any} */ contentId, /** @type {any} */ platform = 'link', /** @type {any} */ referredUser = null) {
    this.recordEvent({
      type: 'share',
      userId,
      contentId,
      platform,
      referredUser,
      timestamp: Date.now(),
    });
  }

  computeGrowthMetrics() {
    const shareEvents = this.events.filter((/** @type {any} */ e) => e.type === 'share');
    this.metrics.growth.shareCount = shareEvents.length;

    // Referral signups
    const referralEvents = shareEvents.filter((/** @type {any} */ e) => e.referredUser);
    this.metrics.growth.referralSignups = referralEvents.length;

    // Estimate referral value (if each signup = $5 value)
    this.metrics.growth.referralValue = referralEvents.length * 5;

    // Viral coefficient: avg shares per user / users
    const uniqueSharers = new Set(shareEvents.map((/** @type {any} */ e) => e.userId)).size;
    this.metrics.growth.viralCoefficient =
      uniqueSharers > 0 ? (shareEvents.length / uniqueSharers).toFixed(2) : 0;
  }

  // ============ System Health ============

  recordSystemEvent(/** @type {any} */ eventType, /** @type {any} */ metadata = {}) {
    this.recordEvent({
      type: 'system',
      eventType,
      metadata,
      timestamp: Date.now(),
    });
  }

  computeHealthMetrics() {
    const systemEvents = this.events.filter((/** @type {any} */ e) => e.type === 'system');
    const totalEvents = this.events.length;

    // Error rate
    const errors = systemEvents.filter((/** @type {any} */ e) => e.eventType === 'error').length;
    this.metrics.health.errorRate =
      totalEvents > 0 ? Math.round((errors / totalEvents) * 100) : 0;

    // AI fallbacks
    const fallbacks = systemEvents.filter((/** @type {any} */ e) => e.eventType === 'ai_fallback').length;
    this.metrics.health.aiProviderFallbacks = fallbacks;

    // User satisfaction (average rating from feedback events)
    const ratings = systemEvents
      .filter((/** @type {any} */ e) => e.eventType === 'feedback' && e.metadata.rating)
      .map((/** @type {any} */ e) => e.metadata.rating);
    this.metrics.health.userSatisfaction =
      ratings.length > 0
        ? (ratings.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
  }

  // ============ Helpers ============

  recordEvent(/** @type {any} */ event) {
    this.events.push(event);
    // Keep last 10k events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  getDayKey(/** @type {any} */ timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  getWeekKey(/** @type {any} */ timestamp) {
    const d = new Date(timestamp);
    const weekNum = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  }

  computeAllMetrics() {
    this.computeRetentionMetrics();
    this.computeConversionMetrics();
    this.computeMissionMetrics();
    this.computeCreatorMetrics();
    this.computeTradingMetrics();
    this.computeGrowthMetrics();
    this.computeHealthMetrics();
    this.metrics.lastUpdate = Date.now();
    this.saveMetrics();
  }

  startAutoRefresh() {
    setInterval(() => {
      this.computeAllMetrics();
    }, this.refreshIntervalMs);
  }

  // ============ Public API ============

  getMetrics() {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  getCohorts() {
    return JSON.parse(JSON.stringify(this.cohorts));
  }

  getMetricTimeseries(/** @type {any} */ _metricName, /** @type {any} */ days = 7) {
    // Returns last N days of a metric for charting
    const now = Date.now();
    const series = /** @type {any[]} */ ([]);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayKey = this.getDayKey(date.getTime());
      // Placeholder: in production, store daily snapshots
      series.push({ date: dayKey, value: Math.random() * 100 });
    }

    return series;
  }

  exportMetrics(/** @type {any} */ format = 'json') {
    if (format === 'json') {
      return {
        metrics: this.metrics,
        cohorts: this.cohorts,
        events: this.events,
        exportedAt: new Date().toISOString(),
      };
    }
    // CSV, etc. can be added
    return null;
  }
}

// Singleton instance
/** @type {KPIMetricsEngine | null} */
let _kpiEngine = null;

export function getKPIEngine() {
  if (!_kpiEngine) {
    _kpiEngine = new KPIMetricsEngine();
  }
  return _kpiEngine;
}
