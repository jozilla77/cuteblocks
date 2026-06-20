import { COLORS } from './puyo_blocks.js';

class Particle {
    constructor(x, y, color, isBig = true) {
        this.x = x;
        this.y = y;
        const speed = isBig ? 14 : 6;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed - (isBig ? 5 : 2);
        this.radius = isBig ? (Math.random() * 8 + 5) : (Math.random() * 4 + 3);
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + (isBig ? 0.02 : 0.05);
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.22;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Renderer {
    constructor(canvasId, nextCanvasId, width, height, blockSize) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.cols = width;
        this.rows = height;
        this.blockSize = blockSize;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.particles = [];
        this.starryAngle = 0;

        // Setup image cache for Puyo blocks
        this.blockImages = {};
        const types = ['A', 'B', 'C', 'D', 'E'];
        types.forEach(type => {
            const img = new Image();
            img.onload = () => {
                this.blockImages[type] = img;
            };
            img.src = `icons/block_${type}.png`;
        });

        // Initialize jelly bounce physics states for each cell
        this.jellyGrid = Array.from({ length: this.rows }, () => 
            Array.from({ length: this.cols }, () => ({
                scaleX: 1, scaleY: 1,
                velX: 0, velY: 0
            }))
        );
    }

    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const canvasWidth = rect.width || this.cols * this.blockSize;
        this.blockSize = canvasWidth / this.cols;
        
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    }

