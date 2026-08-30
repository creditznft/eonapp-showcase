#!/usr/bin/env node
/** R4-COMM-01 source gate: Graphite default plus inactive, honest commercial planning. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  R4_COMM01_FEATURE_FLAGS,
  R4_COMM01_MONETISATION_DECISION,
  R4_COMM01_THEME,
  validateR4Comm01Contract
} from '../config/r4-comm01-graphite-commerce-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectR4Comm01({ root = ROOT } = {}) {
  const errors = [...validateR4Comm01Contract()];
  const readAt = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const storage = readAt('assets/js/utils/storage.js');
  const bootstrap = readAt('assets/js/eon-theme-bootstrap.js');
  const profile = readAt('profile.html');
  const appDeckCss = readAt('assets/css/eon-app-deck.css');
  const decision = readAt('docs/R4_COMM01_GRAPHITE_THEME_AND_MONETISATION_DECISION_2026-06-26.md');
  const appsDecision = readAt('docs/R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md');

  if (!/EON_THEME_DEFAULT = 'graphite'/.test(storage)) errors.push('Storage default must be Graphite.');
  if (!/Earlier releases stored Classic EON or System\. Both now migrate to Graphite/i.test(storage)) errors.push('Storage must migrate old Classic EON/System values to Graphite.');
  if (!/const defaultTheme = 'graphite'/.test(bootstrap)) errors.push('Early theme bootstrap must default to Graphite.');
  if (!/data-eon-theme-choice="graphite"/.test(profile)) errors.push('Profile must offer Graphite.');
  const graphiteIndex = profile.indexOf('data-eon-theme-choice="graphite"');
  const obsidianIndex = profile.indexOf('data-eon-theme-choice="obsidian"');
  const emberIndex = profile.indexOf('data-eon-theme-choice="ember"');
  if (!(graphiteIndex >= 0 && obsidianIndex > graphiteIndex && emberIndex > obsidianIndex)) errors.push('Profile must present Graphite, Obsidian, then Ember.');
  if (!/Graphite is the default/i.test(profile)) errors.push('Profile must state Graphite is the default.');
  if (!/--clr-bg/.test(appDeckCss) || !/var\(--clr-surface\)/.test(appDeckCss)) errors.push('App Deck must use theme tokens rather than a Classic-only fixed palette.');
  if (!/No subscription percentage, commission, payout, affiliate income/i.test(decision)) errors.push('Decision record must block referral earnings.');
  if (!/Dodo Payments.*single approval-pending/i.test(decision) || /Razorpay.*primary/i.test(decision)) errors.push('Decision record must name Dodo as the sole approval-pending merchant candidate.');
  if (!/W450 supersession note/i.test(appsDecision) || !/Dodo Payments is the single approval-pending planning candidate/i.test(appsDecision) || !/No prices, payment buttons/i.test(appsDecision)) errors.push('The Apps commerce record must point to the W450 Dodo decision and remain inactive.');
  if (Object.values(R4_COMM01_FEATURE_FLAGS).some(Boolean)) errors.push('No commercial flag may be active.');
  if (R4_COMM01_MONETISATION_DECISION.referral.status !== 'share-only') errors.push('Referral status must remain share-only.');
  if (R4_COMM01_THEME.productDefault !== 'graphite') errors.push('Graphite theme decision is invalid.');
  return Object.freeze({ ok: errors.length === 0, errors });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectR4Comm01();
  if (!result.ok) {
    result.errors.forEach((error) => console.error(`[R4-COMM-01] ${error}`));
    process.exitCode = 1;
  } else {
    console.log('R4-COMM-01 gate: PASS (Graphite default; commercial plan remains inactive and referral income is blocked).');
  }
}
