/**
 * Effects Library - Fire, Lightning, Particles for NFT Characters
 */

import { Primitives } from './primitives.js';

export class Effects {
    constructor(/** @type {any} */ ctx) {
        this.ctx = ctx;
        this.prim = new Primitives(ctx);
    }

    // Fire effect
    drawFire(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ intensity = 1) {
        const /** @type {any} */
colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'];
        
        this.ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5 * intensity; i++) {
            this.prim.fill(colors[i % colors.length]);
            const fx = x + (Math.random() - 0.5) * scale * 0.5;
            const fy = y - Math.random() * scale;
            const fScale = scale * (0.3 + Math.random() * 0.4);
            this.prim.drawFlame(fx, fy, fScale, fScale * 0.3);
            this.ctx.fill();
        }
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Lightning effect
    drawLightning(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ intensity = 1) {
        this.prim.stroke('#fff', 2);
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        
        for (let i = 0; i < 3 * intensity; i++) {
            const startX = x + (Math.random() - 0.5) * scale * 0.5;
            const endX = x + (Math.random() - 0.5) * scale * 0.8;
            this.prim.drawLightning(startX, y - scale * 0.3, endX, y + scale * 0.5, 4);
        }
        
        this.ctx.shadowBlur = 0;
    }

    // Particle field
    drawParticles(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ count = 10, /** @type {any} */ shape = 'circle') {
        this.prim.fill(color);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = Math.random() * scale;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            this.prim.drawParticle(px, py, scale * 0.03 * (1 + Math.random()), shape);
        }
    }

    // Cosmic/space effect
    drawCosmic(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ intensity = 1) {
        const /** @type {any} */
colors = ['#4b0082', '#8a2be2', '#00bfff', '#fff'];
        
        this.ctx.globalCompositeOperation = 'screen';
        
        // Nebula clouds
        for (let i = 0; i < 8 * intensity; i++) {
            this.prim.fill(colors[i % colors.length]);
            this.ctx.globalAlpha = 0.15;
            const cx = x + (Math.random() - 0.5) * scale * 2;
            const cy = y + (Math.random() - 0.5) * scale * 2;
            this.prim.drawBlob(cx, cy, scale * 0.4, 6, 0.2);
            this.ctx.fill();
        }
        
        // Stars
        this.prim.fill('#fff');
        for (let i = 0; i < 20; i++) {
            const sx = x + (Math.random() - 0.5) * scale * 3;
            const sy = y + (Math.random() - 0.5) * scale * 3;
            const sSize = Math.random() * scale * 0.05;
            this.ctx.globalAlpha = 0.5 + Math.random() * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Smoke/fog effect
    drawSmoke(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color = '#666') {
        this.ctx.globalCompositeOperation = 'multiply';
        this.prim.fill(color);
        this.ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 5; i++) {
            const sx = x + (Math.random() - 0.5) * scale;
            const sy = y + (Math.random() - 0.5) * scale * 0.5;
            this.prim.drawSmoke(sx, sy, scale * 0.3);
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Magic/sparkle effect
    drawMagic(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color = '#ffff00') {
        this.ctx.globalCompositeOperation = 'screen';
        this.prim.fill(color);
        
        // Sparkles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = scale * 0.4 + Math.random() * scale * 0.2;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            
            this.ctx.globalAlpha = 0.6 + Math.random() * 0.4;
            this.prim.drawStar(px, py, scale * 0.08, scale * 0.04, 4);
            this.ctx.fill();
        }
        
        // Center glow
        this.prim.drawGlow(x, y, scale * 0.5, color);
        
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Energy/electric effect
    drawEnergy(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color = '#00ffff') {
        this.prim.stroke(color, 3);
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        this.ctx.globalAlpha = 0.8;
        
        // Energy rings
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, scale * (0.3 + i * 0.2), 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Radial lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.0005;
            const r1 = scale * 0.4;
            const r2 = scale * 0.6;
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * r1, y + Math.sin(angle) * r1);
            this.ctx.lineTo(x + Math.cos(angle) * r2, y + Math.sin(angle) * r2);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }

    // Blood/gore effect
    drawBlood(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale) {
        this.prim.fill('#8b0000');
        this.ctx.globalAlpha = 0.7;
        
        // Splatter drops
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * scale;
            const bx = x + Math.cos(angle) * distance;
            const by = y + Math.sin(angle) * distance;
            const bSize = scale * 0.05 * (1 + Math.random());
            
            this.ctx.beginPath();
            this.ctx.arc(bx, by, bSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    }

    // Speed/velocity lines
    drawSpeedLines(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ direction = 0) {
        this.prim.stroke('#fff', 1);
        this.ctx.globalAlpha = 0.4;
        
        for (let i = 0; i < 8; i++) {
            const offset = (Math.random() - 0.5) * scale;
            const length = scale * (0.5 + Math.random());
            const startX = x - Math.cos(direction) * length + offset;
            const startY = y - Math.sin(direction) * length + offset;
            const endX = x + offset;
            const endY = y + offset;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }

    // Rarity glow frame
    drawRarityFrame(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ rarity) {
        const /** @type {any} */
colors = {
            common: '#64748b',
            rare: '#3b82f6',
            epic: '#a855f7',
            legendary: '#f59e0b'
        };
        
        const color = (/** @type {any} */ (colors))[rarity] || colors.common;
        const intensity = rarity === 'common' ? 10 : rarity === 'rare' ? 20 : rarity === 'epic' ? 30 : 50;
        
        // Outer glow
        this.ctx.save();
        this.ctx.shadowBlur = intensity;
        this.ctx.shadowColor = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = rarity === 'legendary' ? 4 : 2;
        
        // Frame shape (rounded rect)
        this.ctx.strokeRect(x - scale, y - scale, scale * 2, scale * 2);
        
        // Corner decorations for higher rarities
        if (rarity !== 'common') {
            const cornerSize = scale * 0.15;
            const /** @type {any} */
corners = [
                { x: x - scale, y: y - scale },
                { x: x + scale, y: y - scale },
                { x: x + scale, y: y + scale },
                { x: x - scale, y: y + scale }
            ];
            
            corners.forEach((/** @type {any} */ corner) => {
                this.prim.fill(color);
                this.ctx.beginPath();
                this.ctx.arc(corner.x, corner.y, cornerSize, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // Corner stars for epic/legendary
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.fill('#fff');
            const /** @type {any} */
corners = [
                { x: x - scale, y: y - scale },
                { x: x + scale, y: y - scale },
                { x: x + scale, y: y + scale },
                { x: x - scale, y: y + scale }
            ];
            
            corners.forEach((/** @type {any} */ corner) => {
                this.prim.drawStar(corner.x, corner.y, scale * 0.08, scale * 0.04, 5);
                this.ctx.fill();
            });
        }
        
        this.ctx.restore();
    }

    // Background gradient based on theme
    drawBackground(/** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ theme) {
        const /** @type {any} */
gradients = {
            cosmic_arena: ['#0a0a1a', '#1a0a3e', '#0f172a'],
            neon_dungeon: ['#1a0a0a', '#2a0a0a', '#0a0a0a'],
            neon_rally: ['#0a1a1a', '#0a2a2a', '#051515'],
            cyber_neon: ['#0a0a1a', '#1a0a2a', '#0a0a1a'],
            chrono_gladiators: ['#2a1a0a', '#1a0a0a', '#0a0a0a']
        };
        
        const colors = (/** @type {any} */ (gradients))[theme] || gradients.cosmic_arena;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
    }
}

export default Effects;
