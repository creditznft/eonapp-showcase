# Deploy And CI Status

Status captured: 2026-06-26

## Current source state

- Baseline branch before this overlay: `codex/w250-w290-final-merge-20260625`
- Baseline commit before this overlay: `dd118b069144131c5ddc1bfe842fbe36ff7f540d`
- Current merge branch: `codex/w301-w358-merge-20260626`
- Current merge commit: `d77a78c6cfa388cb332fd07fa531d9f8761789e3`
- Baseline PR before this overlay: `https://github.com/creditznft/EONAPP/pull/2`
- Current PR for this overlay: `https://github.com/creditznft/EONAPP/pull/3`
- Current overlay state: compact W301-W358 handover applied and hash-verified on top of the W250-W290 baseline

## Local validation that passed before packaging

- `npm ci --include=dev --no-audit --no-fund`
- `npm run test:unit` with `279/279` passing
- `npm run lint -- --max-warnings=0`
- `npm run build`
- `npm run qa:current-static-certification:core`
- `npm run qa:current-static-certification:tail`
- `npm audit --omit=dev` with `0` vulnerabilities

## Current W301-W358 merge validation

- `npm ci --include=dev --no-audit --no-fund`
- `npm run qa:w358-w357-regression`
- `npm run lint -- --max-warnings=0`
- `node scripts/secret-scan.mjs --mode=workspace --allow-no-history`
- `npm run build`
- `npm run smoke:build`
- `npm run audit:site`
- `npm run launch:readiness`

Current results from this merge branch:

- W301-W358 focused regression: pass
- Lint: pass with zero warnings
- Workspace secret scan: pass
- Build: pass with `199` dist files
- Build smoke: pass
- Site audit: pass
- Launch readiness: pass
- Full `npm run test:unit`: still expected to fail on inherited archive/evidence blockers from the supplied base line

## GitHub CI status

The CI history scanner implementation was fixed so GitHub now scans real repository history instead of failing on a buffer limit.

Latest known CI result:

- Workflow: `CI`
- Run number: `159`
- Result: `failure`
- Failure stage: `Secret scan (whole tree and reachable git history)`

Reason for failure:

- Reachable Git history still contains secret-shaped values in older commits.
- Representative historical hits were reported in:
  - `tests/unit/w211-workspace-automation.test.mjs`
  - `docs/COPILOTHANDOVER.MD`
  - `docs/LAUNCH-CHECKLIST.md`

This is a real blocker, not a false CI error.

## Current live-AI status on this merge branch

The W358 operator-only harness was run against `C:\Users\credi\WORKSPACE\EONAPP.CH\.env.local`.

- Preflight: Groq, OpenRouter, Gemini, and Ollama were detected/configured truthfully
- Groq direct provider proof: pass
- Groq browser-backed local Chat proof on `http://127.0.0.1:4173`: pass
- Gemini direct provider proof: pass
- OpenRouter direct provider proof: warning due billing/credits (`HTTP 402`)
- Ollama direct provider proof: warning because the local runtime was not reachable

Safe evidence was written under `docs/qa/live-ai-v2/` with no raw keys, prompts, or provider outputs stored.

## Cloudflare status

- No successful Cloudflare Preview deployment has been completed from this branch snapshot.
- Local Wrangler auth was present but not usable on the packaging machine because account resolution failed.
- The preview workflow file exists in branch content, but preview dispatch was not green from this state.

## Truthful release decision

- Source merge: complete
- Local W301-W358 validation: green for the focused source lane
- Live AI: partially green
- GitHub branch + PR: pushed and opened as draft PR
- GitHub CI: not green yet
- Cloudflare Preview: not green yet
- Production deploy: not approved

## Recommended next technical move

Remediate the reachable Git history secret findings, then re-run CI, then re-attempt Preview deployment with valid Cloudflare credentials or account configuration.
