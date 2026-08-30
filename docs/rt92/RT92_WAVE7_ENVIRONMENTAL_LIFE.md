# RT92 Grand Art Wave 7 — Population, Service Life and EONBOT-Adjacent Environmental Motion

Wave 7 adds lightweight environmental service life across Command Hub, Signal Frontier, Storm Sector and My Frontier without replacing the existing authored human NPC, EONBOT, gameplay, navigation or collision authorities.

## Added life classes

- spider maintenance robots
- inspection/survey drones
- cargo/service carts
- scanner units
- compact service/repair units

The service layer is deliberately non-human. Existing authored character systems remain the only human/citizen population authority.

## World behavior

- Command Hub: maintenance patrols, inspection orbits, cargo motion and Nexus-adjacent service activity.
- Signal Frontier: recovery/inspection activity distributed across gateway, beacon, archive, transit and vault areas.
- Storm Sector: grounding, rescue and inspection units respond visually to hazard severity.
- My Frontier: service activity scales with real operational district count and remains inside the existing unlock/lifecycle rules.

## Performance and safety

Lite/Balanced/Cinematic admit 2/4/6 service actors per active world. The layer adds zero binary art, no external textures, no Engine/Scene/render-loop authority, no navigation/collision authority and no progression writes. Hidden worlds are disabled and their actors do not update.

## Source certification

RT92 focused Wave 1-7 source test slice: **33/33 PASS** in this container. Real GPU/browser visual acceptance remains for Codex machine certification.
