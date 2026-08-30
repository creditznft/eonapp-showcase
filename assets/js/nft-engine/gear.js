/**
 * Gear Library - Weapons, Armor, and Accessories for NFT Characters
 * Code-generated equipment for all game themes
 */

import { Primitives } from './primitives.js';

export class Gear {
    constructor(/** @type {any} */ ctx) {
        this.ctx = ctx;
        this.prim = new Primitives(ctx);
    }

    // ===== WEAPONS =====

    // Plasma rifle (sci-fi)
    drawPlasmaRifle(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ glowColor, /** @type {any} */ rarity) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Main body
        this.prim.fill(color);
        this.prim.stroke(glowColor, 2);
        this.ctx.beginPath();
        this.ctx.roundRect(-scale * 0.15, -scale, scale * 0.3, scale * 1.8, scale * 0.05);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Barrel
        this.prim.fill('#333');
        this.ctx.beginPath();
        this.ctx.rect(-scale * 0.05, -scale * 1.3, scale * 0.1, scale * 0.3);
        this.ctx.fill();
        
        // Energy core
        this.prim.fill(glowColor);
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.roundRect(-scale * 0.08, -scale * 0.2, scale * 0.16, scale * 0.6, scale * 0.02);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Handle
        this.prim.fill(color);
        this.ctx.beginPath();
        this.ctx.moveTo(-scale * 0.15, scale * 0.3);
        this.ctx.lineTo(-scale * 0.25, scale * 0.8);
        this.ctx.lineTo(-scale * 0.05, scale * 0.8);
        this.ctx.lineTo(scale * 0.05, scale * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Glow for rare+
        if (rarity !== 'common') {
            this.prim.drawGlow(0, -scale * 0.8, scale * 0.3, glowColor);
        }
        
        this.ctx.restore();
    }

