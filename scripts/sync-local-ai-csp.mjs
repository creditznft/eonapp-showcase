#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCAL_AI_RUNTIME_ROUTE_PATHS, getLocalAiRouteContentSecurityPolicy } from '../config/local-ai-browser-contract.mjs';
import { EON_CREATOR_COMPANION_ROUTE_PATHS, getCreatorCompanionRouteContentSecurityPolicy } from '../config/eon-creator-companion-browser-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_MARKER_START = '# W476_LOCAL_AI_CSP_START';
const LOCAL_MARKER_END = '# W476_LOCAL_AI_CSP_END';
const COMPANION_MARKER_START = '# A15_I12_CREATOR_COMPANION_CSP_START';
const COMPANION_MARKER_END = '# A15_I12_CREATOR_COMPANION_CSP_END';

function buildRouteBlock({ markerStart, markerEnd, comments = [], routes = [], policy = '', policyForRoute = null }) {
  const rows = [markerStart, ...comments];
  for (const route of routes) {
    const routePolicy = typeof policyForRoute === 'function' ? policyForRoute(route) : policy;
    rows.push('', route, '  ! Content-Security-Policy', `  Content-Security-Policy: ${routePolicy}`);
  }
  rows.push(markerEnd, '');
  return rows.join('\n');
}

const localBlock = buildRouteBlock({
  markerStart: LOCAL_MARKER_START,
  markerEnd: LOCAL_MARKER_END,
  comments: [
    '# W476-A5 canonical Local AI browser-to-loopback policy. This overrides the',
    '# global CSP only on the EONBOT and Local AI routes. It intentionally omits',
    '# upgrade-insecure-requests because approved local runtimes use HTTP loopback.',
    '# It does not allow LAN/RFC1918 hosts or arbitrary loopback ports.'
  ],
  routes: LOCAL_AI_RUNTIME_ROUTE_PATHS,
  policy: getLocalAiRouteContentSecurityPolicy()
});

const companionBlock = buildRouteBlock({
  markerStart: COMPANION_MARKER_START,
  markerEnd: COMPANION_MARKER_END,
  comments: [
    '# Institutional AI V2 action-surface policy. Create and EONCITY may reach only',
    '# the finite Local AI loopback allowlist plus the signed 127.0.0.1 Creator Companion.',
    '# No LAN/RFC1918 wildcard, arbitrary port or public loopback proxy is allowed.'
  ],
  routes: EON_CREATOR_COMPANION_ROUTE_PATHS,
  policyForRoute: (route) => getCreatorCompanionRouteContentSecurityPolicy(route)
});

function replaceOrInsert(source, start, end, block) {
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, 'g');
  let replaced = false;
  if (pattern.test(source)) {
    pattern.lastIndex = 0;
    return source.replace(pattern, () => {
      if (replaced) return '';
      replaced = true;
      return block;
    });
  }
  const assetMarker = '\n/assets/*';
  const index = source.indexOf(assetMarker);
  if (index < 0) throw new Error(`Unable to find /assets/* insertion point for ${start}`);
  return `${source.slice(0, index)}\n\n${block}${source.slice(index)}`;
}

function updateHeaders(relativeFile) {
  const file = path.join(ROOT, relativeFile);
  let source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  source = replaceOrInsert(source, LOCAL_MARKER_START, LOCAL_MARKER_END, localBlock);
  source = replaceOrInsert(source, COMPANION_MARKER_START, COMPANION_MARKER_END, companionBlock);
  for (const marker of [LOCAL_MARKER_START, LOCAL_MARKER_END, COMPANION_MARKER_START, COMPANION_MARKER_END]) {
    if (!source.includes(marker)) throw new Error(`Unable to place ${marker} in ${relativeFile}`);
  }
  fs.writeFileSync(file, source.endsWith('\n') ? source : `${source}\n`);
}

for (const file of ['_headers', 'public/_headers']) updateHeaders(file);
console.log(JSON.stringify({
  ok: true,
  files: ['_headers', 'public/_headers'],
  localRoutes: LOCAL_AI_RUNTIME_ROUTE_PATHS,
  companionRoutes: EON_CREATOR_COMPANION_ROUTE_PATHS,
  localPolicy: getLocalAiRouteContentSecurityPolicy(),
  companionPolicy: getCreatorCompanionRouteContentSecurityPolicy()
}, null, 2));
