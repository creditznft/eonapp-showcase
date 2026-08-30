/**
 * Device Detection & Game Compatibility System
 * Detects device capabilities and recommends compatible games
 */

// Device tier constants
export const /** @type {any} */
DEVICE_TIERS = {
  LOW: 'low',      // No WebGL or WebGL 1.0 only, <4GB RAM, mobile
  MEDIUM: 'medium', // WebGL 1.0, 4-6GB RAM, mobile or low-end desktop  
  HIGH: 'high'     // WebGL 2.0, >6GB RAM, desktop or high-end mobile
};

// Game compatibility requirements
export const /** @type {any} */
GAME_REQUIREMENTS = {
  'dungeon-crawl-zero': { minTier: 'low', features: ['canvas2d'], label: 'Works on all devices' },
  'chrono-gladiators': { minTier: 'low', features: ['canvas2d'], label: 'Works on all devices' },
  'cyber-neon': { minTier: 'medium', features: ['canvas2d'], label: 'Moderate requirements' },
  'void-raider': { minTier: 'medium', features: ['canvas2d'], label: 'Moderate requirements' },
  'neon-conquest': { minTier: 'medium', features: ['canvas2d', 'touch'], label: 'Strategy game' },
  'realm-wars-lite': { minTier: 'medium', features: ['canvas2d'], label: 'Tower defense' },
  'cyber-rogue': { minTier: 'medium', features: ['canvas2d', 'touch'], label: 'Roguelike' },
  'neon-siege': { minTier: 'high', features: ['webgl1'], label: 'Enhanced graphics' },
  'neural-override': { minTier: 'high', features: ['webgl2'], label: '3D WebGL required' },
  'neon-nexus': { minTier: 'high', features: ['webgl2'], label: '3D WebGL required' }
};

/**
 * Detect WebGL support
 * @returns {{ version: number|null, vendor: string, renderer: string }}
 */
export function detectWebGL() {
  const /** @type {any} */
canvas = document.createElement('canvas');
  /** @type {any} */ const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return { version: null, vendor: 'none', renderer: 'none' };
  }
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  const version = (/** @type {any} */ (gl).constructor?.name === 'WebGL2RenderingContext') ? 2 : 1;
  
  return { version, vendor, renderer };
}

/**
 * Estimate device RAM
 * @returns {number} RAM in GB (estimated)
 */
export function detectRAM() {
  // Use navigator.deviceMemory if available (Chrome, Edge)
  if ('deviceMemory' in navigator) {
    return /** @type {number} */ (/** @type {any} */ (navigator).deviceMemory);
  }
  
  // Fallback: estimate based on WebGL renderer heuristics
  const webgl = detectWebGL();
  const renderer = webgl.renderer.toLowerCase();
  
  // Mobile GPUs typically indicate lower RAM
  if (renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('apple gpu')) {
    return 4; // Assume 4GB for mobile
  }
  
  // Desktop GPUs typically have more RAM
  if (renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('intel')) {
    return 8; // Assume 8GB for desktop
  }
  
  return 4; // Default conservative estimate
}

/**
 * Detect CPU cores
 * @returns {number}
 */
export function detectCPUCores() {
  return navigator.hardwareConcurrency || 4;
}

/**
 * Detect if device is mobile
 * @returns {boolean}
 */
export function isMobile() {
  // Check user agent
  const ua = navigator.userAgent.toLowerCase();
  const mobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  
  // Check touch support + small screen
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const smallScreen = window.innerWidth < 768;
  
  return mobileUA.test(ua) || (hasTouch && smallScreen);
}

/**
 * Detect touch support
 * @returns {boolean}
 */
export function hasTouchSupport() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detect screen capabilities
 * @returns {{ width: number, height: number, dpr: number, orientation: string }}
 */
export function detectScreen() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  };
}

/**
 * Get complete device profile
 * @returns {{
 *   tier: string,
 *   webgl: { version: number|null, vendor: string, renderer: string },
 *   ram: number,
 *   cpuCores: number,
 *   isMobile: boolean,
 *   hasTouch: boolean,
 *   screen: { width: number, height: number, dpr: number, orientation: string }
 * }}
 */
