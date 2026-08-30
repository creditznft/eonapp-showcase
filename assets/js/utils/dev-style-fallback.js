function stylesheetHasRules(/** @type {any} */ link) {
  try {
    return Boolean(link.sheet && link.sheet.cssRules && link.sheet.cssRules.length > 0);
  } catch {
    return false;
  }
}

function withDirectCssHref(/** @type {any} */ href) {
  const url = new URL(href, window.location.origin);
  if (url.searchParams.has('direct')) return url.toString();
  url.searchParams.append('direct', '');
  return url.toString().replace(/=(&|$)/, '$1');
}

function waitForStylesheetLoad(/** @type {any} */ link) {
  return new Promise((/** @type {any} */ resolve) => {
    const done = () => resolve(undefined);
    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });
}

export async function ensureRuntimeStyles() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter((/** @type {any} */ link) => /\/assets\/css\/.+\.css$/i.test(link.getAttribute('href') || ''));

  const broken = links.filter((/** @type {any} */ link) => !stylesheetHasRules(link));
  if (!broken.length) return;

  await Promise.all(broken.map(async (/** @type {any} */ link) => {
    const currentHref = link.getAttribute('href') || '';
    if (!currentHref) return;
    const directHref = withDirectCssHref(currentHref);
    if (currentHref === directHref) return;
    link.setAttribute('href', directHref);
    await waitForStylesheetLoad(link);
  }));
}