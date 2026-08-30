/** Institutional AI V2 — least-privilege browser contract for Creator/City AI actions.
 *
 * Create and EONCITY intentionally reuse the same maintained AI/Creator engines as
 * Chat. Their CSP therefore needs the finite Local AI loopback allowlist plus the
 * signed user-started Creator Companion. No LAN/private-network wildcard or public
 * endpoint is introduced. Historical export names remain as compatibility aliases.
 */
import { getLocalAiCspLoopbackSources } from './local-ai-browser-contract.mjs';

export const EON_CREATOR_COMPANION_BROWSER_SCHEMA = 'eonapp.creator-companion.browser.institutional-ai-v2';
export const EON_CREATOR_COMPANION_HOST = '127.0.0.1';
export const EON_CREATOR_COMPANION_PORT = 47826;
export const EON_CREATOR_COMPANION_ENDPOINT = `http://${EON_CREATOR_COMPANION_HOST}:${EON_CREATOR_COMPANION_PORT}`;
export const EON_CREATOR_ORDINARY_DISPLAY_SCRIPT_SOURCES = Object.freeze([]);

export const EON_CREATOR_AI_ACTION_ROUTE_PATHS = Object.freeze([
  '/create',
  '/create/',
  '/create.html',
  '/eoncity',
  '/eoncity.html'
]);

// Compatibility export retained for A15/W626 callers. The route authority now
// covers every maintained surface that can invoke the Creator Companion.
export const EON_CREATOR_COMPANION_ROUTE_PATHS = EON_CREATOR_AI_ACTION_ROUTE_PATHS;

export function getCreatorAiActionCspSources() {
  return Object.freeze([...new Set([EON_CREATOR_COMPANION_ENDPOINT, ...getLocalAiCspLoopbackSources()])].sort());
}

export function getCreatorCompanionCspSources() {
  return getCreatorAiActionCspSources();
}

export function getCreatorCompanionRouteContentSecurityPolicy(route = '') {
  const sources = getCreatorAiActionCspSources().join(' ');
  const sponsoredScriptSources = ''; // RT96: ordinary display scripts are product-disabled.
  return [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://telegram.org https://www.googletagmanager.com${sponsoredScriptSources}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https: wss: ${sources}`,
    "font-src 'self' data: https://cdn.jsdelivr.net",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'self' https: blob:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-to csp-endpoint",
    "report-uri /csp-report"
  ].join('; ');
}

export function getCreatorAiActionBrowserTruth() {
  return Object.freeze({
    schema: EON_CREATOR_COMPANION_BROWSER_SCHEMA,
    routes: EON_CREATOR_AI_ACTION_ROUTE_PATHS,
    localAiLoopback: true,
    creatorCompanion: true,
    arbitraryLan: false,
    publicLoopbackProxy: false,
    wildcardPorts: false
  });
}
