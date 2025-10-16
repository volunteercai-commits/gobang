# 五子棋游戏部署指南

本指南涵盖了五子棋游戏的所有部署方式，包括Web应用、桌面应用和移动端应用。

## 🚀 快速开始

### 使用部署脚本
```bash
# 查看所有可用选项
./deploy.sh -h

# 部署Web应用 (默认)
./deploy.sh

# 构建桌面应用
./deploy.sh desktop

# 构建Android应用
./deploy.sh android

# 构建iOS应用 (仅macOS)
./deploy.sh ios

# 构建所有移动端应用
./deploy.sh mobile
```

## 📱 移动端构建

### 环境要求

#### Android构建
- Node.js 16+
- Rust 1.70+
- Android Studio
- Android SDK
- Java Development Kit (JDK) 11+

#### iOS构建 (仅macOS)
- macOS系统
- Xcode 14+
- iOS开发证书
- 开发者账号

### 快速设置
```bash
# 自动设置移动端环境
./setup-mobile.sh

# 或手动初始化Android项目
npm run mobile:setup
```

### 移动端构建命令

#### 开发模式
```bash
# Android开发模式
npm run tauri:android:dev

# iOS开发模式 (仅macOS)
npm run tauri:ios:dev
```

#### 生产构建
```bash
# 构建Android应用
npm run tauri:build:android-release

# 构建iOS应用 (仅macOS)
npm run tauri:build:ios

# 构建所有移动端应用
npm run mobile:build:all
```

### 构建输出位置

- **Android**: `src-tauri/target/android/`
- **iOS**: `src-tauri/target/aarch64-apple-ios/release/`

## 🌐 Web应用部署

### 自动部署
```bash
# 使用部署脚本自动部署到服务器
./deploy.sh web
```

### 手动部署
```bash
# 构建Web应用
npm run build

# 上传到服务器 (需要配置SSH)
scp -r build/* your-server:/var/www/html/
```

## 🖥️ 桌面应用构建

### 构建命令
```bash
# 构建桌面应用
./deploy.sh desktop

# 或直接使用npm命令
npm run tauri:build
```

### 构建输出
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/deb/` 或 `appimage/`

## 🔧 环境配置

### 必需工具安装

#### 基础工具
```bash
# 安装Node.js依赖
npm install

# 安装Tauri CLI (全局)
npm install -g @tauri-apps/cli@latest

# 或使用npx (推荐)
npx @tauri-apps/cli --version
```

#### Android环境
```bash
# 安装Android Studio
# 设置ANDROID_HOME环境变量
export ANDROID_HOME=/path/to/android/sdk

# 添加到~/.bashrc或~/.zshrc
echo 'export ANDROID_HOME=/path/to/android/sdk' >> ~/.bashrc
```

#### iOS环境 (仅macOS)
```bash
# 从App Store安装Xcode
# 配置开发者账号
# 设置代码签名
```

## 📦 发布到应用商店

### Android - Google Play Store

1. **准备发布文件**
   ```bash
   # 构建发布版APK/AAB
   ./deploy.sh android
   ```

2. **签名配置**
   - 在Android Studio中配置签名
   - 或使用命令行工具签名

3. **上传到Google Play Console**
   - 创建应用
   - 上传APK/AAB文件
   - 填写应用信息
   - 发布

### iOS - App Store

1. **准备发布文件**
   ```bash
   # 构建iOS应用
   ./deploy.sh ios
   ```

2. **在Xcode中配置**
   - 打开生成的iOS项目
   - 配置签名和证书
   - 设置Bundle Identifier

3. **上传到App Store Connect**
   - 使用Xcode的Archive功能
   - 或使用Application Loader
   - 在App Store Connect中发布

## 🐛 故障排除

### 常见问题

#### Android构建失败
```bash
# 检查Android SDK
echo $ANDROID_HOME

# 检查Java版本
java -version

# 清理构建缓存
npm run clean:wasm
rm -rf src-tauri/target/android
```

#### iOS构建失败
```bash
# 检查Xcode版本
xcodebuild -version

# 检查开发者证书
security find-identity -v -p codesigning

# 清理构建缓存
rm -rf src-tauri/target/aarch64-apple-ios
```

#### WASM构建问题
```bash
# 更新Rust工具链
rustup update

# 更新wasm-pack
cargo install wasm-pack

# 清理WASM缓存
npm run clean:wasm
```

### 调试技巧

```bash
# 启用详细日志
npm run tauri:build:android-debug -- --verbose

# 检查构建产物
ls -la src-tauri/target/android/
ls -la src-tauri/target/aarch64-apple-ios/release/

# 查看构建日志
tail -f /tmp/tauri-build.log
```

## 📋 构建检查清单

### 发布前检查
- [ ] 所有功能正常工作
- [ ] 移动端UI适配正确
- [ ] 触摸事件响应正常
- [ ] 应用图标和启动画面
- [ ] 版本号更新
- [ ] 构建产物完整
- [ ] 签名配置正确

### 测试清单
- [ ] 桌面端功能测试
- [ ] 移动端功能测试
- [ ] 不同屏幕尺寸适配
- [ ] 横屏/竖屏模式
- [ ] 性能测试
- [ ] 内存使用测试

## 📚 相关文档

- [移动端构建详细指南](./MOBILE_BUILD.md)
- [项目README](./README.md)
- [Tauri官方文档](https://tauri.app/)
- [React官方文档](https://reactjs.org/)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查相关日志文件
3. 查看GitHub Issues
4. 联系开发团队

---

**注意**: 移动端构建需要相应的开发环境和证书。请确保在开始构建前完成所有环境配置。

