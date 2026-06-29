class Game {
    constructor(renderer) {
        this.renderer = renderer;
        this.cols = 10;
        this.rows = 20;
        this.grid = this.createGrid();
        this.score = 0;
        this.linesClearedTotal = 0;
        this.gameOver = false;
        this.isRunning = false;
        this.isMuted = false;
        this.isProcessingCascades = false;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.isBgmMuted = false;
        this.isPlayingBgm = false;
        this.audioCtx = null;

        this.currentPiece = null;
        this.nextPiece = null;

        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.linesElement = document.getElementById('lines-cleared');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.mobileControls = document.querySelector('.mobile-controls');
        
        this.highScore = parseInt(localStorage.getItem('loxleyHighScore')) || 0;
        
        // Hide mobile controls initially
        if (this.mobileControls) {
            this.mobileControls.style.display = 'none';
        }
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    start() {
        this.grid = this.createGrid();
        this.score = 0;
        this.linesClearedTotal = 0;
        this.updateStats();
        this.gameOver = false;
        this.isRunning = true;
        this.isProcessingCascades = false;
        
        // Hide overlay screens
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Show mobile controls on mobile devices
        if (this.mobileControls && window.innerWidth <= 480) {
            this.mobileControls.style.display = 'flex';
        }

        this.currentPiece = randomBlockPair();
        this.currentPiece.x = 4;
        this.currentPiece.y = 1;
        this.nextPiece = randomBlockPair();

        this.renderer.drawNext(this.nextPiece);
        this.lastTime = performance.now();
        this.loop(this.lastTime);
        this.playPopSound(440, 'sine', 0.1); // Start chime
        this.startBGM();
    }

    update(deltaTime) {
        if (!this.isRunning || this.gameOver || this.isProcessingCascades) return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawGrid(this.grid);
        this.renderer.drawNext(this.nextPiece);
        if (this.currentPiece) {
            const blocks = this.currentPiece.getBlocks();
            
            // Draw ghost piece first
            const ghostY = this.getGhostY();
            if (ghostY !== undefined) {
                this.renderer.ctx.save();
                this.renderer.ctx.globalAlpha = 0.3;
                blocks.forEach(b => {
                    this.renderer.drawBlock(this.renderer.ctx, b.x, ghostY + (b.y - this.currentPiece.y), b.type, 1, false);
                });
                this.renderer.ctx.restore();
            }

            // Draw actual piece
            blocks.forEach(b => {
                this.renderer.drawBlock(this.renderer.ctx, b.x, b.y, b.type);
            });
        }
        // Always draw custom popping particles on top
        this.renderer.updateAndDrawParticles();
    }

    loop(time = 0) {
        if (!this.isRunning) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime);
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(this.loop.bind(this));
        }
    }

    drop() {
        if (!this.isRunning || this.gameOver || this.isProcessingCascades || !this.currentPiece) return;

        this.currentPiece.y++;
        if (this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.y--;
            this.handlePieceLanding();
        }
        this.dropCounter = 0;
    }

    async hardDrop() {
        if (!this.isRunning || this.gameOver || this.isProcessingCascades || !this.currentPiece) return;
        
        let dropDistance = 0;
        while (!this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.currentPiece.y--;

        this.score += dropDistance * 2;
        this.playPopSound(392, 'sine', 0.12); // Higher drop chime (G4)

        await this.handlePieceLanding();
        this.dropCounter = 0;
    }

    move(dir) {
        if (!this.isRunning || this.gameOver || this.isProcessingCascades || !this.currentPiece) return;

        this.currentPiece.x += dir;
        if (this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.x -= dir;
        } else {
            this.playPopSound(523.25, 'sine', 0.04); // Move sound (C5)
        }
    }

    rotate() {
        if (!this.isRunning || this.gameOver || this.isProcessingCascades || !this.currentPiece) return;
        const originalRotation = this.currentPiece.rotation;
        const originalX = this.currentPiece.x;
        const originalY = this.currentPiece.y;

        this.currentPiece.rotate(true); // clockwise rotation

        // Try different kick offsets: [0, 0], [1, 0], [-1, 0], [0, -1]
        const kicks = [
            { dx: 0, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: -1 }
        ];

        let success = false;
        for (const kick of kicks) {
            this.currentPiece.x = originalX + kick.dx;
            this.currentPiece.y = originalY + kick.dy;
            if (!this.collide(this.grid, this.currentPiece)) {
                success = true;
                break;
            }
        }

        if (!success) {
            // Revert
            this.currentPiece.rotation = originalRotation;
            this.currentPiece.x = originalX;
            this.currentPiece.y = originalY;
        } else {
            this.playPopSound(587.33, 'sine', 0.05); // Rotate sound (D5)
        }
    }

    collide(grid, pair) {
        const blocks = pair.getBlocks();
        for (const b of blocks) {
            // Check boundaries
            if (b.x < 0 || b.x >= this.cols || b.y >= this.rows) {
                return true;
            }
            // Check grid collision if within grid rows
            if (b.y >= 0) {
                if (grid[b.y][b.x] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    getGhostY() {
        if (!this.currentPiece) return undefined;
        let testY = this.currentPiece.y;
        
        while (true) {
            testY++;
            const pair = {
                getBlocks: () => {
                    const offsets = this.currentPiece.getOffsets();
                    return [
                        { x: this.currentPiece.x, y: testY },
                        { x: this.currentPiece.x + offsets.dx, y: testY + offsets.dy }
                    ];
                }
            };
            if (this.collide(this.grid, pair)) {
                break;
            }
        }
        return testY - 1;
    }

    demergeGrid() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell && typeof cell === 'object') {
                    this.grid[y][x] = cell.type; // Demerge into plain type string
                }
            }
        }
    }

    runGravity() {
        let moved = false;
        // Scan each column from bottom to top
        for (let x = 0; x < this.cols; x++) {
            // Find all blocks in this column
            const columnBlocks = [];
            for (let y = 0; y < this.rows; y++) {
                if (this.grid[y][x] !== 0) {
                    columnBlocks.push({ y: y, cell: this.grid[y][x] });
                }
            }

            // Create a new column list filled with 0
            const newColumn = Array(this.rows).fill(0);
            let targetY = this.rows - 1;
            
            // Place blocks from bottom to top
            for (let i = columnBlocks.length - 1; i >= 0; i--) {
                const block = columnBlocks[i];
                newColumn[targetY] = block.cell;
                
                // If the block fell to a new lower position, trigger bounce!
                if (targetY !== block.y) {
                    moved = true;
                    this.renderer.triggerJellyBounce(x, targetY);
                }
                targetY--;
            }

            // Write back to grid
            for (let y = 0; y < this.rows; y++) {
                this.grid[y][x] = newColumn[y];
            }
        }
        return moved;
    }

    mergeGiantBlocks() {
        const merged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        let anyMerged = false;

        // Scan from bottom to top to prioritize lower merges
        for (let y = this.rows - 2; y >= 0; y--) {
            for (let x = 0; x < this.cols - 1; x++) {
                const type = this.grid[y][x];
                if (!type || typeof type === 'object') continue;

                // Check if 2x2 is of same type and not already merged
                if (!merged[y][x] && !merged[y][x+1] && !merged[y+1][x] && !merged[y+1][x+1]) {
                    const t1 = this.grid[y][x+1];
                    const t2 = this.grid[y+1][x];
                    const t3 = this.grid[y+1][x+1];

                    if (t1 === type && t2 === type && t3 === type) {
                        // We found a 2x2 block!
                        this.grid[y][x]     = { type: type, mergeRole: 'TL' };
                        this.grid[y][x+1]   = { type: type, mergeRole: 'TR' };
                        this.grid[y+1][x]   = { type: type, mergeRole: 'BL' };
                        this.grid[y+1][x+1] = { type: type, mergeRole: 'BR' };

                        merged[y][x] = true;
                        merged[y][x+1] = true;
                        merged[y+1][x] = true;
                        merged[y+1][x+1] = true;
                        anyMerged = true;
                    }
                }
            }
        }
        return anyMerged;
    }

    getCellType(cell) {
        if (!cell) return null;
        if (typeof cell === 'object') return cell.type;
        return cell;
    }

    findMatchGroups() {
        const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        const groups = [];

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (!cell || visited[y][x]) continue;

                const type = this.getCellType(cell);
                if (!type) continue;

                // Flood fill from (x, y)
                const group = [];
                const queue = [{ x, y }];
                visited[y][x] = true;

                while (queue.length > 0) {
                    const curr = queue.shift();
                    group.push(curr);

                    const neighbors = [
                        { x: curr.x + 1, y: curr.y },
                        { x: curr.x - 1, y: curr.y },
                        { x: curr.x, y: curr.y + 1 },
                        { x: curr.x, y: curr.y - 1 }
                    ];

                    for (const n of neighbors) {
                        if (n.x >= 0 && n.x < this.cols && n.y >= 0 && n.y < this.rows) {
                            if (!visited[n.y][n.x]) {
                                const nCell = this.grid[n.y][n.x];
                                const nType = this.getCellType(nCell);
                                if (nType === type) {
                                    visited[n.y][n.x] = true;
                                    queue.push(n);
                                }
                            }
                        }
                    }
                }

                if (group.length >= 5) {
                    groups.push(group);
                }
            }
        }
        return groups;
    }

    async handlePieceLanding() {
        if (this.isProcessingCascades) return;
        this.isProcessingCascades = true;

        // 1. Lock the piece blocks into the grid
        const blocks = this.currentPiece.getBlocks();
        blocks.forEach(b => {
            if (b.y >= 0 && b.y < this.rows) {
                this.grid[b.y][b.x] = b.type;
            }
        });

        this.currentPiece = null;
        this.playPopSound(261.63, 'triangle', 0.08); // Lock piece sound (C4)

        let combo = 1;

        while (true) {
            this.demergeGrid();
            const fell = this.runGravity();
            this.mergeGiantBlocks();

            const groups = this.findMatchGroups();
            if (groups.length === 0) {
                break;
            }

            // Process clears
            let clearedCount = 0;
            const clearedBlocks = [];

            groups.forEach(group => {
                group.forEach(cell => {
                    if (this.grid[cell.y][cell.x] !== 0) {
                        clearedCount++;
                        this.grid[cell.y][cell.x] = 0;
                        clearedBlocks.push({x: cell.x, y: cell.y});
                    }
                });
            });

            // Trigger particles on cleared blocks
            if (combo > 1) {
                // Combo: big particles
                clearedBlocks.forEach(b => this.renderer.triggerExplosion(b.x, b.y));
            } else {
                // Normal: simple pop
                clearedBlocks.forEach(b => this.renderer.triggerPop(b.x, b.y));
            }

            // Add score
            this.score += clearedCount * 15 * combo;
            this.linesClearedTotal += clearedCount;
            this.updateStats();

            // Play sweep sound
            this.playSweepSound(combo);

            combo++;

            // Wait 250ms for cascade steps so user can see it!
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        this.resetPiece();
        this.isProcessingCascades = false;
    }

    resetPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = 4;
        this.currentPiece.y = 1; // start at y = 1 so block 2 can spawn at y = 0
        this.currentPiece.rotation = 0;

        this.nextPiece = randomBlockPair();
        this.renderer.drawNext(this.nextPiece);

        // Check for Game Over immediately on spawn
        if (this.collide(this.grid, this.currentPiece)) {
            this.gameOver = true;
            this.isRunning = false;
            this.stopBGM();
            
            // Hide mobile controls
            if (this.mobileControls) {
                this.mobileControls.style.display = 'none';
            }
            
            // Show custom Game Over Screen
            this.finalScoreElement.innerText = this.score;
            this.gameOverScreen.classList.remove('hidden');
            this.playGameOverSound();
        }
    }

    updateStats() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('loxleyHighScore', this.highScore);
        }
        // Format with cute leading zeros
        if (this.highScoreElement) this.highScoreElement.innerText = String(this.highScore).padStart(5, '0');
        this.scoreElement.innerText = String(this.score).padStart(5, '0');
        this.linesElement.innerText = this.linesClearedTotal;
    }

    // --- BGM Sequencer ---
    startBGM() {
        if (this.isBgmMuted || this.isPlayingBgm) return;
        
        try {
            if (!this.bgmAudio) {
                this.bgmAudio = new Audio('Gravity_Bloom.mp4');
                this.bgmAudio.loop = true;
                this.bgmAudio.volume = 0.4;
            }
            
            this.bgmAudio.play().catch(e => console.warn("BGM play blocked: ", e));
            this.isPlayingBgm = true;
        } catch (e) {
            console.warn("BGM blocked: ", e);
        }
    }

    stopBGM() {
        this.isPlayingBgm = false;
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    // Custom Web Audio API synthesizer for adorable puzzle effects
    playPopSound(frequency = 400, type = 'sine', duration = 0.1) {
        if (this.isMuted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            // Cute bouncy sliding pitch
            osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("AudioContext blocked or uninitialized: ", e);
        }
    }

    playSweepSound(combo) {
        if (this.isMuted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            const baseFreq = 440 + combo * 80;
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }

    playGameOverSound() {
        if (this.isMuted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.6);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {}
    }
}
