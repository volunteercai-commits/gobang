# 移动端构建指南

本项目支持打包成iOS和Android应用，使用Tauri框架实现跨平台开发。

## 环境要求

### 通用要求
- Node.js 16+
- Rust 1.70+
- Tauri CLI 2.0+

### iOS构建要求
- macOS系统
- Xcode 14+
- iOS开发证书（用于发布到App Store）

### Android构建要求
- Android Studio
- Android SDK
- Java Development Kit (JDK) 11+

## 安装依赖

```bash
# 安装项目依赖
npm install

# 安装Tauri CLI
npm install -g @tauri-apps/cli@latest
```

## 移动端开发环境设置

### Android设置

1. **初始化Android项目**：
```bash
npm run mobile:setup
```

2. **安装Android依赖**：
```bash
# 安装Android SDK和工具
# 请参考官方文档：https://tauri.app/v1/guides/building/android/
```

### iOS设置

iOS构建需要macOS系统和Xcode。确保已安装：
- Xcode 14+
- iOS开发证书
- 开发者账号

## 构建命令

### 开发模式

```bash
# Android开发模式
npm run tauri:android:dev

# iOS开发模式
npm run tauri:ios:dev
```

### 生产构建

```bash
# 构建macOS应用
npm run tauri:build:macos

# 构建macOS ARM版本
npm run tauri:build:macos-arm

# 构建iOS应用
npm run tauri:build:ios

# 构建Android应用（调试版）
npm run tauri:build:android-debug

# 构建Android应用（发布版）
npm run tauri:build:android-release

# 构建所有平台
npm run mobile:build:all
```

## 构建输出

构建完成后，应用文件将位于：

- **macOS**: `src-tauri/target/release/bundle/macos/`
- **iOS**: `src-tauri/target/aarch64-apple-ios/release/`
- **Android**: `src-tauri/target/android/`

## 移动端特性

### 已实现的移动端优化
- 响应式布局适配
- 触摸事件优化
- 动态视口高度计算
- 移动端按钮触摸区域优化
- 方向变化支持

### 移动端UI适配
- 棋盘大小自动调整
- 按钮大小和间距优化
- 字体大小响应式调整
- 触摸反馈效果

## 发布到应用商店

### iOS App Store
1. 在Xcode中打开生成的iOS项目
2. 配置签名和证书
3. 使用Xcode的Archive功能构建
4. 通过App Store Connect上传

### Google Play Store
1. 生成签名的APK或AAB文件
2. 在Google Play Console中创建应用
3. 上传构建文件
4. 填写应用信息和发布

## 故障排除

### 常见问题

1. **Android构建失败**：
   - 检查Android SDK是否正确安装
   - 确认Java版本兼容性
   - 检查环境变量设置

2. **iOS构建失败**：
   - 确认Xcode版本
   - 检查开发者证书
   - 验证Bundle Identifier

3. **WASM构建问题**：
   - 确保Rust工具链最新
   - 检查wasm-pack版本
   - 清理构建缓存：`npm run clean:wasm`

### 调试技巧

```bash
# 清理所有构建缓存
npm run clean:wasm
rm -rf src-tauri/target
rm -rf build

# 重新构建
npm run build:wasm
npm run tauri:build:android-debug
```

## 性能优化

### 移动端优化建议
- 使用release模式构建以获得最佳性能
- 优化WASM文件大小
- 启用代码分割
- 使用适当的图片压缩

### 构建优化
```bash
# 优化WASM构建
wasm-pack build wasm_lib --target web --out-dir pkg --release

# 优化Android构建
npm run tauri:build:android-release
```

## 更新日志

- v3.0.0: 添加移动端支持
- 支持iOS和Android构建
- 移动端UI优化
- 触摸事件优化
