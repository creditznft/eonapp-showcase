import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W218 implements the ChatGPT-like local shell contract without claiming a remote account', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const css = read('assets/css/eon-app-shell.css');
  assert.match(shell, /SIDEBAR_COLLAPSED_KEY/);
  assert.match(shell, /data-eon-sidebar-collapse/);
  assert.match(shell, /data-eon-mobile-close/);
  assert.match(shell, /eon:chat-threads-changed/);
  assert.match(shell, /eon:profile-changed/);
  assert.match(shell, /data-eon-header-share/);
  assert.match(shell, /data-eon-header-account/);
  assert.match(shell, /data-eon-header-overflow/);
  assert.match(shell, /shouldShowMobileProfileShortcut/);
  assert.match(shell, /getShellPopoverPlacement/);
  assert.match(shell, /shortcut\.hidden = !visible/);
  assert.match(shell, /popoverHeight: measured\.height \|\| popover\.scrollHeight \|\| 320/);
  assert.match(css, /eon-app-mobile-profile\[hidden\] \{ display: none !important; \}/);
  assert.match(css, /eon-share-sheet/);
  assert.match(css, /eon-app-sidebar-collapsed/);
  assert.match(css, /eon-app-menu-open/);
});

test('W218 share surface creates a signed public invite only and keeps private data out of scope', () => {
  assert.equal(existsSync(new URL('../../assets/js/utils/eon-share-sheet.js', import.meta.url)), true);
  const share = read('assets/js/utils/eon-share-sheet.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  assert.match(share, /createSignedShareLink/);
  assert.match(share, /Invite & Share Center/);
  assert.match(share, /does not publish this chat, your Vault, keys, recovery material, saved work, or a public profile database/i);
  assert.match(share, /activeRewards: false/);
  assert.match(share, /activePayouts: false/);
  assert.match(share, /automatedPosting: false/);
  assert.match(workspace, /data-workspace-share/);
  assert.match(workspace, /no auto-posting, payout, click-tracking, or reward is active/i);
});

test('W218 promotes the generated local avatar and three dark themes into Profile', () => {
  const profile = read('profile.html');
  const runtime = read('assets/js/profile-page.js');
  const storage = read('assets/js/utils/storage.js');
  assert.match(profile, /id="eon-profile-identity"/);
  assert.match(profile, /id="eon-profile-avatar"/);
  assert.match(profile, /data-eon-theme-choice="obsidian"/);
  assert.match(profile, /data-eon-theme-choice="neon-night"/);
  assert.match(profile, /data-eon-theme-choice="graphite"/);
  assert.match(runtime, /remixProfileAvatar/);
  assert.match(runtime, /renderAvatarMarkup/);
  assert.match(storage, /EON_THEME_OPTIONS/);
  assert.match(storage, /\['graphite', 'obsidian', 'neon-night'\]/);
});
