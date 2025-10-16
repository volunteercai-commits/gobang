# 移动端调试功能说明

## 🎯 功能概述

部署脚本已成功添加了Android和iOS的自动调试功能，构建完成后会自动尝试安装和启动应用。

## 📱 调试逻辑

### Android调试流程
1. **检查连接的设备** - 优先使用真实设备
2. **设备连接** - 如果发现设备，直接安装APK
3. **模拟器启动** - 如果没有设备，尝试启动Android模拟器
4. **自动安装** - 安装APK到设备/模拟器
5. **自动启动** - 启动应用

### iOS调试流程
1. **检查连接的设备** - 优先使用真实设备
2. **设备连接** - 如果发现设备，提供Xcode项目路径
3. **模拟器启动** - 如果没有设备，尝试启动iOS模拟器
4. **项目指导** - 提供Xcode项目打开指导

## 🚀 使用方法

### 基本命令
```bash
# 构建并调试Android应用
./deploy.sh android

# 构建并调试iOS应用 (仅macOS)
./deploy.sh ios

# 构建并调试所有移动端应用
./deploy.sh mobile
```

### 调试功能特性
- ✅ **智能设备检测** - 自动检测连接的设备
- ✅ **模拟器管理** - 自动启动模拟器
- ✅ **应用安装** - 自动安装APK到Android设备
- ✅ **应用启动** - 自动启动应用
- ✅ **错误处理** - 详细的错误信息和解决建议

## 🔧 环境要求

### Android调试
- Android SDK Platform Tools (adb命令)
- Android模拟器 (可选)
- 连接的Android设备 (推荐)

### iOS调试
- Xcode (必需)
- iOS模拟器 (可选)
- 连接的iOS设备 (推荐)
- ios-deploy (可选，用于设备安装)

## 📋 当前状态

### ✅ 已完成功能
- [x] Android设备检测和连接
- [x] Android模拟器启动
- [x] APK自动安装和启动
- [x] iOS设备检测
- [x] iOS模拟器启动
- [x] 错误处理和用户指导

### ⚠️ 需要配置
- [ ] Android SDK环境变量 (ANDROID_HOME)
- [ ] iOS开发者证书 (用于真机调试)

### 🔄 工作流程
1. **构建应用** - 使用Tauri构建移动端应用
2. **自动检测** - 检测连接的设备或模拟器
3. **智能安装** - 根据检测结果选择安装方式
4. **自动启动** - 安装完成后自动启动应用

## 🐛 故障排除

### Android调试问题
```bash
# 检查adb连接
adb devices

# 检查模拟器
emulator -list-avds

# 手动安装APK
adb install -r path/to/app.apk
```

### iOS调试问题
```bash
# 检查iOS设备
xcrun xctrace list devices

# 检查模拟器
xcrun simctl list devices

# 打开Xcode项目
open src-tauri/gen/ios/Xcode/gobang.xcodeproj
```

## 📚 技术实现

### 调试函数
- `debug_android()` - Android调试逻辑
- `debug_ios()` - iOS调试逻辑

### 关键特性
- 设备优先级：真实设备 > 模拟器
- 自动重试机制
- 详细的日志输出
- 用户友好的错误提示

## 🎉 使用示例

```bash
# 构建并调试Android应用
$ ./deploy.sh android
🚀 五子棋游戏部署脚本启动...
📦 部署类型: android
🔨 构建项目...
  🤖 构建Android应用...
✅ Android应用构建成功！
🎉 Android应用构建完成！
🔍 开始自动调试...
🔍 开始Android调试...
📱 检查连接的Android设备...
✅ 发现 1 个连接的Android设备
📱 使用设备: emulator-5554
📦 安装APK: src-tauri/target/android/app-release.apk
✅ APK安装成功！
🚀 启动应用: com.volunteercai.gobang
✅ 应用已启动！
```

## 📝 注意事项

1. **Android环境** - 需要设置ANDROID_HOME环境变量
2. **iOS环境** - 需要Xcode和开发者证书
3. **设备连接** - 确保设备已启用开发者模式
4. **模拟器** - 首次使用需要创建AVD/iOS模拟器

---

**总结**: 移动端调试功能已完全集成到部署脚本中，支持Android和iOS的自动构建、安装和启动，大大简化了移动端开发流程。
