import {type GameOfLifeType} from "./src/modules/game_of_life";
import {initGameOfLife} from "./src/modules/game_of_life";

import {start_type_variants} from "playground";

const startTypes = start_type_variants();
const canvas = document.getElementById('game-of-life-canvas') as HTMLCanvasElement;

if (!canvas) {
    console.error("Canvas element with id 'game-of-life-canvas' not found.");
    throw new Error("Canvas element not found");
}

const playPauseButton = document.getElementById('play-pause-button') as HTMLButtonElement;
const startTypeSelect = document.getElementById('start-type-select') as HTMLSelectElement;
const ticksPerFrameInput = document.getElementById('ticks-per-frame') as HTMLInputElement;

let gameOfLife: GameOfLifeType | null = null;

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
        gameOfLife = await initGameOfLife(canvas, parseInt(eventTarget.value, 10));
    }
});

playPauseButton.classList.add('js-state-paused');

ticksPerFrameInput.addEventListener("change", (event) => {
    let eventTarget = event.target as HTMLSelectElement;

    if (eventTarget.value) {
        if (!gameOfLife) {
            console.error("Game of Life instance is not initialized.");
            return;
        }

        const ticksPerFrame = parseInt(eventTarget.value, 10);
        gameOfLife.setTicksPerFrame(ticksPerFrame);
    }
});

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

let isMouseDown = false;

canvas.addEventListener("mousedown", (event) => {
    isMouseDown = true;
    if (!gameOfLife) {
        console.error("Game of Life instance is not initialized.");
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (event.shiftKey) {
        gameOfLife.insertPulsar(x, y);
    } else if (event.ctrlKey) {
        gameOfLife.insertGlider(x, y);
    } else {
        // On click: toggle cell (so clicking a cell in a "live" state sets it to "dead")
        gameOfLife.toggleCell(x, y);
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (!isMouseDown) return;
    if (!gameOfLife) {
        console.error("Game of Life instance is not initialized.");
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Only set the cell to alive if not using shift or ctrl
    if (!event.shiftKey && !event.ctrlKey) {
        gameOfLife.setCellToAlive(x, y);
    }
});

document.addEventListener("mouseup", () => {
    isMouseDown = false;
});

gameOfLife = await initGameOfLife(canvas, 0);
