#!/bin/bash

echo "🔍 Minority Game 诊断脚本"
echo "========================"
echo ""

# 检查是否有 hardhat 进程在运行
echo "1️⃣ 检查 Hardhat Node 进程..."
HARDHAT_PROCESSES=$(ps aux | grep -E "hardhat.*node" | grep -v grep)
if [ -n "$HARDHAT_PROCESSES" ]; then
    echo "⚠️  发现正在运行的 Hardhat Node 进程:"
    echo "$HARDHAT_PROCESSES"
    echo ""
    read -p "是否要杀掉这些进程? (y/n): " answer
    if [ "$answer" = "y" ]; then
        killall -9 node
        echo "✅ 已杀掉所有 Node 进程"
    fi
else
    echo "✅ 没有发现 Hardhat Node 进程"
fi

echo ""

# 检查 8545 端口
echo "2️⃣ 检查 8545 端口占用..."
PORT_8545=$(lsof -i :8545 2>/dev/null)
if [ -n "$PORT_8545" ]; then
    echo "⚠️  8545 端口被占用:"
    echo "$PORT_8545"
else
    echo "✅ 8545 端口空闲"
fi

echo ""

# 检查合约地址
echo "3️⃣ 检查前端配置的合约地址..."
if [ -f "frontend/voting-improved.js" ]; then
    CONTRACT_ADDR=$(grep -o 'CONTRACT_ADDRESS = "[^"]*"' frontend/voting-improved.js)
    echo "前端配置: $CONTRACT_ADDR"
else
    echo "⚠️  找不到 frontend/voting-improved.js"
fi

echo ""

# 检查部署信息
echo "4️⃣ 检查最近部署信息..."
if [ -f "deployment-info.json" ]; then
    echo "deployment-info.json 内容:"
    cat deployment-info.json
else
    echo "⚠️  找不到 deployment-info.json"
fi

echo ""
echo "========================"
echo "✅ 诊断完成"
echo ""
echo "📝 下一步建议:"
echo "1. 确保所有旧进程已停止"
echo "2. 运行: npx hardhat node"
echo "3. 在新终端运行: npx hardhat run scripts/deploy-alt-address.js --network localhost"
echo "4. 在浏览器中按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows) 硬刷新"
echo "5. 在浏览器Console执行: await contract.voteCounter()"
echo "   应该返回: 0n (表示没有投票)"
