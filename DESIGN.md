# 领域对象设计与Svelte接入方案

## 一、领域对象如何被消费

### 1. View 层直接消费的是什么？

View 层直接消费的是 `gameStore`，这是一个基于 Svelte writable store 的适配器，它包装了我们的核心领域对象 `Game`。

### 2. View 层拿到的数据是什么？

View 层从 `gameStore` 中获取以下数据：
- `grid`: 当前数独游戏的网格数据（9x9二维数组）
- `canUndo`: 是否可以执行撤销操作
- `canRedo`: 是否可以执行重做操作
- `selectedCell`: 当前选中的单元格（如果有）

此外，View 层还从 `invalidCells` 派生 store 中获取无效单元格的信息，用于高亮显示冲突的数字。

### 3. 用户操作如何进入领域对象？

- **点击事件**：用户点击单元格时，通过 `cursor` store 更新当前选中位置
- **数字输入**：用户通过键盘或屏幕键盘输入数字时，`Keyboard.svelte` 组件调用 `gameStore.guess(row, col, value)` 方法
- **Undo/Redo**：用户点击撤销/重做按钮时，`Actions.svelte` 组件调用 `gameStore.undo()` 或 `gameStore.redo()` 方法

### 4. 领域对象变化后，Svelte 为什么会更新？

当领域对象发生变化时，我们在 `gameStore` 中的 `updateState()` 方法会调用 `set()` 函数更新 store 的状态。由于 Svelte 的响应式系统，任何订阅了 `gameStore` 的组件都会自动重新渲染，从而反映出领域对象的变化。

## 二、响应式机制说明

### 1. 依赖的响应式机制

我们主要依赖以下 Svelte 响应式机制：
- **store**：使用 `writable` store 来管理游戏状态
- **derived store**：使用 `derived` store 来计算 `invalidCells`
- **$store 语法**：在组件中使用 `$gameStore` 来订阅和访问 store 的状态

### 2. 响应式暴露给 UI 的数据

- `grid`：数独游戏的网格数据
- `canUndo`：是否可以撤销
- `canRedo`：是否可以重做
- `invalidCells`：无效单元格的列表

### 3. 留在领域对象内部的状态

- `Sudoku` 类内部的 `grid` 数据
- `Game` 类内部的 `history` 和 `future` 历史记录
- 领域对象的内部方法和逻辑

### 4. 直接 mutate 内部对象的问题

如果直接修改领域对象的内部状态（例如直接修改 `game.sudoku.grid`），Svelte 的响应式系统不会检测到这些变化，因为这些变化没有通过 store 的 `set()` 或 `update()` 方法触发。这会导致数据变了但界面不刷新的问题。

## 三、改进说明

### 1. 相比 HW1 的改进

- **引入了 Store Adapter 模式**：创建了 `gameStore` 作为领域对象和 UI 之间的桥梁，使得领域对象能够真正接入 Svelte 的响应式系统
- **改进了状态管理**：通过 store 统一管理游戏状态，避免了状态分散在多个组件中的问题
- **增强了领域对象的职责**：`Sudoku` 类负责管理数独网格数据，`Game` 类负责管理游戏历史和提供 undo/redo 功能

### 2. HW1 中的做法不足以支撑真实接入的原因

- HW1 中的领域对象只是独立的类，没有与 Svelte 的响应式系统集成
- UI 仍然直接操作旧的状态管理系统，没有使用领域对象
- 缺少将领域对象的变化通知给 UI 的机制

### 3. 新设计的 trade-off

- **优点**：
  - 领域对象与 UI 分离，职责清晰
  - 响应式更新机制可靠，确保数据变化能及时反映到 UI
  - 便于测试和维护

- **缺点**：
  - 需要额外的代码来创建和维护 store 适配器
  - 对于简单的应用，可能显得有些过度设计

## 四、技术实现细节

### 1. 领域对象设计

- **Sudoku 类**：
  - 持有当前 grid 数据
  - 提供 `guess()` 方法用于输入数字
  - 提供 `clone()` 方法用于创建快照
  - 提供 `toJSON()` 和 `toString()` 方法用于序列化

- **Game 类**：
  - 持有当前 `Sudoku` 实例
  - 管理历史记录（`history` 和 `future`）
  - 提供 `undo()` 和 `redo()` 方法
  - 提供 `canUndo()` 和 `canRedo()` 方法用于检查操作可行性

### 2. Store Adapter 实现

- **createGameStore()**：创建一个包含游戏状态和操作方法的 store
- **内部持有**：`Game` 实例
- **对外暴露**：
  - 响应式状态：`grid`, `canUndo`, `canRedo`, `selectedCell`
  - 操作方法：`generate()`, `guess()`, `undo()`, `redo()`, `selectCell()`

### 3. 组件集成

- **Board 组件**：使用 `$gameStore.grid` 渲染数独网格
- **Keyboard 组件**：调用 `gameStore.guess()` 处理用户输入
- **Actions 组件**：调用 `gameStore.undo()` 和 `gameStore.redo()` 处理撤销/重做操作

## 五、结论

通过使用 Store Adapter 模式，我们成功地将领域对象接入了 Svelte 的响应式系统，实现了以下目标：

1. 领域对象真正进入了真实游戏流程，而不仅仅存在于测试中
2. UI 能够正确响应领域对象的变化
3. 实现了 undo/redo 功能与 UI 的联动
4. 保持了领域对象与 UI 的分离，提高了代码的可维护性

