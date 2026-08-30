# Ad Network Setup Checklist

Purpose: keep rewarded monetization intentional and easy to audit while the site is still pre-launch.

---

## Current Status

- Monetag rewarded smartlink is now configured centrally in `assets/js/ads/config.js`.
- CPAlead and AdGate stay intentionally blank until those accounts are live.
- Full all-in-one tag rollout can happen later once the main site is online.

## Remaining Placeholders

File: `assets/js/ads/config.js`

Still intentionally blank:

- `https://YOUR-CPALEAD-OFFERWALL.com`
- `https://YOUR-ADGATE-OFFERWALL.com`

These are not launch blockers if Monetag is the only live rewarded provider.

---

## Replacement Rules

- Use only full `https://` URLs.
- Do not use redirect chains to unknown domains.
- Keep offerwall links only in optional reward flows.
- Do not expose CPA links on trust pages (`vault`, `privacy`, `about`).

---

## Minimal Launch Configuration

If only one provider is ready, use this priority:

1. Monetag smartlink (rewarded only)
2. CPAlead offerwall (optional fallback)
3. AdGate offerwall (secondary fallback)

You can keep non-ready providers in config with a blank URL and lower priority, then re-enable later.

## Live Monetag Entry

- Active rewarded smartlink: `https://omg10.com/4/7024916`
- Use it only on optional rewarded actions and game bonus flows.
- Do not move it onto trust pages or force-open it.

---

## Verification Sequence (No Browser Tests)

1. Edit URLs in `assets/js/ads/config.js` only.
2. Run:
   - `npm run launch:readiness`
3. Ensure output shows:
   - `Blockers: 0`
4. Run static integrity:
   - `npm run launch:check`

---

## Final Go/No-Go for Rewarded Monetization

- [x] Monetag smartlink configured centrally
- [ ] Launch readiness blocker count is zero
- [ ] Optional reward wording remains explicit and non-forced
- [ ] No trust-surface monetization regressions introduced
- [ ] Add all-in-one Monetag tag later when site is live and account inventory is available
