/** RT92 Google AdSense site-verification helper. No display-ad runtime is loaded here. */
export const GOOGLE_ADSENSE_ACCOUNT = 'ca-pub-6759380023085970';
export const GOOGLE_ADSENSE_ADS_TXT_LINE = 'google.com, pub-6759380023085970, DIRECT, f08c47fec0942fa0';

export function injectGoogleAdsenseAccountMeta(html = '', account = GOOGLE_ADSENSE_ACCOUNT) {
  const source = String(html || '');
  const safeAccount = String(account || '').trim();
  if (!/^ca-pub-[0-9]{10,32}$/.test(safeAccount)) throw new Error('Invalid Google AdSense account identifier.');
  if (!/<\/head>/i.test(source)) throw new Error('Cannot inject Google AdSense ownership meta without </head>.');
  const marker = `<meta name="google-adsense-account" content="${safeAccount}">`;
  const withoutExisting = source.replace(/\s*<meta\s+name=["']google-adsense-account["'][^>]*>\s*/gi, '\n');
  return withoutExisting.replace(/<\/head>/i, `  ${marker}\n</head>`);
}
