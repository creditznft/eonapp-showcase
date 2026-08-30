# Smart Contract Automation Runbook

## Locked decisions

- Use dedicated operator contracts for reward publishing, referral publishing, and loot configuration.
- Keep community governance disabled at launch.
- Keep Dilithium policy recommended, not required, at launch.
- Do not add automatic treasury `EON -> POL` or `EON -> USD -> POL` swap logic before mainnet.

## Why no launch auto-swap

- Native gas on Polygon must be paid in POL before the transaction executes.
- A contract cannot wake itself up and pay its own gas without an externally submitted transaction.
- Auto-swap would add DEX router approvals, slippage controls, oracle or quoting risk, and treasury-drain risk at the exact point where the admin surface should stay smallest.

Safe launch stance:

- use one dedicated automation runner wallet
- keep a small POL float in that runner wallet
- let the runner execute recurring operator actions
- optionally let a runner execute public settlement calls and keep the EON caller incentive for operational accounting

## Amoy actions already waiting on timelock

Approved standard manifest:

- `deployment-manifests/postdeploy-config-amoy-live.json`

Approved quantum manifest:

- `deployment-manifests/quantum-policy-amoy-live.json`

These were already approved on-chain and only need execution after the 48-hour delay has passed.

## Exact execution commands after the 48-hour delay

Run from `EONAPP.CH/Smart Contracts`.

Standard post-deploy manifest:

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D"
$env:ACTION_MANIFEST_FILE="deployment-manifests/postdeploy-config-amoy-live.json"
$env:COUNCIL_MEMBER_PRIVATE_KEY="0x<one funded council private key>"
npx hardhat run scripts/execute-council-actions.js --network amoy
```

Quantum policy manifest:

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x8801d584fe9E7Aed7415036811B5e1Ce4C3FfC2D"
$env:ACTION_MANIFEST_FILE="deployment-manifests/quantum-policy-amoy-live.json"
$env:COUNCIL_MEMBER_PRIVATE_KEY="0x<one funded council private key>"
npx hardhat run scripts/execute-council-actions.js --network amoy
```

## Operator deployment flow

Deploy the operator contracts first:

```powershell
Set-Location "C:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:SECURITY_COUNCIL="0x<security-council-address>"
$env:EMISSION="0x<emission-controller-address>"
$env:PROOF_HUB="0x<proof-hub-address>"
$env:DISTRIBUTOR="0x<rewards-distributor-address>"
$env:REFERRAL_LEDGER="0x<referral-ledger-address>"
$env:LOOT="0x<loot-address>"
$env:AUTOMATION_RUNNER="0x<dedicated-runner-wallet>"
npx hardhat run scripts/deploy-operator-contracts.js --network amoy
```

Then feed the deployed addresses into `grant-roles.js` as:

- `REWARD_PUBLISHER=<rewardOperator>`
- `REFERRAL_PUBLISHER=<referralOperator>`
- `LOOT_OPERATOR=<lootOperator>`

## Cadence policy

Initial production cadence:

- reward epoch planning: every 24 hours
- reward root publication per domain: every 24 hours
- distributor epoch config per domain: every 24 hours
- referral evidence anchoring: every 24 hours
- referral batch publication: every 24 hours
- loot signer rotation: disabled until needed
- loot base URI rotation: disabled until needed
- loot contract URI rotation: disabled until needed

CEO decision:

- interval controls belong on recurring reward/referral publication
- loot configuration is event-driven, not timer-driven, so only sensitive metadata rotations get optional cadence throttles

## Community-first execution stance

Primary launch posture:

- let the community trigger what can be triggered publicly
- keep operator executors as the fallback and recovery path
- pay users with the on-chain caller incentive plus local Pool Points and lootbox streak rewards where that frontend path already exists

That means:

- reward operator public execution should stay enabled for the safe recurring actions
- referral operator should publish with public execution enabled after cadence controls are in place
- loot operator should expose `setBaseURI` publicly with cadence protection so the metadata pointer can be rotated without waiting on a private executor in low-risk situations
- signer rotation should stay executor-first unless there is a strong reason to open it publicly

## Missing policy manifests now closed at the script layer

New proposal helpers exist for the remaining operators:

- `scripts/propose-referral-operator-policy.js`
- `scripts/propose-loot-operator-policy.js`

Recommended usage order after roles are active:

1. propose referral operator cadence/public execution policy
2. propose loot operator cadence/public execution policy
3. after timelock clears, execute all manifests
4. immediately rotate the loot base URI to live IPFS/IPNS metadata

## Recovery-stack port direction

The target app is not a React app. The current live recovery surface is the static browser wallet plus vault export/import helpers in `assets/js/utils/wallet.js` and `assets/js/utils/vault.js`.

That means the recovery migration should be phased:

1. Extend the existing local wallet backup/export/import path in `assets/js/utils/vault.js`.
2. Port encrypted local storage primitives in a browser-only form.
3. Port optional P2P/IPFS backup hooks after the local path is stable.
4. Port quantum wallet and recovery UX only after the local backup path is proven.

Already applied in this session:

- `assets/js/utils/vault.js` now avoids large-export base64 spread overflows and requires a stronger minimum passphrase for new encrypted exports.

Do not copy the full `eonpackage` React service layer into EONAPP.CH unchanged. The runtime model is different.