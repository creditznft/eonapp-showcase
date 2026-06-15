# Reward Safety Model

This is one of the most important public design boundaries in EONAPP.

## Rewarded ads

Verified rewarded ads are the real account-wide reward path. They should rely on provider proof, postback confirmation, or another verifiable signal before any durable value is granted.

## Direct Link

Direct Link must stay user-tap only. It can create a local soft Sponsor Boost effect, but it must not masquerade as verified paid entitlement.

## MultiTag

MultiTag is off by default. A user may opt into it for extra earning opportunity, and the same user must be able to turn it back off cleanly.

## Sensitive-route blocking

Sponsor Boost and similar ad-heavy surfaces should stay blocked on:

- billing
- legal
- privacy
- support
- admin
- payment
- backup
- Vault secret-management surfaces

## User promise

The product should never make the user wonder whether an ad click quietly unlocked something permanent. Permanent or account-wide value needs verified proof.
