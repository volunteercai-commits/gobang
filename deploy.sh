#!/bin/bash

# 五子棋游戏一键发布脚本
# 支持Web应用和桌面应用部署
# 用法: ./deploy.sh [web|desktop]

# 默认部署类型
DEPLOY_TYPE="web"

# 解析命令行参数
if [ $# -gt 0 ]; then
    case $1 in
        "web"|"desktop")
            DEPLOY_TYPE=$1
            ;;
        "-h"|"--help")
            echo "五子棋游戏部署脚本"
            echo ""
            echo "用法: $0 [web|desktop]"
            echo ""
            echo "参数:"
            echo "  web     部署Web应用 (默认)"
            echo "  desktop 构建桌面应用"
            echo "  -h      显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0        # 部署Web应用"
            echo "  $0 web    # 部署Web应用"
            echo "  $0 desktop # 构建桌面应用"
            exit 0
            ;;
        *)
            echo "❌ 错误: 未知参数 '$1'"
            echo "使用 '$0 -h' 查看帮助信息"
            exit 1
            ;;
    esac
fi

echo "🚀 五子棋游戏部署脚本启动..."
echo "📦 部署类型: $DEPLOY_TYPE"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本！"
    exit 1
fi

# 检查必要的工具
if [ "$DEPLOY_TYPE" = "web" ]; then
    if ! command -v scp &> /dev/null; then
        echo "❌ 错误: 未找到 scp 命令，请安装 OpenSSH"
        exit 1
    fi
    if ! command -v ssh &> /dev/null; then
        echo "❌ 错误: 未找到 ssh 命令，请安装 OpenSSH"
        exit 1
    fi
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
if [ "$DEPLOY_TYPE" = "web" ]; then
    rm -rf build/
else
    rm -rf src-tauri/target/release/
fi

# 构建项目
echo "🔨 构建项目..."
if [ "$DEPLOY_TYPE" = "web" ]; then
    echo "  📱 构建Web应用..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Web应用构建失败！"
        exit 1
    fi
    
    echo "✅ Web应用构建成功！"
    
    # 检查构建产物
    if [ ! -f "build/index.html" ]; then
        echo "❌ 错误: 未找到 build/index.html"
        exit 1
    fi
    
    # 上传到服务器
    echo "📤 上传Web应用到服务器..."
    scp -r build/* caixy.icu:/var/www/html/
    
    if [ $? -eq 0 ]; then
        echo "✅ Web应用上传成功！"
    else
        echo "❌ Web应用上传失败！"
        exit 1
    fi
    
    # 验证部署
    echo "🔍 验证Web应用部署..."
    ssh caixy.icu "ls -la /var/www/html/index.html"
    
    if [ $? -eq 0 ]; then
        echo "✅ Web应用部署验证成功！"
    else
        echo "❌ Web应用部署验证失败！"
        exit 1
    fi
    
    echo ""
    echo "🎉 Web应用部署完成！"
    echo "🌐 访问地址: http://8.219.153.61/"
    echo "🎮 开始游戏吧！"
    
else
    echo "  🖥️  构建桌面应用..."
    npm run tauri:build
    
    if [ $? -ne 0 ]; then
        echo "❌ 桌面应用构建失败！"
        exit 1
    fi
    
    echo "✅ 桌面应用构建成功！"
    
    # 检查构建产物
    if [ ! -d "target/release/bundle/macos" ] && [ ! -d "target/release/bundle/dmg" ]; then
        echo "❌ 错误: 未找到桌面应用构建产物"
        echo "请检查 target/release/bundle/ 目录"
        exit 1
    fi
    
    echo ""
    echo "🎉 桌面应用构建完成！"
    echo "📁 应用位置: target/release/bundle/"
    echo "🖥️  可以运行应用了！"
    
    # 显示构建产物信息
    echo ""
    echo "📦 构建产物:"
    ls -la target/release/bundle/
fi

echo ""
echo "✨ 部署脚本执行完成！"