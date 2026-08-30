/**
 * Primitive Drawing Library for NFT Engine
 * All shapes drawn with Canvas API - no assets
 */

export class Primitives {
    constructor(/** @type {any} */ ctx) {
        this.ctx = ctx; // @type {any} ctx parameter
    }

    // Set color helpers
    fill(/** @type {any} */ color) {
        this.ctx.fillStyle = color; // @type {any} color parameter
    }

    stroke(/** @type {any} */ color, /** @type {any} */ width = 2) {
        this.ctx.strokeStyle = color; // @type {any} color, width parameter
        this.ctx.lineWidth = width;
    }

    // Draw blob (organic shape)
    drawBlob(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ radius, /** @type {any} */ points = 8, /** @type {any} */ variance = 0.3) {
        this.ctx.beginPath();
        const angleStep = (Math.PI * 2) / points;
        
        for (let i = 0; i <= points; i++) {
            const angle = i * angleStep;
            const r = radius * (1 + (Math.random() - 0.5) * variance);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                const prevAngle = (i - 1) * angleStep;
                const cpAngle1 = prevAngle + angleStep * 0.3;
                const cpAngle2 = angle - angleStep * 0.3;
                const cp1x = x + Math.cos(cpAngle1) * r * 1.2;
                const cp1y = y + Math.sin(cpAngle1) * r * 1.2;
                const cp2x = x + Math.cos(cpAngle2) * r * 1.2;
                const cp2y = y + Math.sin(cpAngle2) * r * 1.2;
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py);
            }
        }
        
        this.ctx.closePath();
    }

    // Draw oval
    drawOval(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ rotation = 0) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, width / 2, height / 2, rotation, 0, Math.PI * 2);
        this.ctx.closePath();
    }

    // Draw capsule (rounded rectangle)
    drawCapsule(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ radius) {
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y - height/2, width, height, radius);
        this.ctx.closePath();
    }

    // Draw triangle
    drawTriangle(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ size, /** @type {any} */ rotation = 0) {
        this.ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = rotation + (i * Math.PI * 2 / 3) - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
    }

    // Draw spikes around a circle
    drawSpikes(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ innerRadius, /** @type {any} */ outerRadius, /** @type {any} */ count) {
        this.ctx.beginPath();
        for (let i = 0; i < count * 2; i++) {
            const angle = (i / (count * 2)) * Math.PI * 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
    }

    // Draw tentacle (curved line)
    drawTentacle(/** @type {any} */ x1, /** @type {any} */ y1, /** @type {any} */ x2, /** @type {any} */ y2, /** @type {any} */ thickness, /** @type {any} */ wave = 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const cpX = midX + Math.sin(wave) * 20;
        const cpY = midY + Math.cos(wave) * 20;
        
        this.ctx.quadraticCurveTo(cpX, cpY, x2, y2);
        this.ctx.lineWidth = thickness;
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
    }

    // Draw bone (cylinder with joints)
    drawBone(/** @type {any} */ x1, /** @type {any} */ y1, /** @type {any} */ x2, /** @type {any} */ y2, /** @type {any} */ thickness) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const length = Math.hypot(x2 - x1, y2 - y1);
        
        // Main shaft
        this.ctx.save();
        this.ctx.translate(x1, y1);
        this.ctx.rotate(angle);
        this.drawCapsule(length / 2, 0, length, thickness, thickness / 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
        
        // Joints
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, thickness / 1.5, 0, Math.PI * 2);
        this.ctx.arc(x2, y2, thickness / 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Draw skull (simplified)
    drawSkull(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ size) {
        // Cranium
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.3, size * 0.6, Math.PI, 0);
        this.ctx.lineTo(x + size * 0.6, y + size * 0.2);
        this.ctx.quadraticCurveTo(x, y + size * 0.5, x - size * 0.6, y + size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Eye sockets
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.25, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.25, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Nose
        this.drawTriangle(x, y + size * 0.1, size * 0.15);
        this.ctx.fill();
        
        // Teeth
        for (let i = -2; i <= 2; i++) {
            const tx = x + i * size * 0.12;
            this.ctx.beginPath();
            this.ctx.moveTo(tx, y + size * 0.25);
            this.ctx.lineTo(tx + size * 0.05, y + size * 0.4);
            this.ctx.lineTo(tx - size * 0.05, y + size * 0.4);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    // Draw blade (sword shape)
    drawBlade(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ length, /** @type {any} */ width) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + width * 0.3, y + length * 0.7);
        this.ctx.lineTo(x, y + length);
        this.ctx.lineTo(x - width * 0.3, y + length * 0.7);
        this.ctx.closePath();
    }

    // Draw gun shape
    drawGun(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ scale) {
        this.ctx.beginPath();
        // Barrel
        this.ctx.rect(x - scale * 0.5, y - scale * 2, scale, scale * 2);
        // Handle
        this.ctx.moveTo(x - scale * 0.5, y);
        this.ctx.lineTo(x - scale * 0.8, y + scale * 1.5);
        this.ctx.lineTo(x - scale * 0.2, y + scale * 1.5);
        this.ctx.lineTo(x + scale * 0.1, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    // Draw wheel
    drawWheel(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Spokes
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            this.ctx.stroke();
        }
        
        // Hub
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Draw flame
    drawFlame(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ height, /** @type {any} */ width) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        const points = 5;
        for (let i = 1; i <= points; i++) {
            const progress = i / points;
            const waveWidth = width * (1 - progress) * (0.5 + Math.random() * 0.5);
            const fx = x + (i % 2 === 0 ? waveWidth : -waveWidth);
            const fy = y - height * progress;
            this.ctx.lineTo(fx, fy);
        }
        
        this.ctx.lineTo(x, y - height);
        
        for (let i = points; i >= 1; i--) {
            const progress = i / points;
            const waveWidth = width * (1 - progress) * (0.5 + Math.random() * 0.5);
            const fx = x + (i % 2 === 0 ? -waveWidth : waveWidth);
            const fy = y - height * progress;
            this.ctx.lineTo(fx, fy);
        }
        
        this.ctx.closePath();
    }

    // Draw lightning
    drawLightning(/** @type {any} */ x1, /** @type {any} */ y1, /** @type {any} */ x2, /** @type {any} */ y2, /** @type {any} */ segments = 5) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        
        for (let i = 1; i <= segments; i++) {
            const px = x1 + dx * i + (Math.random() - 0.5) * 15;
            const py = y1 + dy * i + (Math.random() - 0.5) * 15;
            this.ctx.lineTo(px, py);
        }
        
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
    }

    // Draw smoke/cloud
    drawSmoke(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ size) {
        const puffs = 5;
        for (let i = 0; i < puffs; i++) {
            const angle = (i / puffs) * Math.PI * 2;
            const px = x + Math.cos(angle) * size * 0.5;
            const py = y + Math.sin(angle) * size * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(px, py, size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // Draw particle
    drawParticle(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ size, /** @type {any} */ shape = 'circle') {
        this.ctx.beginPath();
        if (shape === 'circle') {
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
        } else if (shape === 'square') {
            this.ctx.rect(x - size, y - size, size * 2, size * 2);
        } else if (shape === 'diamond') {
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x + size, y);
            this.ctx.lineTo(x, y + size);
            this.ctx.lineTo(x - size, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    // Draw glow effect
    drawGlow(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ radius, /** @type {any} */ color, /** @type {any} */ intensity = 20) {
        const alpha = Math.max(0.1, Math.min(1, Number(intensity) / 20));
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color + (Math.round(128 * alpha)).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, color + (Math.round(64 * alpha)).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Draw noise texture
    drawNoiseTexture(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ width, /** @type {any} */ height, /** @type {any} */ density = 0.1) {
        const imageData = this.ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < density) {
                const value = Math.random() * 255;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
                data[i + 3] = 30;
            }
        }
        
        this.ctx.putImageData(imageData, x, y);
    }

    // Draw star
    drawStar(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ outerRadius, /** @type {any} */ innerRadius, /** @type {any} */ points) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
    }

    // Draw eye
    drawEye(/** @type {any} */ x, /** @type {any} */ y, /** @type {any} */ size, /** @type {any} */ type = 'normal') {
        if (type === 'normal') {
            // Sclera
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            this.ctx.stroke();
            
            // Pupil
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
        } else if (type === 'glowing') {
            // Glow
            this.drawGlow(x, y, size * 2, '#ff0000');
            
            // Eye
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fill();
        }
    }
}

export default Primitives;
