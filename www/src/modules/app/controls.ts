import type { Controls, GameOfLifeType } from '../types';
import { handleError, ensureGameOfLife } from './error';
import { ORenderMode } from '../game_of_life';
import { start_type_variants } from 'playground';

export async function setupControlHandlers(
    getGameOfLife: () => GameOfLifeType | null,
    controls: Controls,
    initializeGameOfLife: () => Promise<void>,
    getCanvas: () => HTMLCanvasElement,
    setCanvas: (c: HTMLCanvasElement) => void,
    attachCanvasHandlers: (
        canvas: HTMLCanvasElement,
        getGameOfLife: () => GameOfLifeType | null
    ) => void
) {
    const {
        playPauseButton,
        renderTypeSelect,
        startTypeSelect,
        ticksPerFrameInput,
        ticksPerFrameValue,
        showGridCheckbox,
        setUniverseSizeButton,
    } = controls;

    const startTypes = start_type_variants();

    (() => {
        startTypes.forEach((type, idx) => {
            const option = document.createElement('option');
            option.value = idx.toString();
            option.textContent = type;
            startTypeSelect.appendChild(option);
        });

        Object.entries(ORenderMode).forEach(([, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            renderTypeSelect.appendChild(option);
        });
    })();

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
            const canvas = getCanvas();

            const newCvs = canvas.cloneNode(false) as HTMLCanvasElement;
            canvas.parentNode?.replaceChild(newCvs, canvas);
            setCanvas(newCvs);
            attachCanvasHandlers(newCvs, getGameOfLife);
            await initializeGameOfLife();
        }
    });

    playPauseButton.classList.add('js-state-paused');

    ticksPerFrameInput.addEventListener('change', (event: Event) => {
        const eventTarget = event.target as HTMLInputElement;
        if (eventTarget.value) {
            const gameOfLife = getGameOfLife();
            try {
                ensureGameOfLife(gameOfLife);
                const ticksPerFrame = parseInt(eventTarget.value, 10);
                gameOfLife.setTicksPerFrame(ticksPerFrame);
                ticksPerFrameValue.textContent = ticksPerFrame.toString();
            } catch (e) {
                handleError((e as Error).message);
                return;
            }
        }
    });

    showGridCheckbox.addEventListener('change', (event: Event) => {
        const eventTarget = event.target as HTMLInputElement;
        const showGrid = eventTarget.checked;
        const gameOfLife = getGameOfLife();
        try {
            ensureGameOfLife(gameOfLife);
            gameOfLife.setDrawGridFlag(showGrid);
            gameOfLife.draw();
        } catch (e) {
            handleError((e as Error).message);
            return;
        }
    });

    playPauseButton.addEventListener('click', () => {
        const gameOfLife = getGameOfLife();
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
            handleError((e as Error).message);
            return;
        }
    });

    setUniverseSizeButton.addEventListener('click', async () => {
        await initializeGameOfLife();
    });
}
