-- RT89 reviewed rollback metadata for Forge GitHub publishing.
-- This stores only SHA/PR/CI/deploy receipts. It never stores source files,
-- GitHub credentials, prompts, or generated media.

ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_status TEXT NOT NULL DEFAULT '' CHECK (rollback_status IN ('','staged','deploying','completed'));
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_branch_name TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_restore_tree_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_pull_number INTEGER;
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_pr_url TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_ci_run_id INTEGER;
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_ci_url TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_nonce_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_merged_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_deploy_run_id INTEGER;
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_deploy_run_url TEXT NOT NULL DEFAULT '';
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_started_at INTEGER;
ALTER TABLE eon_forge_github_publish_actions ADD COLUMN rollback_completed_at INTEGER;
