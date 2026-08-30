# W649 Browser, Preview and Owner Gates — Pending

This source is a locally certified implementation candidate, not a production-certified release.

## Why browser proof is not claimed here

The available container did not contain the Playwright Chromium executable expected by the installed Playwright version. The authenticated desktop and mobile lanes also require a real, owner-controlled Google-authenticated storage-state file through `EONAPP_W649_AUTH_STORAGE_STATE`.

The browser specification is committed at:

`tests/e2e/w649-eoncity-integrated-cast.spec.ts`

It covers:

- signed-out `/eoncity` with zero Babylon, GLB and City-audio requests;
- authenticated desktop boot and same-origin content-hashed asset requests;
- authenticated mobile-landscape boot;
- bounded startup requests;
- local Meshopt decoder use;
- screenshots, console errors and network evidence.

## Codex exact-candidate sequence

1. Start from the exact candidate commit named in the external package receipt.
2. Run `npm ci` using Node 22.
3. Run `npm run test:unit`.
4. Run `npm run qa:w649-foundation`.
5. Run `npm run lint -- --max-warnings=0`.
6. Run `npm run build` and then `npm run smoke:build`.
7. Confirm `dist/assets/city/w649` contains exactly 76 files and the local decoder exists at `dist/assets/vendor/babylon/meshopt_decoder.js`.
8. Install the Playwright browser version required by the lockfile in the Codex environment.
9. Create a real Google-authenticated EONAPP storage state and set `EONAPP_W649_AUTH_STORAGE_STATE` to its absolute path. Never commit that file.
10. Run `npm run evidence:w649-browser` against the immutable local candidate.
11. Run the existing headed Forge certification lane.
12. Deploy the exact built `dist/` to a Cloudflare Preview URL without rebuilding.
13. Repeat the signed-out, authenticated desktop and mobile-landscape proof on Preview; export screenshots, console logs, request lists, timing, memory/FPS observations and release identity.
14. Compare Pathfinder Prime and Pathfinder A visually. Record the owner lock/rejection.
15. Review animation deformation, foot sliding, root drift, clipping, lighting, scale, collisions and district placement for every launch asset.
16. Do not deploy production. Return the complete evidence package for owner review.

## Production boundary

W649K remains blocked until the owner explicitly approves the exact Preview artifact. Production promotion must reuse that exact certified artifact and retain the W648D rollback authority.
