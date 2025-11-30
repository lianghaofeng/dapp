# 🦊 解决MetaMask地址警告 - 快速指南

## 问题
MetaMask阻止了与合约地址 `0x5FbDB2315678afecb367f032d93F642f64180aa3` 的交易，说这个地址有安全风险。

## 原因
这是Hardhat的默认部署地址，钓鱼网站经常用它骗人，所以MetaMask默认阻止。但在本地开发时是安全的。

## ✅ 最佳解决方案：生成新地址

我已经为你创建了工具，可以用不同的账户部署合约，生成一个**新的地址**，MetaMask就不会警告了！

---

## 🚀 快速开始（3步搞定）

### 方法1：自动化脚本（推荐）

**终端1 - 启动Hardhat节点**:
```bash
cd /home/user/dapp/minority-game
npx hardhat node
```
保持运行，不要关闭！

**终端2 - 运行自动化脚本**:
```bash
cd /home/user/dapp/minority-game
./start-with-new-address.sh
```

脚本会自动：
- ✅ 编译合约
- ✅ 部署到新地址
- ✅ 更新前端配置
- ✅ 启动HTTP服务器

**浏览器**: 打开 `http://localhost:8000/voting.html`

### 方法2：手动部署

**终端1 - 启动节点**:
```bash
cd /home/user/dapp/minority-game
npx hardhat node
```

**终端2 - 部署合约**:
```bash
cd /home/user/dapp/minority-game
npx hardhat run scripts/deploy-alt-address.js --network localhost
```

**终端3 - 启动前端**:
```bash
cd /home/user/dapp/minority-game/frontend
python3 -m http.server 8000
```

---

## 🦊 配置MetaMask

### 1. 添加本地网络

在MetaMask中添加网络：
- **网络名称**: Localhost 8545
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `1337`
- **货币符号**: ETH

### 2. 导入测试账户（推荐）

在MetaMask中导入账户：
- **私钥**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **余额**: 10000 ETH（测试用）

这是Hardhat的公开测试密钥，只能用于本地开发！

### 3. 切换网络

在MetaMask中选择 "Localhost 8545" 网络

---

## ✅ 验证成功

如果一切正常，你应该看到：
- ✅ 新的合约地址（不是 `0x5FbDB...`）
- ✅ 创建投票时，MetaMask **无警告**弹出
- ✅ 交易成功确认

---

## 🔑 常用测试账户

所有账户都有10000 ETH，仅用于本地测试：

```
账户 #0（默认）:
地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

账户 #1（部署账户，推荐导入）:
地址: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
私钥: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

账户 #2:
地址: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
私钥: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

---

## 💡 工作原理

**为什么换个账户部署就能避开警告？**

合约地址 = hash(部署者地址 + 交易次数)

- 账户#0部署 → `0x5FbDB...` ← MetaMask警告❌
- 账户#1部署 → `0xe7f1...` ← MetaMask通过✅

---

## 🛠️ 常见问题

### Q: 脚本执行后还是警告？
A: 检查 `frontend/voting.js` 的 `CONTRACT_ADDRESS` 是否更新为新地址

### Q: "Cannot connect to network"
A: 确保 `npx hardhat node` 在运行

### Q: "Nonce too high"
A: MetaMask → Settings → Advanced → Clear activity tab data

### Q: 能用原来的地址吗？
A: 不推荐。某些MetaMask版本无法绕过警告。

---

## 📚 详细文档

更多信息请查看：
- `METAMASK_NEW_ADDRESS_SOLUTION.md` - 完整指南
- `METAMASK_TRUST_ADDRESS.md` - 为什么会警告
- `TROUBLESHOOTING.md` - 故障排查

---

## ⚠️ 重要提醒

1. **测试密钥是公开的！**
   - 只能在本地使用
   - 绝对不要在真实网络使用
   - 绝对不要向这些地址发送真实ETH

2. **每次重启Hardhat节点**
   - 数据会重置
   - 需要重新部署合约

3. **正式部署到BSC测试网/主网**
   - 使用你自己的私钥
   - 参考 `DEPLOY_WITH_REMIX.md`

---

## 🎉 大功告成！

现在你可以：
- ✅ 无警告创建投票
- ✅ 正常提交和揭示
- ✅ 领取奖励

享受开发吧！🚀
