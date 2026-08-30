/**
 * Anatomy Templates for NFT Characters
 * Code-generated body structures for different game themes
 */

import { Primitives } from './primitives.js';

export class Anatomy {
    constructor(/** @type {any} */ ctx) {
        this.ctx = ctx;
        this.prim = new Primitives(ctx);
    }

    // Blob creature (aliens, monsters, spirits)
    drawBlobCreature(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ rarity) {
        const baseColor = palette[0];
        const highlightColor = palette[1] || baseColor;
        const glowColor = palette[2] || highlightColor;
        
        // Shadow
        this.prim.fill('rgba(0,0,0,0.3)');
        this.prim.drawOval(x, y + scale * 0.4, scale * 1.2, scale * 0.3);
        this.ctx.fill();
        
        // Main body (blob shape)
        this.prim.fill(baseColor);
        this.prim.stroke(highlightColor, 2);
        this.prim.drawBlob(x, y, scale * 0.8, 10, 0.2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Body highlights
        this.prim.fill(highlightColor);
        this.ctx.globalAlpha = 0.3;
        this.prim.drawBlob(x - scale * 0.2, y - scale * 0.2, scale * 0.3, 6, 0.1);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Eyes
        const eyeType = rng.bool(0.5) ? 'normal' : 'glowing';
        const eyeSize = scale * 0.15;
        this.prim.drawEye(x - scale * 0.25, y - scale * 0.1, eyeSize, eyeType);
        this.prim.drawEye(x + scale * 0.25, y - scale * 0.1, eyeSize, eyeType);
        
        // Extra eyes for higher rarity
        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
            this.prim.drawEye(x, y - scale * 0.3, eyeSize * 0.7, eyeType);
        }
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.drawEye(x - scale * 0.4, y + scale * 0.1, eyeSize * 0.6, eyeType);
            this.prim.drawEye(x + scale * 0.4, y + scale * 0.1, eyeSize * 0.6, eyeType);
        }
        
        // Mouth
        this.ctx.beginPath();
        this.ctx.arc(x, y + scale * 0.2, scale * 0.15, 0.2, Math.PI - 0.2);
        this.prim.stroke(highlightColor, 2);
        this.ctx.stroke();
        
