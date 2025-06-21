# Rust Wasm Playground

Simple Rust + WebAssembly Playground.
Will probably use tags to manage certain steps.

## Steps

### Step 1: Rust to WebAssembly without wasm_bindgen
The first steps are based on https://surma.dev/things/rust-to-webassembly/, where no wasm_bindgen was used. There we
``cargo build --target wasm32-unknown-unknown --release`` to build the project. We used a simple node.js server to
run a file that would load the .wasm file and call the exported `add`-function.

### Step 2: Rust to WebAssembly with wasm_bindgen
The second stage is based on https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm, where 
wasm_bindgen is introduced. The build command is then ``wasm-pack build --target web``. The built js file is then loaded
in the index.html file. I moved the math package to a separate file, just to see if that would work. I needed to change
the binding attributes there as well.

### Step 3: A Game Of Life implementation using wasm_bindgen and canvas
The third stage is based on https://rustwasm.github.io/book/game-of-life. It is a simple implementation of the
Game of Life using Rust and WebAssembly. The game logic is implemented in Rust, and the rendering is done using 
the HTML5 canvas API. The project uses `wasm-bindgen` to facilitate communication between Rust and JavaScript. 
It was implemented iteratively, starting with a simple rendering into the DOM, then switching to canvas rendering.
First, a simple vector of cells was used, then there was a switch to a vector of u8, where each cell is represented
by a single bit (0 for dead, 1 for alive) inside the u8.

### Step 4: Adding interactivity and UI
The fourth stage is based on the previous step, but now we add interactivity and a simple UI.

## Build

```bash
wasm-pack build --target web
```
