# W767G — Bounded EONBOT Ambient Companion Behavior

## Authority

- Initial W767G implementation commit: `bbc8b43` (`feat(expanse): add bounded EONBOT ambient behavior`)
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: one canonical EONBOT anchor inside the existing Babylon runtime
- Deployment: none
- Browser certification: not claimed

## Delivered scope

### 1. Deterministic behavior director

W767G adds a bounded companion-behavior director that never awards XP, records mission signals, activates interactions or stores private content.

Priority order is explicit:

1. outside Expanse or not yet bonded → formation/awaiting state;
2. Regional Transit → Transit formation;
3. explicit **EONBOT, guide me** → guide-route authority;
4. excessive companion distance → immediate return formation;
5. player movement → formation follow;
6. stationary ambient behavior after a delay and cooldown.

### 2. Context-aware ambient modes

After the player remains still, EONBOT may use only nearby safe interaction metadata to choose:

- `greet-npc` for Pathfinder, Navigator or Maintenance Worker;
- `scan-discovery` for discoveries and dynamic events;
- `inspect-nearby` for terminals, relays, maps and productive-mission props;
- `dock-recharge` for authored docking/recharge targets;
- `curious-hover` when no safe target exists.

The director filters the Return Gate and all companion-rescue interactions so ambient motion can never impersonate a deliberate user action.

### 3. Bounded movement and camera safety

All ambient targets are clamped to the existing companion leash. The canonical runtime then applies the maintained EONBOT camera-safe target resolver before movement.

If the player moves or the companion exceeds the leash, ambient behavior is cancelled immediately and formation recovery takes priority.

### 4. Deliberate visual reactions

Runtime presentation now maps behavior modes to existing visual states:

- terminal inspection → scan halo/beam;
- discovery scan → circuit scan;
- NPC greeting → greeting halo and playful tilt;
- dock/recharge → dock-check scan;
- curiosity → bounded hover motion.

Transit and explicit guidance continue to override all ambient presentation.

### 5. Variety without randomness or compulsion

The behavior director remembers the last ambient target and chooses another eligible nearby target when available. Curiosity sectors are deterministic rather than random.

There are no daily penalties, hidden actions, mission mutations or social effects.

## Validation completed

Evidence: `W767G_FOCUSED_REGRESSION_176_PASS.log`

- Tests: 176
- Pass: 176
- Fail: 0
- Skipped: 0

Additional checks:

- six targeted W767G tests pass;
- syntax and Git whitespace checks pass;
- Transit and explicit guide priority pass;
- stationary delay, duration and cooldown pass;
- rescue/return target filtering passes;
- NPC, terminal, discovery and dock classification pass;
- target leash and distance recovery pass;
- alternate-target selection passes;
- mission mutation and private-content prohibitions pass;
- exactly one engine, scene and EONBOT identity remain;
- all prior focused W766/W767 tests remain green.

## Environment limitations retained

No production build, authenticated browser movement proof, animation capture, foreground FPS proof, W747 spatial proof or deployment is claimed. The exact locked dependency install remains unavailable because the configured package source cannot provide `ws@7.5.11`.

## Next bounded coding wave

W767H should complete touch/coarse-pointer interaction parity:

1. expose the nearest valid Expanse interaction as a HUD button;
2. use the same proximity candidate and canonical dispatch as keyboard `E`;
3. hide the button during Transit, mission-board display and when no target is eligible;
4. maintain the one-primary/two-nearby label limits;
5. avoid duplicate prompts on keyboard/mouse devices.
