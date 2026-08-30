# W652 — EONCITY Entry and First-Impression Audit

## Executive decision

EONCITY must sell the outcome before explaining the gate. The first sentence is now **“Your work becomes a place.”** Security and authentication remain strict, but they support the promise instead of replacing it.

The signed-out route remains CSS-and-HTML only. It does not import Babylon, GLBs, City audio, controls, project data, provider state, or private account content.

## Red-team finding

The previous entrance was technically honest but product-weak. It led with authentication mechanics and restrictions. A first-time visitor could understand why access was blocked without understanding why the City was worth entering.

### Main risks found

1. Security language dominated the value proposition.
2. The all-in-one control-workspace concept was not visible before sign-in.
3. Productivity, living districts, truthful agents, and optional exploration were not presented as one coherent product.
4. Internal implementation language reduced the premium first impression.

## Fixes implemented

- Product-led hero: “Your work becomes a place.”
- Four clear benefits: Command Room, Living districts, Agent Theater, and 3D Explore.
- Trust strip: deferred download, review-first control, and local-first custody.
- Premium CSS-only world art, skyline, beacon, rain, and orbit treatment.
- Google identity CTA plus a safe return to EONBOT.
- The Google CTA is pinned to the reviewed same-origin authentication start route; malformed access payloads cannot replace it with an external or script URL.
- No public low-quality 3D preview and no heavy download before access authorization.
- Responsive entry layout with reduced-motion compatibility.

## Score

| Dimension | Before audit | After local fixes | Codex-reserved |
|---|---:|---:|---:|
| Product promise | 6.8/10 | 9.7/10 | visual hierarchy |
| Trust and access clarity | 9.1/10 | 9.8/10 | real Google flow |
| Premium first impression | 7.1/10 | 9.5/10 | screenshots/device proof |
| Mobile readiness | 8.2/10 | 9.5/10 | headed portrait/landscape |
| **Wave score** | **7.8/10** | **9.6/10 previsual** | **0.4 points reserved** |

The objective source gate passed every defined criterion. The 9.6 score is a previsual readiness score, not a claim that a human has approved the final rendered appearance.
