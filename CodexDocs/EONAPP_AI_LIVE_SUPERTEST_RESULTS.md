# EONAPP AI Live Supertest Results

Generated: 2026-07-10T17:15:21.382Z
Env file attempted: `C:\Users\credi\WORKSPACE\EONAPP.CH\.env.local`
App URL: `http://127.0.0.1:4173`
Ollama URL: `http://127.0.0.1:11434`

Summary: 19 pass, 7 warn, 3 skip, 2 fail.

| Area | Test | Status | Detail |
|---|---:|---:|---|
| remote | matrix | SKIP | --no-remote set |
| local-discovery | ollama | PASS | 10 model(s) visible at http://127.0.0.1:11434: phi4-mini:gpu, qwen3:4b-gpu, qwen2.5-coder:7b-gpu, qwen2.5-coder:3b-gpu, phi4-mini:latest, qwen3:4b, phi3:mini, qwen2.5:3b |
| local-chat | ollama:phi4-mini:gpu | PASS | HTTP 200; output: EON LIVE OK |
| local-chat | ollama:qwen3:4b-gpu | PASS | HTTP 200; output: {"model":"qwen3:4b-gpu","created_at":"2026-07-10T17:14:17.6084783Z","message":{"role":"assistant","content":"","thinking":"We are to output exactly: \"EON LIVE OK\"\n The instructi… |
| local-discovery | lmstudio | SKIP | lmstudio not reachable at http://127.0.0.1:1234: fetch failed |
| local-discovery | jan | SKIP | jan not reachable at http://127.0.0.1:1337: fetch failed |
| browser-page | /onboarding.html | PASS | HTTP 200 http://127.0.0.1:4173/onboarding.html |
| browser-local-ui | /onboarding.html | WARN | Local AI/Ollama UI copy not obvious on this page |
| browser-local-detect | /onboarding.html | WARN | Detect action clicked; no local model name found in page text |
| browser-csp-localhost | /onboarding.html | PASS | Browser page can fetch http://127.0.0.1:11434/api/tags (10 model(s)) |
| browser-console | /onboarding.html | PASS | No CSP console violations captured |
| browser-page | /chat.html | PASS | HTTP 200 http://127.0.0.1:4173/chat.html |
| browser-local-ui | /chat.html | WARN | Local AI/Ollama UI copy not obvious on this page |
| browser-local-detect | /chat.html | WARN | Detect action clicked; no local model name found in page text |
| browser-csp-localhost | /chat.html | PASS | Browser page can fetch http://127.0.0.1:11434/api/tags (10 model(s)) |
| browser-console | /chat.html | PASS | No CSP console violations captured |
| browser-page | /vault.html | PASS | HTTP 200 http://127.0.0.1:4173/vault.html |
| browser-local-detect | /vault.html | WARN | Detect action clicked; no local model name found in page text |
| browser-csp-localhost | /vault.html | PASS | Browser page can fetch http://127.0.0.1:11434/api/tags (10 model(s)) |
| browser-console | /vault.html | PASS | No CSP console violations captured |
| browser-page | /realm.html | PASS | HTTP 200 http://127.0.0.1:4173/realm.html |
| browser-local-detect | /realm.html | WARN | Detect action clicked; no local model name found in page text |
| browser-csp-localhost | /realm.html | PASS | Browser page can fetch http://127.0.0.1:11434/api/tags (10 model(s)) |
| browser-console | /realm.html | PASS | No CSP console violations captured |
| browser-page | /trade.html | PASS | HTTP 200 http://127.0.0.1:4173/trade.html |
| browser-local-detect | /trade.html | WARN | Detect action clicked; no local model name found in page text |
| browser-csp-localhost | /trade.html | PASS | Browser page can fetch http://127.0.0.1:11434/api/tags (10 model(s)) |
| browser-console | /trade.html | PASS | No CSP console violations captured |
| browser-page | /hustle.html | PASS | HTTP 200 http://127.0.0.1:4173/hustle.html |
| browser-csp-localhost | /hustle.html | FAIL | Browser page could not fetch local Ollama: Failed to fetch |
| browser-console | /hustle.html | FAIL | Connecting to 'http://127.0.0.1:11434/api/tags' violates the following Content Security Policy directive: "connect-src 'self'". The action has been blocked. \| Fetch API cannot load http://127.0.0.1:11434/api/tags. Refused to connect because it violates the document's Content Security Policy. |

## Screenshots
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\onboarding-html.png
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\chat-html.png
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\vault-html.png
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\realm-html.png
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\trade-html.png
- C:\Users\credi\WORKSPACE\EONAPP_W621_LIVE_ROLLOUT_20260710\docs\qa\live-ai-supertest\2026-07-10T17-14-05-894Z\hustle-html.png

## Notes
- This report never writes API key values. It only reports env key names and masked existence.
- `WARN` can mean the provider works but did not echo the exact sentinel, or the provider returned quota/billing/rate-limit while the key was structurally accepted.
- `SKIP` for local runtimes means the service was not reachable from the test machine. Start Ollama/LM Studio/Jan and rerun.