// Canvas event listeners
import type { GameOfLifeType } from '../types';
import { handleError, ensureGameOfLife } from './error';

let isMouseDown = false;

export function attachCanvasHandlers(
    canvas: HTMLCanvasElement,
    getGameOfLife: () => GameOfLifeType | null
) {
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        isMouseDown = true;
        const gameOfLife = getGameOfLife();
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
                gameOfLife.toggleCell(x, y);
            }
        } catch (e) {
            handleError((e as Error).message);
            return;
        }
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        if (!isMouseDown) return;
        const gameOfLife = getGameOfLife();
        try {
            ensureGameOfLife(gameOfLife);
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (!event.shiftKey && !event.ctrlKey) {
                gameOfLife.setCellToAlive(x, y);
            }
        } catch (e) {
            handleError((e as Error).message);
            return;
        }
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
}
