# Gameplay Quality Pass

Generated: 2026-04-22T23:45:56.306Z

Checklist: FPS stability, restart loop, score persistence, mobile controls, share/challenge flow.

| Game | FPS | Restart | Score Persist | Mobile | Share | Score/5 | JS Files | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cyber-rogue | PASS | PASS | PASS | PASS | PASS | 5 | 4 | No blockers detected by static checklist |
| dungeon-crawl-zero | PASS | PASS | PASS | PASS | PASS | 5 | 1 | No blockers detected by static checklist |
| neon-conquest | PASS | PASS | PASS | PASS | PASS | 5 | 4 | No blockers detected by static checklist |
| neural-override | PASS | PASS | PASS | PASS | PASS | 5 | 4 | No blockers detected by static checklist |
| realm-wars-lite | PASS | PASS | PASS | PASS | PASS | 5 | 4 | No blockers detected by static checklist |
| chrono-gladiators | PASS | WARN | PASS | PASS | PASS | 4 | 5 | Add explicit restart/play-again action |
| neon-siege | PASS | PASS | PASS | WARN | PASS | 4 | 4 | Add mobile-first pointer/touch controls |
| cyber-neon | PASS | WARN | PASS | WARN | PASS | 3 | 10 | Add explicit restart/play-again action; Add mobile-first pointer/touch controls |
| neon-nexus | PASS | WARN | PASS | WARN | PASS | 3 | 12 | Add explicit restart/play-again action; Add mobile-first pointer/touch controls |
| void-raider | PASS | WARN | PASS | WARN | WARN | 2 | 4 | Add explicit restart/play-again action; Add mobile-first pointer/touch controls; Add challenge/share CTA with copy link |
| alchemy-lab | WARN | WARN | PASS | WARN | WARN | 1 | 1 | Add stable frame loop instrumentation; Add explicit restart/play-again action; Add mobile-first pointer/touch controls; Add challenge/share CTA with copy link |

## Priority Targets
1. cyber-neon (3/5): Add explicit restart/play-again action; Add mobile-first pointer/touch controls
2. neon-nexus (3/5): Add explicit restart/play-again action; Add mobile-first pointer/touch controls
3. void-raider (2/5): Add explicit restart/play-again action; Add mobile-first pointer/touch controls; Add challenge/share CTA with copy link
4. alchemy-lab (1/5): Add stable frame loop instrumentation; Add explicit restart/play-again action; Add mobile-first pointer/touch controls; Add challenge/share CTA with copy link