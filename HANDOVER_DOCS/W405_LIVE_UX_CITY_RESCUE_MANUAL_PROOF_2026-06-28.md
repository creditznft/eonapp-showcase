# W405 — Live UX and EON City Rescue Manual Proof

**Purpose:** This is a post-deploy, human-browser proof checklist. It does not certify visual quality merely because source tests pass.

## Before testing

1. Deploy the W405 source bundle to Production.
2. Open `https://eonapp.ch` in a private window.
3. If an older PWA had been installed, use the visible PWA update action or browser site settings to unregister the old service worker before judging route behaviour.
4. Test as a guest first. Do not use a production account to test account deletion.

## Chat shell checks

### Desktop, expanded rail

- New chat button is aligned with its plus icon and label.
- Thread `…` menu stays closed until the user explicitly clicks it.
- Header `…` menu stays closed until the user explicitly clicks it.
- Search opens next to Search, not far down the sidebar.
- More opens next to More and contains only the remaining utility settings; it does not duplicate Support, Privacy or Install.
- Profile opens a compact gray account popover near the profile trigger.

### Desktop, collapsed rail

- EONAPP lightning/logo is the primary top control.
- Hover/focus logo: tooltip says **Open sidebar**.
- Hover/focus each rail icon: label is readable without expanding the sidebar.
- New chat plus is centred and shows **New chat** on hover/focus.
- No clipped labels, no duplicate utility block, no unexplained second top button.

### Guest Google entry

- Header shows **Sign in** at the top right.
- Click Sign in: a compact popover appears.
- Continue with Google is disabled until the acknowledgment is ticked.
- Text clearly says Google identity is not Chat/Vault/Project/City backup.
- With the Google test account only: tick acknowledgement and continue.
- Return to the requested EONAPP route after authorization.
- Refresh: record whether session is still present.
- Sign out: record that session ends while local work stays untouched.

**Do not test account deletion with a real founder account.** Use a disposable Google test account.

## Canonical City checks

### Route/cache

- Open `https://eonapp.ch/realm#my-realm-3d` in a private window or after an app update.
- It must arrive at `/eoncity`, not the legacy Realm world.
- Open the normal EON City navigation action. It must arrive at `/eoncity`.
- The temporary legacy visual preview is not a primary navigation destination.

### Desktop controls

1. Open `/eoncity`.
2. Click **City controls**, then close it.
3. Press `W`, `A`, `S`, `D` and arrow keys after clicking a HUD button. Movement must still respond.
4. Press `M`; verify local map behaviour. Press `E`; verify only a local interaction review appears.
5. Click **Reset view**; player/camera must return to Arrival Plaza.
6. Click **Command Deck**, then close it; verify native routes only open after a visible user choice.
7. Verify `Escape` pauses and resume works.

### Mobile controls

1. Test a current Android/iOS browser in portrait and landscape.
2. Direct entry must show only Command Deck and City controls first.
3. Open City controls; enable D-pad only if needed.
4. Joystick should move; drag should control view; reset must work.
5. Portrait may recommend landscape but must not trap the user.
6. City Map remains an immediate fallback.

## Visual evidence to capture

Capture unedited screenshots/video for:

- Chat expanded / collapsed / Search / Profile / guest Sign in.
- City arrival frame, City controls, Command Deck, one native route review.
- Mobile City in portrait, mobile City in landscape, mobile fallback map.
- Any rendering error, blocked input, raw placeholder asset, unreadable sign, or HUD overlap.

## W405 exit criteria

W405 is only complete when source gates are green **and** a human reviewer confirms:

- no duplicate chat utilities or broken collapsed rail;
- no cache revival of legacy Realm;
- visible guest Sign in and Google test-user round trip;
- keyboard and touch control proof;
- visual defects are catalogued for W407 art rebuilding.

The current procedural district remains a temporary vertical slice. It is not approved for “AAA”, “cinematic”, “finished game”, or “flagship City” marketing until W407–W410 assets and real-device evidence are delivered.
