# RT92 Grand Art Wave 8 — Cinematic VFX and Graphic Art

Wave 8 adds a shared bounded reveal/VFX vocabulary and a new original vector-art pack without taking camera, gameplay or render-loop authority.

## Graphic art

- Four 1200×675 world key-art illustrations: Command Hub, Signal Frontier, Storm Sector and My Frontier.
- Twenty reusable local glyphs covering Command, Signal, Storm, My Frontier districts, construction and Vault language.
- Total generated SVG payload is ~52 KB, well below the 300 KB RT92 vector budget.
- The three playable-world cards in the maintained City Menu now use the new RT92 key art and remain lazy-loaded.

## Cinematic/VFX layer

Each canonical world receives a quality-bounded reveal composition made from canonical Babylon geometry: orbital/reveal rings, vertical light fins and low-count data motes. Lite/Balanced/Cinematic use 1/2/3 rings, 2/3/4 fins and 4/8/12 motes. The layer respects reduced motion, has no camera authority, blocks no controls, adds no external textures, owns no Engine/Scene/render loop and writes no progression.

World lifecycles explicitly mount, activate/update, suspend and dispose the layer. Signal remains deferred until Signal entry; Storm and My Frontier stay behind their existing activation/unlock authorities; Command Hub activates only while Command Hub is the active RT92 world.
