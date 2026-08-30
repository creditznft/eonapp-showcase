import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReferralAttribution } from '../../assets/js/referrals/eon-referral-program-w629.js';

test('W629A accepts only signed one-level attribution and rejects self or multi-level referral', () => {
  assert.equal(validateReferralAttribution({ inviterAccountId: 'inviter', inviteeAccountId: 'invitee', inviterReferralId: 'ref-1', tokenVerified: true, inviterProofVerified: true }).ok, true);
  assert.equal(validateReferralAttribution({ inviterAccountId: 'same', inviteeAccountId: 'same', inviterReferralId: 'ref-1', tokenVerified: true, inviterProofVerified: true }).errors.includes('self-referral-rejected'), true);
  assert.equal(validateReferralAttribution({ inviterAccountId: 'a', inviteeAccountId: 'b', inviterReferralId: 'ref-1', tokenVerified: true, inviterProofVerified: true, referralDepth: 2 }).errors.includes('multi-level-referral-prohibited'), true);
});
