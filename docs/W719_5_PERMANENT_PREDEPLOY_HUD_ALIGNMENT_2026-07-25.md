# W719.5 — permanent predeploy HUD alignment

## Exact-environment finding

The permanent W624D predeploy reached step 9/84 and stopped in the historical W624B `minimal-direct-hud` source check. That check still required a direct `Share` button and a button literally labelled `Menu`.

The maintained City runtime deliberately supersedes that layout:

- the direct HUD keeps the current objective and nearby guidance visible;
- the compact direct control is labelled **More** and opens the City menu;
- **Share City invite** is inside the explicit work-and-share menu group;
- the action is bound to the W624J review-first Sharing Center;
- preparation, review and final sharing remain separate user actions.

## Repair

Only the historical W624B source gate is aligned to the current maintained contract. It now verifies the direct objective, nearby guidance, the compact **More** menu control, the menu-owned **Share City invite** action and the W624J Sharing Center binding.

No runtime HTML, CSS, JavaScript behavior, dependency, package lock, sharing policy or production surface changed.
