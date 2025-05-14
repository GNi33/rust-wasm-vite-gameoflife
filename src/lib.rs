use wasm_bindgen::prelude::*;

mod utils;
mod math;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm-game-of-life!");
    alert(math::random().to_string().as_str())
}

#[wasm_bindgen]
pub fn add(left: f64, right: f64) -> f64 {
    left + right + math::random()
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2.0, 2.0);
        assert!(result > 4.0);
    }
}
