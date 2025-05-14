mod math_js {
    use wasm_bindgen::prelude::*;    

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = Math)]
        pub fn random() -> f64;
    }
}

pub fn random() -> f64 { 
    math_js::random()
}