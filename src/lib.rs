use wasm_bindgen::prelude::*;
use std::fmt;

mod utils;
mod math;

#[wasm_bindgen]
extern {
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
pub struct Universe {
    width: usize,
    height: usize,
    cells: Vec<u8>,
}

impl Universe {
    fn get_index(&self, row: usize, column: usize) -> usize {
        (row * self.width + column) as usize
    }

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

    fn live_neighbour_count(&self, row: usize, column: usize) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1 , 0 , 1].iter().cloned() {
            for delta_column in [self.width - 1 , 0 , 1].iter().cloned() {

                if delta_row == 0 && delta_column == 0 {
                    continue;
                }

                let neighbour_row = (row + delta_row) % self.height;
                let neighbour_column = (column + delta_column) % self.width;
                count += self.get_cell(self.get_index(neighbour_row, neighbour_column)) as u8;
            }
        }
        count
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
            let cell_idx = byte * 8 + bit;
            // Use cell_idx as the actual cell index
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

    let spaceship_cells = [
        (4, 3),
        (5, 4),
        (6, 2),
        (6, 3),
        (6, 4),
    ];

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
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == (Cell::Dead as u8) { '◻' } else { '◼' };
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
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.get_cell(idx);
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

                let byte = &mut next[idx / 8];
                let bit = idx % 8;

                match next_cell {
                    Cell::Alive => *byte |= 1 << bit,
                    Cell::Dead => *byte &= !(1 << bit),
                }
            }
        }

        self.cells = next;
    }

    pub fn new(start_type: &str) -> Universe {
        let width = 64;
        let height = 64;

        let cells = match start_type {
            "random" => init_cells_random(width, height),
            "all_dead" => init_cells_all_dead(width, height),
            "spaceship" => init_cells_spaceship(width, height),
            _ => init_cells_default(width, height),
        };

        Universe {
            width,
            height,
            cells,
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

    // Returns a raw pointer to the cells for direct WebAssembly memory access from JS;
    // *const Cell is a pointer type, not a dereference.
    pub fn cells(&self) -> *const u8 {
        self.cells.as_ptr()
    }
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
