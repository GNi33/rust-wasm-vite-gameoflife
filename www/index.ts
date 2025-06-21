import {type GameOfLifeType } from "./src/modules/game_of_life";
import { initGameOfLife } from "./src/modules/game_of_life";

import { start_type_variants } from "playground";

let gameOfLife: GameOfLifeType | null = null;

const playPauseButton = document.getElementById('play-pause-button') as HTMLButtonElement;
playPauseButton.classList.add('js-state-paused');

const startTypes = start_type_variants();
const startTypeSelect = document.getElementById('start-type-select') as HTMLSelectElement;
startTypes.forEach((type, idx) => {
    const option = document.createElement('option');
    option.value = idx.toString();
    option.textContent = type;
    startTypeSelect.appendChild(option);
});

startTypeSelect.addEventListener('change', async (event) => {
    let eventTarget = event.target as HTMLSelectElement;

    if (eventTarget.value) {

        if (gameOfLife) {
            gameOfLife.stop();
            playPauseButton.classList.remove('js-state-playing');
            playPauseButton.classList.add('js-state-paused');
        }

        gameOfLife = null;
        gameOfLife = await initGameOfLife('game-of-life-canvas', parseInt(eventTarget.value, 10));
    }
});

gameOfLife = await initGameOfLife('game-of-life-canvas', 0);
playPauseButton.addEventListener('click', () => {
    if (!gameOfLife) {
        console.error("Game of Life instance is not initialized.");
        return;
    }

    if (gameOfLife.isPlaying()) {
        gameOfLife.stop();
        playPauseButton.classList.remove('js-state-playing');
        playPauseButton.classList.add('js-state-paused');
    } else {
        gameOfLife.start();
        playPauseButton.classList.add('js-state-playing');
        playPauseButton.classList.remove('js-state-paused');
    }
});


