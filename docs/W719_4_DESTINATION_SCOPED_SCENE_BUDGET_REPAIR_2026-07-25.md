# W719.4 — destination-scoped scene-budget repair

## Exact-environment finding

The W719.3 Node 22 / npm 11.12.1 / Babylon 9.7.0 diagnostic proved that repeated Expanse travel was stable rather than leaking: the tail remained between 1,626 and 1,644 meshes. The institutional `<900` cap still failed because 1,055 Connected Core meshes remained allocated while the Expanse destination was active.

## Repair

The canonical Living Nexus runtime now treats Connected Core geometry as destination-scoped content:

- Core geometry is mounted inside the existing Babylon scene while `core` is active.
- Leaving Core captures the read-only plan, summary, gateway and reviewed-transit authority, then recursively disposes the hidden Core subtree and its materials.
- Returning to Core reconstructs the same source-controlled renderer in the same scene after explicit user action.
- Expanse, My Realm and premium Realm destinations retain read-only Core status without retaining hidden Core meshes.
- No second scene, canvas, render loop, assistant, store, automatic navigation or automatic execution is introduced.

## Unchanged boundaries

- The 25-cell visible Expanse horizon and 9-cell interactive neighbourhood remain unchanged.
- The institutional `<900` scene-mesh threshold is not raised.
- The package lock and Babylon versions remain unchanged.
- Production and Cloudflare are unchanged until exact certification and Preview verification pass.
