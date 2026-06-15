// Public-safe example: Telegram gateway rule, not production bot code.
export function openHeavySurface({ telegramWebApp, url }) {
  if (telegramWebApp?.openLink) {
    telegramWebApp.openLink(url, { try_instant_view: false });
    return { opened: 'telegram-openLink', reason: 'user-tap-browser-bridge' };
  }
  window.location.href = url;
  return { opened: 'browser-location', reason: 'fallback' };
}
