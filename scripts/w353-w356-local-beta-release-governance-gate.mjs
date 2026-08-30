#!/usr/bin/env node
/** W353–W356 verifies local beta/release preparation remains fail-closed. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getEonLocalBetaReadinessRecordsTruth
} from '../assets/js/local-first/eon-beta-readiness-records.js';
import {
  createEonLocalReleaseGovernanceBoard,
  getEonLocalReleaseGovernanceTruth
} from '../assets/js/local-first/eon-release-governance-board.js';
import {
  assessEonReferralReentry,
  getEonReferralReentryFirewallTruth
} from '../assets/js/realm-relic/eon-referral-reentry-firewall.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W353_W356_FORBIDDEN_RUNTIME_TOKENS,
  W353_W356_LOCAL_BETA_RELEASE_GOVERNANCE_SCHEMA,
  W353_W356_REQUIRED_SOURCES
} from '../config/w353-w356-local-beta-release-governance-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export function runW353W356LocalBetaReleaseGovernanceGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W353_W356_REQUIRED_SOURCES) if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W353–W356 source: ${relative}`);

  const betaTruth = getEonLocalBetaReadinessRecordsTruth();
  if (!betaTruth.localOnly || betaTruth.personalDataStored || betaTruth.inviteCreated || betaTruth.automaticEnrollment || betaTruth.remoteTelemetryCreated || betaTruth.commercialFeaturesEnabled || betaTruth.releaseApproved) errors.push('Local beta readiness records must stay non-sensitive, local-only, non-commercial, and non-enrolling.');

  const releaseTruth = getEonLocalReleaseGovernanceTruth();
  const board = createEonLocalReleaseGovernanceBoard({ betaReadiness: { status: 'ready-for-invite-only-beta', blockers: [] } });
  if (!releaseTruth.failClosed || releaseTruth.localChecklistCanCertify || releaseTruth.releaseApproved || releaseTruth.deploymentCreated || releaseTruth.betaEnrollmentCreated || releaseTruth.remoteTelemetryCreated || releaseTruth.commercialActivation) errors.push('Release governance must remain fail-closed and non-operational.');
  if (board.status !== 'blocked' || board.releaseApproved || board.deploymentCreated || board.betaEnrollmentCreated || !board.blockers.includes('canonical-evidence-recovery-required')) errors.push('Release board must retain external evidence and governance blockers.');

  const referralTruth = getEonReferralReentryFirewallTruth();
  const referral = assessEonReferralReentry({ processorTestModeProven: true, refundWindowProven: true, abuseControlsProven: true, supportOwnerProven: true });
  if (referralTruth.referralActive || referralTruth.attributionTrackingActive || referralTruth.cashOrCryptoIssued || referralTruth.pointsOrTokenIssued || referralTruth.walletCreated || referralTruth.payoutCreated || referralTruth.automaticActivation) errors.push('Referral firewall must retain zero active financial/reward behavior.');
  if (referral.status !== 'separate-ceo-decision-required' || referral.referralActive || referral.discountIssued || referral.payoutCreated) errors.push('Even hypothetical prerequisite completion must not activate referrals.');

  if (getCapabilityTruth('local-beta-readiness-desk')?.lifecycle !== 'active-local') errors.push('Capability truth must describe the local beta readiness desk as active local-only.');
  if (getCapabilityTruth('release-certification-board')?.lifecycle !== 'blocked') errors.push('Capability truth must describe release certification as blocked pending external evidence and review.');
  if (getCapabilityTruth('referral-commercial-reentry')?.lifecycle !== 'blocked') errors.push('Capability truth must describe commercial referral re-entry as blocked.');

  for (const relative of [
    'assets/js/local-first/eon-beta-readiness-records.js',
    'assets/js/local-first/eon-release-governance-board.js',
    'assets/js/realm-relic/eon-referral-reentry-firewall.js'
  ]) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const token of W353_W356_FORBIDDEN_RUNTIME_TOKENS) if (source.includes(token)) errors.push(`${relative} must not contain restricted activation/network token: ${token}`);
  }
  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  if (!workspace.includes('renderLocalBetaReleaseDesk') || !workspace.includes('bindLocalBetaReleaseDesk')) errors.push('Workspace must render and bind the local beta/release desk.');

  return Object.freeze({ schema: W353_W356_LOCAL_BETA_RELEASE_GOVERNANCE_SCHEMA, ok: errors.length === 0, errors, board, referral });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = runW353W356LocalBetaReleaseGovernanceGate();
  if (!result.ok) result.errors.forEach((error) => console.error(`[W353–W356] ${error}`));
  else console.log('[W353–W356] PASS: local beta declarations are non-sensitive, referral re-entry remains blocked, and release governance is fail-closed.');
  process.exitCode = result.ok ? 0 : 1;
}
