import {type GameOfLifeType, ORenderMode} from "./src/modules/game_of_life";
import {initGameOfLife} from "./src/modules/game_of_life";

import {start_type_variants} from "playground";

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id '${id}' not found`);
    }
    return el as T;
}

// Centralized error handling utilities
function handleError(message: string): void {
    console.error(message);
    // Todo: display in UI:
    // showErrorInUI(message);
}

function ensureGameOfLife(game: GameOfLifeType | null): asserts game is GameOfLifeType {
    if (!game) {
        handleError("Game of Life instance is not initialized.");
        throw new Error("Game of Life instance is not initialized.");
    }
}

const startTypes = start_type_variants();
let canvas = getElement<HTMLCanvasElement>('game-of-life-canvas');

const playPauseButton = getElement<HTMLButtonElement>('play-pause-button');
const renderTypeSelect = getElement<HTMLSelectElement>('render-type-select');
const startTypeSelect = getElement<HTMLSelectElement>('start-type-select');
const ticksPerFrameInput = getElement<HTMLInputElement>('ticks-per-frame');
const ticksPerFrameValue = getElement<HTMLSpanElement>('ticks-per-frame-value');
const showGridCheckbox = getElement<HTMLInputElement>('show-grid-cb');

const universeWidthInput = getElement<HTMLInputElement>('universe-size-width');
const universeHeightInput = getElement<HTMLInputElement>('universe-size-height');
const setUniverseSizeButton = getElement<HTMLButtonElement>('set-universe-size-button');

let gameOfLife: GameOfLifeType | null = null;

startTypes.forEach((type, idx) => {
    const option = document.createElement('option');
    option.value = idx.toString();
    option.textContent = type;
    startTypeSelect.appendChild(option);
});

for (const [_, value] of Object.entries(ORenderMode)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    renderTypeSelect.appendChild(option);
}



startTypeSelect.addEventListener('change', async (event: Event) => {
    const eventTarget = event.target as HTMLSelectElement;
    if (eventTarget.value) {
        await initializeGameOfLife();
    }
});

renderTypeSelect.addEventListener('change', async (event: Event) => {
    const eventTarget = event.target as HTMLSelectElement;
    if (eventTarget.value) {
        // A canvas element cannot be reused with a different rendering context, so we need to create a new one.
        const newCvs = canvas.cloneNode(false) as HTMLCanvasElement;
        canvas.parentNode?.replaceChild(newCvs, canvas);
        canvas = newCvs;
        attachCanvasHandlers(canvas);
        await initializeGameOfLife();
    }
});

playPauseButton.classList.add('js-state-paused');


ticksPerFrameInput.addEventListener("change", (event: Event) => {
    const eventTarget = event.target as HTMLInputElement;
    if (eventTarget.value) {
        try {
            ensureGameOfLife(gameOfLife);
            const ticksPerFrame = parseInt(eventTarget.value, 10);
            gameOfLife.setTicksPerFrame(ticksPerFrame);
            ticksPerFrameValue.textContent = ticksPerFrame.toString();
        } catch (e) {
            return;
        }
    }
});


showGridCheckbox.addEventListener("change", (event: Event) => {
    const eventTarget = event.target as HTMLInputElement;
    const showGrid = eventTarget.checked;
    try {
        ensureGameOfLife(gameOfLife);
        gameOfLife.setDrawGridFlag(showGrid);
        gameOfLife.draw();
    } catch (e) {
        return;
    }
});

let isMouseDown = false;


const attachCanvasHandlers = (canvas: HTMLCanvasElement) => {
    canvas.addEventListener("mousedown", (event: MouseEvent) => {
        isMouseDown = true;
        try {
            ensureGameOfLife(gameOfLife);
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
        } catch (e) {
            return;
        }
    });

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
        if (!isMouseDown) return;
        try {
            ensureGameOfLife(gameOfLife);
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            // Only set the cell to alive if not using shift or ctrl
            if (!event.shiftKey && !event.ctrlKey) {
                gameOfLife.setCellToAlive(x, y);
            }
        } catch (e) {
            return;
        }
    });

    document.addEventListener("mouseup", () => {
        isMouseDown = false;
    });
}

playPauseButton.addEventListener('click', () => {
    try {
        ensureGameOfLife(gameOfLife);
        if (gameOfLife.isPlaying()) {
            gameOfLife.stop();
            playPauseButton.classList.remove('js-state-playing');
            playPauseButton.classList.add('js-state-paused');
        } else {
            gameOfLife.start();
            playPauseButton.classList.add('js-state-playing');
            playPauseButton.classList.remove('js-state-paused');
        }
    } catch (e) {
        return;
    }
});

setUniverseSizeButton.addEventListener('click', async () => {
    await initializeGameOfLife();
})

const initializeGameOfLife = async () => {
    const renderMode = renderTypeSelect.value;
    const startType = parseInt(startTypeSelect.value, 10);
    const newWidth = parseInt(universeWidthInput.value, 10);
    const newHeight = parseInt(universeHeightInput.value, 10);

    if (gameOfLife) {
        gameOfLife.stop();
        playPauseButton.classList.remove('js-state-playing');
        playPauseButton.classList.add('js-state-paused');
    }

    gameOfLife = null;
    gameOfLife = await initGameOfLife(canvas, newWidth, newHeight, startType, renderMode);

    gameOfLife.setDrawGridFlag(showGridCheckbox.checked);
    gameOfLife.draw();
}

(async () => {
    attachCanvasHandlers(canvas);
    gameOfLife = await initGameOfLife(canvas, 128, 128, 0, ORenderMode.Render2D);
})();

