/**
 * Theme Definitions for NFT Engine
 * Each game has unique palette, anatomy, and gear configurations
 */

export const /** @type {any} */
THEMES = {
    cosmic_arena: {
        name: 'Cosmic Arena',
        palette: ['#2E0854', '#00F5FF', '#A020F0', '#FFD700', '#FF6B6B'],
        anatomy: 'blob',
        weapons: ['plasma_rifle', 'energy_sword', 'staff'],
        effects: ['cosmic', 'energy', 'particles'],
        gear: ['jetpack', 'armor', 'halo'],
        description: 'Space aliens and cosmic warriors'
    },
    
    neon_dungeon: {
        name: 'Neon Dungeon',
        palette: ['#1a1a1a', '#ff4500', '#aaaaaa', '#8b0000', '#ffd700'],
        anatomy: 'skeleton',
        weapons: ['battle_axe', 'energy_sword', 'staff'],
        effects: ['fire', 'smoke', 'magic'],
        gear: ['cape', 'crown', 'pauldrons'],
        description: 'Skeleton warriors and dark fantasy'
    },
    
    neon_rally: {
        name: 'Neon Rally',
        palette: ['#0ff', '#f0f', '#111', '#ff0', '#f00'],
        anatomy: 'vehicle',
        weapons: ['nitro', 'speed_boost'],
        effects: ['speed', 'energy', 'smoke'],
        gear: ['spoiler', 'underglow', 'nitro'],
        description: 'Racing cars and speed demons'
    },
    
    cyber_neon: {
        name: 'Cyber Neon',
        palette: ['#0a0a1a', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'],
        anatomy: 'robot',
        weapons: ['plasma_rifle', 'energy_sword', 'shield'],
        effects: ['energy', 'lightning', 'particles'],
        gear: ['armor', 'jetpack', 'wings'],
        description: 'Cyberpunk robots and mechs'
    },
    
    chrono_gladiators: {
        name: 'Chrono Gladiators',
        palette: ['#8b4513', '#daa520', '#ff4500', '#4169e1', '#ffd700'],
        anatomy: 'skeleton',
        weapons: ['battle_axe', 'shield', 'staff'],
        effects: ['magic', 'fire', 'particles'],
        gear: ['helmet', 'cape', 'pauldrons'],
        description: 'Ancient warriors and time travelers'
    },
    
    alchemy_lab: {
        name: 'Alchemy Lab',
        palette: ['#2d5016', '#90ee90', '#ff69b4', '#ffd700', '#00ced1'],
        anatomy: 'blob',
        weapons: ['staff', 'potion'],
        effects: ['magic', 'smoke', 'particles'],
        gear: ['amulet', 'cape'],
        description: 'Alchemists and magical creatures'
    },
    
    cyber_rogue: {
        name: 'Cyber Rogue',
        palette: ['#1a1a2e', '#e94560', '#0f3460', '#16c79a', '#f9a826'],
        anatomy: 'robot',
        weapons: ['plasma_rifle', 'shield', 'energy_sword'],
        effects: ['smoke', 'energy', 'particles'],
        gear: ['cape', 'armor', 'amulet'],
        description: 'Stealth operatives and hackers'
    },
    
    neon_dungeon_racing: {
        name: 'Neon Dungeon Racing',
        palette: ['#2d1b4e', '#ff6b35', '#f7931e', '#ffd23f', '#06ffa5'],
        anatomy: 'vehicle',
        weapons: ['nitro', 'speed_boost'],
        effects: ['fire', 'speed', 'smoke'],
        gear: ['underglow', 'spoiler'],
        description: 'Dungeon-themed racing machines'
    }
};

// Anatomy type to theme mapping
export const /** @type {any} */
ANATOMY_THEMES = {
    blob: ['cosmic_arena', 'alchemy_lab'],
    skeleton: ['neon_dungeon', 'chrono_gladiators'],
    robot: ['cyber_neon', 'cyber_rogue'],
    vehicle: ['neon_rally', 'neon_dungeon_racing']
};

// Get theme by ID
export function getTheme(/** @type {any} */ themeId) {
    return (/** @type {any} */ (THEMES))[themeId] || THEMES.cosmic_arena;
}

// Get all themes
export function getAllThemes() {
    return Object.keys(THEMES).map(/** @type {any} */ id => ({ id, ...(/** @type {any} */ (THEMES))[id] }));
}

// Get themes by anatomy
export function getThemesByAnatomy(/** @type {any} */ anatomy) {
    const themeIds = (/** @type {any} */ (ANATOMY_THEMES))[anatomy] || ['cosmic_arena'];
    return themeIds.map((/** @type {any} */ id) => ({ id, ...(/** @type {any} */ (THEMES))[id] }));
}

// Rarity configurations
export const /** @type {any} */
RARITY_CONFIG = {
    common: {
        layers: 3,
        effects: 1,
        accessories: 0,
        glow: false,
        particles: 0
    },
    rare: {
        layers: 5,
        effects: 2,
        accessories: 1,
        glow: true,
        particles: 5
    },
    epic: {
        layers: 8,
        effects: 3,
        accessories: 2,
        glow: true,
        particles: 10
    },
    legendary: {
        layers: 12,
        effects: 4,
        accessories: 3,
        glow: true,
        particles: 20
    }
};

// Color utilities
export function adjustColor(/** @type {any} */ color, /** @type {any} */ amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function lighten(/** @type {any} */ color, /** @type {any} */ percent) {
    return adjustColor(color, Math.floor(255 * percent));
}

export function darken(/** @type {any} */ color, /** @type {any} */ percent) {
    return adjustColor(color, -Math.floor(255 * percent));
}

export default THEMES;
