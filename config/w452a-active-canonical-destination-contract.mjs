/**
 * W452.1 — active canonical-destination hygiene.
 *
 * This contract prevents current EONAPP navigation/catalogue code from
 * re-emitting retired public aliases after route migrations. It does not
 * remove inbound redirects; those remain in the route contract for existing
 * bookmarks and shared links.
 */
export const W452A_ACTIVE_CANONICAL_DESTINATION_SCHEMA = 'eonapp.w452a.active-canonical-destination.v1';

export const W452A_CANONICAL_DESTINATIONS = Object.freeze({
  chat: '/',
  research: '/insights',
  city: '/eoncity'
});

export const W452A_RETIRED_INBOUND_ALIASES = Object.freeze({
  chat: Object.freeze(['/chat', '/chat.html']),
  research: Object.freeze(['/trade', '/trade.html']),
  city: Object.freeze(['/realm', '/realmworld', '/game', '/games'])
});

export const W452A_RULES = Object.freeze({
  activeAppDeckResearchRoutesCanonical: true,
  researchAliasInboundOnly: true,
  dodoIsTheOnlyApprovalPendingCommercialCandidate: true,
  checkoutAndTrialRemainInactive: true,
  sourceOnly: true
});

export function validateW452aActiveCanonicalDestinationContract() {
  const errors = [];
  if (W452A_CANONICAL_DESTINATIONS.chat !== '/') errors.push('W452.1 requires the root as canonical Chat.');
  if (W452A_CANONICAL_DESTINATIONS.research !== '/insights') errors.push('W452.1 requires /insights as canonical Research Lab.');
  if (W452A_CANONICAL_DESTINATIONS.city !== '/eoncity') errors.push('W452.1 requires /eoncity as canonical City.');
  if (JSON.stringify(W452A_RETIRED_INBOUND_ALIASES.research) !== JSON.stringify(['/trade', '/trade.html'])) errors.push('W452.1 Research Lab inbound aliases drifted.');
  if (Object.values(W452A_RULES).some((value) => value !== true)) errors.push('W452.1 hygiene rules must remain enabled.');
  return Object.freeze(errors);
}
