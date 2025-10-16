# AI架构设计说明

## 🎯 核心原则

**严格按照环境选择AI引擎，确保代码复用和性能优化：**

- **🖥️ 桌面应用（Tauri）**：使用Tauri调用Rust AI引擎
- **🌐 Web应用（WASM）**：使用WASM调用Rust AI引擎
- **🔧 备用方案**：JavaScript AI引擎（兼容性保证）

## 🏗️ 架构实现

### 1. 环境检测

```typescript
// 检测是否在Tauri环境中
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
}
```

### 2. AI决策引擎逻辑

```typescript
// 严格按环境选择AI引擎
if (isTauriEnvironment()) {
  // 桌面应用：使用Tauri调用Rust AI引擎
  const tauriMove = await TauriAIEngine.getBestMove(board, aiPlayer, humanPlayer);
  return tauriMove || getJavaScriptAIMove();
} else {
  // Web应用：使用WASM调用Rust AI引擎
  const wasmMove = await wasmAIEngine.getBestMove(board, aiPlayer, humanPlayer);
  return wasmMove || getJavaScriptAIMove();
}
```

### 3. 共享核心代码

**位置**: `shared_core/src/lib.rs`

- 包含所有AI算法逻辑
- 平台无关的Rust代码
- 同时被Tauri和WASM使用

## 📁 文件结构

```
src/utils/
├── aiDecision.ts      # AI决策引擎（环境检测 + 引擎选择）
├── tauriAI.ts         # Tauri AI适配器（桌面应用）
├── wasmAI.ts          # WASM AI适配器（Web应用）
└── aiEngine.ts        # JavaScript AI备用方案

src/wasm/              # WASM文件（Web应用使用）
├── wasm_lib.js
├── wasm_lib_bg.wasm
└── wasm_lib.d.ts

shared_core/           # 共享核心（Rust）
└── src/lib.rs         # 核心AI算法

src-tauri/             # Tauri适配层
└── src/main.rs        # 桌面应用接口
```

## 🔄 工作流程

### 桌面应用流程
1. **环境检测**: `isTauriEnvironment()` 返回 `true`
2. **AI调用**: `TauriAIEngine.getBestMove()` 
3. **Rust执行**: 通过Tauri IPC调用共享核心Rust代码
4. **结果返回**: 直接返回Rust AI结果
5. **失败回退**: 如果失败，使用JavaScript AI

### Web应用流程
1. **环境检测**: `isTauriEnvironment()` 返回 `false`
2. **WASM初始化**: 等待WASM模块加载完成
3. **AI调用**: `wasmAIEngine.getBestMove()`
4. **Rust执行**: 通过WASM调用共享核心Rust代码
5. **结果返回**: 直接返回Rust AI结果
6. **失败回退**: 如果失败，使用JavaScript AI

## ✅ 验证结果

所有测试通过：

- ✅ Tauri环境检测正确
- ✅ WASM AI引擎配置正确
- ✅ WASM文件完整存在
- ✅ AI决策引擎环境分离正确
- ✅ Rust代码编译通过
- ✅ TypeScript代码编译通过

## 🚀 使用方法

### 开发环境
```bash
# 启动Web应用（自动使用WASM Rust AI）
npm start

# 启动桌面应用（自动使用Tauri Rust AI）
npm run tauri:dev
```

### 生产构建
```bash
# 构建Web应用（包含WASM）
npm run build

# 构建桌面应用
npm run tauri:build
```

## 🎉 优势总结

1. **代码复用**: 一份Rust代码，两处使用
2. **性能优化**: 桌面应用原生性能，Web应用接近原生性能
3. **环境适配**: 严格按环境选择最佳AI引擎
4. **兼容性**: JavaScript AI作为备用方案
5. **维护性**: 集中管理，统一更新

这个架构完美实现了你的需求：**原生应用用Tauri调用Rust，Web应用用WASM调用Rust，同时保证兼容性**！
