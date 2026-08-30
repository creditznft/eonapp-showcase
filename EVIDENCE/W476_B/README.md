# W476-B evidence directory

This directory begins with source-gate metadata only. It intentionally contains **no** production page bodies, cookies, sessions, console text, OAuth information, local model names, provider output, customer content, screenshots, browser profiles or secrets.

After a reviewed deploy, operators may create redacted, ephemeral reports outside source control using `scripts/w476-b-production-proof.mjs`. Keep those reports out of commits unless an owner has reviewed their contents and they contain only the bounded fields documented in the W476-B protocol.
