# W685 — Full Spatial Project Atlas

Date: 2026-07-25
Branch: `local/w671-n3-c3-rebuild`

## Completed scope

- Converted the permanent Project Atlas into a bounded spatial universe around one selected project.
- Projects, tasks, outputs, conversations, activity, attention and completed history remain derived from real Atlas data.
- Added Overview, Work and City-expression views with bounded rotation and zoom.
- Added a truthful calm empty universe when no project is selected; no records are fabricated.
- Preserved the readable list/details equivalent and corrected the interactive spatial surface to an accessibility-valid group.
- Namespaced spatial node identities by record type so task/activity IDs cannot collide.
- Preserved the exact currently selected NEXUS work object as the Atlas focus, including aggregate result/approval objects that do not already have a one-to-one Atlas row.
- Linked compatible Atlas nodes back to the same NEXUS selection controller without starting work or navigation.

## Safety boundaries

- Atlas never starts AI work, moves the player, enters City or places an object automatically.
- Native routes remain explicit links.
- The City anchor explains the proposed continuity path before any entry confirmation.
