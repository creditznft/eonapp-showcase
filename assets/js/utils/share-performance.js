/**
 * W228 local Share Center diagnostics.
 *
 * This module intentionally records no link opens, unique visitors, clicks,
 * social proof, rewards, referral conversion, or external transport. Campaign
 * drafting is local and user-reviewed; future analytics require a separate
 * disclosed server-side program.
 */
export async function recordSharePerformance(_eventType, _options = {}) {
  return { stored: false, disabled: true, reason: 'share_tracking_disabled' };
}

export async function recordAttributedLinkOpen(_attribution, _options = {}) {
  return { ok: false, reason: 'click_tracking_disabled' };
}

export function summarizeSharePerformance(_filters = {}) {
  return { total: 0, byEvent: {}, estimatedUniqueVisitors: 0, maxTrustLevel: 0, latest: [], disabled: true, reason: 'share_tracking_disabled' };
}
