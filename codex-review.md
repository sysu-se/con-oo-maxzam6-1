# con-oo-maxzam6-1 - Review

## Review 结论

当前代码只完成了“部分接入”：棋盘渲染、输入、撤销/重做已经通过 `gameStore` 进入领域层，但开始新局、胜利判定、分享等关键流程仍然停留在旧 store / 旧 game 模块上，形成两套状态源，导致 `Sudoku` / `Game` 没有真正成为游戏核心。同时，`Sudoku` 对固定题面、校验规则和数独业务语义的建模明显不足，OOD 质量偏弱。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. 开始新局流程没有真正接入领域对象

- 严重程度：core
- 位置：src/components/Modal/Types/Welcome.svelte:2-24; src/components/Header/Dropdown.svelte:2-24; src/domain/store.js:18-26,86
- 原因：欢迎弹窗和菜单仍调用旧的 `@sudoku/game` 启动逻辑，而棋盘渲染读取的是 `gameStore`。`createGameStore.generate()` 虽然存在，但没有被这些 UI 入口消费，结果是难度选择、自定义题面与当前显示棋盘不是同一状态源，未满足“开始一局游戏必须通过 Game/Sudoku”这一核心要求。

### 2. 胜利判定与分享仍绑定旧 store，界面存在双状态源

- 严重程度：core
- 位置：src/App.svelte:4-17; src/components/Modal/Types/Share.svelte:3-17; src/components/Controls/Keyboard.svelte:6-23; src/components/Board/index.svelte:40-51
- 原因：用户输入、棋盘渲染和撤销重做走的是 `gameStore`，但通关弹窗订阅的是旧 `gameWon`，分享弹窗读取的是旧 `grid`。静态上看，当前玩家操作的棋盘、是否获胜、以及分享出去的题面并不保证一致，说明领域对象没有成为完整游戏流程的单一真实来源。

### 3. 领域模型没有建模固定题面与玩家填写，破坏数独业务语义

- 严重程度：core
- 位置：src/domain/Sudoku.js:10-17; src/components/Board/index.svelte:42-51; src/components/Controls/Keyboard.svelte:8-23
- 原因：`Sudoku` 只持有单一 `grid`，`guess()` 可以直接覆写任意位置，也不区分 givens 和 user input；棋盘渲染又把所有格子都标成 `userNumber={true}`。这样初始题目数字理论上也能被修改，UI 也失去了题面数字与玩家填写数字的语义区别，不符合数独游戏业务。

### 4. 校验职责泄漏到 Svelte adapter，Sudoku 本身缺少校验能力

- 严重程度：major
- 位置：src/domain/Sudoku.js:1-37; src/domain/store.js:88-133
- 原因：作业要求 `Sudoku` 提供校验能力，但当前行/列/宫冲突判断只存在于 `derived(invalidCells)`，`Sudoku` 自身既不校验 grid 结构，也不校验数值范围，更不会在 `guess()` 中维护业务约束。领域规则没有收敛在领域对象内，而是散落到了 UI 适配层。

### 5. store adapter 直接穿透 Game 内部实现，边界设计不稳

- 严重程度：major
- 位置：src/domain/store.js:18-26
- 原因：`generate()` 直接写 `game.sudoku`、`game.history`、`game.future`，还调用私有 `_saveState()`。这说明 `Game` 没有提供足够完整、正式的对外操作接口，adapter 只能依赖内部字段，耦合过深；而且新局一生成就进入 history，也让撤销语义变得可疑。

### 6. Game 的封装性不足，命令一致性也不够好

- 严重程度：major
- 位置：src/domain/Game.js:11-23
- 原因：`getSudoku()` 直接返回内部 `Sudoku` 实例，外部代码理论上可以绕过 `Game` 历史机制直接改对象；同时 `guess()` 在确认操作成功前就先 `_saveState()`，如果调用方传入越界坐标，会留下无意义历史记录。作为面向 UI 的领域入口，这个 API 仍然偏脆弱。

## 优点

### 1. Undo/Redo 与快照序列化至少被集中到了领域层

- 位置：src/domain/Game.js:15-61; src/domain/Sudoku.js:19-25
- 原因：`Game` 统一管理历史与未来栈，`Sudoku.clone()` 和两层 `toJSON()` 也为状态快照、撤销重做和持久化提供了基础，不再把这些逻辑散落在组件事件中。

### 2. 棋盘渲染、输入、撤销重做已经形成了明确的 store adapter 通路

- 位置：src/domain/store.js:11-84; src/components/Board/index.svelte:40-51; src/components/Controls/Keyboard.svelte:8-23; src/components/Controls/ActionBar/Actions.svelte:24-29
- 原因：组件主要通过 `$gameStore.grid` 渲染，并在事件中调用 `gameStore.guess()`、`gameStore.undo()`、`gameStore.redo()`，比直接在 `.svelte` 文件里修改二维数组更接近“View 消费领域对象”的目标。

### 3. 对二维数组做了防御性拷贝，降低了引用别名风险

- 位置：src/domain/Sudoku.js:2-8; src/domain/Sudoku.js:23-37
- 原因：构造、读取和序列化时都复制了 grid，至少避免了外部拿到同一数组引用后直接篡改内部状态，这一点对快照式历史管理是有帮助的。

## 补充说明

- 本次结论仅基于静态阅读，未运行测试，也未在浏览器中实际操作 UI；涉及“开始新局未真正生效”“胜利判定/分享与当前棋盘不同步”等判断，来自导入关系、状态来源和调用链的静态分析。
- 审查范围限制在 `src/domain/*` 及其关联的 Svelte 接入文件：`src/App.svelte`、`src/components/Board/*`、`src/components/Controls/*`、`src/components/Header/*`、`src/components/Modal/Types/Welcome.svelte`、`src/components/Modal/Types/Share.svelte`；未扩展评价其他无关目录。
- `src/domain/store.js:18-26` 的 `generate()` 问题属于静态路径判断；当前代码中未发现该方法被现有 UI 入口实际调用。
