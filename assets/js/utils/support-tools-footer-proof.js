import { buildEonDestinationHref } from '../contracts/navigation/eon-destination-registry.js';

export const W228_SUPPORT_TOOLS_FOOTER_SCHEMA = 'eonapp.w228.support-tools-footer.v1';
export const W133_SUPPORT_TOOLS_FOOTER_SCHEMA = W228_SUPPORT_TOOLS_FOOTER_SCHEMA;

export const SUPPORT_TOPICS = Object.freeze([
  { id: 'signed-sharing', label: 'Signed sharing & safe links', badge: 'Sharing', description: 'Self-contained eon2/eon3 link, QR scanning, invalid-link and public-metadata guidance.', evidence: ['route or safe link prefix', 'browser context', 'safe error text'], href: '/?support=1&topic=signed-sharing', priority: 'self-service-first' },
  { id: 'local-ai', label: 'Make Local AI ready', badge: 'Local AI', description: 'Local Lite or supported desktop-runtime checks with truthful Guide/Local/Connected status; Image and Video readiness stay separate.', evidence: ['browser and device', 'runtime status', 'safe error text'], href: '/?support=1&topic=local-ai', priority: 'self-service-first' },
  { id: 'vault-recovery', label: 'Vault backup & recovery', badge: 'Vault', description: 'Local backup, restore, profile recovery and device migration guidance.', evidence: ['page affected', 'backup availability', 'last known action'], href: '/?support=1&topic=vault-recovery', priority: 'security-sensitive' },
  { id: 'market-previews', label: 'Market local previews', badge: 'Market', description: 'Explicit local generation, saved previews and safe export guidance.', evidence: ['theme or preview ID', 'safe screenshot', 'browser state'], href: '/?support=1&topic=market-previews', priority: 'self-service-first' },
  { id: 'city-realm', label: 'EON City & My Realm', badge: 'City', description: '2D/3D device fallback, local Realm state and safe share identity guidance.', evidence: ['route', 'device shape', 'reproduction steps'], href: '/?support=1&topic=city-realm', priority: 'self-service-first' },
  { id: 'bug-security', label: 'Bug or security report', badge: 'Safety', description: 'Broken routes, layout issues, accessibility issues or security observations.', evidence: ['exact URL', 'steps to reproduce', 'expected versus actual', 'public-only proof'], href: '/?support=1&topic=bug-security', priority: 'admin-review-eligible' }
]);

export const TOOL_WORKFLOWS = Object.freeze([
  { id: 'workspace', action: 'workspace', label: 'Workspace', href: '/workspace', description: 'Focused planning, building and reviewed automation drafts.', audience: 'builder' },
  { id: 'automations', action: 'automations', label: 'Automations', href: '/automations', description: 'Draft and review repeatable work before any external action.', audience: 'operator' },
  { id: 'local-ai', action: 'local-ai', label: 'Make Local AI ready', href: '/local-ai#eonbot-local-ai-setup', description: 'One device-aware Local AI setup path with proof-based Local Lite or desktop-runtime readiness.', audience: 'builder' },
  { id: 'help', action: 'help', label: 'Help', href: '/help', description: 'EONBOT-first issue triage with public-only evidence.', audience: 'all' }
]);

export const FOOTER_NAV_GROUPS = Object.freeze([
  { id: 'product', label: 'Product', links: [
    { href: '/', label: 'Chat' }, { href: '/workspace', label: 'Workspace' }, { href: '/market', label: 'Market' }, { href: '/eoncity', label: 'EON City' }, { href: '/vault', label: 'Vault' }
  ] },
  { id: 'help', label: 'Help & trust', links: [
    { href: '/help', label: 'Help' }, { href: '/profile', label: 'Profile & settings' }, { href: '/billing', label: 'Billing status' }, { href: '/legal', label: 'Legal' }
  ] },
  { id: 'community', label: 'Community', links: [
    { href: '#eon-share', label: 'Invite & Share Center', action: 'share' }, { href: 'https://t.me/EonApps', label: 'Telegram · @EonApps', external: true }, { href: 'https://x.com/EonAppz', label: 'X · @EonAppz', external: true }
  ] },
  { id: 'legal', label: 'Legal', links: [
    { href: '/about', label: 'About' }, { href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }
  ] }
]);

export function findSupportTopic(topicId) {
  const id = String(topicId || '').trim().toLowerCase();
  return SUPPORT_TOPICS.find((topic) => topic.id === id) || SUPPORT_TOPICS[0];
}
export function buildSupportChatUrl(topicId, detail = '') {
  const topic = findSupportTopic(topicId);
  return buildEonDestinationHref('home', { support: '1', topic: topic.id, detail: String(detail || '').trim().slice(0, 220) });
}
export function getToolRouteForAction(action) {
  const id = String(action || '').trim().toLowerCase();
  return TOOL_WORKFLOWS.find((workflow) => workflow.action === id || workflow.id === id)?.href || '/workspace';
}
export function flattenFooterLinks(groups = FOOTER_NAV_GROUPS) {
  return groups.flatMap((group) => group.links.map((link) => ({ ...link, group: group.id, groupLabel: group.label })));
}
export function createSupportToolsFooterSummary() {
  return {
    schema: W228_SUPPORT_TOOLS_FOOTER_SCHEMA,
    supportTopicCount: SUPPORT_TOPICS.length,
    toolWorkflowCount: TOOL_WORKFLOWS.length,
    footerGroupCount: FOOTER_NAV_GROUPS.length,
    footerLinkCount: flattenFooterLinks().length,
    adminReviewTopics: SUPPORT_TOPICS.filter((topic) => topic.priority === 'admin-review-eligible').map((topic) => topic.id),
    securitySensitiveTopics: SUPPORT_TOPICS.filter((topic) => topic.priority === 'security-sensitive').map((topic) => topic.id),
    safeEvidenceRule: 'Public proof only. Never request credentials, recovery phrases, private keys, passwords or full API keys.'
  };
}
