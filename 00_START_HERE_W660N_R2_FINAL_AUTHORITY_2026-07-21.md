# W660N-R2 final source authority

This package supersedes W660N-R1 only for packaging authority. Runtime source and built distribution remain unchanged.

## Corrected Windows path rule

The archive contains one canonical directory only: `CODEXDocs/`. The former `CodexDocs/` case variant has been merged into it. All seven files are recorded with exact `CODEXDocs/` paths.

## Mandatory first command

```text
node scripts/w660n-verify-source-authority.mjs
```

Required result: `ok: true`, `75/75 passed`, `missing=0`, `added=0`, `changed=0`, `symlinks=0`, `caseCollisions=0`.

Do not install, edit, build, preview or deploy unless this passes.

## Payload authority

- Files: 4973
- Bytes: 311336383
- Canonical tree SHA-256: `242c1873a76dd2642cef092af765a12ed369371afd4f166ce133d239a92a83b0`
- Order-independent leaf-set SHA-256: `93e54e85dcae0533770e4b4f3d6f32a7d9cd790219bd88c3c646ea6f8d8964d9`
- Full ledger SHA-256: `ecbda12c6d8be676322f2195b98291586d747f3de4f6372345a7f2572e0c1ce0`
- Distribution: 580 files / 98,151,465 bytes / `6140b8f175a571fb4f35285cb9eefd09856d38c2865a12e4cfd85072ae9d8bfc`

## Safety

Production was not changed. The visual acceptance, repair loop, complete Pages deployment-root construction, Preview validation and production promotion remain Codex work after authority verification.
