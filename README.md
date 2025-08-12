# Rust Wasm Game Of Life

Simple Rust + WebAssembly Playground. 
Game of Life implementation, using Canvas/WebGL, Vite and TypeScript.
Uses tags to document certain stages/steps.

## Steps

### Step 1: Rust to WebAssembly without wasm_bindgen
The first steps are based on https://surma.dev/things/rust-to-webassembly/, where no wasm_bindgen was used. There we
``cargo build --target wasm32-unknown-unknown --release`` to build the project. Used a simple node.js script to
run a file that would load the .wasm file and call the exported `add`-function.

### Step 2: Rust to WebAssembly with wasm_bindgen
The second stage is based on https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm, where 
`wasm_bindgen` is introduced, as well as `wasm-pack`. The build command is then ``wasm-pack build --target web``.
The built js file is then loaded in the index.html file. I moved the math package to a separate file, just to see if
that would work. I needed to change the binding attributes there as well.

### Step 3: A Game Of Life implementation using wasm_bindgen and canvas
The third stage is based on https://rustwasm.github.io/docs/book/game-of-life/introduction.html. It is a simple 
implementation of the Game of Life using Rust and WebAssembly. The game logic is implemented in Rust, and the rendering
is done using the HTML5 canvas API. The project uses `wasm-bindgen` to facilitate communication between Rust and 
JavaScript. 

It was implemented iteratively, starting with a simple rendering into the DOM, then switching to canvas rendering.
First, a simple vector of cells was used; then there was a switch to a vector of u8, where each cell is represented
by a single bit (0 for dead cells, 1 for live cells) inside the u8.

### Step 4: Adding interactivity and UI
The fourth stage is based on the previous step, with added interactivity and a simple UI.

### Step 5: WebGL rendering
The fifth stage is based on the previous step again but adds more interactive elements. 
Most notably, the user can choose between two different rendering modes, as now rendering using WebGL is implemented.
Includes several fixes and a refactoring of the TypeScript code.

## Build

In the root directory used to build the wasm binary:
```bash
wasm-pack build --target web
```

In `/www` used to run the vite dev server:

```bash
npm run dev
```

Vite build is bugged at this stage, as it does not include the bootstrap.ts file in the build, will address later.

## Test

For any tests using the `#[wasm_bindgen_test]` macro:

```bash
wasm-pack test --node
```
