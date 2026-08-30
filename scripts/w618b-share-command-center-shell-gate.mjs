#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EONAPP_COMPACT_PRIMARY_NAVIGATION, renderEonShellNavigationMarkup, resolveEonShellPage } from '../assets/js/shell/eon-shell-navigation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW618bShareCommandCenterShellGate() {
  const errors = [];
  const navIds = EONAPP_COMPACT_PRIMARY_NAVIGATION.map((entry) => entry.id);
  const labels = EONAPP_COMPACT_PRIMARY_NAVIGATION.map((entry) => entry.label);
  const navMarkup = renderEonShellNavigationMarkup('apps');
  const shell = read('assets/js/eon-app-shell.js');
  const css = read('assets/css/eon-app-shell.css');
  const share = read('assets/js/utils/eon-share-sheet.js');
  const city = read('assets/js/eon-city-play-station.js');

  if (navIds.join('|') !== 'chat|projects|studio|apps|eoncity') errors.push(`Compact primary nav is wrong: ${navIds.join(', ')}`);
  if (!labels.includes('Studio') || !labels.includes('Apps')) errors.push('Compact primary nav must expose Studio and Apps.');
  if (EONAPP_COMPACT_PRIMARY_NAVIGATION.some((entry) => ['library', 'forge', 'vault', 'local-ai', 'billing'].includes(entry.id))) errors.push('Secondary tools leaked into the compact primary nav.');
  if (!/data-eon-shell-action="apps"[^>]*aria-current="page"/.test(navMarkup)) errors.push('Apps action does not render as the current page when selected.');
  if (resolveEonShellPage({ pathname: '/local-ai' }) !== 'apps') errors.push('/local-ai must resolve to Apps in the compact shell.');
  if (resolveEonShellPage({ pathname: '/market' }) !== 'studio') errors.push('/market must resolve to Studio in the compact shell.');

  if (!shell.includes('installGlobalShareCommandCenter')) errors.push('App shell missing global Share Command Center installer.');
  if (!shell.includes('data-eon-global-share')) errors.push('App shell missing global top-right share button.');
  if (!shell.includes("currentPage === 'chat' || currentPage === 'eoncity'")) errors.push('Global share must avoid duplicate controls on Chat and EON City native share surfaces.');
  if (!shell.includes('sidebar.dataset.eonShellPage = currentPage')) errors.push('Sidebar does not expose the page for compact history rules.');
  if (!shell.includes('renderGlobalIdentityAction(currentShellIdentity)')) errors.push('Global profile action is not synced with identity state.');

  if (!css.includes('.eon-app-global-actions')) errors.push('CSS missing global top-right action cluster.');
  if (!css.includes(':not([data-eon-shell-page="chat"]) .eon-app-chat-history-wrap')) errors.push('CSS does not hide chat history on non-chat pages.');
  if (!css.includes('--eon-app-rail-width: 14.35rem')) errors.push('CSS missing compact sidebar width.');
  if (!css.includes('.eon-share-rewards')) errors.push('CSS missing share rewards panel styling.');

  if (!share.includes('getEonReferralRewardMatrix')) errors.push('Share Center does not read the EON Keys referral matrix.');
  if (!share.includes('Share the app. Earn EON Keys later.')) errors.push('Share Center missing the EON Keys rewards explanation.');
  if (!share.includes('EON Keys never create cash, wallet, crypto, NFT, resale, payout, commission, or platform-paid AI credits')) errors.push('Share Center missing reward safety boundary.');
  if (!city.includes('data-eon-play-share-city')) errors.push('EON City must retain its native City share control instead of depending only on the global shell.');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w618b.share-command-center-shell-gate.v1', checks: 18 });
}

const report = inspectW618bShareCommandCenterShellGate();
if (!report.ok) {
  console.error(`[W618B] Share Command Center + compact shell gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W618B] Share Command Center + compact shell gate passed (${report.checks}/18).`);
