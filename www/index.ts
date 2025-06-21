import { initGameOfLife } from "./src/modules/game_of_life";

initGameOfLife('game-of-life-canvas', 'random').then(
    (gameOfLife) => {
        if (gameOfLife) {
            gameOfLife.start();
        } else {
            console.error("Failed to initialize Game of Life.");
        }
    }
);
