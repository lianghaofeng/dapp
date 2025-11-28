#!/bin/bash

# 🚀 一键启动本地开发环境
# 使用方法: ./start-local.sh

echo "🎮 Minority Wins 投票游戏 - 本地启动脚本"
echo "========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "hardhat.config.cjs" ]; then
    echo "❌ 错误: 请在 minority-game 目录下运行此脚本"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 未找到依赖，开始安装..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "✅ 依赖检查完成"
echo ""

# 编译合约
echo "🔨 编译合约..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "❌ 合约编译失败"
    exit 1
fi
echo "✅ 合约编译成功"
echo ""

# 检查是否有Hardhat节点在运行
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口8545已被占用（可能Hardhat节点已在运行）"
    echo "如需重启，请先执行: lsof -ti:8545 | xargs kill"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    # 启动Hardhat节点（后台）
    echo "🌐 启动Hardhat本地节点..."
    npx hardhat node > hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    echo "✅ Hardhat节点已启动 (PID: $HARDHAT_PID)"
    echo "   日志文件: hardhat-node.log"

    # 等待节点启动
    echo "⏳ 等待节点就绪..."
    sleep 5
fi

echo ""

# 部署合约
echo "📜 部署合约到本地网络..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ 合约部署失败"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

# 提取合约地址
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ 无法获取合约地址"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "✅ 合约部署成功"
echo "   地址: $CONTRACT_ADDRESS"
echo ""

# 更新前端配置
echo "⚙️  配置前端..."
sed -i.bak "s/const CONTRACT_ADDRESS = .*/const CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\";/" frontend/voting.js
if [ $? -eq 0 ]; then
    echo "✅ 前端配置已更新"
    rm -f frontend/voting.js.bak
else
    echo "⚠️  自动配置失败，请手动编辑 frontend/voting.js"
    echo "   将 CONTRACT_ADDRESS 设置为: $CONTRACT_ADDRESS"
fi
echo ""

# 检查HTTP服务器端口
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口8000已被占用"
    echo "请手动启动HTTP服务器在其他端口，或先执行: lsof -ti:8000 | xargs kill"
else
    # 启动HTTP服务器
    echo "🌐 启动前端服务器..."
    cd frontend

    # 尝试使用Python
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8000 > ../frontend-server.log 2>&1 &
        HTTP_PID=$!
        echo "✅ 前端服务器已启动 (PID: $HTTP_PID)"
        echo "   使用: Python HTTP Server"
    elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer 8000 > ../frontend-server.log 2>&1 &
        HTTP_PID=$!
        echo "✅ 前端服务器已启动 (PID: $HTTP_PID)"
        echo "   使用: Python HTTP Server"
    else
        echo "⚠️  未找到Python，请手动启动HTTP服务器："
        echo "   cd frontend && npx http-server -p 8000"
    fi

    cd ..
fi

echo ""
echo "========================================="
echo "🎉 启动完成！"
echo "========================================="
echo ""
echo "📋 重要信息:"
echo "   合约地址: $CONTRACT_ADDRESS"
echo "   本地RPC: http://127.0.0.1:8545"
echo "   前端地址: http://localhost:8000/voting.html"
echo ""
echo "📱 配置MetaMask:"
echo "   1. 添加网络: Hardhat Local"
echo "   2. RPC URL: http://127.0.0.1:8545"
echo "   3. 链ID: 31337"
echo "   4. 货币符号: ETH"
echo ""
echo "🔑 测试账户私钥（可以导入MetaMask）:"
echo "   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "📊 日志文件:"
echo "   Hardhat节点: hardhat-node.log"
echo "   前端服务器: frontend-server.log"
echo ""
echo "🛑 停止所有服务:"
echo "   ./stop-local.sh"
echo ""
echo "🌐 现在可以打开浏览器访问:"
echo "   👉 http://localhost:8000/voting.html"
echo ""
