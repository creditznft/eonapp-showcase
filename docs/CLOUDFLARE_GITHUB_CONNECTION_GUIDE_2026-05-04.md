# EONAPP.CH GitHub -> Cloudflare Pages Connection Guide (2026-05-04)

## Current Root Cause
Your latest deploy failed because GitHub Actions could not find this secret:
- `CLOUDFLARE_API_TOKEN`

The workflow is already set to deploy from `main`, but Cloudflare credentials were missing in GitHub secrets.

## Important Clarification
- `Workers Routes` in Cloudflare is for Workers runtime routing.
- Your deployment target is **Cloudflare Pages** (static site deploy), so Workers routes are **not required** for normal Pages hosting.

## Exact Steps To Fix Deploy

### 1. Confirm Cloudflare Pages Project Exists
In Cloudflare Dashboard:
1. Go to `Workers & Pages`.
2. Open or create project named `eonapp-ch`.
3. If creating:
- Framework preset: `None`
- Build command: leave empty (site is prebuilt/static in repo)
- Output directory: `.`

### 2. Create Cloudflare API Token
In Cloudflare Dashboard:
1. Go to `My Profile` -> `API Tokens` -> `Create Token`.
2. Use `Create Custom Token`.
3. Recommended minimum permissions:
- `Cloudflare Pages:Edit`
- `Account:Read`
4. Account scope: your account containing `eonapp-ch`.
5. Save token value.

### 3. Get Cloudflare Account ID
In Cloudflare Dashboard:
1. Open account overview.
2. Copy `Account ID`.

### 4. Add GitHub Repository Secrets
In GitHub repository `creditznft/EONAPP`:
1. `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`
2. Add:
- `CLOUDFLARE_API_TOKEN` = token from Step 2
- `CLOUDFLARE_ACCOUNT_ID` = account ID from Step 3

### 5. Trigger Deployment
1. Push any commit to `main` (or rerun latest failed deploy workflow).
2. Verify workflow `Deploy to Cloudflare Pages` succeeds.

## Domain + DNS Checks (Already Mostly Correct)
You already use Cloudflare nameservers:
- `nelly.ns.cloudflare.com`
- `rudy.ns.cloudflare.com`

Now confirm in Cloudflare DNS:
1. `eonapp.ch` record points to Cloudflare Pages target (or Pages-managed apex setup).
2. `www` CNAME points to Pages target (or redirect rule to apex).
3. SSL/TLS mode is `Full` (or `Full (strict)` if origin cert setup is complete).

## Post-Fix Verification Checklist
After successful deploy run:
1. Open `https://eonapp.ch/`
2. Open `https://eonapp.ch/tools.html`
3. Open `https://eonapp.ch/games.html`
4. Open `https://eonapp.ch/blog/`
5. Open `https://eonapp.ch/tools/rarerank.html`
6. Open `https://eonapp.ch/archive/tools/rarerank.html`

Expected: HTTP 200 (or valid redirect then 200), no Cloudflare error page.

## Troubleshooting

### A) Error: `Input required and not supplied: apiToken`
- Cause: Missing `CLOUDFLARE_API_TOKEN` in GitHub secrets.
- Fix: Add secret exactly with that name.

### B) Error: `project not found`
- Cause: `projectName` mismatch in workflow.
- Fix: Ensure Pages project is exactly `eonapp-ch`.

### C) Node 20 deprecation warning
- Status: mitigated in workflows by setting:
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`

### D) Site opens in Cloudflare but wrong content
- Cause: old deploy still active or wrong project bound to domain.
- Fix: check latest successful deployment in `Workers & Pages` and custom domain attachment.

## Recommended Next
After secrets are set, run one empty commit to force fresh CI + deploy:
```powershell
git commit --allow-empty -m "trigger: verify cloudflare pages deployment"
git push origin main
```
