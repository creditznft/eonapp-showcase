# EONAPP W625A–W625C Source Completion

> Historical checkpoint note: this document records the W625C freeze. Current continuation status is governed by the W625D–W625H completion document, roadmap and machine ledger.

Date: 2026-07-11  
Authority: W624L source archive SHA-256 `9da1fb6dc641eb45e6890a28834fe5bc669d9571d77fad3c007d65ebe1798757`

## Completed safely

### W625A source tooling

- Explicit scan of approved ComfyUI loopback hosts and ports only.
- Runtime/device/checkpoint discovery after user action.
- Real job states for submitted, queued, running, completed, timeout, failed and cancelled.
- Identified queued-job deletion through `/queue` and running-job interruption through `/interrupt`, only after an explicit cancel click.
- Output fetched only through the approved local `/view` endpoint.
- Generated image SHA-256, explicit save, owner-selected reopen and exact digest comparison.
- Redacted receipt excluding prompt, checkpoint filename, local path, key and media body.
- Preview alone no longer marks the self-test passed.

### W625B source complete

- One versioned, allowlisted EONAPP-authored text-to-image workflow.
- Six standard built-in nodes only.
- Bounded low-VRAM, medium and high-end profiles; queue concurrency one.
- Fixed first-proof recipe: 512×512, 12 steps, batch one.
- Conservative checkpoint-family classification and no unreviewed auto-import/install.

### W625C source foundation

- Creator aspect, quality and seed controls unlock only after digest-matched save/reopen proof.
- Bounded recipes, negative-prompt guidance, session-only history and redacted receipt export.
- Explicit truth that reference image, inpaint, outpaint, upscale, compare, prompt enhancement and local video remain unavailable pending separate allowlisted workflows and real evidence.

## Focused validation before full predeploy

- W625A source gate: 8/8.
- W625A focused unit assertions: 6/6.
- W625B source gate: 7/7.
- W625B focused unit assertions: 5/5.
- W625C source gate: 7/7.
- W625C focused unit assertions: 3/3.
- Existing W623A image adapter tests: 5/5.
- Current manifest alignment: 234 maintained test files; 47 exact historical assertions remain explicit non-certifying skips.

## Honest pending work

- No owner ComfyUI runtime is accessible from the managed environment.
- No real image, checkpoint, cancellation, CORS, timeout or restart evidence is claimed here.
- W625A remains `source-tooling-ready-real-owner-runtime-proof-pending`.
- W625C advanced edit/reference/upscale workflows remain unfinished.
- W625D local-video capability activation has not started; local video remains disabled.

## Permanent deployment verification

Use only:

```bash
npm ci
npm run verify:codex-predeploy
```

The stable runner remains source-fingerprinted, lock-protected and resumable. No competing deployment command was created.
