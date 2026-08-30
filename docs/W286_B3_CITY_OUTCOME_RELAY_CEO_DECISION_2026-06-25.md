# W286-B3 CEO decision — close the visual work loop, keep results native

## Decision

EON City must make real AI-assisted work understandable at a glance without pretending that visual NPCs are people, autonomous agents, or a substitute for the application.

The final source-safe City architecture is:

| Layer | Job | Must not become |
|---|---|---|
| City Lite | accessible, fast, low-device visual work dashboard | a reduced-functionality trap |
| Three.js Visual Tour | optional spatial overview and high-level status | a second workspace |
| Babylon City Play | flagship visual command district / showpiece | a game economy, fake AI theatre, or second automation engine |
| Chat / EONBOT / native routes | task control, proposal approval, real data, and result review | hidden behind game navigation |

## Presence rules

1. A cue appears only from a recorded local lifecycle fact.
2. A maximum of four active cues are visualised.
3. An outcome beacon appears only for the latest `waiting`, `complete`, or `failed` local state.
4. The beacon says only status and a safe next step. It never reveals content.
5. The user chooses whether to open Chat. No City mode auto-navigates or starts work.
6. When there is no real state, City shows no artificial “busy” character.

## Why this is the flagship

The flagship value is not photorealism alone. It is **trustworthy legibility**: users can see that work is queued, happening in parallel, handed off, waiting for review, ready, or needs attention—then open the native surface to act.

## What is deliberately deferred

- real-device frame/thermal/memory validation;
- visual quality scoring and accessibility review on actual hardware;
- model/provider runtime proof;
- voice/persona expansions beyond explicit opt-in;
- any wallet, token, balance, transfer, reward, referral value, commercial marketplace, or chain runtime.

Those require the external evidence and governance gates retained in W259/W266/W276/W282/W283/W268/W278/W279/W258/W284/W289/W290.
