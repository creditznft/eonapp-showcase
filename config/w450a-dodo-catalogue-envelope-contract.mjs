import { W450_DODO_CATALOGUE_ENVELOPE, W450_DODO_STATUS, W450_DODO_TRIAL_POLICY } from './w450-dodo-approval-readiness-contract.mjs';

/** W450.1 — single Dodo catalogue envelope; planning only, never checkout data. */
export const W450A_DODO_CATALOGUE_ENVELOPE_SCHEMA = 'eonapp.w450a.dodo-catalogue-envelope.v1';
export const W450A_PAID_TIER_IDS = Object.freeze(['eon-plus', 'eon-studio', 'eon-power', 'eon-max']);

export function validateW450aDodoCatalogueEnvelopeContract() {
  const errors = [];
  if (W450_DODO_STATUS.merchantApproved !== false || W450_DODO_STATUS.publicPricingActive !== false || W450_DODO_STATUS.publicTrialActive !== false) errors.push('W450.1 requires Dodo commerce to remain approval-pending and non-public.');
  if (W450_DODO_CATALOGUE_ENVELOPE.lifecycle !== 'planned-not-public' || W450_DODO_CATALOGUE_ENVELOPE.displayCurrencyReference !== 'USD') errors.push('W450.1 requires a non-public USD-referenced catalogue envelope.');
  if (W450_DODO_CATALOGUE_ENVELOPE.maximumMonthlyUsd !== 49.99) errors.push('W450.1 requires the $49.99 monthly tier ceiling.');
  if (JSON.stringify(W450A_PAID_TIER_IDS) !== JSON.stringify(W450_DODO_TRIAL_POLICY.proposedEligibleTiers)) errors.push('W450.1 paid tiers must match the trial-policy eligible tier set.');
  const tiers = new Map(W450_DODO_CATALOGUE_ENVELOPE.tiers.map((tier) => [tier.id, tier]));
  if (tiers.get('eon-free')?.pricing !== '0-usd-reference' || tiers.get('eon-free')?.trialEligible !== false) errors.push('W450.1 free tier must remain free and trial-ineligible.');
  if (W450A_PAID_TIER_IDS.some((id) => tiers.get(id)?.pricing !== 'not-finalized-within-monthly-cap' || tiers.get(id)?.trialEligible !== true)) errors.push('W450.1 paid tiers must remain planned, capped and trial-eligible only after proof.');
  return Object.freeze(errors);
}
