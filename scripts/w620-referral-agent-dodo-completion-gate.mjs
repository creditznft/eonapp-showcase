#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonCityAgentTheater, buildEonCityAgentTheaterStage, validateEonCityAgentTheater, validateEonCityAgentTheaterStage } from '../assets/js/city/eon-city-agent-theater.js';
import { validateEonCityCommandRoomModel, getEonCityCommandRoomModel, renderEonCityCommandRoomMarkup } from '../assets/js/city/eon-city-command-room.js';
import { renderEonCityAgentTheaterStage } from '../assets/js/city/eon-city-agent-theater.js';
import { summarizeEonKeyUnlockCoverage, validateEonKeysFeatureUnlockLedger } from '../assets/js/referrals/eon-keys-feature-unlock-ledger.js';
import { buildW620DodoOwnerChecklist, validateW620DodoDashboardSetupContract } from '../config/w620-dodo-dashboard-setup-contract.mjs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

export function inspectW620ReferralAgentDodoCompletionGate() {
  const errors = [];
  const theater = buildEonCityAgentTheater();
  const theaterValidation = validateEonCityAgentTheater(theater);
  const stage = buildEonCityAgentTheaterStage(theater);
  const stageValidation = validateEonCityAgentTheaterStage(stage);
  const renderedStage = renderEonCityAgentTheaterStage(stage);
  const room = getEonCityCommandRoomModel({ agentTheaterStage: renderedStage });
  const roomValidation = validateEonCityCommandRoomModel(room);
  const roomMarkup = renderEonCityCommandRoomMarkup(room);
  const unlockCoverage = summarizeEonKeyUnlockCoverage();
  const unlockValidation = validateEonKeysFeatureUnlockLedger();
  const dodoValidation = validateW620DodoDashboardSetupContract();
  const dodoChecklist = buildW620DodoOwnerChecklist();

  if (!theaterValidation.ok) errors.push(...theaterValidation.errors.map((error) => `Agent Theater foundation: ${error}`));
  if (!stageValidation.ok) errors.push(...stageValidation.errors.map((error) => `Agent Theater stage: ${error}`));
  if (!roomValidation.ok) errors.push(...roomValidation.errors.map((error) => `Command Room: ${error}`));
  if (!unlockValidation.ok) errors.push(...unlockValidation.errors.map((error) => `EON Keys unlock ledger: ${error}`));
  if (!dodoValidation.ok) errors.push(...dodoValidation.errors.map((error) => `Dodo setup: ${error}`));
  if (stage.laneCount < 6) errors.push('Agent Theater must have six practical lanes.');
  if (!roomMarkup.includes('data-eon-command-room-agent-stage')) errors.push('Command Room does not render the W620 Agent Theater stage.');
  if (!read('assets/css/eon-city-play.css').includes('.eon-command-room-agent-stage')) errors.push('City CSS missing W620 Agent Theater stage styling.');
  if (!read('assets/js/eon-city-play-station.js').includes('buildEonCityAgentTheaterStage')) errors.push('City station does not build W620 Agent Theater stage.');
  if (!unlockCoverage.directFeatureAndLimitUnlocks || unlockCoverage.subscriptionGrant) errors.push('Referral/EON Keys must resolve to direct feature unlocks, not subscription grants.');
  if (!unlockCoverage.coversPlusStudioPowerAndSelectedMax) errors.push('Referral/EON Keys coverage must include Plus, Studio, Power and selected Max equivalents.');
  if (!dodoChecklist.cloudflareSecrets.includes('DODO_WEBHOOK_SECRET')) errors.push('Dodo owner checklist missing webhook secret.');
  if (!dodoChecklist.webhookEventsToEnable.includes('subscription.active') || !dodoChecklist.webhookEventsToEnable.includes('payment.succeeded')) errors.push('Dodo checklist missing core subscription/payment events.');
  if (!read('config/w620-dodo-dashboard-setup-contract.mjs').includes('webhook-id') || !read('config/w620-dodo-dashboard-setup-contract.mjs').includes('webhook-signature')) errors.push('Dodo contract missing documented webhook id/signature headers.');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    schema: 'eonapp.w620.referral-agent-dodo-completion-gate.v1',
    checks: 38,
    agentStageLanes: stage.laneCount,
    unlockCount: unlockCoverage.unlockCount,
    dodoProducts: dodoChecklist.productsToCreate.length
  });
}

const report = inspectW620ReferralAgentDodoCompletionGate();
if (!report.ok) {
  console.error(`[W620] Referral/Agent/Dodo completion gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W620] Referral/Agent/Dodo completion gate passed (${report.checks}/38).`);
