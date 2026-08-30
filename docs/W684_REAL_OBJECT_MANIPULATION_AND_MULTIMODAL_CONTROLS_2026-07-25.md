# W684 — Real Object Manipulation and Multimodal Controls

Date: 2026-07-25
Branch: `local/w671-n3-c3-rebuild`

## Completed scope

- Added pointer/touch dragging, keyboard nudging, grouping, two-object comparison, parking/restoring and bounded undo/redo.
- Added typed or voice-transcript command parsing for the same local manipulation actions.
- Added an optional injected local gesture lane for six approved gestures only.
- Added controller subscriptions so DOM and Babylon consume the same local layout state.
- Prevented drag previews from rebuilding the full DOM or Babylon field on every pointer movement; one committed update occurs at drag completion.
- Made rotate, zoom, expand and collapse commands update the actual visible field through the same bounded undo/redo authority.
- Required two explicit selections for a meaningful group and replaced time-derived group IDs with deterministic controller-local IDs.

## Gesture and privacy safeguards

- Camera access cannot start automatically.
- Gesture mode requires an explicit user action, an injected detector and local camera permission.
- Confidence threshold and cooldown reject unstable or rapid accidental gestures.
- No frame upload, download, provider call, hidden action or mandatory webcam path.
- Mouse, touch, keyboard and visible controls remain complete equivalents.
