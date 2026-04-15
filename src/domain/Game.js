import { createSudoku, createSudokuFromJSON } from './Sudoku.js';

class Game {
  constructor({ sudoku }) {
    this.sudoku = sudoku;
    this.history = [];
    this.future = [];
    // 初始状态不需要保存到历史记录，因为还没有任何操作
  }

  getSudoku() {
    return this.sudoku;
  }

  guess(move) {
    // 保存当前状态到历史记录
    this._saveState();
    const success = this.sudoku.guess(move);
    if (success) {
      this.future = [];
    }
    return success;
  }

  undo() {
    if (this.canUndo()) {
      this.future.unshift(this.sudoku.clone());
      this.sudoku = this.history.pop();
      return true;
    }
    return false;
  }

  redo() {
    if (this.canRedo()) {
      this._saveState();
      this.sudoku = this.future.shift();
      return true;
    }
    return false;
  }

  canUndo() {
    return this.history.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }

  toJSON() {
    return {
      sudoku: this.sudoku.toJSON(),
      history: this.history.map(s => s.toJSON()),
      future: this.future.map(s => s.toJSON())
    };
  }

  _saveState() {
    this.history.push(this.sudoku.clone());
  }
}

export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

export function createGameFromJSON(json) {
  const sudoku = createSudokuFromJSON(json.sudoku);
  const game = new Game({ sudoku });
  game.history = json.history.map(s => createSudokuFromJSON(s));
  game.future = json.future.map(s => createSudokuFromJSON(s));
  return game;
}
