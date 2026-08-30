# EONAPP.CH IPFS/IPNS Windows Setup Checklist

Date: 2026-04-22
Scope: local Windows setup for decentralized release track

---

## Goal

Make this machine capable of running:

- `npm run deploy:ipfs-ipns -- --check`
- `npm run deploy:ipfs-ipns -- --config .ipns-config/eonapp-ch-ipns-config.example.json`

without reusing the old eonpackage IPNS key.

---

## 1. Install Kubo IPFS on Windows

Recommended approach:

1. Download the latest Windows Kubo release from the official IPFS Kubo GitHub releases page.
2. Extract it to a stable local folder such as `C:\Users\credi\.ipfs-bin\kubo`.
3. Add that folder to your Windows `PATH`.
4. Close and reopen PowerShell.

Verify:

```powershell
ipfs version
```

Expected:
- command resolves successfully

---

## 2. Initialize Local IPFS Repo

Run:

```powershell
ipfs init
```

Expected:
- local repo created under your user profile

---

## 3. Start the Local IPFS Daemon

Run:

```powershell
ipfs daemon
```

Expected:
- daemon stays running in that terminal

Use a second terminal for deployment commands.

---

## 4. Create a Dedicated EONAPP.CH IPNS Key

Do not reuse the eonpackage key.

Run:

```powershell
ipfs key gen --type=rsa --size=2048 eonapp-ch-site-key
ipfs key list -l
```

Expected:
- `eonapp-ch-site-key` appears in the key list

---

## 5. Fill EONAPP.CH IPNS Config

Open:

- `.ipns-config/eonapp-ch-ipns-config.example.json`

Replace:

- `replace-with-new-eonapp-ipns-key-id`
- `replace-with-ipns-key-id.ipns.dweb.link`

Recommended first DNS path:

- use `p2p.eonapp.ch` before moving any apex traffic

---

## 6. Run EONAPP.CH Preflight

Run:

```powershell
npm run deploy:ipfs-ipns -- --check --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Expected:
- config loads
- `ipfs version` works
- `eonapp-ch-site-key` is found

---

## 7. First Dry Run

Run:

```powershell
npm run deploy:ipfs-ipns -- --dry-run --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Expected:
- planned `ipfs add` and `ipfs name publish` commands shown

---

## 8. First Real Publish

Run:

```powershell
npm run deploy:ipfs-ipns -- --config .ipns-config/eonapp-ch-ipns-config.example.json
```

Expected:
- IPFS hash generated
- IPNS pointer updated
- `.ipns-config/deployment-state.json` written locally

---

## 9. Verify Gateway Access

Open the generated gateway URLs from `.ipns-config/deployment-state.json`.

Confirm:

- homepage loads
- flagship game routes load
- vault route loads

---

## 10. Record Release State

After Arweave publish and IPFS/IPNS publish both exist, run:

```powershell
node scripts/record-hybrid-release.mjs --track hybrid --label rc1
```

Expected:
- JSON and Markdown release records created under `docs/release-records/`

---

## Hard Rules

- no reuse of the old app IPNS key
- no publish without launch gates passing first
- no assumption that Cloudflare is required for the decentralized track
- keep the browser as runtime truth unless a narrowly scoped trust layer is explicitly needed