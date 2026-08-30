# W286-B1 Agent Presence — external evidence plan

This plan is for a normal browser/device environment and an independent reviewer. It is not proof from source checks alone.

## Test matrix

| Lane | Required observation | Pass condition |
|---|---|---|
| Truth | Start one real user-approved EONBOT or Local AI task | One matching local Agent Presence cue appears; no cue appears before/after active lifecycle states |
| Privacy | Inspect local storage export and visual bubbles | No prompt/reply/model/key/provider name/Vault/wallet/referral/payment data appears |
| City Lite | Desktop and low-end phone | 2D remains usable with four or fewer cues and no blocked navigation |
| Visual Tour | Desktop WebGL | Actors update from local lifecycle events and quality governor/fallback remain stable |
| Babylon Play | Desktop plus one mobile-capable device | Actor cues appear after explicit Play entry; route review remains separate from task signals |
| Accessibility | Keyboard, touch, reduced motion, screen reader | Panels focus correctly; no forced sound/motion; status is understandable without color alone |
| Performance | Low/medium/high devices | Raw observations saved; low tier stays on Lite or falls back without loss of City state |
| Failure | Provider unavailable, rejected approval, task failure | Status becomes generic waiting/failed cue; no fabricated success |

## Redacted evidence format

Capture only: timestamp, page/mode, device class, selected quality, task category, observed lifecycle status, actor count, fallback decision, and pass/fail. Do not include user prompts, replies, provider keys, models, account IDs, public IPs, wallet data, referral IDs, or screenshots containing private content.

## Stop conditions

Stop the beta/flagship claim if any signal appears without a real local lifecycle record, any sensitive content is visible or persisted, the City opens routes automatically, task execution differs because City is open, or low-device fallback loses state.