    // Spring-mass solver for jelly bouncing physics
    updateJellyPhysics() {
        const k = 0.14;   // stiffness
        const damping = 0.82; // resistance
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.jellyGrid[y][x];
                
                // Spring force toward target scale of 1.0
                cell.velX += (1 - cell.scaleX) * k;
                cell.velX *= damping;
                cell.scaleX += cell.velX;

                cell.velY += (1 - cell.scaleY) * k;
                cell.velY *= damping;
                cell.scaleY += cell.velY;
            }
        }
    }

    // Trigger a landing squash on a cell
    triggerJellyBounce(x, y) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const cell = this.jellyGrid[y][x];
            cell.scaleY = 0.62; // Squash down
            cell.scaleX = 1.38; // Stretch wide
            cell.velY = 0.12;
            cell.velX = -0.12;
        }
    }

    // Draws the 100% accurate provided mascot images inside a bounding size
    drawMascotHead(ctx, cx, cy, size, type) {
        ctx.save();
        ctx.translate(cx, cy);

        let img = this.blockImages[type];

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(size * 0.5, size * 0.5, size * 0.45, 0, Math.PI * 2);
            ctx.clip();
            // Draw the exact glossy 4k Puyo Puyo block with face
            // We scale it up slightly so the bubble feels voluminous!
            const pad = size * -0.05; 
            ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
            ctx.restore();
        } else {
            // Fallback while loading
            ctx.fillStyle = COLORS[type] || '#FF0066';
            ctx.beginPath();
            ctx.arc(size * 0.5, size * 0.5, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Helper to draw stars
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, fillStyle) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    // Draws matching visual connections (bridges) between adjacent blocks
    drawConnectionBridges(grid) {
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = this.blockSize * 0.85;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const current = grid[y][x];
                if (!current) continue;
                
                const type = (typeof current === 'object') ? current.type : current;
                const color = COLORS[type];
                if (!color) continue;

                this.ctx.strokeStyle = color;

                // Check Right neighbor
                if (x + 1 < this.cols && grid[y][x + 1]) {
                    const neighbor = grid[y][x + 1];
                    const nType = (typeof neighbor === 'object') ? neighbor.type : neighbor;
                    if (nType === type) {
                        this.ctx.beginPath();
                        this.ctx.moveTo((x + 0.5) * this.blockSize, (y + 0.5) * this.blockSize);
                        this.ctx.lineTo((x + 1.5) * this.blockSize, (y + 0.5) * this.blockSize);
                        this.ctx.stroke();
                    }
                }

                // Check Down neighbor
                if (y + 1 < this.rows && grid[y + 1][x]) {
                    const neighbor = grid[y + 1][x];
                    const nType = (typeof neighbor === 'object') ? neighbor.type : neighbor;
                    if (nType === type) {
                        this.ctx.beginPath();
                        this.ctx.moveTo((x + 0.5) * this.blockSize, (y + 0.5) * this.blockSize);
                        this.ctx.lineTo((x + 0.5) * this.blockSize, (y + 1.5) * this.blockSize);
                        this.ctx.stroke();
                    }
                }
            }
        }
        this.ctx.restore();
    }

    drawBlock(ctx, x, y, type, sizeScale = 1, isPreview = false) {
        const color = COLORS[type];
        if (!color) return;

        const size = this.blockSize * sizeScale;
        const radius = size * 0.28;

        // Apply jelly bounce scaling if drawn in the main game grid
        let scaleX = 1;
        let scaleY = 1;
        if (!isPreview && y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
            const physics = this.jellyGrid[y][x];
            scaleX = physics.scaleX;
            scaleY = physics.scaleY;
        }

        ctx.save();
        
        // Translate to the block's visual center for squashing
        const cx = x * this.blockSize + size * 0.5;
        const cy = y * this.blockSize + size * 0.5;
        ctx.translate(cx, cy);
        ctx.scale(scaleX, scaleY);

        // The pre-rendered block image has its own glossy bubble background.
        // We just draw the image itself without the extra canvas bubble on top.
        this.drawMascotHead(ctx, -size * 0.5, -size * 0.5, size, type);

        ctx.restore();
    }

    drawGrid(grid) {
        this.updateJellyPhysics();
        
        // 1. Draw orbital path details
        this.drawDecorations();

        // 2. Draw connecting jelly blobs behind the blocks
        this.drawConnectionBridges(grid);

        // 3. Draw individual and merged blocks
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = grid[y][x];
                if (!cell) continue;

                if (typeof cell === 'object') {
                    // Merged block configuration
                    if (cell.mergeRole === 'TL') {
                        // Draw giant 2x2 merged mascot block!
                        this.drawBlock(this.ctx, x, y, cell.type, 2);
                    }
                    // Skip 'TR', 'BL', 'BR' roles so they don't draw overlapping blocks
                } else {
                    // Regular single block
                    this.drawBlock(this.ctx, x, y, cell);
                }
            }
        }
    }

    drawDecorations() {
        this.starryAngle += 0.01;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(141, 114, 225, 0.09)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 10]);
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width * 0.5, this.canvas.height * 0.5, this.canvas.width * 0.4, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawNext(pair) {
        if (!pair) return;
        const size = this.nextCanvas.width / 2.5; // Bubble size
        const padding = (this.nextCanvas.width - size) / 2; // Center horizontally
        
        // Draw top bubble (type1)
        this.drawMascotHead(this.nextCtx, padding, this.nextCanvas.height * 0.15, size, pair.type1);
        
        // Draw bottom bubble (type2)
        this.drawMascotHead(this.nextCtx, padding, this.nextCanvas.height * 0.15 + size - 2, size, pair.type2);
    }

    triggerExplosion(x, y) {
        const pixelX = (x + 0.5) * this.blockSize;
        const pixelY = (y + 0.5) * this.blockSize;
        const colorPalette = Object.values(COLORS);
        
        for (let p = 0; p < 12; p++) {
            const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.particles.push(new Particle(pixelX, pixelY, randomColor, true));
        }
    }

    triggerPop(x, y) {
        const pixelX = (x + 0.5) * this.blockSize;
        const pixelY = (y + 0.5) * this.blockSize;
        const colorPalette = Object.values(COLORS);
        
        for (let p = 0; p < 4; p++) {
            const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.particles.push(new Particle(pixelX, pixelY, randomColor, false));
        }
    }

    updateAndDrawParticles() {
        this.particles.forEach((particle, index) => {
            particle.update();
            particle.draw(this.ctx);
            if (particle.alpha <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
}


