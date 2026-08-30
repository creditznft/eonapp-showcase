# EON City direct static asset namespace

This folder is reserved for approved, same-origin, browser-fetched EON City
assets. It intentionally contains no production binary art yet.

Rules:

- A City asset can be added only after provenance, licence, quality budget,
  SHA-256, LOD and device-review requirements pass.
- Browser requests go directly to this static path. Do not route model,
  texture, audio or image bytes through a Pages Function body relay.
- Before private binary art is released, protect this path using an edge access
  policy and validate real-device cache, sign-in and throughput behaviour.
- Do not store project text, prompts, Vault data, keys, files, chat content or
  user identifiers inside City art assets.
