import init, {Cell, StartType, Universe} from "playground";

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const wasm = await init();

export type GameOfLifeType = {
    start(): void;
    stop(): void;
    setTicksPerFrame: (ticks: number) => void;
    isPlaying(): boolean;
    drawGrid(): void;
    drawCells(): void;
    toggleCell(x: number, y: number): void;
    insertGlider(x: number, y: number): void;
    insertPulsar(x: number, y: number): void;
}

class GameOfLife implements GameOfLifeType {
    private memory: WebAssembly.Memory;
    private ctx: CanvasRenderingContext2D;
    private universe: Universe;
    private width: number;
    private height: number;

    private animationFrameId: number | null = null;
    private gridDrawn: boolean = false;
    private ticksPerFrame: number = 1;

    private constructor(
        memory: WebAssembly.Memory,
        ctx: CanvasRenderingContext2D,
        universe: Universe,
        width: number,
        height: number
    ) {
        this.memory = memory;
        this.ctx = ctx;
        this.universe = universe;
        this.width = width;
        this.height = height;
    }

    static async create(
        canvas: HTMLCanvasElement,
        initialState: StartType | null
    ): Promise<GameOfLife> {

        const memory: WebAssembly.Memory = wasm.memory;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        const universe = Universe.new(initialState ?? StartType.Default);
        const width = universe.width();
        const height = universe.height();

        canvas.height = (CELL_SIZE + 1) * height + 1;
        canvas.width = (CELL_SIZE + 1) * width + 1;

        return new GameOfLife(memory, ctx, universe, width, height);
    }

    private getIndex(row: number, column: number): number {
        return row * this.width + column;
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
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1,0,0,0,0,1],
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
        ];

        for (let it = 0; it < 2; it++) {

            let rowOffset = it * 7;

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

            if( it === 0) {
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

    public drawGrid(): void {
        this.ctx.clearRect(0, 0, (CELL_SIZE + 1) * this.width + 1, (CELL_SIZE + 1) * this.height + 1);

        this.ctx.beginPath();
        this.ctx.strokeStyle = GRID_COLOR;
        for (let i = 0; i <= this.width; i++) {
            this.ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
            this.ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * this.height + 1);
        }
        for (let j = 0; j <= this.height; j++) {
            this.ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
            this.ctx.lineTo((CELL_SIZE + 1) * this.width + 1, j * (CELL_SIZE + 1) + 1);
        }

        this.ctx.stroke();
        this.gridDrawn = true;
    }

    public drawCells(): void {
        const cellsPtr: number = this.universe.cells();
        const numBytes = Math.ceil((this.width * this.height) / 8);
        const cells: Uint8Array = new Uint8Array(this.memory.buffer, cellsPtr, numBytes);
        this.ctx.beginPath();
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const idx: number = this.getIndex(row, column);
                const byte = Math.floor(idx / 8);
                const bit = idx % 8;
                const isAlive = (cells[byte] & (1 << bit)) !== Cell.Dead;
                this.ctx.fillStyle = isAlive ? ALIVE_COLOR : DEAD_COLOR;
                this.ctx.fillRect(
                    column * (CELL_SIZE + 1) + 1,
                    row * (CELL_SIZE + 1) + 1,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
        this.ctx.stroke();
    }

    private renderLoop = (): void => {

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
}

function wrapIndex(index: number, max: number): number {
    return ((index % max) + max) % max;
}

export async function initGameOfLife(canvas: HTMLCanvasElement, initialState: StartType | null): Promise<GameOfLife> {
    let gol = await GameOfLife.create(canvas, initialState);
    gol.drawGrid();
    gol.drawCells();

    return gol;
}
