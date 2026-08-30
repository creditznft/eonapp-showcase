ALTER TABLE epoch_snapshots ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE epoch_snapshots ADD COLUMN closed_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE epoch_snapshots ADD COLUMN closed_at TEXT;
ALTER TABLE epoch_snapshots ADD COLUMN closed_by TEXT NOT NULL DEFAULT '';
ALTER TABLE epoch_snapshots ADD COLUMN remainder_receiver TEXT NOT NULL DEFAULT '';
ALTER TABLE epoch_snapshots ADD COLUMN remainder_amount TEXT NOT NULL DEFAULT '0';

DELETE FROM claim_previews
WHERE id NOT IN (
  SELECT MAX(id)
  FROM claim_previews
  GROUP BY uid, sequence, domain
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_previews_unique
  ON claim_previews(uid, sequence, domain);
