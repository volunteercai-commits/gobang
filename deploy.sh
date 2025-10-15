#!/bin/bash

# 五子棋游戏一键发布脚本
echo "🚀 发布五子棋游戏..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本！"
    exit 1
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功！"

# 上传到服务器根目录
echo "📤 上传到服务器..."
scp -r build/* caixy.icu:/var/www/html/

if [ $? -eq 0 ]; then
    echo "✅ 上传成功！"
else
    echo "❌ 上传失败！"
    exit 1
fi

# 验证部署
echo "🔍 验证部署..."
ssh caixy.icu "ls -la /var/www/html/index.html"

echo ""
echo "🎉 发布完成！"
echo "🌐 访问地址: http://8.219.153.61/"
echo "🎮 开始游戏吧！"