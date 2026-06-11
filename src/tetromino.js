export const COLORS = {
    I: '#AEC6CF', // Cyan
    J: '#C3B1E1', // Blue/Purple
    L: '#FFB347', // Orange
    O: '#FDFD96', // Yellow
    S: '#77DD77', // Green
    T: '#B39EB5', // Purple
    Z: '#FF6961'  // Red
};

export const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

export class Tetromino {
    constructor(type) {
        this.type = type;
        this.color = COLORS[type];
        this.matrix = SHAPES[type];
        this.x = 0;
        this.y = 0;
    }

    rotate() {
        // Transpose
        const N = this.matrix.length;
        const rotated = this.matrix.map((row, i) =>
            row.map((val, j) => this.matrix[N - j - 1][i])
        );
        
        // Check if rotation is valid (handled by game logic, but here we just return the new matrix)
        // Actually, let's just mutate for now, or return new matrix?
        // Let's return new matrix to allow collision check before applying
        return rotated;
    }
}

export function randomTetromino() {
    const types = 'IJLOSTZ';
    const type = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(type);
}
