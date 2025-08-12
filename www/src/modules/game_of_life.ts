import init, { Cell, StartType, Universe } from 'playground';
import type { GameOfLifeType } from './types.ts';
import type { RenderContextInterface } from './render_context/render_context_interface.ts';
import { Fps } from './app/fps.ts';

import RenderContext2D from './render_context/render_2d.ts';
import RenderContextWebGL from './render_context/render_webgl.ts';

export const CELL_SIZE = 5;
export const GRID_COLOR = '#CCCCCC';
export const DEAD_COLOR = '#FFFFFF';
export const ALIVE_COLOR = '#000000';

const wasm = await init();

export const ORenderMode = {
    Render2D: '2D',
    RenderWebGL: 'WebGL',
};

type RenderMode = (typeof ORenderMode)[keyof typeof ORenderMode];

class GameOfLife implements GameOfLifeType {
    private readonly memory: WebAssembly.Memory;
    private universe: Universe;
    private readonly width: number;
    private readonly height: number;

    private animationFrameId: number | null = null;
    private gridDrawn: boolean = false;
    private ticksPerFrame: number = 1;

    private fpsCounter: Fps;
    private readonly fpsElement: HTMLDivElement | null = null;
    private renderContext: RenderContextInterface;

    private drawGridFlag: boolean = true;

    private constructor(
        memory: WebAssembly.Memory,
        canvas: HTMLCanvasElement,
        universe: Universe,
        width: number,
        height: number,
        renderMode: RenderMode = ORenderMode.Render2D
    ) {
        this.memory = memory;
        this.universe = universe;
        this.width = width;
        this.height = height;

        this.fpsCounter = new Fps();
        this.fpsElement = document.getElementById('fps') as HTMLDivElement;

        switch (renderMode) {
            case ORenderMode.Render2D:
                this.renderContext = new RenderContext2D(
                    canvas,
                    this.memory,
                    this.width,
                    this.height
                );
                break;
            case ORenderMode.RenderWebGL:
                this.renderContext = new RenderContextWebGL(
                    canvas,
                    this.memory,
                    this.width,
                    this.height
                );
                break;
            default:
                throw new Error(`Unsupported render mode: ${renderMode}`);
        }
    }

    static async create(
        canvas: HTMLCanvasElement,
        universeWidth: number = 128,
        universeHeight: number = 128,
        initialState: StartType | null,
        renderMode: RenderMode = ORenderMode.Render2D
    ): Promise<GameOfLife> {
        const memory: WebAssembly.Memory = wasm.memory;

        const universe = Universe.new(
            universeWidth,
            universeHeight,
            initialState ?? StartType.Default
        );
        const width = universe.width();
        const height = universe.height();

        canvas.height = (CELL_SIZE + 1) * height + 1;
        canvas.width = (CELL_SIZE + 1) * width + 1;

        return new GameOfLife(memory, canvas, universe, width, height, renderMode);
    }

    public setTicksPerFrame(ticks: number): void {
        if (ticks < 1) {
            ticks = 1;
        }

        this.ticksPerFrame = ticks;
    }

    public toggleCell(x: number, y: number): void {
        const row = Math.floor(y / (CELL_SIZE + 1));
        const column = Math.floor(x / (CELL_SIZE + 1));

        this.universe.toggle_cell(row, column);

        this.drawCells();
    }

    public insertGlider(x: number, y: number): void {
        const row = Math.floor(y / (CELL_SIZE + 1));
        const column = Math.floor(x / (CELL_SIZE + 1));

        const firstRow = wrapIndex(row - 1, this.height);
        const firstColumn = wrapIndex(column - 1, this.width);
        const lastRow = wrapIndex(row + 1, this.height);
        const lastColumn = wrapIndex(column + 1, this.width);

        // top row
        this.universe.set_cell(firstRow, firstColumn, Cell.Dead);
        this.universe.set_cell(firstRow, column, Cell.Alive);
        this.universe.set_cell(firstRow, lastColumn, Cell.Dead);

        // middle row
        this.universe.set_cell(row, firstColumn, Cell.Dead);
        this.universe.set_cell(row, column, Cell.Dead);
        this.universe.set_cell(row, lastColumn, Cell.Alive);

        // bottom row
        this.universe.set_cell(lastRow, firstColumn, Cell.Alive);
        this.universe.set_cell(lastRow, column, Cell.Alive);
        this.universe.set_cell(lastRow, lastColumn, Cell.Alive);

        this.drawCells();
    }

