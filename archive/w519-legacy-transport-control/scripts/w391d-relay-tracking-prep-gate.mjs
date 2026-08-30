#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W391D_RELAY_TRACKING_CONTRACT, validateW391DRelayTrackingContract } from '../config/w391d-relay-tracking-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW391DRelayTrackingPrep() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const helper = read('functions/_shared/eon-relay.js');
  const invite = read('functions/api/relay/invites/create.js');
  const capture = read('functions/api/relay/attribution/capture.js');
  const claim = read('functions/api/relay/claim.js');
  const status = read('functions/api/relay/status.js');
  const migration = read('relay/migrations/0001_eon_relay_pilot.sql');
  check('contract-valid', validateW391DRelayTrackingContract().length === 0, 'Relay tracking contract has no internal mismatch');
  check('dedicated-database-only', /EON_RELAY_DB/.test(helper) && !/EONAPP_REFERRALS_DB|REFERRALS_DB/.test(`${helper}\n${invite}\n${capture}`), 'Relay uses only the dedicated binding and never legacy referral bindings');
  check('disabled-by-default', /EON_RELAY_TRACKING_ROLLOUTS/.test(helper) && /'tracking'/.test(helper) && /'pilot'/.test(helper) && /eon-relay-tracking-not-configured/.test(helper), 'Relay tracking cannot run without an explicit non-default rollout and configuration');
  check('session-and-origin-required', /enforceSameOriginMutation/.test(helper) && /readSession/.test(helper) && /sign_in_required/.test(helper), 'Invite and attribution paths require same-origin signed-in actions');
  check('opaque-code-only', /invite_code_hmac/.test(migration) && /relayInviteCodeHash/.test(helper) && !/invite_code TEXT/.test(migration), 'The schema stores an HMAC rather than the raw invite code');
  check('one-direct-attribution', /invitee_account_ref TEXT NOT NULL UNIQUE/.test(migration) && /relay_self_invite_not_allowed/.test(capture), 'A user can accept at most one direct invite and cannot self-attribute');
  check('no-passive-click-tracking', !/GET\s*\(|onRequestGet/.test(`${invite}\n${capture}`) && /explicit signed-in action/i.test(capture), 'Tracking endpoints are POST-only explicit actions rather than landing-page click beacons');
  check('no-grants', /grantsEnabled:\s*false/.test(`${helper}\n${invite}\n${capture}\n${status}`) && /503/.test(claim) && /grantCreated:\s*false/.test(claim), 'No referral grant or value claim can be created by tracking code');
  const relaySurface = `${migration}\n${invite}\n${capture}`;
  const migrationWithoutComments = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
  const sensitiveColumns = /\b(?:ip_address|client_ip|device_fingerprint|raw_email|email_address|user_agent|cookie_value)\b/i;
  const sensitiveHeaderReads = /headers\.get\(\s*['\"](?:cf-connecting-ip|x-forwarded-for|user-agent|cookie)['\"]\s*\)/i;
  check('privacy-boundary', !sensitiveColumns.test(migrationWithoutComments) && !sensitiveHeaderReads.test(relaySurface), 'Relay tracking schema/endpoints contain no IP, fingerprint, raw email, user-agent or cookie capture');
  return Object.freeze({ schema: 'eonapp.w391d.relay-tracking-prep-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No relay database is bound or migrated by this source gate.', 'No invite link, attribution, reward, Collection item, entitlement or grant is active until separate operator and policy proof.']) });
}

export function runW391DRelayTrackingPrepGate({ writeArtifact = true } = {}) {
  const result = inspectW391DRelayTrackingPrep();
  if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w391d-relay-tracking-prep-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW391DRelayTrackingPrepGate(); process.stdout.write(`W391D Relay tracking preparation gate passed (${result.checkCount}/${result.checkCount}).\n`); }
