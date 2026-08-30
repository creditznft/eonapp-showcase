/**
 * NFT Engine - Main Composition Engine
 * Assembles layers into complete NFT character art
 */

import { SeededRNG } from './rng.js';
import { Primitives } from './primitives.js';
import { Anatomy } from './anatomy.js';
import { Gear } from './gear.js';
import { Effects } from './effects.js';
import { RARITY_CONFIG, getTheme } from './themes.js';

export class NFTEngine {
    constructor(/** @type {any} */ canvas = null) {
        this.canvas = canvas || document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.ctx = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
        this.prim = new Primitives(this.ctx);
        this.anatomy = new Anatomy(this.ctx);
        this.gear = new Gear(this.ctx);
        this.effects = new Effects(this.ctx);
        this.W = 512; this.H = 512;
        this.CENTER_X = 256;
        this.CENTER_Y = 286;
    }

    generate(/** @type {any} */ themeId, /** @type {any} */ rarity = 'common', /** @type {any} */ seed = Date.now()) {
        const rng = new SeededRNG(seed);
        const theme = getTheme(themeId);
        const config = (/** @type {any} */ (RARITY_CONFIG))[rarity] || RARITY_CONFIG.common;
        
        this.ctx.clearRect(0, 0, this.W, this.H);
        
        // Layer composition
        this.drawBackground(theme, rarity, rng);
        this.drawGround(rarity, rng);
        this.drawCharacter(theme, rarity, rng, config);
        this.drawEffects(theme, rarity, rng, config);
        this.drawFrame(rarity, rng);
        
        const traits = this.generateTraits(theme, rarity, rng);
        return {
            seed, theme: themeId, rarity,
            name: this.generateName(theme, rarity, rng, traits),
            description: `${rarity.toUpperCase()} ${theme.name} collectible`,
            traits,
            image: this.canvas.toDataURL('image/png')
        };
    }

    drawBackground(/** @type {any} */ theme, /** @type {any} */ rarity, /** @type {any} */ rng) {
        this.effects.drawBackground(this.W, this.H, theme.name.toLowerCase().replace(/\s+/g, '_'));
        if (rarity !== 'common') {
            for (let i = 0; i < (rarity === 'legendary' ? 8 : 4); i++) {
                this.ctx.globalAlpha = 0.05 + rng.random() * 0.1;
                this.prim.fill(rng.choice(theme.palette.slice(0, 3)));
                this.prim.drawBlob(rng.range(0, this.W), rng.range(0, this.H), 50 + rng.random() * 100, 6, 0.2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }
    }

    drawGround(/** @type {any} */ _rarity, /** @type {any} */ _rng) {
        this.prim.fill('rgba(0,0,0,0.3)');
        this.prim.drawOval(this.CENTER_X, this.CENTER_Y + 80, 120, 30);
        this.ctx.fill();
    }

    drawCharacter(/** @type {any} */ theme, /** @type {any} */ rarity, /** @type {any} */ rng, /** @type {any} */ config) {
        const scale = 100;
        const anatomyType = theme.anatomy;
        const palette = theme.palette;
        
        // Choose gear and weapon
        const /** @type {any} */
gearSlots = [];
        if (config.accessories > 0) {
            const /** @type {any} */
availableGear = [...theme.gear];
            rng.shuffle(availableGear);
            gearSlots.push(...availableGear.slice(0, config.accessories));
        }
        const weapon = rng.choice(theme.weapons);
        
        // Draw anatomy
        this.drawAnatomy(anatomyType, this.CENTER_X, this.CENTER_Y, scale, palette, rng, rarity);
        this.drawGear(gearSlots, this.CENTER_X, this.CENTER_Y, scale, palette, rng, rarity);
        this.drawWeapon(weapon, this.CENTER_X + 60, this.CENTER_Y + 20, scale * 0.6, palette, rng, rarity);
    }

    drawAnatomy(/** @type {any} */ type, /** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ rarity) {
        switch (type) {
            case 'blob': this.anatomy.drawBlobCreature(x, y, scale, palette, rng, rarity); break;
            case 'skeleton': this.anatomy.drawSkeleton(x, y, scale, palette, rng, rarity); break;
            case 'robot': this.anatomy.drawRobot(x, y, scale, palette, rng, rarity); break;
            case 'vehicle': this.anatomy.drawVehicle(x, y, scale, palette, rng, rarity); break;
            default: this.anatomy.drawBlobCreature(x, y, scale, palette, rng, rarity);
        }
    }

    drawGear(/** @type {any} */ gearSlots, /** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ rarity) {
        gearSlots.forEach((/** @type {any} */ gear) => {
            const color = rng.choice(palette.slice(1));
            switch (gear) {
                case 'armor': this.gear.drawChestArmor(x, y - scale * 0.3, scale, color, rarity); break;
                case 'helmet': this.gear.drawHelmet(x, y - scale * 0.8, scale, color); break;
                case 'pauldrons': this.gear.drawPauldrons(x, y - scale * 0.3, scale, color, rarity); break;
                case 'cape': this.gear.drawCape(x, y - scale * 0.1, scale, color); break;
                case 'amulet': this.gear.drawAmulet(x, y - scale * 0.3, scale, color, rarity); break;
                case 'halo': this.gear.drawHalo(x, y, scale, color, rarity); break;
                case 'wings': this.gear.drawWings(x, y - scale * 0.5, scale, color, rarity); break;
                case 'shield': this.gear.drawShield(x - 50, y + 10, scale * 0.5, color, palette[0], rarity); break;
            }
        });
    }

