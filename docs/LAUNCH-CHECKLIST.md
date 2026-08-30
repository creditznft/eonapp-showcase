# EONAPP.CH — Simple Human Launch Checklist
*Beginner-friendly. Do each step in order. Do not skip.*  
*Last updated: 2026-04-29 after full audit + 120/120 tests passing.*

---

## AUDIT STATUS (as of this file)
| Item | Status |
|------|--------|
| Smart contract tests (120 total) | ✅ 120/120 passing |
| Contract compilation | ✅ Clean — Nothing to compile |
| All 5 token metadata CIDs pinned locally | ✅ All OK |
| Collection contract.json CID pinned | ✅ OK |
| IPNS key resolves to correct root | ✅ `/ipfs/Qmc1w8QKwfGwyU1bP3tj4iAMCHN4u8ayFUK7y1zMTTErB2` |
| launch-tokens.json — all 5 tokens with real ipfs:// URIs | ✅ Complete |
| Deploy scripts (10 scripts) | ✅ All present and complete |
| `.env` file for testnet | ❌ NOT YET CREATED — you must do this |
| authorizedOpenSigner | ⏳ Blank — needed before box sales go live |
| boxConfig (paymentToken/treasury) | ⏳ Blank — fill after deploy addresses known |

---

## PHASE 1 — PREPARE YOUR WALLET (DO THIS FIRST)

### Step 1 — Create a deployer wallet
> The deployer wallet ONLY pays gas. It does not have admin powers.

1. Open MetaMask (or any wallet)
2. Create a new wallet or use an existing one
3. Write down the **private key** (starts with `0x...`) — you'll need it in Step 3
4. **Keep this private key secret — never share it, never commit it to git**

### Step 2 — Get testnet MATIC (Amoy testnet gas)
> This is free test money — not real MATIC.

1. Go to: **https://faucet.polygon.technology**
2. Connect your wallet or paste your deployer address
3. Select **Amoy testnet**
4. Request MATIC — you'll receive ~0.5–2 MATIC
5. Wait 1–2 minutes for it to arrive
6. Confirm balance at: **https://amoy.polygonscan.com** (search your address)

> You also need at least **1 council member wallet** funded with Amoy MATIC.  
> One of the 10 admin wallets must sign governance actions after deploy.  
> Use the same faucet for a council wallet too.

---

## PHASE 2 — SET UP YOUR ENVIRONMENT

### Step 3 — Create the `.env` file

1. Open a terminal in `EONAPP.CH/Smart Contracts/`
2. Copy the example file:
   ```
   copy .env.example .env
   ```
3. Open `.env` in a text editor
4. Fill in these values:

```
PRIVATE_KEY: paste the deployer private key here, including the 0x prefix

COUNCIL_MEMBER_PRIVATE_KEY: paste one of the 10 admin private keys here, including the 0x prefix

AMOY_RPC_URL: https://rpc-amoy.polygon.technology

POLYGON_RPC_URL: https://polygon-rpc.com

POLYGONSCAN_API_KEY: paste your Polygonscan API key here
```

> Everything else in `.env.example` is already filled with the correct defaults.  
> The `SECURITY_COUNCIL_MEMBERS` list is already set to all 10 admin wallets.  
> The `LOOT_BASE_URI` is already set to the correct IPNS URL.

5. Save the file. Do NOT commit it to git.

---

## PHASE 3 — TESTNET DEPLOY (AMOY)

### Step 4 — Deploy all 12 contracts to Amoy testnet

Open a terminal in `EONAPP.CH/Smart Contracts/` and run:

```bash
npx hardhat run scripts/deploy-lite-stack.js --network amoy
```

This takes about 2–5 minutes.  
When it finishes, you'll see output like:

```
network: amoy
deployer: 0xYOUR_ADDRESS
securityCouncil: 0xSECURITY_COUNCIL_ADDRESS
registry: 0xREGISTRY_ADDRESS
token: 0xTOKEN_ADDRESS
proofHub: 0xPROOF_HUB_ADDRESS
...
loot: 0xLOOT_ADDRESS
```

**COPY ALL THOSE ADDRESSES into your `.env` file:**
```
SECURITY_COUNCIL=0x...
REGISTRY=0x...
TOKEN=0x...
PROOF_HUB=0x...
EMISSION=0x...
TREASURY_VAULT=0x...
LIQUIDITY_VAULT=0x...
RESERVE_VAULT=0x...
DISTRIBUTOR=0x...
SETTLEMENT=0x...
REFERRAL_LEDGER=0x...
QUANTUM_REGISTRY=0x...
LOOT=0x...
ADMIN_CONTRACT=0x...  ← (same as SECURITY_COUNCIL)
```

Also write down the role grantees (listed at the end of the deploy output):
```
REWARD_PUBLISHER=0x...
REFERRAL_PUBLISHER=0x...
LOOT_OPERATOR=0x...
```
> For testnet these can be your deployer address or any test address.

---

### Step 5 — Propose role grants via the council

Run:
```bash
npx hardhat run scripts/grant-roles.js --network amoy
```

