/**
 * Compatibility entrypoint for pre-W476 imports.
 * New code imports analytics-bridge.js directly.
 */
export {
  EON_AGGREGATE_ANALYTICS_DEFAULT_ENABLED,
  EON_AGGREGATE_ANALYTICS_EVENT_NAME,
  EON_AGGREGATE_ANALYTICS_PREFERENCE_KEY,
  EON_AGGREGATE_ANALYTICS_PREFERENCE_SCHEMA,
  bootstrapAggregateAnalyticsBridge,
  disableAggregateAnalyticsRuntime,
  getAggregateAnalyticsPreference,
  getAggregateAnalyticsRouteId,
  isProductionAnalyticsEnvironment,
  setAggregateAnalyticsPreference,
  startAggregateAnalyticsBridge,
  trackAggregateAnalyticsRoute
} from './analytics-bridge.js';

export { startAggregateAnalyticsBridge as ensureGoogleAnalytics } from './analytics-bridge.js';
