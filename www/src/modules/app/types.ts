// Shared types/interfaces
export interface Controls {
    playPauseButton: HTMLButtonElement;
    renderTypeSelect: HTMLSelectElement;
    startTypeSelect: HTMLSelectElement;
    ticksPerFrameInput: HTMLInputElement;
    ticksPerFrameValue: HTMLSpanElement;
    showGridCheckbox: HTMLInputElement;
    setUniverseSizeButton: HTMLButtonElement;
}

export type GameOfLifeType = {
    start(): void;
    stop(): void;
    setTicksPerFrame: (ticks: number) => void;
    isPlaying(): boolean;
    draw(): void;
    drawGrid(): void;
    drawCells(): void;
    toggleCell(x: number, y: number): void;
    setCellToAlive(x: number, y: number): void;
    insertGlider(x: number, y: number): void;
    insertPulsar(x: number, y: number): void;
    setDrawGridFlag(flag: boolean): void;
}
