#!/bin/bash

echo "🔧 修复前端合约地址"
echo "===================="
echo ""

# 检查deployment-info.json
if [ ! -f "deployment-info.json" ]; then
    echo "❌ 未找到 deployment-info.json"
    echo "   请先部署合约:"
    echo "   npx hardhat run scripts/deploy-alt-address.js --network localhost"
    exit 1
fi

# 获取新地址
NEW_ADDR=$(cat deployment-info.json | grep contractAddress | cut -d'"' -f4)
echo "📍 从deployment-info.json读取的地址: $NEW_ADDR"
echo ""

# 检查当前前端地址
CURRENT_ADDR=$(grep "const CONTRACT_ADDRESS" frontend/voting.js | head -1 | sed 's/.*"\(0x[^"]*\)".*/\1/')
echo "📍 当前frontend/voting.js的地址: $CURRENT_ADDR"
echo ""

if [ "$NEW_ADDR" = "$CURRENT_ADDR" ]; then
    echo "✅ 地址已经是最新的，无需更新"
    exit 0
fi

# 更新地址
echo "🔄 正在更新前端配置..."
sed -i "s/const CONTRACT_ADDRESS = \"0x[a-fA-F0-9]*\"/const CONTRACT_ADDRESS = \"$NEW_ADDR\"/" frontend/voting.js

# 验证更新
UPDATED_ADDR=$(grep "const CONTRACT_ADDRESS" frontend/voting.js | head -1 | sed 's/.*"\(0x[^"]*\)".*/\1/')

if [ "$UPDATED_ADDR" = "$NEW_ADDR" ]; then
    echo "✅ 更新成功!"
    echo ""
    echo "新地址: $NEW_ADDR"
    echo ""
    echo "下一步:"
    echo "1. 刷新浏览器页面（Ctrl+Shift+R 强制刷新）"
    echo "2. 重新连接MetaMask"
    echo "3. 现在应该没有警告了！"
else
    echo "❌ 更新失败"
    echo "请手动编辑 frontend/voting.js"
    echo "将 CONTRACT_ADDRESS 改为: $NEW_ADDR"
fi