    public insertPulsar(x: number, y: number): void {
        const row = Math.floor(y / (CELL_SIZE + 1));
        const column = Math.floor(x / (CELL_SIZE + 1));

        // Pulsar center
        this.universe.set_cell(row, column, Cell.Dead);

        let cellsToSet = [
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
            [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        ];

        for (let it = 0; it < 2; it++) {
            const rowOffset = it * 7;

            if (it === 1) {
                cellsToSet = cellsToSet.reverse();
            }

            for (let rowIdx = 0; rowIdx < cellsToSet.length; rowIdx++) {
                for (let cellIdx = 0; cellIdx < cellsToSet[rowIdx].length; cellIdx++) {
                    this.universe.set_cell(
                        wrapIndex(row + rowIdx - 6 + rowOffset, this.height),
                        wrapIndex(column + cellIdx - 6, this.width),
                        cellsToSet[rowIdx][cellIdx] === 1 ? Cell.Alive : Cell.Dead
                    );
                }
            }

            if (it === 0) {
                for (let cellIdx = 0; cellIdx < 13; cellIdx++) {
                    this.universe.set_cell(
                        row,
                        wrapIndex(column - 6 + cellIdx, this.width),
                        Cell.Dead
                    );
                }
            }
        }

        this.drawCells();
    }

    public draw(): void {
        this.renderContext.clear();
        this.drawGrid();
        this.drawCells();
    }

    public drawGrid(): void {
        if (!this.drawGridFlag) {
            return;
        }

        this.renderContext.clear();
        this.renderContext.drawGrid();
        this.gridDrawn = true;
    }

    public drawCells(): void {
        const cellsPtr: number = this.universe.cells();
        this.renderContext.drawCells(cellsPtr);
    }

    private renderLoop = (): void => {
        const fps = this.fpsCounter.clock();
        this.renderFps(fps);

        this.animationFrameId = null;

        for (let tick = 0; tick < this.ticksPerFrame; tick++) {
            this.universe.tick();
        }

        this.drawCells();

        this.start();
    };

    public start(): void {
        if (!this.gridDrawn) {
            this.drawGrid();
        }

        if (this.animationFrameId == null) {
            this.animationFrameId = requestAnimationFrame(this.renderLoop);
        }
    }

    public stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    public isPlaying(): boolean {
        return this.animationFrameId !== null;
    }

    private renderFps(fps: number) {
        if (this.fpsElement) {
            this.fpsElement.textContent = `${fps}`;
        }
    }

    public setCellToAlive(x: number, y: number): void {
        const row = Math.floor(y / (CELL_SIZE + 1));
        const column = Math.floor(x / (CELL_SIZE + 1));
        if (this.universe.get_cell) {
            // If "get_cell" is available, only set if not already alive
            if (this.universe.get_cell(row, column) !== Cell.Alive) {
                this.universe.set_cell(row, column, Cell.Alive);
                this.drawCells();
            }
        } else {
            // Fallback: only set to alive
            this.universe.set_cell(row, column, Cell.Alive);
            this.drawCells();
        }
    }

    public setDrawGridFlag(flag: boolean): void {
        this.drawGridFlag = flag;
        this.renderContext.setDrawGridFlag(flag);
    }
}

function wrapIndex(index: number, max: number): number {
    return ((index % max) + max) % max;
}

export async function initGameOfLife(
    canvas: HTMLCanvasElement,
    width: number = 128,
    height: number = 128,
    initialState: StartType | null,
    renderMode: RenderMode | null
): Promise<GameOfLife> {
    const gol = await GameOfLife.create(
        canvas,
        width,
        height,
        initialState,
        renderMode ?? ORenderMode.Render2D
    );
    gol.drawGrid();
    gol.drawCells();

    return gol;
}