This will create a file `deployment-manifests/role-grants-amoy.json` with all the proposed action IDs.

---

### Step 6 — Get 6 council members to approve (testnet shortcut)

For testnet, if you control multiple wallets, you need to approve 6 times.  
For each council member wallet you have access to:

```bash
COUNCIL_MEMBER_PRIVATE_KEY=REDACTED_WALLET_PLACEHOLDER \
npx hardhat run scripts/approve-council-actions.js --network amoy
```

Repeat with 6 different `COUNCIL_MEMBER_PRIVATE_KEY` values.

> The standard threshold is 6/10. If you only have 1 wallet for testnet,  
> deploy with `SECURITY_COUNCIL_MEMBERS=0xYOUR_SINGLE_WALLET` and  
> `COUNCIL_STANDARD_THRESHOLD=1` in `.env` for quick testing.  
> **Reset these to production values before mainnet!**

---

### Step 7 — Execute the approved role grants

```bash
npx hardhat run scripts/execute-council-actions.js --network amoy
```

Wait 48h if using production delays, or set `COUNCIL_STANDARD_DELAY=0` for testnet only.

---

### Step 8 — Propose post-deploy configuration

```bash
npx hardhat run scripts/propose-postdeploy-config.js --network amoy
```

Then repeat Steps 6–7 (approve + execute) for these new actions.

---

### Step 9 — Propose loot launch configuration

```bash
npx hardhat run scripts/propose-loot-launch-config.js --network amoy
```

This reads `loot/launch-tokens.json` and configures all 5 official launch tokens on-chain.  
Then repeat Steps 6–7 (approve + execute).

---

### Step 10 — Verify contracts on Amoy explorer (optional but recommended)

```bash
npx hardhat run scripts/verify-contracts.js --network amoy
```

This makes contract source code visible on `https://amoy.polygonscan.com`.  
Requires `POLYGONSCAN_API_KEY` to be set.

---

### Step 11 — Verify testnet is working

1. Go to: **https://amoy.polygonscan.com**
2. Search for your `LOOT` contract address
3. Click "Contract" → "Read Contract"
4. Call `uri(101)` — should return: `ipfs://Qmcw8y3t48ubqzc5ErxsNUVRt2VLk1TbrYJ3XJx8NMxz2Y`
5. Call `uri(102)` — should return: `ipfs://QmXRVunxkKhGRyhJ6mfQnvDo22JvoyAwzq8TyUvJJXTAag`
6. Verify the `SECURITY_COUNCIL` contract shows 10 members

> If loot launch config hasn't been executed yet (because of 48h delay), `uri()` will  
> return the IPNS gateway URL instead of the per-token URI. That's expected.

---

## PHASE 4 — BEFORE MAINNET (IMPORTANT SECURITY STEPS)

### Step 12 — Set the authorized box-open signer

Before you enable paid loot box purchases:

1. Create a backend wallet that your server controls (NOT one of the 10 admin wallets)
2. Set its address in `loot/launch-tokens.json`:
   ```json
   "authorizedOpenSigner": "0xYOUR_BACKEND_SIGNER_ADDRESS"
   ```
3. Re-run `propose-loot-launch-config.js` to push this change on-chain

> Until this is set, users cannot open loot boxes. It's safe to launch without it  
> if you're not enabling paid box sales yet.

### Step 13 — Confirm all 10 admin wallets have real private key access

1. Have each admin confirm they can sign a test message with their wallet
2. Do NOT proceed to mainnet until at least 6 of the 10 wallets are confirmed accessible
3. Store `admin-keys.json` on hardware-encrypted storage — NEVER commit it to git

### Step 14 — Renounce deployer admin rights (if applicable)

If the deployer wallet was given any admin roles during testing:
```bash
npx hardhat run scripts/renounce-admin.js --network polygon
```

---

## PHASE 5 — MAINNET DEPLOY (POLYGON)

### Step 15 — Fund deployer with real MATIC

1. Buy or transfer at least **0.5 MATIC** to your deployer wallet on Polygon mainnet
2. Also fund at least **1 council member** with real MATIC for governance actions
3. Check balance at: **https://polygonscan.com** (search your address)

### Step 16 — Deploy to Polygon mainnet

```bash
npx hardhat run scripts/deploy-lite-stack.js --network polygon
```

Same output as testnet. Copy all addresses into `.env` (updating testnet addresses with mainnet ones).

### Steps 17–21 — Repeat Steps 5–9 on `--network polygon`

Everything is identical to testnet except:
- `--network amoy` becomes `--network polygon`
- The 48h timelock delays are REAL — plan accordingly
- All 6/10 council approvals must come from real wallet holders

---

## PHASE 6 — DOMAIN SETUP

### Step 22 — Point eonapp.ch to Cloudflare Pages

1. Log into your **Hostinger** account
2. Go to DNS settings for `eonapp.ch`
3. Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| CNAME | `@` | `your-project.pages.dev` |
| CNAME | `www` | `your-project.pages.dev` |

