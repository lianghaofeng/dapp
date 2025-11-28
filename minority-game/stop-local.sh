#!/bin/bash

# 🛑 停止本地开发环境
# 使用方法: ./stop-local.sh

echo "🛑 停止 Minority Wins 本地服务..."
echo "========================================="
echo ""

# 停止Hardhat节点 (端口8545)
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🔌 停止Hardhat节点 (端口8545)..."
    lsof -ti:8545 | xargs kill -9 2>/dev/null
    echo "✅ Hardhat节点已停止"
else
    echo "ℹ️  Hardhat节点未运行"
fi

# 停止HTTP服务器 (端口8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🔌 停止前端服务器 (端口8000)..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo "✅ 前端服务器已停止"
else
    echo "ℹ️  前端服务器未运行"
fi

# 清理日志文件
if [ -f "hardhat-node.log" ]; then
    rm hardhat-node.log
    echo "🗑️  已删除 hardhat-node.log"
fi

if [ -f "frontend-server.log" ]; then
    rm frontend-server.log
    echo "🗑️  已删除 frontend-server.log"
fi

echo ""
echo "========================================="
echo "✅ 所有服务已停止"
echo "========================================="
echo ""
