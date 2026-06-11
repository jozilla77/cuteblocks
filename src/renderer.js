export class Renderer {
    constructor(canvasId, nextCanvasId, width, height, blockSize) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.cols = width;
        this.rows = height;
        this.blockSize = blockSize;

        // Ensure canvas size matches grid * block size
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    }

    drawBlock(ctx, x, y, color, scale = 1) {
        const size = this.blockSize * scale;
        const radius = size * 0.25; // Rounded corners
        const padding = 1; // Small gap between blocks

        ctx.fillStyle = color;

        // Draw rounded rectangle
        ctx.beginPath();
        ctx.roundRect(
            x * this.blockSize + padding,
            y * this.blockSize + padding,
            size - padding * 2,
            size - padding * 2,
            radius
        );
        ctx.fill();

        // Add a subtle inner highlight for "cuteness"
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(
            x * this.blockSize + padding + size * 0.1,
            y * this.blockSize + padding + size * 0.1,
            size * 0.3,
            size * 0.3,
            radius / 2
        );
        ctx.fill();
    }

    drawGrid(grid) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (grid[y][x]) {
                    this.drawBlock(this.ctx, x, y, grid[y][x]);
                }
            }
        }
    }

    drawTetromino(tetromino) {
        tetromino.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(
                        this.ctx,
                        tetromino.x + x,
                        tetromino.y + y,
                        tetromino.color
                    );
                }
            });
        });
    }

    drawNext(tetromino) {
        // Center the piece in the next canvas
        // Assuming 4x4 max size, and canvas is roughly 4 blocks wide
        // We'll just draw it centered
        const offsetX = (4 - tetromino.matrix[0].length) / 2;
        const offsetY = (4 - tetromino.matrix.length) / 2;

        // Scale down slightly for the preview
        const previewBlockSize = 20;
        const originalBlockSize = this.blockSize;
        this.blockSize = previewBlockSize; // Hacky swap for drawing

        tetromino.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(
                        this.nextCtx,
                        x + offsetX + 0.5,
                        y + offsetY + 0.5,
                        tetromino.color
                    );
                }
            });
        });

        this.blockSize = originalBlockSize; // Restore
    }
}
