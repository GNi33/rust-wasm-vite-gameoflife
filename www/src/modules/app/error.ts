// Centralized error handling
import type { GameOfLifeType } from '../types';

export function handleError(message: string): void {
    console.error(message);
    // Optionally, display in UI
}

export function ensureGameOfLife(game: GameOfLifeType | null): asserts game is GameOfLifeType {
    if (!game) {
        throw new Error('Game of Life instance is not initialized.');
    }
}
