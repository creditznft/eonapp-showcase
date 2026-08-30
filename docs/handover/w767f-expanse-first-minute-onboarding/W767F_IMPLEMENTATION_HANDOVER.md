# W767F — Signal Frontier First-Minute Onboarding

## Authority

- Base commit: `3d33eaa` (`fix(expanse): validate NPC and activity asset presentation`)
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: the existing canonical Command Hub runtime, Expanse world-mode controller, mission board and overlay remain authoritative
- Deployment: none
- Browser certification: not claimed

## Delivered scope

### 1. Non-blocking orientation director

W767F adds a bounded first-minute onboarding authority with no private-content storage. It projects only authored product guidance and safe progression state.

On arrival the user is told:

- they are at Gateway Overlook;
- the first goal is to recover EONBOT;
- the gold circuit marks the route;
- `E` performs nearby interaction;
- `M` opens the regional mission map;
- safe Return Hub remains at the top right.

The card advances through EONBOT scan, signal-core recovery, companion-link restoration, map discovery and frontier-ready states.

### 2. Real touch and keyboard map access

The orientation card includes an explicit **Open map** button for touch and pointer users. Keyboard `M` now toggles the maintained mission board open and closed while Expanse is active.

The map action:

- requires explicit user action;
- fails closed outside Expanse or during Transit;
- records the maintained `map-opened` mission signal;
- advances onboarding state;
- opens the existing mission-board/map surface rather than creating a second map owner.

### 3. Explicit dismissal

A visible **Got it** action dismisses onboarding only after explicit user input. Dismissal persists for the active Expanse visit because subsequent updates preserve the inactive director state.

The card also hides while the mission board is open and ends on return to the Command Hub.

### 4. First-minute clarity certification

The director records the first time all required presentation evidence is available:

- location explained;
- first goal visible;
- companion target explained;
- map control presented;
- safe return control presented.

Certification succeeds only when this complete presentation is reached within the 30-second clarity target. A deliberately late evidence test fails certification as expected.

### 5. Privacy and authority boundaries

The onboarding state stores no prompts, files, project content, credentials or private user data. It introduces no engine, scene, render loop, mission authority or EONBOT identity.

## Validation completed

Evidence: `W767F_FOCUSED_REGRESSION_170_PASS.log`

- Tests: 170
- Pass: 170
- Fail: 0
- Skipped: 0

Additional checks:

- five targeted W767F tests pass;
- syntax checks pass for all changed JavaScript modules;
- Git whitespace check passes;
- map and dismissal actions require explicit user action;
- the 30-second success and failure paths both pass;
- touch/pointer and keyboard map access are source-gated;
- onboarding hides under the mission board and ends on Hub return;
- exactly one Babylon engine and one scene remain;
- all prior focused W766/W767 tests remain green.

## Environment limitations retained

No production build, authenticated browser evidence, real-device touch proof, foreground FPS proof, W747 spatial proof or deployment is claimed. The exact locked dependency install remains unavailable because the configured package source cannot provide `ws@7.5.11`.

## Next bounded coding wave

W767G should make EONBOT behavior feel deliberate after bonding:

1. formation follow without camera obstruction;
2. curious hover and environmental inspection;
3. scout-ahead behavior during explicit guidance;
4. terminal/discovery interest reactions;
5. dock/recharge and Transit formation continuity;
6. deterministic state transitions with safe distance bounds.
