# EON Local Companion — consumer packaging source

RT90 keeps the Local Companion security core in `tools/eon-local-bridge` and adds a reproducible source path for a standalone native executable.

`npm run build:local-companion:bundle` bundles the approved bridge/runtime/model-pack code into one CommonJS file and writes a Node 22 SEA preparation config plus a SHA-256 source manifest. The bundle is the input to operating-system release packaging; it is **not** itself a public installer.

Node 22 SEA packaging must use the same Node executable that prepares the blob, inject the blob into that copied executable, and then perform the platform signing step. Windows/macOS installer signing, user-approved autostart, updater behavior, clean uninstall and reboot/device proof remain release-engineering gates. Do not set a browser download URL until the immutable artifact facts are entered in `config/eon-local-companion-release-contract.mjs`.

The development `.cmd` launcher remains diagnostic-only and must never be presented as the public Companion installer.
