import init, { Cell, Universe } from "playground";

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let wasm;
wasm = await init();

const memory: WebAssembly.Memory = wasm.memory;

const canvas = document.getElementById("game-of-life-canvas") as HTMLElement | null;
if (!canvas) {
    throw new Error('Element with id "game-of-life-canvas" not found');
}

const universe: Universe = Universe.new();
const width: number = universe.width();
const height: number = universe.height();

canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;

const renderLoop = (): void => {
    universe.tick();

    drawGrid();
    drawCells();

    requestAnimationFrame(renderLoop);
};

const drawGrid = (): void => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row: number, column: number): number => {
    return row * width + column;
}

const drawCells = (): void => {
    const cellsPtr: number = universe.cells();
    const cells: Uint8Array = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            const idx: number = getIndex(row, column);
            ctx.fillStyle = cells[idx] === Cell.Alive ? ALIVE_COLOR : DEAD_COLOR;
            ctx.fillRect(
                column * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

requestAnimationFrame(renderLoop);
