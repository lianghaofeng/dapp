# 🎯 使用 Remix 部署合约（网络问题时的替代方案）

由于 Hardhat 无法下载编译器，可以使用 Remix IDE 部署合约。

## 📋 步骤

### 1. 打开 Remix IDE
访问：https://remix.ethereum.org

### 2. 创建合约文件
1. 在 Remix 左侧点击 "File Explorer"
2. 创建新文件：`VotingGame.sol`
3. 复制合约代码（从 `/home/user/dapp/minority-game/contracts/VotingGame.sol`）

### 3. 编译合约
1. 点击左侧 "Solidity Compiler" 图标
2. 选择编译器版本：`0.8.20` 或更高
3. 勾选 "Enable optimization" (Runs: 200)
4. 点击 "Compile VotingGame.sol"

### 4. 部署合约

#### 选项A：部署到本地 Hardhat 网络

**准备工作：**
```bash
# 在终端1：启动 Hardhat 节点
cd /home/user/dapp/minority-game
npx hardhat node
```

**在 Remix 中：**
1. 点击左侧 "Deploy & Run Transactions" 图标
2. Environment 选择：`External Http Provider`
3. URL 输入：`http://127.0.0.1:8545`
4. 点击 "Deploy"
5. **复制部署后的合约地址**（以 0x 开头）

#### 选项B：部署到 BSC 测试网

**在 MetaMask 中：**
1. 添加 BSC 测试网络
   - RPC: https://data-seed-prebsc-1-s1.binance.org:8545
   - 链ID: 97
2. 获取测试 BNB：https://testnet.bnbchain.org/faucet-smart

**在 Remix 中：**
1. Environment 选择：`Injected Provider - MetaMask`
2. 确保 MetaMask 连接到 BSC Testnet
3. 点击 "Deploy"
4. 在 MetaMask 中确认交易
5. **复制部署后的合约地址**

### 5. 更新前端配置

编辑 `/home/user/dapp/minority-game/frontend/voting.js`：

```javascript
// 第1行：替换为你的合约地址
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
```

例如：
```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

### 6. 启动前端服务器

```bash
cd /home/user/dapp/minority-game/frontend
python3 -m http.server 8000
```

### 7. 配置 MetaMask

#### 如果部署到本地网络：
- Network: Localhost 8545
- RPC: http://127.0.0.1:8545
- 链ID: 31337
- 货币: ETH

**导入测试账户：**
私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

#### 如果部署到 BSC 测试网：
- Network: BSC Testnet
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545
- 链ID: 97
- 货币: BNB

### 8. 打开前端

访问：http://localhost:8000/voting.html

## ✅ 验证部署成功

1. 打开前端页面
2. 点击 "CONNECT WALLET"
3. 连接 MetaMask
4. 如果能看到 "CONNECTED" 状态，说明配置正确
5. 尝试创建一个投票

## 🐛 常见问题

### Q: "could not decode result data"
**A:** CONTRACT_ADDRESS 没有更新或地址错误

### Q: MetaMask 显示 "This is a deceptive request"
**A:** CONTRACT_ADDRESS 指向的不是合约地址，检查配置

### Q: 创建投票时 "Internal JSON-RPC error"
**A:**
1. 检查 MetaMask 连接的网络是否与合约部署网络一致
2. 检查账户是否有足够的 ETH/BNB

### Q: Hardhat 节点启动失败
**A:** 端口被占用，先执行：
```bash
lsof -ti:8545 | xargs kill
```

## 📊 快速参考

### 合约信息
- 名称：VotingGame
- 编译器：0.8.20
- Optimization: Enabled (200 runs)

### 网络配置

| 网络 | RPC | 链ID | 货币 |
|------|-----|------|------|
| Hardhat Local | http://127.0.0.1:8545 | 31337 | ETH |
| BSC Testnet | https://data-seed-prebsc-1-s1.binance.org:8545 | 97 | BNB |

### 测试账户（仅本地）
```
地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
余额: 10000 ETH
```

## 🎉 完成！

部署成功后你可以：
- ✅ 创建投票（设置问题和选项）
- ✅ 提交commit（隐藏投票）
- ✅ Reveal（公开选择）
- ✅ 查看结果和领取奖励

---

**提示：** 如果网络恢复，可以使用自动脚本：
```bash
./start-local.sh
```
