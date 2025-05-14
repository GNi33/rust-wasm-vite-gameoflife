# Rust Wasm Playground

Simple Rust + WebAssembly Playground.
Will probably use tags to manage certain steps.

The first steps are based on https://surma.dev/things/rust-to-webassembly/, where no wasm_bindgen was used. There we
``cargo build --target wasm32-unknown-unknown --release`` to build the project. We used a simple node.js server to
run a file that would load the .wasm file and call the exported `add`-function.

The second stage is based on https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Rust_to_Wasm, where 
wasm_bindgen is introduced. The build command is then ``wasm-pack build --target web``. The built js file is then loaded
in the index.html file. I moved the math package to a separate file, just to see if that would work. I needed to change
the binding attributes there as well.

### Build

```bash
wasm-pack build --target web
```
