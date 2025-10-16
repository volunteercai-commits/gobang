#!/bin/bash

# 五子棋移动端开发环境设置脚本

echo "🎮 五子棋移动端开发环境设置"
echo "================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

# 检查Rust
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust未安装，请先安装Rust"
    echo "安装命令: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# 检查Tauri CLI
if ! command -v tauri &> /dev/null; then
    echo "📦 安装Tauri CLI..."
    npm install -g @tauri-apps/cli@latest
fi

echo "✅ 基础环境检查完成"

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install

# 构建WASM
echo "🔨 构建WASM模块..."
npm run build:wasm

# 检查平台
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到macOS系统，支持iOS和Android构建"
    
    # 检查Xcode
    if ! command -v xcodebuild &> /dev/null; then
        echo "⚠️  Xcode未安装，iOS构建将不可用"
        echo "请从App Store安装Xcode"
    else
        echo "✅ Xcode已安装"
    fi
    
    # 初始化Android项目
    echo "🤖 初始化Android项目..."
    npm run mobile:setup
    
    echo ""
    echo "🎉 移动端开发环境设置完成！"
    echo ""
    echo "可用命令："
    echo "  npm run tauri:android:dev    - Android开发模式"
    echo "  npm run tauri:ios:dev        - iOS开发模式"
    echo "  npm run tauri:build:android  - 构建Android应用"
    echo "  npm run tauri:build:ios      - 构建iOS应用"
    echo "  npm run mobile:build:all     - 构建所有平台"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 检测到Linux系统，支持Android构建"
    
    # 初始化Android项目
    echo "🤖 初始化Android项目..."
    npm run mobile:setup
    
    echo ""
    echo "🎉 Android开发环境设置完成！"
    echo ""
    echo "可用命令："
    echo "  npm run tauri:android:dev    - Android开发模式"
    echo "  npm run tauri:build:android  - 构建Android应用"
    
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    echo "移动端构建需要macOS（iOS+Android）或Linux（Android）"
    exit 1
fi

echo ""
echo "📚 详细文档请查看: MOBILE_BUILD.md"
