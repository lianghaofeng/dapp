# 🔧 故障排查指南

## 你遇到的问题已解决！

### ✅ 问题1: 测试失败（已修复）

**症状：**
```
14 passing (408ms)
5 failing

Error: VM Exception while processing transaction: reverted with reason string 'Not in commit phase'
```

**原因：**
- 测试辅助函数 `commitAndReveal` 的逻辑有bug
- 第一个玩家调用时会立即切换到reveal阶段
- 导致第二、第三个玩家无法commit

**解决方案：**
已重构测试为两阶段模式：
```javascript
// 旧方式（有bug）
await commitAndReveal(player1, 0, ethers.parseEther("1.0"));
await commitAndReveal(player2, 1, ethers.parseEther("2.0"));
await commitAndReveal(player3, 1, ethers.parseEther("3.0"));

// 新方式（正确）
await doCommit(player1, 0, ethers.parseEther("1.0"));
await doCommit(player2, 1, ethers.parseEther("2.0"));
await doCommit(player3, 1, ethers.parseEther("3.0"));
await doRevealAll(); // 统一切换阶段并reveal
```

**测试结果：**
```bash
npx hardhat test
```
预期输出：**18 passing** ✅

---

### ✅ 问题2: 前端创建投票失败（需要配置）

**症状：**
```
创建失败: could not coalesce error (error={ "code": -32603, "message": "Internal JSON-RPC error." }
```

**原因：**
前端合约地址未配置或配置错误

**解决方案：**

#### 方法A：使用一键启动脚本（推荐）

```bash
cd minority-game
./start-local.sh
```

脚本会自动：
1. 编译合约
2. 启动Hardhat节点
3. 部署合约
4. **自动配置前端合约地址** ✅
5. 启动HTTP服务器

然后访问：http://localhost:8000/voting.html

#### 方法B：手动配置

1. **部署合约**：
```bash
# 终端1: 启动节点
npx hardhat node

# 终端2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

2. **复制合约地址**：
```
VotingGame deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

3. **配置前端**：
编辑 `frontend/voting.js` 第2行：
```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 粘贴你的地址
```

4. **启动前端**：
```bash
cd frontend
python3 -m http.server 8000
```

5. **访问**：http://localhost:8000/voting.html

---

## 📋 完整检查清单

### 运行测试

- [ ] 拉取最新代码：`git pull`
- [ ] 编译合约：`npx hardhat compile`
- [ ] 运行测试：`npx hardhat test`
- [ ] 确认输出：`18 passing` ✅

### 运行前端

- [ ] 确认MetaMask已安装
- [ ] 启动Hardhat节点（或使用start-local.sh）
- [ ] 部署合约
- [ ] 配置前端合约地址
- [ ] 启动HTTP服务器
- [ ] 在MetaMask中添加Hardhat网络
- [ ] 在MetaMask中导入测试账户
- [ ] 访问 http://localhost:8000/voting.html
- [ ] 点击"连接钱包"
- [ ] 测试创建投票

---

## 🐛 常见错误

### 错误1: "Please install MetaMask"

**解决：** 安装MetaMask浏览器插件
- Chrome/Brave: https://metamask.io/download/
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/

### 错误2: "Network mismatch"

**解决：** 在MetaMask中切换到正确的网络
- 本地开发：Hardhat Local (链ID: 31337)
- BSC测试网：BSC Testnet (链ID: 97)

### 错误3: "Insufficient funds"

**解决：**
- **本地开发**：使用测试账户（有10000 ETH）
  ```
  私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  ```
- **BSC测试网**：从水龙头获取tBNB
  - https://testnet.binance.org/faucet-smart

### 错误4: "Contract not deployed"

**解决：**
1. 确认Hardhat节点正在运行
2. 重新部署合约
3. 更新前端的合约地址

### 错误5: "Transaction reverted"

**可能原因：**
- 在错误的阶段调用函数（例如在commit阶段reveal）
- 重复commit
- 已经领取过奖励
- 不是获胜者

**解决：** 查看浏览器控制台（F12）的详细错误信息

---

## 🔍 调试技巧

### 1. 查看浏览器控制台

按F12打开开发者工具，查看Console标签：
- 红色错误信息会显示具体问题
- 网络请求失败会显示在Network标签

### 2. 查看MetaMask活动日志

MetaMask → 活动 → 查看失败的交易详情

### 3. 查看Hardhat节点日志

如果使用 `start-local.sh`，查看 `hardhat-node.log`：
```bash
tail -f hardhat-node.log
```

### 4. 测试合约调用

在浏览器控制台测试：
```javascript
// 测试连接
await contract.voteCounter()

// 测试创建投票
await contract.createVote("测试", ["A", "B"])
```

---

## 📞 还有问题？

### 检查版本

```bash
node --version  # 应该 >= 18
npm --version
npx hardhat --version
```

### 清理并重新开始

```bash
# 停止所有服务
./stop-local.sh

# 清理
rm -rf artifacts cache node_modules
npm install

# 重新启动
./start-local.sh
```

### 查看文档

- **[快速开始](QUICK_START.md)** - 30秒启动
- **[前端指南](FRONTEND_GUIDE.md)** - 详细配置
- **[测试指南](TESTING_GUIDE.md)** - 运行测试
- **[README](README.md)** - 项目总览

### 报告Bug

如果问题仍然存在，请在GitHub上提交Issue，包含：
1. 错误信息截图
2. 浏览器控制台日志
3. 使用的操作系统和浏览器
4. 执行的步骤

---

**现在你可以在Mac上运行测试和前端了！** 🎉
