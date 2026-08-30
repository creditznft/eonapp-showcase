/** W520 — core modularisation source contract. */

export const W520_CORE_MODULARISATION_SCHEMA = 'eonapp.w520.core-modularisation.v1';

export const W520_CORE_SEAMS = Object.freeze([
  Object.freeze({
    id: 'shell-navigation',
    entry: 'assets/js/eon-app-shell.js',
    boundary: 'assets/js/shell/eon-shell-navigation.js',
    baselineLines: 1248,
    maximumLines: 1160,
    requiredExports: Object.freeze(['EONAPP_PRODUCT_HIERARCHY', 'resolveEonShellPage', 'renderEonShellNavigationMarkup'])
  }),
  Object.freeze({
    id: 'chat-session-state',
    entry: 'assets/js/chat-page.js',
    boundary: 'assets/js/chat/chat-page-session-state.js',
    baselineLines: 2939,
    maximumLines: 2880,
    requiredExports: Object.freeze(['CHAT_DAILY_FREE_GUIDE_LIMIT', 'createChatDailyGuideUsageStore', 'createChatMissionTimelineStore'])
  }),
  Object.freeze({
    id: 'ai-provider-catalog',
    entry: 'assets/js/chat/ai-runtime.js',
    boundary: 'assets/js/chat/ai-provider-catalog.js',
    baselineLines: 1850,
    maximumLines: 1600,
    requiredExports: Object.freeze(['PROVIDERS', 'DEFAULT_AI_PROVIDER_ID', 'normalizeAIProviderId'])
  }),
  Object.freeze({
    id: 'profile-browser-state',
    entry: 'assets/js/utils/profile.js',
    boundary: 'assets/js/utils/profile/profile-browser-state.js',
    baselineLines: 1678,
    maximumLines: 1500,
    requiredExports: Object.freeze(['normalizeBrowserAttachments', 'normalizeRecoveryState', 'deriveRecoveryStatus'])
  })
]);

export function validateW520CoreModularisationContract(contract = W520_CORE_SEAMS) {
  const issues = [];
  if (!Array.isArray(contract) || contract.length !== 4) issues.push('W520 requires exactly four core seams.');
  const ids = new Set();
  for (const seam of contract || []) {
    if (!seam?.id || ids.has(seam.id)) issues.push(`Invalid or duplicate W520 seam id: ${seam?.id || 'missing'}.`);
    ids.add(seam?.id);
    if (!String(seam?.entry || '').startsWith('assets/js/')) issues.push(`W520 seam ${seam?.id || 'missing'} entry must stay inside assets/js.`);
    if (!String(seam?.boundary || '').startsWith('assets/js/')) issues.push(`W520 seam ${seam?.id || 'missing'} boundary must stay inside assets/js.`);
    if (!(Number(seam?.baselineLines) > Number(seam?.maximumLines) && Number(seam?.maximumLines) > 0)) issues.push(`W520 seam ${seam?.id || 'missing'} needs a reducing line ceiling.`);
    if (!Array.isArray(seam?.requiredExports) || seam.requiredExports.length < 2) issues.push(`W520 seam ${seam?.id || 'missing'} needs an explicit public contract.`);
  }
  return issues;
}
