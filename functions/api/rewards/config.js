import { jsonResponse } from '../../_shared/eon-auth.js';
import { EON_REWARD_PRIMARY_PROVIDER, EON_REWARD_RULES, EON_REWARD_SCHEMA, publicRewardUnlocks } from '../../../config/rt98-reward-center-contract.mjs';
import { publicMyLeadConfig } from './_providers.js';
import { requireRewardSession } from './_auth.js';

export async function onRequestGet(context) {
  const auth = await requireRewardSession(context);
  if (auth.response) return auth.response;
  return jsonResponse({
    ok: true,
    schema: EON_REWARD_SCHEMA,
    primaryProvider: EON_REWARD_PRIMARY_PROVIDER,
    rules: EON_REWARD_RULES,
    providers: [publicMyLeadConfig(context.env)],
    unlocks: publicRewardUnlocks(),
    privacy: {
      privateChatForwarded: false,
      localAiForwarded: false,
      byokForwarded: false,
      filesForwarded: false,
      browserCompletionCreatesReward: false
    }
  });
}
