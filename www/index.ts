import init, { greet, Universe } from "playground";

init().then(() => {
    // greet("WebAssembly");

    const pre = document.getElementById("game-of-life-canvas") as HTMLElement | null;
    if (!pre) {
        throw new Error('Element with id "game-of-life-canvas" not found');
    }

    const universe: Universe = Universe.new();

    const renderLoop = (): void => {
        pre.textContent = universe.render();
        universe.tick();

        requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
});
