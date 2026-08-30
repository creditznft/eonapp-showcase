# Package validation — W260 R1 / W258 C0-I compiler evidence repair

The companion `*.integrity.txt` file records post-build ZIP integrity,
extraction and manifest validation.

Package policy:

- Include full source, tests, configuration, contract workspace, documentation
  and non-secret evidence required to reproduce the local checks.
- Exclude `node_modules`, `dist`, `.git`, Hardhat `artifacts`/`cache`, test
  reports, coverage output, `.env*` files and secrets.
- The SHA-256 source manifest intentionally excludes itself to avoid a circular
  checksum.
