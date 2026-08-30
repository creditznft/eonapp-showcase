#!/usr/bin/env node
/** W461.1 source gate: public probe remains opt-in, passive, privacy-safe and scope-safe. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createW461TelegramResearchProductionProofPlan, runW461TelegramResearchProductionProof } from './w461-telegram-research-production-proof.mjs';
import { W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT, validateW461TelegramResearchProductionProofContract } from '../config/w461-telegram-research-production-proof-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export async function inspectW461TelegramResearchProductionProof() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const script = read('scripts/w461-telegram-research-production-proof.mjs');
  const telegram = read('telegram.html');
  const telegramJs = read('assets/js/telegram-page.js');
  const research = read('trade.html');
  const routes = read('config/route-contract.mjs');
  const plan = createW461TelegramResearchProductionProofPlan({ origin: 'https://eonapp.example' });
  const dryRun = await runW461TelegramResearchProductionProof({ origin: 'https://eonapp.example', allowNetwork: false, fetchImpl: () => { throw new Error('network must not run in dry mode'); } });

  check('required-files', W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'proof runner, source gate, contract, test, current pages and route contract exist');
  check('contract-valid', validateW461TelegramResearchProductionProofContract().length === 0 && W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT.wave === 'W461.1', 'contract keeps the proof passive, public and non-certifying');
  check('https-dry-plan', plan.ok === true && plan.method === 'GET' && plan.redirect === 'manual' && plan.requestCookieIncluded === false && plan.botActionCreated === false, 'only an explicit HTTPS public origin creates a probe plan');
  check('dry-run-never-fetches', dryRun.ok === true && dryRun.status === 'dry-run' && dryRun.networkRequestCreated === false && dryRun.liveProductionProof === false, 'default mode cannot make a request or issue production proof');
  check('telegram-page-boundary', /Telegram helps you return to EONAPP/.test(telegram) && /No ads, rewards or provider SDKs/.test(telegram) && /https:\/\/t\.me\/EonAppsBot\?start=web/.test(telegram) && !/startapp=rewards|reward-access|telegram\.org\/js\/telegram-web-app\.js/.test(telegram + telegramJs), 'active Telegram page is optional onboarding/help/updates/deep-links without a reward route or SDK');
  check('research-page-boundary', /Research Lab/.test(research) && /No live price feed/.test(research) && /No orders/.test(research) && /not personal investment advice/.test(research), 'active Research Lab states its local-only non-order/non-advice boundary');
  check('route-contract-boundary', /id: 'telegram'/.test(routes) && /id: 'insights'/.test(routes) && /from: '\/trade', to: '\/insights', status: 301/.test(routes) && /from: '\/telegram\/index\.html', to: '\/telegram', status: 301/.test(routes), 'route contract keeps optional Telegram and Research Lab current while legacy paths redirect');
  check('no-sensitive-request-primitives', !/Authorization|Bearer\s+|document\.cookie|localStorage\.(?:get|set|remove)Item|sessionStorage\.(?:get|set|remove)Item|Telegram\.WebApp|api\.telegram\.org|POST|PUT|PATCH|DELETE/.test(script), 'runner uses no credentials, browser storage, Telegram API/session, or mutating request primitive');
  check('body-not-stored', /bodySha256/.test(script) && /responseBodyStored: false/.test(script) && !/\b(?:responseBody|responseText|html|publicBody)\s*:/.test(script), 'runner records only public response metadata/hash and never persists body text');
  check('no-live-certification', /liveProductionProof: false/.test(script) && /humanVisualReviewRequired: true/.test(script), 'source cannot replace browser, Telegram, device, accessibility or human visual evidence');
  return Object.freeze({
    schema: 'eonapp.w461.telegram-research-production-proof-gate.v1', wave: 'W461.1', status: 'pass', sourceOnly: true,
    checkCount: checks.length, checks: Object.freeze(checks),
    limitations: Object.freeze([
      'Run the public-edge probe only after the intended deployment using --origin=https://eonapp.ch --allow-network.',
      'A passing probe does not prove Telegram Mini App behavior, bot/session state, human visual review, browser/device behavior, Research Lab interaction, accessibility, or release readiness.'
    ])
  });
}

export async function runW461TelegramResearchProductionProofGate({ writeArtifact = true } = {}) {
  const result = await inspectW461TelegramResearchProductionProof();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w461-telegram-research-production-proof-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runW461TelegramResearchProductionProofGate();
  process.stdout.write(`W461.1 Telegram/Research public-proof source gate passed (${result.checkCount}/${result.checkCount}). No Telegram action, reward, order or live certification was created.\n`);
}
