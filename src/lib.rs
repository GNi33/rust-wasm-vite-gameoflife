mod math {
    mod math_js {
        #[link(wasm_import_module = "Math")]
        unsafe extern "C" {
            pub fn random() -> f64;
        }
    }
    
    pub fn random() -> f64 {
        unsafe { math_js::random() }
    }
}

#[unsafe(export_name = "add")]
pub extern "C" fn add(left: f64, right: f64) -> f64 {
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