4. In Cloudflare Pages dashboard → your project → Settings → Custom Domains
5. Add `eonapp.ch` and `www.eonapp.ch`
6. Wait up to 24h for DNS to propagate

### Step 23 — Set up eonlite.u (Unstoppable Domains)

1. Log into **Unstoppable Domains**
2. Find your `eonlite.u` domain
3. Go to Manage → Website
4. Set: **Redirect URL** = `https://eonapp.ch`
5. Save and confirm

> This makes `eonlite.u` redirect users to your main site in supporting browsers.

---

## PHASE 7 — IPFS/IPNS MAINTENANCE

### Step 24 — Keep IPFS Desktop running

- IPFS Desktop must be running for your local IPNS record to be discoverable
- The dedicated key: `eonapp-ch-site-key` (ID: `k2k4r8lu0s69o8w5xalwwnlcnr7pdyfvxeimp81rohru4zc5gxzmiktd`)
- Current root CID: `Qmc1w8QKwfGwyU1bP3tj4iAMCHN4u8ayFUK7y1zMTTErB2`

### Step 25 — How to update metadata in the future

If you need to update token images or metadata:

1. Edit the relevant file in `loot/` (e.g. `loot/101.json`)
2. Pin the updated file:  
   `ipfs add loot/101.json`  — note the NEW CID
3. Update `launch-tokens.json` with the new `metadataUri`
4. Re-run `propose-loot-launch-config.js` to push the change on-chain (needs 6/10 council approval)
5. Re-publish the full site to IPNS:  
   `node scripts/deploy-ipfs-ipns.mjs --config .ipns-config/eonapp-ch-ipns-config.local.json`

---

## QUICK REFERENCE — All Commands in Order

```bash
# 0. Terminal location for ALL smart contract commands:
cd "EONAPP.CH/Smart Contracts"

# 1. Create and fill .env (see Step 3 above)
copy .env.example .env

# 2. Deploy all 12 contracts
npx hardhat run scripts/deploy-lite-stack.js --network amoy

# 3. Propose role grants (write addresses to .env first!)
npx hardhat run scripts/grant-roles.js --network amoy

# 4. Approve (repeat with 6 different council wallets)
COUNCIL_MEMBER_PRIVATE_KEY=0x... npx hardhat run scripts/approve-council-actions.js --network amoy

# 5. Execute approved actions
npx hardhat run scripts/execute-council-actions.js --network amoy

# 6. Propose post-deploy config
npx hardhat run scripts/propose-postdeploy-config.js --network amoy

# 7. Approve + execute (same as steps 4-5)

# 8. Propose loot launch config
npx hardhat run scripts/propose-loot-launch-config.js --network amoy

# 9. Approve + execute (same as steps 4-5)

# 10. Verify on explorer
npx hardhat run scripts/verify-contracts.js --network amoy

# ── Repeat steps 2-10 with --network polygon for mainnet ──
```

---

## TESTNET SHORTCUT (FOR SOLO TESTING WITH 1 WALLET)

If you want to test everything quickly with just one wallet and no 48h delays,
add these to your `.env` **for testnet only**:

```
# Only 1 member needed for quick solo test
SECURITY_COUNCIL_MEMBERS=0xYOUR_SINGLE_TEST_WALLET
COUNCIL_STANDARD_THRESHOLD=1
COUNCIL_QUANTUM_THRESHOLD=1
COUNCIL_EMERGENCY_THRESHOLD=1
COUNCIL_STANDARD_DELAY=0
COUNCIL_QUANTUM_DELAY=0
COUNCIL_EMERGENCY_DELAY=0
```

**⚠️ CHANGE BACK TO PRODUCTION VALUES BEFORE MAINNET:**
```
SECURITY_COUNCIL_MEMBERS=0xf0DbE...,0x84fB...,0x8fBb...,0x82A1...,0x81c3...,0xD5CE...,0x782C...,0xa078...,0x108c...,0xcdD3...
COUNCIL_STANDARD_THRESHOLD=6
COUNCIL_QUANTUM_THRESHOLD=8
COUNCIL_EMERGENCY_THRESHOLD=8
COUNCIL_STANDARD_DELAY=172800
COUNCIL_QUANTUM_DELAY=172800
COUNCIL_EMERGENCY_DELAY=0
```

---

## WHAT YOU CANNOT AUTOMATE (MUST DO YOURSELF)

| Task | Where |
|------|-------|
| Create `.env` with your private keys | `Smart Contracts/.env` |
| Get testnet MATIC | https://faucet.polygon.technology |
| Fund council wallets with real MATIC | Exchange or wallet transfer |
| Approve council actions (requires real key holders) | Run approve script for each signer |
| Point DNS in Hostinger | Hostinger DNS panel |
| Set eonlite.u redirect | Unstoppable Domains dashboard |
| Confirm 10 admin wallets are accessible | Contact each key holder |
| Set `authorizedOpenSigner` when backend signer is ready | Edit `loot/launch-tokens.json` |

---

*Built with: Hardhat, Solidity 0.8.24, Polygon/Amoy, IPFS Kubo, Cloudflare Pages*
