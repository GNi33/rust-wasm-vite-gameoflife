export interface RenderContextInterface {
    draw(cellsPtr: number): void;
    clear(): void;
    drawGrid(): void;
    drawCells(cellsPtr: number): void;
    setDrawGridFlag(flag: boolean): void;
}
