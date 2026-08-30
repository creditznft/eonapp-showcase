# W606 — Client-only Research and Local Knowledge Programme

## Decision

EONAPP AI/research/media features must not route through an EONAPP server, Cloudflare Worker, server-side proxy, hidden browser, or server-held provider key. The relevant state and operations stay on the person’s device:

- EONBOT memory: explicit same-browser local storage.
- EONAPP grounding: source-controlled public local application files supplied with each compatible model call.
- Local models: direct loopback connection to a user-installed Ollama, LM Studio, Jan, ComfyUI or another explicitly supported local runtime.
- Connected providers: direct browser-to-provider BYOK only when the provider/browser permits it and the user explicitly configures it. EONAPP never receives the key.
- Research: explicit client-side source capture and a local citation packet, never EONAPP proxy retrieval.

## Research sources

A person may add a source in one of three modes:

1. **Manual permitted extract:** open a public page yourself and paste a relevant extract, source URL and optional title.
2. **Browser-direct CORS fetch:** tap the explicit fetch button. It uses `fetch()` in `cors` mode with omitted credentials, no referrer, and no redirects. Many publishers will block this; that is expected and is not bypassed.
3. **Future optional client bridge:** a separately installed local browser extension/desktop bridge may capture a user-selected page only after its own permission, privacy and source-review work. It is not shipped or claimed installed in W606.

Only public HTTPS URLs are accepted. Localhost, LAN, private-network, `.local`, `.internal`, URL credentials and sensitive query parameters are rejected. Source extracts that resemble credentials are rejected. The ledger is bounded to eight source records and stores only in the current browser.

## One-turn context rule

Saved sources are not automatically injected into any model request. The user writes a question and taps **Use saved sources in next EONBOT reply**. EONAPP queues the source identifiers in session storage. The next compatible text-model call consumes that one packet, marks its sources as `[S1]`, `[S2]`, includes capture time, and removes it from the queue. Later turns do not silently inherit it.

The model must treat the packet as supplied evidence, cite it, distinguish facts from uncertainty, and never claim to have browsed or live-verified the web.

## Browser limitation

Browser JavaScript cannot read arbitrary websites unless the remote site permits it through CORS. A `no-cors` response is opaque and cannot provide readable research text. This is a browser security boundary, not a feature gap to bypass. EONAPP therefore gives a useful fallback—manual source capture—rather than adding a hidden server relay. See the official browser CORS documentation and WebExtension permissions documentation in the W606 evidence notes.

## Acceptance criteria

- No internal `/api/research` endpoint, Cloudflare Worker, server-held research key or server proxy exists in the W606 path.
- Direct source requests are user-triggered, public HTTPS only, CORS mode, `credentials: omit`, `redirect: error`, and `referrerPolicy: no-referrer`.
- Research queue is one turn, client-only and erased from session after consumption.
- The model gets citations and capture time but no instruction to claim it browsed.
- Existing local-memory, grounding, text, image/video and Creator output boundaries remain intact.
- Source gate, unit tests, lint and production build pass before this is represented as source-ready.

## Next AI sequence

- **W607:** owner-run real-output proofs for local and direct-BYOK text/code, retaining only redacted local receipts.
- **W608:** local ComfyUI adapter after image/video proof. Loopback-only; no automatic install/download or background rendering.
- **W609:** authorized Creator edit pipeline with visible transform recipe and media validation.
- **W610:** local-only quality dashboard comparing model/device/workflow results with no default private output upload.