        // Tentacles for higher rarity
        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
            const tentacleCount = rarity === 'legendary' ? 6 : rarity === 'epic' ? 4 : 2;
            this.prim.stroke(glowColor, 3);
            for (let i = 0; i < tentacleCount; i++) {
                const angle = (i / tentacleCount) * Math.PI * 2;
                const tx = x + Math.cos(angle) * scale * 0.6;
                const ty = y + Math.sin(angle) * scale * 0.6;
                this.prim.drawTentacle(tx, ty, tx + Math.cos(angle) * scale * 0.5, ty + Math.sin(angle) * scale * 0.5, 4, i);
            }
        }
        
        // Spikes for legendary
        if (rarity === 'legendary') {
            this.prim.fill(glowColor);
            this.prim.drawSpikes(x, y, scale * 0.7, scale * 1.0, 8);
            this.ctx.fill();
        }
    }

    // Skeleton humanoid (dungeon, fantasy, dark themes)
    drawSkeleton(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ rarity) {
        const boneColor = palette[0];
        const glowColor = palette[2] || '#ff6600';
        
        // Shadow
        this.prim.fill('rgba(0,0,0,0.3)');
        this.prim.drawOval(x, y + scale * 0.8, scale * 0.8, scale * 0.2);
        this.ctx.fill();
        
        // Skeleton structure
        this.prim.stroke(boneColor, scale * 0.08);
        this.prim.fill(boneColor);
        
        // Spine
        this.drawSpine(x, y, scale);
        
        // Ribcage
        this.drawRibcage(x, y - scale * 0.2, scale * 0.6);
        
        // Skull
        this.prim.drawSkull(x, y - scale * 0.6, scale * 0.35);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Arms
        this.drawArm(x - scale * 0.35, y - scale * 0.15, scale * 0.4, -0.5, rng);
        this.drawArm(x + scale * 0.35, y - scale * 0.15, scale * 0.4, 0.5, rng);
        
        // Legs
        this.drawLeg(x - scale * 0.15, y + scale * 0.4, scale * 0.5, rng);
        this.drawLeg(x + scale * 0.15, y + scale * 0.4, scale * 0.5, rng);
        
        // Glowing eyes for higher rarity
        if (rarity !== 'common') {
            this.prim.drawGlow(x - scale * 0.1, y - scale * 0.65, scale * 0.15, glowColor);
            this.prim.drawGlow(x + scale * 0.1, y - scale * 0.65, scale * 0.15, glowColor);
        }
        
        // Flaming skull for epic/legendary
        if (rarity === 'epic' || rarity === 'legendary') {
            this.ctx.globalCompositeOperation = 'screen';
            this.prim.fill(glowColor);
            this.prim.drawFlame(x, y - scale * 0.9, scale * 0.4, scale * 0.15);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // Crown or helmet for legendary
        if (rarity === 'legendary') {
            this.drawCrown(x, y - scale * 0.95, scale * 0.3, glowColor);
        }
    }

    // Helper: Draw spine
    drawSpine(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale) {
        const segments = 5;
        const segmentHeight = scale * 0.12;
        
        for (let i = 0; i < segments; i++) {
            const sy = y + i * segmentHeight;
            this.ctx.beginPath();
            this.ctx.arc(x, sy, scale * 0.06, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // Helper: Draw ribcage
    drawRibcage(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale) {
        for (let i = 0; i < 4; i++) {
            const ry = y + i * scale * 0.15;
            // Left rib
            this.ctx.beginPath();
            this.ctx.arc(x - scale * 0.15, ry, scale * 0.2, -Math.PI * 0.3, Math.PI * 0.8, true);
            this.ctx.stroke();
            // Right rib
            this.ctx.beginPath();
            this.ctx.arc(x + scale * 0.15, ry, scale * 0.2, -Math.PI * 0.8, Math.PI * 0.3, false);
            this.ctx.stroke();
        }
    }

    // Helper: Draw arm
    drawArm(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ angle, /** @type {any} */ _rng) {
        const endX = x + Math.cos(angle) * scale;
        const endY = y + Math.sin(angle) * scale;
        this.prim.drawBone(x, y, endX, endY, scale * 0.1);
        
        // Forearm
        const handX = endX + Math.cos(angle + 0.3) * scale * 0.8;
        const handY = endY + Math.sin(angle + 0.3) * scale * 0.8;
        this.prim.drawBone(endX, endY, handX, handY, scale * 0.08);
    }

    // Helper: Draw leg
    drawLeg(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ rng) {
        const kneeX = x + (rng.random() - 0.5) * scale * 0.2;
        const kneeY = y + scale * 0.4;
        this.prim.drawBone(x, y, kneeX, kneeY, scale * 0.12);
        
        const footX = kneeX + (rng.random() - 0.5) * scale * 0.3;
        const footY = kneeY + scale * 0.4;
        this.prim.drawBone(kneeX, kneeY, footX, footY, scale * 0.1);
    }

    // Helper: Draw crown
    drawCrown(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color) {
        this.prim.fill(color);
        this.ctx.beginPath();
        this.ctx.moveTo(x - scale, y);
        this.ctx.lineTo(x - scale * 0.5, y - scale);
        this.ctx.lineTo(x, y - scale * 0.3);
        this.ctx.lineTo(x + scale * 0.5, y - scale);
        this.ctx.lineTo(x + scale, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Gems
        this.prim.fill('#ff0000');
        this.ctx.beginPath();
        this.ctx.arc(x, y - scale * 0.5, scale * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Robot/Mech (cyber, sci-fi)
    drawRobot(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ rng, /** @type {any} */ rarity) {
        const metalColor = palette[0];
        const accentColor = palette[1] || '#00ffff';
        const glowColor = palette[2] || '#ff00ff';
        
        // Shadow
        this.prim.fill('rgba(0,0,0,0.4)');
        this.prim.drawOval(x, y + scale * 0.7, scale, scale * 0.25);
        this.ctx.fill();
        
        // Torso (blocky)
        this.prim.fill(metalColor);
        this.prim.stroke(accentColor, 2);
        this.prim.drawCapsule(x, y, scale * 0.6, scale * 0.8, scale * 0.1);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Chest plate
        this.prim.fill(accentColor);
        this.prim.drawCapsule(x, y - scale * 0.1, scale * 0.4, scale * 0.3, scale * 0.05);
        this.ctx.fill();
        
        // Head (helmet)
        this.ctx.save();
        this.ctx.translate(x, y - scale * 0.6);
        this.prim.fill(metalColor);
        this.prim.drawCapsule(0, 0, scale * 0.5, scale * 0.4, scale * 0.08);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Visor
        this.prim.fill(glowColor);
        this.prim.drawCapsule(0, -scale * 0.05, scale * 0.35, scale * 0.1, scale * 0.03);
        this.ctx.fill();
        
        // Eyes glow
        this.prim.fill('#fff');
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(-scale * 0.1, -scale * 0.05, scale * 0.03, 0, Math.PI * 2);
        this.ctx.arc(scale * 0.1, -scale * 0.05, scale * 0.03, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
        
        // Shoulders
        this.prim.fill(metalColor);
        this.ctx.beginPath();
        this.ctx.arc(x - scale * 0.4, y - scale * 0.2, scale * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + scale * 0.4, y - scale * 0.2, scale * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms
        this.drawRobotArm(x - scale * 0.4, y - scale * 0.1, scale * 0.6, -0.3, rng);
        this.drawRobotArm(x + scale * 0.4, y - scale * 0.1, scale * 0.6, 0.3, rng);
        
        // Legs
        this.drawRobotLeg(x - scale * 0.2, y + scale * 0.4, scale * 0.7, rng);
        this.drawRobotLeg(x + scale * 0.2, y + scale * 0.4, scale * 0.7, rng);
        
        // Jetpack for rare+
        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
            this.drawJetpack(x, y, scale, glowColor, rarity);
        }
        
        // Extra armor for epic/legendary
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.stroke(glowColor, 3);
            this.prim.drawSpikes(x, y - scale * 0.2, scale * 0.3, scale * 0.5, 6);
            this.ctx.stroke();
        }
    }

    // Helper: Draw robot arm
    drawRobotArm(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ angle, /** @type {any} */ _rng) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        this.prim.fill(this.ctx.fillStyle);
        this.prim.drawCapsule(0, scale * 0.3, scale * 0.2, scale * 0.5, scale * 0.05);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Hand
        this.ctx.beginPath();
        this.ctx.arc(0, scale * 0.6, scale * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    // Helper: Draw robot leg
    drawRobotLeg(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ _rng) {
        this.prim.fill(this.ctx.fillStyle);
        this.prim.drawCapsule(x, y + scale * 0.3, scale * 0.25, scale * 0.6, scale * 0.05);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Foot
        this.ctx.beginPath();
        this.ctx.roundRect(x - scale * 0.15, y + scale * 0.6, scale * 0.3, scale * 0.15, scale * 0.03);
        this.ctx.fill();
    }

    // Helper: Draw jetpack
    drawJetpack(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ color, /** @type {any} */ rarity) {
        this.ctx.save();
        this.ctx.translate(x, y - scale * 0.1);
        
        this.prim.fill('#333');
        this.prim.drawCapsule(0, 0, scale * 0.5, scale * 0.3, scale * 0.05);
        this.ctx.fill();
        
        // Thrusters
        this.prim.fill(color);
        this.ctx.beginPath();
        this.ctx.arc(-scale * 0.15, scale * 0.2, scale * 0.08, 0, Math.PI * 2);
        this.ctx.arc(scale * 0.15, scale * 0.2, scale * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Flame
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.fill('#ff6600');
            this.ctx.globalCompositeOperation = 'screen';
            this.prim.drawFlame(-scale * 0.15, scale * 0.3, scale * 0.3, scale * 0.1);
            this.prim.drawFlame(scale * 0.15, scale * 0.3, scale * 0.3, scale * 0.1);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.restore();
    }

    // Vehicle (racing themes)
    drawVehicle(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale, /** @type {any} */ palette, /** @type {any} */ _rng, /** @type {any} */ rarity) {
        const bodyColor = palette[0];
        const accentColor = palette[1] || '#fff';
        const glowColor = palette[2] || '#0ff';
        
        // Shadow
        this.prim.fill('rgba(0,0,0,0.3)');
        this.prim.drawOval(x, y + scale * 0.3, scale * 1.8, scale * 0.3);
        this.ctx.fill();
        
        // Wheels
        this.prim.fill('#111');
        this.prim.drawWheel(x - scale * 0.6, y + scale * 0.15, scale * 0.25);
        this.prim.drawWheel(x + scale * 0.6, y + scale * 0.15, scale * 0.25);
        
        // Chassis
        this.prim.fill(bodyColor);
        this.prim.stroke(accentColor, 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x - scale, y + scale * 0.1);
        this.ctx.lineTo(x - scale * 0.7, y - scale * 0.3);
        this.ctx.lineTo(x + scale * 0.5, y - scale * 0.2);
        this.ctx.lineTo(x + scale * 0.9, y + scale * 0.1);
        this.ctx.lineTo(x + scale, y + scale * 0.15);
        this.ctx.lineTo(x - scale, y + scale * 0.15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Cockpit/window
        this.prim.fill('#222');
        this.ctx.beginPath();
        this.ctx.moveTo(x - scale * 0.4, y - scale * 0.1);
        this.ctx.lineTo(x - scale * 0.2, y - scale * 0.25);
        this.ctx.lineTo(x + scale * 0.3, y - scale * 0.2);
        this.ctx.lineTo(x + scale * 0.2, y - scale * 0.05);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Neon underglow for rare+
        if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
            this.prim.drawGlow(x, y + scale * 0.25, scale * 0.8, glowColor);
        }
        
        // Spoiler for epic/legendary
        if (rarity === 'epic' || rarity === 'legendary') {
            this.prim.fill(accentColor);
            this.ctx.beginPath();
            this.ctx.moveTo(x + scale * 0.7, y - scale * 0.2);
            this.ctx.lineTo(x + scale * 0.9, y - scale * 0.5);
            this.ctx.lineTo(x + scale * 0.95, y - scale * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // Speed lines for legendary
        if (rarity === 'legendary') {
            this.prim.stroke(glowColor, 2);
            this.ctx.beginPath();
            this.ctx.moveTo(x - scale * 1.2, y);
            this.ctx.lineTo(x - scale * 1.5, y);
            this.ctx.moveTo(x - scale * 1.1, y + scale * 0.1);
            this.ctx.lineTo(x - scale * 1.4, y + scale * 0.1);
            this.ctx.stroke();
        }
    }
}

export default Anatomy;
