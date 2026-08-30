import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_REWARDED_PROVIDER_ADAPTERS, validateRewardedProviderContract } from '../config/rt97-rewarded-provider-contract.mjs';
import { EON_DISPLAY_AD_PROVIDERS, validateEonMonetizationPolicy } from '../assets/js/monetization/eon-monetization-policy.js';
import { validateRewardedSponsorRuntimeContract } from '../functions/_shared/eon-rewarded-sponsor-runtime.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const errors = [];
const provider = validateRewardedProviderContract();
const policy = validateEonMonetizationPolicy();
const runtime = validateRewardedSponsorRuntimeContract();
if (!provider.ok) errors.push(...provider.errors.map((e) => `provider:${e}`));
if (!policy.ok) errors.push(...policy.errors.map((e) => `policy:${e}`));
if (!runtime.ok) errors.push(...runtime.errors.map((e) => `runtime:${e}`));

const exo = EON_REWARDED_PROVIDER_ADAPTERS.exoclick;
const vast = EON_DISPLAY_AD_PROVIDERS.exoclick.zones.sponsorVast;
if (exo.providerSignedCompletion !== false) errors.push('exoclick-must-not-claim-provider-signed-completion');
if (exo.rewardClass !== 'bounded-sponsor-unlock' || exo.permanentValueAllowed !== false) errors.push('exoclick-reward-class-must-remain-bounded');
if (exo.clientCompletionCanMint !== false) errors.push('browser-completion-must-not-mint');
if (vast.zoneId !== '6004002' || !vast.vastTag.includes('ex_av=2') || !vast.vastTag.includes('block_ad_types=101')) errors.push('exoclick-vast-sfw-drift');

const eventRoute = read('functions/api/monetization/rewarded/event.js');
const serverRuntime = read('functions/_shared/eon-rewarded-sponsor-runtime.js');
if (!/canRewardedProviderMint\(config\.provider, config\.rewardClass\)/.test(serverRuntime)) errors.push('server-mint-authority-recheck-missing');
if (!/EON_REWARDED_EVENT_ORDER\.every/.test(serverRuntime) || !/reward_completion_too_early/.test(serverRuntime)) errors.push('server-vast-sequence-proof-missing');
if (!/rewarded_completion_verified/.test(eventRoute) || !/rewarded_reward_granted/.test(eventRoute)) errors.push('rewarded-operational-telemetry-missing');

const receipt = Object.freeze({
  schema: 'eonapp.rewarded.assurance.rt97.v1',
  status: errors.length ? 'fail' : 'pass',
  provider: 'exoclick',
  zoneId: vast.zoneId,
  completionAssurance: exo.completionAssurance,
  providerSignedCompletion: false,
  rewardClass: exo.rewardClass,
  permanentValueAllowed: false,
  clientCompletionCanMint: false,
  externalEvidenceBoundary: 'VAST tracking callbacks are playback tracking, not a signed provider reward attestation; permanent-value rewards remain prohibited.',
  errors
});
console.log(JSON.stringify(receipt, null, 2));
if (errors.length) process.exitCode = 1;
