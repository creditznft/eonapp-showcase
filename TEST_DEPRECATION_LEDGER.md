# Test Deprecation Ledger

| Historical contract | Why it changed | Current replacement | Decision |
| --- | --- | --- | --- |
| Fixed `v54` service-worker cache names | A hand-maintained cache version cannot identify an exact release and encouraged unsafe global cache cleanup. | W476 service-worker contract requires a release ID, owned-prefix cleanup and explicit user-controlled update messages. | Replaced; do not restore `v54`. |
| Unscoped `SKIP_WAITING` update action | A waiting worker could be activated without verifying which release it represented. | W476 PWA manager requests `EONAPP_RELEASE_ID_REQUEST` and sends `EONAPP_APPLY_UPDATE` only with the matching release ID. | Replaced. |
| Redirect fixture byte comparison across mixed line endings | LF vs CRLF is not user-facing routing behavior but caused avoidable false failures. | Generated root and public redirect files are normalized to LF; route content assertions remain active. | Normalized; routing tests retained. |
| Legacy GA import only in static shell | It left core application and City measurement incomplete while policy copy was inaccurate. | W476 shared bridge covers intended shells, is preference-gated and only emits allowlisted logical route IDs. | Replaced; production evidence remains pending. |

No meaningful user-facing test was deleted in this wave. Historical gates were updated only where the old condition contradicted the W476 safety contract.
