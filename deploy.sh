#!/bin/bash

# 五子棋React游戏部署脚本
# 作者: AI Assistant
# 用途: 将React五子棋游戏构建并部署到服务器

echo "🎯 开始部署五子棋React游戏..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本！"
    exit 1
fi

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装！"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装！"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖（如果需要）
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📥 安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败！"
        exit 1
    fi
else
    echo "✅ 依赖已存在"
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf build/

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

# 检查关键文件
if [ ! -f "build/index.html" ]; then
    echo "❌ 错误: build/index.html 文件不存在！"
    exit 1
fi

echo "📁 构建文件检查完成"
echo "📊 构建文件大小:"
du -sh build/
echo "📋 构建文件列表:"
ls -la build/

# 创建部署目录（如果不存在）
echo "📁 准备服务器部署目录..."
ssh caixy.icu "mkdir -p /var/www/html/gobang-react"

# 上传构建文件到服务器
echo "📤 正在上传构建文件到服务器..."
scp -r build/* caixy.icu:/var/www/html/gobang-react/

if [ $? -eq 0 ]; then
    echo "✅ 文件上传成功！"
else
    echo "❌ 文件上传失败！"
    exit 1
fi

# 验证服务器上的文件
echo "🔍 验证服务器文件..."
ssh caixy.icu "ls -la /var/www/html/gobang-react/ && echo '---' && wc -l /var/www/html/gobang-react/index.html"

if [ $? -eq 0 ]; then
    echo "✅ 服务器文件验证成功！"
else
    echo "❌ 服务器文件验证失败！"
    exit 1
fi

# 配置nginx（如果需要）
echo "🔧 配置nginx..."
ssh caixy.icu "cat > /etc/nginx/sites-available/gobang-react << 'EOF'
server {
    listen 80;
    server_name caixy.icu www.caixy.icu;
    
    root /var/www/html/gobang-react;
    index index.html;
    
    # 处理React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
    
    # 安全头
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}
EOF"

# 启用站点
ssh caixy.icu "ln -sf /etc/nginx/sites-available/gobang-react /etc/nginx/sites-enabled/"

# 测试nginx配置
ssh caixy.icu "nginx -t"
if [ $? -eq 0 ]; then
    echo "✅ nginx配置正确"
    # 重载nginx
    ssh caixy.icu "systemctl reload nginx"
    echo "✅ nginx已重载"
else
    echo "❌ nginx配置有误！"
    exit 1
fi

# 获取服务器IP
echo "🌐 获取服务器IP地址..."
server_ip=$(ssh caixy.icu "curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print \$1}'")

if [ ! -z "$server_ip" ]; then
    echo "✅ 服务器IP: $server_ip"
    echo "🎮 游戏访问地址: http://$server_ip/gobang-react"
    echo "🎮 域名访问地址: http://caixy.icu/gobang-react"
else
    echo "⚠️  无法获取服务器IP，请手动检查"
fi

# 检查nginx状态
echo "🔧 检查nginx状态..."
ssh caixy.icu "systemctl status nginx --no-pager -l"

echo ""
echo "🎉 部署完成！"
echo "📱 移动端已优化，支持响应式设计"
echo "🌐 访问地址:"
echo "   - http://$server_ip/gobang-react"
echo "   - http://caixy.icu/gobang-react"
echo "📋 功能特性:"
echo "   - 人机对战 & 人人对战"
echo "   - AI智能算法（活三、双三、四三、双四威胁检测）"
echo "   - 悔棋功能（每人每局一次）"
echo "   - 计分系统"
echo "   - 移动端自适应"
echo "   - 标准15×15棋盘"
echo "   - Canvas绘制，视觉效果佳"
echo "   - 现代化UI设计"
echo ""
echo "🔧 技术栈:"
echo "   - React 18 + TypeScript"
echo "   - Canvas API"
echo "   - 智能AI算法"
echo "   - 响应式CSS"
