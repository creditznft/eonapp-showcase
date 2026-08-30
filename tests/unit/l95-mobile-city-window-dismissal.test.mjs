import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const cssPath = new URL('../../assets/css/eon-city-play.css', import.meta.url);
const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const workSurfaceCssPath = new URL('../../assets/css/eon-work-surface.css', import.meta.url);
const workSurfaceHostPath = new URL('../../assets/js/work-surface/eon-work-surface-host.js', import.meta.url);
const commandCssPath = new URL('../../assets/css/eon-command-surface.css', import.meta.url);

async function sources() {
  const [css, runtime, workSurfaceCss, workSurfaceHost, commandCss] = await Promise.all([
    readFile(cssPath, 'utf8'),
    readFile(runtimePath, 'utf8'),
    readFile(workSurfaceCssPath, 'utf8'),
    readFile(workSurfaceHostPath, 'utf8'),
    readFile(commandCssPath, 'utf8')
  ]);
  return { css, runtime, workSurfaceCss, workSurfaceHost, commandCss };
}

test('L95 mobile City sheets keep a sticky dismissal header and 48px close/minimize targets', async () => {
  const { css } = await sources();
  assert.match(css, /L95-W09[^]*position:\s*sticky;/);
  assert.match(css, /\[data-eon-city-menu-close\]/);
  assert.match(css, /\[data-eon-city-menu-minimize\]/);
  assert.match(css, /\[data-eon-city-transit-close\]/);
  assert.match(css, /\[data-eon-city-transit-minimize\]/);
  assert.match(css, /\[data-eon-city-expanse-close\]/);
  assert.match(css, /\[data-eon-city-expanse-minimize\]/);
  assert.match(css, /min-width:\s*48px\s*!important;/);
  assert.match(css, /min-height:\s*48px\s*!important;/);
  assert.match(css, /env\(safe-area-inset-bottom/);
});

test('L95 City menu exposes visible Close/Minimize and Escape dismissal without requiring scroll', async () => {
  const { runtime } = await sources();
  assert.match(runtime, /data-eon-city-menu-minimize[^>]*aria-label="Minimize City Menu"/);
  assert.match(runtime, /data-eon-city-menu-close[^>]*aria-label="Close City Menu"/);
  assert.match(runtime, /\[data-eon-city-menu-close\][^]*addEventListener\('click'[^]*closeMenu/);
  assert.match(runtime, /event\.key === 'Escape' && !menu\.hidden[^]*closeMenu/);
});


test('L95 City workspaces keep Close and Minimize visible at phone size', async () => {
  const { workSurfaceCss, workSurfaceHost } = await sources();
  assert.match(workSurfaceHost, /data-eon-work-surface-minimize[^>]*aria-label="Minimize workspace and resume City"/);
  assert.match(workSurfaceHost, /data-eon-work-surface-close[^>]*aria-label="Close workspace"/);
  assert.match(workSurfaceCss, /L95-W09[^]*position:\s*sticky;/);
  assert.match(workSurfaceCss, /\[data-eon-work-surface-close\],\[data-eon-work-surface-minimize\]/);
  assert.match(workSurfaceCss, /min-width:\s*48px;/);
  assert.match(workSurfaceCss, /min-height:\s*48px;/);
});

test('L95 Quick Command also keeps a 48px sticky phone dismissal control', async () => {
  const { commandCss } = await sources();
  assert.match(commandCss, /L95-W09[^]*\.eon-command-header \{ position: sticky;/);
  assert.match(commandCss, /\.eon-command-close \{ width: 48px; height: 48px; min-width: 48px; min-height: 48px; \}/);
});

test('L95 legacy City panels keep 48px dismissal controls visible on phones', async () => {
  const { css } = await sources();
  assert.match(css, /L95-W50[^]*\[data-eon-play-close-universe\][^]*\[data-eon-play-close-project-districts\][^]*\[data-eon-play-close-membership\][^]*\[data-eon-play-close-fairness\]/);
  assert.match(css, /L95-W50[^]*position:\s*sticky;[^]*bottom:\s*0;[^]*width:\s*100%;[^]*min-height:\s*48px;/);
  assert.match(css, /L95-W50[^]*\.eon-city-sharing-card[^]*\.eon-city-accessibility-device-card[^]*\.eon-city-flagship-card[^]*\.eon-play-living-nexus-card[^]*> header[^]*position:\s*sticky;/);
  assert.match(css, /L95-W50[^]*\[data-eon-sharing-close\][^]*\[data-eon-accessibility-close\][^]*\[data-eon-flagship-close\][^]*\[data-eon-play-living-nexus-close\][^]*\[data-eon-encounter-close\][^]*\[data-eon-realm-close\][^]*min-width:\s*48px\s*!important;[^]*min-height:\s*48px\s*!important;/);
});

test('L95 landscape phones use dynamic viewport safe areas for dismissible City panels', async () => {
  const { css } = await sources();
  assert.match(css, /L95-W51[^]*max-height:\s*540px[^]*orientation:landscape[^]*max-width:960px/);
  assert.match(css, /L95-W51[^]*100dvh[^]*safe-area-inset-top[^]*safe-area-inset-bottom/);
  assert.match(css, /L95-W51[^]*overscroll-behavior:\s*contain;[^]*scroll-padding-bottom:/);
  assert.match(css, /L95-W51[^]*\[data-eon-play-close-project-districts\][^]*position:\s*sticky;[^]*bottom:\s*0;/);
  assert.match(css, /L95-W51[^]*\[data-eon-play-living-nexus-minimize\][^]*min-width:\s*48px\s*!important;[^]*min-height:\s*48px\s*!important;/);
});

test('L95 phone sheets own the interaction plane instead of colliding with gameplay HUD controls', async () => {
  const { css } = await sources();
  assert.match(css, /L95-W52[^]*\.eon-work-surface-open[^]*\.eon-command-open[^]*\.eon-city-command-menu-body-open/);
  assert.match(css, /L95-W52[^]*\.eon-city-reduced-touch[^]*\.eon-city-sprint-toggle[^]*\.eon-city-command-prompt[^]*\.eon-city-reduced-actions/);
  assert.match(css, /L95-W52[^]*\.eon-city-surface-shelf[^]*\.eon-command-orb[^]*\.eon-command-hint/);
  assert.match(css, /L95-W52[^]*visibility:\s*hidden\s*!important;[^]*pointer-events:\s*none\s*!important;/);
});
