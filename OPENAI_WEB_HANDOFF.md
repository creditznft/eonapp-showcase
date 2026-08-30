# EONAPP.CH Complete Workspace

This archive is intended to be the complete source workspace for continued coding in ChatGPT Web.

## Included
- Root launch pages and site shells
- App source under `assets/`
- Tests under `tests/` and `e2e/`
- Supporting source under `scripts/`, `tools/`, `functions/`, `platform-backend/`, `public/`, `blog/`, `campaigns/`, `games/`, `loot/`, `legacy-archive/`
- Smart contract source and scripts under `Smart Contracts/`
- Docs and audits under `README.md`, `AUDIT/`, `CodexDocs/`, and `docs/`
- Configuration files at the root

## Excluded
- `node_modules`
- `dist`, `build`, `coverage`
- `.git`, `.cache`, `.playwright`, `.playwright-mcp`, `.lighthouseci`, `.agent-system`, `.codex-temp`, `test-results`, `playwright-report`
- temp/log artifacts, `.env*`, and zip files

## Suggested model routing
- GPT-5.4: audit, planning, architecture, issue ranking
- o3: tricky debugging and state/security issues
- small fast models: repetitive edits, sanitization, test updates