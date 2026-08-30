# EON Creator Companion — W626B source package

This is a small dependency-free, loopback-only companion source package. It binds only to `127.0.0.1:47826`, authenticates approved EONAPP origins with a displayed one-time pairing code, keeps provider credentials in OS-user-bound secure storage, and sends approved jobs directly from the user's computer to the selected provider.

It does not contain a signed installer yet. A public release remains blocked until platform signing, update, uninstall, diagnostics, origin-authentication and real-provider evidence pass. There is no LAN binding, public endpoint, Cloudflare proxy, automatic dependency installation, browser key storage, webhook relay or automatic paid retry.

## Source diagnostics

```bash
node creator-companion/src/diagnose.mjs
```

## Local development start

```bash
node creator-companion/src/server.mjs
```

Reviewed Image/Video/Music source rails may be enabled only for finite reviewed model identifiers. That source enablement is not provider certification: public/live approval remains blocked until owner/Codex runs real user-owned provider output, save/reopen, failure and recovery evidence.
