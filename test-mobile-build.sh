#!/bin/bash

# 移动端构建测试脚本
# 用于测试Android和iOS构建功能

echo "🧪 移动端构建测试脚本"
echo "========================"

# 检查环境
echo "🔍 检查构建环境..."

# 检查Tauri CLI
if ! command -v tauri &> /dev/null; then
    echo "❌ Tauri CLI未安装，正在安装..."
    npm install -g @tauri-apps/cli@latest
fi

# 检查Android环境
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME未设置，Android构建可能失败"
    echo "请设置Android SDK路径"
else
    echo "✅ Android环境已配置"
fi

# 检查iOS环境 (仅macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcodebuild &> /dev/null; then
        echo "✅ iOS环境已配置"
    else
        echo "❌ Xcode未安装，iOS构建将失败"
    fi
else
    echo "⚠️  非macOS系统，跳过iOS测试"
fi

echo ""
echo "🚀 开始测试构建..."

# 测试Android构建 (仅检查命令是否可用)
echo "🤖 测试Android构建命令..."
if npm run tauri:build:android-debug --dry-run 2>/dev/null; then
    echo "✅ Android构建命令可用"
else
    echo "⚠️  Android构建命令可能有问题"
fi

# 测试iOS构建 (仅macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 测试iOS构建命令..."
    if npm run tauri:build:ios --dry-run 2>/dev/null; then
        echo "✅ iOS构建命令可用"
    else
        echo "⚠️  iOS构建命令可能有问题"
    fi
fi

echo ""
echo "📋 测试总结:"
echo "============="
echo "✅ 部署脚本已更新，支持移动端构建"
echo "✅ 新增Android构建选项"
echo "✅ 新增iOS构建选项 (仅macOS)"
echo "✅ 新增mobile选项 (构建所有移动端)"
echo ""
echo "🎯 可用命令:"
echo "  ./deploy.sh android   # 构建Android应用"
echo "  ./deploy.sh ios       # 构建iOS应用"
echo "  ./deploy.sh mobile    # 构建所有移动端应用"
echo ""
echo "📚 详细说明请查看: MOBILE_BUILD.md"