    // Energy sword (fantasy/sci-fi)
    drawEnergySword(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ bladeColor, /** @type {any} */ handleColor, /** @type {any} */ rarity) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-Math.PI / 4);
        
        // Blade
        this.prim.fill(bladeColor);
        this.ctx.globalCompositeOperation = 'screen';
        this.prim.drawBlade(0, 0, scale * 1.5, scale * 0.2);
        this.ctx.fill();
        
        // Core glow
        this.prim.fill('#fff');
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -scale * 0.05);
        this.ctx.lineTo(scale * 0.05, scale * 1.3);
        this.ctx.lineTo(-scale * 0.05, scale * 1.3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Handle
        this.prim.fill(handleColor);
        this.prim.stroke('#111', 1);
        this.ctx.beginPath();
        this.ctx.roundRect(-scale * 0.08, scale * 1.4, scale * 0.16, scale * 0.5, scale * 0.03);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Guard
        this.prim.fill('#888');
        this.ctx.beginPath();
        this.ctx.moveTo(-scale * 0.25, scale * 1.4);
        this.ctx.lineTo(scale * 0.25, scale * 1.4);
        this.ctx.lineTo(scale * 0.15, scale * 1.5);
        this.ctx.lineTo(-scale * 0.15, scale * 1.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Particle trail for legendary
        if (rarity === 'legendary') {
            this.ctx.globalCompositeOperation = 'screen';
            this.prim.fill(bladeColor);
            for (let i = 0; i < 5; i++) {
                const px = (Math.random() - 0.5) * scale * 0.3;
                const py = -Math.random() * scale;
                this.prim.drawParticle(px, py, scale * 0.05, 'circle');
            }
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.restore();
    }

    // Battle axe
    drawBattleAxe(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ metalColor, /** @type {any} */ handleColor) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-Math.PI / 6);
        
        // Handle
        this.prim.fill(handleColor);
        this.prim.stroke('#333', 2);
        this.prim.drawCapsule(0, scale * 0.7, scale * 0.12, scale * 1.2, scale * 0.03);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Axe head
        this.prim.fill(metalColor);
        this.prim.stroke('#444', 2);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-scale * 0.4, -scale * 0.3);
        this.ctx.quadraticCurveTo(-scale * 0.5, 0, -scale * 0.3, scale * 0.1);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(scale * 0.4, -scale * 0.3);
        this.ctx.quadraticCurveTo(scale * 0.5, 0, scale * 0.3, scale * 0.1);
        this.ctx.lineTo(0, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Blade edge
        this.prim.fill('#fff');
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-scale * 0.38, -scale * 0.28);
        this.ctx.lineTo(-scale * 0.48, -scale * 0.05);
        this.ctx.lineTo(-scale * 0.28, scale * 0.08);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(scale * 0.38, -scale * 0.28);
        this.ctx.lineTo(scale * 0.48, -scale * 0.05);
        this.ctx.lineTo(scale * 0.28, scale * 0.08);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore();
    }

    // Staff/wand
    drawStaff(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ woodColor, /** @type {any} */ gemColor, /** @type {any} */ rarity) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Staff shaft
        this.prim.fill(woodColor);
        this.prim.stroke('#3d2817', 1);
        this.prim.drawCapsule(0, 0, scale * 0.08, scale * 2, scale * 0.02);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Top gem
        this.prim.fill(gemColor);
        this.ctx.globalAlpha = 0.8;
        this.prim.drawStar(0, -scale, scale * 0.15, scale * 0.08, 6);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Glow
        if (rarity !== 'common') {
            this.prim.drawGlow(0, -scale, scale * 0.4, gemColor);
        }
        
        // Magic particles for rare+
        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
            this.prim.fill(gemColor);
            this.ctx.globalAlpha = 0.6;
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.001;
                const px = Math.cos(angle) * scale * 0.2;
                const py = -scale + Math.sin(angle) * scale * 0.1;
                this.prim.drawParticle(px, py, scale * 0.03, 'circle');
            }
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.restore();
    }

    // Shield
    drawShield(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ metalColor, /** @type {any} */ emblemColor, /** @type {any} */ rarity) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Shield shape
        this.prim.fill(metalColor);
        this.prim.stroke('#444', 2);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, scale * 0.6, 0, Math.PI, true);
        this.ctx.lineTo(0, scale * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Border
        this.prim.stroke('#666', 1);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, scale * 0.5, 0, Math.PI, true);
        this.ctx.stroke();
        
        // Emblem
        this.prim.fill(emblemColor);
        this.prim.drawStar(0, scale * 0.1, scale * 0.15, scale * 0.08, 5);
        this.ctx.fill();
        
        // Damage marks for common
        if (rarity === 'common') {
            this.prim.stroke('#333', 1);
            this.ctx.beginPath();
            this.ctx.moveTo(-scale * 0.2, -scale * 0.1);
            this.ctx.lineTo(-scale * 0.1, scale * 0.1);
            this.ctx.moveTo(scale * 0.15, -scale * 0.15);
            this.ctx.lineTo(scale * 0.25, 0);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    // ===== ARMOR PIECES =====

    // Chest armor
    drawChestArmor(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ rarity) {
        this.prim.fill(color);
        this.prim.stroke('#222', 2);
        this.prim.drawCapsule(x, y, scale * 0.7, scale * 0.5, scale * 0.08);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Detail lines
        this.prim.stroke('#111', 1);
        this.ctx.beginPath();
        this.ctx.moveTo(x - scale * 0.2, y - scale * 0.15);
        this.ctx.lineTo(x - scale * 0.2, y + scale * 0.15);
        this.ctx.moveTo(x + scale * 0.2, y - scale * 0.15);
        this.ctx.lineTo(x + scale * 0.2, y + scale * 0.15);
        this.ctx.stroke();
        
        // Glow for epic+
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.stroke('#fff', 1);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - scale * 0.2);
            this.ctx.lineTo(x, y + scale * 0.2);
            this.ctx.stroke();
        }
    }

    // Helmet
    drawHelmet(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color) {
        this.prim.fill(color);
        this.prim.stroke('#222', 2);
        this.ctx.beginPath();
        this.ctx.arc(x, y, scale * 0.35, Math.PI, 0);
        this.ctx.lineTo(x + scale * 0.35, y + scale * 0.2);
        this.ctx.lineTo(x - scale * 0.35, y + scale * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Visor
        this.prim.fill('#111');
        this.ctx.beginPath();
        this.ctx.rect(x - scale * 0.25, y - scale * 0.05, scale * 0.5, scale * 0.15);
        this.ctx.fill();
    }

    // Pauldrons (shoulder pads)
    drawPauldrons(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ rarity) {
        // Left
        this.prim.fill(color);
        this.prim.stroke('#222', 2);
        this.ctx.beginPath();
        this.ctx.arc(x - scale * 0.4, y, scale * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Right
        this.ctx.beginPath();
        this.ctx.arc(x + scale * 0.4, y, scale * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Spikes for legendary
        if (rarity === 'legendary') {
            this.prim.fill('#888');
            this.prim.drawSpikes(x - scale * 0.4, y, scale * 0.2, scale * 0.35, 5);
            this.ctx.fill();
            this.prim.drawSpikes(x + scale * 0.4, y, scale * 0.2, scale * 0.35, 5);
            this.ctx.fill();
        }
    }

    // ===== ACCESSORIES =====

    // Cape
    drawCape(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.prim.fill(color);
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-scale * 0.4, 0);
        this.ctx.quadraticCurveTo(-scale * 0.5, scale, -scale * 0.3, scale * 1.5);
        this.ctx.lineTo(scale * 0.3, scale * 1.5);
        this.ctx.quadraticCurveTo(scale * 0.5, scale, scale * 0.4, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore();
    }

    // Amulet/necklace
    drawAmulet(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ gemColor, /** @type {any} */ rarity) {
        // Chain
        this.prim.stroke('#888', 2);
        this.ctx.beginPath();
        this.ctx.arc(x, y, scale * 0.3, 1.5, 1.5 + Math.PI);
        this.ctx.stroke();
        
        // Pendant
        this.prim.fill('#444');
        this.prim.drawCapsule(x, y + scale * 0.35, scale * 0.15, scale * 0.2, scale * 0.03);
        this.ctx.fill();
        
        // Gem
        this.prim.fill(gemColor);
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(x, y + scale * 0.35, scale * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Glow for rare+
        if (rarity !== 'common') {
            this.prim.drawGlow(x, y + scale * 0.35, scale * 0.2, gemColor);
        }
    }

    // Halo/aura ring
    drawHalo(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ rarity) {
        if (rarity === 'legendary') {
            this.ctx.save();
            this.ctx.translate(x, y - scale * 0.8);
            
            this.prim.stroke(color, 3);
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, scale * 0.5, scale * 0.15, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.rotate(Math.PI / 3);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, scale * 0.5, scale * 0.15, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.rotate(Math.PI / 3);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, scale * 0.5, scale * 0.15, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }
    }

    // Wings
    drawWings(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ rarity) {
        if (rarity === 'epic' || rarity === 'legendary') {
            this.ctx.save();
            this.ctx.translate(x, y);
            
            this.prim.fill(color);
            this.ctx.globalAlpha = 0.7;
            
            // Left wing
            this.ctx.beginPath();
            this.ctx.moveTo(-scale * 0.3, 0);
            this.ctx.quadraticCurveTo(-scale * 0.8, -scale * 0.5, -scale, -scale * 0.8);
            this.ctx.quadraticCurveTo(-scale * 0.6, -scale * 0.3, -scale * 0.3, -scale * 0.1);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Right wing
            this.ctx.beginPath();
            this.ctx.moveTo(scale * 0.3, 0);
            this.ctx.quadraticCurveTo(scale * 0.8, -scale * 0.5, scale, -scale * 0.8);
            this.ctx.quadraticCurveTo(scale * 0.6, -scale * 0.3, scale * 0.3, -scale * 0.1);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }
    }
}

export default Gear;
