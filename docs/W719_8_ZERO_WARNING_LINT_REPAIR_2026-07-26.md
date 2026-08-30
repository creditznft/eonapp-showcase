# W719.8 — zero-warning permanent-predeploy lint repair

## Exact-environment finding

W719.7 cleared the historical W624B, W660D and W660J source gates and reached the permanent lint stage. ESLint reported zero errors and nineteen warnings; the permanent predeploy correctly treats any warning as a certification failure.

The warnings were limited to:

- missing braces around compact `if` and nested `for…of` bodies;
- two unused locals and one mutable declaration that never reassigns;
- five bounded C0/DEL sanitizers that intentionally remove control characters before rendering or persisting identifiers.

## Repair

The source cleanup:

- adds explicit braces without changing branch conditions, return values or iteration order;
- removes the unused Expanse clamp helper and unused district index;
- changes the non-reassigned undo stack binding to `const`;
- extends the existing file-scoped `no-control-regex` exception only to the five exact sanitizers that implement the same bounded C0/DEL replacement contract.

No feature, route, state authority, automatic-action boundary, dependency, package lock, entitlement, payment path, production surface or release policy changed. The lint threshold remains zero warnings.
