import type { GameOfLifeType } from './src/modules/types';
import { ORenderMode } from './src/modules/game_of_life';
import { initGameOfLife } from './src/modules/game_of_life';
import { attachCanvasHandlers } from './src/modules/app/canvas-handlers';
import { setupControlHandlers } from './src/modules/app/controls';
import { getElement } from './src/modules/utils/dom';

function setCanvas(newCanvas: HTMLCanvasElement) {
    canvas = newCanvas;
}

function getCanvas(): HTMLCanvasElement {
    return canvas;
}

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

const initializeGameOfLife = async () => {
    const renderMode = renderTypeSelect.value;
    const startType = parseInt(startTypeSelect.value, 10);
    const newWidth = parseInt(universeWidthInput.value, 10);
    const newHeight = parseInt(universeHeightInput.value, 10);
    const ticksPerFrame = parseInt(ticksPerFrameInput.value, 10);

    if (gameOfLife) {
        gameOfLife.stop();
        playPauseButton.classList.remove('js-state-playing');
        playPauseButton.classList.add('js-state-paused');
    }

    gameOfLife = null;
    gameOfLife = await initGameOfLife(canvas, newWidth, newHeight, startType, renderMode);

    gameOfLife.setDrawGridFlag(showGridCheckbox.checked);
    gameOfLife.setTicksPerFrame(ticksPerFrame);
    gameOfLife.draw();
};

setupControlHandlers(
    () => gameOfLife,
    {
        playPauseButton,
        renderTypeSelect,
        startTypeSelect,
        ticksPerFrameInput,
        ticksPerFrameValue,
        showGridCheckbox,
        setUniverseSizeButton,
    },
    initializeGameOfLife,
    getCanvas,
    setCanvas,
    attachCanvasHandlers
);

(async () => {
    gameOfLife = await initGameOfLife(canvas, 128, 128, 0, ORenderMode.Render2D);
    attachCanvasHandlers(canvas, () => gameOfLife);
})();
