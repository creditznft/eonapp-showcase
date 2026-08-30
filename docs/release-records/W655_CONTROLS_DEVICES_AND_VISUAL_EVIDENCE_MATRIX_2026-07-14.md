# W655 — Controls, Devices and Visual Evidence Matrix

## Authoritative convention

- W / Arrow Up: screen-forward.
- S / Arrow Down: screen-back.
- A / Arrow Left: screen-left.
- D / Arrow Right: screen-right.
- Touch joystick and optional D-pad must match keyboard direction.
- Controller left stick must match keyboard/touch direction.
- Controller action requests the visible review; it never confirms a route by itself.
- Mouse/touch district signal selects or inspects; floor click-to-move never silently opens a route.
- C cycles camera; R resets camera; Escape returns to 3D Explore where applicable.

## Machine control proof

Codex must run four camera headings. For each heading, record world-space displacement from identical input bursts:

1. Camera forward +Z.
2. Camera forward +X.
3. Camera forward -Z.
4. Camera forward -X.

For every heading test keyboard, touch emulation and controller. Positive strafe must produce a positive dot product with the camera’s screen-right vector. Forward must produce a positive dot product with camera-forward. Record the results in `CODEX_W655_CONTROL_MATRIX.csv`.

## Required devices / viewports

- Desktop headed Chrome, 1440×900 or larger.
- Desktop 1280×720 minimum supported check.
- Mobile portrait around 390×844.
- Mobile landscape around 844×390.
- Tablet portrait and landscape where available.
- Real touch device preferred; Playwright touch emulation is additional, not a substitute when a real device is available.
- Optional physical controller when available; otherwise use browser Gamepad API test harness and mark physical-controller proof pending.

## Visual evidence rules

For every district capture:

- arrival/wide establishing screenshot;
- terminal/action close-up;
- active character idle screenshot;
- short movement/gesture video;
- console and network state;
- defect annotation when score is below 9.5.

For every active character verify scale, floor contact, facing, materials, texture quality, shoulders, hands, face, knees, idle/walk/run, gestures, root lock, clipping, T-pose and duplicate meshes.

## Fail-fast rules

Critical: auth bypass, private data exposure, unsafe route, production secret exposure, unusable movement, crash, blank City, infinite boot, payment/billing mutation, or production deploy without owner GO.

High: inverted control in any primary input, blocked mobile action, district impossible to enter/leave, material failure, major character deformation, stale chunk loop, cache update failure, repeated event handler, console exception.