    drawWeapon(/** @type {any} */ weapon, /** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ _rng, /** @type {any} */ rarity) {
        const color = palette[0];
        const glow = palette[2] || palette[1];
        switch (weapon) {
            case 'plasma_rifle': this.gear.drawPlasmaRifle(x, y, scale, color, glow, rarity); break;
            case 'energy_sword': this.gear.drawEnergySword(x, y, scale, glow, color, rarity); break;
            case 'battle_axe': this.gear.drawBattleAxe(x, y, scale, '#888', color); break;
            case 'staff': this.gear.drawStaff(x, y, scale, color, glow, rarity); break;
        }
    }

    drawEffects(/** @type {any} */ theme, /** @type {any} */ _rarity, /** @type {any} */ rng, /** @type {any} */ config) {
        const effectType = rng.choice(theme.effects);
        const effectX = this.CENTER_X;
        const effectY = this.CENTER_Y - 50;
        const scale = 100;
        
        for (let i = 0; i < config.effects; i++) {
            switch (effectType) {
                case 'fire': this.effects.drawFire(effectX + rng.range(-30, 30), effectY, scale, config.effects); break;
                case 'lightning': this.effects.drawLightning(effectX, effectY, scale, config.effects); break;
                case 'magic': this.effects.drawMagic(effectX, effectY - 50, scale, theme.palette[2]); break;
                case 'cosmic': this.effects.drawCosmic(effectX, effectY, scale, config.effects); break;
                case 'energy': this.effects.drawEnergy(effectX, effectY, scale, theme.palette[1]); break;
                case 'smoke': this.effects.drawSmoke(effectX, effectY + 50, scale); break;
                case 'speed': this.effects.drawSpeedLines(effectX - 100, effectY, scale); break;
            }
        }
        
        // Particles
        if (config.particles > 0) {
            this.effects.drawParticles(effectX, effectY, scale * 0.8, theme.palette[2] || '#fff', config.particles);
        }
    }

    drawFrame(/** @type {any} */ rarity, /** @type {any} */ _rng) {
        this.effects.drawRarityFrame(this.CENTER_X, this.CENTER_Y - 30, 130, rarity);
    }

    generateTraits(/** @type {any} */ theme, /** @type {any} */ rarity, /** @type {any} */ rng) {
        const /** @type {any} */
anatomyTraits = ['Blob Creature', 'Skeleton', 'Robot', 'Racing Vehicle'];
        const /** @type {any} */
anatomyIndex = { blob: 0, skeleton: 1, robot: 2, vehicle: 3 };
        
        return [
            { trait_type: 'Theme', value: theme.name },
            { trait_type: 'Anatomy', value: anatomyTraits[(/** @type {any} */ (anatomyIndex))[theme.anatomy]] || 'Unknown' },
            { trait_type: 'Rarity', value: rarity.charAt(0).toUpperCase() + rarity.slice(1) },
            { trait_type: 'Weapon', value: rng.choice(theme.weapons).replace(/_/g, ' ') },
            { trait_type: 'Primary Color', value: theme.palette[1] },
            { trait_type: 'Effect Type', value: rng.choice(theme.effects).replace(/_/g, ' ') }
        ];
    }

    generateName(/** @type {any} */ theme, /** @type {any} */ rarity, /** @type {any} */ rng, /** @type {any} */ _traits) {
        const /** @type {any} */
prefixes = {
            common: ['Basic', 'Simple', 'Standard', 'Novice'],
            rare: ['Skilled', 'Veteran', 'Elite', 'Rare'],
            epic: ['Master', 'Epic', 'Legendary', 'Mythic'],
            legendary: ['Divine', 'Ethereal', 'Celestial', 'Godly']
        };
        const /** @type {any} */
anatomyNames = { blob: 'Alien', skeleton: 'Skeleton', robot: 'Cyborg', vehicle: 'Racer' };
        const prefix = rng.choice((/** @type {any} */ (prefixes))[rarity]);
        const anatomy = (/** @type {any} */ (anatomyNames))[theme.anatomy] || 'Warrior';
        return `${prefix} ${anatomy}`;
    }

    // Export as PNG/SVG
    exportPNG() {
        return this.canvas.toDataURL('image/png');
    }

    exportSVG(/** @type {any} */ themeId, /** @type {any} */ _rarity, /** @type {any} */ _seed) {
        const theme = getTheme(themeId);
        let svg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<defs><radialGradient id="bg" cx="50%" cy="0%"><stop offset="0%" stop-color="${theme.palette[0]}"/><stop offset="100%" stop-color="#000"/></radialGradient></defs>`;
        svg += `<rect width="512" height="512" fill="url(#bg)"/>`;
        svg += `</svg>`;
        return svg;
    }
}

export default NFTEngine;
