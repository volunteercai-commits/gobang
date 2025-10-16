# 五子棋混合架构设计

## 架构概述

本项目采用混合架构设计，实现了"一份Rust代码，同时支持Tauri桌面应用和Web应用"的理想方案。通过分层架构最大化代码复用，同时追求极致性能。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  Tauri Desktop App    │           Web App                      │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐   │
│  │   React UI      │  │  │        React UI                 │   │
│  │                 │  │  │                                 │   │
│  └─────────────────┘  │  └─────────────────────────────────┘   │
│           │            │                    │                   │
│           │ IPC        │                    │ WASM API          │
│           ▼            │                    ▼                   │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐   │
│  │ Tauri Adapter   │  │  │      WASM Adapter               │   │
│  │                 │  │  │                                 │   │
│  └─────────────────┘  │  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           └──────────────┬─────────────────────┘
                          ▼
            ┌─────────────────────────┐
            │    共享核心层 (Rust)      │
            │                         │
            │  • AI算法 (Minimax)      │
            │  • 游戏逻辑              │
            │  • 状态管理              │
            │  • 平台无关代码          │
            └─────────────────────────┘
```

## 项目结构

```
gobang-react/
├── Cargo.toml                 # Workspace 配置
├── shared_core/               # 共享核心库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs             # 核心业务逻辑
├── src-tauri/                 # Tauri 应用程序
│   ├── Cargo.toml
│   └── src/
│       └── main.rs            # Tauri 适配层
├── wasm_lib/                  # WASM 库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs             # WASM 适配层
├── src/                       # React 前端
│   ├── utils/
│   │   ├── aiDecision.ts      # AI决策引擎
│   │   ├── tauriAI.ts         # Tauri AI适配器
│   │   ├── wasmAI.ts          # WASM AI适配器
│   │   └── aiEngine.ts        # JavaScript AI备用
│   └── ...
└── build-wasm.sh              # WASM构建脚本
```

## 核心组件

### 1. 共享核心层 (shared_core)

**位置**: `shared_core/src/lib.rs`

**职责**:
- 包含所有平台无关的业务逻辑
- AI算法实现 (Minimax + Alpha-Beta剪枝)
- 游戏状态管理
- 获胜检测逻辑
- 位置评估算法

**特点**:
- 纯Rust实现，无平台依赖
- 高性能算法
- 可序列化的数据结构
- 完整的错误处理

### 2. Tauri适配层 (src-tauri)

**位置**: `src-tauri/src/main.rs`

**职责**:
- 通过`#[tauri::command]`宏暴露核心函数
- 处理桌面应用特有的上下文
- 提供IPC接口给前端

**暴露的命令**:
- `ai_move`: 获取AI最佳移动
- `check_win`: 检查获胜状态
- `evaluate_board`: 评估棋盘状态
- `get_possible_moves`: 获取可能移动
- `create_game_state`: 创建游戏状态
- `make_move`: 执行移动

### 3. WASM适配层 (wasm_lib)

**位置**: `wasm_lib/src/lib.rs`

**职责**:
- 使用`wasm-bindgen`暴露核心函数给JavaScript
- 处理数据格式转换 (二维数组 ↔ 一维数组)
- 提供Web应用接口

**暴露的函数**:
- `get_best_move_wasm`: 获取AI最佳移动
- `check_win_wasm`: 检查获胜状态
- `evaluate_board_wasm`: 评估棋盘状态
- `get_possible_moves_wasm`: 获取可能移动
- `create_game_state_wasm`: 创建游戏状态
- `make_move_wasm`: 执行移动

### 4. 前端AI决策引擎

**位置**: `src/utils/aiDecision.ts`

**职责**:
- 智能选择最佳AI引擎
- 提供统一的AI接口
- 处理引擎回退逻辑

**选择策略**:
1. **Tauri环境**: 优先使用Tauri Rust AI
2. **Web环境**: 优先使用WASM Rust AI
3. **备用方案**: JavaScript AI引擎
4. **最后回退**: 随机位置

## 构建和部署

### 开发环境

```bash
# 启动开发服务器 (自动构建WASM)
npm start

# 启动Tauri开发环境
npm run tauri:dev
```

### 生产构建

```bash
# 构建Web应用 (包含WASM)
npm run build

# 构建Tauri桌面应用
npm run tauri:build
```

### WASM构建

```bash
# 手动构建WASM模块
npm run build:wasm
# 或
./build-wasm.sh
```

## 性能优势

### 1. 代码复用
- **共享核心**: 一份Rust代码，两处使用
- **维护性**: 算法更新只需修改一处
- **一致性**: 桌面和Web应用行为完全一致

### 2. 性能优化
- **Rust性能**: 接近C++的执行效率
- **WASM优化**: 浏览器中的原生性能
- **内存安全**: 无内存泄漏和越界访问

### 3. 开发效率
- **类型安全**: 编译时错误检查
- **智能提示**: 完整的IDE支持
- **调试友好**: 清晰的错误信息

## 技术栈

### 后端
- **Rust**: 系统编程语言，高性能
- **Tauri**: 轻量级桌面应用框架
- **WASM**: WebAssembly，浏览器中的原生性能

### 前端
- **React**: 用户界面框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架

### 构建工具
- **Cargo**: Rust包管理器
- **wasm-pack**: WASM构建工具
- **Create React App**: React应用脚手架

## 使用示例

### 桌面应用 (Tauri)

```typescript
import { TauriAIEngine } from './utils/tauriAI';

// 获取AI移动
const move = await TauriAIEngine.getBestMove(board, aiPlayer, humanPlayer);
```

### Web应用 (WASM)

```typescript
import { wasmAIEngine } from './utils/wasmAI';

// 等待WASM初始化
await wasmAIEngine.waitForInit();

// 获取AI移动
const move = await wasmAIEngine.getBestMove(board, aiPlayer, humanPlayer);
```

### 统一接口

```typescript
import { AIDecisionEngine } from './utils/aiDecision';

// 自动选择最佳AI引擎
const aiEngine = new AIDecisionEngine(board, aiPlayer, humanPlayer);
const move = await aiEngine.getBestMove();
```

## 总结

这种混合架构设计实现了：

1. **极致性能**: Rust + WASM提供接近原生的执行效率
2. **代码复用**: 一份核心代码，多平台使用
3. **开发效率**: 类型安全，智能提示，清晰架构
4. **维护性**: 集中管理，统一更新
5. **扩展性**: 易于添加新平台支持

这是现代Web应用开发的理想架构，既保证了性能，又实现了代码的最大化复用。
