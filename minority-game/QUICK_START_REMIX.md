# 🚀 快速启动指南（Remix 部署）

由于网络问题无法自动部署，请按照以下3步骤手动部署：

## 📋 步骤总览

1. ✅ 在 Remix 部署合约（5分钟）
2. ✅ 更新前端配置（30秒）
3. ✅ 启动前端服务器（10秒）

---

## 步骤1：在 Remix 部署合约

### 1.1 打开 Remix
访问：**https://remix.ethereum.org**

### 1.2 创建合约文件
1. 左侧点击 "📁 File Explorer"
2. 点击 "➕" 创建新文件
3. 文件名：`VotingGame.sol`
4. 复制合约代码到文件中

**获取合约代码：**
```bash
cat /home/user/dapp/minority-game/contracts/VotingGame.sol
```

### 1.3 编译合约
1. 左侧点击 "🔧 Solidity Compiler"
2. **Compiler:** `0.8.20`
3. ✅ **Enable optimization:** 勾选，Runs: `200`
4. 点击 **"Compile VotingGame.sol"**
5. 等待绿色✅

### 1.4 获取测试 BNB
1. 在 MetaMask 添加 BSC 测试网：
   - RPC: `https://data-seed-prebsc-1-s1.binance.org:8545`
   - Chain ID: `97`

2. 获取测试币：https://testnet.bnbchain.org/faucet-smart

### 1.5 部署
1. 左侧点击 "🚀 Deploy & Run Transactions"
2. **Environment:** `Injected Provider - MetaMask`
3. MetaMask 选择 **BSC Testnet**
4. 点击 **Deploy**
5. MetaMask 确认交易
6. **复制合约地址**（0x开头的42字符）

---

## 步骤2：更新前端配置

### 自动脚本（推荐）
```bash
cd /home/user/dapp/minority-game
./update-contract-address.sh
```
粘贴你的合约地址即可。

### 手动更新
编辑 `frontend/voting.js` 第1行：
```javascript
const CONTRACT_ADDRESS = "0x你的合约地址";
```

---

## 步骤3：启动前端

```bash
cd /home/user/dapp/minority-game/frontend
python3 -m http.server 8000
```

打开浏览器：**http://localhost:8000/voting.html**

---

## ✅ 测试

1. **连接钱包**
   - 确保 MetaMask 在 **BSC Testnet**
   - 点击 **CONNECT WALLET**

2. **创建投票**
   - 点击 **CREATE NEW**
   - 问题：`Test Vote`
   - 选项：`A`, `B`
   - 点击 **CREATE VOTE**
   - MetaMask 确认

3. **成功标志**
   - 显示 "✅ 投票创建成功!"
   - 在 **ACTIVE VOTES** 能看到新投票

---

## 🐛 常见问题

### "could not decode result data"
→ CONTRACT_ADDRESS 未更新，重新运行 `./update-contract-address.sh`

### "This is a deceptive request"
→ 合约地址错误，检查是否复制正确

### "Internal JSON-RPC error"
→ MetaMask 网络错误，切换到 **BSC Testnet**

---

## 📊 网络配置

### BSC 测试网
```
RPC: https://data-seed-prebsc-1-s1.binance.org:8545
Chain ID: 97
Symbol: BNB
浏览器: https://testnet.bscscan.com
```

---

## 🎉 完成！

现在可以：
- ✅ 创建自定义投票
- ✅ 设置自定义时间（或用默认的1小时+30分钟）
- ✅ 参与投票并获奖

**更多文档：**
- `DEPLOY_WITH_REMIX.md` - 详细部署指南
- `CUSTOM_TIME_FEATURE.md` - 自定义时间功能
- `TROUBLESHOOTING_CONTRACT_ERROR.md` - 故障排除
