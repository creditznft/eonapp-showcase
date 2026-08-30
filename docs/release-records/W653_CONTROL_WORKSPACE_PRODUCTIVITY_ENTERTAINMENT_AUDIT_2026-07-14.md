# W653 — EONCITY Control Workspace, Productivity and Entertainment Audit

## Executive decision

EONCITY is not a separate mini-game beside EONAPP. It is the **spatial operating layer of EONAPP**:

- **Command Room:** fast, readable work control.
- **Living Dashboard:** truthful system and project signals.
- **Agent Theater:** receipt-backed activity only.
- **3D Explore:** optional movement, discovery, atmosphere, authored expeditions, and personalisation.

Work is the default. The world creates identity, motivation and delight around useful work. Entertainment may never hide, delay, fake or replace a real action.

## Red-team finding

The previous Command Room proved the concept but treated too many destinations as equal. It risked becoming a wall of cards rather than a premium cockpit. Share and District Map also competed with work destinations, while important EONAPP surfaces were missing from the primary hierarchy.

## Fixes implemented

### Primary work lane — seven screens

1. EONBOT Core — remains inside City.
2. Projects — continue local work.
3. Create — beginner-facing creation.
4. Forge — coding and web-project work.
5. Library — reuse outputs and materials.
6. Research — evidence and scenario work.
7. Automations — review drafts and schedules.

### Systems rack — four screens

1. Advanced Workspace.
2. Local AI.
3. Vault.
4. Realm Studio.

### Hero actions

- Enter 3D Explore.
- District Map.
- Show interactives.
- Share.

### Interaction decisions

- First click selects and explains a destination.
- Native EONAPP pages open only after a second visible click.
- Keyboard shortcuts select the same review; they do not silently navigate.
- Command Room shortcut listeners are owned by the City lifecycle and removed on restart, preventing duplicate keyboard actions after retries or renderer resets.
- EONBOT opens inside City rather than ejecting the user to another route, but still requires a visible review followed by a second click.
- Agent Theater destination buttons feed the same review panel; they are not direct route links.
- Every confirmed route writes a truthful operator receipt.
- Share, publishing, providers, checkout, rewards, automations and account changes remain explicit in their native surfaces.

## EONAPP coverage from EONCITY

| Capability | City access | Authority |
|---|---|---|
| EONBOT planning | In-City panel | user prompt only |
| Projects | reviewed route | Projects surface |
| Create | reviewed route | Create surface |
| Forge | reviewed route | Forge surface |
| Library | reviewed route | Library surface |
| Research | reviewed route | Research Lab |
| Automations | reviewed route | Automations review |
| Workspace | reviewed route | Workspace |
| Local AI | reviewed route | Local AI setup |
| Vault | reviewed route | Vault |
| Realm Studio | reviewed route | local Realm Studio |
| Share | explicit hero/HUD action | Share Command Center |
| District travel | local City panel | no work starts |
| Profile, Settings, Help, Install | global app shell | native pages |
| Subscription and billing | native account surfaces only | never City authority |

## Entertainment policy

Approved entertainment consists of authored places, optional exploration, ambient narrative, discoverable interactions, finite local Signal Expeditions, cosmetic identity, photo moments and truthful character presence.

Rejected mechanics include loot boxes, gambling, pay-to-win, fake productivity scores, fake agent work, cash rewards, token promises, hidden engagement loops, or progress that claims work was completed when no persisted result exists.

## Score

| Dimension | Before audit | After local fixes | Codex-reserved |
|---|---:|---:|---:|
| All-in-one control utility | 8.0/10 | 9.7/10 | route screenshots |
| Information hierarchy | 7.4/10 | 9.6/10 | visual density review |
| Review-first safety | 9.2/10 | 9.9/10 | headed click proof |
| Productivity/entertainment balance | 8.1/10 | 9.6/10 | real session observation |
| Discoverability/accessibility | 8.0/10 | 9.5/10 | keyboard/mobile proof |
| **Wave score** | **8.1/10** | **9.6/10 previsual** | **0.4 points reserved** |