export function getDeviceProfile() {
  const webgl = detectWebGL();
  const ram = detectRAM();
  const cpuCores = detectCPUCores();
  const mobile = isMobile();
  const touch = hasTouchSupport();
  const screen = detectScreen();
  
  // Classify device tier
  let tier = DEVICE_TIERS.HIGH;
  
  if (webgl.version === null) {
    tier = DEVICE_TIERS.LOW;
  } else if (webgl.version === 1) {
    tier = DEVICE_TIERS.MEDIUM;
  } else if (ram < 4 || (mobile && cpuCores <= 4)) {
    tier = DEVICE_TIERS.MEDIUM;
  } else if (ram >= 8 && webgl.version === 2 && !mobile) {
    tier = DEVICE_TIERS.HIGH;
  }
  
  return {
    tier,
    webgl,
    ram,
    cpuCores,
    isMobile: mobile,
    hasTouch: touch,
    screen
  };
}

/**
 * Check if a game is compatible with current device
 * @param {string} gameId 
 * @returns {{ compatible: boolean, reason: string, tier: string }}
 */
export function checkGameCompatibility(/** @type {any} */ gameId) {
  const profile = getDeviceProfile();
  const req = /** @type {typeof GAME_REQUIREMENTS[keyof typeof GAME_REQUIREMENTS] | undefined} */ (
    /** @type {any} */ (GAME_REQUIREMENTS)[gameId]
  );
  
  if (!req) {
    return { compatible: true, reason: 'Unknown game - allowing', tier: profile.tier };
  }
  
  const /** @type {any} */
tierOrder = { low: 1, medium: 2, high: 3 };
  const deviceTierLevel = tierOrder[/** @type {keyof typeof tierOrder} */ (profile.tier)] || 2;
  const requiredTierLevel = tierOrder[/** @type {keyof typeof tierOrder} */ (req.minTier)] || 1;
  
  if (deviceTierLevel < requiredTierLevel) {
    return {
      compatible: false,
      reason: `Requires ${req.minTier} tier device. Your device is ${profile.tier} tier.`,
      tier: profile.tier
    };
  }
  
  return { compatible: true, reason: req.label, tier: profile.tier };
}

/**
 * Get list of compatible games sorted by compatibility
 * @param {string[]} gameIds 
 * @returns {Array<{ id: string, compatible: boolean, reason: string, tier: string }>}
 */
export function getCompatibleGames(/** @type {any} */ gameIds) {
  return gameIds
    .map((/** @type {any} */ id) => ({ id, ...checkGameCompatibility(id) }))
    .sort((/** @type {any} */ a, /** @type {any} */ b) => {
      // Compatible games first, then by tier requirement
      if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
      return 0;
    });
}

/**
 * Get device tier badge HTML
 * @param {string} tier 
 * @returns {string}
 */
export function getTierBadge(/** @type {any} */ tier) {
  const /** @type {any} */
badges = {
    low: '<span class="tier-badge tier-low" title="Basic device">📱 Basic</span>',
    medium: '<span class="tier-badge tier-medium" title="Standard device">📱✨ Standard</span>',
    high: '<span class="tier-badge tier-high" title="High-end device">🖥️🚀 High-End</span>'
  };
  return badges[/** @type {keyof typeof badges} */ (tier)] || badges.medium;
}

// Initialize on load and cache result
/** @type {ReturnType<typeof getDeviceProfile> | null} */
let _cachedProfile = null;

/**
 * Get cached device profile (faster for repeated calls)
 * @returns {ReturnType<typeof getDeviceProfile>}
 */
export function getCachedProfile() {
  if (!_cachedProfile) {
    _cachedProfile = getDeviceProfile();
  }
  return _cachedProfile;
}

// Export default object
export default {
  DEVICE_TIERS,
  GAME_REQUIREMENTS,
  detectWebGL,
  detectRAM,
  detectCPUCores,
  isMobile,
  hasTouchSupport,
  detectScreen,
  getDeviceProfile,
  checkGameCompatibility,
  getCompatibleGames,
  getTierBadge,
  getCachedProfile
};
