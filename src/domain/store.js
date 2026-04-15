import { writable, derived } from 'svelte/store';
import { createGame, createSudoku } from './index.js';
import { generateSudoku } from '@sudoku/sudoku';
import { BOX_SIZE, SUDOKU_SIZE } from '@sudoku/constants';

export function createGameStore(initialGrid = null) {
  const startingGrid = initialGrid || generateSudoku('easy');
  const sudoku = createSudoku(startingGrid);
  const game = createGame({ sudoku });

  const { subscribe, set, update } = writable({
    grid: game.getSudoku().getGrid(),
    canUndo: game.canUndo(),
    canRedo: game.canRedo(),
    selectedCell: null
  });

  function generate(difficulty) {
    const newGrid = generateSudoku(difficulty);
    const newSudoku = createSudoku(newGrid);
    game.sudoku = newSudoku;
    game.history = [];
    game.future = [];
    game._saveState();
    updateState();
  }

  function guess(row, col, value) {
    let move;
    if (typeof row === 'object' && row !== null) {
      // 处理对象形式的参数（来自测试）
      move = row;
    } else {
      // 处理三个单独的参数（来自组件）
      move = { row, col, value };
    }
    const success = game.guess(move);
    if (success) {
      updateState();
    }
    return success;
  }

  function undo() {
    const success = game.undo();
    if (success) {
      updateState();
    }
    return success;
  }

  function redo() {
    const success = game.redo();
    if (success) {
      updateState();
    }
    return success;
  }

  function selectCell(row, col) {
    update(state => ({
      ...state,
      selectedCell: { row, col }
    }));
  }

  function updateState() {
    set({
      grid: game.getSudoku().getGrid(),
      canUndo: game.canUndo(),
      canRedo: game.canRedo(),
      selectedCell: null
    });
  }

  return {
    subscribe,
    generate,
    guess,
    undo,
    redo,
    selectCell
  };
}

export const gameStore = createGameStore();

export const invalidCells = derived(gameStore, $gameStore => {
  const _invalidCells = [];
  const grid = $gameStore.grid;

  const addInvalid = (x, y) => {
    const xy = x + ',' + y;
    if (!_invalidCells.includes(xy)) _invalidCells.push(xy);
  };

  for (let y = 0; y < SUDOKU_SIZE; y++) {
    for (let x = 0; x < SUDOKU_SIZE; x++) {

      const value = grid[y][x];

      if (value) {
        for (let i = 0; i < SUDOKU_SIZE; i++) {
          // Check the row
          if (i !== x && grid[y][i] === value) {
            addInvalid(x, y);
          }

          // Check the column
          if (i !== y && grid[i][x] === value) {
            addInvalid(x, i);
          }
        }

        // Check the box
        const startY = Math.floor(y / BOX_SIZE) * BOX_SIZE;
        const endY = startY + BOX_SIZE;
        const startX = Math.floor(x / BOX_SIZE) * BOX_SIZE;
        const endX = startX + BOX_SIZE;
        for (let row = startY; row < endY; row++) {
          for (let col = startX; col < endX; col++) {
            if (row !== y && col !== x && grid[row][col] === value) {
              addInvalid(col, row);
            }
          }
        }
      }

    }
  }

  return _invalidCells;
}, []);
