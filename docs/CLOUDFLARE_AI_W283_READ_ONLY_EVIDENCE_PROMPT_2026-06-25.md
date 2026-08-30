# Exact Cloudflare AI prompt — W283 read-only Pages/D1 inventory

Paste the following prompt into Cloudflare AI **only after confirming you are in the correct Cloudflare account**. Replace the two bracketed placeholders. It is deliberately evidence-only and must not alter your setup.

```text
You are assisting with EONAPP release evidence. Work in STRICT READ-ONLY / NO-MUTATION mode.

Project: [CLOUDFLARE_PAGES_PROJECT_NAME]
Expected D1 binding label: REFERRALS_DB
Candidate referral D1 database name: [REFERRALS_D1_DATABASE_NAME]

Do not create, edit, delete, deploy, rollback, retry a deployment, bind, unbind, migrate, query user/referral rows, export data rows, modify a Worker, modify Pages settings, modify environment variables/secrets, enable referral/milestone/reward logic, touch wallet/chain/payment settings, or make any dashboard change. Do not ask me to approve a write action in this task.

Collect only this redacted evidence:
1) Pages: show the project name, current production deployment label/time, and up to three most recent Preview deployment labels/times. Do not deploy or roll back. State whether a prior Preview deployment exists that could be selected manually as a rollback candidate later; do not perform a rollback.
2) D1: list D1 database names and inspect the candidate database metadata. Do not read table rows. If a CLI is available, use only read-only commands equivalent to:
   - npx wrangler d1 list --json
   - npx wrangler d1 info [REFERRALS_D1_DATABASE_NAME] --json
   - npx wrangler d1 execute [REFERRALS_D1_DATABASE_NAME] --remote --command "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN ('table','index','trigger','view') ORDER BY type, name;" --json
   Do not run any INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, migration, export-with-data, time-travel restore, deployment, or Pages/Worker write command.
3) Confirm whether the actual binding name REFERRALS_DB is visible in the existing project configuration. If not visible, report UNKNOWN rather than guessing.
4) Return a concise redacted report with only: timestamp, operator role, project name, Pages deployment labels/times, D1 database names, D1 schema object names/types, binding match PASS/FAIL/UNKNOWN, rollback-candidate PASS/FAIL/UNKNOWN, and a final result of PASS / BLOCKED / UNKNOWN.

Never include account IDs, database IDs, row data, referral codes, raw IP addresses, personal data, tokens, secrets, screenshots with hidden values, or full command output.

Stop immediately and return BLOCKED if the account/project/database identity is ambiguous, if the task would require a write, or if you cannot guarantee that only schema metadata—not row data—would be inspected.
```

## Why the commands are constrained

Cloudflare documents D1 commands for `list`, `info`, and `execute`; `execute` accepts a SQL command and supports `--remote` and JSON output. The command above selects only SQLite schema metadata from `sqlite_master`, never application table rows. Do not use D1 create, delete, migrations, restore, or an export that includes data in this evidence task.

## Optional second prompt — draft a Preview-only change plan, do not execute

Run this **only after** the first prompt has returned a redacted `PASS`, `BLOCKED`, or `UNKNOWN` evidence result. It still authorises no mutation; it asks Cloudflare AI to propose an auditable plan for a future human-approved Preview rehearsal.

```text
Using only the redacted W283 evidence report from the previous task, draft a PREVIEW-ONLY / NO-EXECUTION change plan for EONAPP. Do not perform any action and do not generate commands that mutate Cloudflare.

The plan must:
- identify unknowns and stop if the Pages project, D1 candidate, binding name, deployment labels, or rollback candidate are ambiguous;
- list only proposed human review steps for a future Preview rehearsal;
- preserve current production behavior and keep REFERRALS_DB read-only;
- explicitly prohibit D1 schema/data writes, row reads, migrations, Workers, bindings, secrets/environment changes, referral/milestone/reward activation, wallet/chain/payment changes, production deploy, production rollback, and retrying deployments;
- include a rollback decision checklist that selects an existing Preview deployment only after a human owner confirms it manually;
- return a concise plan with preconditions, proposed review steps, rollback criteria, evidence to retain, and stop conditions.

Do not call any mutation API, dashboard action, CLI write command, deployment, rollback, migration, export, restore, or configuration change. The final line must be: "DRAFT ONLY — NO CLOUDFARE CHANGE EXECUTED".
```
