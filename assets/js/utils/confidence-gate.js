/**
 * confidence-gate.js
 * Shared confidence + policy threshold evaluator used by autonomous features.
 */

function clamp01(/** @type {any} */ value, /** @type {any} */ fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Evaluate whether an action should auto-approve, require approval, or be blocked.
 *
 * @param {{
 *   confidence?: number,
 *   policyScore?: number,
 *   confidenceWeight?: number,
 *   policyWeight?: number,
 *   minConfidence?: number,
 *   minPolicyScore?: number,
 *   minCombinedScore?: number,
 *   hardBlockConfidenceBelow?: number,
 *   hardBlockPolicyBelow?: number
 * }} input
 */
export function evaluateConfidenceGate(/** @type {any} */ input = {}) {
  const confidence = clamp01(input.confidence, 0);
  const policyScore = clamp01(input.policyScore, 0.7);
  const confidenceWeight = clamp01(input.confidenceWeight, 0.6);
  const policyWeight = clamp01(input.policyWeight, 0.4);

  const weightTotal = confidenceWeight + policyWeight || 1;
  const weightedConfidence = (confidenceWeight / weightTotal) * confidence;
  const weightedPolicy = (policyWeight / weightTotal) * policyScore;
  const combinedScore = weightedConfidence + weightedPolicy;

  const minConfidence = clamp01(input.minConfidence, 0.65);
  const minPolicyScore = clamp01(input.minPolicyScore, 0.55);
  const minCombinedScore = clamp01(input.minCombinedScore, 0.62);
  const hardBlockConfidenceBelow = clamp01(input.hardBlockConfidenceBelow, 0.25);
  const hardBlockPolicyBelow = clamp01(input.hardBlockPolicyBelow, 0.2);

  const /** @type {any} */
warnings = [];
  const /** @type {any} */
riskFactors = [];

  if (confidence < minConfidence) {
    warnings.push(`Model confidence ${(confidence * 100).toFixed(1)}% below threshold ${(minConfidence * 100).toFixed(1)}%`);
    riskFactors.push('LOW_CONFIDENCE');
  }
  if (policyScore < minPolicyScore) {
    warnings.push(`Policy score ${(policyScore * 100).toFixed(1)}% below threshold ${(minPolicyScore * 100).toFixed(1)}%`);
    riskFactors.push('LOW_POLICY_SCORE');
  }
  if (combinedScore < minCombinedScore) {
    warnings.push(`Combined score ${(combinedScore * 100).toFixed(1)}% below threshold ${(minCombinedScore * 100).toFixed(1)}%`);
    riskFactors.push('LOW_COMBINED_SCORE');
  }

  const hardBlocked = confidence < hardBlockConfidenceBelow || policyScore < hardBlockPolicyBelow;
  if (hardBlocked) {
    warnings.unshift('Hard block triggered: confidence/policy score too low for autonomous execution');
    riskFactors.unshift('HARD_BLOCK');
  }

  return {
    hardBlocked,
    requiresApproval: !hardBlocked && warnings.length > 0,
    approved: !hardBlocked && warnings.length === 0,
    confidence,
    policyScore,
    combinedScore,
    warnings,
    riskFactors
  };
}
