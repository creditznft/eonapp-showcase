CREATE TABLE IF NOT EXISTS agent_jobs (
  job_id TEXT NOT NULL PRIMARY KEY,
  origin TEXT NOT NULL,
  action TEXT NOT NULL,
  intent_text TEXT,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  requires_approval INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  priority INTEGER NOT NULL DEFAULT 50,
  next_attempt_at TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_next
  ON agent_jobs(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_approval_status
  ON agent_jobs(approval_status, requires_approval, status);

CREATE TABLE IF NOT EXISTS agent_job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_job_events_job
  ON agent_job_events(job_id, created_at);
