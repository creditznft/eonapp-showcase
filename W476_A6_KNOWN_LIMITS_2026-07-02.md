# W476-A6 Known Limits — 2026-07-02

1. This is source/local verification, not live Cloudflare deployment evidence.
2. `/csp-report` source tests prove parsing/redaction behavior only. A deployed browser must still prove headers, delivery, endpoint response, redacted logs and alert handling.
3. The origin inventory is deliberately broad enough to catch stale/legacy code. A literal in the inventory is not proof the browser requests it; every item needs runtime classification or retirement in W476-B/W477.
4. Root CSP still has broad `https:` allowances for `connect-src`, `img-src` and `frame-src`. Do not tighten them blindly in this wave; verify actual needed network behavior first.
5. Local text AI supports only the already defined user-triggered Ollama, LM Studio and Jan loopback policy. Real browser CORS/PNA behavior remains unproven.
6. The W479-M creator media programme is planning only. It does not add ComfyUI, image generation, image-to-video, text-to-video, local model downloads, remote media APIs or a LAN endpoint box.
7. No payment, Dodo, checkout, billing, wallet, token/NFT, reward/payout, referral grant, OAuth credential or Cloudflare secret is included.
8. The dependency audit is clean for the final lockfile, but only a repeatable CI/deploy audit can keep it clean over time.
