import { renderSocialMissionWidget } from './social-mission-widget.js';
import { renderSharePerformanceDashboard } from './share-performance-dashboard.js';
import { renderSocialMissionAdmin } from './social-mission-admin.js';
import { readShareAttribution } from '../utils/share-attribution.js';
import { recordSharePerformance } from '../utils/share-performance.js';

const CONFIG = {
  '/onboarding.html': { heading: 'Generate your first signed EON link', description: 'Finish setup by creating a referral identity and sharing a verifiable mission on X, Telegram, WhatsApp or any channel.', destination: '/onboarding.html', event: 'feature_open' },
  '/telegram.html': { heading: 'Launch a Telegram or X share mission', description: 'Grow @EonApps with a unique signed link and see attributed visits without a central tracking database.', destination: '/telegram.html', platform: 'telegram', event: 'telegram_miniapp_open' },
  '/realm.html': { heading: 'Share EON City or your Realm', description: 'Create a tracked tour link, photo-mode link, or public EON City mission.', destination: '/realm.html', event: 'realm_entered' },
  '/realmworld.html': { heading: 'Invite people into RealmWorld', description: 'Use a signed child link for direct performance credit while preserving the original referral root.', destination: '/realmworld.html', event: 'realm_entered' },
  '/rewards': { heading: 'Signed referral identity', description: 'Create signed links and inspect local share context. No reward campaign or payout is active.', destination: '/rewards' },
  '/marketplace.html': { heading: 'Share this marketplace', description: 'Attribute listing views and verified purchases to a signed campaign without unrelated analytics formats.', destination: '/marketplace.html' },
  '/creator-studio.html': { heading: 'Distribute with tracked creator links', description: 'Create signed links for profiles, templates, media, campaigns, and drops across X and every public channel.', destination: '/creator-studio.html' },
  '/campaign-admin.html': { heading: 'Test a signed campaign link', description: 'Create campaign links and review proof status, first-party performance, caps, and reward policy.', destination: '/campaign-admin.html' }
};

async function boot() {
  const path = location.pathname === '/' ? '/index.html' : location.pathname;
  const config = CONFIG[path];
  if (!config || document.querySelector('[data-social-surface-bootstrap="1"]')) return;
  const main = document.querySelector('main') || document.body;
  const host = document.createElement('section');
  host.dataset.socialSurfaceBootstrap = '1';
  host.className = 'eon-social-surface-host';
  main.appendChild(host);
  await renderSocialMissionWidget(host, config);

  if (path === '/rewards' || path === '/campaign-admin.html') {
    const dashboard = document.createElement('section');
    dashboard.dataset.sharePerformanceDashboard = '1';
    main.appendChild(dashboard);
    renderSharePerformanceDashboard(dashboard);
  }
  if (path === '/campaign-admin.html') {
    const admin = document.createElement('section');
    admin.dataset.socialMissionAdmin = '1';
    main.appendChild(admin);
    renderSocialMissionAdmin(admin);
  }
  const attribution = readShareAttribution();
  if (config.event && attribution?.shareId) {
    await recordSharePerformance(config.event, { attribution, proof: { route: path } });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
else void boot();
