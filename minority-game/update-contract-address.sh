#!/bin/bash
echo "请输入你在 Remix 部署的合约地址（以 0x 开头）："
read CONTRACT_ADDR

if [[ ! $CONTRACT_ADDR =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ 地址格式错误，应该是 42 个字符，以 0x 开头"
    exit 1
fi

cd /home/user/dapp/minority-game
sed -i "s/const CONTRACT_ADDRESS = .*/const CONTRACT_ADDRESS = \"$CONTRACT_ADDR\";/" frontend/voting.js

echo "✅ 前端配置已更新"
echo "📋 合约地址: $CONTRACT_ADDR"
echo ""
echo "🚀 现在启动前端服务器："
echo "   cd /home/user/dapp/minority-game/frontend"
echo "   python3 -m http.server 8000"
echo ""
echo "然后访问: http://localhost:8000/voting.html"
