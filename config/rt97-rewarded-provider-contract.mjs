/** RT97 provider-neutral rewarded-ad assurance contract. */
export const EON_REWARDED_PROVIDER_CONTRACT_SCHEMA = 'eonapp.rewarded.provider.rt97.v1';
const freeze = (value) => Object.freeze(value);

export const EON_REWARDED_PROVIDER_ADAPTERS = freeze({
  exoclick: freeze({
    id: 'exoclick',
    transport: 'vast-wrapper',
    completionAssurance: 'server-validated-vast-sequence',
    providerSignedCompletion: false,
    rewardClass: 'bounded-sponsor-unlock',
    permanentValueAllowed: false,
    clientCompletionCanMint: false,
    requiresSigningSecret: true,
    requiresDatabase: true
  }),
  'google-h5': freeze({ id: 'google-h5', transport: 'provider-sdk', completionAssurance: 'unimplemented', providerSignedCompletion: false, rewardClass: 'none', permanentValueAllowed: false, clientCompletionCanMint: false, requiresSigningSecret: true, requiresDatabase: true }),
  adinplay: freeze({ id: 'adinplay', transport: 'provider-sdk', completionAssurance: 'unimplemented', providerSignedCompletion: false, rewardClass: 'none', permanentValueAllowed: false, clientCompletionCanMint: false, requiresSigningSecret: true, requiresDatabase: true }),
  venatus: freeze({ id: 'venatus', transport: 'provider-sdk', completionAssurance: 'unimplemented', providerSignedCompletion: false, rewardClass: 'none', permanentValueAllowed: false, clientCompletionCanMint: false, requiresSigningSecret: true, requiresDatabase: true })
});

export function getRewardedProviderAdapter(providerId = '') {
  return EON_REWARDED_PROVIDER_ADAPTERS[String(providerId || '').trim().toLowerCase()] || null;
}

export function canRewardedProviderMint(providerId = '', rewardClass = '') {
  const adapter = getRewardedProviderAdapter(providerId);
  if (!adapter || adapter.completionAssurance === 'unimplemented' || adapter.clientCompletionCanMint) return freeze({ ok: false, reason: 'provider_verifier_unavailable' });
  const requested = String(rewardClass || '').trim();
  if (requested !== adapter.rewardClass) return freeze({ ok: false, reason: 'reward_class_not_authorized' });
  if (adapter.permanentValueAllowed) return freeze({ ok: false, reason: 'permanent_value_requires_stronger_provider_proof' });
  return freeze({ ok: true, provider: adapter.id, rewardClass: adapter.rewardClass, permanentValueAllowed: false, clientCompletionCanMint: false });
}

export function validateRewardedProviderContract() {
  const errors = [];
  for (const adapter of Object.values(EON_REWARDED_PROVIDER_ADAPTERS)) {
    if (adapter.clientCompletionCanMint) errors.push(`${adapter.id}:client-mint-forbidden`);
    if (adapter.completionAssurance === 'unimplemented' && adapter.rewardClass !== 'none') errors.push(`${adapter.id}:unimplemented-reward-class`);
    if (!adapter.providerSignedCompletion && adapter.permanentValueAllowed) errors.push(`${adapter.id}:weak-proof-permanent-value`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_REWARDED_PROVIDER_CONTRACT_SCHEMA });
}

export default freeze({ EON_REWARDED_PROVIDER_CONTRACT_SCHEMA, EON_REWARDED_PROVIDER_ADAPTERS, getRewardedProviderAdapter, canRewardedProviderMint, validateRewardedProviderContract });
