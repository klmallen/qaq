#!/bin/bash

# QAQ游戏引擎文档构建脚本

echo "🚀 开始构建QAQ游戏引擎文档..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 进入文档目录
cd "$(dirname "$0")"

echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "🔨 构建文档..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 文档构建失败"
    exit 1
fi

echo "✅ 文档构建完成！"
echo "📁 构建文件位于: docs/.vitepress/dist"
echo ""
echo "🌐 要预览构建结果，请运行:"
echo "   npm run preview"
echo ""
echo "📚 要启动开发服务器，请运行:"
echo "   npm run dev"
