# W693 owner recording runbook

This matrix is mandatory before EONCITY or EON NEXUS receives a final visual score, release approval, merge approval or production deployment.

The current local source candidate may pass deterministic source and long-session simulation gates while every browser recording remains pending. A pending recording must never be converted to passed by a source test, screenshot mock, headless-only run or written claim.

Use `config/w693-owner-recording-matrix.json` as the exact capture authority. Capture on the named real devices, keep private prompts, provider keys, Vault contents and personal project data out of frame, and record failures as failures rather than repeating until only a successful take remains.

Every recording must include the visible browser URL, the action that begins the workflow, the relevant review/confirmation step, the resulting state, and the safe return or cancellation path.
