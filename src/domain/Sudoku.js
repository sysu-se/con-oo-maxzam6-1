class Sudoku {
  constructor(grid) {
    this.grid = this._deepClone(grid);
  }

  getGrid() {
    return this._deepClone(this.grid);
  }

  guess(move) {
    const { row, col, value } = move;
    if (this._isValidPosition(row, col)) {
      this.grid[row][col] = value;
      return true;
    }
    return false;
  }

  clone() {
    return new Sudoku(this.grid);
  }

  toJSON() {
    return { grid: this._deepClone(this.grid) };
  }

  toString() {
    return this.grid.map(row => row.join(' ')).join('\n');
  }

  _isValidPosition(row, col) {
    return row >= 0 && row < 9 && col >= 0 && col < 9;
  }

  _deepClone(grid) {
    return grid.map(row => [...row]);
  }
}

export function createSudoku(grid) {
  return new Sudoku(grid);
}

export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid);
}
