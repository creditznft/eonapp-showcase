# W519 Legacy Transport / Control Quarantine

This directory preserves historical source and proof artifacts that are deliberately **not** part of the active EONAPP product. It contains the retired D1 Sync, relay, P2P/Nostr, IPFS/Arweave, distributed-inference, and hardware-control pilots as review-only material.

Do not import from this directory. The W519 source gate rejects an active route or a current unit-test import that reaches it. Restoring any family requires a separately approved future wave, a new contract, security review, direct user consent, and evidence; moving files back is not authorization.
W534 also moved `e2e/flows.spec.js` here because it attempted to dynamically import the retired P2P discovery module. It is historical evidence only and must not be returned to a runnable E2E suite without a new approved product/security decision.
