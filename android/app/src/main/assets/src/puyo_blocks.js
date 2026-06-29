const TYPES = ['A', 'B', 'C', 'D', 'E'];

const COLORS = {
    'A': '#FF5E7E', // Red/Pink
    'B': '#5EEBFF', // Light Blue
    'C': '#FFD15E', // Yellow
    'D': '#5EFC8D', // Green
    'E': '#C55EFF'  // Purple
};

class BlockPair {
    constructor() {
        // Randomly pick types for block 1 and block 2
        this.type1 = TYPES[Math.floor(Math.random() * TYPES.length)];
        this.type2 = TYPES[Math.floor(Math.random() * TYPES.length)];
        this.color1 = COLORS[this.type1];
        this.color2 = COLORS[this.type2];

        // Grid coordinates of the pivot block (block 1)
        this.x = 4;
        this.y = 0;

        // Rotation of block 2 around block 1:
        // 0: Up [0, -1]
        // 1: Right [1, 0]
        // 2: Down [0, 1]
        // 3: Left [-1, 0]
        this.rotation = 0;
    }

    // Get grid offsets for block 2 based on orientation
    getOffsets() {
        switch (this.rotation) {
            case 0: return { dx: 0, dy: -1 }; // Up
            case 1: return { dx: 1, dy: 0 };  // Right
            case 2: return { dx: 0, dy: 1 };  // Down
            case 3: return { dx: -1, dy: 0 }; // Left
            default: return { dx: 0, dy: -1 };
        }
    }

    // Returns array of both block locations and types
    getBlocks() {
        const { dx, dy } = this.getOffsets();
        return [
            { x: this.x, y: this.y, type: this.type1, color: this.color1, id: 1 },
            { x: this.x + dx, y: this.y + dy, type: this.type2, color: this.color2, id: 2 }
        ];
    }

    rotate(clockwise = true) {
        if (clockwise) {
            this.rotation = (this.rotation + 1) % 4;
        } else {
            this.rotation = (this.rotation + 3) % 4;
        }
    }
}

function randomBlockPair() {
    return new BlockPair();
}

