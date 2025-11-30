#!/bin/bash

echo "🚀 完整部署流程 - 解决MetaMask警告"
echo "=========================================="
echo ""

# 检查Hardhat节点
if ! lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ 错误: Hardhat节点未运行"
    echo ""
    echo "请先在另一个终端运行:"
    echo "  cd /home/user/dapp/minority-game"
    echo "  npx hardhat node"
    echo ""
    echo "然后再运行此脚本"
    exit 1
fi

echo "✅ Hardhat节点正在运行"
echo ""

# 编译合约
echo "📝 编译合约..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi
echo "✅ 编译成功"
echo ""

# 使用新账户部署
echo "🚀 使用备用账户部署合约（生成新地址）..."
npx hardhat run scripts/deploy-alt-address.js --network localhost
if [ $? -ne 0 ]; then
    echo "❌ 部署失败"
    exit 1
fi
echo ""

# 显示新地址
NEW_ADDRESS=$(cat deployment-info.json | grep contractAddress | cut -d'"' -f4)
echo "=========================================="
echo "✅ 部署成功！"
echo "=========================================="
echo ""
echo "📍 新合约地址: $NEW_ADDRESS"
echo "⚠️  这不是被封的默认地址，MetaMask不会警告！"
echo ""
echo "下一步:"
echo "1. 浏览器访问: http://localhost:8000/voting.html"
echo "2. 刷新页面"
echo "3. 连接MetaMask"
echo "4. 现在创建投票应该没有警告了！"
echo ""
