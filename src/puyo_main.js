import { Renderer } from './renderer.js';
import { Game } from './puyo_game.js';

function init() {
    // 10 columns, 20 rows, base block size of 32px
    const renderer = new Renderer('gameCanvas', 'nextCanvas', 10, 20, 32);
    const game = new Game(renderer);

    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const soundToggle = document.getElementById('soundToggle');
    const bgmToggle = document.getElementById('bgmToggle');

    // Start & Restart Trigger
    const handleStart = () => {
        game.start();
    };

    startBtn.addEventListener('click', handleStart);
    restartBtn.addEventListener('click', handleStart);

    // Audio toggle
    soundToggle.addEventListener('click', () => {
        game.isMuted = !game.isMuted;
        if (game.isMuted) {
            soundToggle.classList.add('muted');
        } else {
            soundToggle.classList.remove('muted');
        }
        soundToggle.blur();
    });

    // BGM toggle
    bgmToggle.addEventListener('click', () => {
        game.isBgmMuted = !game.isBgmMuted;
        if (game.isBgmMuted) {
            bgmToggle.classList.add('muted');
            game.stopBGM();
        } else {
            bgmToggle.classList.remove('muted');
            if (game.isRunning) {
                game.startBGM();
            }
        }
        bgmToggle.blur();
    });

    // Keyboard controls
    document.addEventListener('keydown', event => {
        if (!game.isRunning || game.gameOver) return;

        switch (event.keyCode) {
            case 37: // Left Arrow
                game.move(-1);
                break;
            case 39: // Right Arrow
                game.move(1);
                break;
            case 40: // Down Arrow
                game.drop();
                break;
            case 38: // Up Arrow
                game.rotate();
                break;
            case 32: // Spacebar for Hard Drop
                game.hardDrop();
                event.preventDefault(); // Prevent page scrolling
                break;
        }
    });

    // Mobile / Touch controls configuration
    const bindTouch = (elementId, action) => {
        const btn = document.getElementById(elementId);
        if (!btn) return;
        
        let touchInterval = null;

        const triggerAction = (e) => {
            e.preventDefault();
            if (!game.isRunning || game.gameOver) return;
            action();
        };

        btn.addEventListener('touchstart', triggerAction, { passive: false });
        btn.addEventListener('mousedown', triggerAction);
    };

    bindTouch('btnLeft', () => game.move(-1));
    bindTouch('btnRight', () => game.move(1));
    bindTouch('btnRotate', () => game.rotate());
    bindTouch('btnDrop', () => game.drop());
    bindTouch('btnHardDrop', () => game.hardDrop());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

