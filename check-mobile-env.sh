#!/bin/bash

# 移动端开发环境检查脚本

echo "🔍 移动端开发环境检查"
echo "========================"

# 检查基础环境
echo "📋 基础环境检查:"
echo "----------------"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js: 未安装"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm: 未安装"
fi

# Rust
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✅ Rust: $RUST_VERSION"
else
    echo "❌ Rust: 未安装"
fi

# Tauri CLI
if command -v tauri &> /dev/null || npx tauri --version &> /dev/null; then
    echo "✅ Tauri CLI: 已安装"
else
    echo "❌ Tauri CLI: 未安装"
fi

echo ""
echo "📱 Android环境检查:"
echo "-------------------"

# Android SDK
if [ -n "$ANDROID_HOME" ]; then
    echo "✅ ANDROID_HOME: $ANDROID_HOME"
else
    echo "❌ ANDROID_HOME: 未设置"
    echo "   请设置: export ANDROID_HOME=/path/to/android/sdk"
fi

# Android NDK
if [ -n "$NDK_HOME" ]; then
    echo "✅ NDK_HOME: $NDK_HOME"
else
    echo "⚠️  NDK_HOME: 未设置 (可选)"
fi

# adb
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version | head -1)
    echo "✅ adb: $ADB_VERSION"
else
    echo "❌ adb: 未安装"
    echo "   请安装Android SDK Platform Tools"
fi

# emulator
if command -v emulator &> /dev/null; then
    echo "✅ emulator: 已安装"
else
    echo "❌ emulator: 未安装"
    echo "   请安装Android SDK Tools"
fi

# Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "✅ Java: $JAVA_VERSION"
else
    echo "❌ Java: 未安装"
    echo "   请安装JDK 11+"
fi

echo ""
echo "🍎 iOS环境检查:"
echo "---------------"

# Xcode
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo "✅ Xcode: $XCODE_VERSION"
else
    echo "❌ Xcode: 未安装"
    echo "   请从App Store安装Xcode"
fi

# xcrun
if command -v xcrun &> /dev/null; then
    echo "✅ xcrun: 已安装"
else
    echo "❌ xcrun: 未安装"
fi

# iOS模拟器
if xcrun simctl list devices &> /dev/null; then
    SIMULATOR_COUNT=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | wc -l)
    echo "✅ iOS模拟器: $SIMULATOR_COUNT 个可用"
else
    echo "❌ iOS模拟器: 无法访问"
fi

# ios-deploy (可选)
if command -v ios-deploy &> /dev/null; then
    echo "✅ ios-deploy: 已安装"
else
    echo "⚠️  ios-deploy: 未安装 (可选，用于真机调试)"
    echo "   安装: brew install ios-deploy"
fi

echo ""
echo "🔧 环境修复建议:"
echo "================="

# 检查Android环境
if [ -z "$ANDROID_HOME" ] || ! command -v adb &> /dev/null; then
    echo "📱 Android环境修复:"
    echo "   1. 安装Android Studio"
    echo "   2. 设置环境变量:"
    echo "      export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "      export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo "      export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    echo "   3. 添加到 ~/.zshrc 或 ~/.bashrc"
    echo "   4. 重新运行: npm run mobile:setup"
    echo ""
fi

# 检查iOS环境
if ! command -v xcodebuild &> /dev/null; then
    echo "🍎 iOS环境修复:"
    echo "   1. 从App Store安装Xcode"
    echo "   2. 打开Xcode并接受许可协议"
    echo "   3. 安装iOS模拟器"
    echo ""
fi

echo "🚀 快速设置命令:"
echo "================="
echo "npm run mobile:setup    # 初始化移动端项目"
echo "./deploy.sh android     # 构建Android应用"
echo "./deploy.sh ios         # 构建iOS应用"
echo "./deploy.sh mobile      # 构建所有移动端应用"

echo ""
echo "✨ 环境检查完成！"
