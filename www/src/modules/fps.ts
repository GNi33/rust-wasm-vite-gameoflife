export class Fps {

    private frames: number[];
    private lastTimestamp: number;

    public constructor() {
        this.frames = [];
        this.lastTimestamp = performance.now();
    }

    public clock() {
        const now = performance.now();
        const delta = now - this.lastTimestamp;

        this.lastTimestamp = now;

        const fps = 1 / delta * 1000;

        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        return Math.round(fps);
    }
}