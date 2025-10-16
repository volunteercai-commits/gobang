#!/bin/bash

# 构建WASM模块脚本
echo "🔨 开始构建WASM模块..."

# 检查是否安装了wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack未安装，正在安装..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# 进入wasm_lib目录
cd wasm_lib

# 构建WASM模块
echo "📦 编译WASM模块..."
wasm-pack build --target web --out-dir pkg

if [ $? -eq 0 ]; then
    echo "✅ WASM模块构建成功！"
    echo "📁 输出目录: wasm_lib/pkg/"
    
    # 复制到src目录供Web应用使用
    echo "📋 复制WASM文件到src目录..."
    mkdir -p ../src/wasm
    cp pkg/* ../src/wasm/
    
    echo "🎉 WASM构建完成！"
    echo "📂 WASM文件位置: src/wasm/"
else
    echo "❌ WASM模块构建失败！"
    exit 1
fi
