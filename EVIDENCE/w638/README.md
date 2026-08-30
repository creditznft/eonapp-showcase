# W638 redacted production evidence intake

This directory accepts **redacted evidence artifacts only**. The canonical board is `config/w638-evidence-convergence-board.json`.

A record may be marked `pass` only after the W638 indexer verifies:

- the lane and requirement exist;
- the evidence kind is genuine for that requirement;
- source and synthetic fixtures are not used as production proof;
- the owner reviewed the evidence;
- destructive customer/payment actions had explicit prior owner approval;
- every referenced artifact exists and has a SHA-256 digest;
- redaction removed secrets, cookies, full email addresses and full customer/payment identifiers.

Never place `.env` files, provider keys, webhook secrets, cookies, OAuth tokens, raw payment payloads or unredacted customer records here.
