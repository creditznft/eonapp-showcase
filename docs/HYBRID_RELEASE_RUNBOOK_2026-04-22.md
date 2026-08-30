# EONAPP.CH Hybrid Release Runbook

Date: 2026-04-22
Scope: browser-first production release with decentralized artifacts and optional Cloudflare mirror

---

## Release Model

This runbook operationalizes the chosen hybrid path:

- browser/local-first runtime truth
- Arweave immutable snapshot
- IPFS + IPNS mutable decentralized mirror
- Nostr and URL artifacts for social discovery
- Cloudflare Pages as optional fast mirror and rollback convenience

Core rule:
- gameplay truth stays in the client unless a narrowly scoped trust layer is explicitly enabled

---

## Preconditions

### Static launch gates

Run all four:

- `npm run launch:readiness`
- `npm run launch:check`
- `npm run launch:page-gate`
- `npm run launch:lootbox-gate`
- `npm run launch:identity-gate`

Expected result:
- all pass

### Arweave prerequisites

- funded Arweave keyfile available locally
- keyfile is not committed
- `@irys/sdk` installed when performing Arweave publish

### IPFS/IPNS prerequisites

- local IPFS CLI installed and working
- local daemon or configured IPFS environment available
- dedicated EONAPP.CH IPNS key created
- do not reuse the eonpackage IPNS key

Windows note:
- the current workstation must have `ipfs` on PATH before the publish script can run
- if `node scripts/deploy-ipfs-ipns.mjs --check` fails with `spawnSync ipfs ENOENT`, install Kubo first and reopen the terminal
- the deploy script now also checks the standard IPFS Desktop Kubo path on Windows, so a default IPFS Desktop install is sufficient even before PATH refreshes

Typical Windows setup:

```powershell
# example only; use your preferred Kubo install method
# then confirm the binary is on PATH
ipfs version
ipfs init
ipfs daemon
```

Create dedicated key:

```powershell
ipfs key gen --type=rsa --size=2048 eonapp-ch-site-key
```

Detailed Windows checklist:
- `docs/IPFS_IPNS_WINDOWS_SETUP_CHECKLIST_2026-04-22.md`

---

## Release Order

### Step 1 — Final local gate pass

```powershell
npm run launch:readiness
npm run launch:check
npm run launch:page-gate
npm run launch:lootbox-gate
npm run launch:identity-gate
```

### Step 2 — Publish immutable Arweave snapshot

Dry run first:

```powershell
npm run deploy:arweave -- --keyfile ./arweave-key.json --dry-run
```

Then real publish:

```powershell
npm run deploy:arweave -- --keyfile ./arweave-key.json
```

Result:
- `arweave-manifest.json` updated with latest TX ID and URLs

### Step 3 — Publish IPFS mirror and update IPNS pointer

Check environment first:

```powershell
npm run deploy:ipfs-ipns -- --check --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Optional dry run:

```powershell
npm run deploy:ipfs-ipns -- --dry-run --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Real publish:

```powershell
npm run deploy:ipfs-ipns -- --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Result:
- `.ipns-config/deployment-state.json` updated with latest IPFS hash and gateway URLs

Operational note:
- the deploy script now stages only the real static site payload before `ipfs add`; it does not add docs, tests, node_modules, backend folders, or other repository-only material

### Step 4 — Verify decentralized delivery

Verify:

- Arweave manifest URL resolves
- IPNS gateway URL resolves
- homepage loads
- flagship game routes load
- vault route loads

### Step 5 — Optional Cloudflare mirror publish

Use only if you want fast mirror delivery and easy rollback:

- push to `main`
- let `.github/workflows/deploy.yml` publish to Cloudflare Pages

This is a mirror path, not the product’s only runtime existence.

### Step 6 — Write reproducible release record

Run after Arweave and IPFS/IPNS artifacts both exist:

```powershell
npm run deploy:record-release -- --track hybrid --label rc1
```

Result:
- JSON + Markdown release records written under `docs/release-records/`

---

## Decision Rules

### Keep browser-only truth when feature needs only:

- local progression
- lootbox opening and collection display
- signed share URLs
- ghost/challenge browsing
- Nostr relay discovery
- vault export/import

### Consider Worker trust layer only when feature needs:

- anti-replay claims
- cross-device entitlement enforcement
- abuse throttling on a mutable reward surface
- server-signed receipts

If a feature does not clearly need those, do not centralize it.

---

## DNS and Gateway Guidance

Recommended first step:

- use a dedicated subdomain such as `p2p.eonapp.ch` for the IPNS path first
- keep apex routing decisions separate until the decentralized path is stable

Why:

- safer migration
- easy comparison between mirror paths
- avoids accidental reuse of old DNS assumptions

---

## Release Artifacts To Preserve

- `arweave-manifest.json`
- `.ipns-config/deployment-state.json`
- `docs/release-records/*.json`
- `docs/release-records/*.md`
- release commit SHA
- launch gate pass snapshot

---

## Recommended Operational Track Now

1. pass launch gates
2. publish Arweave snapshot
3. publish IPFS mirror and update IPNS
4. verify decentralized delivery
5. optionally publish Cloudflare mirror
6. write hybrid release record
7. record artifact URLs in launch dossier/status board

This keeps the release decentralized-first while preserving a practical mainstream mirror.