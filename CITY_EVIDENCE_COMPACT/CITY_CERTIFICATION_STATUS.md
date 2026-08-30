W479 City Live Certification Status

Captured against `https://eonapp.ch` on `2026-07-02`.

Final outcome: `FIX REQUIRED`

Production identity

- `main` commit SHA: `9048e3308c8a302be2460c5098a435381c2aa4d5`
- Live service worker release id: `w476-2026-07-01-storage-network`
- Live service worker SHA-256: `12b0d24a2dd8cbd66dfd06d67bc99eb33ca44f19d406e92a65afa2d6f4035fba`
- Browser: Google Chrome `149.0.7827.201`
- Desktop viewport: `1440x900`, DPR `1`
- GPU renderer: `ANGLE (AMD, AMD Radeon 740M Graphics (0x00001901) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- Cache cleared before capture: `yes`
- Origin storage cleared before capture: `yes`
- Public Cloudflare deployment UUID: not exposed in public response in this environment

Evidence that passed

- `w453a-production-city-edge-proof.json` passed `33/33` route and alias checks, including canonical `/eoncity`, `/eoncity/3d`, and the service worker probe.
- Desktop cold start, warm reload, controls panel, command deck, chat route, creator route, and return-to-City screenshots were captured.
- Desktop 90-second witness met two of the headline pacing thresholds:
  - median FPS: `48.32`
  - p95 frame time: `27.78 ms`
- Portrait mobile companion stayed truthful about fallback scope and did not claim live 3D play.
- Landscape mobile emulation loaded the interactive City and exposed `4` movement controls.

Blocking defects

1. Repeating long hitches break the desktop sustained-session gate.
   Evidence:
   - `desktop-city-proof.json`
   - `desktop-city-witness-raw.json`
   Observed:
   - `256.975 ms` hitch at `64.275 s`
   - `236.475 ms` hitch at `75.136 s`
   Impact:
   - The handover gate requires no repeating hitches above `100 ms` after initial loading.
   Targeted fix direction:
   - Inspect late-session district/material activation, texture upload timing, and any deferred mipmap generation or asset preparation that can fire after minute one.

2. Repeated WebGL texture and mipmap warnings remain present in live City sessions.
   Evidence:
   - `desktop-city-console.json`
   - `mobile-landscape-proof.json`
   Observed:
   - `36x` `WebGL: INVALID_VALUE: texImage2D: bad image data`
   - `36x` `GL_INVALID_OPERATION: glGenerateMipmap: Cannot generate mipmaps for a zero-size texture in a WebGL context.`
   Impact:
   - This is not a clean runtime and likely relates to the late-session hitch pattern.
   Targeted fix direction:
   - Audit every City texture path that can create zero-size uploads, then fail closed before `texImage2D` or `glGenerateMipmap` on incomplete images.

3. The portrait companion status chips collapse together visually.
   Evidence:
   - `mobile-portrait-companion.png`
   Observed:
   - The chip row renders as `City-safeLocal-firstcinematic profile` without readable spacing.
   Impact:
   - The fallback remains truthful, but the portrait presentation is not fully polished.
   Targeted fix direction:
   - Add explicit gap, wrapping, or separator treatment to the portrait companion status chip group.

Manual blockers still outside automated certification

- No physical Android run was captured in this environment.
- No physical iPhone Safari run was captured in this environment.
- No tablet run was captured in this environment.
- No human thermal, touch-fatigue, or long-hand input review was captured in this environment.
- `w476-b-production-browser-proof.json` still reports overall `not-pass-or-incomplete` because non-City routes (`/`, `/chat`, `/local-ai`) emitted console errors in that wider site proof.

Required next step

- Open a targeted remediation branch for the City runtime issues above, fix the WebGL warning path and the late-session hitches, then rerun this same live evidence set before claiming `PASS`.
