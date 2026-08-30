/**
 * asset-reputation-score.js
 * Lightweight scoring for dataset/workflow/skill and seller quality.
 */

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * @param {{
 *   completedSales?: number,
 *   disputeRate?: number,
 *   repeatBuyersRate?: number,
 *   averageRating?: number
 * }} metrics
 */
export function computeSellerReputation(/** @type {any} */ metrics = {}) {
  const completedSales = clamp(metrics.completedSales ?? 0, 0, 1000000);
  const disputeRate = clamp(metrics.disputeRate ?? 0, 0, 1);
  const repeatBuyersRate = clamp(metrics.repeatBuyersRate ?? 0, 0, 1);
  const averageRating = clamp(metrics.averageRating ?? 4, 0, 5);

  const volumeScore = Math.min(completedSales / 200, 1) * 25;
  const disputeScore = (1 - disputeRate) * 30;
  const repeatScore = repeatBuyersRate * 25;
  const ratingScore = (averageRating / 5) * 20;
  const score = clamp(volumeScore + disputeScore + repeatScore + ratingScore, 0, 100);

  let tier = 'bronze';
  if (score >= 85) tier = 'platinum';
  else if (score >= 70) tier = 'gold';
  else if (score >= 55) tier = 'silver';

  return { score: Number(score.toFixed(2)), tier };
}

/**
 * @param {{ qualitySignals?: number, benchmarkScore?: number, policyScore?: number }} asset
 */
export function computeAssetQualityTier(/** @type {any} */ asset = {}) {
  const qualitySignals = clamp(asset.qualitySignals ?? 0.7, 0, 1);
  const benchmarkScore = clamp(asset.benchmarkScore ?? 0.65, 0, 1);
  const policyScore = clamp(asset.policyScore ?? 0.8, 0, 1);

  const score = (qualitySignals * 0.4) + (benchmarkScore * 0.35) + (policyScore * 0.25);
  if (score >= 0.9) return 'verified-plus';
  if (score >= 0.78) return 'verified';
  if (score >= 0.62) return 'standard';
  return 'emerging';
}
