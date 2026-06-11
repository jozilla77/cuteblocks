import { randomTetromino, COLORS } from './tetromino.js';

export class Game {
    constructor(renderer) {
        this.renderer = renderer;
        this.cols = 10;
        this.rows = 20;
        this.grid = this.createGrid();
        this.score = 0;
        this.gameOver = false;
        this.isRunning = false;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.currentPiece = null;
        this.nextPiece = null;

        this.scoreElement = document.getElementById('score');
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    start() {
        if (this.isRunning) return;
        this.grid = this.createGrid();
        this.score = 0;
        this.updateScore();
        this.gameOver = false;
        this.isRunning = true;
        this.currentPiece = randomTetromino();
        this.currentPiece.x = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
        this.nextPiece = randomTetromino();

        this.renderer.drawNext(this.nextPiece);
        this.loop();
    }

    update(deltaTime) {
        if (!this.isRunning || this.gameOver) return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawGrid(this.grid);
        if (this.currentPiece) {
            this.renderer.drawTetromino(this.currentPiece);
        }
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
        this.currentPiece.y++;
        if (this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.y--;
            this.merge(this.grid, this.currentPiece);
            this.resetPiece();
            this.arenaSweep();
            this.updateScore();
        }
        this.dropCounter = 0;
    }

    move(dir) {
        this.currentPiece.x += dir;
        if (this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.x -= dir;
        }
    }

    rotate() {
        const pos = this.currentPiece.x;
        let offset = 1;
        const matrix = this.currentPiece.rotate();
        const originalMatrix = this.currentPiece.matrix;

        this.currentPiece.matrix = matrix; // Apply rotation to check collision

        // Wall kick (basic)
        while (this.collide(this.grid, this.currentPiece)) {
            this.currentPiece.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.currentPiece.matrix[0].length) {
                // Rotate back if it fails
                this.currentPiece.matrix = originalMatrix;
                this.currentPiece.x = pos;
                return;
            }
        }
    }

    collide(arena, player) {
        const [m, o] = [player.matrix, player];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.y][x + player.x] = player.color;
                }
            });
        });
    }

    resetPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
        this.currentPiece.y = 0;
        this.nextPiece = randomTetromino();
        this.renderer.drawNext(this.nextPiece);

        if (this.collide(this.grid, this.currentPiece)) {
            this.gameOver = true;
            this.isRunning = false;
            alert('Game Over! Score: ' + this.score);
        }
    }

    arenaSweep() {
        let rowCount = 1;
        outer: for (let y = this.grid.length - 1; y > 0; --y) {
            for (let x = 0; x < this.grid[y].length; ++x) {
                if (this.grid[y][x] === 0) {
                    continue outer;
                }
            }

            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            ++y;

            this.score += rowCount * 10;
            rowCount *= 2;
        }
    }

    updateScore() {
        this.scoreElement.innerText = this.score;
    }
}
