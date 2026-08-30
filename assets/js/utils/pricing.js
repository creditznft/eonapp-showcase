const ENTITLEMENT_KEY = 'eon:entitlements:v1';
const DEFAULT_STABLE_CENTS_PER_EON = 20;

function clampNumber(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max, /** @type {any} */ fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export function getStableCentsPerEon() {
  try {
    const state = JSON.parse(localStorage.getItem(ENTITLEMENT_KEY) || 'null');
    const cents = clampNumber(state?.stableCentsPerEonl, 1, 100000, DEFAULT_STABLE_CENTS_PER_EON);
    return cents;
  } catch {
    return DEFAULT_STABLE_CENTS_PER_EON;
  }
}

export function getUsdtFromEonAmount(/** @type {any} */ amountEon = 0) {
  const eon = Math.max(0, Number(amountEon) || 0);
  const centsPerEon = getStableCentsPerEon();
  return (eon * centsPerEon) / 100;
}

export function getEonFromUsdtAmount(/** @type {any} */ amountUsdt = 0) {
  const usdt = Math.max(0, Number(amountUsdt) || 0);
  const centsPerEon = getStableCentsPerEon();
  if (centsPerEon <= 0) return 0;
  return (usdt * 100) / centsPerEon;
}

export function formatUsdt(/** @type {any} */ amountUsdt = 0, /** @type {any} */ decimals = 2) {
  return `${Number(amountUsdt || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} USDT`;
}

export function formatEonEstimate(/** @type {any} */ amountEon = 0, /** @type {any} */ decimals = 2) {
  return `${Number(amountEon || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} EonLite`;
}

export function formatUsdtWithSettlement(/** @type {any} */ amountUsdt = 0, /** @type {any} */ options = {}) {
  const freeLabel = options.freeLabel || 'Free';
  const usdt = Math.max(0, Number(amountUsdt) || 0);
  if (usdt <= 0) {
    return {
      primary: freeLabel,
      settlement: 'No payment required'
    };
  }
  const eonEstimate = getEonFromUsdtAmount(usdt);
  return {
    primary: formatUsdt(usdt),
    settlement: `Settle in EonLite (~${formatEonEstimate(eonEstimate)})`
  };
}
