# W476-A5 Browser Proof Plan (Not Run)

Run only after source merge/deploy in a clean controlled environment.

For each runtime — Ollama, LM Studio, Jan:

1. Open `https://eonapp.ch/local-ai` in a real browser.
2. Start the runtime on the same device through the user’s own installation.
3. Tap **Scan installed models**; do not rely on background detection.
4. Confirm discovery request, response status, and selected model only in redacted logs.
5. Run the local self-test.
6. Select the passed runtime for EONBOT and request one harmless local output.
7. Capture/redact console, CSP, CORS/PNA and network details.
8. Simulate a failed local runtime; confirm EONAPP does not switch to any cloud provider without a new user choice.
9. Test LAN and wrong-port inputs; verify rejection in the UI and storage state.

A failed CORS/PNA or runtime response is a truthful `NOT PASS` result. Update user guidance for that runtime rather than claiming compatibility.
