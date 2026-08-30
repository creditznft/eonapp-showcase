This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Apply Guide — W180–W215 Final Polish

This archive is a cumulative replacement baseline. Use it for a controlled merge into the current live repository; do not stack older W180–W212 archives over it.

1. Verify the archive SHA-256.
2. Extract outside the live repository.
3. Create a new Git branch and a clean backup commit.
4. Diff the archive against the live tree; preserve any verified newer live fix.
5. Merge the current baseline and resolve conflicts using `CODEX_W180_W215_FINAL_POLISH_MERGE_AND_W216_PREVIEW_PROMPT_2026-06-23.md`.
6. Run `npm ci` and `npm run qa:w216-release-candidate`.
7. Deploy to Cloudflare Preview only, collect W216 evidence, then request human release review.

Do not include local dependency folders, build output, secrets, user data, or earlier ZIP archives in the merge commit.
