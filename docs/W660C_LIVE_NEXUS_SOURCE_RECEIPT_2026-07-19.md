# W660C Live Nexus source receipt

## Implemented source slice

W660C adds the first functional Live Nexus surface around the existing W660A2 privacy-projected EONBOT state adapter.

Implemented:

- full-screen and split-screen modes;
- one central EONBOT orb with observable ready, listening, processing, speaking, approval, complete, error and offline states;
- a maximum of five primary real nodes from the existing agent-presence projection;
- stable node ordering during state refreshes;
- readable task, route, project, node, approval and result panels;
- Return to Chat, Speak, Stop, Pause, Review, Approve, Reject, Open Result and Project controls, shown only when backed by a safe route or supplied existing action callback;
- desktop pointer rotation, bounded wheel/keyboard zoom, reset support and visible rotation/zoom buttons;
- long-press-to-speak only when the existing voice action is available, with a visible Speak button equivalent;
- mobile full-screen layout and reduced-motion CSS fallback;
- lazy launch from the existing Chat Pulse using the exact same adapter instance.

## Locked truth boundaries

The Live Nexus:

- does not create a second conversation store;
- does not read raw message bodies, raw project text, provider credentials or Vault content;
- does not start AI work, voice capture, provider calls, approvals or automations automatically;
- does not render fake agents, percentages or decorative technical activity;
- does not require Canvas, WebGL, Babylon.js or GLB assets;
- does not claim Project Atlas or EONCITY holographic Nexus completion.

## Certification status

Source gate, focused unit tests, W659N regression, lint and production build must pass before this slice is source-certified.

Headed-browser proof is still required for:

- desktop split layout and Chat composer clearance;
- full-screen focus containment and Escape behavior;
- mobile layout, safe areas and touch controls;
- reduced-motion appearance;
- visual inspection of every state and node density.

W660B2 also remains not browser-certified in this workspace because the sandbox browser environment blocks loopback navigation and cannot download Playwright Chromium.
