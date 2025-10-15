#!/bin/bash

# 五子棋React游戏简化部署脚本
# 作者: AI Assistant
# 用途: 将React五子棋游戏构建并部署到服务器（简化版）

echo "🎯 开始部署五子棋React游戏（简化版）..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本！"
    exit 1
fi

# 构建React项目
echo "🔨 开始构建React项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功！"
else
    echo "❌ 项目构建失败！"
    exit 1
fi

# 检查构建文件
if [ ! -d "build" ]; then
    echo "❌ 错误: build 目录不存在！"
    exit 1
fi

echo "📁 构建文件检查完成"
echo "📊 构建文件大小:"
du -sh build/

# 创建部署包
echo "📦 创建部署包..."
tar -czf gobang-react-build.tar.gz -C build .

if [ $? -eq 0 ]; then
    echo "✅ 部署包创建成功！"
    echo "📁 部署包: gobang-react-build.tar.gz"
    echo "📊 部署包大小: $(du -sh gobang-react-build.tar.gz | cut -f1)"
else
    echo "❌ 部署包创建失败！"
    exit 1
fi

echo ""
echo "🎉 构建完成！"
echo "📋 下一步操作:"
echo "1. 将 gobang-react-build.tar.gz 上传到服务器"
echo "2. 在服务器上解压: tar -xzf gobang-react-build.tar.gz -C /var/www/html/gobang-react/"
echo "3. 配置nginx指向 /var/www/html/gobang-react/"
echo ""
echo "🌐 或者直接使用完整部署脚本: ./deploy.sh"
