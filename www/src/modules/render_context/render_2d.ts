import type {RenderContextInterface} from "./render_context_interface.ts";
import {Cell} from "playground";
import {ALIVE_COLOR, CELL_SIZE, DEAD_COLOR, GRID_COLOR} from "../game_of_life.ts";

export default class RenderContext2D implements RenderContextInterface {

    private readonly ctx: CanvasRenderingContext2D;
    private readonly memory: WebAssembly.Memory;
    private readonly width: number;
    private readonly height: number;

    constructor(
        canvas: HTMLCanvasElement,
        memory: WebAssembly.Memory,
        width: number,
        height: number
    ) {

        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        if (!this.ctx) {
            throw new Error("Failed to get 2D rendering context");
        }

        this.memory = memory;

        this.width = width;
        this.height = height;
    }

    public draw(cellsPtr: number): void {
        this.clear();

        this.drawGrid();
        this.drawCells(cellsPtr);
    }

    public clear(): void {
        this.ctx.clearRect(0, 0, (CELL_SIZE + 1) * this.width + 1, (CELL_SIZE + 1) * this.height + 1);
    }

    public drawGrid(): void {

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
    }

    public drawCells(cellsPtr: number): void {

        const numBytes = Math.ceil((this.width * this.height) / 8);
        const cells: Uint8Array = new Uint8Array(this.memory.buffer, cellsPtr, numBytes);
        this.ctx.beginPath();

        this.ctx.fillStyle = ALIVE_COLOR;
        this.fillCells(cells, true);

        this.ctx.fillStyle = DEAD_COLOR;
        this.fillCells(cells, false);

        this.ctx.stroke();
    }

    private fillCells(cells: Uint8Array, alive: boolean): void {
        const BIT_MASKS = [1,2,4,8,16,32,64,128];
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const idx: number = this.getIndex(row, column);
                const byte = Math.floor(idx / 8);
                const bit = idx % 8;
                const mask = BIT_MASKS[bit];
                const cellByte = cells[byte];
                const isAlive = (cellByte & mask) !== Cell.Dead;

                if( isAlive !== alive) {
                    continue;
                }

                this.ctx.fillRect(
                    column * (CELL_SIZE + 1) + 1,
                    row * (CELL_SIZE + 1) + 1,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }

    private getIndex(row: number, column: number): number {
        return row * this.width + column;
    }
}