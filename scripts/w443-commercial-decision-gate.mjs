#!/usr/bin/env node
import assert from 'node:assert/strict'; import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { getEonCommercialDecisionTruth } from '../assets/js/commercial/eon-commercial-decision-gate.js';
import { W443_COMMERCIAL_DECISION_CONTRACT, validateW443CommercialDecisionContract } from '../config/w443-commercial-decision-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW443CommercialDecision() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const gate = read('assets/js/commercial/eon-commercial-decision-gate.js'); const truth = getEonCommercialDecisionTruth();
  check('required-files', ['assets/js/commercial/eon-commercial-decision-gate.js', 'config/w443-commercial-decision-contract.mjs', 'tests/unit/w443-commercial-decision.test.mjs'].every((file) => existsSync(path.join(root, file))), 'decision gate, contract and test exist');
  check('contract-valid', validateW443CommercialDecisionContract().length === 0 && W443_COMMERCIAL_DECISION_CONTRACT.wave === 'W443', 'commercial readiness remains held');
  check('all-areas-held', /'rewards'/.test(gate) && /'telegram'/.test(gate) && /'ads'/.test(gate) && /'payments'/.test(gate) && /'referrals'/.test(gate) && /'marketplace'/.test(gate) && /status: 'hold'/.test(gate), 'all commercial/provider areas have explicit prerequisites and a hold');
  check('activation-fail-closed', /commercial-decision-gate-not-cleared/.test(gate) && /activationAllowed: false/.test(gate) && /providerRequestCreated: false/.test(gate), 'activation request does not create a provider or entitlement action');
  check('no-network-or-financial-api', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|paymentRequest|navigator\.share/i.test(gate), 'decision gate contains no provider, payment or share call');
  check('truth-boundary', truth.rewardsLive === false && truth.telegramLive === false && truth.adsLive === false && truth.paymentsLive === false && truth.referralsLive === false && truth.marketplaceLive === false && truth.productionCommercialProof === false, 'source keeps every commercial claim off');
  return Object.freeze({ schema: 'eonapp.w443.commercial-decision-gate.v1', wave: 'W443', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['This is a decision hold, not an activation of ads, Telegram, rewards, payments, referrals or marketplace features.']) });
}
export function runW443CommercialDecisionGate({ writeArtifact = true } = {}) { const result = inspectW443CommercialDecision(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w443-commercial-decision-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW443CommercialDecisionGate(); process.stdout.write(`W443 commercial decision gate passed (${result.checkCount}/${result.checkCount}). All activations remain on hold.\n`); }
