# W767H — EONBOT Interaction Reactions

## Authority

- Base commit: `7b0ff4c` (`fix(expanse): harden EONBOT ambient behavior`)
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: one canonical EONBOT anchor and the maintained Gateway interaction authorities
- Deployment: none
- Browser certification: not claimed

## Delivered scope

### 1. Explicit interaction reaction authority

W767H extends the bounded W767G companion director with an explicit `react` path. It runs only after a genuine user-owned Expanse interaction and cannot activate itself.

The reaction is rejected when:

- explicit user action is absent;
- Expanse is not active;
- EONBOT has not been bonded;
- Regional Transit is active;
- explicit route guidance is active;
- the selected target is unsafe, too distant, a Return Gate or a companion-rescue control.

### 2. Contextual EONBOT responses

The canonical companion now visibly responds to maintained interactions:

- productive stations and terminals → inspect-nearby;
- named NPC interactions → greet-npc;
- discoveries and dynamic events → scan-discovery;
- authored dock/recharge targets → dock-recharge;
- other safe nearby targets → curious-hover.

Targets remain bounded by the existing companion leash. The reaction expires automatically and returns to formation behavior.

### 3. Safe interaction correlation

The runtime refreshes only the nearest bounded Gateway interaction metadata and correlates the completed interaction to a visible target by safe identifiers such as NPC ID, discovery ID or maintained interaction action.

No prompt content, project content, receipt payload or private data enters the behavior director.

### 4. Existing HUD continuity

The existing companion status line now projects a short behavior label such as **Greeting resident**, **Scanning discovery** or **Inspecting terminal**. No second HUD, scene, render loop or companion identity is introduced.

### 5. Non-mutation contract

Companion reactions:

- do not award XP;
- do not complete missions;
- do not record productive receipts;
- do not invoke another interaction;
- do not publish or store private content.

They are presentation-only reactions to actions already completed through canonical child authorities.

## Validation completed

Evidence: `W767H_FOCUSED_REGRESSION_180_PASS.log`

- Tests: 180
- Pass: 180
- Fail: 0
- Skipped: 0

Additional checks:

- JavaScript syntax checks pass;
- explicit-action, bond, Transit and guidance gates pass;
- NPC, productive, discovery and dock classifications pass;
- Return Gate and companion-rescue exclusions pass;
- bounded-target and non-mutation contracts pass;
- exactly one Engine and one Scene remain;
- all prior focused W766/W767 tests remain green.

## Environment limitations retained

No production build, authenticated browser proof, foreground FPS proof, W747 spatial proof or deployment is claimed. The exact locked dependency install remains unavailable because the configured package source cannot provide `ws@7.5.11`.

## Next bounded coding wave

W767I should complete touch/coarse-pointer interaction parity:

1. expose the nearest valid Expanse interaction as a HUD button on coarse-pointer devices;
2. route keyboard and touch through the same canonical nearest-interaction action;
3. reject stale touch targets;
4. hide the button during Transit, mission-board display and when no target is eligible;
5. avoid duplicate keyboard prompts on touch devices.
