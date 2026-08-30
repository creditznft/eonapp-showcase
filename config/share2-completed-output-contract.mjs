/** Share-2 contract: useful-output handoff only; no hosting, posting or tracking. */
export const SHARE2_COMPLETED_OUTPUT_CONTRACT = Object.freeze({
  schema: 'eonapp.share2.completed-output-contract.v1',
  status: 'local-browser-session-only',
  allowedOrigins: Object.freeze(['creator-draft', 'forge-project']),
  requiredFields: Object.freeze(['title', 'usefulOutcome', 'firstRemixStep']),
  exclusions: Object.freeze(['source files', 'media bodies', 'private chat', 'credentials', 'public links', 'accounts', 'tracking identifiers']),
  allowedDestinations: Object.freeze(['local Share Pack prefill', 'local Remix Card prefill']),
  directPublishing: false,
  socialOAuth: false,
  hosting: false,
  collaborationRoom: false,
  tracking: false,
  referralReward: false
});

export function validateShare2CompletedOutputContract() {
  const errors = [];
  const c = SHARE2_COMPLETED_OUTPUT_CONTRACT;
  if (c.status !== 'local-browser-session-only') errors.push('status');
  if (c.allowedOrigins.join('|') !== 'creator-draft|forge-project') errors.push('allowedOrigins');
  if (c.requiredFields.join('|') !== 'title|usefulOutcome|firstRemixStep') errors.push('requiredFields');
  for (const key of ['directPublishing', 'socialOAuth', 'hosting', 'collaborationRoom', 'tracking', 'referralReward']) if (c[key] !== false) errors.push(key);
  return errors;
}
