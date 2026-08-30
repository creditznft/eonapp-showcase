# W660H ChatGPT-style shell and page-specific EON NEXUS

## Implemented locally

- The application rail now has a fixed header, one independently scrollable navigation/history body, and a fixed account dock.
- Account, Settings, Help and Log out remain reachable through a viewport-bounded scrollable profile menu.
- Root Chat and `/chat` are locked to the visible viewport. Only the message stream scrolls; the composer stays present at the bottom.
- Continue EONCITY is a compact floating card with explicit Open and Not now buttons and no longer increases the chat page height.
- Application-shell product routes receive a named page-specific Nexus orb: Forge, Projects, Workspace, Local AI, Library, Automations, Vault, Settings, Create and Account.
- Each page Nexus focuses the existing privacy-safe product adapter for that surface. It does not create another product store or expose raw chat text, filenames, project text, credentials, endpoints, keys or Vault contents.
- Expand opens Live Nexus. Upward swipe or double-click opens it directly in full-screen mode. Live Nexus retains keyboard rotation/zoom, pointer rotation and desktop wheel zoom.
- Chat retains its dedicated Nexus bridge. EONCITY retains its nine Babylon hologram stations. No duplicate canvas, assistant, conversation or selected-project authority is introduced.

## Evidence boundary

Source/unit/gate/build evidence may prove implementation and invariants. Exact desktop/mobile visuals, physical keyboard/gesture behavior, authenticated Opera Preview, microphone/camera/recording and production remain uncertified until corresponding browser/device evidence exists.
