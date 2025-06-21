use std::fmt;
use wasm_bindgen::prelude::*;

#[cfg(test)]
use wasm_bindgen_test::wasm_bindgen_test;
use web_sys::js_sys;

#[macro_use]
mod utils;
mod math;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(format!("Hello, {}!", name).as_str());
}

#[wasm_bindgen]
pub fn add(left: f64, right: f64) -> f64 {
    left + right + math::random()
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

#[wasm_bindgen]
#[repr(u8)]
pub enum StartType {
    Default = 0,
    Random = 1,
    AllDead = 2,
    Spaceship = 3,
}

#[wasm_bindgen]
pub fn start_type_variants() -> js_sys::Array {
    let arr = js_sys::Array::new();
    arr.push(&JsValue::from_str("default"));
    arr.push(&JsValue::from_str("random"));
    arr.push(&JsValue::from_str("all_dead"));
    arr.push(&JsValue::from_str("spaceship"));

    arr
}

#[derive(Clone)]
pub struct CellStore {
    cells: Vec<u8>,
}

#[wasm_bindgen]
pub struct Universe {
    width: usize,
    height: usize,
    store: CellStore,
}

impl CellStore {
    fn get_cell(&self, idx: usize) -> Cell {
        let byte = self.cells[idx / 8];
        let bit = idx % 8;

        if (byte >> bit) & 1 == 1 {
            Cell::Alive
        } else {
            Cell::Dead
        }
    }

    fn set_cell(&mut self, idx: usize, cell: Cell) {
        let byte = &mut self.cells[idx / 8];
        let bit = idx % 8;

        match cell {
            Cell::Alive => *byte |= 1 << bit,
            Cell::Dead => *byte &= !(1 << bit),
        }
    }
}

impl Universe {
    fn get_index(&self, row: usize, column: usize) -> usize {
        row * self.width + column
    }

    fn live_neighbour_count(&self, row: usize, column: usize) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_column in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_column == 0 {
                    continue;
                }

                let neighbour_row = (row + delta_row) % self.height;
                let neighbour_column = (column + delta_column) % self.width;
                count += self
                    .store
                    .get_cell(self.get_index(neighbour_row, neighbour_column))
                    as u8;
            }
        }
        count
    }

    pub fn get_cells(&self) -> &Vec<u8> {
        &self.store.cells
    }

    /// Set cells to be alive in the universe by passing the row and column
    /// of each cell as an array.
    pub fn set_cells(&mut self, cells: &[(usize, usize)]) {
        for (row, col) in cells.iter().cloned() {
            let idx = self.get_index(row, col);

            self.store.set_cell(idx, Cell::Alive);
        }
    }
}

fn init_cells_default(width: usize, height: usize) -> Vec<u8> {
    let mut cells = init_cells_all_dead(width, height);

    for byte in 0..cells.len() {
        for bit in 0..8 {
            let cell_idx = byte * 8 + bit;
            // Use cell_idx as the actual cell index
            if cell_idx % 2 == 0 || cell_idx % 7 == 0 {
                cells[byte] |= 1 << bit;
            }
        }
    }

    cells
}

fn init_cells_random(width: usize, height: usize) -> Vec<u8> {
    let mut cells = init_cells_all_dead(width, height);

    for byte in 0..cells.len() {
        for bit in 0..8 {
            if math::random() > 0.5 {
                cells[byte] |= 1 << bit;
            }
        }
    }

    cells
}

fn init_cells_all_dead(width: usize, height: usize) -> Vec<u8> {
    vec![Cell::Dead as u8; (width * height + 7) / 8]
}

fn init_cells_spaceship(width: usize, height: usize) -> Vec<u8> {
    let mut cells = init_cells_all_dead(width, height);

    let spaceship_cells = [(4, 3), (5, 4), (6, 2), (6, 3), (6, 4)];

    for &(row, col) in &spaceship_cells {
        let idx = row * width + col;
        let byte = idx / 8;
        let bit = idx % 8;
        cells[byte] |= 1 << bit;
    }

    cells
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.store.cells.as_slice().chunks(self.width) {
            for &cell in line {
                let symbol = if cell == (Cell::Dead as u8) {
                    '◻'
                } else {
                    '◼'
                };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    pub fn tick(&mut self) {
        let mut next = self.store.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = next.get_cell(idx);

                let live_neighbors = self.live_neighbour_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                next.set_cell(idx, next_cell);
            }
        }

        self.store = next;
    }

    pub fn toggle_cell(&mut self, row: usize, col: usize) {
        let idx = self.get_index(row, col);
        let current_cell = self.store.get_cell(idx);

        let new_cell = match current_cell {
            Cell::Alive => Cell::Dead,
            Cell::Dead => Cell::Alive,
        };

        self.store.set_cell(idx, new_cell);
    }

    pub fn set_cell(&mut self, row: usize, col: usize, cell: Cell) {
        let idx = self.get_index(row, col);
        self.store.set_cell(idx, cell);
    }

    pub fn new(start_type: StartType) -> Universe {
        let width = 128;
        let height = 128;

        log!(
            "Initializing universe with width {} and height {}",
            width,
            height
        );

        let cells = match start_type {
            StartType::Random => init_cells_random(width, height),
            StartType::AllDead => init_cells_all_dead(width, height),
            StartType::Spaceship => init_cells_spaceship(width, height),
            _ => init_cells_default(width, height),
        };

        let store = CellStore { cells };

        Universe {
            width,
            height,
            store,
        }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn set_width(&mut self, width: usize) {
        self.width = width;

        self.store.cells = init_cells_all_dead(width, self.height);
    }

    pub fn set_height(&mut self, height: usize) {
        self.height = height;

        self.store.cells = init_cells_all_dead(self.width, height);
    }

    // Returns a raw pointer to the cells for direct WebAssembly memory access from JS;
    // *const Cell is a pointer type, not a dereference.
    pub fn cells(&self) -> *const u8 {
        self.store.cells.as_ptr()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[wasm_bindgen_test]
    fn it_works() {
        let result = add(2.0, 2.0);
        assert!(result > 4.0);
    }
}
