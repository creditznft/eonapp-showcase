# W765R8 + W766I FINAL VALIDATION RECEIPT

## Source authority

```text
Production base commit: 5919e3e4085aa8fc0d2f3b3a5dfed80de7c219be
Production base tree: cd78bb7f74b02aa9b102684ea61eee041200d129
W766I source-code commit: a5ed94c973b5b672f4739a7e2491c22973b6e2a8
W766I source-code tree: 31a81bca4c59b2dc59763bc175bff909f9a4bba5
```

## Focused regression matrix

```text
Tests: 129
Pass: 129
Fail: 0
Skipped: 0
```

Coverage includes:

- W698 open-world presentation
- W754 cast, EONBOT, NPC schedules and Transit
- W755 environment, art and audio
- W760–W765 Command Core convergence and runtime integration
- W765R1–R8 integrity
- W766A world modes and persistence
- W766B authored region
- W766C streaming and budgets
- W766D NPC routes and Transit
- W766E campaign runtime
- W766F living content
- W766G presentation, reward and restoration
- W766H playability, UI and runtime health
- W766I world grammar, contracts, stress boundaries and runtime integration

## Syntax and workspace gates

```text
Changed JavaScript files checked: 15
Syntax failures: 0
git diff --check: PASS
Secret scan: PASS
Text files scanned: 4,728
Potential secrets: 0
```

## Asset integrity

```text
W745 binary manifest entries: 45
W745 variants checked: 90
W745 bytes checked: 90,182,476
W766I referenced asset IDs: 16
W766I primary/fallback files: 32
W766I referenced bytes: 31,236,116
Missing files: 0
Hash mismatches: 0
```

## Open-world adversarial matrix

```text
Cases: 480
Neighbor checks: 23,744
20/20 region families observed
16/16 gameplay purposes observed
6/6 frontier contract families observed
Max population reseed attempt: 3
Max draw-call budget ratio: 0.863
Max triangle budget ratio: 0.466
```

## Campaign source-level proof

```text
Campaign missions: 6/6 completable through physical source signals
Campaign XP: 1,940
Final campaign level: 8
Signal Vanguard Reveal: one
Selected cosmetic: one
Campaign receipt: one
Duplicate XP/reward: rejected
Safe Hub return: required and represented
```

## Non-claims

This receipt does not claim:

- successful `npm ci`;
- full ESLint;
- production build;
- Babylon asset-acceptance execution;
- authenticated rendered browser proof;
- real mobile/touch proof;
- browser memory measurement;
- Cloudflare Preview or production deployment;
- owner-rendered visual score.

The configured registry lacks `ws@7.5.11`, so dependency-backed gates must run in Codex’s complete repository environment.
