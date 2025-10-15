#!/bin/bash

# 测试构建结果的脚本
echo "🧪 测试五子棋React游戏构建结果..."

# 检查构建目录
if [ ! -d "build" ]; then
    echo "❌ 错误: build 目录不存在！请先运行 npm run build"
    exit 1
fi

# 检查关键文件
echo "📋 检查关键文件..."
files=("index.html" "static/js" "static/css")
for file in "${files[@]}"; do
    if [ -e "build/$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查文件大小
echo "📊 文件大小统计:"
du -sh build/
du -sh build/static/

# 检查HTML文件内容
echo "🔍 检查index.html内容..."
if grep -q "五子棋" build/index.html; then
    echo "✅ HTML标题正确"
else
    echo "❌ HTML标题可能有问题"
fi

if grep -q "root" build/index.html; then
    echo "✅ React根元素存在"
else
    echo "❌ React根元素可能有问题"
fi

# 检查静态资源
echo "📦 检查静态资源..."
js_files=$(find build/static -name "*.js" | wc -l)
css_files=$(find build/static -name "*.css" | wc -l)

echo "📄 JS文件数量: $js_files"
echo "🎨 CSS文件数量: $css_files"

if [ $js_files -gt 0 ] && [ $css_files -gt 0 ]; then
    echo "✅ 静态资源完整"
else
    echo "❌ 静态资源可能不完整"
fi

# 尝试启动本地服务器测试
echo "🚀 启动本地测试服务器..."
if command -v python3 &> /dev/null; then
    echo "使用Python3启动服务器..."
    cd build && python3 -m http.server 8080 &
    server_pid=$!
    sleep 2
    
    # 测试访问
    if curl -s http://localhost:8080 > /dev/null; then
        echo "✅ 本地服务器测试成功！"
        echo "🌐 测试地址: http://localhost:8080"
        echo "⏹️  按 Ctrl+C 停止测试服务器"
        
        # 等待用户停止
        trap "kill $server_pid; exit" INT
        wait $server_pid
    else
        echo "❌ 本地服务器测试失败"
        kill $server_pid 2>/dev/null
    fi
elif command -v python &> /dev/null; then
    echo "使用Python2启动服务器..."
    cd build && python -m SimpleHTTPServer 8080 &
    server_pid=$!
    sleep 2
    
    if curl -s http://localhost:8080 > /dev/null; then
        echo "✅ 本地服务器测试成功！"
        echo "🌐 测试地址: http://localhost:8080"
        echo "⏹️  按 Ctrl+C 停止测试服务器"
        
        trap "kill $server_pid; exit" INT
        wait $server_pid
    else
        echo "❌ 本地服务器测试失败"
        kill $server_pid 2>/dev/null
    fi
else
    echo "⚠️  未找到Python，跳过本地服务器测试"
    echo "💡 建议安装Python或使用其他静态文件服务器"
fi

echo ""
echo "🎉 构建测试完成！"
echo "📋 下一步:"
echo "1. 运行 ./deploy.sh 进行完整部署"
echo "2. 或运行 ./deploy-simple.sh 生成部署包"
