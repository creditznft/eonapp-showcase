# W660B1 EON NEXUS Pulse certification

Date: 2026-07-19

## Certified scope

W660B1 adds the first visible EON NEXUS product surface to the existing Chat experience:

- a lightweight static/reduced-motion EON Pulse;
- deferred loading after the standard Chat composer is usable;
- the same EONBOT conversation and composer, not a second chat;
- privacy-projected EONBOT, task, provider, project, review and result state;
- visible Open Chat and Speak controls;
- approval and result actions only when the bounded Nexus snapshot exposes them;
- no Babylon.js, GLB, canvas or continuous render loop;
- no automatic microphone request;
- reduced-motion support;
- vertical clearance above Chat's bottom composer and utility controls.

## Verified source baseline

- W659N Productive City baseline: `5a12c38a184d286774335550d034f549092f311e`
- W660B1 application layout head: `541f8f102aa206c6fd0b7c8fb5d25bab5332e34b`
- W660B1 final browser-proof head: `fe4fa3745158bad24b112fba88bd97723862862e`
- Working branch: `chatgpt/w660-eon-nexus-plan`

## Maintained verification

### Full W660B1 verification

GitHub Actions run: `29660214321`

Result: **PASS**

Verified:

- W660B1 truth/source gate;
- W660 state and Pulse unit suites;
- W659N Productive City regression gate;
- full ESLint with zero warnings;
- production Vite build.

### Final browser proof

GitHub Actions run: `29660398814`

Result: **PASS**

Artifact:

- name: `w660b1-eon-nexus-pulse-browser-proof`
- artifact id: `8434151228`
- artifact digest: `sha256:5fb65e5355d02c05b28d42f7238ddd8edeee294d0372b770cfff2fd7e9597d54`

Browser checkpoints:

1. Standard Chat composer became visible before the deferred Pulse.
2. Static Pulse mounted successfully from Chat.
3. No canvas, Babylon.js, GLB or continuous animation was introduced.
4. Pulse had no overlap with the Chat composer.
5. No microphone request occurred before explicit voice activation.
6. Open Chat and Speak controls were visible.
7. Open Chat focused the existing `#chat-input` composer.
8. Projected processing state rendered correctly.
9. Projected completed state rendered correctly.
10. Escape closed the Pulse panel and reset `aria-expanded`.

Measured browser evidence:

- viewport: `1365 × 900`;
- bottom clearance: `92 px`;
- vertical gap above Chat composer: `14 px`;
- canvas count: `0`;
- active animation names under reduced motion: `0`;
- microphone requests before user action: `0`;
- Babylon/GLB requests: `0`;
- page errors: `0`;
- request failures: `0`.

The only console warning was the expected Playwright message that service-worker registration was blocked in the isolated browser-proof lane.

The browser lane was a loopback Chromium proof with reduced motion. It did not claim production authentication, a physical mobile device, a live provider response, microphone permission, live voice, Live Nexus or EONCITY integration.

## Visual review

The final screenshot was manually reviewed and showed:

- the compact EON orb above the bottom control lane;
- a readable EON NEXUS status card;
- clear EONBOT completion and reply-ready state;
- conventional Open Chat and Speak buttons;
- the normal Chat composer remaining primary;
- no overlap with Chat voice, send or Help controls;
- no heavy 3D renderer or decorative full-screen takeover.

## Truth and privacy boundaries

W660B1 does not:

- read raw conversation bodies for visualization;
- expose private filenames automatically;
- start AI work;
- approve actions;
- activate voice automatically;
- call a provider;
- create a second conversation store;
- claim live agent activity that is not present in the normalized Nexus snapshot.

## Certification conclusion

W660B1 is certified as a static, accessible, truthful and lightweight EON Pulse prototype on Chat.

It is not yet the animated living orb, Live Nexus, Project Atlas or EONCITY hologram.

## Next wave: W660B2

Implement the motion-capable Pulse layer while preserving the W660B1 contract:

- Full, Balanced, Low power and Static/reduced-motion profiles;
- state-specific motion for ready, listening, processing, speaking, approval waiting, complete, error and local/private states;
- no heavy 3D engine;
- automatic pause while hidden;
- reduced mobile cadence;
- no fake percentages or fictional work;
- one-shot completion/error transitions where appropriate;
- browser proof for motion policy, visibility pause and reduced-motion fallback.
