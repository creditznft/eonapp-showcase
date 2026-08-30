# CEO Roadmap Checklist

Date: 2026-04-30
Scope: EONAPP.CH after the latest re-audit
Status: active execution board

## Audit Result Snapshot

- Rewarded monetization: live via central Monetag smartlink
- Vault offline path: already precached and local-first
- Community-trigger settlement lane: live in frontend and aligned with operator philosophy
- Smart contract governance: approved manifests waiting on timelock
- Games portfolio: strong base, uneven integration maturity
- Tools: deferred

## CEO Decisions Locked

1. Games remain the primary product.
2. Tools stay deferred unless they can match game-like retention and monetization.
3. Community-trigger execution is the preferred path for safe public actions.
4. Operators remain the fallback path, not the first line.
5. Loot metadata activation happens immediately after `CONFIG_ROLE` is live.

## P0 This Week

- [ ] Execute all approved manifests when the delay expires
- [ ] Run Amoy verification for the deployed contracts
- [ ] Propose referral operator cadence/public execution manifest
- [ ] Propose loot operator cadence/public execution manifest
- [ ] Prepare the exact live base URI string for loot metadata rotation

## P1 Frontend Product Work

- [ ] Normalize all 7 flagship games to the same integration standard as Neon Dungeon
- [ ] Add rewarded ad runtime to the games still missing it
- [ ] Add subscription benefit handling to the games still missing it
- [ ] Add NFT-ready trophy mapping for each flagship game
- [ ] Remove stale tools-first wording from remaining site/docs surfaces

## P1 Community Trigger Work

- [ ] Keep settlement trigger visible in the vault as the public gas-paid action
- [ ] Extend public operator action docs so community execution is explicit, not implied
- [ ] Decide which reward operator actions remain public at launch and which stay executor-only
- [ ] Keep loot signer rotation executor-only unless launch needs change

## P2 Games Upgrade Order

1. Dungeon Crawl Zero
2. Neural Override
3. Realm Wars Lite
4. CyberRogue
5. Neon Conquest
6. Alchemy Ascension
7. Neon Dungeon trophy/NFT polish

Reason:

- this order closes the biggest monetization and platform gaps first

## P2 IPFS / Release Work

- [ ] Confirm Kubo daemon + dedicated EONAPP.CH IPNS key on this machine
- [ ] Decide whether first live release is hybrid or Cloudflare-assisted hybrid
- [ ] Confirm vault backup hook behavior against the real local node once Kubo is running
- [ ] Record release state after first publish

## P3 Strategic Advice

### Stay with games if:

- the goal is maximum retention
- the goal is stronger ad + subscription lifetime value
- the goal is easier season, reward, loot, and referral loops

### Bring tools back only if:

- they are challengeable, repeatable, and habit-forming
- they feed subscriptions or rewards cleanly
- they do not distract the team from flagship game quality

## Next Commands

### Verify readiness now

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH"
npm run launch:readiness
```

### Propose referral operator policy

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D"
$env:REFERRAL_OPERATOR="0xD76B80ed444d861323463B1975d287940E5A168E"
npx hardhat run scripts/propose-referral-operator-policy.js --network amoy
```

### Propose loot operator policy

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D"
$env:LOOT_OPERATOR="0xB81877E90A784a0eF67f7d02579c5c99b23fDa50"
npx hardhat run scripts/propose-loot-operator-policy.js --network amoy
```

### Execute all manifests after delay

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D"
npx hardhat run scripts/execute-all-manifests.js --network amoy
```