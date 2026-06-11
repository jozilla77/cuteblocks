import { Renderer } from './renderer.js';
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const renderer = new Renderer('gameCanvas', 'nextCanvas', 10, 20, 30);
    const game = new Game(renderer);

    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', () => {
        game.start();
        startBtn.blur(); // Remove focus so spacebar doesn't trigger button
    });

    document.addEventListener('keydown', event => {
        if (!game.isRunning || game.gameOver) return;

        switch (event.keyCode) {
            case 37: // Left
                game.move(-1);
                break;
            case 39: // Right
                game.move(1);
                break;
            case 40: // Down
                game.drop();
                break;
            case 38: // Up
                game.rotate();
                break;
        }
    });
});
