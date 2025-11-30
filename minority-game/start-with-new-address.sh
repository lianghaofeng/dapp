#!/bin/bash

# 解决MetaMask警告 - 使用新地址部署
# 这个脚本会使用不同的账户部署合约，生成新地址，避开MetaMask警告

echo "🦊 解决MetaMask地址警告 - 自动化部署脚本"
echo "================================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "hardhat.config.cjs" ]; then
    echo "❌ 错误: 请在 minority-game 目录下运行此脚本"
    echo "   cd /home/user/dapp/minority-game"
    exit 1
fi

# 步骤1: 编译合约
echo "📝 步骤1: 编译合约..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "❌ 编译失败，请检查合约代码"
    exit 1
fi
echo "✅ 编译成功"
echo ""

# 步骤2: 检查是否有Hardhat节点在运行
echo "🔍 步骤2: 检查Hardhat节点..."
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  检测到端口8545已被占用"
    echo "   如果是Hardhat节点，脚本将继续"
    echo "   如果不是，请先停止占用端口的进程"
    echo ""
else
    echo "⚠️  未检测到Hardhat节点"
    echo "   请在另一个终端运行: npx hardhat node"
    echo ""
    read -p "节点已启动？按Enter继续，或Ctrl+C退出..."
fi

# 步骤3: 使用新账户部署合约
echo "🚀 步骤3: 使用备用账户部署合约（生成新地址）..."
npx hardhat run scripts/deploy-alt-address.js --network localhost
if [ $? -ne 0 ]; then
    echo "❌ 部署失败"
    echo "   请确保Hardhat节点正在运行: npx hardhat node"
    exit 1
fi
echo ""

# 步骤4: 显示部署信息
echo "📋 步骤4: 部署信息"
if [ -f "deployment-info.json" ]; then
    echo "合约地址: $(cat deployment-info.json | grep contractAddress | cut -d'"' -f4)"
    echo "部署账户: $(cat deployment-info.json | grep deployer | cut -d'"' -f4)"
    echo ""
fi

# 步骤5: 启动HTTP服务器
echo "🌐 步骤5: 启动前端服务器..."
echo ""
echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo ""
echo "📍 新合约地址已生成，不会触发MetaMask警告！"
echo ""
echo "下一步操作："
echo "1. 在浏览器中打开: http://localhost:8000/voting.html"
echo "2. 连接MetaMask到 Localhost 8545"
echo "3. 导入测试账户（可选）:"
echo "   私钥: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo "4. 开始创建投票 - 无警告！🎉"
echo ""
echo "详细配置说明请查看: METAMASK_NEW_ADDRESS_SOLUTION.md"
echo ""
echo "现在启动HTTP服务器..."
echo "按 Ctrl+C 停止服务器"
echo ""

cd frontend
python3 -m http.server 8000
